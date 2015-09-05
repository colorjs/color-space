/**
 * https://en.wikipedia.org/?title=YPbPr
 *
 * HDTV conversion is used
 *
 * @module  color-space/ypbpr
 */

var rgb = require('./rgb');

var ypbpr = module.exports = {
	name: 'ypbpr',
	min: [0,-1.333,-1.333],
	max: [1, 1.333, 1.333],
	channel: ['Y','Pb','Pr'],
	alias: ['YPbPr', 'Y/PB/PR', 'YPRPB', 'PRPBY', 'PBPRY', 'Y/Pb/Pr', 'YPrPb', 'PrPbY', 'PbPrY', 'Y/R-Y/B-Y', 'Y(R-Y)(B-Y)', 'R-Y', 'B-Y']
};


/**
 * YPbPr to RGB
 *
 * @param {Array} ypbpr RGB values
 *
 * @return {Array} YPbPr values
 */
ypbpr.rgb = function(ypbpr) {
	var y = ypbpr[0], pb = ypbpr[1], pr = ypbpr[2];

	var r = pr + y;
	var b = pb + y;
	var g = (y - 0.2126*r - 0.0722*b) / 0.7152;

	return [
		r * 255,
		g * 255,
		b * 255
	];
};


/**
 * RGB to YPbPr
 *
 * @param {Array} ypbpr YPbPr values
 *
 * @return {Array} RGB values
 */
rgb.ypbpr = function(rgb) {
	var r = rgb[0]/255, g = rgb[1]/255, b = rgb[2]/255;

	var y = 0.2126 * r + 0.7152 * g + 0.0722 * b;

	return [
		y,
		b - y,
		r - y
	];
};