/**
 * Lab Hunter color space
 *
 * Alternative Lab definition by Richard Hunter
 * Optimized for reflectance, less uniform than CIE Lab
 *
 * @channel {L} 0 100 Lightness
 * @channel {a} -75 115 Green-Red axis
 * @channel {b} -210 60 Blue-Yellow axis
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';

const labh = {
	name: 'labh'
};

// Hunter Lab is white-point relative; this library's XYZ is D65, so a/b are
// normalized by D65 ratios (a=b=0 at D65 white), matching lab.js's white point.
// L = 100·√(Y/Yn); a = Ka·(X/Xn − Y/Yn)/√(Y/Yn); b = Kb·(Y/Yn − Z/Zn)/√(Y/Yn),
// with Ka=175 (=> coeff 17.5 at Yn=100), Kb=70 (=> 7), kx=Yn/Xn, kz=Yn/Zn.
const kx = 100 / 95.047;   // 1.05211 (D65 Xn; was Illuminant-C 1.02)
const kz = 100 / 108.883;  // 0.91842 (D65 Zn; was Illuminant-C 0.847)

labh.xyz = (l, a, b) => {
	const _y = l / 10;        // √Y  (Yn=100 => √(Y/Yn)·10 = √Y)
	const _x = a / 17.5 * _y;
	const _z = b / 7 * _y;
	const y = _y * _y;
	return [(_x + y) / kx, y, (y - _z) / kz];
}

xyz.labh = (x, y, z) => {
	const _y12 = Math.sqrt(y);
	const l = _y12 * 10;
	const a = y === 0 ? 0 : 17.5 * ((kx * x - y) / _y12);
	const b = y === 0 ? 0 : 7 * ((y - kz * z) / _y12);
	return [l, a, b];
};

export default labh;
