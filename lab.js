/**
 * CIE Lab color space (1976)
 *
 * Perceptual color space with approximately uniform lightness
 *
 * @channel {L} 0 100 Lightness
 * @channel {a} -125 125 Green-Red axis
 * @channel {b} -125 125 Blue-Yellow axis
 * @illuminant D65
 * @observer 2
 */
import xyz from './xyz.js';

const lab = {
	name: 'lab',
}

// κ * ε  = 2^3 = 8
const ε = 216 / 24389; // 6^3/29^3 == (24/116)^3
const ε3 = 24 / 116;
const κ = 24389 / 27; // 29^3/3^3
const white = [0.95047, 1.00000, 1.08883];

lab.xyz = (l, a, b) => {
	// Input: L: 0-100, a: -125 to 125, b: -125 to 125
	// Original formula uses:
	// f[1] = (L + 16) / 116
	// f[0] = a / 500 + f[1]
	// f[2] = f[1] - b / 200

	let f = [];
	f[1] = (l + 16) / 116;
	f[0] = a / 500 + f[1];
	f[2] = f[1] - b / 200;

	// compute xyz using f values
	// Threshold: L > 8
	let xyz = [
		f[0] > ε3 ? Math.pow(f[0], 3) : (116 * f[0] - 16) / κ,
		l > 8 ? Math.pow((l + 16) / 116, 3) : l / κ,
		f[2] > ε3 ? Math.pow(f[2], 3) : (116 * f[2] - 16) / κ,
	];

	// Compute XYZ by scaling xyz by reference white
	// Output: XYZ in 0-100 range
	return xyz.map((value, i) => value * white[i] * 100);
}

xyz.lab = (x, y, z) => {
	// Input: XYZ in 0-100 range
	// Normalize to 0-1 for internal calculations
	x = x / 100;
	y = y / 100;
	z = z / 100;

	// D65 white point normalization
	x /= 0.95047;
	// y /= 1;
	z /= 1.08883;

	// Apply f function to each component
	x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (16 / 116);
	y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (16 / 116);
	z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (16 / 116);

	// Convert to Lab
	// Original formula: L = 116*y - 16, a = 500*(x-y), b = 200*(y-z)
	// Output: L: 0-100, a: -125 to 125, b: -125 to 125
	return [
		(116 * y) - 16,      // L in 0-100
		500 * (x - y),       // a in -125 to 125
		200 * (y - z)        // b in -125 to 125
	]
};

export default (lab);
