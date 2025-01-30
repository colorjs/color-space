/**
 * YcCbcCrc is ITU-R BT.2020
 *
 * @module  color-space/yccbccrc
 */
import rgb from './rgb.js';
import ypbpr from './ypbpr.js';
/** @type {Partial<import('./index.js').ColorSpace>} */
var yccbccrc = {
    name: 'yccbccrc',
    min: [0, -0.5, -0.5],
    max: [1, 0.5, 0.5],
    channel: ['Yc', 'Cbc', 'Crc'],
    alias: ['YcCbcCrc']
};
/**
 * YcCbcCrc to RGB
 *
 * @param {Array<number>} yccbccrc RGB values
 *
 * @return {Array<number>} YcCbcCrc values
 */
yccbccrc.rgb = function (yccbccrc) {
    return ypbpr.rgb(yccbccrc, 0.0593, 0.2627);
};
/**
 * RGB to YcCbcCrc
 *
 * @param {Array<number>} arr YcCbcCrc values
 *
 * @return {Array<number>} RGB values
 */
rgb.yccbccrc = function (arr) {
    return rgb.ypbpr(arr, 0.0593, 0.2627);
};
export default /** @type {import('./index.js').ColorSpace} */ (yccbccrc);
