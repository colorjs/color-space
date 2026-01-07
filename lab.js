import xyz from './xyz.js';

const lab = {
	name: 'lab',
	channel: ['lightness', 'a', 'b']
}

// κ * ε  = 2^3 = 8
const ε = 216 / 24389; // 6^3/29^3 == (24/116)^3
const ε3 = 24 / 116;
const κ = 24389 / 27; // 29^3/3^3
const white = [0.95047, 1.00000, 1.08883];

lab.xyz = (l, a, b) => {
	// compute f, starting with the luminance-related term
	let f = [];
	f[1] = (l + 16) / 116;
	f[0] = a / 500 + f[1];
	f[2] = f[1] - b / 200;

	// compute xyz
	let xyz = [
		f[0] > ε3 ? Math.pow(f[0], 3) : (116 * f[0] - 16) / κ,
		l > 8 ? Math.pow((l + 16) / 116, 3) : l / κ,
		f[2] > ε3 ? Math.pow(f[2], 3) : (116 * f[2] - 16) / κ,
	];

	// Compute XYZ by scaling xyz by reference white
	return xyz.map((value, i) => value * white[i]);
}

xyz.lab = (x, y, z) => {
	// D65
	x /= 0.95047;
	// y /= 1;
	z /= 1.08883;

	x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (16 / 116);
	y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (16 / 116);
	z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (16 / 116);

	return [
		(116 * y) - 16,
		500 * (x - y),
		200 * (y - z)
	]
};

export default (lab);
