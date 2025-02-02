/**
 * HSV optimized for shaders
 * http://chilliant.blogspot.ca/2012/08/rgbhcy-in-hlsl.html
 *
 * @module color-space/hcy
 */
import rgb from './rgb.js';

var hcy = {
	name: 'hcy',
	min: [0, 0, 0],
	max: [360, 100, 255],
	channel: ['hue', 'chroma', 'luminance'],
	alias: ['HCY']
};

export default (hcy);


/**
 * HCY to RGB
 *
 * @param {Array<number>} hcy Channel values
 *
 * @return {Array<number>} RGB channel values
 */
hcy.rgb = function (hcy) {
	var h = (hcy[0] < 0 ? (hcy[0] % 360) + 360 : (hcy[0] % 360)) * Math.PI / 180;
	var s = Math.max(0, Math.min(hcy[1], 100)) / 100;
	var i = Math.max(0, Math.min(hcy[2], 255)) / 255;

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

	return [r * 255, g * 255, b * 255];
};


/**
 * RGB to HCY
 *
 * @param {Array<number>} rgb Channel values
 *
 * @return {Array<number>} HCY channel values
 */
rgb.hcy = function (rgb) {
	var sum = rgb[0] + rgb[1] + rgb[2];

	var r = rgb[0] / sum;
	var g = rgb[1] / sum;
	var b = rgb[2] / sum;

	var h = Math.acos(
		(0.5 * ((r - g) + (r - b))) /
		Math.sqrt((r - g) * (r - g) + (r - b) * (g - b))
	);
	if (b > g) {
		h = 2 * Math.PI - h;
	}

	var s = 1 - 3 * Math.min(r, g, b);

	var i = sum / 3;

	return [h * 180 / Math.PI, s * 100, i];
};
