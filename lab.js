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
	// L is normalized to [0,1], a and b are signed values (centered at 0)
	// Our encoding: L_real = l*100, a_real = a*125, b_real = b*125
	//
	// Original formula uses:
	// f[1] = (L_real + 16) / 116
	// f[0] = a_real / 500 + f[1]
	// f[2] = f[1] - b_real / 200
	//
	// Substituting:
	// f[1] = (l*100 + 16) / 116
	// f[0] = (a*125) / 500 + f[1] = a*0.25 + f[1]
	// f[2] = f[1] - (b*125) / 200 = f[1] - b*0.625

	let f = [];
	f[1] = (l * 100 + 16) / 116;
	f[0] = a * 0.25 + f[1];
	f[2] = f[1] - b * 0.625;

	// compute xyz using f values
	// Threshold: l*100 > 8  =>  l > 0.08
	let xyz = [
		f[0] > ε3 ? Math.pow(f[0], 3) : (116 * f[0] - 16) / κ,
		l > 0.08 ? Math.pow((l * 100 + 16) / 116, 3) : (l * 100) / κ,
		f[2] > ε3 ? Math.pow(f[2], 3) : (116 * f[2] - 16) / κ,
	];

	// Compute XYZ by scaling xyz by reference white
	return xyz.map((value, i) => value * white[i]);
}

xyz.lab = (x, y, z) => {
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
	// Our encoding: divide by 100 for L, divide by 125 for a/b
	// Result: L ∈ [0,1], a and b are signed (roughly ±1 but unbounded)
	return [
		((116 * y) - 16) / 100,    // L normalized to [0, 1]
		(500 * (x - y)) / 125,     // a signed, scaled by 4
		(200 * (y - z)) / 125      // b signed, scaled by 1.6
	]
};

export default (lab);
