/**
 * Gray — a single-channel relative luminance value, the Y of CIE XYZ, computed from
 * linear-light RGB rather than gamma-encoded values. That distinction matters: true
 * luminance (Y) measures physical light output, while the "luma" (Y′) computed from
 * gamma-encoded RGB — common in video engineering — only approximates it. Relative
 * luminance is the quantity behind contrast-ratio calculations such as the WCAG
 * accessibility guidelines.
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#grays}
 * @wiki {@link https://en.wikipedia.org/wiki/Grayscale}
 * @year 1931
 * @by CIE
 * @use Relative-luminance channel derived from linear RGB; current basis for WCAG contrast-ratio calculations.
 * @channel {Y} 0 1 Relative luminance
 * @method matrix
 * @encoding linear
 * @referred display
 * @loss projective Keeps luminance only; chromaticity is discarded.
 * @dynamic sdr
 */
// Implementation notes:
// Identical to the Y row of the sRGB→XYZ matrix, so gray(rgb) === XYZ(rgb).Y / 100.
import rgb from './rgb.js';
import lrgb from './lrgb.js';

const gray = {
	name: 'gray',
	range: [[0, 1]]
};

// relative luminance Y from linear sRGB (exact sRGB/D65 Y coefficients)
rgb.gray = (r, g, b) => {
	const [lr, lg, lb] = rgb.lrgb(r, g, b);
	return [0.21263900587151 * lr + 0.71516867876775 * lg + 0.072192315360733 * lb];
};

// the achromatic sRGB color whose luminance is Y
gray.rgb = (y) => lrgb.rgb(y, y, y);

export default gray;
