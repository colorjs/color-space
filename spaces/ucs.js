/**
 * CIE 1960 UCS is a uniform chromaticity space devised by MacAdam, an early
 * attempt to make equal distances on a chromaticity diagram correspond to equal
 * perceived color differences. It was extended into CIE 1964 U*V*W* by adding a
 * lightness dimension, then superseded outright by CIELUV in 1976. Its underlying
 * (u, v) chromaticity coordinates are still the basis for
 * correlated-color-temperature calculations today, which makes it more a piece of
 * color-science history than a working color space.
 *
 * @see {@link https://doi.org/10.1364/JOSA.27.000294} MacAdam 1937, JOSA 27, 294
 * @wiki {@link https://en.wikipedia.org/wiki/CIE_1960_color_space}
 * @year 1960
 * @by David MacAdam / CIE
 * @use Historical uniform chromaticity diagram, basis for correlated-color-temperature calculations; superseded by CIE 1976 u'v'.
 * @channel {U} 0 64 U coordinate
 * @channel {V} 0 100 V coordinate
 * @channel {W} 0 160 W
 * @method matrix
 * @encoding linear
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';

var ucs = {
	name: 'ucs',
	range: [[0, 64], [0, 100], [0, 160]]
};

export default (ucs);

/**
 * UCS to XYZ
 *
 * @param {Array<number>} ucs UCS 0-100
 *
 * @return {Array<number>} XYZ 0-100
 */
ucs.xyz = function (u, v, w) {
	// Both UCS and XYZ are in 0-100 range
	return [
		1.5 * u,
		v,
		1.5 * u - 3 * v + 2 * w
	];
};


/**
 * XYZ to UCS
 *
 * @param {Array<number>} xyz XYZ 0-100
 *
 * @return {Array<number>} UCS 0-100
 */
xyz.ucs = function (x, y, z) {
	// Both XYZ and UCS are in 0-100 range
	return [
		x * 2 / 3,
		y,
		0.5 * (-x + 3 * y + z)
	];
};
