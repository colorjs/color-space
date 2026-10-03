// Tier 3 for color-space/gl/hlsl and /msl — the vendor compilers, not npm test (it needs
// Windows or macOS): every source test/hlsl.js translates, wrapped in a one-thread compute
// entry that calls the conversion, compiled with the same tools upstream naga validates
// with (gfx-rs/wgpu .github/workflows/shaders.yml, naga/xtask/src/validate.rs):
//   hlsl — DXC cs_6_0 as HLSL 2018 and 2021, FXC cs_5_0 (dxc / fxc on PATH, or DXC / FXC env)
//   msl  — xcrun metal at the std naga's header names, and at the SDK default
// Run by .github/workflows/shaders.yml:  node test/shader-compile.js hlsl|msl [outdir]
// The wrapped sources stay in outdir (default: <tmp>/color-space-shaders/<target>).
import { spawn } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { cpus, tmpdir } from 'node:os'
import { join } from 'node:path'
import { glsl, graph } from '../gl/index.js'
import { emit, load } from '../gl/naga.js'

const target = process.argv[2]
if (target !== 'hlsl' && target !== 'msl') { console.error('usage: node test/shader-compile.js hlsl|msl [outdir]'); process.exit(2) }
const dir = process.argv[3] || join(tmpdir(), 'color-space-shaders', target)
rmSync(dir, { recursive: true, force: true })
mkdirSync(dir, { recursive: true })

// the source set of test/wgsl.js and test/hlsl.js: every edge plus rgb ↔ every space
const pairs = [], seen = new Set()
const add = (a, b) => {
	const key = `${a} ${b}`
	if (seen.has(key)) return
	seen.add(key)
	try { pairs.push([a, b, glsl(a, b)]) } catch {}
}
for (const a in graph) for (const b in graph[a]) add(a, b)
for (const name in graph) if (name !== 'rgb') { add('rgb', name); add(name, 'rgb') }

// the entry takes/returns float…float4; the harness reads and writes one float4 per thread
const dim = (type) => +(type.match(/float(\d)?$/)?.[1] || 1)
const SWZ = { 1: '.x', 2: '.xy', 3: '.xyz', 4: '' }
const widen = (expr, d, f4) => d === 4 ? expr : `${f4}(${expr}${', 0.0'.repeat(4 - d)})`
function wrap(src, entry) {
	if (target === 'hlsl') {   // float3 rgb_oklch(float3 c_5) — one line; a LUT texture is a global
		const m = src.match(new RegExp(`^(\\w+) ${entry}\\((\\w+) \\w+\\)$`, 'm'))
		if (!m) throw new Error(`HLSL entry ${entry}(one float parameter) not found`)
		return `${src}
RWStructuredBuffer<float4> colorspace_io : register(u0);
[numthreads(1, 1, 1)]
void colorspace_main(uint3 id : SV_DispatchThreadID) {
    float4 v = colorspace_io[id.x];
    colorspace_io[id.x] = ${widen(`${entry}(v${SWZ[dim(m[2])]})`, dim(m[1]), 'float4')};
}
`
	}
	// metal::float3 rgb_oklch(\n    metal::float3 c_5\n) { — a LUT texture arrives as further parameters
	const m = src.match(new RegExp(`^(\\S+) ${entry}\\(\\n([\\s\\S]*?)\\n\\) \\{`, 'm'))
	if (!m) throw new Error(`MSL entry ${entry} not found`)
	const types = m[2].split(',\n').map((p) => p.trim().replace(/\s+\w+$/, ''))
	const tex = types.slice(1).map((t, i) => `, ${t} colorspace_t${i} [[texture(${i})]]`).join('')
	const args = [`v${SWZ[dim(types[0])]}`, ...types.slice(1).map((_, i) => `colorspace_t${i}`)].join(', ')
	return `${src}
kernel void colorspace_main(device metal::float4* colorspace_io [[buffer(0)]], uint colorspace_id [[thread_position_in_grid]]${tex}) {
    metal::float4 v = colorspace_io[colorspace_id];
    colorspace_io[colorspace_id] = ${widen(`${entry}(${args})`, dim(m[1]), 'metal::float4')};
}
`
}

const naga = await load(), files = []
for (const [from, to, src] of pairs) {
	const entry = `${from.replace(/-/g, '')}_${to.replace(/-/g, '')}`, file = join(dir, `${entry}.${target === 'hlsl' ? 'hlsl' : 'metal'}`)
	writeFileSync(file, wrap(emit(naga, target, src), entry))
	files.push(file)
}

const dxc = process.env.DXC || 'dxc', fxc = process.env.FXC || 'fxc'
const RUNS = target === 'hlsl' ? [
	['dxc cs_6_0 HLSL 2018', dxc, (f) => [f, '-T', 'cs_6_0', '-E', 'colorspace_main', '-HV', '2018', '-Wno-parentheses-equality']],
	['dxc cs_6_0 HLSL 2021', dxc, (f) => [f, '-T', 'cs_6_0', '-E', 'colorspace_main', '-HV', '2021', '-Wno-parentheses-equality']],
	['fxc cs_5_0', fxc, (f) => [f, '-T', 'cs_5_0', '-E', 'colorspace_main']],
] : [
	// naga's header (// language: metal1.0) → -std=macos-metal1.0, as upstream validate.rs does
	['metal at the header std', 'xcrun', (f, lang) => ['-sdk', 'macosx', 'metal', '-mmacosx-version-min=10.11', `-std=macos-${lang}`, '-Werror=constant-conversion', '-x', 'metal', f, '-o', '/dev/null']],
	['metal at the SDK default std', 'xcrun', (f) => ['-sdk', 'macosx', 'metal', '-Werror=constant-conversion', '-x', 'metal', f, '-o', '/dev/null']],
]
const lang = emit(naga, 'msl', glsl('rgb', 'oklch')).match(/^\/\/ language: (\S+)/)?.[1]

const exec = (bin, args) => new Promise((done) => {
	const p = spawn(bin, args, { stdio: ['ignore', 'ignore', 'pipe'] })
	let err = ''
	p.stderr.on('data', (d) => { err += d })
	p.on('error', (e) => done({ code: -1, err: e.code === 'ENOENT' ? `${bin} not found on PATH` : e.message }))
	p.on('close', (code) => done({ code, err }))
})
for (const [, bin] of new Map(RUNS.map(([name, bin]) => [bin, [name, bin]])).values()) {
	const v = await exec(bin, bin === 'xcrun' ? ['-sdk', 'macosx', 'metal', '--version'] : bin === fxc ? ['/?'] : ['--version'])
	if (v.code === -1) { console.error(v.err); process.exit(1) }
}

const jobs = files.flatMap((f) => RUNS.map(([name, bin, args]) => ({ f, name, bin, args: args(f, lang) })))
const fails = []
let next = 0
const t0 = Date.now()
await Promise.all(Array.from({ length: Math.max(2, cpus().length) }, async () => {
	while (next < jobs.length) {
		const j = jobs[next++], r = await exec(j.bin, j.args)
		if (r.code !== 0) fails.push(`${j.name} ${j.f}:\n${r.err.trim().split('\n').slice(0, 12).join('\n')}`)
	}
}))
console.log(`${target}: ${files.length} sources × ${RUNS.length} compiler runs (${RUNS.map((r) => r[0]).join(' · ')}) in ${Math.round((Date.now() - t0) / 1000)} s — ${fails.length} failed`)
for (const f of fails.slice(0, 20)) console.log(`\n${f}`)
process.exit(fails.length ? 1 : 0)
