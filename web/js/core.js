// Shared COLOR MATH only — every study brings its own design + interaction.
// Metadata drives everything: type each channel, then sample gamut-correct fields.
import space from '../../dist/color-space.js'
import { clamp } from '../../math.js'
import { hex as hex6 } from '../../css.js'
import data from './data.js'
import visibility from './visible.js'

export { data }
export const meta = data.spaces
export { space }

export const spaceCount = Object.keys(space).filter(k => space[k] && space[k].name).length
// a conversion is LUT-viable when a 3³ probe lattice over the source's box lands finite
const fin = (from, to) => { const dom = from.range
	for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) {
		let v; try { v = from[to.name](...[i, j, k].map((t, c) => dom[c][0] + t / 2 * (dom[c][1] - dom[c][0]))) } catch { return false }
		if (!v.every(isFinite)) return false }
	return true }
const bounded3 = s => { const m = meta[s]
	if (!m || (m.channels || []).length !== 3) return false
	const r = space[s].range; return !!r && r.every(([a, b]) => isFinite(a) && isFinite(b) && b > a) }
// spaces that can SOURCE a .cube LUT: 3 bounded channels, finite forward lattice.
// Cyclic hue axes are fine as sources — the lattice covers the wrap end-to-end and
// the OUTPUT varies continuously across it. One predicate feeds the catalog
// filter, the dossier, and llms.txt.
export const LUTOK = new Set(Object.keys(space).filter(s => bounded3(s)
	&& (s === 'rgb' || (() => { try { return fin(space[s], space.rgb) } catch { return false } })())))
// …that can END one: additionally no cyclic hue axis (0–360° angles AND renamed
// wheels — munsell H 0–100) — a lattice interpolating a TARGET hue across the
// 360→0 seam reads ~the wheel's far side, so those stay sources only
export const LUTTGT = new Set(Object.keys(space).filter(s => bounded3(s)
	&& !meta[s].channels.some(c => c.max === 360 || /hue/i.test(c.name))
	&& (s === 'rgb' || (() => { try { return fin(space.rgb, space[s]) } catch { return false } })())))
export { clamp }
export const hex = rgb => hex6(rgb).toUpperCase()   // the page writes hex in capitals
const D = Math.PI / 180

// ── classify each channel from metadata ──
//   tone (achromatic axis) · angle (hue, wraps 0–360) · bipolar (a/b) · magnitude (chroma/sat)
// Registry metadata is immutable; classification is shared by every frame and renderer.
const CLASSIFIED = new Map()
export function classify(name) {
	if (CLASSIFIED.has(name)) return CLASSIFIED.get(name)
	const ch = (meta[name]?.channels || []).map((c, i) => ({ sym: c.symbol, min: c.min, max: c.max, name: c.name, i }))
	for (const c of ch) {
		if (c.max === 360) c.type = 'angle'
		else if (/Light|Value|Intensity|Tone|Bright|Luma|Luminance/.test(c.name)) c.type = 'tone'  // by name — 'V' means Value in HSV but chrominance in Luv
		else if (c.min < 0 && c.max > 0) c.type = 'bipolar'
		else c.type = 'magnitude'
	}
	const tone = ch.find(c => c.type === 'tone')
	const angle = ch.find(c => c.type === 'angle')
	const bips = ch.filter(c => c.type === 'bipolar')
	const mags = ch.filter(c => c.type === 'magnitude')
	let archetype = 'strips'
	if (tone && angle && mags.length) archetype = 'polar'          // hsl, oklch, cam16, hct…
	else if (tone && bips.length >= 2) archetype = 'opponent'      // lab, oklab, luv, jzazbz…
	else if (!tone && !angle && ch.length === 3) archetype = 'additive' // rgb, p3…
	const classified = { name, ch, tone, angle, bips, mags, archetype }
	CLASSIFIED.set(name, classified)
	return classified
}
// the shape: a hue angle makes it polar – whatever its other channels are (HWB's whiteness and blackness, HCG's gray,
// none of them a lightness); else two signed axes round a tone, opponent; else independent channels. The site's
// catalog and the panel's space menu mark a space by it
export const geoOf = s => { const c = classify(s); return c.angle ? 'polar' : c.archetype === 'opponent' ? 'opponent' : 'component' }

// any hue-like channel is an angle wrapping over its own span — munsell's H is 0-100
// grades, coloroid's A is 10-77, not just the 0-360 spaces. -1 = no wheel.
export const hueIdx = cls => { if (cls.angle) return cls.angle.i
	if (cls.ch.length !== 3) return -1
	return cls.ch.findIndex(c => /hue/i.test(c.name || '')) }

