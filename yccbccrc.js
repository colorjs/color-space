/**
 * https://en.wikipedia.org/?title=YCbCr
 *
 * YCbCr is a digital form of YPbPr conversion
 * Thence limits are [0..255]
 *
 * @module  color-space/ycbcr
 */

var rgb = require('./rgb');

var ycbcr = module.exports = {
	name: 'ycbcr',
	min: [16, 16, 16],
	max: [235, 240, 240],
	channel: ['Y','Cb','Cr'],
	alias: ['YCbCr', 'YCC']
};


/**
 * YCbCr to RGB
 *
 * @param {Array} ycbcr RGB values
 *
 * @return {Array} YCbCr values
 */
ycbcr.rgb = function(ycbcr, kb, kr) {
	var y = ycbcr[0]/255, cb = ycbcr[1]/100, cr = ycbcr[2]/100;

	//default conversion is ITU-R BT.709
	kb = kb || 0.0722;
	kr = kr || 0.2126;

	var r = y + 2 * cr * (1 - kr);
	var b = y + 2 * cb * (1 - kb);
	var g = (y - kr * r - kb * b) / (1 - kr - kb);

	return [r,g,b];
};


/**
 * RGB to YCbCr
 *
 * @param {Array} ycbcr YCbCr values
 *
 * @return {Array} RGB values
 */
rgb.ycbcr = function(rgb, kr, kb) {
	var r = rgb[0], g = rgb[1], b = rgb[2];

	//default conversion is ITU-R BT.709
	kb = kb || 0.0722;
	kr = kr || 0.2126;

	var y = kr*r + (1 - kr - kb)*g + kb*b;
	var cb = 0.5* (b - y) / (1 - kb);
	var cr = 0.5* (r - y) / (1 - kr);

	return [y, cb, cr];
};