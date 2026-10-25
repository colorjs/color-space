// The field's generated colormaps (web/js/wijffelaars.js): Wijffelaars, Vliegen, van Wijk & van der Linden 2008,
// "Generating Color Palettes using Intuitive Parameters" (doi:10.1111/j.1467-8659.2008.01203.x), in OKLCh over sRGB.
// Differential against cusphanger 0.5.1 with nutelch 0.4.0 (github.com/meodai/cusphanger – the same model in OKLCh, by
// David Aerne): the reference rows below are its output, printed to 4 places. Lightness – the paper's L(t), Table 1 –
// matches to 1e-3; chroma within 0.015 ΔEok, the gap nutelch's gamut LUT leaves (its cusps sit up to 0.011 off in L – our
// cusp and wall are exact, checked against colorjs.io below).
import test, { is, ok } from 'tst'
import Color from 'colorjs.io'
import { cusp, shell, sequential, diverging, through } from '../web/js/wijffelaars.js'

const dE = (p, q) => { const r = Math.PI / 180, a = [p[0], p[1] * Math.cos(p[2] * r), p[1] * Math.sin(p[2] * r)], b = [q[0], q[1] * Math.cos(q[2] * r), q[1] * Math.sin(q[2] * r)]
	return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) }
const like = (got, want, msg) => { is(got.length, want.length, msg + ': size')
	ok(got.every((c, i) => Math.abs(c[0] - want[i][0]) < 1e-3), msg + ': lightness, L(t)')
	ok(got.every((c, i) => dE(c, want[i]) < 0.015), msg + ': color, ΔEok < 0.015') }
const srgb = c => new Color('oklch', c).inGamut('srgb', { epsilon: 1e-6 })

test('wijffelaars: the cusp and the wall – exact, by colorjs.io', () => {
	const wall = (l, h) => { let lo = 0, hi = 0.5; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (new Color('oklch', [l, m, h]).inGamut('srgb')) lo = m; else hi = m } return lo }
	for (const h of [30, 110, 195, 264, 330]) {
		let best = [0, 0]; for (let l = 0.3; l < 1; l += 0.001) { const c = wall(l, h); if (c > best[1]) best = [l, c] }   // the most chroma any lightness holds
		const [l, c] = cusp(h); ok(Math.abs(l - best[0]) < 2e-3 && Math.abs(c - best[1]) < 1e-3, `cusp ${h}°: ${l.toFixed(4)} ${c.toFixed(4)} vs ${best.map(x => x.toFixed(4))}`)
		ok(Math.abs(shell(0.7, h) - wall(0.7, h)) < 1e-4, `wall at L 0.7, ${h}°`) }
})

test('wijffelaars: L(t) as Table 1 gives it', () => {
	// N = 9: c = min(0.88, 0.34 + 0.06·9) = 0.88, b = 0.75 – the first step at L* = 125 − 125·0.2^((1 − c)·b), white's L* the last at x = 0.97
	const ls = x => 125 - 125 * 0.2 ** x, ok3 = s => ((s + 16) / 116)   // a gray's OKLab L = ∛Y = (L* + 16)/116 above L* 8
	const p = sequential(260, 9)
	ok(Math.abs(p[0][0] - ok3(ls(0.12 * 0.75))) < 1e-9 && Math.abs(p[8][0] - ok3(ls(0.12 * 0.75 + 0.88))) < 1e-9, 'the ends')
	ok(p.every((c, i) => !i || c[0] > p[i - 1][0]), 'dark to light')
})

