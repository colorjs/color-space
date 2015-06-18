/**
 * https://en.wikipedia.org/?title=YDbDr
 *
 * @module  color-space/ydbdr
 */

var rgb = require('./rgb');

var ydbdr = module.exports = {
	name: 'ydbdr',
	min: [0,-0.5,-0.5],
	max: [1, 0.5, 0.5],
	channel: ['Y','Db','Dr'],
	alias: ['YDbDr']
};


/**
 * YDbDr to RGB
 *
 * @param {Array} ydbdr RGB values
 *
 * @return {Array} YDbDr values
 */
ydbdr.rgb = function(ydbdr) {

};


/**
 * RGB to YDbDr
 *
 * @param {Array} ydbdr YDbDr values
 *
 * @return {Array} RGB values
 */
rgb.ydbdr = function(rgb) {

};