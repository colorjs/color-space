/**
 * Two colors weighed – the one in hand and another, as the ⌥ (Alt) hover reads them on the site's instruments and in the
 * Figma and VS Code panel; the distances the site's palette lenses and the panel's gamut mapping use too. Pure numbers,
 * no conversions: a color comes in as its CIELAB (D50, CSS lab()), its Oklab and its relative luminance Y.
 *
 * ΔE2000 – CIEDE2000 (CIE 142-2001) on CIELAB, kL = kC = kH = 1, step for step as Sharma, Wu & Dalal give it: "The
 *   CIEDE2000 color-difference formula: implementation notes, supplementary test data, and mathematical observations",
 *   Color Res. Appl. 30(1):21–30, 2005 – test/measure.js checks their 34 test pairs.
 * ΔEOK – the Euclidean distance in Oklab, CSS Color 4's (#color-difference-OK); one just-noticeable difference there is
 *   0.02, the JND its gamut mapping stops at (#css-gamut-mapping).
 * Contrast – WCAG 2.2's contrast ratio (#dfn-contrast-ratio), (L1 + 0.05) / (L2 + 0.05), L the relative luminance – here
 *   Y of CIE XYZ (D65): for an sRGB color the very relative luminance WCAG defines (#dfn-relative-luminance), and defined
 *   past sRGB too. Its levels: 3:1 for large text and for user-interface parts (SC 1.4.3, 1.4.11), 4.5:1 AA (1.4.3), 7:1
 *   AAA (1.4.6) – met only when reached: a ratio is never rounded up into one.
 */

export const JND = 0.02
export const deltaEOK = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

const R = Math.PI / 180
export function deltaE2000(p, s) {
	const C1 = Math.hypot(p[1], p[2]), C2 = Math.hypot(s[1], s[2]), Cm0 = (C1 + C2) / 2
	const G = 0.5 * (1 - Math.sqrt(Cm0 ** 7 / (Cm0 ** 7 + 25 ** 7)))
	const A1 = p[1] * (1 + G), A2 = s[1] * (1 + G)
	const c1 = Math.hypot(A1, p[2]), c2 = Math.hypot(A2, s[2])
	const h1 = c1 ? (Math.atan2(p[2], A1) / R + 360) % 360 : 0, h2 = c2 ? (Math.atan2(s[2], A2) / R + 360) % 360 : 0
	const dL = s[0] - p[0], dC = c2 - c1
	let dh = h2 - h1; if (c1 * c2 === 0) dh = 0; else if (dh > 180) dh -= 360; else if (dh < -180) dh += 360
	const dH = 2 * Math.sqrt(c1 * c2) * Math.sin(dh / 2 * R)
	const Lm = (p[0] + s[0]) / 2, cm = (c1 + c2) / 2
	let hm = h1 + h2; if (c1 * c2 !== 0) { hm = (h1 + h2) / 2; if (Math.abs(h1 - h2) > 180) hm += (h1 + h2) < 360 ? 180 : -180 }
	const T = 1 - 0.17 * Math.cos((hm - 30) * R) + 0.24 * Math.cos(2 * hm * R) + 0.32 * Math.cos((3 * hm + 6) * R) - 0.20 * Math.cos((4 * hm - 63) * R)
	const SL = 1 + 0.015 * (Lm - 50) ** 2 / Math.sqrt(20 + (Lm - 50) ** 2), SC = 1 + 0.045 * cm, SH = 1 + 0.015 * cm * T
	const RT = -Math.sin(2 * 30 * Math.exp(-(((hm - 275) / 25) ** 2)) * R) * 2 * Math.sqrt(cm ** 7 / (cm ** 7 + 25 ** 7))
	return Math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH))
}

/** WCAG 2.2's contrast ratio of two relative luminances (a luminance below 0, past the black of a wide space, is 0) */
export const contrast = (Y1, Y2) => { const a = Math.max(Y1, 0), b = Math.max(Y2, 0); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) }

/** a and b: { lab, oklab, Y } – their two distances, the distance in JNDs, their contrast */
export const measure = (a, b) => { const deok = deltaEOK(a.oklab, b.oklab); return { de00: deltaE2000(a.lab, b.lab), deok, jnd: deok / JND, ratio: contrast(a.Y, b.Y) } }

/** one channel's step from a to b; a hue (a channel wrapping over its span) the shorter way round */
export const step = (a, b, span) => { const d = b - a; return span ? d - span * Math.round(d / span) : d }

/**
 * One channel's step from a to b as its label, "C +0.031" (a hue the shorter way round): c, the channel (core.js
 * classify: its symbol and range); span, a hue's span (0 for a channel that doesn't wrap); fmt, a channel's printing
 * (core.js fmtc). '' where it doesn't move at its printed precision
 */
export const stepText = (c, a, b, span, fmt) => { const d = step(a, b, span), s = fmt(Math.abs(d), c); return +s ? `${c.sym} ${d < 0 ? '−' : '+'}${s}` : '' }

/**
 * The readout: two pills – the distance chosen (metric 'deok' ΔEOK, else ΔE2000) and the WCAG contrast with the level it
 * reaches (large: the page's name for the 3:1 level, AA for large text)
 */
export function pills(m, metric, large) {
	const r = Math.floor(m.ratio * 100) / 100, lv = r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? large : ''
	return [metric === 'deok' ? `ΔEOK ${m.deok.toFixed(3)}` : `ΔE00 ${m.de00.toFixed(1)}`, `${r.toFixed(2)}:1${lv ? ` ${lv}` : ''}`]
}
