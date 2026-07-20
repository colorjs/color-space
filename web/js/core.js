// Shared COLOR MATH only — every study brings its own design + interaction.
// Metadata drives everything: type each channel, then sample gamut-correct fields.
import space from '../../dist/color-space.js'

// one data artifact for the site and everything else — fetched in the browser,
// imported as a JSON module in node (generate-landing); top-level await makes
// every importer wait transparently
const dataURL = new URL('../../data.json', import.meta.url)
export const data = dataURL.protocol === 'file:'
	? (await import(dataURL, { with: { type: 'json' } })).default
	: await (await fetch(dataURL)).json()
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
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v
export const hex = rgb => '#' + rgb.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase()
const D = Math.PI / 180

// ── classify each channel from metadata ──
//   tone (achromatic axis) · angle (hue, wraps 0–360) · bipolar (a/b) · magnitude (chroma/sat)
export function classify(name) {
	const ch = (meta[name]?.channels || []).map((c, i) => ({ sym: c.symbol, min: c.min, max: c.max, name: c.name, i }))
	for (const c of ch) {
		if (c.max === 360) c.type = 'angle'
		else if (/Light|Value|Intensity|Tone|Bright|Luma/.test(c.name)) c.type = 'tone'  // by name — 'V' means Value in HSV but chrominance in Luv
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
	return { name, ch, tone, angle, bips, mags, archetype }
}

// convert a space's raw channel values → clamped sRGB
// non-finite components (coordinates outside the space's domain, e.g. ICtCp I=0 with chroma) clamp to 0
const px = x => isFinite(x) ? clamp(Math.round(x), 0, 255) : 0

// how much linear light a coordinate may claim before it's formula noise:
// scene-referred / HDR spaces really reach hundreds of diffuse whites, SDR display spaces don't
export const physBound = name => (meta[name]?.referred === 'scene' || meta[name]?.dynamic === 'hdr') ? 500 : 4

// ── the spectral locus: the boundary of colour itself ──
// A chromaticity outside the horseshoe (the CIE 1931 2° spectral curve, closed by the
// line of purples) is IMAGINARY — no spectral power distribution produces it, at any
// luminance. This is the law the HUMAN lens applies everywhere it is offered: the xy
// panel draws it, the planes and the sliders void past it. It is deliberately NOT the
// object-colour (Rösch–MacAdam) solid the 3D shape is built from: that solid is a
// bounded REFLECTIVE gamut under illuminant E, and a colour above its ceiling — a
// bright emissive white, a laser — is still perfectly visible.
let LOCUS = null
export function locus() {
	if (LOCUS) return LOCUS
	const pts = []
	for (let nm = 380; nm <= 700; nm += 5) {
		const [X, Y, Z] = space.wavelength.xyz(nm)
		const s = X + Y + Z
		pts.push([X / s, Y / s])
	}
	return LOCUS = pts
}
/** Is this chromaticity a colour at all? Even-odd crossing over the closed locus. */
function visibleXY(x, y) {
	const P = locus()
	let c = false
	for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
		const a = P[i], b = P[j]
		if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c
	}
	return c
}
/** Is this XYZ a colour at all? Black is; anything off the locus is not. */
export const visibleXYZ = (X, Y, Z) => {
	const s = X + Y + Z
	if (!isFinite(s)) return false
	if (s <= 1e-9) return X > -1e-6 && Y > -1e-6 && Z > -1e-6   // black, not a negative coordinate
	return visibleXY(X / s, Y / s)
}
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

// ── generic 1-D channel gradient (sweep channel ci, hold the rest) → array of hex stops ──
export function ramp(name, vals, ci, min, max, n = 12) {
	const out = []
	for (let t = 0; t <= n; t++) { const v = vals.slice(); v[ci] = min + (max - min) * t / n; out.push(hex(rgbOf(name, v))) }
	return out
}
// ── generic 2-D plane (sweep channels cx,cy) → ImageData painted into ctx ──
// gamut names a display gamut ('srgb' | 'p3' | 'rec2020'): pixels inside render full,
// outside GHOST at ~10% — the space stays visible, the lens shows what the chosen
// display can show. Cluster quantizers (websafe/names/ΔE) produce real display colors
// by construction, so no ghosting applies there. Non-physical / non-finite
// coordinates (linear < −4 or > 500: Luv's v′→0 pole, CAM16 divergence) void — the
// formula's continuation there is clamp noise, not color. Scene-referred headroom
// (camera logs decode to linear 8…460) is real light and renders clipped, inside
// the +500 bound.
// quant: a number N snaps the two swept COORDINATES to N cell centres (the exact
// lattice the sliders use), 'web' maps output to web-safe 51s, a function maps triples
export function plane(ctx, s, name, vals, cx, cy, rx, ry, flipY = true, gamut = null, quant = null) {
	const img = ctx.createImageData(s, s), d = img.data
	const qf = typeof quant === 'function' ? quant : null   // function quant maps a whole [r,g,b] triple
	const qc = typeof quant === 'number' ? f => (Math.min(quant - 1, Math.floor(f * quant)) + 0.5) / quant : null
	const q = quant === 'web' ? v => Math.round(v / 51) * 51 : null
	const toXyz = name !== 'rgb' && space[name].xyz
	const lens = gamut && gamut !== 'off'
	// the human lens cuts by the spectral locus, not by a display gamut — so it keeps
	// the sRGB linear map for the physical-ceiling test and voids imaginary coordinates
	const vis = gamut === 'vis'
	const gLin = toXyz && space.xyz[{ srgb: 'lrgb', p3: 'p3-linear', rec2020: 'rec2020-linear' }[lens && !vis ? gamut : 'srgb']]
	const cluster = !!qf || quant === 'web'
	// physical ceiling: scene-referred / HDR spaces really carry big light (camera logs
	// decode to linear 8…460); an SDR display space past ~4× diffuse white is formula
	// noise (Luv's v'→0 pole, CAM16 divergence), not color
	const PB = physBound(name)
	for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
		const v = vals.slice()
		let fx = x / (s - 1), fy = (flipY ? (s - 1 - y) : y) / (s - 1)
		if (qc) { fx = qc(fx); fy = qc(fy) }
		v[cx] = rx[0] + (rx[1] - rx[0]) * fx
		v[cy] = ry[0] + (ry[1] - ry[0]) * fy
		let rgb = rgbOf(name, v); const i = (y * s + x) * 4
		let a = 255
		if (gLin) { try { const X = toXyz(...v), lin = gLin(...X)
			if (!lin.every(u => u > -4 && u < PB)) a = 0
			else if (vis) { if (!cluster && !visibleXYZ(...X)) a = 0 }   // imaginary: not a colour at any luminance
			else if (lens && !cluster && !lin.every(u => u >= -0.005 && u <= 1.005)) a = 128
		} catch { a = 0 } }
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

// ── mix two coordinates of the same space; hue channels (0–360) arc shorter or longer around the wheel ──
export function mixInSpace(name, v1, v2, t, huePath = 'shorter') {
	const ch = meta[name]?.channels || []
	return v1.map((a, i) => {
		const b = v2[i]
		if (ch[i]?.max === 360) {
			let d = ((b - a + 540) % 360) - 180
			if (huePath === 'longer' && d !== 0) d = d > 0 ? d - 360 : d + 360
			return (a + d * t + 360) % 360
		}
		return a + (b - a) * t
	})
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
