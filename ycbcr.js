/**
 * YCbCr is the digital luma/chroma color format behind almost all broadcast and
 * compressed video, standardized by the ITU-R as BT.601 for standard-definition and
 * BT.709 for high-definition. It carries forward the idea behind its analog ancestors
 * YUV and YPbPr — a luma channel Y that alone reproduces a usable grayscale image,
 * paired with blue-difference and red-difference chroma channels Cb and Cr — but in a
 * digital, studio ("limited") range that reserves headroom and footroom at the
 * extremes for signal-processing overshoot. It is the color format carried inside
 * everything from DVDs and broadcast television to H.264 and HEVC video compression.
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.709}
 * @wiki {@link https://en.wikipedia.org/wiki/YCbCr}
 * @year 1982
 * @by ITU-R (CCIR)
 * @use Digital luma/chroma format behind broadcast and compressed video (BT.601/709); current, ubiquitous in DVD/H.264/HEVC.
 * @channel {Y} 16 235 Luma
 * @channel {Cb} 16 240 Blue chroma
 * @channel {Cr} 16 240 Red chroma
 * @method luma-chroma
 * @encoding gamma
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Defaults to ITU-R BT.709 coefficients (Kr=0.2126, Kb=0.0722) for HD; pass BT.601
// coefficients (Kr=0.299, Kb=0.114) for SD. Full-range BT.601 (no head/footroom) is
// implemented separately as the `jpeg` space.
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
