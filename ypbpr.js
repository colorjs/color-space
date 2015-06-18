/**
 * https://en.wikipedia.org/?title=YPbPr
 *
 * @module  color-space/ypbpr
 */

var rgb = require('./rgb');

var ypbpr = module.exports = {
	name: 'ypbpr',
	min: [0,-0.5,-0.5],
	max: [1, 0.5, 0.5],
	channel: ['Y','Pb','Pr'],
	alias: ['YPbPr']
};


/**
 * YPbPr to RGB
 *
 * @param {Array} ypbpr RGB values
 *
 * @return {Array} YPbPr values
 */
ypbpr.rgb = function(ypbpr) {

};


/**
 * RGB to YPbPr
 *
 * @param {Array} ypbpr YPbPr values
 *
 * @return {Array} RGB values
 */
rgb.ypbpr = function(rgb) {

};