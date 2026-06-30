/**
 * Gray (relative luminance)
 *
 * Single-channel achromatic value = CIE relative luminance Y (the Y of XYZ):
 * the sRGB luminance coefficients applied to LINEAR sRGB (not gamma-encoded —
 * that would be luma Y′). Identical to the Y row of the sRGB→XYZ matrix, so
 * gray(rgb) === XYZ(rgb).Y / 100.
 *
 * @channel {Y} 0 1 Relative luminance
 */
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
