// color-space/util – the toolkit around the conversions, each part against colorjs.io (an independent implementation of the
// same CSS Color 4 definitions) or the reference data its own source names.
//
// @see https://drafts.csswg.org/css-color-4/#color-syntax (parse), #serializing-color-values (format),
//      #interpolation and #hue-interpolation (mix), #predefined (gamut), #color-difference-OK (ΔEOK)
// @see G. Sharma, W. Wu, E. N. Dalal, Color Res. Appl. 30(1):21–30, 2005, Table 1 (CIEDE2000)
// @see https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio
// @see G. M. Machado, M. M. Oliveira, L. A. F. Fernandes, IEEE TVCG 15(6):1291–1298, 2009 (CVD, severity 1)
import test, { ok, is } from 'tst'
import Color from 'colorjs.io'
import space from '../index.js'
import * as util from '../util.js'
import { mat3 } from '../util.js'

const near = (a, b, e) => a.every((x, i) => Math.abs(x - b[i]) < e)

test('util: parse reads CSS Color 4 strings as colorjs.io does', () => {
	for (const [s, id] of [['#ff8000', 'rgb'], ['#f80c', 'rgb'], ['rebeccapurple', 'rgb'], ['rgb(10 20 30 / 50%)', 'rgb'], ['hsl(120deg 50% 25%)', 'hsl'],
		['oklch(70% 0.1 50)', 'oklch'], ['lab(50% 20 -30)', 'lab'], ['color(display-p3 1 0.5 0)', 'p3']]) {
		const p = util.parse(s), c = new Color(s), ref = c.to('srgb').coords.map((v) => v * 255)
		is(p.space, id, `${s}: its space`)
		ok(near(p.space === 'rgb' ? p.values : space[p.space].rgb(...p.values), ref, 0.5), `${s}: the same color`)
		is(+p.alpha.toFixed(3), +c.alpha.toFixed(3), `${s}: alpha`)
	}
	is(util.parse('not a color'), undefined, 'no color: undefined')
})

test('util: format writes the notation parse reads back', () => {
	for (const [id, v] of [['rgb', [255, 128, 0]], ['oklch', [0.7, 0.1, 50]], ['lab', [50, 20, -30]], ['p3', [1, 0.5, 0]]]) {
		const s = util.format(id, v), back = util.parse(s)
		ok(near(back.values, v, 1e-3), `${id}: ${s} round-trips`)
	}
	is(util.format('munsell', [5, 5, 5]), undefined, 'a space CSS cannot write: undefined')
})

test('util: mix interpolates in the space, hue the short way – as colorjs.io', () => {
	for (const [a, b] of [['oklch(0.5 0.1 350)', 'oklch(0.7 0.2 10)'], ['oklch(0.4 0.1 30)', 'oklch(0.8 0.05 200)']]) {
		const ca = new Color(a), cb = new Color(b), ref = ca.mix(cb, 0.3, { space: 'oklch' }).coords
		ok(near(util.mix('oklch', ca.coords, cb.coords, 0.3), ref, 1e-9), `${a} → ${b} at 0.3`)
	}
	for (const hue of ['shorter', 'longer', 'increasing', 'decreasing']) for (const [a, b] of [[[0.5, 0.1, 350], [0.7, 0.2, 10]], [[0.6, 0.1, 40], [0.7, 0.1, 40]], [[0.6, 0.1, 200], [0.7, 0.1, 20]]]) {
		const ref = new Color('oklch', a).mix(new Color('oklch', b), 0.3, { space: 'oklch', hue }).coords
		ok(near(util.mix('oklch', a, b, 0.3, hue), ref, 1e-9), `${a[2]}° → ${b[2]}°, ${hue}`) }   // equal hues, longer: the full turn
	is(util.mix('hsl', [350, 50, 50], [10, 50, 50], 0.5, 'longer'), [180, 50, 50], 'longer: the way round through 180')
	is(util.mix('oklch', [1, 0, NaN], [0.6, 0.2, 30], 0.5)[2], 30, 'a missing hue (NaN, CSS\'s none): the other color\'s')
	is(util.interpolate([0, NaN], [1, NaN], 0.5, 1), [0.5, 0], 'missing at both ends: 0, as a missing hue converts')
	is(util.interpolate([0, 370], [1, -10], 0, 1), [0, 10], 't 0: the first, its hue on the wheel')
	is(util.interpolate([0, 370], [1, -10], 1, 1), [1, 350], 't 1: the second')
	is(util.interpolate([0, 90], [1, 10], 0.5, 1, 'shorter', 10, 80), [0.5, 10], 'a wheel of its own: 90 is 10 on [10, 90) – one hue, no turn')
	is(util.mix('rgb', [0, 0, 0], [255, 255, 255], 0.5), [127.5, 127.5, 127.5], 'no hue: a straight line')
})

