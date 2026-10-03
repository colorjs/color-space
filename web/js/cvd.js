// Vision lens — color-vision-deficiency simulation as SVG filters on :root.
//
//   protan, deutan  Machado, Oliveira & Fernandes 2009, severity 1.0 — one 3×3 matrix on
//                   linear-light RGB. The same matrices Chromium (to 3 dp) and Firefox (6 dp)
//                   DevTools ship. doi:10.1109/TVCG.2009.113; table: Machado 2010, UFRGS thesis,
//                   as published in colour-science's CVD_MATRICES_MACHADO2010.
//   tritan          Brettel, Viénot & Mollon 1997 — two half-plane projections picked by a
//                   separation plane. doi:10.1364/JOSAA.14.002647. Machado's own paper declines
//                   to model tritanopia, so its tritan matrix is not used and nothing here calls
//                   it that. Values: DaltonLens 0.1.5 (Smith & Pokorny 1975 cones, sRGB primaries,
//                   white as neutral), the numbers of libDaltonLens svg/cvd_svg_filters.html;
//                   DaltonLens master has since moved to a Judd-Vos-corrected model (mean
//                   ΔE2000 0.25 apart).
//
// The filters must run in linear light: each <filter> sets color-interpolation-filters=
// "linearRGB" explicitly (Chromium processes a filter defined under display:none in gamma
// sRGB otherwise), and the defs sit in a zero-size, never display:none, <svg>. Apply with
// :root[data-cvd=protan]{filter:url(#cvd-protan)} — a filter on the root element keeps
// position:fixed descendants fixed (Filter Effects 1); on any other element it would not.
// CSS filter functions run in gamma sRGB, so they can't do this. Severity is 1.0 only: the
// table's 0.1 steps need no interpolation, and both reference libraries interpolate wrongly
// between them. Readouts stay the true color; simulate() gives the simulated one.

// rows of the 3×3 that maps linear RGB → simulated linear RGB (Machado 2010 table, severity 1.0)
export const MACHADO = {
	protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
	deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
}

// Brettel tritan in linear RGB: T1 where n·rgb ≥ 0, else T2; n is the separation-plane normal
// scaled to length 10 — the filter's selector row (+1·A − 0.2 → alpha ≥ 0.8 exactly when n·rgb ≥ 0
// for opaque input, which :root always is)
export const BRETTEL_TRITAN = {
	T1: [[1.01354, 0.14268, -0.15622], [-0.01181, 0.87561, 0.13619], [0.07707, 0.81208, 0.11085]],
	T2: [[0.93337, 0.19999, -0.13336], [0.05809, 0.82565, 0.11626], [-0.37923, 1.13825, 0.24098]],
	n: [7.92482, -5.66475, -2.26007],
}

const MACHADO_CITE = 'Machado, Oliveira & Fernandes 2009, severity 1.0, doi:10.1109/TVCG.2009.113'
export const LENSES = [
	{ id: 'none', label: 'Typical vision' },
	{ id: 'protan', label: 'Protanopia', cite: MACHADO_CITE },
	{ id: 'deutan', label: 'Deuteranopia', cite: MACHADO_CITE },
	{ id: 'tritan', label: 'Tritanopia', cite: 'Brettel, Viénot & Mollon 1997, doi:10.1364/JOSAA.14.002647' },
]

// feColorMatrix values: 4 rows × 5 columns, row-major (a00 … a34) — R G B A offset
const values = (m, alpha = [0, 0, 0, 1, 0]) => [...m.map((r) => [...r, 0, 0]), alpha].map((r) => r.join(' ')).join('  ')
const matrix = (m, attrs = '', alpha) => `<feColorMatrix type="matrix"${attrs} values="${values(m, alpha)}"/>`
const filter = (id, body) => `<filter id="cvd-${id}" color-interpolation-filters="linearRGB">${body}</filter>`

/** The lens's <svg> defs — insert once anywhere in <body>; never inside display:none. */
export function defs() {
	const { T1, T2, n } = BRETTEL_TRITAN
	return '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden">'
		+ filter('protan', matrix(MACHADO.protan))
		+ filter('deutan', matrix(MACHADO.deutan))
		+ filter('tritan', matrix(T1, ' in="SourceGraphic" result="P1"', [...n, 1, -0.2])
			+ '<feComponentTransfer in="P1" result="P1"><feFuncA type="discrete" tableValues="0 0 0 0 1"/></feComponentTransfer>'
			+ matrix(T2, ' in="SourceGraphic" result="P2"')
			+ '<feBlend in="P1" in2="P2" mode="normal"/>')
		+ '</svg>'
}

const mul = (m, v) => m.map((r) => Math.min(1, Math.max(0, r[0] * v[0] + r[1] * v[1] + r[2] * v[2])))

/**
 * What the lens shows for one color, for readouts (the filter itself never touches values).
 * @param {number[]} lin linear-light sRGB, 0–1 (space.rgb.lrgb; back with space.lrgb.rgb)
 * @param {'protan'|'deutan'|'tritan'|'none'} id
 * @returns {number[]} simulated linear sRGB, clamped 0–1 as the filter clamps
 */
export function simulate(lin, id) {
	if (MACHADO[id]) return mul(MACHADO[id], lin)
	if (id !== 'tritan') return lin.slice()
	const { T1, T2, n } = BRETTEL_TRITAN
	return mul(n[0] * lin[0] + n[1] * lin[1] + n[2] * lin[2] >= 0 ? T1 : T2, lin)
}
