import rgb from './rgb.js';
import lrgb from './lrgb.js';
import { mat3, inv3 } from './util.js';

// Whitepoint reference values with observer/illuminant
// https://en.wikipedia.org/wiki/Standard_illuminant
export const whitepoint = {
  // 1931 2° Observer
  2: {
    // Incandescent
    A: [109.85, 100, 35.585],
    B: [99.0927, 100, 85.313],
    C: [98.074, 100, 118.232],
    D50: [96.422, 100, 82.521],
    D55: [95.682, 100, 92.149],
    // Daylight
    D65: [95.0456, 100, 108.9058],
    D75: [94.972, 100, 122.638],
    // Fluorescent
    F1: [92.834, 100, 103.665],
    F2: [99.187, 100, 67.395],
    F3: [103.913, 100, 65.710],
    F4: [109.147, 100, 38.813],
    F5: [90.872, 100, 98.723],
    F6: [97.309, 100, 60.191],
    F7: [95.044, 100, 108.755],
    F8: [96.413, 100, 82.333],
    F9: [100.365, 100, 67.868],
    F10: [96.174, 100, 81.712],
    F11: [100.966, 100, 64.370],
    F12: [108.046, 100, 39.228],
    // Equal Energy
    E: [100, 100, 100]
  },

  // 1964 10° Observer
  10: {
    // Incandescent
    A: [111.144, 100, 35.200],
    B: [99.178, 100, 84.349],
    C: [97.285, 100, 116.145],
    D50: [96.720, 100, 81.427],
    D55: [95.799, 100, 90.926],
    // Daylight
    D65: [94.811, 100, 107.304],
    D75: [94.416, 100, 120.641],
    // Fluorescent
    F1: [94.791, 100, 103.191],
    F2: [103.280, 100, 69.026],
    F3: [108.968, 100, 66.500],
    F4: [114.961, 100, 40.963],
    F5: [93.369, 100, 98.636],
    F6: [102.148, 100, 62.074],
    F7: [95.792, 100, 107.687],
    F8: [97.115, 100, 81.135],
    F9: [102.116, 100, 67.826],
    F10: [99.001, 100, 83.134],
    F11: [103.866, 100, 65.627],
    F12: [111.428, 100, 40.353],
    // Equal Energy
    E: [100, 100, 100]
  }
};

// Keep whitepoint values as-is (already in 0-100 range)
// No need to scale them anymore

/**
 * Bradford chromatic adaptation between D50 and D65 (CSS Color 4, full precision).
 * Shared so the D50-referred spaces (xyz-d50, lab-d50, prophoto) don't each carry
 * their own truncated copy.
 * @referred display
 * @dynamic sdr
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
/**
 * CIE XYZ color space
 *
 * Device-independent color space based on human vision response
 *
 * @channel {X} 0 100 Tristimulus value X
 * @channel {Y} 0 100 Tristimulus value Y (luminance)
 * @channel {Z} 0 100 Tristimulus value Z
 * @illuminant D65
 * @observer 2
 */
const xyz = {
	name: 'xyz',
	whitepoint: whitepoint
};

// sRGB linear RGB -> XYZ (D65, Y 0..1); IEC 61966-2-1 matrix, inverse derived
const M_LRGB = [
	0.41239079926595, 0.35758433938387, 0.18048078840183,
	0.21263900587151, 0.71516867876775, 0.072192315360733,
	0.019330818715591, 0.11919477979462, 0.95053215224966
];
const M_LRGB_INV = inv3(M_LRGB);

// XYZ (0-100) to linear RGB (0-1)
xyz.lrgb = (x, y, z) => mat3(M_LRGB_INV, x / 100, y / 100, z / 100);

// Linear RGB (0-1) to XYZ (0-100)
lrgb.xyz = (r, g, b) => {
	const [x, y, z] = mat3(M_LRGB, r, g, b);
	return [x * 100, y * 100, z * 100];
}

// RGB (0-255) to XYZ (0-100)
rgb.xyz = (r, g, b) => lrgb.xyz(...rgb.lrgb(r, g, b))
// XYZ (0-100) to RGB (0-255)
xyz.rgb = (x, y, z) => lrgb.rgb(...xyz.lrgb(x, y, z))

export default xyz;
