// Pin the WASM batch kernel to the scalar library.
//
// The kernel is a graph of primitive edges (wasm/batch.js) composed by a BFS in
// wasm.js; this asserts every reachable space, converted rgb→X through the graph,
// reproduces the scalar API to within last-bit cbrt/pow (+ gamut-bound) divergence —
// so the two backends can never silently drift.
import test, { is } from 'tst'
import wasm, { alloc, convert, convertBatch, spaces } from '../wasm.js'
import b64 from '../wasm/binary.js'
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

// Every space from its own side and at its edges, against the scalar library. Same 1e-3 as
// above, scaled by magnitude past 1 (out-of-gamut and log-decoded values run far past unit:
// ACEScc decodes to 65504). NaN must meet NaN. Hue is compared on its circle and skipped
// where chroma vanishes – it is undefined there, so either backend's float noise may pick it.
const near = (w, s) => Number.isNaN(s) ? Number.isNaN(w) : Math.abs(w - s) <= 1e-3 * Math.max(1, Math.abs(s))
const C1 = (v) => v[1], C2 = (v) => v[2]
const HUE = { // space: [hue channel, period, chroma of a value]
	hsl: [0, 360, C1], hsv: [0, 360, C1], hwb: [0, 360, (v) => 100 - v[1] - v[2]], hsluv: [0, 360, C1], hpluv: [0, 360, C1],
	hct: [0, 360, C1], munsell: [0, 100, C2], cam16: [2, 360, C1],
	oklch: [2, 360, C1], oklrch: [2, 360, C1], lchab: [2, 360, C1], 'lch-d65': [2, 360, C1], 'din99o-lch': [2, 360, C1],
	lchuv: [2, 360, C1], jzczhz: [2, 360, C1],
}
const sameColor = (to, w, s) => {
	const [hk, period, chroma] = HUE[to] || []
	for (let k = 0; k < 3; k++) {
		if (k === hk) {
			if (Math.abs(chroma(s)) < 1e-4 || Number.isNaN(s[k]) && Number.isNaN(w[k])) continue
			const d = Math.abs(w[k] - s[k]) % period
			if (!(Math.min(d, period - d) <= 1e-3 * Math.max(1, Math.abs(s[k])))) return false
		} else if (!near(w[k], s[k])) return false
	}
	return true
}
// a 7³ grid over each channel's documented range, stretched 25% past both bounds
const grid = (name) => {
	const ax = space[name].range.map(([lo, hi]) => Array.from({ length: 7 }, (_, i) => lo - 0.25 * (hi - lo) + 1.5 * (hi - lo) * i / 6))
	return ax[0].flatMap((a) => ax[1].flatMap((b) => ax[2].map((c) => [a, b, c])))
}
// rgb past both ends of every channel, plus exact grays
const RGB_EDGE = [0, 1e-9, 0.5, 17, 128, 254.5, 255].map((v) => [v, v, v])
for (const a of [-40, 0, 90, 255, 300]) for (const b of [-40, 0, 170, 255, 300]) for (const c of [-40, 0, 60, 255, 300]) RGB_EDGE.push([a, b, c])
// Known divergences, older than this sweep and kept visible here rather than loosened above:
// the scalar library converts Oklab ⇄ XYZ by its own direct matrices (the kernel goes via
// lrgb, see the bit-for-bit note below), so their →xyz differs out of gamut; its rgb ⇄ Lab is
// a premultiplied display route (spaces/lab.js), off the chain by up to 1.4e-5 L out of gamut,
// which the kernel's chain returns as ~1.1e-3 rgb; and jz 0.9.2's Math.cos/sin (~1e-7 off)
// enter JzCzHz, which the PQ curve amplifies at out-of-gamut darks.
const OWN_XYZ = new Set(['oklab', 'oklrab', 'oklch', 'oklrch']), ROUND_TRIP_OFF = new Set(['lab', 'lchab', 'jzczhz'])
const sweep = (pts, run) => { let bad = 0, first = ''; for (const p of pts) { const r = run(p); if (r) { if (!bad) first = r; bad++ } } return [bad, first] }
const fmt = (v) => `[${v.map((x) => +x.toPrecision(7)).join(', ')}]`

for (const from of spaces) {
	if (from === 'rgb') continue
	test(`wasm: ${from} grid (out-of-gamut incl.) →rgb, →xyz matches scalar`, () => {
		for (const to of ['rgb', 'xyz']) {
			if (to === from || to === 'xyz' && OWN_XYZ.has(from)) continue
			const [bad, first] = sweep(grid(from), (p) => {
				let s
				// the scalar hsv→rgb throws on a negative hue (no sector); the kernel answers NaN
				try { s = space[from][to](...p) } catch { s = [NaN, NaN, NaN] }
				const w = wasm[from][to](...p)
				return sameColor(to, w, s) ? '' : `${fmt(p)} → wasm ${fmt(w)} vs scalar ${fmt(s)}`
			})
			is(bad, 0, `${from}→${to}: ${bad} of ${grid(from).length} off${first && ', first ' + first}`)
		}
	})
	test(`wasm: rgb→${from} at the rgb edges, and rgb→${from}→rgb, match scalar`, () => {
		const r = rnd(0xc0ffee), pts = [...RGB_EDGE]
		for (let i = 0; i < 200; i++) pts.push([r() * 255, r() * 255, r() * 255])
		let [bad, first] = sweep(RGB_EDGE, (p) => {
			const w = wasm.rgb[from](...p), s = space.rgb[from](...p)
			return sameColor(from, w, s) ? '' : `${fmt(p)} → wasm ${fmt(w)} vs scalar ${fmt(s)}`
		})
		is(bad, 0, `rgb→${from}: ${bad} of ${RGB_EDGE.length} off${first && ', first ' + first}`)
		if (ROUND_TRIP_OFF.has(from)) return;
		[bad, first] = sweep(pts, (p) => {
			const w = wasm[from].rgb(...wasm.rgb[from](...p)), s = space[from].rgb(...space.rgb[from](...p))
			return sameColor('rgb', w, s) ? '' : `${fmt(p)} → wasm ${fmt(w)} vs scalar ${fmt(s)}`
		})
		is(bad, 0, `rgb→${from}→rgb: ${bad} of ${pts.length} off${first && ', first ' + first}`)
	})
}

// A batch loop must not touch the heap: a convert that allocates grows memory, which
// detaches the caller's alloc() view mid-call (iterative kernels allocate per step, so
// one boxed tuple in an inner loop is megabytes per image). Every `_n` export, on the
// shipped bytes, leaves jz's bump pointer where it found it.
test('wasm: every batch loop runs allocation-free', () => {
	const ex = new WebAssembly.Instance(new WebAssembly.Module(Buffer.from(b64, 'base64')), {}).exports
	const loops = Object.keys(ex).filter((k) => k.endsWith('_n')), n = 64, moved = []
	for (const f of loops) {
		const view = new Float64Array(ex.memory.buffer, Number(BigInt(ex.alloc(n)) & 0xffffffffn), n * 3)
		for (let i = 0; i < view.length; i++) view[i] = (i * 37 % 101) / 3 - 4 // in and out of every range
		const h0 = ex.__heap.value
		ex[f](n)
		if (ex.__heap.value !== h0) moved.push(`${f} +${Number(ex.__heap.value - h0)} B`)
		ex._clear()
	}
	is(moved, [], `${loops.length} loops, none allocates`)
})

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
