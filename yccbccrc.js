/**
 * YcCbcCrc is ITU-R BT.2020
 *
 * @module  color-space/yccbccrc
 */
import { conversionPlaceholders } from './_space.js';
import rgb from './rgb.js';
import ypbpr from './ypbpr.js';

/** @type {import('./_space.js').ColorSpace} */
var yccbccrc = Object.assign({}, conversionPlaceholders, {
	/** @type {import('./_space.js').SpaceId} */
	name: 'yccbccrc',
	min: [0, -0.5, -0.5],
	max: [1, 0.5, 0.5],
	channel: ['Yc','Cbc','Crc'],
	alias: ['YcCbcCrc']
});


/**
 * YcCbcCrc to RGB
 *
 * @param {Array<number>} yccbccrc RGB values
 *
 * @return {Array<number>} YcCbcCrc values
 */
yccbccrc.rgb = function(yccbccrc) {
	return ypbpr.rgb(yccbccrc, 0.0593, 0.2627);
};


/**
 * RGB to YcCbcCrc
 *
 * @param {Array<number>} arr YcCbcCrc values
 *
 * @return {Array<number>} RGB values
 */
rgb.yccbccrc = function(arr) {
	return rgb.ypbpr(arr, 0.0593, 0.2627);
};


export default yccbccrc;
