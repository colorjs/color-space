/**
 * @module color-space/cmy
 */
var rgb = require('./rgb');

module.exports = {
	name: 'cmy',
	min: [0,0,0],
	max: [100,100,100],
	channel: ['cyan', 'magenta', 'yellow'],

	rgb: function(cmy) {
		var c = cmyk[0] / 100,
			m = cmyk[1] / 100,
			y = cmyk[2] / 100;

		return [
			(1 - c) * 255,
			(1 - m) * 255,
			(1 - y) * 255
		];
	}
};


//extend rgb
rgb.cmy = function(rgb) {
	var r = rgb[0] / 255,
		g = rgb[1] / 255,
		b = rgb[2] / 255;

	return [
		(1-r) * 100 || 0,
		(1-g) * 100 || 0,
		(1-b) * 100 || 0
	];
};