// a space's channel pairs as planes – three of them (two for two channels), the angle across and the tone up where
// the space has them
export const pairsOf = cls => { const n = cls.ch.length; if (n < 2) return []
	const ps = n > 3 ? [[0, 1], [1, 2], [2, 0]] : n === 2 ? [[0, 1]] : [[0, 1], [0, 2], [1, 2]]
	const ai = cls.angle ? cls.angle.i : -1, ti = cls.tone ? cls.tone.i : (ai < 0 && n === 3 ? 0 : undefined)
	return ps.map(([a, b]) => (ai === b || ti === a) ? [b, a] : [a, b]) }

// decimals from the range span — enough that every channel walks ≥100 steps: the step is
// the largest power of ten with span/step ≥ 100 (0..255 → 1, 0..0.85 → 0.001, xyb's
// 0.0435 → 0.0001, scrgb's 0–8 → 0.01; kelvin's 24000 stays 1 — decimals clamp to
// 0..6). The printed precision IS the step.
export const decOf = c => { const d = -Math.floor(Math.log10((c.max - c.min) / 100)); return d > 0 ? Math.min(d, 6) : 0 }
// fixed decimals, never shed — 0.111 → 0.110 → 0.109 keeps its width, and the trailing
// zeros tell the user what one spinner click moves; d: fewer, where a field has no room for them
export const fmtc = (v, c, d = decOf(c)) => { if (!isFinite(v)) return ''
	const s = v.toFixed(Math.max(0, d)); return /^-0(\.0+)?$/.test(s) ? s.slice(1) : s }

// convert a space's raw channel values → clamped sRGB
// non-finite components (coordinates outside the space's domain, e.g. ICtCp I=0 with chroma) clamp to 0
const px = x => isFinite(x) ? clamp(Math.round(x), 0, 255) : 0

// how much linear light a coordinate may claim before it's formula noise:
// scene-referred / HDR spaces really reach hundreds of diffuse whites, SDR display spaces don't
// a chromaticity space that cannot say luminance – two channels (rg, maxwell, cct-duv): its gamut is a direction's,
// displayable at ANY luminance. One that carries luminance in a channel (xyY, u′v′Y, Yrg, DSH, MacLeod–Boynton, LogLuv,
// prismatic) is asked as any other space, at the luminance it holds – the direction law there ghosted every held color
export const dirOnly = name => meta[name]?.method === 'chromaticity' && space[name]?.range?.length < 3
export const physBound = name => (meta[name]?.referred === 'scene' || meta[name]?.dynamic === 'hdr') ? 500 : 4

// ── the spectral locus: the boundary of colour itself ──
// A chromaticity outside the horseshoe (the CIE 1931 2° spectral curve, closed by the
// line of purples) is IMAGINARY — no spectral power distribution produces it, at any
// luminance. So it is not a colour under ANY lens: the xy panel draws the boundary, and
// the planes and sliders void past it regardless of the selected gamut (a display lens
// only ghosts the real colours it can't show — it can't make an imaginary one real).
// This is deliberately NOT the object-colour (Rösch–MacAdam) solid the 3D shape is built
// from: that solid is a bounded REFLECTIVE gamut under illuminant E, and a colour above
// its ceiling — a bright emissive white, a laser — is still perfectly visible.
const LAW = visibility(space)   // the page's registry through the one law (visible.js) color-space/util asks of the package's
export const { locus, LOCUS_EPS, xyOf, tightGamut } = LAW
// …asked hundreds of times a strip, so answered from a grid over the locus's box, built once and exactly: a cell no edge of
// the locus comes within LOCUS_EPS + its half-diagonal of holds one answer everywhere – no edge crosses it, no point of it
// lies near the curve – and that answer is the law's own even-odd count along the row of cell centres (the same crossings,
// the same arithmetic); a cell an edge comes near asks the law itself. Past the box padded by 2·EPS, nothing is a colour.
// Black, a negative light, NaN: the law itself. Built in a few ms: a cell classified one by one on demand cost the hero's
// horseshoe, which samples the whole plane once, more than the law it was to save
const VN = 512
let VG = null
const segDist = (px, py, ax, ay, bx, by) => { const ex = bx - ax, ey = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * ex + (py - ay) * ey) / (ex * ex + ey * ey)))
	return Math.hypot(px - ax - t * ex, py - ay - t * ey) }
