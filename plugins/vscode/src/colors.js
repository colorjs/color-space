/**
 * CSS color literals in source text: found, read into the library's spaces, and written back in their own notation.
 * The inverse of css.js, for the notations a stylesheet holds: #hex, the named colors, rgb()/rgba(), hsl()/hsla(),
 * hwb(), lab(), lch(), oklab(), oklch() and color() with its predefined spaces. Pure: text in, values out, and back.
 * @see https://drafts.csswg.org/css-color-4/
 *
 * Reading follows CSS's parse-time rules: `none` is 0, a percentage is its fraction of the channel's reference range
 * (#lab-colors, #ok-lab, #color-function: 100% = 125 for lab a/b, 150 for lch C, 0.4 for oklab a/b and oklch C, 1 in
 * color()), hues take deg/rad/grad/turn, and the values CSS clamps at parse time are clamped (css.js `exact` lists
 * them: rgb() to [0, 255], a negative saturation or chroma to 0, lab/lch lightness to [0, 100], oklab/oklch to [0, 1],
 * alpha to [0, 1]). Anything else inside the parentheses – var(), calc(), relative `from` syntax – is not a literal.
 *
 * color(rec2020 …) is the library's rec2020-display: CSS defines it with a pure 2.4 gamma (BT.1886), while the
 * library's rec2020 carries the BT.2020 OETF (css.js), so the same numbers there would name a different color.
 */
import space from '../../../index.js'
import { CSS } from '../../../css.js'
import NAMES from '../../../web/js/names.js'
import { cssShort } from '../../figma/src/notation.js'
import { gamutMap, DEST } from '../../figma/src/gamut.js'

export const fx = (x, d) => String(+x.toFixed(d) || 0)   // ≤ d decimals, trailing zeros dropped, never "-0"
export const clamp = (x, lo, hi) => x < lo ? lo : x > hi ? hi : x

// color(<ident> …): the library space, the scale of its channels (CSS's 1 → ours), the places css.js writes
const PREDEFINED = {
	'srgb': ['rgb', 255, 4], 'srgb-linear': ['lrgb', 1, 4], 'display-p3': ['p3', 1, 4], 'a98-rgb': ['a98rgb', 1, 4],
	'prophoto-rgb': ['prophoto', 1, 5], 'rec2020': ['rec2020-display', 1, 5], 'xyz': ['xyz', 100, 5], 'xyz-d65': ['xyz', 100, 5], 'xyz-d50': ['xyz-d50', 100, 5],
}
const ANGLE = { '': 1, deg: 1, rad: 180 / Math.PI, grad: 0.9, turn: 360 }
// CSS's legacy notations: bound to sRGB, they can't name a wider color (and a gradient of them mixes in sRGB)
const LEGACY = new Set(['hex', 'named', 'rgb', 'hsl', 'hwb'])
/** The gamut a notation can name: 'srgb', 'p3', or null for any (oklch(), lab(), color()…) – its own `bound`, else CSS's. */
export const boundOf = nt => nt.bound !== undefined ? nt.bound : LEGACY.has(nt.fn) ? 'srgb' : null

