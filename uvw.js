/**
 * CIE 1964 U*V*W* is Wyszecki's extension of the CIE 1960 UCS chromaticity diagram
 * into a full three-dimensional color space, adding a cube-root lightness
 * dimension on top of the earlier system's uniform chromaticity coordinates. It
 * was one of several perceptual color spaces proposed during the 1960s, all
 * trying to make Euclidean distance track perceived color difference better than
 * raw XYZ did. CIELUV superseded it outright in 1976, so today it's mainly of
 * historical interest, marking the transition between the 1960 chromaticity
 * diagram and the modern CIE 1976 spaces.
 *
 * @see {@link https://en.wikipedia.org/wiki/CIE_1964_color_space}
 * @wiki {@link https://en.wikipedia.org/wiki/CIE_1964_color_space}
 * @year 1964
 * @by Günther Wyszecki / CIE
 * @use 3-D extension of CIE 1960 UCS; superseded by CIELUV in 1976, now historical only.
 * @channel {U} -85 175 U* chrominance
 * @channel {V} -90 75 V* chrominance
 * @channel {W} -17 100 W* lightness
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// W* = 25·Y^(1/3) − 17 (Y in 0-100); U* = 13·W*·(u′ − u′n); V* = 13·W*·(v′ − v′n),
// where (u′n, v′n) is the reference-white chromaticity. At W*=0 (black, or an
// undefined chromaticity) the color is achromatic, so U* = V* = 0.
import xyz from './xyz.js';
import whitepoint from './whitepoints.js';

const uvw = {
	name: 'uvw',
	range: [[-85, 175], [-90, 75], [-17, 100]]
};

// CIE 1960 UCS chromaticity from XYZ
const uv = (X, Y, Z) => {
	const d = X + 15 * Y + 3 * Z;
	return [4 * X / d, 6 * Y / d];
};

xyz.uvw = (x, y, z, i = 'D65', o = 2) => {
	const [xn, yn, zn] = whitepoint[o][i];
	const [un, vn] = uv(xn, yn, zn);
	const d = x + 15 * y + 3 * z;
	// black/undefined chromaticity -> use white's, so U* = V* = 0
	const _u = d === 0 ? un : 4 * x / d;
	const _v = d === 0 ? vn : 6 * y / d;
	const w = 25 * Math.cbrt(y) - 17; // Y in 0-100
	return [13 * w * (_u - un), 13 * w * (_v - vn), w];
};

uvw.xyz = (u, v, w, i = 'D65', o = 2) => {
	const [xn, yn, zn] = whitepoint[o][i];
	const [un, vn] = uv(xn, yn, zn);
	const y = ((w + 17) / 25) ** 3; // Y in 0-100
	// W*=0 carries no chromaticity (U*=V*=0 there) -> achromatic at this Y
	const _u = w === 0 ? un : u / (13 * w) + un;
	const _v = w === 0 ? vn : v / (13 * w) + vn;
	const x = 1.5 * y * _u / _v;
	const z = y * (2 / _v - 0.5 * _u / _v - 5);
	return [x, y, z];
};

export default uvw;