const vgrid = () => VG ??= (() => { const P = locus(), pad = 2 * LOCUS_EPS, n = P.length
	let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
	for (const [x, y] of P) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y) }
	x0 -= pad; y0 -= pad
	const dx = (x1 + pad - x0) / VN, dy = (y1 + pad - y0) / VN, c = new Uint8Array(VN * VN)   // 1 in · 2 out · 3 near the curve
	for (let j = 0; j < VN; j++) { const y = y0 + (j + .5) * dy, xs = []
		for (let i = 0, k = n - 1; i < n; k = i++) { const a = P[i], b = P[k]; if ((a[1] > y) !== (b[1] > y)) xs.push((b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) }
		for (let i = 0; i < VN; i++) { const x = x0 + (i + .5) * dx; let inn = false; for (const xc of xs) if (x < xc) inn = !inn; c[i * VN + j] = inn ? 1 : 2 } }
	const r = LOCUS_EPS + Math.hypot(dx, dy) / 2 + 1e-12, at = (v, o, d) => Math.min(VN - 1, Math.max(0, Math.floor((v - o) / d)))
	for (let i = 0, k = n - 1; i < n; k = i++) { const [ax, ay] = P[i], [bx, by] = P[k]
		for (let u = at(Math.min(ax, bx) - r, x0, dx) - 1, u1 = at(Math.max(ax, bx) + r, x0, dx) + 1; u <= u1; u++) if (u >= 0 && u < VN)
			for (let v = at(Math.min(ay, by) - r, y0, dy) - 1, v1 = at(Math.max(ay, by) + r, y0, dy) + 1; v <= v1; v++)
				if (v >= 0 && v < VN && segDist(x0 + (u + .5) * dx, y0 + (v + .5) * dy, ax, ay, bx, by) <= r) c[u * VN + v] = 3 }
	return { x0, y0, dx, dy, c } })()
export const visibleXYZ = (X, Y, Z) => {
	const s = X + Y + Z
	if (!(s > 1e-9)) return LAW.visibleXYZ(X, Y, Z)
	const g = vgrid(), i = Math.floor((X / s - g.x0) / g.dx), j = Math.floor((Y / s - g.y0) / g.dy)
	if (i < 0 || j < 0 || i >= VN || j >= VN) return false
	const c = g.c[i * VN + j]
	return c === 3 ? LAW.visibleXYZ(X, Y, Z) : c === 1 }

// ── the object-colour solid: the shape the HUMAN view actually draws ──
// CIE Standard Illuminant D65, relative spectral power at 5 nm, normalised to 100 at
// 560 nm. Built under D65 — not the equal-energy E the solid used to assume — because
// every gamut it is compared against is D65-referenced: under D65 a perfect reflector
// integrates to the D65 white point, so display white lands ON the solid's boundary and
// the whole sRGB cube falls inside it. Under E it did not (white sat outside, and the
// picker and the solid disagreed about what "human" meant).
// @see ISO/CIE 11664-2 (CIE S 014-2) — verified here against the library's own D65
// white point: integrating this against the shipped CMFs reproduces it to 0.08%.
const D65_SPD = [
	49.9755, 52.3118, 54.6482, 68.7015, 82.7549, 87.1204, 91.4860, 92.4589, 93.4318, 90.0570,
	86.6823, 95.7736, 104.8650, 110.9360, 117.0080, 117.4100, 117.8120, 116.3360, 114.8610, 115.3920,
	115.9230, 112.3670, 108.8110, 109.0820, 109.3540, 108.5780, 107.8020, 106.2960, 104.7900, 106.2390,
	107.6890, 106.0470, 104.4050, 104.2250, 104.0460, 102.0230, 100.0000, 98.1671, 96.3342, 96.0611,
	95.7880, 92.2368, 88.6856, 89.3459, 90.0062, 89.8026, 89.5991, 88.6489, 87.6987, 85.4936,
	83.2886, 83.4939, 83.6992, 81.8630, 80.0268, 80.1207, 80.2146, 81.2462, 82.2778, 80.2810,
	78.2842, 74.0027, 69.7213, 70.6652, 71.6091,
]
/** D65 relative power at a wavelength, linear between the 5 nm samples (380–700 nm). */
export function d65(nm) {
	const t = (nm - 380) / 5
	if (t <= 0) return D65_SPD[0]
	if (t >= D65_SPD.length - 1) return D65_SPD[D65_SPD.length - 1]
	const i = Math.floor(t), f = t - i
	return D65_SPD[i] * (1 - f) + D65_SPD[i + 1] * f
}
// The optimal-colour (Rösch–MacAdam) solid is a ZONOID — the Minkowski sum of one
// segment per waveband — so it is convex and membership is exact by support function:
// a point is inside iff u·p ≤ h(u) = Σ max(0, u·gᵢ) for every direction u. Sampling u
// on a Fibonacci sphere gives a polytope that CONTAINS the body, so the test never
// clips a real colour; 128 directions hold the gap under a percent.
let VSOLID = null
export function visSolid() {
	if (VSOLID) return VSOLID
	const g = []
	for (let nm = 380; nm <= 700; nm += 2) {
		const [X, Y, Z] = space.wavelength.xyz(nm), w = d65(nm)
		g.push([X * w, Y * w, Z * w])
	}
	const k = 100 / g.reduce((s, v) => s + v[1], 0)   // a perfect reflector reads Y = 100
	for (const v of g) { v[0] *= k; v[1] *= k; v[2] *= k }
	// 512 directions, not 128: the polytope OUTER-approximates the solid, and 128 facets leave
	// a gap that a non-linear opponent axis (OSA-UCS's g near deep blue) magnifies into a
	// several-unit overhang, leaving the picker's out-of-solid guide white past the drawn surface.
	// 512 closes it to sub-pixel; an outer hull only ever admits, so real colours (sRGB) never clip.
	const M = 512, dirs = []
	for (let i = 0; i < M; i++) {
		const y = 1 - 2 * (i + 0.5) / M, r = Math.sqrt(Math.max(0, 1 - y * y)), t = Math.PI * (1 + Math.sqrt(5)) * i
		const u = [r * Math.cos(t), y, r * Math.sin(t)]
		let h = 0
		for (const v of g) { const d = u[0] * v[0] + u[1] * v[1] + u[2] * v[2]; if (d > 0) h += d }
		dirs.push([u[0], u[1], u[2], h])
	}
	return VSOLID = dirs
}
/** Is this XYZ a colour a surface can show under D65 — the human solid the 3D view draws?
 *  The 0.2% slack absorbs the gap between this 2 nm integration and the tabulated white. */
