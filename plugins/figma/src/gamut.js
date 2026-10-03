/**
 * CSS Color 4 gamut mapping: "Binary Search Gamut Mapping with Local MINDE".
 *   https://drafts.csswg.org/css-color-4/#css-gamut-mapping  (the algorithm and why)
 *   https://drafts.csswg.org/css-color-4/#pseudo-binsearch    (the pseudocode followed here, step for step)
 *
 * It reduces chroma in OkLCh at constant lightness and hue until the color fits the
 * destination RGB gamut, or until clipping the current color is less than one just
 * noticeable difference away from it. Differences are measured with deltaEOK, the
 * Euclidean distance in Oklab (#color-difference-OK). The spec fixes JND = 0.02 and
 * epsilon = 0.0001. Colors already inside the gamut come back unchanged
 * (relative colorimetric).
 *
 * The plugin can't use the library's own conversions here. Figma channels must sit in
 * [0, 1], and the library encodes out-of-gamut values with a sign-mirrored transfer
 * rather than clamping them, so a mapped value has to be computed first.
 */
import space from '../../../index.js'

export const JND = 0.02
export const EPSILON = 0.0001
// Float round-off from a matrix round trip, e.g. 1.0000000000002 for a primary. It is
// far below one 16-bit code value (1/65535 ≈ 1.5e-5), so it never hides a real excursion.
const ROUNDOFF = 1e-6

const inGamut = rgb => rgb.every(v => v >= -ROUNDOFF && v <= 1 + ROUNDOFF)
const clip = rgb => rgb.map(v => v < 0 ? 0 : v > 1 ? 1 : v)
export const deltaEOK = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

/**
 * The two RGB destinations a Figma document can have. Figma SolidPaint channels are
 * 0..1 in the file's color profile. The library's `rgb` runs 0..255 and its `p3` runs 0..1.
 */
export const DEST = {
	rgb: {
		fromOklch: (l, c, h) => space.oklch.rgb(l, c, h).map(v => v / 255),
		toOklab: rgb => space.rgb.oklab(rgb[0] * 255, rgb[1] * 255, rgb[2] * 255),
	},
	p3: {
		fromOklch: (l, c, h) => space.oklch.p3(l, c, h),
		toOklab: rgb => space.p3.oklab(rgb[0], rgb[1], rgb[2]),
	},
}

/**
 * Map an OkLCh color into a destination RGB gamut.
 * @param {number[]} lch  [L 0..1, C, H°] in OkLCh
 * @param {{fromOklch: Function, toOklab: Function}} dest  one of DEST
 * @returns {{rgb: number[], mapped: boolean}}  rgb is 0..1 and always clamped;
 *   mapped is true when the input was outside the gamut
 */
export function gamutMap([L, C, H], dest) {
	const origin = dest.fromOklch(L, C, H)
	const mapped = !inGamut(origin)
	// SDR lightness bounds: at L ≥ 1 return white, at L ≤ 0 return black
	if (L >= 1) return { rgb: clip(dest.fromOklch(1, 0, 0)), mapped }
	if (L <= 0) return { rgb: clip(dest.fromOklch(0, 0, 0)), mapped }
	if (!mapped) return { rgb: clip(origin), mapped }

	const oklab = c => space.oklch.oklab(L, c, H)
	let clipped = clip(origin)
	let E = deltaEOK(dest.toOklab(clipped), oklab(C))
	if (E < JND) return { rgb: clipped, mapped }

	let min = 0, max = C, minInGamut = true
	while (max - min > EPSILON) {
		const chroma = (min + max) / 2
		const current = dest.fromOklch(L, chroma, H)
		if (minInGamut && inGamut(current)) { min = chroma; continue }
		clipped = clip(current)
		E = deltaEOK(dest.toOklab(clipped), oklab(chroma))
		if (E < JND) {
			if (JND - E < EPSILON) return { rgb: clipped, mapped }
			minInGamut = false
			min = chroma
		}
		else max = chroma
	}
	return { rgb: clipped, mapped }
}