const FN = /(?<![\w-])(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(([^()]*)\)/gi
const HEX = /(?<![\w&#-])#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![\w-])/gi
const NAMED = new RegExp(`(?<![\\w$@.#-])(${[...Object.keys(NAMES), 'transparent'].sort((a, b) => b.length - a.length).join('|')})(?![\\w-])`, 'gi')
const TOK = /\s*(,|\/|none|[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?(?:%|deg|rad|grad|turn)?)\s*/iy

// the arguments as tokens: numbers {n, u}, `none`, ',' and '/'; null if anything else is in there
function tokens(s) {
	const out = []
	for (let i = 0; i < s.length;) {
		TOK.lastIndex = i
		const m = TOK.exec(s)
		if (!m) return s.slice(i).trim() ? null : out
		const t = m[1].toLowerCase()
		out.push(t === ',' || t === '/' ? t : t === 'none' ? { none: true } : { n: parseFloat(t), u: t.match(/[a-z%]*$/)[0] })
		i = TOK.lastIndex
	}
	return out
}

// the channels and the alpha: modern `a b c [/ alpha]`, or legacy `a, b, c[, alpha]` where the function allows it
function split(ts, legacyOk) {
	if (!ts) return null
	const legacy = ts.includes(',')
	if (legacy) {
		if (!legacyOk || ts.some(t => t === '/' || t.none) || !(ts.length === 5 || ts.length === 7)) return null
		if (ts.some((t, i) => (i % 2 === 1) !== (t === ','))) return null
		return { ch: [ts[0], ts[2], ts[4]], a: ts[6], legacy }
	}
	if (ts.length === 3 && !ts.includes('/')) return { ch: ts, a: undefined, legacy }
	if (ts.length === 5 && ts[3] === '/' && !ts.slice(0, 3).includes('/') && ts[4] !== '/') return { ch: ts.slice(0, 3), a: ts[4], legacy }
	return null
}

// a channel: `none` is 0, a percentage its fraction of `full`; a unit that isn't % is invalid (NaN)
const num = (t, full) => t.none ? 0 : t.u === '%' ? t.n / 100 * full : t.u ? NaN : t.n
const hue = t => t.none ? 0 : t.u in ANGLE ? t.n * ANGLE[t.u] : NaN
const alphaOf = t => t === undefined ? 1 : clamp(num(t, 1), 0, 1)

/**
 * One CSS function's arguments → { space, v, alpha, nt } (nt: the notation, kept for writing back), or null.
 * @param {string} name  the function, as written (rgba, HSL, oklch…)
 * @param {string} body  what's between its parentheses
 */
export function parseFn(name, body) {
	const fn = name.toLowerCase(), base = fn === 'rgba' ? 'rgb' : fn === 'hsla' ? 'hsl' : fn
	if (fn === 'color') {
		const m = body.match(/^\s*([a-z0-9-]+)\s+([\s\S]*)$/i), def = m && PREDEFINED[m[1].toLowerCase()]
		const p = def && split(tokens(m[2]), false)
		if (!p) return null
		const [id, k] = def, v = p.ch.map(t => num(t, 1) * k)
		return ok({ space: id, v, alpha: alphaOf(p.a), nt: { fn: 'color', ident: m[1].toLowerCase(), alpha: p.a !== undefined } })
	}
	const p = split(tokens(body), base === 'rgb' || base === 'hsl')
	if (!p) return null
	const nt = { fn: base, name, legacy: p.legacy, alpha: p.a !== undefined }, [a, b, c] = p.ch, alpha = alphaOf(p.a)
	if (p.legacy && base === 'rgb' && new Set(p.ch.map(t => t.u === '%')).size > 1) return null   // legacy rgb(): all numbers or all percentages
	if (p.legacy && base === 'hsl' && (b.u !== '%' || c.u !== '%')) return null                    // legacy hsl(): percentages
	if (base === 'rgb') return ok({ space: 'rgb', v: p.ch.map(t => clamp(num(t, 255), 0, 255)), alpha, nt })
	if (base === 'hsl') return ok({ space: 'hsl', v: [hue(a), Math.max(0, num(b, 100)), num(c, 100)], alpha, nt })
	if (base === 'hwb') return ok({ space: 'hwb', v: [hue(a), num(b, 100), num(c, 100)], alpha, nt })
	nt.pct = a.u === '%'
	if (base === 'lab') return ok({ space: 'lab', v: [clamp(num(a, 100), 0, 100), num(b, 125), num(c, 125)], alpha, nt })
	if (base === 'lch') return ok({ space: 'lchab', v: [clamp(num(a, 100), 0, 100), Math.max(0, num(b, 150)), hue(c)], alpha, nt })
	if (base === 'oklab') return ok({ space: 'oklab', v: [clamp(num(a, 1), 0, 1), num(b, 0.4), num(c, 0.4)], alpha, nt })
	if (base === 'oklch') return ok({ space: 'oklch', v: [clamp(num(a, 1), 0, 1), Math.max(0, num(b, 0.4)), hue(c)], alpha, nt })
	return null
}
const ok = r => r.v.every(Number.isFinite) && Number.isFinite(r.alpha) ? r : null

/**
 * #rgb, #rgba, #rrggbb or #rrggbbaa (the digits, without #) → { space, v, alpha, nt }. argb: Android's order, where the
 * alpha leads (#argb, #aarrggbb: developer.android.com/guide/topics/resources/more-resources#Color, Color.parseColor).
 */
export function parseHex(digits, argb = false) {
	const d = digits.length < 5 ? [...digits].map(c => c + c).join('') : digits, alpha = digits.length === 4 || digits.length === 8
	const bytes = d.match(/../g).map(h => parseInt(h, 16)), [r, g, b, a = 255] = argb && alpha ? [...bytes.slice(1), bytes[0]] : bytes
	return { space: 'rgb', v: [r, g, b], alpha: a / 255, nt: { fn: 'hex', short: digits.length < 5, upper: /[A-F]/.test(digits) && !/[a-f]/.test(digits), alpha, argb: argb && alpha } }
}

/**
 * The color literals in a text, in order: [{ start, end, text, space, v, alpha, nt }] (start and end: offsets in it).
 * @param {string} text
 * @param {{ named?: boolean, argb?: boolean }} [o]  named: the CSS color keywords count too (stylesheets; in code, `red` is
 *   too often a word); argb: an 8- or 4-digit #hex leads with its alpha (Android)
 */
export function scan(text, { named = false, argb = false } = {}) {
	const out = []
	for (const m of text.matchAll(FN)) { const c = parseFn(m[1], m[2]); if (c) out.push({ start: m.index, end: m.index + m[0].length, text: m[0], ...c }) }
	for (const m of text.matchAll(HEX)) out.push({ start: m.index, end: m.index + m[0].length, text: m[0], ...parseHex(m[1], argb) })
	if (named) for (const m of text.matchAll(NAMED)) {
		const k = m[1].toLowerCase(), rgb = k === 'transparent' ? [0, 0, 0] : NAMES[k]
		out.push({ start: m.index, end: m.index + m[0].length, text: m[0], space: 'rgb', v: rgb.slice(), alpha: k === 'transparent' ? 0 : 1, nt: { fn: 'named' } })
	}
	// a hex inside a function's arguments can't be (they hold numbers only), so nothing overlaps; order by place
	return out.sort((a, b) => a.start - b.start)
}

/**
 * What a literal sets: a CSS property, a key, an attribute – read from the text before it on its line, else from the start
 * of its declaration (a value over several lines: `background:` then a gradient below it); '' if none.
 */
export function nameAt(text, start) {
	const m = text.slice(text.lastIndexOf('\n', start - 1) + 1, start).match(/["']?([\w$-]+)["']?\s*[:=]\s*[^:;{}=]*$/)
	if (m) return m[1]
	const d = Math.max(text.lastIndexOf(';', start - 1), text.lastIndexOf('{', start - 1), text.lastIndexOf('}', start - 1)) + 1
	return (text.slice(d, start).match(/^\s*([\w-]+)\s*:/) || [])[1] || ''
}

const GRADIENT = /(?<![\w-])(?:repeating-)?(?:linear|radial|conic)-gradient\(/gi
/**
 * The gradients in a text: [{ start, end, in, hue }] – where each runs (its literals inside are its stops, in order),
 * the color space its `in` names, if any, and its hue interpolation method (CSS Color 4 #color-interpolation-method).
 */
export function gradients(text) {
	const out = []
	for (const m of text.matchAll(GRADIENT)) {
		let i = m.index + m[0].length, depth = 1
		for (; i < text.length && depth; i++) depth += text[i] === '(' ? 1 : text[i] === ')' ? -1 : 0
		if (depth) continue   // unclosed: still being typed
		const im = text.slice(m.index + m[0].length, i - 1).split(',')[0].match(/\bin\s+([a-z0-9-]+)(?:\s+(shorter|longer|increasing|decreasing)\s+hue)?/i)
		out.push({ start: m.index, end: i, in: im ? im[1].toLowerCase() : null, hue: im && im[2] ? im[2].toLowerCase() : 'shorter' })
	}
	return out
}

// <color-space> of a color interpolation method → the library space (rec2020 is rec2020-display, see above)
const MIX = { srgb: 'rgb', 'srgb-linear': 'lrgb', 'display-p3': 'p3', 'a98-rgb': 'a98rgb', 'prophoto-rgb': 'prophoto', rec2020: 'rec2020-display', lab: 'lab', lch: 'lchab', oklab: 'oklab', oklch: 'oklch', xyz: 'xyz', 'xyz-d65': 'xyz', 'xyz-d50': 'xyz-d50', hsl: 'hsl', hwb: 'hwb' }
/**
 * The space a gradient mixes its stops in, as the panel draws it: { space, hue }, or null for a space the library can't
 * mix in. CSS Color 4 #interpolation-space: the space its `in` names, else Oklab – except that colors in the legacy
 * sRGB notations (#hex, named, rgb(), hsl(), hwb()) mix, all of them, in gamma-encoded sRGB, as browsers do.
 */
export function mixOf(g, stops) {
	if (g.in) return MIX[g.in] ? { space: MIX[g.in], hue: g.hue } : null
	return { space: stops.every(l => LEGACY.has(l.nt.fn)) ? 'rgb' : 'oklab', hue: g.hue }
}

const URL_REF = /(?<![\w-])url\(\s*(['"]?)([^'")\s]+)\1\s*\)/gi
/** The url() references in a text: [{ start, end, ref }]. */
export const urls = text => [...text.matchAll(URL_REF)].map(m => ({ start: m.index, end: m.index + m[0].length, ref: m[2] }))

/**
 * The panel's file color profile for these literals: sRGB when each of them is bound to sRGB (#hex, rgb(), hsl()…, which
 * can't name a wider color), else the configured gamut.
 */
export const profileOf = (lits, gamut) => gamut === 'srgb' || (lits.length && lits.every(l => boundOf(l.nt) === 'srgb')) ? 'SRGB' : 'DISPLAY_P3'

// the panel's file profile → the library space its {r, g, b} 0..1 are in, and that space's scale
const DOC = { SRGB: ['rgb', 255], DISPLAY_P3: ['p3', 1] }

/** A literal's color as the panel's {r, g, b}: 0..1 in the profile's RGB, unclamped – a wider color reads past 0..1. */
export function toDoc(lit, profile) {
	const [id, k] = DOC[profile], v = lit.space === id ? lit.v : space[lit.space][id](...lit.v)
	return { r: v[0] / k, g: v[1] / k, b: v[2] / k }
}

/**
 * The writers of the notations beyond CSS (code.js, data.js): fn → (nt, to, alpha) → text, where to(id) is the color in
 * the library space id. Each module registers its own.
 */
export const WRITE = {}

/** A literal's text with its values replaced: parts are [{ at, len }] offsets into it, strs their new text, in order. */
export const splice = (text, parts, strs) => parts.map((p, i) => [p, strs[i]]).filter(([, s]) => s != null).sort((a, b) => b[0].at - a[0].at)
	.reduce((t, [p, s]) => t.slice(0, p.at) + s + t.slice(p.at + p.len), text)

/**
 * A color, as the panel writes it ({r, g, b} 0..1 in the profile's RGB, and its alpha), in a notation `nt`: a literal's
 * own (written back as it was written – #hex keeps its case and length, legacy rgba(…, …) its commas, a constructor its
 * labels and number forms) or one of the formats (notation.js FORMATS: { fn: 'oklch' }…). A notation bound to sRGB gets
 * the color mapped into sRGB first (CSS Color 4 gamut mapping, gamut.js), as the Figma panel's copy row does.
 */
export function serialize(nt, c, profile, alpha, text = '') {
	let [from, k] = DOC[profile], v = [c.r * k, c.g * k, c.b * k]
	if (boundOf(nt) === 'srgb' && from !== 'rgb') {
		const m = gamutMap(space[from].oklch(...v), DEST.rgb)
		v = m.mapped ? m.rgb.map(x => x * 255) : space[from].rgb(...v)   // inside sRGB: converted exactly, not through the mapping
		from = 'rgb'
	}
	const to = id => id === from ? v : space[from][id](...v)
	if (WRITE[nt.fn]) return WRITE[nt.fn](nt, to, clamp(alpha, 0, 1), text)
	const fn = nt.fn === 'lchab' ? 'lch' : nt.fn === 'p3' ? 'color' : nt.fn
	const a = alpha < 1 || nt.alpha, A = fx(clamp(alpha, 0, 1), 3)
	if (fn === 'hex' || fn === 'named') {
		const rgb = to('rgb'), bytes = (a ? (nt.argb ? [alpha * 255, ...rgb] : [...rgb, alpha * 255]) : rgb).map(x => Math.round(clamp(x, 0, 255)))
		const short = nt.short && bytes.every(b => b % 17 === 0)
		const s = '#' + bytes.map(b => short ? (b / 17).toString(16) : b.toString(16).padStart(2, '0')).join('')
		return nt.upper ? s.toUpperCase() : s
	}
	const name = nt.name || fn
	if (fn === 'rgb' || fn === 'hsl') {
		const w = to(fn), parts = fn === 'rgb' ? w.map(x => fx(clamp(x, 0, 255), 0)) : [fx(w[0], 1), fx(w[1], 1) + '%', fx(w[2], 1) + '%']
		return nt.legacy ? `${name}(${parts.join(', ')}${a ? `, ${A}` : ''})` : `${name}(${parts.join(' ')}${a ? ` / ${A}` : ''})`
	}
	let s
	if (fn === 'color') {
		const ident = nt.ident || 'display-p3', [id, scale, d] = PREDEFINED[ident]
		s = `color(${ident} ${to(id).map(x => fx(x / scale, d)).join(' ')})`
	}
	else if (fn === 'oklch' || fn === 'oklab') {
		const w = to(fn)
		s = cssShort(fn, w)
		if (nt.pct) s = s.replace(/\(\S+/, `(${fx(w[0] * 100, 1)}%`)   // lightness as written: 62.3%, not 0.623
	}
	else s = CSS[fn === 'lch' ? 'lchab' : fn](to(fn === 'lch' ? 'lchab' : fn))
	if (name !== fn) s = name + s.slice(fn.length)   // the function's name as written (LAB(…), Oklch(…))
	return a ? s.replace(/\)$/, ` / ${A})`) : s
}
