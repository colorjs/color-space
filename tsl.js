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
	// Invert T = 0.5 - atan2(g',r')/2π  ->  θ = atan2(g',r') (sign preserved via cos/sin).
	const theta = Math.PI * (1 - T / 180);
	const m = S * Math.sqrt(5) / 3; // sqrt(r'^2 + g'^2), since S = sqrt(9/5)·m

	// chromaticities n = (r',g') + 1/3, summing to 1
	const nr = m * Math.cos(theta) + 1 / 3;
	const ng = m * Math.sin(theta) + 1 / 3;

	// invert L = k·(0.299·nr + 0.587·ng + 0.114·nb), nb = 1 - nr - ng
	const k = L / (.185 * nr + .473 * ng + .114);

	return [k * nr, k * ng, k * (1 - nr - ng)];
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
	if (sum === 0) return [0, 0, 0]; // black: chromaticity undefined -> S=0, L=0
	var r_ = (r / sum || 0) - 1 / 3,
		g_ = (g / sum || 0) - 1 / 3,
		// atan2 (not the canonical g'=0 -> T=0 convention, which is non-invertible for
		// r'>0); only true gray (r'=g'=0) is hue-undefined -> T=0.
		T = (r_ === 0 && g_ === 0) ? 0 : 0.5 - Math.atan2(g_, r_) / 2 / Math.PI,
		S = Math.sqrt(9 / 5 * (r_ * r_ + g_ * g_)),
		L = ((r * 0.299) + (g * 0.587) + (b * 0.114));

	// Output: T in 0-360, S in 0-1, L in 0-255
	return [T * 360, S, L];
};