test('util: gamut names the tightest predefined gamut, visible what is a color', () => {
	is(util.gamut('rgb', [255, 0, 0]), 'srgb', 'sRGB red')
	is(util.gamut('p3', [0, 1, 0]), 'p3', 'P3 green')
	is(util.gamut('rec2020', [0, 1, 0]), 'rec2020', 'Rec. 2020 green')
	is(util.gamut('xyy', [0.1, 0.9, 20]), null, 'past the spectral locus: no color')
	is(util.visible('xyy', [0.1, 0.9, 20]), false, 'not visible')
	is(util.visible('rgb', [255, 128, 0]), true, 'an sRGB color is visible')
})

test('util: deltaE – CIEDE2000 on Sharma et al.\'s pairs, ΔEOK as colorjs.io', () => {
	for (const [l1, a1, b1, l2, a2, b2, d] of [[50, 2.6772, -79.7751, 50, 0, -82.7485, 2.0425], [50, 0, 0, 50, -1, 2, 2.3669], [60.2574, -34.0099, 36.2677, 60.4626, -34.1751, 39.4387, 1.2644]])
		is(+util.deltaE('lab', [l1, a1, b1], [l2, a2, b2]).toFixed(4), d, `ΔE00 ${d}`)
	const a = new Color('#ff8000'), b = new Color('#ee9922')
	ok(Math.abs(util.deltaE('rgb', [255, 128, 0], [238, 153, 34], 'ok') - a.deltaE(b, 'OK')) < 1e-6, 'ΔEOK (their matrices to 1e-9)')
})

test('util: contrast is WCAG 2.2\'s ratio, as colorjs.io computes it', () => {
	is(+util.contrast('rgb', [255, 255, 255], [0, 0, 0]).toFixed(2), 21, 'white on black: 21')
	for (const [fg, bg] of [['#777777', '#ffffff'], ['#ff8000', '#202020'], ['#3366cc', '#eeeeee']]) {
		const v = (h) => new Color(h).to('srgb').coords.map((x) => x * 255)
		ok(Math.abs(util.contrast('rgb', v(fg), v(bg)) - new Color(fg).contrast(new Color(bg), 'WCAG21')) < 1e-3, `${fg} on ${bg}`)
	}
})

test('util: cvd keeps the space, a gray a gray, and none no change', () => {
	ok(near(util.cvd('rgb', [0, 128, 255], 'none'), [0, 128, 255], 1e-9), 'none: the color itself')
	for (const k of ['protan', 'deutan', 'tritan']) {
		const g = util.cvd('rgb', [128, 128, 128], k)
		ok(Math.max(...g) - Math.min(...g) < 1, `${k}: a gray stays gray`)
		const o = util.cvd('oklch', [0.7, 0.15, 30], k)
		is(o.length, 3, `${k}: back in the space asked (oklch)`)
	}
	const p = util.cvd('rgb', [255, 0, 0], 'protan'), d = util.cvd('rgb', [255, 0, 0], 'deutan')
	ok(p[0] < 200 && d[0] > p[0], 'red darkens most for a protan eye (Machado 2009)')
})

test('util: the spaces\' numeric helpers come with it', () => {
	is(mat3([1, 0, 0, 0, 1, 0, 0, 0, 1], 1, 2, 3), [1, 2, 3], 'mat3')
})
