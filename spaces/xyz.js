/**
 * CIE XYZ — the foundation of modern colorimetry, defined by the CIE in 1931 from the standard
 * observer's color-matching functions. X, Y and Z are not perceptual attributes; they are
 * engineered so that Y alone carries luminance, X and Z carry chromaticity, and any visible
 * color is a weighted sum of three fixed imaginary primaries. RGB, Lab and other working
 * spaces are defined against it.
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#cie-xyz}
 * @wiki {@link https://en.wikipedia.org/wiki/CIE_1931_color_space#CIE_XYZ_color_space}
 * @year 1931
 * @by CIE
 * @use The device-independent reference underlying all colorimetry.
 * @channel {X} 0 95.05 X
 * @channel {Y} 0 100 Y
 * @channel {Z} 0 108.91 Z
 * @method matrix
 * @encoding linear
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Values are on a 0-100 scale (Y = 100 at white).
import rgb from './rgb.js';
import lrgb from './lrgb.js';
import { mat3, mul3, inv3 } from '../math.js';



// Bradford cone-response matrix (Lam 1985), as tabulated by Lindbloom
// http://www.brucelindbloom.com/index.html?Eqn_ChromAdapt.html
export const M_BRADFORD = [
	0.8951, 0.2664, -0.1614,
	-0.7502, 1.7135, 0.0367,
	0.0389, -0.0685, 1.0296
];

/**
 * Bradford (von Kries in Bradford cone space) adaptation matrix between two white
 * points given as XYZ on a common scale — for spaces whose white is neither D50 nor
 * D65 (ACES), so they derive the matrix from their white instead of typing one.
 * @param {number[]} from source white XYZ
 * @param {number[]} to destination white XYZ
 * @returns {number[]} row-major 3×3, XYZ(from) → XYZ(to)
 */
export const bradfordAdaptation = (from, to) => {
	const s = mat3(M_BRADFORD, from[0], from[1], from[2]), d = mat3(M_BRADFORD, to[0], to[1], to[2]);
	return mul3(inv3(M_BRADFORD), mul3([d[0] / s[0], 0, 0, 0, d[1] / s[1], 0, 0, 0, d[2] / s[2]], M_BRADFORD));
};

/**
 * Bradford chromatic adaptation between D50 and D65, derived from the two whites' chromaticities
 * (D65 0.3127, 0.3290; D50 0.3457, 0.3585) as CSS Color 4 derives it: its printed D65_to_D50 and
 * D50_to_D65 matrices to the last digit, and white to white exactly. Shared so the D50-referred
 * spaces (xyz-d50, lab, prophoto) don't each carry a typed copy.
 * @see {@link https://www.w3.org/TR/css-color-4/#color-conversion-code}
 */
const white = (x, y) => [x / y, 1, (1 - x - y) / y], D65 = white(0.3127, 0.3290), D50 = white(0.3457, 0.3585);
export const bradford = { D50_D65: bradfordAdaptation(D50, D65), D65_D50: bradfordAdaptation(D65, D50) };

// We use D65 matrice
// http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
const xyz = {
	name: 'xyz',
	range: [[0, 95.05], [0, 100], [0, 108.91]],
};

// sRGB linear RGB -> XYZ (D65, Y 0..1); IEC 61966-2-1 matrix, inverse derived
const M_LRGB = [
	0.41239079926595, 0.35758433938387, 0.18048078840183,
	0.21263900587151, 0.71516867876775, 0.072192315360733,
	0.019330818715591, 0.11919477979462, 0.95053215224966
];
export const M_LRGB_INV = inv3(M_LRGB); // XYZ(0..1) -> linear sRGB (reused by hsluv gamut bounds)

// XYZ (0-100) to linear RGB (0-1)
xyz.lrgb = (x, y, z) => mat3(M_LRGB_INV, x / 100, y / 100, z / 100);

// Linear RGB (0-1) to XYZ (0-100) — scale in place: one allocation, bit-identical to ×100 after
lrgb.xyz = (r, g, b) => { const v = mat3(M_LRGB, r, g, b); v[0] *= 100; v[1] *= 100; v[2] *= 100; return v }

// RGB (0-255) to XYZ (0-100) — indexed hand-off, never spread (it costs more than the math)
rgb.xyz = (r, g, b) => { const v = rgb.lrgb(r, g, b); return lrgb.xyz(v[0], v[1], v[2]) }
// XYZ (0-100) to RGB (0-255)
xyz.rgb = (x, y, z) => { const v = xyz.lrgb(x, y, z); return lrgb.rgb(v[0], v[1], v[2]) }

export default xyz;