// Fast accept, exact: the sRGB cube lies inside the solid (test/cie.js pins it) and both are convex, so a colour linear
// sRGB holds in [0,1] needs neither the locus nor the 512 planes – most of a strip's probes are such colours.
// The map is the library's own xyz → lrgb, read off its basis once.
let XL = null
const inSRGB = (X, Y, Z) => {
	const [r, g, b] = XL ??= [space.xyz.lrgb(1, 0, 0), space.xyz.lrgb(0, 1, 0), space.xyz.lrgb(0, 0, 1)]
	for (let i = 0; i < 3; i++) { const u = r[i] * X + g[i] * Y + b[i] * Z; if (!(u >= 0 && u <= 1)) return false }
	return true
}
export const inVisSolid = (X, Y, Z) => {
	if (!(isFinite(X) && isFinite(Y) && isFinite(Z))) return false
	if (inSRGB(X, Y, Z)) return true
	if (!visibleXYZ(X, Y, Z)) return false   // the solid lives INSIDE the locus – its convex outer hull alone would admit slightly-imaginary neighbours
	const s = X + Y + Z
	if (s > 1e-9) { const g = sgrid(), i = Math.floor((X / s - g.x0) / g.dx), j = Math.floor((Y / s - g.y0) / g.dy)
		if (i >= 0 && j >= 0 && i < SN && j < SN) { const k = i * SN + j
			if (g.lo[k] || ++g.n[k] > 2 && scell(g, i, j, k)) {
				if (s <= g.lo[k] * (1 - 1e-9)) return true
				if (s > g.hi[k] * (1 + 1e-9)) return false } } }
	for (const [ux, uy, uz, h] of visSolid()) if (ux * X + uy * Y + uz * Z > h * 1.002) return false
	return true
}
// The polytope along a chromaticity c = (x, y, 1−x−y): X = s·c passes every plane while s ≤ T(c), the least 1.002·h / n·c
// over the planes with n·c > 0. n·c is linear in (x, y), so a grid cell's corners bound it – and with it T, from below
// (each plane's least ratio over the cell) and above (its greatest, where n·c stays positive). Under the low bound a colour
// is inside, past the high one outside, rigorously – a 1e-9 band absorbs the rounding of the two forms; the thin band between
// the bounds, and any chromaticity off the grid, take the 512 planes as before. A cell is bounded on its third ask – four
// corners cost what four tests do: a strip's probes return to the same cells again and again, a plate sampled once does not
const SN = 256
let SG = null
const sgrid = () => SG ??= { x0: -0.01, y0: -0.01, dx: 0.76 / SN, dy: 0.86 / SN, lo: new Float64Array(SN * SN), hi: new Float64Array(SN * SN), n: new Uint8Array(SN * SN) }
const scell = (g, i, j, k) => { const xs = [g.x0 + i * g.dx, g.x0 + (i + 1) * g.dx], ys = [g.y0 + j * g.dy, g.y0 + (j + 1) * g.dy]
	let lo = Infinity, hi = Infinity
	for (const [ux, uy, uz, h] of visSolid()) { let L = Infinity, U = -Infinity
		for (const x of xs) for (const y of ys) { const d = ux * x + uy * y + uz * (1 - x - y); if (d < L) L = d; if (d > U) U = d }
		if (U > 0) lo = Math.min(lo, h * 1.002 / U)
		if (L > 0) hi = Math.min(hi, h * 1.002 / L) }
	g.lo[k] = lo > 0 ? lo : Number.MIN_VALUE; g.hi[k] = hi; return true }   // 0 marks a cell not yet bounded – a bound itself never is