test('wijffelaars: sequential, as cusphanger', () => {
	like(sequential(260, 9), [[0.2832, 0.0985, 260], [0.4345, 0.1314, 260], [0.5612, 0.1402, 260], [0.6674, 0.1282, 260], [0.7563, 0.106, 260], [0.8308, 0.08, 260], [0.8932, 0.0519, 260], [0.9455, 0.0259, 260], [0.9893, 0.005, 260]], 'blue, 9')
	like(sequential(30, 5), [[0.5177, 0.1488, 30], [0.6761, 0.1432, 30], [0.7986, 0.1086, 30], [0.8932, 0.0561, 30], [0.9664, 0.0166, 30]], 'red, 5')
	like(sequential(150, 9, { w: 0.25 }), [[0.2832, 0.0735, 149.82], [0.4345, 0.1074, 149.51], [0.5612, 0.1309, 149.06], [0.6674, 0.1444, 148.44], [0.7563, 0.1466, 147.56], [0.8308, 0.1362, 146.34], [0.8932, 0.1135, 144.77], [0.9455, 0.0773, 142.78], [0.9893, 0.0193, 140.15]], 'green, cool/warm 0.25')
	for (let h = 0; h < 360; h += 10) for (const w of [0, 0.25, 1]) ok(sequential(h, 9, { s: 1, w }).every(srgb), `in sRGB: ${h}°, w ${w}`)
})

test('wijffelaars: diverging, as cusphanger', () => {
	like(diverging(250, 30, 9), [[0.5177, 0.1075, 250], [0.6761, 0.1071, 250], [0.7986, 0.0835, 250], [0.8932, 0.0512, 250], [0.9664, 0.0057, 320.28], [0.8932, 0.0561, 30], [0.7986, 0.1086, 30], [0.6761, 0.1432, 30], [0.5177, 0.1488, 30]], 'odd: the neutral held')
	like(diverging(150, 330, 6), [[0.5665, 0.1299, 150], [0.7687, 0.1413, 150], [0.9079, 0.0979, 150], [0.9079, 0.0776, 330], [0.7687, 0.1608, 330], [0.5665, 0.1868, 330]], 'even: straddled')
})

test('wijffelaars: the ramp through a color', () => {
	for (const [t, i, want] of [[[0.58, 0.09, 155], 1, [[0.4416, 0.0799, 155], [0.58, 0.09, 155], [0.6936, 0.0913, 155], [0.7869, 0.0861, 155], [0.8635, 0.0747, 155], [0.9265, 0.0562, 155], [0.9782, 0.0261, 155]]],
		[[0.3, 0.12, 270], 0, [[0.3, 0.12, 270], [0.4844, 0.1363, 270], [0.6317, 0.1257, 270], [0.7493, 0.1018, 270], [0.8433, 0.0721, 270], [0.9183, 0.039, 270], [0.9782, 0.0102, 270]]]]) {
		const r = through(t, 7); is(r.i, i, `${t}: its step`); like(r.colors, want, `${t}`)
		ok(dE(r.colors[r.i], t) < 1e-6, `${t}: met exactly`) }
	const r = through([0.8, 0.12, 60], 5, { at: 0 }); ok(dE(r.colors[0], [0.8, 0.12, 60]) < 1e-6, 'a step asked: the color at it')
})

test('wijffelaars: the edges', () => {
	is(sequential(200, 1).length, 1, 'one color'); is(diverging(250, 30, 2).length, 2, 'two diverging: both arms, no neutral')
	is(cusp(-30), cusp(330), 'hues wrap'); is(cusp(360), cusp(0))
	const g = through([0.5, 0, 120], 5); ok(g.colors.every(c => c[1] < 1e-9 && c[2] === 120), 'a gray: a gray ramp, its hue kept')
	const k = through([0, 0, 0], 5); is(k.i, 0, 'black: the dark end'); ok(k.colors.every((c, i) => !i || c[0] > k.colors[i - 1][0]), '…and still a ramp')
	const v = through([0.7, 0.5, 40], 5); ok(Math.abs(v.colors[v.i][0] - 0.7) < 1e-9 && v.colors[v.i][2] === 40 && v.colors[v.i][1] < 0.5 && v.colors.every(srgb), 'a chroma past sRGB: its lightness and hue met, the chroma as far as the curve reaches')
})
