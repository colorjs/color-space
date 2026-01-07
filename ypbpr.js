/**
 * https://en.wikipedia.org/?title=YPbPr
 *
 * YPbPr is analog form of YCbCr
 * hence limits are [0..1]
 *
 * Default conversion is ITU-R BT.709
 *
 * @module  color-space/ypbpr
 */
import rgb from './rgb.js';

var ypbpr = ({
	name: 'ypbpr',
	min: [0, -0.5, -0.5],
	max: [1, 0.5, 0.5],
	channel: ['Y', 'Pb', 'Pr'],
});


/**
 * YPbPr to RGB
 *
 * @param {Array<number>} ypbpr RGB values
 * @param {number} kb
 * @param {number} kr
 * @return {Array<number>} YPbPr values
 */
ypbpr.rgb = function (y, pb, pr, kb, kr) {
	//default conversion is ITU-R BT.709
	kb = kb || 0.0722;
	kr = kr || 0.2126;

	var r = y + 2 * pr * (1 - kr);
	var b = y + 2 * pb * (1 - kb);
	var g = (y - kr * r - kb * b) / (1 - kr - kb);

	return [r, g, b];
};


/**
 * RGB to YPbPr
 *
 * @param {Array<number>} rgb YPbPr values
 * @param {number} kb
 * @param {number} kr
 * @return {Array<number>} RGB values
 */
rgb.ypbpr = function (r, g, b, kb, kr) {
	//ITU-R BT.709
	kb = kb || 0.0722;
	kr = kr || 0.2126;

	var y = kr * r + (1 - kr - kb) * g + kb * b;
	var pb = 0.5 * (b - y) / (1 - kb);
	var pr = 0.5 * (r - y) / (1 - kr);

	return [y, pb, pr];
};


export default ypbpr;