/** A space's coordinates as displayable 8-bit-range sRGB: clamped into 0–255, a non-finite channel 0. */
export const rgbF = (s, v) => (s === 'rgb' ? v : space[s].rgb(...v)).map(x => isFinite(x) ? clamp(x, 0, 255) : 0)
export const rgbOf = (name, v) => name === 'rgb' ? v.map(px) : space[name].rgb(...v).map(px)
export const toSpace = (name, rgb) => name === 'rgb' ? rgb.slice() : space.rgb[name](...rgb)

// ── the chromatic plane, polar reading (hue angle + chroma radius) — one wheel for polar AND opponent ──
export const chromaMax = cls => cls.archetype === 'polar' ? cls.mags[0].max : cls.bips[0].max
function assemble(cls, tone, chroma, hue) {
	const v = new Array(cls.ch.length).fill(0)
	if (cls.tone) v[cls.tone.i] = tone
	if (cls.archetype === 'polar') { v[cls.angle.i] = hue; v[cls.mags[0].i] = chroma }
	else { v[cls.bips[0].i] = chroma * Math.cos(hue * D); v[cls.bips[1].i] = chroma * Math.sin(hue * D) }
	return v
}
// returns clamped rgb if (tone,chroma,hue) is in sRGB gamut, else null — via UNCLAMPED linear rgb (true gamut boundary)
export function wheelRGB(cls, tone, chroma, hue) {
	const v = assemble(cls, tone, chroma, hue)
	const lin = space[cls.name].lrgb(...v)
	if (lin.some(u => !(u >= -0.002 && u <= 1.002))) return null   // NaN = outside the domain
	return rgbOf(cls.name, v)
}
// polar coords of the current colour within a space's wheel
export function wheelCoord(cls, rgb) {
	const v = toSpace(cls.name, rgb)
	if (cls.archetype === 'polar') return { tone: cls.tone ? v[cls.tone.i] : 0, chroma: v[cls.mags[0].i], hue: v[cls.angle.i] }
	const a = v[cls.bips[0].i], b = v[cls.bips[1].i]
	let h = Math.atan2(b, a) / D; if (h < 0) h += 360
	return { tone: v[cls.tone.i], chroma: Math.hypot(a, b), hue: h }
}

// The canonical-roundtrip lens presumes a faithful inverse: space→rgb→clamp→space
// must return the coordinate it left for every REAL (in-gamut) address. Folds fail
// it DEEP — hwb's w+b>100 collapse, hsm's mirror land 20–50% of span away — and
// deserve the ghost. But a space whose inverse is only approximate (coloroid's
// inconsistent hue table, oklch's achromatic hue) fails SHALLOW, a few % past the
// 3% law, and there the lens measures imprecision, not aliasing: at f32 the
// boundary flickers pixel-to-pixel into salt-noise dots over real colors. Probed
// here once per space in f64 over an off-lattice grid: failures with a shallow
// median (< 15% of span) mean no folds to catch — the lens is omitted.
const rtFaith = new Map()
export function rtFaithful(s) {
	if (rtFaith.has(s)) return rtFaith.get(s)
	let ok = true
	try {
		const ch = space[s].range, d = ch.length, spans = ch.map(([a, b]) => b - a)
		const errs = [], N = 9
		for (let n = 0; n < N ** d; n++) {
			let m = n; const v = ch.map((r, k) => { const t = ((m % N) + 0.37) / N; m = Math.floor(m / N); return r[0] + spans[k] * t })
			let rgb; try { rgb = space[s].rgb(...v) } catch { continue }
			if (!rgb.every(u => u >= -0.5 && u <= 255.5)) continue
			let bk; try { bk = space.rgb[s](...rgb.map(u => u < 0 ? 0 : u > 255 ? 255 : u)) } catch { continue }
			if (!bk.every(isFinite)) { errs.push(1); continue }
			const e = Math.max(...bk.map((b, k) => { let dd = Math.abs(b - v[k]); if (ch[k][1] === 360) dd = Math.min(dd, 360 - dd); return dd / spans[k] }))
			if (e > 0.03) errs.push(e)
		}
		errs.sort((a, b) => a - b)
		ok = !errs.length || errs[Math.floor((errs.length - 1) / 2)] >= 0.15
	} catch { ok = true }
	rtFaith.set(s, ok)
	return ok
}

