// End-to-end: ffmpeg consumes the generated .cube and must reproduce the library.
//
// The strongest format test possible — a real LUT host (ffmpeg's lut3d/lut1d,
// the same parser family OBS uses) applies the file to a float frame, and the
// result is compared against the direct scalar conversion. A wrong keyword, a
// wrong data ordering (red must vary fastest), or a broken line format shows up
// as grossly wrong colors, not a subtle drift. Skips cleanly when ffmpeg is not
// installed (CI without ffmpeg stays green; run locally / where ffmpeg exists).
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import space from '../index.js'
import { cube } from '../lut.js'

const probe = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' })
if (probe.error || probe.status !== 0) {
	console.log('lut-ffmpeg: ffmpeg not found — skipping the end-to-end LUT host test')
	process.exit(0)
}

const test = (await import('tst')).default
const { is } = await import('tst')

const W = 64, H = 64, N = W * H
const rnd = (s) => () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296 }

// deterministic float frame in gbrpf32le (planar G, B, R float32 LE)
const r = rnd(0xc0ffee)
const px = Array.from({ length: N }, () => [r(), r(), r()])
const plane = (c) => { const p = new Float32Array(N); for (let i = 0; i < N; i++) p[i] = px[i][c]; return p }
const raw = Buffer.concat([plane(1), plane(2), plane(0)].map((p) => Buffer.from(p.buffer)))

const dir = mkdtempSync(join(tmpdir(), 'color-space-lut-'))
const inRaw = join(dir, 'in.raw')
writeFileSync(inRaw, raw)

function run(filter, lutFile, text) {
	const lutPath = join(dir, lutFile)
	writeFileSync(lutPath, text)
	const outRaw = join(dir, 'out-' + lutFile + '.raw')
	const res = spawnSync('ffmpeg', [
		'-y', '-loglevel', 'error',
		'-f', 'rawvideo', '-pix_fmt', 'gbrpf32le', '-s', `${W}x${H}`, '-i', inRaw,
		'-vf', `${filter}=${lutPath}`,
		'-f', 'rawvideo', '-pix_fmt', 'gbrpf32le', outRaw,
	], { encoding: 'utf8' })
	if (res.status !== 0) throw new Error(`ffmpeg failed: ${res.stderr}`)
	const buf = readFileSync(outRaw)
	const f32 = new Float32Array(buf.buffer, buf.byteOffset, N * 3)
	// planes back to interleaved [r,g,b]
	return (i) => [f32[2 * N + i], f32[i], f32[N + i]]
}

test('lut+ffmpeg: 3D .cube (rgb→p3) — ffmpeg output matches the direct conversion', () => {
	const out = run('lut3d', 'rgb-p3.cube', cube(space.rgb, space.p3, { size: 33 }))
	let max = 0
	for (let i = 0; i < N; i++) {
		const direct = space.rgb.p3(px[i][0] * 255, px[i][1] * 255, px[i][2] * 255)
		const got = out(i)
		for (let c = 0; c < 3; c++) max = Math.max(max, Math.abs(direct[c] - got[c]))
	}
	// bound = 33³ lattice error (~9e-4 measured) + tetrahedral-vs-trilinear + float32
	is(max < 5e-3, true, `max |ffmpeg−direct| = ${max.toExponential(2)} < 5e-3`)
})

test('lut+ffmpeg: 1D .cube (rec709→rgb) — ffmpeg output matches the direct conversion', () => {
	const out = run('lut1d', 'rec709-rgb.cube', cube(space.rec709, space.rgb))
	let max = 0
	for (let i = 0; i < N; i++) {
		const direct = space.rec709.rgb(...px[i])
		const got = out(i)
		for (let c = 0; c < 3; c++) max = Math.max(max, Math.abs(direct[c] / 255 - got[c]))
	}
	is(max < 1e-3, true, `max |ffmpeg−direct| = ${max.toExponential(2)} < 1e-3 (of full scale)`)
})

test('lut+ffmpeg: ordering is truly red-fastest — a scrambled lattice would not pass', () => {
	// slog3→rec709 is strongly channel-asymmetric; if b were fastest instead of r,
	// errors would be O(1). Bound: measured 33³ in-range max ~7e-2 + tetrahedral margin.
	const out = run('lut3d', 'slog3-rec709.cube', cube(space.slog3, space.rec709, { size: 33 }))
	let max = 0, n = 0
	for (let i = 0; i < N; i++) {
		const direct = space.slog3.rec709(...px[i])
		if (!direct.every((v) => v >= 0 && v <= 1)) continue // compare the displayable set
		const got = out(i); n++
		for (let c = 0; c < 3; c++) max = Math.max(max, Math.abs(direct[c] - got[c]))
	}
	is(n > 50, true, `${n} in-range samples`)
	is(max < 1.2e-1, true, `max |ffmpeg−direct| = ${max.toExponential(2)} < 1.2e-1 in-range`)
})

process.on('exit', () => rmSync(dir, { recursive: true, force: true }))
