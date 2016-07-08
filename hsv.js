/**
 * @module color-space/hsv
 */

var rgb = require('./rgb');
var hsl = require('./hsl');
var mod = require('mumath/mod');

module.exports = {
	name: 'hsv',
	min: [0, 0, 0],
	max: [360, 100, 100],
	channel: ['hue', 'saturation', 'value'],
	alias: ['HSV', 'HSB'],

	rgb: function rgb(hsv) {
		var h = hsv[0] / 60;
		var s = hsv[1] / 100;
		var v = hsv[2] / 100;
		var c = s * v;
		var q = c * (1 - Math.abs(h % 2 - 1));
		var m = v - c;
		var md = Math.floor(h) % 6;
		var arr = [c, q, 0, 0, q, c];
		var r = arr[mod(md, 6)];
		var g = arr[mod(md - 2, 6)];
		var b = arr[mod(md - 4, 6)];

		return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
	},

	hsl: function hsl(hsv) {
		var s = hsv[1] / 100;
		var v = hsv[2] / 100;

		var l = (2 - s) * v, sl = s * v;
		sl /= l <= 1 ? l : 2 - l, sl = sl || 0;
		return [hsv[0], sl * 100, l * 50];
	}
};

//append rgb
rgb.hsv = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var min = Math.min(r, g, b);
	var max = Math.max(r, g, b);
	var h = 0;
	var c = max - min;
	var v = max;
	var s = 0;
	if (v > 0) s = c / v;
	if (c > 0) h = [(g - b) / c + (g < b ? 6 : 0), (b - r) / c + 2, (r - g) / c + 4][[r, g, b].indexOf(max)];
	return [h * 60, s * 100, v * 100];
};

//extend hsl
hsl.hsv = function (hsl) {
	var s = hsl[1] / 100;
	var l = hsl[2] / 50;

	s *= l <= 1 ? l : 2 - l;
	var v = (l + s) / 2, sv = 0;
	if (l > 0) sv = 2 * s / (l + s);
	return [hsl[0], sv * 100, v * 100];
};
