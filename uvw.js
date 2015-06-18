/**
 * https://en.wikipedia.org/?title=UVW
 *
 * @module  color-space/uvw
 */

var rgb = require('./rgb');

var uvw = module.exports = {
	name: 'uvw',
	min: [0,-0.5,-0.5],
	max: [1, 0.5, 0.5],
	channel: ['U','V','W'],
	alias: ['UVW']
};


/**
 * UVW to RGB
 *
 * @param {Array} uvw RGB values
 *
 * @return {Array} UVW values
 */
uvw.rgb = function(uvw) {

};


/**
 * RGB to UVW
 *
 * @param {Array} uvw UVW values
 *
 * @return {Array} RGB values
 */
rgb.uvw = function(rgb) {

};