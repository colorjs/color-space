/**
 * xvYCC (extended-gamut YCC), standardized by Sony as IEC 61966-2-4 and marketed as
 * x.v.Color, extends traditional YCbCr to encode colors lying outside the conventional
 * BT.601/BT.709 gamut triangle. Where legal-range YCbCr clips any signal exceeding the
 * primaries it was built around, xvYCC keeps the same luma/chroma structure but
 * permits values beyond that limited range, letting cameras and displays capture and
 * reproduce more saturated colors than standard- or high-definition video normally
 * allows. It has shipped in consumer camcorders, televisions, and Blu-ray players
 * seeking a wider color gamut without abandoning the familiar YCbCr pipeline.
 *
 * @module  color-space/xvycc
 *
 * @see {@link https://webstore.iec.ch/publication/6168}
 * @wiki {@link https://en.wikipedia.org/wiki/XvYCC}
 * @year 2006
 * @by Sony / IEC
 * @use Extended-gamut YCbCr for consumer TVs/camcorders/Blu-ray beyond BT.709 (x.v.Color); niche, mostly superseded by HDR formats.
 * @channel {Y} 0 255 Luma
 * @channel {Cb} 0 255 Blue-difference chroma
 * @channel {Cr} 0 255 Red-difference chroma
 * @method luma-chroma
 * @encoding gamma
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// This library normalizes all spaces to a common range and does not enforce gamut
// limits, so xvYCC computes identically to YPbPr/YCbCr here — the separate module
// exists for semantic clarity and drop-in compatibility. Uses the same BT.601 (SD) /
// BT.709 (HD) transformation matrices as ypbpr.js and ycbcr.js.
import rgb from './rgb.js';
import xyz from './xyz.js';
import ypbpr from './ypbpr.js';

var xvycc = {
	name: 'xvycc',
	channel: ['Y', 'Cb', 'Cr'],
	range: [[0, 255], [0, 255], [0, 255]], // full 8-bit code range (xvYCC extends beyond studio 16-235)

	/**
	 * xvYCC to RGB
	 * Uses ITU-R BT.709 or BT.601 transformation
	 * Extended range allows RGB values outside [0,255]
	 *
	 * Formula: R = Y + 2*Cr*(1-Kr)
	 *          B = Y + 2*Cb*(1-Kb)
	 *          G = (Y - Kr*R - Kb*B)/(1-Kr-Kb)
	 *
	 * Reference test values (BT.709):
	 *   Black [0,0,0] → [Y=16, Cb=128, Cr=128]
	 *   White [255,255,255] → [Y=235, Cb=128, Cr=128]
	 *
	 * @param {number} y Y component (luminance) [16-235] (can extend to 1-254)
	 * @param {number} cb Cb component (blue-difference) [16-240] (can extend)
	 * @param {number} cr Cr component (red-difference) [16-240] (can extend)
	 * @param {number} kb Blue weight (default: 0.0722 for BT.709)
	 * @param {number} kr Red weight (default: 0.2126 for BT.709)
	 * @return {Array<number>} RGB values 0-255 (may extend beyond)
	 */
	rgb: function (y, cb, cr, kb, kr) {
		// Default to ITU-R BT.709
		kb = kb || 0.0722;
		kr = kr || 0.2126;

		// Normalize from digital range to 0-1
		var y_norm = (y - 16) / (235 - 16);
		var cb_norm = (cb - 128) / (240 - 16);
		var cr_norm = (cr - 128) / (240 - 16);

		// Convert from normalized YCbCr to normalized RGB using inverse matrix
		var r_norm = y_norm + 2 * cr_norm * (1 - kr);
		var b_norm = y_norm + 2 * cb_norm * (1 - kb);
		var g_norm = (y_norm - kr * r_norm - kb * b_norm) / (1 - kr - kb);

		// Scale to 0-255
		return [r_norm * 255, g_norm * 255, b_norm * 255];
	},

	/**
	 * xvYCC to XYZ
	 * Converts through RGB using the standard transformation
	 *
	 * @param {number} y Y component (luminance) [16-235]
	 * @param {number} cb Cb component (blue-difference) [16-240]
	 * @param {number} cr Cr component (red-difference) [16-240]
	 * @param {number} kb Blue weight (default: 0.0722 for BT.709)
	 * @param {number} kr Red weight (default: 0.2126 for BT.709)
	 * @return {Array<number>} XYZ values 0-100
	 */
	xyz: function (y, cb, cr, kb, kr) {
		return rgb.xyz(...xvycc.rgb(y, cb, cr, kb, kr));
	},

	/**
	 * xvYCC to YPbPr
	 * Converts between digital (16-235/240) and analog (0-1/-0.5-0.5) ranges
	 *
	 * @param {number} y Y component [16-235]
	 * @param {number} cb Cb component [16-240]
	 * @param {number} cr Cr component [16-240]
	 * @return {Array<number>} YPbPr values [Y: 0-1, Pb: -0.5-0.5, Pr: -0.5-0.5]
	 */
	ypbpr: function (y, cb, cr) {
		// Convert from digital to analog range
		var y_analog = (y - 16) / (235 - 16);
		var pb = (cb - 128) / (240 - 16);
		var pr = (cr - 128) / (240 - 16);
		return [y_analog, pb, pr];
	}
};

