/**
 * CMY color space
 *
 * Subtractive color model without black (K) component
 * Used in simpler printing systems
 *
 * @see {@link https://en.wikipedia.org/wiki/CMY_color_model}
 * @channel {C} 0 100 Cyan percentage
 * @channel {M} 0 100 Magenta percentage
 * @channel {Y} 0 100 Yellow percentage
 */
import rgb from './rgb.js';

const cmy = {
	name: 'cmy'
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
