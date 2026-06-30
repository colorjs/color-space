/**
 * OkLCh color space
 *
 * Cylindrical version of Oklab with cylindrical hue
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#ok-lab}
 * @channel {L} 0 100 Lightness
 * @channel {C} 0 40 Chroma
 * @channel {H} 0 360 Hue angle in degrees
 * @referred display
 * @dynamic sdr
 */
import oklab from './oklab.js';
import rgb from './rgb.js';

var oklch = {
	name: 'oklch'
};

oklch.oklab = function (l, c, h) {
	// Normalize from conventional ranges for calculation
	var hRad = (h / 360) * 2 * Math.PI;

	// Calculate a and b from polar coordinates
	var a = c * Math.cos(hRad);
	var b = c * Math.sin(hRad);

	// Return in oklab conventional range (L 0-100, a/b ±40)
	return [l, a, b];
};

oklab.oklch = function (l, a, b) {
	// Input: L 0-100, a/b ±40
	var c = Math.sqrt(a * a + b * b);
	var h = Math.atan2(b, a);

	// Convert from radians to degrees
	h = h * 180 / Math.PI;
	if (h < 0) {
		h += 360;
	}

	// Return: L 0-100, C 0-40, H 0-360
	return [l, c, h];
};

oklch.rgb = (...args) => oklab.rgb(...oklch.oklab(...args));
rgb.oklch = (...args) => oklab.oklch(...rgb.oklab(...args));

export default oklch;
