// Shared COLOR MATH only — every study brings its own design + interaction.
// Metadata drives everything: type each channel, then sample gamut-correct fields.
import space from '../../dist/color-space.js'
import meta from '../../meta.js'
export { space, meta }

export const spaceCount = Object.keys(space).filter(k => space[k] && space[k].name).length
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
// gamut=true outlines the sRGB region (tested via the UNCLAMPED linear-rgb path):
// everything renders at full strength — clamped colors plateau outside — and a 1px
// contour in `line` (0 black / 255 white, by theme) marks the true gamut boundary;
// clip=true voids everything outside sRGB instead (the "srgb layer" — no contour,
// the void already delineates it)
// quant: a number N snaps the two swept COORDINATES to N cell centres (the exact
// lattice the sliders use), 'web' maps output to web-safe 51s, a function maps triples
export function plane(ctx, s, name, vals, cx, cy, rx, ry, flipY = true, gamut = false, quant = null, clip = false, line = 0) {
	const img = ctx.createImageData(s, s), d = img.data
	const lrgb = gamut && name !== 'rgb' && space[name].lrgb
	const mask = lrgb ? new Uint8Array(s * s) : null
	const qf = typeof quant === 'function' ? quant : null   // function quant maps a whole [r,g,b] triple
	const qc = typeof quant === 'number' ? f => (Math.min(quant - 1, Math.floor(f * quant)) + 0.5) / quant : null
	const q = quant === 'web' ? v => Math.round(v / 51) * 51 : null
	for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
		const v = vals.slice()
		let fx = x / (s - 1), fy = (flipY ? (s - 1 - y) : y) / (s - 1)
		if (qc) { fx = qc(fx); fy = qc(fy) }
		v[cx] = rx[0] + (rx[1] - rx[0]) * fx
		v[cy] = ry[0] + (ry[1] - ry[0]) * fy
		let rgb = rgbOf(name, v); const i = (y * s + x) * 4
		let a = 255
		if (mask) { try { const lin = lrgb(...v)
			const inG = lin.every(u => u >= -0.005 && u <= 1.005)
			mask[y * s + x] = inG ? 1 : 0
			// non-physical coordinates (beyond any spectral color, e.g. v′<0 in Luv at extreme
			// chroma, CAM16 inverse divergence) render as void — the formula's analytic
			// continuation there is meaningless clamp-flip noise, not color
			if (!inG && (clip || !lin.every(u => Math.abs(u) < 4))) a = 0
		} catch { a = 0 } }
		if (qf) rgb = qf(rgb)
		d[i] = q ? q(rgb[0]) : rgb[0]; d[i + 1] = q ? q(rgb[1]) : rgb[1]; d[i + 2] = q ? q(rgb[2]) : rgb[2]; d[i + 3] = a
	}
	// contour: in-gamut pixels bordering out-of-gamut ones (skipped when clipping — the void shows it)
	if (mask && !clip) for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
		const m = y * s + x; if (!mask[m]) continue
		if ((x > 0 && !mask[m - 1]) || (x < s - 1 && !mask[m + 1]) || (y > 0 && !mask[m - s]) || (y < s - 1 && !mask[m + s])) {
			const k = m * 4
			d[k] = d[k + 1] = d[k + 2] = line
		}
	}
	ctx.putImageData(img, 0, 0)
}

// ── conversion graph: direct (hand-written) edges only — chained fns are flagged by register() ──
export function pathToRgb(name) {
	if (name === 'rgb') return ['rgb']
	const names = new Set(Object.keys(space))
	const edgesOf = s => Object.keys(space[s] || {}).filter(k => names.has(k) && typeof space[s][k] === 'function' && !space[s][k].chained)
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
