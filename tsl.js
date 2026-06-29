/**
 * TSL color space (Tint, Saturation, Lightness)
 *
 * Simple cylindrical representation of RGB
 * Derived from RGB for image analysis
 *
 * @channel {T} 0 360 Tint (hue) angle in degrees
 * @channel {S} 0 1 Saturation
 * @channel {L} 0 255 Lightness (brightness level)
 */
import rgb from './rgb.js';

var tsl = {
	name: 'tsl'
};

export default (tsl);

/**
 * TSL to RGB
 *
 * @param {Array<number>} tsl T: 0-360, S: 0-1, L: 0-255
 *
 * @return {Array<number>} RGB 0-255
 */
tsl.rgb = function (T, S, L) {
	// Normalize T from 0-360 to 0-1
	T = T / 360;
	// L is already in 0-255

	var x = Math.tan(2 * Math.PI * (T - 1 / 4));
	x *= x;

	var r = Math.sqrt(5 * S * S / (9 * (1 / x + 1))) + 1 / 3;
	var g = Math.sqrt(5 * S * S / (9 * (x + 1))) + 1 / 3;

	var k = L / (.185 * r + .473 * g + .114);

	var B = k * (1 - r - g);
	var G = k * g;
	var R = k * r;

	// Already in 0-255 scale
	return [R, G, B];
};


/**
 * RGB to TSL
 *
 * @param {Array<number>} rgb RGB 0-255
 *
 * @return {Array<number>} T: 0-360, S: 0-1, L: 0-255
 */
rgb.tsl = function (r, g, b) {
	// RGB is already in 0-255, compute directly
	var sum = (r + g + b);
	var r_ = (r / sum || 0) - 1 / 3,
		g_ = (g / sum || 0) - 1 / 3,
		T = g_ != 0 ? 0.5 - Math.atan2(g_, r_) / 2 / Math.PI : 0,
		S = Math.sqrt(9 / 5 * (r_ * r_ + g_ * g_)),
		L = ((r * 0.299) + (g * 0.587) + (b * 0.114));

	// Output: T in 0-360, S in 0-1, L in 0-255
	return [T * 360, S, L];
};
