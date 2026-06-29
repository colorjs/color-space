import rgb from './rgb.js';
import lrgb from './lrgb.js';

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

// XYZ (0-100) to linear RGB (0-1)
xyz.lrgb = (x, y, z) => {
	// Normalize XYZ from 0-100 to 0-1 for matrix multiplication
	x = x / 100;
	y = y / 100;
	z = z / 100;

	return [
		(x * 3.240969941904521) + (y * -1.537383177570093) + (z * -0.498610760293),
		(x * -0.96924363628087) + (y * 1.87596750150772) + (z * 0.041555057407175),
		(x * 0.055630079696993) + (y * -0.20397695888897) + (z * 1.056971514242878)
	]
}

// Linear RGB (0-1) to XYZ (0-100)
lrgb.xyz = (r, g, b) => {
	const xyz = [
		(r * 0.41239079926595) + (g * 0.35758433938387) + (b * 0.18048078840183),
		(r * 0.21263900587151) + (g * 0.71516867876775) + (b * 0.072192315360733),
		(r * 0.019330818715591) + (g * 0.11919477979462) + (b * 0.95053215224966)
	];

	// Scale from 0-1 to 0-100
	return xyz.map(v => v * 100);
}

// RGB (0-255) to XYZ (0-100)
rgb.xyz = (r, g, b) => lrgb.xyz(...rgb.lrgb(r, g, b))
// XYZ (0-100) to RGB (0-255)
xyz.rgb = (x, y, z) => lrgb.rgb(...xyz.lrgb(x, y, z))

export default xyz;
