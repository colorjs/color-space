/**
 * CSS Color 4 notation — a color as a native CSS string, only for the spaces CSS can
 * actually write (everything else has no textual notation, and inventing one would read
 * as a standard that doesn't exist). Pure: values in, string out, no conversion.
 *
 * The one serializer: the MCP `css` tool and the site (web/index.html) import this table —
 * build-site stages it beside lut.js.
 * Decimals meet CSS Color 4's own serialization minimums: 8-bit
 * round trip for rgb()/hsl()/hwb() (#serializing-sRGB-values), ≥ 3 places for lab()/lch()
 * (#serializing-lab-lch), ≥ 5 for oklab()/oklch() (#serializing-oklab-oklch), and the
 * predefined-precision table for color() — 10 bits display-p3 / a98-rgb, 12 srgb-linear /
 * prophoto-rgb / rec2020, 16 xyz (#serializing-color-function-values); prophoto-rgb and rec2020
 * carry one more place, which an 8-bit sRGB round trip needs (measured: every notation returns
 * 8-bit sRGB within half a level). Trailing zeros dropped, as CSS serializes them.
 * @see https://drafts.csswg.org/css-color-4/
 *
 * lab()/lch() are D50 like this library's lab/lchab; color() takes the predefined RGB
 * spaces as 0–1 and xyz as Y = 1 (ours is 0–100, hence /100).
 * color(rec2020 …) is rec2020-display: the CSS Color 4 draft defines it with a pure 2.4 gamma
 * (BT.1886 Annex 1, black lift 0). This library's rec2020 carries the BT.2020 OETF, so the same
 * numbers there would name a different color.
 * @see https://drafts.csswg.org/css-color-4/#predefined-rec2020
 */

const n = (x) => Math.round(x) || 0                       // || 0 — never "-0"
const trim = (x, d) => String(+x.toFixed(d) || 0)         // ≤ d decimals, trailing zeros dropped, never "-0"
const keep = (x, d) => (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d)   // exactly d decimals – a live readout keeps its width; never "-0.0"

/** color()'s predefined spaces (#predefined): the name → [library id, the scale of its channels (CSS's 1 → ours), the
 *  places it is written to]. Read under every name, written under the first of each id but srgb's (rgb() writes it) –
 *  xyz as xyz-d65, its explicit name */
export const PREDEF = { 'display-p3': ['p3', 1, 4], 'a98-rgb': ['a98rgb', 1, 4], 'prophoto-rgb': ['prophoto', 1, 5], rec2020: ['rec2020-display', 1, 5],
	'xyz-d65': ['xyz', 100, 5], 'xyz-d50': ['xyz-d50', 100, 5], 'srgb-linear': ['lrgb', 1, 4], srgb: ['rgb', 255, 4], xyz: ['xyz', 100, 5] }

// the table over a number formatter: CSS's own serialization (trailing zeros dropped), or fixed places
const table = (f) => { const fn = (name, d, k = 1) => (v) => `color(${name} ${v.map((x) => f(x / k, d)).join(' ')})`, written = {}
	for (const [name, [id, k, d]] of Object.entries(PREDEF)) if (id !== 'rgb') written[id] ??= fn(name, d, k)
	return {
	rgb: (v) => `rgb(${n(v[0])} ${n(v[1])} ${n(v[2])})`,
	hsl: (v) => `hsl(${f(v[0], 1)} ${f(v[1], 1)}% ${f(v[2], 1)}%)`,
	hwb: (v) => `hwb(${f(v[0], 1)} ${f(v[1], 1)}% ${f(v[2], 1)}%)`,
	lab: (v) => `lab(${f(v[0], 3)}% ${f(v[1], 3)} ${f(v[2], 3)})`,
	lchab: (v) => `lch(${f(v[0], 3)}% ${f(v[1], 3)} ${f(v[2], 3)})`,
	oklab: (v) => `oklab(${f(v[0], 5)} ${f(v[1], 5)} ${f(v[2], 5)})`,
	oklch: (v) => `oklch(${f(v[0], 5)} ${f(v[1], 5)} ${f(v[2], 3)})`,
	...written,
} }

/** library space id → its CSS Color 4 serializer */
export const CSS = table(trim)
/** the same notations at fixed places (40.0%, not 40%) – for a value shown live, whose length must not jump */
export const CSS_FIXED = table(keep)
/** …and at the atlas's display places: OKLab and OKLCH a place shorter (4; a hue 2) – measured over a 3-step sRGB grid, a
 *  round trip lands on the same 8-bit color for 99.7% (OKLab) and 99.9% (OKLCH) of colors, never more than a level off;
 *  every other notation as CSS_FIXED */
export const CSS_DISPLAY = { ...CSS_FIXED,
	oklab: (v) => `oklab(${keep(v[0], 4)} ${keep(v[1], 4)} ${keep(v[2], 4)})`,
	oklch: (v) => `oklch(${keep(v[0], 4)} ${keep(v[1], 4)} ${keep(v[2], 2)})` }

/** the library spaces CSS can write natively */
export const CSSABLE = new Set(Object.keys(CSS))

/** `space`'s values as a CSS string; undefined when CSS has no notation for the space */
export const css = (space, v) => CSS[space]?.(v)

/** sRGB 0–255 → #rrggbb (rounded, clamped) */
export const hex = (rgb) => '#' + rgb.slice(0, 3).map((x) => Math.min(255, Math.max(0, n(x))).toString(16).padStart(2, '0')).join('')

