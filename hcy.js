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
	h = (h < 0 ? (h % 1) + 1 : (h % 1)) * 2 * Math.PI;

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

	return [r, g, b];
};


/**
 * RGB to HCY
 *
 * @param {Array<number>} rgb Channel values
 *
 * @return {Array<number>} HCY channel values
 */
rgb.hcy = function (r, g, b) {
	var sum = r + g + b;

	var r = r / sum;
	var g = g / sum;
	var b = b / sum;

	var h = Math.acos(
		(0.5 * ((r - g) + (r - b))) /
		Math.sqrt((r - g) * (r - g) + (r - b) * (g - b))
	);
	if (b > g) {
		h = 2 * Math.PI - h;
	}

	var s = 1 - 3 * Math.min(r, g, b);

	var i = sum / 3;

	return [h / (2 * Math.PI), s, i];
};
