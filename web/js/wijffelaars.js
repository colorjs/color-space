// Palettes from intuitive parameters: Wijffelaars, Vliegen, van Wijk & van der Linden, "Generating Color Palettes using
// Intuitive Parameters", Computer Graphics Forum 27(3), EuroVis 2008 – doi:10.1111/j.1467-8659.2008.01203.x. A hue's
// displayable colors are nearly a triangle – black, its most saturated color (the cusp), white; a palette is a curve of
// two quadratic Béziers through it, sampled at the paper's lightness steps (its L(t), fitted to Brewer's palettes), so it
// reads in order, its steps even, no color louder than the next. The knobs are the paper's: hue, saturation (the curve's
// tension: 0 a gray ramp, 1 through the cusp), brightness and contrast (where the lightness starts and how far it runs),
// cool/warm (the light end drawn toward yellow). Table 1 the single-hue sequential model, Table 2 the multi-hue, §4.6 the
// diverging; the inverse – the ramp that meets a color you already have – is David Aerne's (meodai), as is running it
// all in OKLCh over sRGB: cusphanger, github.com/meodai/cusphanger (MIT). The paper's L(t) is in CIE L*, taken to OKLab's
// L through luminance (a gray's L is ∛Y), so the lightnesses land where the paper calibrated them. Pure: no DOM, no page
// state; colors in and out are OKLCh [L 0–1, C, h°], dark to light.
import { space } from './core.js'

const mod = h => (h % 360 + 360) % 360
const K = 24389 / 27, E = 216 / 24389
const fromLs = ls => Math.cbrt(ls > 8 ? ((ls + 16) / 116) ** 3 : ls / K)   // CIE L* → OKLab L, for a gray
const toLs = l => { const y = l ** 3; return y > E ? 116 * Math.cbrt(y) - 16 : K * y }
const inside = rgb => rgb.every(x => x > -1e-6 && x < 255 + 1e-6)

// the cusp – a hue's most saturated sRGB color, [L, C]: on the cube's edge loop red–yellow–green–cyan–blue–magenta, one
// channel full and one none (the paper's §4.3) – found by bisection along the edge whose hues hold it
const LOOP = [[1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 1, 1], [0, 0, 1], [1, 0, 1]]
const lchOf = t => { const i = Math.floor(t) % 6, a = LOOP[i], b = LOOP[(i + 1) % 6], f = t - Math.floor(t); return space.rgb.oklch(...a.map((x, k) => 255 * (x + (b[k] - x) * f))) }
const CORNER = LOOP.map((_, i) => lchOf(i)[2])
const CUSPS = new Map()
export const cusp = h => { h = mod(h); const k = Math.round(h * 100); if (CUSPS.has(k)) return CUSPS.get(k)
	const i = CORNER.findIndex((x, j) => mod(h - x) < mod(CORNER[(j + 1) % 6] - x)), d = x => mod(x - CORNER[i])   // the edge, its hues rising from its start
	let lo = i, hi = i + 1
	for (let n = 0; n < 40; n++) { const m = (lo + hi) / 2; if (d(lchOf(m)[2]) < d(h)) lo = m; else hi = m }
	const [l, c] = lchOf((lo + hi) / 2), p = [l, c]; CUSPS.set(k, p); return p }

// the gamut's own wall: the most chroma a lightness and hue hold in sRGB
export const shell = (l, h) => { if (l <= 0 || l >= 1) return 0
	let lo = 0, hi = 0.5; for (let n = 0; n < 32; n++) { const m = (lo + hi) / 2; if (inside(space.oklch.rgb(l, m, h))) lo = m; else hi = m } return lo }

// the triangle's edge at a lightness – S_max of Table 2
const edge = (l, h) => { const [pl, pc] = cusp(h); return l <= pl ? (pl <= 0 ? 0 : l / pl * pc) : pl >= 1 ? 0 : (1 - l) / (1 - pl) * pc }

