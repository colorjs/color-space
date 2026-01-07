/**
 * https://en.wikipedia.org/?title=YDbDr
 *
 * @module  color-space/ydbdr
 */

import rgb from './rgb.js';
import yuv from './yuv.js';


var ydbdr = {
	name: 'ydbdr',
	min: [0, -1.333, -1.333],
	max: [1, 1.333, 1.333],
	channel: ['Y', 'Db', 'Dr'],
	alias: ['YDbDr']
};


/**
 * YDbDr to RGB
 *
 * @param {Array<number>} ydbdr RGB values
 *
 * @return {Array<number>} YDbDr values
 */
ydbdr.rgb = function (y, db, dr) {
	var r = y + 0.000092303716148 * db - 0.525912630661865 * dr;
	var g = y - 0.129132898890509 * db + 0.267899328207599 * dr;
	var b = y + 0.664679059978955 * db - 0.000079202543533 * dr;

	return [r, g, b];
};


/**
 * RGB to YDbDr
 *
 * @param {Array<number>} rgb YDbDr values
 *
 * @return {Array<number>} RGB values
 */
rgb.ydbdr = function (r, g, b) {
	return [
		0.299 * r + 0.587 * g + 0.114 * b,
		-0.450 * r - 0.883 * g + 1.333 * b,
		-1.333 * r + 1.116 * g + 0.217 * b
	];
};


/**
 * To YUV
 */
yuv.ydbdr = function (y, u, v) {
	return [
		y, 3.059 * u, -2.169 * v
	]
};

/**
 * From YUV
 */
ydbdr.yuv = function (y, db, dr) {
	return [
		y, db / 3.059, -dr / 2.169
	]
};


export default (ydbdr);
