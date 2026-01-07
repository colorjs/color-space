/**
 * YES color space
 * http://www.atlantis-press.com/php/download_paper.php?id=198
 *
 * @module color-space/yes
 */

import rgb from './rgb.js';

var yes = {
	name: 'yes',
	channel: ['luminance', 'e-factor', 's-factor']
};

yes.rgb = function (y, e, s) {
	var m = [
		1, 1.431, .126,
		1, -.569, .126,
		1, .431, -1.874
	];

	var r = y * m[0] + e * m[1] + s * m[2],
		g = y * m[3] + e * m[4] + s * m[5],
		b = y * m[6] + e * m[7] + s * m[8];

	return [r, g, b];
};

rgb.yes = function (r, g, b) {
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
