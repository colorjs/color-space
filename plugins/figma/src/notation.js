/**
 * oklch() and oklab() for a person to read and paste: three decimals on lightness, chroma and a/b, three significant
 * digits on the hue. CSS's own serialization keeps five decimals for a lossless round trip (css.js); at three the
 * rounding moves a color by at most ~0.004 ΔEOK (L ±0.0005, C ±0.0005, H ±0.5° at chroma ≤ 0.4), a fifth of the
 * 0.02 just-noticeable difference (gamut.js JND). Every other notation is css.js's.
 */
import space from '../../../index.js'
import { css, hex } from '../../../css.js'
import { gamutMap, DEST } from './gamut.js'

const d3 = x => String(+x.toFixed(3) || 0)   // trailing zeros dropped, never "-0"
const s3 = x => String(+(+x).toPrecision(3) || 0)
const SHORT = {
	oklch: v => `oklch(${d3(v[0])} ${d3(Math.max(0, v[1]))} ${s3(((v[2] % 360) + 360) % 360)})`,
	oklab: v => `oklab(${d3(v[0])} ${d3(v[1])} ${d3(v[2])})`,
}

/** `format`'s values as a CSS string, oklch() and oklab() at three digits */
export const cssShort = (format, v) => SHORT[format] ? SHORT[format](v) : css(format, v)

/** the formats a color is copied and generated in: css.js notations, and hex */
export const FORMATS = [['oklch', 'OKLCH'], ['oklab', 'OKLab'], ['lchab', 'LCH'], ['lab', 'Lab'], ['p3', 'P3'], ['hsl', 'HSL'], ['hwb', 'HWB'], ['rgb', 'RGB'], ['hex', 'Hex']]
const SRGB_ONLY = new Set(['rgb', 'hsl', 'hwb', 'hex'])

/**
 * A Figma color ({r, g, b} 0..1 in the file's profile) with its alpha as CSS in `format` → [value, note]. The formats
 * bound to sRGB (rgb, hsl, hwb, hex) gamut-map a wider color into sRGB (CSS Color 4) and say so in the note.
 */
export function cssOf(format, c, a, profile) {
	const p3 = profile === 'DISPLAY_P3', vals = p3 ? [c.r, c.g, c.b] : [c.r * 255, c.g * 255, c.b * 255]
	let note = '', from = p3 ? 'p3' : 'rgb', v = vals
	if (SRGB_ONLY.has(format)) {
		const m = gamutMap(space[from].oklch(...vals), DEST.rgb)
		if (m.mapped) { note = 'mapped into sRGB'; v = m.rgb.map(x => x * 255) }
		else if (p3) v = space.p3.rgb(...vals)   // inside sRGB: converted exactly, not through the mapping's OkLCh round trip
		from = 'rgb'
	}
	const alpha = a < 1 ? +a.toFixed(2) : 1   // Figma keeps opacity in whole percent
	if (format === 'hex') return [hex(v) + (alpha < 1 ? Math.round(alpha * 255).toString(16).padStart(2, '0') : ''), note]
	const out = cssShort(format, from === format ? v : space[from][format](...v))
	return [alpha < 1 ? out.replace(/\)$/, ` / ${alpha})`) : out, note]
}
