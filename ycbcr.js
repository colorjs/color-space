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
	channel: ['Y', 'Cb', 'Cr'],
	/**
	 * YCbCr to YPbPr (digital to analog)
	 * Input is normalized 0-1, output is analog YPbPr 0-1
	 */
	ypbpr: function (y, cb, cr) {
		// Input is already in 0-1 normalized range representing digital values
		// Just return as-is since both are now in 0-1 range
		return [y, cb, cr];
	}
};


/**
 * YPbPr to YCbCr (analog to digital)
 * Input is analog YPbPr 0-1, output is normalized 0-1
 *
 * @return {Array<number>} Resulting digitized form normalized to 0-1
 */
ypbpr.ycbcr = function (y, pb, pr) {
	// Both are in 0-1 range, just return as-is
	return [y, pb, pr];
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
