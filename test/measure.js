// The ⌥ readout's numbers (web/js/measure.js): CIEDE2000 against the test data of its implementation notes, and every
// measure against colorjs.io – an independent implementation – on colors across sRGB and past it.
//
// @see G. Sharma, W. Wu, E. N. Dalal, "The CIEDE2000 color-difference formula: implementation notes, supplementary test
//      data, and mathematical observations", Color Res. Appl. 30(1):21–30, 2005, Table 1
// @see https://drafts.csswg.org/css-color-4/#color-difference-OK (ΔEOK) and #css-gamut-mapping (JND = 0.02)
// @see https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio, SC 1.4.3, 1.4.6, 1.4.11 (the levels)
import test, { ok, is } from 'tst'
import Color from 'colorjs.io'
import space from '../index.js'
import { deltaE2000, deltaEOK, contrast, measure, step, stepText, pills, JND } from '../web/js/measure.js'

// Table 1: [L1, a1, b1, L2, a2, b2, ΔE00]
const SHARMA = [
	[50, 2.6772, -79.7751, 50, 0, -82.7485, 2.0425], [50, 3.1571, -77.2803, 50, 0, -82.7485, 2.8615], [50, 2.8361, -74.0200, 50, 0, -82.7485, 3.4412],
	[50, -1.3802, -84.2814, 50, 0, -82.7485, 1.0000], [50, -1.1848, -84.8006, 50, 0, -82.7485, 1.0000], [50, -0.9009, -85.5211, 50, 0, -82.7485, 1.0000],
	[50, 0, 0, 50, -1, 2, 2.3669], [50, -1, 2, 50, 0, 0, 2.3669],
	[50, 2.4900, -0.0010, 50, -2.4900, 0.0009, 7.1792], [50, 2.4900, -0.0010, 50, -2.4900, 0.0010, 7.1792], [50, 2.4900, -0.0010, 50, -2.4900, 0.0011, 7.2195], [50, 2.4900, -0.0010, 50, -2.4900, 0.0012, 7.2195],
	[50, -0.0010, 2.4900, 50, 0.0009, -2.4900, 4.8045], [50, -0.0010, 2.4900, 50, 0.0010, -2.4900, 4.8045], [50, -0.0010, 2.4900, 50, 0.0011, -2.4900, 4.7461],
	[50, 2.5, 0, 50, 0, -2.5, 4.3065], [50, 2.5, 0, 73, 25, -18, 27.1492], [50, 2.5, 0, 61, -5, 29, 22.8977], [50, 2.5, 0, 56, -27, -3, 31.9030], [50, 2.5, 0, 58, 24, 15, 19.4535],
	[50, 2.5, 0, 50, 3.1736, 0.5854, 1.0000], [50, 2.5, 0, 50, 3.2972, 0, 1.0000], [50, 2.5, 0, 50, 1.8634, 0.5757, 1.0000], [50, 2.5, 0, 50, 3.2592, 0.3350, 1.0000],
	[60.2574, -34.0099, 36.2677, 60.4626, -34.1751, 39.4387, 1.2644], [63.0109, -31.0961, -5.8663, 62.8187, -29.7946, -4.0864, 1.2630],
	[61.2901, 3.7196, -5.3901, 61.4292, 2.2480, -4.9620, 1.8731], [35.0831, -44.1164, 3.7933, 35.0232, -40.0716, 1.5901, 1.8645],
	[22.7233, 20.0904, -46.6940, 23.0331, 14.9730, -42.5619, 2.0373], [36.4612, 47.8580, 18.3852, 36.2715, 50.5065, 21.2231, 1.4146],
	[90.8027, -2.0831, 1.4410, 91.1528, -1.6435, 0.0447, 1.4441], [90.9257, -0.5406, -0.9208, 88.6381, -0.8985, -0.7239, 1.5381],
	[6.7747, -0.2908, -2.4247, 5.8714, -0.0985, -2.2286, 0.6377], [2.0776, 0.0795, -1.1350, 0.9033, -0.0636, -0.5514, 0.9082],
]

test('measure: CIEDE2000 reproduces Sharma, Wu & Dalal\'s 34 test pairs to their 4 decimals, both ways round', () => {
	for (const [L1, a1, b1, L2, a2, b2, e] of SHARMA) {
		is(+deltaE2000([L1, a1, b1], [L2, a2, b2]).toFixed(4), e, `(${L1}, ${a1}, ${b1}) → (${L2}, ${a2}, ${b2})`)
		is(+deltaE2000([L2, a2, b2], [L1, a1, b1]).toFixed(4), e, 'reversed')
	}
})

// colors across sRGB and past it (Display P3's and Rec. 2020's corners), as the panel and the site hand them in: this
// library's CIELAB D50, Oklab and Y – checked against colorjs.io's own conversions and measures
const rnd = (k => () => (k = (k * 16807) % 2147483647) / 2147483647)(7)
const colors = [...Array.from({ length: 120 }, () => ['p3', [rnd(), rnd(), rnd()]]), ...Array.from({ length: 60 }, () => ['rec2020', [rnd(), rnd(), rnd()]]), ['p3', [0, 0, 0]], ['p3', [1, 1, 1]]]
const ours = ([s, v]) => ({ lab: space[s].lab(...v), oklab: space[s].oklab(...v), Y: space[s].xyz(...v)[1] / 100 })
const theirs = ([s, v]) => new Color(s === 'p3' ? 'p3' : 'rec2020', v)

