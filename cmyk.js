/**
 * CMYK color space
 *
 * Subtractive color model used in printing
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#device-cmyk}
 * @channel {C} 0 100 Cyan percentage
 * @channel {M} 0 100 Magenta percentage
 * @channel {Y} 0 100 Yellow percentage
 * @channel {K} 0 100 Black percentage
 * @referred display
 * @dynamic sdr
 */
import rgb from './rgb.js';

const cmyk = {
	name: 'cmyk',
	range: [[0, 100], [0, 100], [0, 100], [0, 100]]
};

cmyk.rgb = (c, m, y, k) => {
	// Input: CMYK 0-100, Output: RGB 0-255
	// Normalize to 0-1
	c = c / 100;
	m = m / 100;
	y = y / 100;
	k = k / 100;

	return [
		(1 - Math.min(1, c * (1 - k) + k)) * 255,
		(1 - Math.min(1, m * (1 - k) + k)) * 255,
		(1 - Math.min(1, y * (1 - k) + k)) * 255
	];
}

rgb.cmyk = (r, g, b) => {
	// Input: RGB 0-255, Output: CMYK 0-100
	// Normalize to 0-1
	r = r / 255;
	g = g / 255;
	b = b / 255;

	let c, m, y, k;

	k = Math.min(1 - r, 1 - g, 1 - b);
	c = (1 - r - k) / (1 - k) || 0;
	m = (1 - g - k) / (1 - k) || 0;
	y = (1 - b - k) / (1 - k) || 0;

	// Scale to 0-100
	return [c * 100, m * 100, y * 100, k * 100];
};

export default cmyk;
