/**
 * CMY is the subtractive color model built from cyan, magenta and yellow alone,
 * without CMYK's separate black channel. Each channel represents how much ink is
 * applied to absorb its complementary portion of white light, so mixing all three at
 * full strength approximates black — though in practice impure inks produce a muddy
 * dark brown rather than a true black, which is exactly why CMYK adds a dedicated key
 * channel. CMY remains useful as the direct three-ink subtractive counterpart to RGB,
 * and underlies the arithmetic CMYK is built on.
 *
 * @see {@link https://en.wikipedia.org/wiki/CMY_color_model}
 * @channel {C} 0 100 Cyan percentage
 * @channel {M} 0 100 Magenta percentage
 * @channel {Y} 0 100 Yellow percentage
 * @referred display
 * @dynamic sdr
 */
import rgb from './rgb.js';

const cmy = {
	name: 'cmy',
	range: [[0, 100], [0, 100], [0, 100]]
};

cmy.rgb = (c, m, y) => {
	// Input: CMY 0-100, Output: RGB 0-255
	return [
		(100 - c) / 100 * 255,
		(100 - m) / 100 * 255,
		(100 - y) / 100 * 255
	];
};

rgb.cmy = (r, g, b) => {
	// Input: RGB 0-255, Output: CMY 0-100
	return [
		(1 - r / 255) * 100 || 0,
		(1 - g / 255) * 100 || 0,
		(1 - b / 255) * 100 || 0
	];
};


export default cmy;
