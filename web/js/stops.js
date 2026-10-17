// Colors in hand beyond one: a SEQUENCE (a comma list – separate colors, each its own) or a GRADIENT (CSS gradient
// syntax – stops blended along a line – or its short form, the colors joined by a dash: `red – blue`, read "red to
// blue"; `red - blue` and `red..blue` read the same). The page keeps them as {s, vals} stops; this module reads and writes their text
// and blends between them. Pure: no DOM, no page state – the page passes its own single-color parser in.
//
// A gradient blends as CSS does: in the space its color-interpolation-method names (`in oklch longer hue`), else – none
// named – in gamma-encoded sRGB when every color is written in a legacy sRGB syntax (hex, a name, rgb(), hsl(), hwb()),
// in Oklab otherwise. The short form is a linear gradient blended in Oklab, or in the method that closes it
// (`red – blue in oklch longer hue`); a stop may carry its place (`red – blue 70%`). A hue channel takes the method's arc; an achromatic stop's hue is powerless and takes its
// neighbour's, so a blend from white rotates no hue.
// @see https://drafts.csswg.org/css-color-4/#interpolation
// @see https://drafts.csswg.org/css-images-4/#linear-gradients
import { classify, hueIdx } from './core.js'

// CSS's interpolation spaces, by their CSS names, as the library's ids; any library id reads as itself (`in cam16`)
const CSS_SPACE = { srgb: 'rgb', 'srgb-linear': 'lrgb', 'display-p3': 'p3', 'a98-rgb': 'a98rgb', 'prophoto-rgb': 'prophoto', rec2020: 'rec2020',
	lab: 'lab', oklab: 'oklab', xyz: 'xyz', 'xyz-d65': 'xyz', 'xyz-d50': 'xyz-d50', hsl: 'hsl', hwb: 'hwb', lch: 'lchab', oklch: 'oklch' }
