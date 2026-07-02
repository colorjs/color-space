/**
 * YES is a luminance/chrominance color encoding in the same family as YIQ and YUV: Y
 * carries luminance, while E (green-red) and S (blue-yellow) carry chrominance as
 * simple linear combinations of the red, green and blue primaries. Its coordinates
 * are cheap to compute directly from RGB, which is the model's main appeal, but
 * unlike CIELAB or CIELUV they are not perceptually uniform — equal steps in E or S
 * do not correspond to equal-looking color differences. It appears in the
 * color-imaging literature as one of several such encodings used for image analysis
 * and compression.
 *
 * @module color-space/yes
 *
 * @see {@link https://doi.org/10.2991/isaebd.2012.23}
 * @channel {Y} 0 1 Luminance
 * @channel {E} -0.5 0.5 E-factor
 * @channel {S} -0.5 0.5 S-factor
 * @referred display
 * @dynamic sdr
 */

import rgb from './rgb.js';

var yes = {
	name: 'yes',
	channel: ['luminance', 'e-factor', 's-factor'],
	range: [[0, 1], [-0.5, 0.5], [-0.5, 0.5]]
};

yes.rgb = function (y, e, s) {
	// Input: Y: 0-1, E/S: -0.5 to 0.5
	var m = [
		1, 1.431, .126,
		1, -.569, .126,
		1, .431, -1.874
	];

	var r = y * m[0] + e * m[1] + s * m[2],
		g = y * m[3] + e * m[4] + s * m[5],
		b = y * m[6] + e * m[7] + s * m[8];

	// Scale to 0-255
	return [r * 255, g * 255, b * 255];
};

rgb.yes = function (r, g, b) {
	// Normalize from 0-255 to 0-1
	r = r / 255;
	g = g / 255;
	b = b / 255;

	var m = [
		.253, .684, .063,
		.500, -.50, .0,
		.250, .250, -.5
	];

	return [
		r * m[0] + g * m[1] + b * m[2],
		r * m[3] + g * m[4] + b * m[5],
		r * m[6] + g * m[7] + b * m[8]
	];
};


export default yes;
