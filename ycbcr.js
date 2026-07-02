/**
 * YCbCr color space
 *
 * Digital video color format used in broadcasting. Limited (studio) range,
 * ITU-R BT.709 coefficients (Kr=0.2126, Kb=0.0722) — the HD default. For SD use
 * BT.601; full-range 601 is the `jpeg` space.
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.709}
 * @channel {Y} 16 235 Luma (brightness)
 * @channel {Cb} 16 240 Blue chroma
 * @channel {Cr} 16 240 Red chroma
 * @referred display
 * @dynamic sdr
 */
import rgb from './rgb.js'
import ypbpr from './ypbpr.js'

var ycbcr = {
	name: 'ycbcr',
	range: [[16, 235], [16, 240], [16, 240]],
	/**
	 * YCbCr to YPbPr (digital to analog)
	 * Input: Y: 16-235, Cb/Cr: 16-240
	 * Output: Y/Pb/Pr: 0-1
	 */
	ypbpr: function (y, cb, cr) {
		// Convert digital to analog ranges
		// Y: 16-235 -> 0-1
		// Cb/Cr: 16-240 -> -0.5 to 0.5
		return [
			(y - 16) / (235 - 16),
			(cb - 128) / (240 - 16),
			(cr - 128) / (240 - 16)
		];
	}
};


/**
 * YPbPr to YCbCr (analog to digital)
 * Input: Y/Pb/Pr: 0-1, -0.5 to 0.5
 * Output: Y: 16-235, Cb/Cr: 16-240
 *
 * @return {Array<number>} Resulting digitized form
 */
ypbpr.ycbcr = function (y, pb, pr) {
	// Convert analog to digital ranges
	return [
		y * (235 - 16) + 16,
		pb * (240 - 16) + 128,
		pr * (240 - 16) + 128
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
