/**
 * https://en.wikipedia.org/?title=YCgCo
 *
 * @module  color-space/ycgco
 */
import rgb from './rgb.js';


var ycgco = {
	name: 'ycgco',
	min: [0, -0.5, -0.5],
	max: [1, 0.5, 0.5],
	channel: ['Y', 'Cg', 'Co'],
};


/**
 * YCgCo to RGB
 * transform through analog form
 *
 * @param {Array<number>} arr RGB values
 *
 * @return {Array<number>} YCgCo values
 */
ycgco.rgb = function (y, cg, co) {
	var tmp = y - cg;

	return [
		(tmp + co),
		(y + cg),
		(tmp - co)
	];
};


/**
 * RGB to YCgCo
 * transform through analog form
 *
 * @param {Array<number>} arr YCgCo values
 *
 * @return {Array<number>} RGB values
 */
rgb.ycgco = function (r, g, b) {
	return [
		0.25 * r + 0.5 * g + 0.25 * b,
		-0.25 * r + 0.5 * g - 0.25 * b,
		0.5 * r - 0.5 * b
	];
};


export default (ycgco);