// the formulas alone: colorjs.io's own coordinates in, its measures out – they agree to rounding
const cjs = C => ({ lab: C.to('lab').coords, oklab: C.to('oklab').coords, Y: C.to('xyz-d65').coords[1] })
test('measure: ΔE2000, ΔEOK and WCAG contrast are colorjs.io\'s (deltaE2000, deltaEOK, contrastWCAG21) on its own coordinates', () => {
	let w = [0, 0, 0]
	for (let k = 0; k + 1 < colors.length; k++) {
		const A = theirs(colors[k]), B = theirs(colors[k + 1]), m = measure(cjs(A), cjs(B))
		w = [Math.max(w[0], Math.abs(m.de00 - A.deltaE2000(B))), Math.max(w[1], Math.abs(m.deok - A.deltaEOK(B))), Math.max(w[2], Math.abs(m.ratio - A.contrastWCAG21(B)))]
	}
	ok(w.every(x => x < 1e-9), `worst differences: ΔE2000 ${w[0].toExponential(1)}, ΔEOK ${w[1].toExponential(1)}, contrast ${w[2].toExponential(1)}`)
})
// …and as the pages feed them, through this library's conversions: within a hundredth of a JND (the two libraries' Oklab
// matrices part in their last digits)
test('measure: through this library\'s CIELAB, Oklab and XYZ, the same measures within a hundredth of a JND', () => {
	let w = [0, 0, 0]
	for (let k = 0; k + 1 < colors.length; k++) {
		const [a, b] = [colors[k], colors[k + 1]], m = measure(ours(a), ours(b)), A = theirs(a), B = theirs(b)
		w = [Math.max(w[0], Math.abs(m.de00 - A.deltaE2000(B))), Math.max(w[1], Math.abs(m.deok - A.deltaEOK(B))), Math.max(w[2], Math.abs(m.ratio - A.contrastWCAG21(B)))]
	}
	ok(w[0] < 0.01 && w[1] < JND / 100 && w[2] < 1e-3, `worst differences: ΔE2000 ${w[0].toExponential(1)}, ΔEOK ${w[1].toExponential(1)}, contrast ${w[2].toExponential(1)}`)
})

test('measure: WCAG\'s own anchors – black on white 21:1, a color on itself 1:1, symmetric', () => {
	is(contrast(0, 1), 21)
	is(contrast(1, 0), 21)
	is(contrast(0.3, 0.3), 1)
	is(contrast(-0.01, 1), 21, 'a luminance past black is black')
})

test('measure: the JND is CSS Color 4\'s, and ΔEOK counts in it', () => {
	is(JND, 0.02)
	const a = { lab: [50, 0, 0], oklab: [0.5, 0, 0], Y: 0.2 }, b = { lab: [50, 0, 0], oklab: [0.5, 0.06, 0.08], Y: 0.2 }
	is(deltaEOK(a.oklab, b.oklab), 0.1)
	ok(Math.abs(measure(a, b).jnd - 5) < 1e-12, '0.1 is five JNDs')
})

test('measure: a hue steps the shorter way round; a step prints at its channel\'s precision, a still one not at all', () => {
	is(step(350, 10, 360), 20)
	is(step(10, 350, 360), -20)
	is(step(0.2, 0.5, 0), 0.3)
	const fmt = (v, c) => v.toFixed(c.max === 360 ? 1 : 3), L = { sym: 'L', min: 0, max: 1 }, H = { sym: 'H', min: 0, max: 360 }
	is(stepText(L, 0.5, 0.62, 0, fmt), 'L +0.120')
	is(stepText(L, 0.62, 0.5, 0, fmt), 'L −0.120', 'a minus sign, not a hyphen')
	is(stepText(H, 350, 35, 360, fmt), 'H +45.0')
	is(stepText(L, 0.5, 0.5002, 0, fmt), '', 'under its printed precision: still')
})

test('measure: the readout – the distance chosen, the contrast\'s level only once reached', () => {
	const m = (deok, ratio) => ({ de00: 12.345, deok, jnd: deok / JND, ratio })
	is(pills(m(0.1, 2), 'de00', 'AA large')[0], 'ΔE00 12.3')
	is(pills(m(0.1234, 2), 'deok', 'AA large')[0], 'ΔEOK 0.123')
	is(pills(m(0.1, 4.499), 'de00', 'AA large')[1], '4.49:1 AA large', '4.499 is not 4.5')
	is(pills(m(0.1, 4.5), 'de00', 'AA large')[1], '4.50:1 AA')
	is(pills(m(0.1, 7), 'de00', 'AA large')[1], '7.00:1 AAA')
	is(pills(m(0.1, 2.99), 'de00', 'AA large')[1], '2.99:1')
})