/** Does a display hold this linear light? Within half a code value of its box, in ENCODED units – the kernel's pad (gl.js
 *  uGam): a linear pad is ~16 code values near black. */
const enc = u => u < 0.0031308 ? 12.92 * u : 1.055 * u ** (1 / 2.4) - 0.055
export const displays = lin => lin.every(u => { const e = enc(u); return e >= -0.002 && e <= 1.002 })

// per-value gamut alpha under a lens — the SAME laws the GPU kernel and plane() apply:
// non-physical linear light voids, imaginary chromaticity voids ('off' stops HERE — the
// kernel's uGam=0: the widest honest sweep, bounded only by what is a colour at all),
// the human lens additionally cuts by the object-colour solid, a display lens ghosts
// real-but-undisplayable at 50%. Null when no lens applies (rgb itself, no xyz path).
export const lensFor = (name, gamut) => {
	if (gamut === 'locus') gamut = 'off'   // light = every real light: physicality + the locus, exactly the off law
	if (!gamut || name === 'rgb') return null
	const toXyz = space[name].xyz; if (!toXyz) return null
	const vis = gamut === 'vis', disp = gamut !== 'off' && !vis
	const gLin = space.xyz[{ srgb: 'lrgb', p3: 'p3-linear', rec2020: 'rec2020-linear' }[disp ? gamut : 'srgb'] || 'lrgb']
	const PB = physBound(name), nativeRim = name === 'munsell' && typeof space.munsell.maxChroma === 'function'
		? v => v[2] <= space.munsell.maxChroma(v[0], v[1]) + 1e-4 : null
	// a chromaticity space discards luminance — the honest question is whether the
	// DIRECTION is displayable at any luminance (the GPU kernel's normalisation)
	const chrom = dirOnly(name)
	// a SPECTRAL space's coordinate is a light — a monochromatic line (wavelength), a
	// Planckian radiator (kelvin) — real by definition. The locus test is vacuous there
	// (its samples sit ON the locus polygon, where even-odd flips at random) and the
	// object-colour solid is the wrong body (a laser is no reflectance, yet perfectly
	// visible) — so the human lens shows all of it, and the display ghost normalises to
	// the direction: "can this display show that light at any exposure".
	const spectral = meta[name]?.method === 'spectral'
	const shows = displays
	// …and, as the kernel's round-trip lens, a coordinate that converts to a displayable color yet reads back as another
	// address (HWB's w + b > 100, HSM's mirror) ghosts: into the gamut and back, a channel 3% of its span off and the
	// color moved (ΔXYZ past 0.02 + 0.2%) is a fold, not a color of the shown volume
	const ch = space[name].range, rt = disp && ch.length <= 3 && name !== 'munsell' && rtFaithful(name)
	const D = { srgb: ['rgb', 255], p3: ['p3', 1], rec2020: ['rec2020', 1] }[gamut], hk = rt ? classify(name).angle?.i ?? -1 : -1
	const fold = v => { let c0 = space[name][D[0]](...v)
		if (chrom) { const pk = Math.max(...c0, 1e-5); c0 = c0.map(u => u * D[1] / pk) }
		const bk = space[D[0]][name](...c0.map(u => Math.min(D[1], Math.max(0, u)))), X = toXyz(...v)
		return ch.some(([a, b], k) => { let dq = Math.abs(bk[k] - v[k]); if (k === hk) dq = Math.min(dq, b - a - dq)
			if (dq <= (b - a) * 0.03) return false
			const w = v.slice(); w[k] = bk[k]; const Y = toXyz(...w)
			return !(Math.hypot(X[0] - Y[0], X[1] - Y[1], X[2] - Y[2]) <= 0.02 + 0.002 * Math.hypot(...X)) }) }
	return v => { try {
		if (nativeRim && !nativeRim(v)) return 0   // measured Munsell solid, not its global C≤38 storage box
		let X = toXyz(...v), lin = gLin(...X)
		if (chrom) { const pk = Math.max(lin[0], lin[1], lin[2], 1e-6); lin = lin.map(u => u / pk)
			const t = 50 / Math.max(X[1], 1e-4); X = [X[0] * t, 50, X[2] * t] }
		else if (spectral) { const pk = Math.max(lin[0], lin[1], lin[2], 1e-6); lin = lin.map(u => u / pk) }
		if (!lin.every(u => u > -4 && u < PB)) return 0
		if (spectral) return vis || !disp || shows(lin) ? 1 : 0.5
		if (vis && inSRGB(...X)) return 1   // sRGB's own: inside the solid, so inside the locus too – neither test asked
		if (!visibleXYZ(...X)) return 0
		if (vis) return inVisSolid(...X) ? 1 : 0.5   // beyond the surface solid yet real – the limit ghosts, only non-colors void
		if (disp) return !shows(lin) || (rt && fold(v)) ? 0.5 : 1
		return 1
	} catch { return 0 } }
}
// ── generic 1-D channel gradient (sweep channel ci, hold the rest) → smooth CSS stops.
// Colors interpolate between samples; only a lens-state boundary stays hard, so a real
// range never turns into visible bands while an imaginary span still cuts cleanly to the
// checker. `off` preserves every real color outside display gamuts and voids only coordinates
// that are not physical colors at all. ──
// A ramp is pure in its arguments – the same strip asked again (a re-shelve, a view change, a repaint of the same
// color) is a lookup, not 128 solid tests. Bounded: a drag streams new colors, so the memo restarts past RAMPS entries.
const RAMP = new Map(), RAMPS = 4096
export function ramp(name, vals, ci, min, max, n = 12, gamut = null) {
	const key = `${name}|${vals.join()}|${ci}|${min}|${max}|${n}|${gamut}`, hit = RAMP.get(key)
	if (hit) return hit
	if (RAMP.size >= RAMPS) RAMP.clear()
	const out = ramp1(name, vals, ci, min, max, n, gamut); RAMP.set(key, out); return out
}
function ramp1(name, vals, ci, min, max, n, gamut) {
	const lens = lensFor(name, gamut)
	const sample = f => { const v = vals.slice(); v[ci] = min + (max - min) * f
		let rgb; try { rgb = name === 'rgb' ? v.slice() : space[name].rgb(...v) } catch { rgb = [0, 0, 0] }
		rgb = rgb.map(x => isFinite(x) ? clamp(x, 0, 255) : 0)
		return { rgb, a: lens ? lens(v) : 1, f } }
	const guides = Array.from({ length: n + 1 }, (_, t) => sample(t / n))
	// Float channels avoid baking 8-bit terraces into the approximation. CSS performs
	// the interpolation; these are curve guides, not painted cells.
	const css = ({ rgb, a }) => `rgb(${rgb.map(x => +x.toFixed(4)).join(' ')}${a === 1 ? '' : ` / ${a}`})`
	if (!lens) return guides.map(css)

	// Validity is not necessarily monotone along a channel. TSL's hue sweep crosses
	// several disjoint lobes, and Munsell has narrow gaps/local MacAdam rims that can
	// sit entirely between eight colour guides. Probe validity independently from the
	// colour approximation, then bisect every transition. 128 probes for the selected
	// lens (64 for ordinary physicality) remain far cheaper than a bitmap, while making
	// the CSS catalog and the per-pixel dossier kernel describe the same coordinate set.
	const probeN = Math.max(n, gamut === 'off' ? 64 : 128), edges = []
	let prev = sample(0)
	for (let t = 1; t <= probeN; t++) { const cur = sample(t / probeN)
		if (cur.a !== prev.a) { let lo = prev.f, hi = cur.f, left = prev, right = cur
			for (let k = 0; k < 11; k++) { const mid = sample((lo + hi) / 2)
				if (mid.a === left.a) { lo = mid.f; left = mid } else { hi = mid.f; right = mid } }
			edges.push({ f: (lo + hi) / 2, left, right }) }
		prev = cur }
	const events = guides.slice(1, -1).map(v => ({ f: v.f, guide: v })).concat(edges).sort((a, b) => a.f - b.f || ('guide' in a ? -1 : 1))
	const out = [`${css(guides[0])} 0%`]
	for (const e of events) { const p = (e.f * 100).toFixed(4)
		if (e.guide) out.push(`${css(e.guide)} ${p}%`)
		else out.push(`${css(e.left)} ${p}%`, `${css(e.right)} ${p}%`) }
	out.push(`${css(guides.at(-1))} 100%`)
	return out
}
// ── generic 2-D plane (sweep channels cx,cy) → ImageData painted into ctx ──
// gamut names a display gamut ('srgb' | 'p3' | 'rec2020'): pixels inside render full,
// outside GHOST at 50% — the space stays visible, the lens shows what the chosen
// display can show. The limits are a property of the COORDINATE, not the render mode:
// smooth, stepped and cluster quantizers void and ghost identically (a palette cell is
// a real display colour, but the coordinate under it can still be out of gamut or
// imaginary). Non-physical / non-finite coordinates (linear < −4 or > 500: Luv's v′→0
// pole, CAM16 divergence) void — the formula's continuation there is clamp noise, not
// color. Scene-referred headroom (camera logs decode to linear 8…460) is real light
// and renders clipped, inside the +500 bound.
// quant: a number N snaps the two swept COORDINATES to N cell centres (the exact
// lattice the sliders use), 'web' maps output to web-safe 51s, a function maps triples
export function plane(ctx, s, name, vals, cx, cy, rx, ry, flipY = true, gamut = null, quant = null) {
	if (gamut === 'locus') gamut = 'off'   // light: physicality + the locus, the off law – see lensFor
	const img = ctx.createImageData(s, s), d = img.data
	const qf = typeof quant === 'function' ? quant : null   // function quant maps a whole [r,g,b] triple
	const qc = typeof quant === 'number' ? f => (Math.min(quant - 1, Math.floor(f * quant)) + 0.5) / quant : null
	const q = quant === 'web' ? v => Math.round(v / 51) * 51 : null
	const L = lensFor(name, gamut ?? 'off')   // the planes' one law (the kernel's, lensFor's): no copy of it here
	for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
		const v = vals.slice()
		let fx = x / (s - 1), fy = (flipY ? (s - 1 - y) : y) / (s - 1)
		if (qc) { fx = qc(fx); fy = qc(fy) }
		v[cx] = rx[0] + (rx[1] - rx[0]) * fx
		v[cy] = ry[0] + (ry[1] - ry[0]) * fy
		let rgb = rgbOf(name, v); const i = (y * s + x) * 4
		const a = L ? Math.round(L(v) * 255) : 255   // lensFor's law – the kernel's – per pixel
		if (qf) rgb = qf(rgb)
		d[i] = q ? q(rgb[0]) : rgb[0]; d[i + 1] = q ? q(rgb[1]) : rgb[1]; d[i + 2] = q ? q(rgb[2]) : rgb[2]; d[i + 3] = a
	}
	ctx.putImageData(img, 0, 0)
}