export default (xvycc);


/**
 * RGB to xvYCC
 * Uses ITU-R BT.709 or BT.601 transformation
 * Extended range allows input RGB values outside [0,255]
 *
 * Formula: Y  = Kr*R + (1-Kr-Kb)*G + Kb*B
 *          Cb = 0.5*(B-Y)/(1-Kb)
 *          Cr = 0.5*(R-Y)/(1-Kr)
 *
 * Reference test values (BT.709):
 *   Black [0,0,0] → [Y=16, Cb=128, Cr=128]
 *   White [255,255,255] → [Y=235, Cb=128, Cr=128]
 *
 * @param {number} r Red component 0-255 (may extend beyond)
 * @param {number} g Green component 0-255 (may extend beyond)
 * @param {number} b Blue component 0-255 (may extend beyond)
 * @param {number} kb Blue weight (default: 0.0722 for BT.709)
 * @param {number} kr Red weight (default: 0.2126 for BT.709)
 * @return {Array<number>} xvYCC values [Y: 16-235, Cb: 16-240, Cr: 16-240]
 */
rgb.xvycc = function (r, g, b, kb, kr) {
	// Default to ITU-R BT.709
	kb = kb || 0.0722;
	kr = kr || 0.2126;

	// Normalize RGB from 0-255 to 0-1
	var r_norm = r / 255;
	var g_norm = g / 255;
	var b_norm = b / 255;

	// Convert RGB to normalized YCbCr using forward matrix
	var y_norm = kr * r_norm + (1 - kr - kb) * g_norm + kb * b_norm;
	var cb_norm = 0.5 * (b_norm - y_norm) / (1 - kb);
	var cr_norm = 0.5 * (r_norm - y_norm) / (1 - kr);

	// Scale to digital range
	var y = y_norm * (235 - 16) + 16;
	var cb = cb_norm * (240 - 16) + 128;
	var cr = cr_norm * (240 - 16) + 128;

	return [y, cb, cr];
};


/**
 * XYZ to xvYCC
 * Converts through RGB using the standard transformation
 *
 * @param {number} x X component 0-100
 * @param {number} y Y component 0-100 (not the same as xvYCC Y)
 * @param {number} z Z component 0-100
 * @param {number} kb Blue weight (default: 0.0722 for BT.709)
 * @param {number} kr Red weight (default: 0.2126 for BT.709)
 * @return {Array<number>} xvYCC values [Y: 16-235, Cb: 16-240, Cr: 16-240]
 */
xyz.xvycc = function (x, y, z, kb, kr) {
	return rgb.xvycc(...xyz.rgb(x, y, z), kb, kr);
};


/**
 * YPbPr to xvYCC
 * Converts between analog (0-1/-0.5-0.5) and digital (16-235/240) ranges
 *
 * @param {number} y Y component [0-1]
 * @param {number} pb Pb component [-0.5-0.5]
 * @param {number} pr Pr component [-0.5-0.5]
 * @return {Array<number>} xvYCC values [Y: 16-235, Cb: 16-240, Cr: 16-240]
 */
ypbpr.xvycc = function (y, pb, pr) {
	// Convert from analog to digital range
	var y_digital = y * (235 - 16) + 16;
	var cb = pb * (240 - 16) + 128;
	var cr = pr * (240 - 16) + 128;
	return [y_digital, cb, cr];
};
