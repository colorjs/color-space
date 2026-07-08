/**
 * YCgCo, introduced by Malvar and Sullivan in 2003, is a luma/chroma color transform
 * designed to be cheap to compute and simple to invert. Y carries luma, while Cg and
 * Co are green-difference and orange-difference chroma, each built from the RGB
 * components with lighter arithmetic than the coefficients YCbCr uses. It was adopted
 * into video coding standards including H.264/AVC and HEVC, valued there for
 * combining low computational cost with an exact, easily reversible RGB transform.
 *
 * @module  color-space/ycgco
 *
 * @see {@link https://www.itu.int/rec/T-REC-H.273}
 * @wiki {@link https://en.wikipedia.org/wiki/YCgCo}
 * @year 2003
 * @by Malvar & Sullivan (Microsoft)
 * @use Low-complexity reversible luma/chroma transform used in H.264/AVC and HEVC coding; current, specific coding modes.
 * @channel {Y} 0 1 Luma
 * @channel {Cg} -0.5 0.5 Green-magenta chroma
 * @channel {Co} -0.5 0.5 Orange-blue chroma
 * @referred display
 * @dynamic sdr
 */
import rgb from './rgb.js';


var ycgco = {
	name: 'ycgco',
	channel: ['Y', 'Cg', 'Co'],
	range: [[0, 1], [-0.5, 0.5], [-0.5, 0.5]]
};


/**
 * YCgCo to RGB
 * transform through analog form
 *
 * @param {Array<number>} arr Y: 0-1, Cg/Co: -0.5 to 0.5
 *
 * @return {Array<number>} RGB 0-255
 */
ycgco.rgb = function (y, cg, co) {
	var tmp = y - cg;

	return [
		(tmp + co) * 255,
		(y + cg) * 255,
		(tmp - co) * 255
	];
};


/**
 * RGB to YCgCo
 * transform through analog form
 *
 * @param {Array<number>} arr RGB 0-255
 *
 * @return {Array<number>} Y: 0-1, Cg/Co: -0.5 to 0.5
 */
rgb.ycgco = function (r, g, b) {
	// Normalize from 0-255 to 0-1
	r = r / 255;
	g = g / 255;
	b = b / 255;

	return [
		0.25 * r + 0.5 * g + 0.25 * b,
		-0.25 * r + 0.5 * g - 0.25 * b,
		0.5 * r - 0.5 * b
	];
};


export default (ycgco);
