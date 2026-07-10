// Pin the batch calling form to the scalar form, across all three hubs.
//
// Every wired pair must satisfy: batch(interleaved pixels) ≡ per-pixel scalar
// calls, bit-for-bit (the batch loop calls the same scalar composition), with
// stride = each space's channel count. Also pins the lite hub to wasm coverage
// (the three hubs interchange) and the v2-shaped array call as a batch of one.
import test, { is } from 'tst'
import space, { register } from '../index.js'
import lite, { register as registerLite } from '../lite.js'
import { spaces as wasmSpaces } from '../wasm.js'

const SAMPLE_RGB = [[246, 125, 79], [12, 200, 100]]

// NaN-tolerant exact equality (batch reuses the scalar fn, so results are bit-identical)
const same = (a, b) => a.length === b.length && [...a].every((v, i) => Object.is(v, b[i]) || (Number.isNaN(v) && Number.isNaN(b[i])))

test('batch — every wired pair matches per-pixel scalar calls, exact', () => {
	const names = Object.keys(space)
	let pairs = 0, skipped = 0
	for (const from of names) {
		// valid in-gamut samples for `from`, derived from the rgb anchors
		const pixels = SAMPLE_RGB.map((rgb) => from === 'rgb' ? rgb : space.rgb[from](...rgb))
		if (pixels.some((p) => !p || p.some?.((v) => !isFinite(v)))) { skipped++; continue }
		for (const to of names) {
			if (to === from || typeof space[from][to] !== 'function') continue
			const exp = pixels.map((p) => space[from][to](...p)).flat()
			const got = space[from][to](pixels.flat())
			if (!same(got, exp)) is([...got], exp, `${from}→${to} batch ≡ scalar`)
			pairs++
		}
	}
	is(skipped, 0, 'no source space skipped for non-finite anchor samples')
	is(pairs > 24000, true, `all pairs swept (${pairs})`)
})

test('batch — strides follow channel counts', () => {
	is(space.rgb.cmyk([255, 0, 0]).length, 4, 'rgb→cmyk: 3n → 4n')
	is(space.cmyk.rgb([0, 100, 100, 0]).length, 3, 'cmyk→rgb: 4n → 3n')
	is(space.rgb.gray([255, 255, 255, 0, 0, 0]).length, 2, 'rgb→gray: 3n → 1n')
	is(space.kelvin.rgb([2700, 6500]).length, 6, 'kelvin→rgb: 1n → 3n')
	is(space.rgb.hsl([]).length, 0, 'empty in → empty out')
	is(space.rgb.oklch(new Uint8ClampedArray([246, 125, 79])) instanceof Float64Array, true, 'typed input (ImageData-style) → Float64Array out')
})

test('batch — trailing params reach every pixel (ycbcr kb/kr)', () => {
	const kb = 0.0722, kr = 0.2126 // BT.709 weights
	const exp = [...space.rgb.ycbcr(255, 128, 0, kb, kr), ...space.rgb.ycbcr(12, 200, 100, kb, kr)]
	is(same(space.rgb.ycbcr([255, 128, 0, 12, 200, 100], kb, kr), exp), true, 'batch with params ≡ scalar with params')
})

test('batch — length not divisible by stride throws', () => {
	let msg = ''
	try { space.rgb.hsl([1, 2]) } catch (e) { msg = e.message }
	is(/3·n/.test(msg), true, `throws naming the stride: ${msg}`)
})

test('batch — a batch of one is the v2 calling convention', () => {
	const flat = space.rgb.lab(255, 0, 0)
	const arr = space.rgb.lab([255, 0, 0])
	is(arr instanceof Float64Array, true, 'array call returns Float64Array')
	is(same(arr, flat), true, 'array call ≡ flat call')
	// v2 parameterized shape survives too
	is(same(space.rgb.ycbcr([255, 0, 0], 0.0722, 0.2126), space.rgb.ycbcr(255, 0, 0, 0.0722, 0.2126)), true, 'v2 (arr, kb, kr) shape works')
})

test('batch — register()ed space gets both forms (2-channel stride)', () => {
	register({ name: 'halfs', range: [[0, 1], [0, 1]], rgb: (a, b) => [a * 255, b * 255, 0] })
	space.rgb.halfs = undefined // no inverse defined; direct edge only
	is(space.halfs.rgb(0.5, 0.25), [127.5, 63.75, 0], 'scalar')
	is(same(space.halfs.rgb([0.5, 0.25, 1, 1]), [127.5, 63.75, 0, 255, 255, 0]), true, 'batch, stride 2')
	delete space.halfs
})

test('lite — space set is exactly the wasm coverage, hubs agree', () => {
	is(Object.keys(lite).sort(), [...wasmSpaces].sort(), 'lite ≡ wasm space list')
	// same space objects, so conversions agree with the full hub bit-for-bit
	is(lite.rgb.oklch(246, 125, 79), space.rgb.oklch(246, 125, 79), 'scalar agrees with full hub')
	is(same(lite.rgb.jzazbz([246, 125, 79]), space.rgb.jzazbz([246, 125, 79])), true, 'batch agrees with full hub')
	// both hubs stay functional with both imported (shared space objects, re-wired)
	is(space.rgb.hsl(255, 128, 0).map(Math.round), [30, 100, 50], 'full hub still routes catalog-only pairs')
})

test('lite — register wires a custom space into the compact graph', () => {
	registerLite({ name: 'neg', range: [[0, 255], [0, 255], [0, 255]], rgb: (r, g, b) => [255 - r, 255 - g, 255 - b] })
	is(lite.neg.rgb(255, 0, 255), [0, 255, 0], 'direct')
	is(lite.neg.oklch(255, 255, 255).map((v) => +v.toFixed(4)), [0, 0, 0], 'composed through the compact graph: neg white → black oklch')
	delete lite.neg
})
