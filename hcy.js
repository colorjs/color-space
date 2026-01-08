/**
 * HSV optimized for shaders
 * http://chilliant.blogspot.ca/2012/08/rgbhcy-in-hlsl.html
 *
 * @module color-space/hcy
 */
import rgb from './rgb.js';

var hcy = {
	name: 'hcy',
	channel: ['hue', 'chroma', 'luminance'],
	range: [[0, 360], [0, 100], [0, 100]]
};

export default (hcy);


/**
 * HCY to RGB
 *
 * @param {Array<number>} hcy Channel values
 *
 * @return {Array<number>} RGB channel values
 */
hcy.rgb = function (h, s, i) {
	// Normalize inputs: H: 0-360 -> radians, S/Y: 0-100 -> 0-1
	h = (h / 360) * 2 * Math.PI;
	s = s / 100;
	i = i / 100;

	h = (h < 0 ? (h % (2 * Math.PI)) + (2 * Math.PI) : (h % (2 * Math.PI)));

	var pi3 = Math.PI / 3;

	var r, g, b;
	if (h < (2 * pi3)) {
		b = i * (1 - s);
		r = i * (1 + (s * Math.cos(h) / Math.cos(pi3 - h)));
		g = i * (1 + (s * (1 - Math.cos(h) / Math.cos(pi3 - h))));
	}
	else if (h < (4 * pi3)) {
		h = h - 2 * pi3;
		r = i * (1 - s);
		g = i * (1 + (s * Math.cos(h) / Math.cos(pi3 - h)));
		b = i * (1 + (s * (1 - Math.cos(h) / Math.cos(pi3 - h))));
	}
	else {
		h = h - 4 * pi3;
		g = i * (1 - s);
		b = i * (1 + (s * Math.cos(h) / Math.cos(pi3 - h)));
		r = i * (1 + (s * (1 - Math.cos(h) / Math.cos(pi3 - h))));
	}

	// Scale to 0-255
	return [r * 255, g * 255, b * 255];
};


/**
 * RGB to HCY
 *
 * @param {Array<number>} rgb Channel values
 *
 * @return {Array<number>} HCY channel values
 */
rgb.hcy = function (r, g, b) {
	// Normalize from 0-255 to 0-1
	r = r / 255;
	g = g / 255;
	b = b / 255;

	var sum = r + g + b;

	var rNorm = r / sum;
	var gNorm = g / sum;
	var bNorm = b / sum;

	var h = Math.acos(
		(0.5 * ((rNorm - gNorm) + (rNorm - bNorm))) /
		Math.sqrt((rNorm - gNorm) * (rNorm - gNorm) + (rNorm - bNorm) * (gNorm - bNorm))
	);
	if (bNorm > gNorm) {
		h = 2 * Math.PI - h;
	}

	var s = 1 - 3 * Math.min(rNorm, gNorm, bNorm);

	var i = sum / 3;

	// Output: H: 0-360, C/Y: 0-100
	return [h / (2 * Math.PI) * 360, s * 100, i * 100];
};
