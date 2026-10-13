// The xy plate's marks – the CIE 1931 2° chromaticity diagram's furniture, drawn as hairlines over the plate (the
// dossier's #gam2d, whose canvas paints the space's own reach): the spectral locus (380–700 nm, js/core.js), closed by
// the line of purples (dashed – no single wavelength makes those), its wavelengths ticked; the gamuts of sRGB,
// Display P3 and Rec. 2020 as triangles from their shipped primaries (js/profile.js), each named along its blue edge;
// the D65 white. Every color is a point inside the horseshoe; a color space is a region of it – these are the regions
// every other one is read against.
import { locus, visibleXYZ, space } from './core.js'
import { primariesOf } from './profile.js'

const TICKS = [460, 480, 520, 540, 560, 580, 600]   // 500 would sit among the y axis's numbers, 620 past the plate's edge
const GAMUTS = [['rgb', 'sRGB'], ['p3', 'P3'], ['rec2020', 'Rec. 2020']]
const D65 = [.3127, .329]   // CIE 15:2004 · IEC 61966-2-1
const f = v => v.toFixed(1)

/** The marks' SVG markup for a plate whose xy → user units mapping is `P` ([x, y] → [u, v], v down). */
export function locusMarks(P) {
	const L = locus(), pt = p => P(p).map(f).join(' ')
	// a tick: outward from the curve, along its normal (the curve's tangent turned a quarter, away from the white)
	const tick = w => { const i = (w - 380) / 5, [x, y] = L[i], [ax, ay] = L[i - 1], [bx, by] = L[i + 1]
		let nx = by - ay, ny = -(bx - ax); const n = Math.hypot(nx, ny); nx /= n; ny /= n
		if (nx * (x - D65[0]) + ny * (y - D65[1]) < 0) { nx = -nx; ny = -ny }
		const a = P([x, y]), b = P([x + nx * .012, y + ny * .012]), c = P([x + nx * .032, y + ny * .032])
		return `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}"/><text x="${f(c[0])}" y="${f(c[1])}" text-anchor="${nx < -.3 ? 'end' : nx > .3 ? 'start' : 'middle'}" dominant-baseline="middle">${w}</text>` }
	// a gamut: its triangle, its name set along its blue edge just below the green corner, on the outside – where the
	// triangles part (their green corners stand apart; their blue ones nearly meet)
	const tri = ([s, name]) => { const p = primariesOf(s); if (!p) return ''
		const g = P(p.g), b = P(p.b), q = [g[0] + (b[0] - g[0]) * .15, g[1] + (b[1] - g[1]) * .15], a = Math.atan2(g[1] - b[1], g[0] - b[0]) * 180 / Math.PI
		return `<path class="lg" d="M${pt(p.r)}L${pt(p.g)}L${pt(p.b)}Z"/><text transform="translate(${f(q[0])} ${f(q[1])}) rotate(${f(a)})" y="-4" text-anchor="middle">${name}</text>` }
	const w = P(D65)
	return `<path class="ll" d="M${L.map(pt).join('L')}"/><path class="lp" d="M${pt(L[L.length - 1])}L${pt(L[0])}"/>`
		+ `<g class="lt">${TICKS.map(tick).join('')}</g>` + GAMUTS.map(tri).join('')
		+ `<path class="lw" d="M${f(w[0] - 5)} ${f(w[1])}h10M${f(w[0])} ${f(w[1] - 5)}v10"/>`
}

/** The horseshoe filled – each chromaticity in its own color, at sRGB's full saturation (clipped: the display shows what it
 *  can), nothing past the locus – as a PNG for an `<image>`, `w` × `h` pixels over the plate's `P` mapping inverted by `Q`. */
export function locusFill(Q, w, h) {
	const cv = Object.assign(document.createElement('canvas'), { width: w, height: h }), g = cv.getContext('2d'), img = g.createImageData(w, h), d = img.data
	const enc = c => c <= .0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - .055
	for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const [x, y] = Q([(i + .5) / w, (j + .5) / h])
		if (y <= .005 || !visibleXYZ(x / y, 1, (1 - x - y) / y)) continue
		const l = space.xyz.lrgb(x / y * 100, 100, (1 - x - y) / y * 100), c = l.map(v => Math.max(0, v)), m = Math.max(...c) || 1, k = (j * w + i) * 4
		for (let n = 0; n < 3; n++) d[k + n] = enc(c[n] / m) * 255
		d[k + 3] = 255 }
	g.putImageData(img, 0, 0); return cv.toDataURL()
}