// ── conversion graph: direct (hand-written) edges only — the hub flags compositions
// with .chained on the raw scalar (reachable via .scalar on the batch face) ──
export function pathToRgb(name) {
	if (name === 'rgb') return ['rgb']
	const names = new Set(Object.keys(space))
	const edgesOf = s => Object.keys(space[s] || {}).filter(k => { const f = space[s][k]
		return names.has(k) && typeof f === 'function' && !(f.scalar || f).chained })
	const prev = { [name]: null }, q = [name]
	while (q.length) {
		const s = q.shift()
		if (s === 'rgb') { const p = []; for (let n = 'rgb'; n; n = prev[n]) p.unshift(n); return p }
		for (const t of edgesOf(s)) if (!(t in prev)) { prev[t] = s; q.push(t) }
	}
	return null
}

// ── rotate the hue of a coordinate: polar spaces spin the angle, opponent spaces rotate the (a,b) vector ──
export function rotateHue(cls, vals, deg) {
	const v = vals.slice()
	if (cls.angle) { v[cls.angle.i] = (v[cls.angle.i] + deg + 360) % 360; return v }
	if (cls.bips.length >= 2) {
		const r = deg * Math.PI / 180, a = v[cls.bips[0].i], b = v[cls.bips[1].i]
		v[cls.bips[0].i] = a * Math.cos(r) - b * Math.sin(r)
		v[cls.bips[1].i] = a * Math.sin(r) + b * Math.cos(r)
		return v
	}
	return null
}
