// HLSL + MSL tier 1: every source test/wgsl.js parses goes WGSL → naga → HLSL and MSL.
// naga's backends are compiled with DXC/FXC and xcrun metal upstream; here we hold the
// translation to its contract (it runs, names survive, no construct whose semantics
// diverge from GLSL), pin two outputs, and prove the package still loads without the
// optional naga-wasm peer. Compiler acceptance is .github/workflows/shaders.yml (tier 3).
import test, { is, ok } from 'tst'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { glsl, graph } from '../gl/index.js'
import { translate } from '../gl/translate.js'
import util from '../gl/util.js'
import { NAGA_WASM, emit, load } from '../gl/naga.js'
import hlsl from '../gl/hlsl.js'
import msl from '../gl/msl.js'

const pairs = [], seen = new Set()
const add = (a, b) => {
	const key = `${a} ${b}`
	if (seen.has(key)) return
	seen.add(key)
	try { pairs.push([a, b, glsl(a, b)]) } catch {}
}
for (const a in graph) for (const b in graph[a]) add(a, b)
for (const name in graph) if (name !== 'rgb') { add('rgb', name); add(name, 'rgb') }

const san = (s) => s.replace(/-/g, '')
// constructs whose meaning differs from the GLSL the chunks are verified as: float % / fmod
// truncate where GLSL mod floors; mul()/matrix types bring layout and multiply order
const LINT = { fmod: /\bfmod\b/, '%': /%/, 'mul()': /\bmul\s*\(/, matrix: /\b(?:metal::)?(?:float|half|double)[234]x[234]\b/, 'int div/mod helper': /\bnaga_(?:div|mod)\b/ }
const bare = util.filter((u) => u.name.endsWith('_')).map((u) => u.name)   // cbrt_ spow_ atan2_ mod_

test('hlsl/msl: every WGSL source translates through naga with its names intact', async () => {
	const naga = await load(), fails = []
	for (const [from, to, src] of pairs) {
		// every function whose naga name (trailing _ stripped) ends in a digit, which naga suffixes with _
		const entry = `${san(from)}_${san(to)}`, digitFns = [...translate(src).matchAll(/\bfn\s+(\w+)\s*\(/g)].map((m) => m[1].replace(/_+$/, '')).filter((n) => /\d$/.test(n))
		for (const target of ['hlsl', 'msl']) {
			let out
			try { out = emit(naga, target, src) } catch (e) { fails.push(`${target} ${from}→${to}: ${e.formatted ?? e.message}`); continue }
			const at = `${target} ${from}→${to}`
			if (!new RegExp(`^\\S.*\\b${entry}\\(`, 'm').test(out)) fails.push(`${at}: entry ${entry} not defined`)
			for (const fn of digitFns) if (new RegExp(`\\b${fn}_\\b`).test(out)) fails.push(`${at}: ${fn} left as ${fn}_`)
			for (const [rule, re] of Object.entries(LINT)) if (re.test(out)) fails.push(`${at}: contains ${rule}`)
			for (const h of bare) {
				if (new RegExp(`^\\S.*\\b${h.replace(/_$/, '')}_?\\(`, 'm').test(out)) fails.push(`${at}: helper ${h} defined under its bare name`)
				if (new RegExp(`\\b${h}\\s*\\(`).test(src) && !new RegExp(`^\\S.*\\bcolorspace_${h.replace(/_$/, '')}\\(`, 'm').test(out)) fails.push(`${at}: colorspace_${h.replace(/_$/, '')} missing`)
			}
		}
	}
	is(fails, [], fails.slice(0, 8).join('\n'))
	ok(pairs.length >= 610, `all ${pairs.length} sources × HLSL + MSL (test/wgsl.js pins the count)`)
}, { timeout: 60000 })

test('hlsl/msl: the LUT space keeps its texture (HLSL register, MSL entry parameter)', async () => {
	const h = await hlsl('rgb', 'munsell'), m = await msl('rgb', 'munsell')
	ok(h.includes('Texture2D<float4> munsell_ren_tex : register(t0);'), 'HLSL declares the renotation texture at t0')
	ok(/metal::float3 rgb_munsell\(\s*metal::float3 \w+,\s*metal::texture2d<float, metal::access::sample> munsell_ren_tex\s*\)/.test(m), 'MSL entry takes the texture as its second parameter')
})

test('hlsl/msl: a pair list is one source, each function once', async () => {
	for (const out of [await hlsl([['oklch', 'rgb'], ['rgb', 'xyz']]), await msl([['oklch', 'rgb'], ['rgb', 'xyz']])]) {
		ok(/^\S.*\boklch_rgb\(/m.test(out) && /^\S.*\brgb_xyz\(/m.test(out), 'both entries')
		is(out.match(/^\S.*\brgb_lrgb\(/gm)?.length, 1, 'shared rgb_lrgb emitted once')
	}
})

// a changed hash means naga or a chunk on that path changed: read the new output
// (node -e "import('./gl/hlsl.js').then(async m => console.log(await m.hlsl('rgb', 'oklch')))"),
// confirm it is only that change, then update the hash
test('hlsl/msl: snapshots (naga-wasm pinned)', async () => {
	const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16)
	is(sha(await hlsl('rgb', 'oklch')), '4196bb0a5022fde4', 'rgb→oklch HLSL')
	is(sha(await msl('rgb', 'oklch')), '7da6acc6927cd2b9', 'rgb→oklch MSL')
	is(sha(await hlsl('slog3', 'rec709')), 'ea333b675d81ac3f', 'slog3→rec709 HLSL')
	is(sha(await msl('slog3', 'rec709')), '9d74f5db5678fb54', 'slog3→rec709 MSL')
})

test('hlsl/msl: emit rejects other targets', async () => {
	const naga = await load()
	let msg = ''
	try { emit(naga, 'glsl', glsl('rgb', 'oklch')) } catch (e) { msg = e.message }
	ok(/'hlsl' or 'msl'/.test(msg), msg)
})

test('hlsl/msl: one naga-wasm version everywhere (code, devDependency, peer, site copy)', async () => {
	const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)))
	is(pkg.devDependencies['naga-wasm'], NAGA_WASM, 'devDependency pinned exactly to NAGA_WASM')
	is(pkg.peerDependencies?.['naga-wasm'], `^${NAGA_WASM}`, 'peer range starts at the tested version')
	is(pkg.peerDependenciesMeta?.['naga-wasm']?.optional, true, 'peer is optional — a plain install adds nothing')
	ok(!pkg.dependencies && !pkg.optionalDependencies, 'zero install dependencies')
	const mod = new URL('../node_modules/naga-wasm/', import.meta.url), site = new URL('../web/vendor/naga-wasm/', import.meta.url)
	is(JSON.parse(readFileSync(new URL('package.json', mod))).version, NAGA_WASM, 'installed naga-wasm is the pinned one')
	for (const [mine, theirs] of [['index.js', 'dist/index.js'], ['version.js', 'dist/version.js'], ['wasm/naga.js', 'dist/wasm/naga.js'], ['wasm/naga_bg.wasm', 'dist/wasm/naga_bg.wasm'], ['package.json', 'package.json'], ['LICENSE-MIT', 'LICENSE-MIT'], ['LICENSE-APACHE', 'LICENSE-APACHE']])
		ok(readFileSync(new URL(mine, site)).equals(readFileSync(new URL(theirs, mod))), `web/vendor/naga-wasm/${mine} is byte-identical to the pinned package`)
	// the site's route: the vendored browser build, initialized with explicit bytes
	const vendored = await import(new URL('index.js', site))
	await vendored.init({ module_or_path: readFileSync(new URL('wasm/naga_bg.wasm', site)) })
	is(emit(vendored, 'msl', glsl('rgb', 'oklch')), await msl('rgb', 'oklch'), 'vendored copy writes the same MSL')
})

test('hlsl/msl: without naga-wasm the package imports, and the call says how to fix it', () => {
	const hook = `export async function resolve(s, c, next) { if (s === 'naga-wasm') { const e = new Error("Cannot find package 'naga-wasm'"); e.code = 'ERR_MODULE_NOT_FOUND'; throw e } return next(s, c) }`
	const reg = `import { register } from 'node:module'; register('data:text/javascript,' + encodeURIComponent(${JSON.stringify(hook)}))`
	const run = `import { hlsl } from ${JSON.stringify(new URL('../gl/hlsl.js', import.meta.url).href)}; console.log('imported'); try { await hlsl('rgb', 'oklch'); console.log('loaded') } catch (e) { console.log(e.message) }`
	const r = spawnSync(process.execPath, ['--import', `data:text/javascript,${encodeURIComponent(reg)}`, '--input-type=module', '-e', run], { encoding: 'utf8' })
	const [imported, msg = ''] = r.stdout.trim().split('\n')
	is(imported, 'imported', `module loads without the peer ${r.stderr}`)
	ok(msg.includes(`npm i naga-wasm@${NAGA_WASM}`), `actionable error: ${msg}`)
})
