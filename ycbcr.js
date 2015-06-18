/**
 * https://en.wikipedia.org/?title=YCbCr
 *
 * @module  color-space/ycbcr
 */

var rgb = require('./rgb');

var ycbcr = module.exports = {
	name: 'ycbcr',
	min: [0,-0.5,-0.5],
	max: [1, 0.5, 0.5],
	channel: ['Y','Cb','Cr'],
	alias: ['YCbCr']
};


/**
 * UVW to RGB
 *
 * @param {Array} ycbcr RGB values
 *
 * @return {Array} UVW values
 */
ycbcr.rgb = function(ycbcr) {

};


/**
 * RGB to UVW
 *
 * @param {Array} ycbcr UVW values
 *
 * @return {Array} RGB values
 */
rgb.ycbcr = function(rgb) {

};