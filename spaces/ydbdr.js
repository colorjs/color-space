/**
 * YDbDr is the luma/chrominance encoding used by SECAM ("Séquentiel Couleur à
 * Mémoire"), the analog color television standard developed in France and adopted
 * across parts of Eastern Europe, the former Soviet Union, and Africa. Like YUV (its
 * PAL counterpart) and YIQ (NTSC), it keeps a luma channel Y for backward
 * compatibility with monochrome broadcasts, pairing it with two scaled
 * color-difference channels, Db and Dr, derived from blue-minus-luma and
 * red-minus-luma respectively.
 *
 * @wiki {@link https://en.wikipedia.org/wiki/YDbDr}
 * @year 1967
 * @by Henri de France
 * @use Legacy analog SECAM television luma/chroma encoding (France, E. Europe, ex-USSR); historical.
 * @channel {Y} 0 1 Luma
 * @channel {Db} -1.333 1.333 Blue difference
 * @channel {Dr} -1.333 1.333 Red difference
 * @method luma-chroma
 * @encoding gamma
 * @referred display
 * @dynamic sdr
 */
import rgb from './rgb.js';
import yuv from './yuv.js';


var ydbdr = {
	name: 'ydbdr',
	range: [[0, 1], [-1.333, 1.333], [-1.333, 1.333]]
};


/**
 * YDbDr to RGB
 *
 * @param {Array<number>} ydbdr Y: 0-1, Db/Dr: -1.333 to 1.333
 *
 * @return {Array<number>} RGB 0-255
 */
ydbdr.rgb = function (y, db, dr) {
	var r = y + 0.000092303716148 * db - 0.525912630661865 * dr;
	var g = y - 0.129132898890509 * db + 0.267899328207599 * dr;
	var b = y + 0.664679059978955 * db - 0.000079202543533 * dr;

	return [r * 255, g * 255, b * 255];
};


/**
 * RGB to YDbDr
 *
 * @param {Array<number>} rgb RGB 0-255
 *
 * @return {Array<number>} Y: 0-1, Db/Dr: -1.333 to 1.333
 */
rgb.ydbdr = function (r, g, b) {
	// Normalize from 0-255 to 0-1
	r = r / 255;
	g = g / 255;
	b = b / 255;

	return [
		0.299 * r + 0.587 * g + 0.114 * b,
		-0.450 * r - 0.883 * g + 1.333 * b,
		-1.333 * r + 1.116 * g + 0.217 * b
	];
};


/**
 * To YUV
 */
yuv.ydbdr = function (y, u, v) {
	return [
		y, 3.059 * u, -2.169 * v
	]
};

/**
 * From YUV
 */
ydbdr.yuv = function (y, db, dr) {
	return [
		y, db / 3.059, -dr / 2.169
	]
};


export default (ydbdr);
