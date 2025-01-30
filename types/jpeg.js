/**
 * https://en.wikipedia.org/wiki/YCbCr#JPEG_conversion
 *
 * JPEG conversion without head/footroom
 *
 * @module  color-space/jpeg
 */
import rgb from './rgb.js';
/** @type {Partial<import('./index.js').ColorSpace>} */
var jpeg = {
    name: 'jpeg',
    min: [0, 0, 0],
    max: [255, 255, 255],
    channel: ['Y', 'Cb', 'Cr'],
    alias: ['JPEG']
};
export default /** @type {import('./index.js').ColorSpace} */ (jpeg);
/**
 * JPEG to RGB
 * transform through analog form
 *
 * @param {Array<number>} arr RGB values
 *
 * @return {Array<number>} JPEG values
 */
jpeg.rgb = function (arr) {
    var y = arr[0], cb = arr[1], cr = arr[2];
    return [
        y + 1.402 * (cr - 128),
        y - 0.34414 * (cb - 128) - 0.71414 * (cr - 128),
        y + 1.772 * (cb - 128)
    ];
};
/**
 * RGB to JPEG
 * transform through analog form
 *
 * @param {Array<number>} arr JPEG values
 *
 * @return {Array<number>} RGB values
 */
rgb.jpeg = function (arr) {
    var r = arr[0], g = arr[1], b = arr[2];
    return [
        0.299 * r + 0.587 * g + 0.114 * b,
        128 - 0.168736 * r - 0.331264 * g + 0.5 * b,
        128 + 0.5 * r - 0.418688 * g - 0.081312 * b
    ];
};
