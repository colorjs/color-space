// The xy plate's marks – the CIE 1931 2° chromaticity diagram's furniture, drawn as hairlines over the plate (the
// dossier's #gam2d, whose canvas paints the space's own reach): the spectral locus's wavelengths ticked (380–700 nm,
// js/core.js) and the D65 white; for the hero, the horseshoe filled and the Limits' outlines named – sRGB, Display P3
// and Rec. 2020, triangles from their shipped primaries (js/profile.js), Surface and the horseshoe's own. Every color is a point
// inside the horseshoe; a color space is a region of it – these are the regions every other one is read against.
import { locus, visibleXYZ, space } from './core.js'
import { primariesOf } from './profile.js'
import { VIS16 } from './icons.js'

const TICKS = [460, 480, 520, 540, 560, 580, 600]   // 500 would sit among the y axis's numbers, 620 past the plate's edge
const GAMUTS = [['rgb', 'sRGB'], ['p3', 'P3'], ['rec2020', 'Rec. 2020']]
const D65 = [.3127, .329]   // CIE 15:2004 · IEC 61966-2-1
const f = v => v.toFixed(1)
/** A reference gamut's triangle as a path, from its shipped primaries ('' where it has none), over the mapping `P`. */
export const gamutPath = (s, P) => { const p = primariesOf(s), pt = q => P(q).map(f).join(' '); return p ? `M${pt(p.r)}L${pt(p.g)}L${pt(p.b)}Z` : '' }

// Surface – the object colors' reach – as the Limit's own mark draws it (icons.js VIS16, its 16-box back to xy)
const SURF = VIS16.match(/[\d.]+ [\d.]+/g).map(p => { const [u, v] = p.split(' ').map(Number); return [(u - 1.5) / 17, (15 - v) / 16] })
/** Surface's region as a path over the mapping `P`. */
export const surfacePath = P => 'M' + SURF.map(q => P(q).map(f).join(' ')).join('L') + 'Z'

/** The horseshoe itself, closed by the line of purples, as a path over the mapping `P`. */
export const locusPath = P => 'M' + locus().map(q => P(q).map(f).join(' ')).join('L') + 'Z'

/** The marks' SVG markup for a plate whose xy → user units mapping is `P` ([x, y] → [u, v], v down). */
export function locusMarks(P) {
	const L = locus()
	// a tick: outward from the curve, along its normal (the curve's tangent turned a quarter, away from the white)
	const tick = w => { const i = (w - 380) / 5, [x, y] = L[i], [ax, ay] = L[i - 1], [bx, by] = L[i + 1]
		let nx = by - ay, ny = -(bx - ax); const n = Math.hypot(nx, ny); nx /= n; ny /= n
		if (nx * (x - D65[0]) + ny * (y - D65[1]) < 0) { nx = -nx; ny = -ny }
		const a = P([x, y]), b = P([x + nx * .012, y + ny * .012]), c = P([x + nx * .032, y + ny * .032])
		return `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}"/><text x="${f(c[0])}" y="${f(c[1])}" text-anchor="${nx < -.3 ? 'end' : nx > .3 ? 'start' : 'middle'}" dominant-baseline="middle">${w}</text>` }
	const w = P(D65)
	return `<g class="lt">${TICKS.map(tick).join('')}</g><path class="lw" d="M${f(w[0] - 5)} ${f(w[1])}h10M${f(w[0])} ${f(w[1] - 5)}v10"/>`
}

/** The outlines' names over the mapping `P`, each along its line, outside: a reference gamut's on its blue edge just
 *  below the green corner – where the triangles part (their green corners stand apart; their blue ones nearly meet);
 *  Surface's, `surface`, on its left side's upper run, between the rim and Rec. 2020's edge; the horseshoe's, `light`,
 *  on its rim at 505 nm (both markup-safe). */
export function locusNames(P, surface, light) {
	const edge = (g, b, k, name) => { g = P(g); b = P(b); const q = [g[0] + (b[0] - g[0]) * k, g[1] + (b[1] - g[1]) * k], a = Math.atan2(g[1] - b[1], g[0] - b[0]) * 180 / Math.PI
		return `<text transform="translate(${f(q[0])} ${f(q[1])}) rotate(${f(a)})" y="-4" text-anchor="middle">${name}</text>` }
	const t = SURF.reduce((a, q, i) => q[1] > SURF[a][1] ? i : a, 0), L = locus(), at = w => L[(w - 380) / 5]   // t: Surface's top, the run before it its left side
	return GAMUTS.map(([s, name]) => { const p = primariesOf(s); return p ? edge(p.g, p.b, .15, name) : '' }).join('')
		+ edge(SURF[t - 1], SURF[t - 2], .3, surface) + edge(at(510), at(500), .5, light)
}

/** The xy plate's mapping (gamutPos's, gamGrid's): xy → its 320 × 352 units, v down. */
export const GXY = ([x, y]) => [(x + 0.107) / 0.857 * 320, (1 - (y + 0.055) / 0.955) * 352]
/** A Limit's outline over `P`: a display's triangle, Surface's region, the horseshoe's own. */
export const limPath = (g, P) => g === 'vis' ? surfacePath(P) : g === 'locus' ? locusPath(P) : gamutPath(g === 'srgb' ? 'rgb' : g, P)
export const HERO_LIMS = ['srgb', 'p3', 'rec2020', 'vis', 'locus']   // narrowest first
/** The hero's locus: its outlines and names, the checker and the fill's places (painted later) – one markup for the
 *  build's first paint and the page's own (`home`, `surface`, `light`: its label and two names, markup-safe). */
export const heroLocus = (home, surface, light) => {
	const img = c => `<image class="${c}" width="320" height="352"${c === 'lim' ? ' clip-path="url(#hl-lim)"' : ''}/>`
	return `<a class="hlocus" href="./" aria-label="${home}" data-i18n="aria-label:ui.hero.home"><svg aria-hidden="true" viewBox="36 18 290 318"><defs><clipPath id="hl-lim"><path/></clipPath><pattern id="hl-chk" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12"/><path d="M0 0h6v6H0zM6 6h6v6H6z"/></pattern></defs><path class="chk" d="${locusPath(GXY)}"/>${img('all')}${img('lim')}<g class="lims">${heroNames(surface, light)}</g></svg><i class="cx" aria-hidden="true"></i></a>`
}
/** …its outlines and their names alone (the names in the page's language). */
export const heroNames = (surface, light) => HERO_LIMS.map(g => `<path data-g="${g}" d="${limPath(g, GXY)}"/>`).join('') + locusNames(GXY, surface, light)

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
