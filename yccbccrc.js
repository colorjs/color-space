/**
 * YcCbcCrc is ITU-R BT.2020
 *
 * @module  color-space/yccbccrc
 */
import rgb from './rgb.js';
import ypbpr from './ypbpr.js';

var yccbccrc = {
	name: 'yccbccrc',
	min: [0, -0.5, -0.5],
	max: [1, 0.5, 0.5],
	channel: ['Yc', 'Cbc', 'Crc'],
};


/**
 * YcCbcCrc to RGB
 *
 * @param {Array<number>} yccbccrc RGB values
 *
 * @return {Array<number>} YcCbcCrc values
 */
yccbccrc.rgb = function (y, cb, cr) {
	return ypbpr.rgb(y, cb, cr, 0.0593, 0.2627);
};


/**
 * RGB to YcCbcCrc
 *
 * @param {Array<number>} arr YcCbcCrc values
 *
 * @return {Array<number>} RGB values
 */
rgb.yccbccrc = function (r, g, b) {
	return rgb.ypbpr(r, g, b, 0.0593, 0.2627);
};


export default (yccbccrc);
