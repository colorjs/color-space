/**
 * color-space/util – the toolkit the atlas itself works with, around the conversions: a CSS color string read and written,
 * two colors mixed in any space, the display gamut holding one, how far apart two are, their WCAG contrast, and how a
 * color-vision deficiency sees one. Every color comes and goes as `space` (a registry id) and its values in that space's
 * conventional ranges, as everywhere in this library. The numeric helpers the spaces share come with it.
 *
 * It imports the whole registry: a single space's own module (color-space/oklch.js) stays a kilobyte or so without it.
 */
import space from './index.js'
import { parse as cssParse, css } from './css.js'
import NAMES from './web/js/names.js'
import { deltaE2000, deltaEOK, contrast as wcag } from './web/js/measure.js'
import { simulate } from './web/js/cvd.js'
import visibility from './web/js/visible.js'

export * from './math.js'

const V = visibility(space)
const to = (from, id, v) => from === id ? v.slice() : space[from][id](...v)

/**
 * Read a CSS Color 4 string: hex, a named color, rgb(), hsl(), hwb(), lab(), lch(), oklab(), oklch(), color().
 * @param {string} str e.g. '#ff8000', 'rebeccapurple', 'oklch(70% 0.1 50)'
 * @returns {{space: string, values: number[], alpha: number} | undefined} undefined when it is no CSS color
 */
export const parse = (str) => cssParse(str, NAMES)

/**
 * Write values as a CSS Color 4 string, for the spaces CSS can write.
 * @param {string} id the values' space
 * @param {number[]} v its values
 * @returns {string | undefined} undefined where CSS has no notation for the space
 */
export const format = (id, v) => css(id, v)

/**
 * Mix two colors of one space, `t` of the way from `a` to `b` – a hue channel (0–360) the short way round, or the
 * long one (CSS Color 4 #hue-interpolation).
 * @param {string} id the space both colors are in, and the mix is made in
 * @param {number[]} a @param {number[]} b
 * @param {number} [t=0.5]
 * @param {'shorter'|'longer'} [hue='shorter']
 * @returns {number[]}
 */
export const mix = (id, a, b, t = 0.5, hue = 'shorter') => {
	const r = space[id].range
	return a.map((x, i) => {
		if (r[i][0] !== 0 || r[i][1] !== 360) return x + (b[i] - x) * t
		let d = ((b[i] - x + 540) % 360) - 180
		if (hue === 'longer' && d !== 0) d -= Math.sign(d) * 360
		return (x + d * t + 360) % 360
	})
}

/**
 * The tightest of CSS Color 4's predefined display gamuts holding a color – each channel within half a code value.
 * @param {string} id @param {number[]} v
 * @returns {'srgb'|'p3'|'rec2020'|'out'|null} 'out' past all three, null for no color at all (off the spectral locus)
 */
export const gamut = (id, v) => V.tightGamut(id, v)

/**
 * Is it a color at all – a light some spectrum makes – not a coordinate past the spectral locus?
 * @param {string} id @param {number[]} v
 */
export const visible = (id, v) => { try { return V.visibleXYZ(...to(id, 'xyz', v)) } catch { return false } }

/**
 * How far apart two colors are: CIEDE2000 (CIE 142-2001, as Sharma, Wu & Dalal 2005 give it) on CIELAB D50, or the
 * Euclidean distance in Oklab (CSS Color 4 #color-difference-OK; a just-noticeable step is 0.02).
 * @param {string} id the colors' space
 * @param {number[]} a @param {number[]} b
 * @param {'2000'|'ok'} [method='2000']
 */
export const deltaE = (id, a, b, method = '2000') => method === 'ok'
	? deltaEOK(to(id, 'oklab', a), to(id, 'oklab', b))
	: deltaE2000(to(id, 'lab', a), to(id, 'lab', b))

/**
 * WCAG 2.2's contrast ratio of two colors (#dfn-contrast-ratio), 1–21: 4.5 is AA for text, 7 AAA, 3 large text.
 * @param {string} id @param {number[]} a @param {number[]} b
 */
export const contrast = (id, a, b) => wcag(to(id, 'xyz', a)[1] / 100, to(id, 'xyz', b)[1] / 100)

/**
 * A color as a color-vision deficiency sees it, in the same space: protanopia and deuteranopia by Machado, Oliveira &
 * Fernandes 2009 at full severity, tritanopia by Brettel, Viénot & Mollon 1997 – over sRGB, clamped to it as a display is.
 * @param {string} id @param {number[]} v
 * @param {'protan'|'deutan'|'tritan'|'none'} kind
 * @returns {number[]}
 */
export const cvd = (id, v, kind) => to('lrgb', id, simulate(to(id, 'lrgb', v), kind))
