/**
 * https://en.wikipedia.org/?title=YCbCr
 *
 * YCbCr is a digital form of YPbPr conversion
 * Thence limits are [16...235], according to the ITU-R BT.709 or ITU-R BT.601
 *
 * @module  color-space/ycbcr
 */
import rgb from './rgb.js'
import ypbpr from './ypbpr.js'

var ycbcr = {
	name: 'ycbcr',
	min: [16, 16, 16],
	max: [235, 240, 240],
	channel: ['Y', 'Cb', 'Cr'],
	/**
	 * From digital to analog form.
	 * Scale to min/max ranges
	 */
	ypbpr: function (y, cb, cr) {
		return [
			(y - 16) / 219,
			(cb - 128) / 224,
			(cr - 128) / 224
		];
	}
};


/**
 * From analog to digital form.
 * Simple scale to min/max ranges
 *
 * @return {Array<number>} Resulting digitized form
 */
ypbpr.ycbcr = function (y, pb, pr) {
	return [
		16 + 219 * y,
		128 + 224 * pb,
		128 + 224 * pr
	];
}


/**
 * YCbCr to RGB
 * transform through analog form
 *
 * @param {Array<number>} arr RGB values
 * @param {number} kb
 * @param {number} kr
 * @return {Array<number>} YCbCr values
 */
ycbcr.rgb = function (y, cb, cr, kb, kr) {
	return ypbpr.rgb(...ycbcr.ypbpr(y, cb, cr), kb, kr);
};


/**
 * RGB to YCbCr
 * transform through analog form
 *
 * @param {Array<number>} arr YCbCr values
 * @param {number} kb
 * @param {number} kr
 * @return {Array<number>} RGB values
 */
rgb.ycbcr = function (r, g, b, kb, kr) {
	return ypbpr.ycbcr(...rgb.ypbpr(r, g, b, kb, kr));
};

export default (ycbcr);
