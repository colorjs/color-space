// Pin the WASM batch kernel to the scalar library.
//
// The kernel is a graph of primitive edges (wasm/batch.js) composed by a BFS in
// wasm.js; this asserts every reachable space, converted rgb→X through the graph,
// reproduces the scalar API to within last-bit cbrt/pow (+ gamut-bound) divergence —
// so the two backends can never silently drift.
import test, { is } from 'tst'
import wasm, { alloc, convert, convertBatch, spaces } from '../wasm.js'
import space from '../index.js'

const rnd = (s) => () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296 }

for (const to of spaces) {
	if (to === 'rgb') continue
	test(`wasm: rgb→${to} batch matches scalar`, () => {
		const r = rnd(0x51a7ed), n = 4000, src = new Float64Array(n * 3), exp = []
		for (let i = 0; i < n; i++) {
			const R = r() * 255, G = r() * 255, B = r() * 255
			src[3 * i] = R; src[3 * i + 1] = G; src[3 * i + 2] = B
			exp.push(space.rgb[to](R, G, B))
		}
		const dst = new Float64Array(n * 3)
		convertBatch('rgb', to, src, dst, n)
		let maxAbs = 0
		for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) maxAbs = Math.max(maxAbs, Math.abs(exp[i][k] - dst[3 * i + k]))
		is(maxAbs < 1e-3, true, `max |wasm-scalar| = ${maxAbs.toExponential(2)} (< 1e-3)`)
	})
}

// The default export mirrors the scalar library's space.from.to shape over the kernel:
// scalar args → tuple; alloc()'d buffer → in place; other array-likes → converted copy.
test('wasm: default export — scalar, zero-copy and copy-through forms agree', () => {
	const exp = space.rgb.oklch(246, 125, 79)
	const got = wasm.rgb.oklch(246, 125, 79)
	for (let k = 0; k < 3; k++) is(Math.abs(got[k] - exp[k]) < 1e-3, true, `scalar ch${k}: ${got[k]} ≈ ${exp[k]}`)

	const buf = alloc(2)
	buf.set([246, 125, 79, 0, 128, 255])
	is(wasm.rgb.oklch(buf), buf, 'wasm-backed buffer converts in place')
	for (let k = 0; k < 3; k++) is(Math.abs(buf[k] - exp[k]) < 1e-3, true, `in-place ch${k}`)

	const plain = [246, 125, 79]
	const out = wasm.rgb.oklch(plain)
	is(plain[0], 246, 'plain input untouched')
	for (let k = 0; k < 3; k++) is(Math.abs(out[k] - exp[k]) < 1e-3, true, `copy-through ch${k}`)

	// scalar call while a live working buffer is held must not clobber it
	const held = alloc(2)
	held.set([1, 2, 3, 4, 5, 6])
	wasm.rgb.oklch(10, 20, 30)
	is(held[0] === 1 && held[1] === 2 && held[2] === 3, true, 'held buffer survives a scalar call')
})

// Scalar kernels are true WASM multi-value exports — `rgb_lrgb(r, g, b) → (r′, g′, b′)`
// — threaded per edge by wasm.js, while batch loops destructure the *same* kernels
// per pixel. So on every pair the two forms must agree bit-for-bit: this pins the
// multi-value glue (i64exp param boxing, lane unboxing) exhaustively. Accuracy vs
// the scalar JS library is pinned by the rgb→X differential sweep above (the
// backends may route pairs differently — JS has a direct xyz↔oklab edge, wasm goes
// via lrgb — so cross-backend equality only holds from shared anchors).
test('wasm: malformed arity, lengths and counts fail before touching memory', () => {
	const throws = (fn, re, label) => { let msg = ''; try { fn() } catch (e) { msg = e.message } is(re.test(msg), true, `${label}: ${msg}`) }
	throws(() => wasm.rgb.oklch(255, 0), /expects 3 channel values/, 'scalar arity')
	throws(() => wasm.rgb.oklch(new Float64Array([255, 0])), /3·n/, 'typed batch stride')
	throws(() => wasm.rgb.oklch([255, 0, 0, 7]), /3·n/, 'plain batch stride')
	throws(() => alloc(-1), /non-negative integer/, 'negative alloc')
	throws(() => alloc(1.5), /non-negative integer/, 'fractional alloc')
	alloc(1)
	throws(() => convert('rgb', 'oklch', 2), /exceeds the active/, 'convert beyond active buffer')
	throws(() => convert('nope', 'rgb', 1), /unknown space/, 'unknown source')
	throws(() => convertBatch('rgb', 'oklch', [255, 0, 0], new Float64Array(2)), /dst needs at least 3/, 'short destination')
	const plain = [255, 0, 0]
	const out = convertBatch('rgb', 'oklch', plain)
	is(out instanceof Float64Array && out.length === 3, true, 'plain array gets a new Float64Array')
	is(plain, [255, 0, 0], 'plain source stays untouched')
})

test('wasm: scalar form ≡ batch form, bit-for-bit, on every pair', () => {
	const anchors = [[246, 125, 79], [0, 128, 255], [12, 200, 100]]
	let pairs = 0
	for (const from of spaces) {
		const samples = anchors.map((rgb) => from === 'rgb' ? rgb : space.rgb[from](...rgb))
		const src = new Float64Array(samples.flat())
		for (const to of spaces) {
			if (to === from) continue
			const batch = convertBatch(from, to, src, new Float64Array(src.length))
			for (let i = 0; i < samples.length; i++) {
				const got = wasm[from][to](...samples[i])
				for (let k = 0; k < 3; k++)
					if (!Object.is(got[k], batch[3 * i + k]) && !(Number.isNaN(got[k]) && Number.isNaN(batch[3 * i + k])))
						is(got[k], batch[3 * i + k], `${from}→${to} px${i} ch${k}`)
			}
			pairs++
		}
	}
	is(pairs, spaces.length * (spaces.length - 1), `all ${pairs} pairs swept`)
})