const YELLOW = space.rgb.oklch(255, 255, 0)   // the bright point p_b: sRGB's yellow (Table 2's default)
const bez = (a, b, c, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c
const bezInv = (a, b, c, v) => { const d = a - 2 * b + c; return Math.abs(d) < 1e-12 ? (v - a) / (c - a || 1e-12) : (a - b + Math.sqrt(Math.max(0, b * b - a * c + d * v))) / d }
const lerp = (p, q, s) => p.map((x, i) => x + (q[i] - x) * s)

// the curve's points, each [L, C, h] – p0 black, p1 the cusp, p2 white or, cool/warm w over 0, drawn toward yellow
const triangle = (h, s, w) => { const [cl, cc] = cusp(h), p0 = [0, 0, h], p1 = [cl, cc, h]
	let p2 = [1, 0, h]
	if (w > 0) { const M = mod(180 + YELLOW[2] - h) - 180, l = (1 - w) + w * YELLOW[0], hh = h + w * M; p2 = [l, Math.min(edge(l, mod(hh)), w * s * YELLOW[1]), hh] }
	const q0 = lerp(p0, p1, s), q2 = lerp(p2, p1, s); return [p0, q0, lerp(q0, q2, 0.5), q2, p2] }
const along = (t, [p0, q0, q1, q2, p2]) => t <= 0.5 ? p0.map((_, i) => bez(p0[i], q0[i], q1[i], 2 * t)) : p0.map((_, i) => bez(q1[i], q2[i], p2[i], 2 * t - 1))
const tAt = (l, [p0, q0, q1, q2, p2]) => Math.min(1, Math.max(0, l <= q1[0] ? bezInv(p0[0], q0[0], q1[0], l) / 2 : bezInv(q1[0], q2[0], p2[0], l) / 2 + 0.5))

// L(t) = 125 − 125·0.2^x, x = (1 − c)·b + t·c: the lightness exponent x from black (0) to white (1), and back
const lOfX = x => Math.min(1, Math.max(0, fromLs(125 - 125 * 0.2 ** x)))
const xOfL = l => Math.log(1 - toLs(Math.min(1, Math.max(0, l))) / 125) / Math.log(0.2)

// the curve sampled at each t, its lightness exponent run from x0 to x1; a chroma past the wall (the triangle's straight
// edges poke out a little) clamped to it – the paper's "little clamping"
const sample = (h, ts, s, w, x0, x1) => { const tri = triangle(h, s, w)
	return ts.map(t => { const l = Math.min(tri[4][0], Math.max(0, lOfX(x0 + t * (x1 - x0)))), p = along(tAt(l, tri), tri), hh = mod(p[2])
		return [p[0], Math.min(Math.max(0, p[1]), shell(p[0], hh)), hh] }) }
const grid = n => Array.from({ length: n }, (_, i) => n > 1 ? i / (n - 1) : 0)
const ends = (n, { b = 0.75, c = Math.min(0.88, 0.34 + 0.06 * n) } = {}) => [(1 - c) * b, (1 - c) * b + c]

/** n colors of one hue (Table 1), dark to light; w > 0 the multi-hue (Table 2) – the paper's study liked 0.25 best */
export const sequential = (h, n, { s = 0.6, w = 0, ...bc } = {}) => sample(h, grid(n), s, w, ...ends(n, bc))

/** n colors from hue h0 through a shared neutral to hue h1 (§4.6): two sequential arms, light ends met – an odd n holds the
 *  neutral, an even n straddles it a half step either side, so the step across reads as every other */
export const diverging = (h0, h1, n, { s = 0.6, w = 0, ...bc } = {}) => {
	const side = n >> 1, ts = Array.from({ length: side }, (_, i) => 2 * i / (n - 1)), x = ends(side + 1, bc)
	if (n % 2) ts.push(1)
	const a = sample(h0, ts, s, w, ...x), b = sample(h1, ts, s, w, ...x), mid = []
	if (n % 2) { const [p, q] = [a[side], b[side]], r = Math.PI / 180, u = (p[1] * Math.cos(p[2] * r) + q[1] * Math.cos(q[2] * r)) / 2, v = (p[1] * Math.sin(p[2] * r) + q[1] * Math.sin(q[2] * r)) / 2
		const l = (p[0] + q[0]) / 2, hh = mod(Math.atan2(v, u) / r); mid.push([l, Math.min(Math.hypot(u, v), shell(l, hh)), hh]) }
	return [...a.slice(0, side), ...mid, ...b.slice(0, side).reverse()] }

// the lightness ends moved as little as they can so the t-th sample lands on xT – the one on the target's side, the other
// held unless it is in the way, black (0) and white (1) the bounds; every branch keeps (1 − t)·x0 + t·x1 = xT (cusphanger)
const meet = (x0, x1, t, xT) => {
	if (t <= 0) return [xT, Math.max(xT, x1)]
	if (t >= 1) return [Math.min(x0, xT), xT]
	const a = (xT - t * x1) / (1 - t), z = (xT - (1 - t) * x0) / t
	if (t <= 0.5) return a < 0 ? [0, xT / t] : a <= x1 ? [a, x1] : z <= 1 ? [x0, z] : [(xT - t) / (1 - t), 1]
	return z > 1 ? [(xT - t) / (1 - t), 1] : z >= x0 ? [x0, z] : a >= 0 ? [a, x1] : [0, xT / t] }

/** The sequential ramp of n that meets a color – its hue exactly, its lightness at the i-th step (the nearest step, unless
 *  `at` asks one), its chroma by the curve's tension (a chroma past the triangle comes as near as the curve reaches);
 *  b and c as sequential's, the ends it starts from – { colors, i }: the colors dark to light, the color at i */
export const through = ([l, c, h], n, { at, ...bc } = {}) => {
	h = mod(h); l = Math.min(1, Math.max(0, l)); c = Math.min(Math.max(0, c), edge(l, h), shell(l, h))
	const chroma = s => { const tri = triangle(h, s, 0); return along(tAt(l, tri), tri)[1] }
	let lo = 0, hi = 1; for (let k = 0; k < 48; k++) { const m = (lo + hi) / 2; if (chroma(m) < c) lo = m; else hi = m }
	const s = (lo + hi) / 2, ts = grid(n), [x0, x1] = ends(n, bc)
	const i = at ?? ts.reduce((b, t, k) => Math.abs(lOfX(x0 + t * (x1 - x0)) - l) < Math.abs(lOfX(x0 + ts[b] * (x1 - x0)) - l) ? k : b, 0)
	const [a, z] = meet(x0, x1, ts[i], xOfL(l))
	return { colors: sample(h, ts, s, 0, a, z), i } }