// Where CSS clamps at parsed-value time, a value past the bound makes the string name a
// different color: rgb() components clamp to [0, 255] (#rgb-functions); hsl() and hwb()
// resolve to sRGB (#the-hsl-notation, #the-hwb-notation) and a negative hsl() saturation
// clamps to 0% (#the-hsl-notation); lightness clamps for lab()/lch() to [0, 100]
// (#specifying-lab-lch) and for oklab()/oklch() to [0, 1] (#specifying-oklab-oklch), and a
// negative lch()/oklch() chroma to 0 (same sections). color() keeps out-of-range values
// (#color-function).
const SRGB = new Set(['rgb', 'hsl', 'hwb']), LMAX = { lab: 100, lchab: 100, oklab: 1, oklch: 1 }
const FLOOR1 = new Set(['hsl', 'lchab', 'oklch'])   // second channel (saturation / chroma) clamps below 0
const EPS = 1e-4

/** Does css(space, v) name this color (to CSS's serialization precision)? `srgb` = whether the color sits inside sRGB. */
export const exact = (space, v, srgb) => v.every(Number.isFinite)
	&& (!FLOOR1.has(space) || v[1] >= -EPS)
	&& (SRGB.has(space) ? !!srgb : !(space in LMAX) || (v[0] >= -EPS && v[0] <= LMAX[space] + EPS))

// ── the reverse: a CSS Color 4 string → [library space id, values in its conventional ranges]
// The notations above plus what CSS accepts besides: #rgb[a] / #rrggbb[aa], the named colors
// and transparent, legacy comma syntax, rgba()/hsla(), percentages (each channel's own
// reference range), `none` (= 0), hue units (deg, grad, rad, turn), color(srgb …) and
// color(rec2020 …). Alpha is read and returned apart; it never enters the values.
// color(rec2020 …) is CSS's 2.4-gamma signal (see the header): rec2020-display, not this
// library's BT.2020-OETF rec2020.
// @see https://drafts.csswg.org/css-color-4/#color-syntax
/** each function's channels' reference ranges – what 100% is (#percentages-of-the-reference-range); 0 where none applies */
export const PCT = { rgb: [255, 255, 255], hsl: [0, 100, 100], hwb: [0, 100, 100], lab: [100, 125, 125], lchab: [100, 150, 0], oklab: [1, 0.4, 0.4], oklch: [1, 0.4, 0] }
const FN = { rgb: 'rgb', rgba: 'rgb', hsl: 'hsl', hsla: 'hsl', hwb: 'hwb', lab: 'lab', lch: 'lchab', oklab: 'oklab', oklch: 'oklch' }
const HUE = { rgb: -1, hsl: 0, hwb: 0, lab: -1, lchab: 2, oklab: -1, oklch: 2 }
/** a hue's units, in degrees (#angles) */
export const ANGLE = { deg: 1, grad: 0.9, rad: 180 / Math.PI, turn: 360 }
const num = (t, pct) => {
	if (t === 'none') return 0
	const m = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(%|deg|grad|rad|turn)?$/.exec(t)
	if (!m) return NaN
	const x = +m[1]
	return m[2] === '%' ? x / 100 * pct : m[2] ? x * ANGLE[m[2]] : x
}

/**
 * Parse a CSS color string.
 * @param {string} str e.g. '#ff8000', 'rebeccapurple', 'oklch(70% 0.1 50)', 'color(display-p3 1 0.5 0)'
 * @param {Record<string, number[]>} [names] the CSS named colors (web/js/names.js), for names
 * @returns {{space: string, values: number[], alpha: number} | undefined} undefined when not a CSS color
 */
export const parse = (str, names) => {
	const s = String(str).trim().toLowerCase()
	if (s[0] === '#') {
		const h = s.slice(1)
		if (!/^(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(h)) return
		const d = h.length < 5 ? [...h].map((c) => parseInt(c + c, 16)) : h.match(/../g).map((c) => parseInt(c, 16))
		return { space: 'rgb', values: d.slice(0, 3), alpha: d.length > 3 ? d[3] / 255 : 1 }
	}
	if (s === 'transparent') return { space: 'rgb', values: [0, 0, 0], alpha: 0 }
	if (names && Object.hasOwn(names, s)) return { space: 'rgb', values: names[s].slice(0, 3), alpha: 1 }
	const m = /^([a-z][a-z0-9-]*)\(\s*(.*?)\s*\)$/.exec(s)
	if (!m) return
	const [main, a = '1'] = m[2].split(/\s*\/\s*/)
	let alpha = num(a, 1)
	let toks = main.split(/\s*,\s*|\s+/).filter(Boolean)
	let id, k = 1, pct
	if (m[1] === 'color') {
		const p = PREDEF[toks[0]]
		if (!p) return
		;[id, k] = p; toks = toks.slice(1); pct = [1, 1, 1]
	} else {
		id = FN[m[1]]
		if (!id) return
		pct = PCT[id]
		if (/,/.test(main) && toks.length === 4 && !/\//.test(m[2])) { alpha = num(toks[3], 1); toks.length = 3 }   // legacy rgba(r, g, b, a)
	}
	if (toks.length !== 3) return
	const v = toks.map((t, i) => num(t, pct[i]) * (i === HUE[id] ? 1 : k))
	if ((id === 'hsl' || id === 'hwb') && toks.slice(1).some((t) => !/%$/.test(t) && t !== 'none' && /,/.test(main))) return   // legacy hsl() needs percentages
	if (!v.every(Number.isFinite)) return
	return { space: id, values: v, alpha: Number.isFinite(alpha) ? Math.min(1, Math.max(0, alpha)) : 1 }
}
