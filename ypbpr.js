/**
 * YPbPr color space
 *
 * Analog form of YCbCr used in component video
 * ITU-R BT.709 standard for HD video
 *
 * @channel {Y} 0 1 Luma (brightness)
 * @channel {Pb} -0.5 0.5 Blue chroma
 * @channel {Pr} -0.5 0.5 Red chroma
 * @referred display
 * @dynamic sdr
 */
import rgb from './rgb.js';

var ypbpr = {
	name: 'ypbpr'
};


/**
 * YPbPr to RGB
 *
 * @param {Array<number>} ypbpr Y: 0-1, Pb/Pr: -0.5 to 0.5
 * @param {number} kb
 * @param {number} kr
 * @return {Array<number>} RGB 0-255
 */
ypbpr.rgb = function (y, pb, pr, kb, kr) {
	//default conversion is ITU-R BT.709
	kb = kb || 0.0722;
	kr = kr || 0.2126;

	var r = y + 2 * pr * (1 - kr);
	var b = y + 2 * pb * (1 - kb);
	var g = (y - kr * r - kb * b) / (1 - kr - kb);

	// Scale from 0-1 to 0-255
	return [r * 255, g * 255, b * 255];
};


/**
 * RGB to YPbPr
 *
 * @param {Array<number>} rgb RGB 0-255
 * @param {number} kb
 * @param {number} kr
 * @return {Array<number>} Y: 0-1, Pb/Pr: -0.5 to 0.5
 */
rgb.ypbpr = function (r, g, b, kb, kr) {
	// Normalize from 0-255 to 0-1
	r = r / 255;
	g = g / 255;
	b = b / 255;

	//ITU-R BT.709
	kb = kb || 0.0722;
	kr = kr || 0.2126;

	var y = kr * r + (1 - kr - kb) * g + kb * b;
	var pb = 0.5 * (b - y) / (1 - kb);
	var pr = 0.5 * (r - y) / (1 - kr);

	return [y, pb, pr];
};


export default ypbpr;
