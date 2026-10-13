/**
 * oklch() and oklab() for a person to read and paste: three decimals on lightness, chroma and a/b, three significant
 * digits on the hue. CSS's own serialization keeps five decimals for a lossless round trip (css.js); at three the
 * rounding moves a color by at most ~0.004 ΔEOK (L ±0.0005, C ±0.0005, H ±0.5° at chroma ≤ 0.4), a fifth of the
 * 0.02 just-noticeable difference (gamut.js JND). Every other notation is css.js's.
 */
import { css } from '../../../css.js'

const d3 = x => String(+x.toFixed(3) || 0)   // trailing zeros dropped, never "-0"
const s3 = x => String(+(+x).toPrecision(3) || 0)
const SHORT = {
	oklch: v => `oklch(${d3(v[0])} ${d3(Math.max(0, v[1]))} ${s3(((v[2] % 360) + 360) % 360)})`,
	oklab: v => `oklab(${d3(v[0])} ${d3(v[1])} ${d3(v[2])})`,
}

/** `format`'s values as a CSS string, oklch() and oklab() at three digits */
export const cssShort = (format, v) => SHORT[format] ? SHORT[format](v) : css(format, v)