const CSS_NAME = Object.fromEntries(Object.entries(CSS_SPACE).map(([k, v]) => [v, k]))   // …and back, for the text
const HUES = ['shorter', 'longer', 'increasing', 'decreasing']
const FN = /^(repeating-)?(linear|radial|conic)-gradient\(([\s\S]*)\)$/i
const LEGACY = /^(#|rgba?\(|hsla?\(|hwb\(|[a-z]+$)/i   // hex, rgb(), hsl(), hwb() or a bare name – CSS's legacy sRGB syntaxes

// the short form's joint: the word – `indigo to red`, as a gradient is said – or a dash between colors – ` – `, `–`, `—`,
// a hyphen spaced or not (`red-blue`: one before a digit is a number's minus, not a joint) – or `..`; written as ` – `, the typographic joint
export const DASH = /\s+to\s+|\s*[–—]\s*|\s+-\s+|-(?=\s*[#a-z(])|\.\./iy, JOIN = ' – '
// the joint at i, its length; 0 where there is none
export const dashAt = (str, i) => { DASH.lastIndex = i; const m = DASH.exec(str); return m ? m[0].length : 0 }
// top-level separators only (commas, or the short form's dashes) – a color's own parens keep theirs
export const splitTop = (str, sep = ',') => { const out = []; let d = 0, cur = ''
	for (let i = 0; i < str.length; i++) { const c = str[i]; if (c === '(') d++; else if (c === ')') d = Math.max(0, d - 1)
		const n = d ? 0 : sep === DASH ? dashAt(str, i) : str.startsWith(sep, i) ? sep.length : 0
		if (n) { out.push(cur.trim()); cur = ''; i += n - 1 } else cur += c }
	out.push(cur.trim()); return out.filter(Boolean) }
const METHOD = /\bin\s+([a-z0-9-]+)(?:\s+(shorter|longer|increasing|decreasing)\s+hue)?/i
const methodOf = m => ({ space: CSS_SPACE[m[1].toLowerCase()] || m[1].toLowerCase(), hue: (m[2] || 'shorter').toLowerCase(), named: true })

// a part's trailing positions (`red 20%`, `red 20% 40%`) off its color; lengths other than % read as unplaced
const stopOf = part => { const m = part.match(/^(.*?)((?:\s+-?\d*\.?\d+%)+)?$/), color = (m?.[1] || part).trim()
	const pos = (m?.[2] || '').trim().split(/\s+/).filter(Boolean).map(p => parseFloat(p) / 100)
	return { color, pos } }

/** `str` as a gradient, or null: { fn, head, mix: { space, hue, named }, stops: [{ c, pos: number|null }] } – `parse`
 *  reads one color to the page's {s, vals} (null for none). `head` keeps the geometry (an angle, `to right`, a shape)
 *  as written; a stop with two positions is two stops. */
export function parseGradient(str, parse) {
	const m = str.trim().match(FN); if (!m) return parseShort(str, parse)
	const parts = splitTop(m[3]); if (parts.length < 2) return null
	let head = '', mix = null
	// the first part is the line's geometry and its interpolation method, when it isn't a color
	if (!parse(stopOf(parts[0]).color)) { head = parts.shift(); const im = head.match(METHOD); if (im) mix = methodOf(im) }
	const stops = readStops(parts, parse); if (!stops) return null
	mix ??= { space: stops.every(x => LEGACY.test(x.src)) ? 'rgb' : 'oklab', hue: 'shorter', named: false }
	return { fn: (m[1] || '') + m[2].toLowerCase() + '-gradient', head, mix, stops: placed(stops) } }

// the short form: `a to b to c`, a method closing it – a linear gradient, Oklab unless named
const TAIL = /\s+(in\s+[a-z0-9-]+(?:\s+(?:shorter|longer|increasing|decreasing)\s+hue)?)\s*$/i
function parseShort(str, parse) {
	const parts = splitTop(str.trim(), DASH); if (parts.length < 2) return null
	const tail = parts.at(-1).match(TAIL); if (tail) parts[parts.length - 1] = parts.at(-1).slice(0, tail.index)
	const stops = readStops(parts, parse); if (!stops) return null
	return { fn: 'linear-gradient', head: '', mix: tail ? methodOf(tail[1].match(METHOD)) : { space: 'oklab', hue: 'shorter', named: true }, stops: placed(stops) } }

// each part a color and its places; null when one isn't a color
function readStops(parts, parse) { const stops = []
	for (const part of parts) { const { color, pos } = stopOf(part)
		if (!color && pos.length === 1) continue   // a bare hint: where the midpoint falls – the line stays even
		const c = parse(color); if (!c) return null
		if (!pos.length) stops.push({ c, pos: null, src: color }); else for (const p of pos.slice(0, 2)) stops.push({ c, pos: p, src: color }) }
	return stops.length < 2 ? null : stops }

// CSS's stop fix-up: the ends at 0 and 1 when unplaced, every position at least the one before, the unplaced spread evenly
const placed = stops => { const p = stops.map(x => x.pos)
	if (p[0] == null) p[0] = 0; if (p.at(-1) == null) p[p.length - 1] = 1
	for (let i = 1; i < p.length; i++) if (p[i] != null) p[i] = Math.max(p[i], Math.max(...p.slice(0, i).filter(x => x != null)))
	for (let i = 1; i < p.length; i++) if (p[i] == null) { let j = i; while (p[j] == null) j++
		for (let k = i; k < j; k++) p[k] = p[i - 1] + (p[j] - p[i - 1]) * (k - i + 1) / (j - i + 1) }
	return stops.map((x, i) => ({ c: x.c, pos: p[i] })) }

/** The color `f` of the way from `a` to `b`, both coordinates of `space`, as CSS interpolates: channel by channel, a hue
 *  along `hue`'s arc and taken from the other end where it is powerless (an achromatic end, chroma ≈ 0). */
export function mix(space, a, b, f, hue = 'shorter') {
	const cls = classify(space), hi = hueIdx(cls), ci = cls.mags?.[0]?.i ?? -1
	a = a.slice(); b = b.slice()
	if (hi >= 0 && ci >= 0) { const span = cls.ch[hi].max - cls.ch[hi].min, tiny = (cls.ch[ci].max - cls.ch[ci].min) * 1e-4
		if (Math.abs(a[ci]) <= tiny) a[hi] = b[hi]; else if (Math.abs(b[ci]) <= tiny) b[hi] = a[hi]
		let d = b[hi] - a[hi]
		if (hue === 'shorter') { if (d > span / 2) d -= span; else if (d < -span / 2) d += span }
		else if (hue === 'longer') { if (d > 0 && d < span / 2) d -= span; else if (d < 0 && d > -span / 2) d += span }
		else if (hue === 'increasing') { if (d < 0) d += span }
		else if (hue === 'decreasing') { if (d > 0) d -= span }
		const h = a[hi] + d * f, lo = cls.ch[hi].min
		return a.map((x, i) => i === hi ? ((h - lo) % span + span) % span + lo : x + (b[i] - x) * f) }
	return a.map((x, i) => x + (b[i] - x) * f) }

/** A gradient's colors along its whole run, `n` a segment, in its mixing space: [[...vals]] – `to(c, space)` brings a
 *  stop into that space (the page's conversion). The path the planes and the solid draw. */
export const path = (g, to, n = 24) => { const out = [], { space, hue } = g.mix
	for (let k = 0; k + 1 < g.stops.length; k++) { const a = to(g.stops[k].c, space), b = to(g.stops[k + 1].c, space); if (!a || !b) continue
		for (let j = k ? 1 : 0; j <= n; j++) out.push(mix(space, a, b, j / n, hue)) }
	return out }

/** The gradient back as text: its function, its head as written (or the method a named mix needs), each stop in the
 *  page's notation (`say`), placed where it isn't where CSS would put it unplaced. */
const isEven = g => g.stops.every((x, i) => Math.abs(x.pos - i / (g.stops.length - 1)) < 1e-6)
const stopText = (g, say, even = isEven(g)) => x => say(x.c) + (even ? '' : ` ${+(x.pos * 100).toFixed(1)}%`)
const methodText = mx => `in ${CSS_NAME[mx.space] || mx.space}${mx.hue !== 'shorter' ? ` ${mx.hue} hue` : ''}`
export const gradientText = (g, say) => { const head = g.head || (g.mix.named ? methodText(g.mix) : '')
	return `${g.fn}(${head ? head + ', ' : ''}${g.stops.map(stopText(g, say)).join(', ')})` }

/** The gradient in the short form when it has one – a linear gradient with no geometry (`red – blue in oklch`), its
 *  method written unless Oklab's shorter arc; null for any other (an angle, a radial, a repeating one). */
export const shortText = (g, say) => g.fn !== 'linear-gradient' || g.head && !/^in\s/i.test(g.head.trim()) ? null
	: g.stops.map(stopText(g, say)).join(JOIN) + (g.mix.space === 'oklab' && g.mix.hue === 'shorter' ? '' : ' ' + methodText(g.mix))

export { HUES }
