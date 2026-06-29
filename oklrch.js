/**
 * OkLrch color space
 *
 * Cylindrical variant of OkLrab
 * Uses chroma and hue for intuitive color selection
 *
 * @channel {L} 0 100 Lightness
 * @channel {C} 0 40 Chroma
 * @channel {H} 0 360 Hue angle in degrees
 */
// Oklrch
// https://bottosson.github.io/posts/colorpicker/

import oklrab from './oklrab.js';

var oklrch = {
	name: 'oklrch'
};

oklrch.oklrab = function (l, c, h) {
	// Input: L 0-100, C 0-40, H 0-360
	// Calculate a and b from polar coordinates
	var hRad = (h / 360) * 2 * Math.PI;
	var a = c * Math.cos(hRad);
	var b = c * Math.sin(hRad);

	// Return in oklrab conventional range (L 0-100, a/b ±40)
	return [l, a, b];
};

oklrab.oklrch = function (l, a, b) {
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

export default oklrch;
