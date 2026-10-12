// The locus – the hero's one figure of the science: the CIE 1931 2° chromaticity diagram, drawn softly. The spectral
// locus (380–700 nm, js/core.js), closed by the line of purples (dashed – no single wavelength makes those), its
// wavelengths ticked; the gamuts of sRGB, Display P3 and Rec. 2020 as triangles from their shipped primaries
// (js/profile.js); the D65 white; and the current color at its own chromaticity, the site's rhombus. Every color is a
// point inside the horseshoe; a color space is a region of it. Hairlines in the ink, so it sits on either paper.
import { locus } from './core.js'
import { primariesOf } from './profile.js'

const S = 400, Y0 = .85, X0 = .76   // xy → user units: x 0 … .76, y 0 … .85 (y up), 400 units to 1 – the labels' margin round it
const P = ([x, y]) => [x * S, (Y0 - y) * S]
const f = v => v.toFixed(1)
const pt = p => P(p).map(f).join(' ')
const TICKS = [460, 480, 500, 520, 540, 560, 580, 600, 620]
const GAMUTS = [['rgb', 'sRGB'], ['p3', 'P3'], ['rec2020', 'Rec. 2020']]   // each named along its blue edge, near the green corner

/** The figure's markup – one `<svg>` the hero places (CSS); `at` says where (left | right). */
export function locusSVG(at = 'right') {
	const L = locus(), first = L[0], last = L[L.length - 1]
	const curve = 'M' + L.map(pt).join('L')
	// a tick: outward from the curve, along its normal (the curve's tangent turned a quarter, away from the white)
	const tick = w => { const i = (w - 380) / 5, [x, y] = L[i], [ax, ay] = L[i - 1], [bx, by] = L[i + 1]
		let nx = by - ay, ny = -(bx - ax); const n = Math.hypot(nx, ny); nx /= n; ny /= n
		if (nx * (x - .3127) + ny * (y - .329) < 0) { nx = -nx; ny = -ny }
		const a = P([x, y]), b = P([x + nx * .012, y + ny * .012]), c = P([x + nx * .03, y + ny * .03])
		return `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}"/><text x="${f(c[0])}" y="${f(c[1])}" text-anchor="${nx < -.3 ? 'end' : nx > .3 ? 'start' : 'middle'}" dominant-baseline="middle">${w}</text>` }
	// a gamut: its triangle, its name set along its blue edge just below the green corner, on the outside – where the
	// triangles part (their green corners stand apart; their blue ones nearly meet)
	const tri = ([s, name]) => { const p = primariesOf(s); if (!p) return ''
		const g = P(p.g), b = P(p.b), q = [g[0] + (b[0] - g[0]) * .15, g[1] + (b[1] - g[1]) * .15], a = Math.atan2(g[1] - b[1], g[0] - b[0]) * 180 / Math.PI
		return `<path class="lg" d="M${pt(p.r)}L${pt(p.g)}L${pt(p.b)}Z"/><text transform="translate(${f(q[0])} ${f(q[1])}) rotate(${f(a)})" y="-4" text-anchor="middle">${name}</text>` }
	const w = P([.3127, .329])
	return `<svg class="hlocus" data-at="${at}" viewBox="-36 -14 ${S * X0 + 56} ${S * Y0 + 28}" aria-hidden="true">`
		+ `<path class="ll" d="${curve}"/><path class="lp" d="M${pt(last)}L${pt(first)}"/>`
		+ `<g class="lt">${TICKS.map(tick).join('')}</g>`
		+ GAMUTS.map(tri).join('')
		+ `<path class="lw" d="M${f(w[0] - 4)} ${f(w[1])}h8M${f(w[0])} ${f(w[1] - 4)}v8"/>`
		+ `<rect class="lc" width="12" height="12" x="-6" y="-6" transform="rotate(45)" style="display:none"/></svg>`
}

/** Moves the current color's rhombus to its chromaticity – XYZ in, nothing drawn where there is no light. */
export function locusMark(svg, [X, Y, Z], fill) {
	const m = svg.querySelector('.lc'), s = X + Y + Z
	const on = s > 1e-6 && isFinite(s); m.style.display = on ? '' : 'none'; if (!on) return
	const [x, y] = P([X / s, Y / s])
	m.setAttribute('transform', `translate(${f(x)} ${f(y)}) rotate(45)`); m.style.fill = fill
}
