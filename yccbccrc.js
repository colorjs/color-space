/**
 * YcCbcCrc is ITU-R BT.2020
 *
 * @module  color-space/yccbccrc
 *
 * @channel {Yc} 0 1 Constant-luminance luma
 * @channel {Cbc} -0.5 0.5 Blue-difference chroma
 * @channel {Crc} -0.5 0.5 Red-difference chroma
 */
import rgb from './rgb.js';
import ypbpr from './ypbpr.js';

var yccbccrc = {
	name: 'yccbccrc',
	channel: ['Yc', 'Cbc', 'Crc'],
	range: [[0, 1], [-0.5, 0.5], [-0.5, 0.5]]
};


/**
 * YcCbcCrc to RGB
 *
 * @param {Array<number>} yccbccrc Y: 0-1, Cbc/Crc: -0.5 to 0.5
 *
 * @return {Array<number>} RGB 0-255
 */
yccbccrc.rgb = function (y, cb, cr) {
	return ypbpr.rgb(y, cb, cr, 0.0593, 0.2627);
};


/**
 * RGB to YcCbcCrc
 *
 * @param {Array<number>} arr RGB 0-255
 *
 * @return {Array<number>} Y: 0-1, Cbc/Crc: -0.5 to 0.5
 */
rgb.yccbccrc = function (r, g, b) {
	return rgb.ypbpr(r, g, b, 0.0593, 0.2627);
};


export default (yccbccrc);
