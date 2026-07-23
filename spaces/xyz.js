/**
 * CIE XYZ — the foundation of modern colorimetry, defined by the CIE in 1931 from the
 * color-matching functions of the standard observer. X, Y and Z are not themselves
 * perceptual attributes; they're engineered so Y alone carries luminance while X and Z
 * carry chromaticity, letting any visible color be written as a weighted sum of three
 * fixed imaginary primaries. It is the device-independent reference that RGB,
 * Lab and other working spaces are ultimately defined against.
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#cie-xyz}
 * @wiki {@link https://en.wikipedia.org/wiki/CIE_1931_color_space#CIE_XYZ_color_space}
 * @year 1931
 * @by CIE
 * @use Foundational device-independent color space underlying all colorimetry; current universal reference.
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
import { mat3, inv3 } from '../util.js';



/**
 * Bradford chromatic adaptation between D50 and D65 (CSS Color 4, full precision).
 * Shared so the D50-referred spaces (xyz-d50, lab-d50, prophoto) don't each carry
 * their own truncated copy.
 */
export const bradford = {
	D50_D65: [
		0.9554734527042182, -0.023098536874261423, 0.0632593086610217,
		-0.028369706963208136, 1.0099954580058226, 0.021041398966943008,
		0.012314001688319899, -0.020507696433477912, 1.3303659366080753
	],
	D65_D50: [
		1.0479298208405488, 0.022946793341019088, -0.05019222954313557,
		0.029627815688159344, 0.990434484573249, -0.01707382502938514,
		-0.009243058152591178, 0.015055144896577895, 0.7518742899580008
	]
};

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
