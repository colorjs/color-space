/**
 * OSA-UCS color space
 *
 * Uniform Color Scale by Optical Society of America
 * Perceptually uniform color space for industrial applications
 *
 * @channel {L} -10 10 Lightness
 * @channel {j} -10 10 Yellow-Blue axis
 * @channel {g} -10 10 Red-Green axis
 */
import xyz from './xyz.js';


var osaucs = {
	name: 'osaucs'
};


/**
 * OSA-UCS -> XYZ is one-way: OSA-UCS has no analytical inverse; published inverse
 * methods are iterative/numerical.
 * https://www.researchgate.net/publication/259253763_Comparison_of_the_performance_of_inverse_transformation_methods_from_OSA-UCS_to_CIEXYZ
 */
osaucs.xyz = function (L, j, g) {
	var x, y, z;

	throw new Error('osaucs.xyz: OSA-UCS has no analytical inverse (one-way conversion only)');

	return [x, y, z];
};


/**
 * Transform to xyz osaucs
 *
 * @param {Array<number>} arg Input XYZ 0-100
 *
 * @return {Array<number>} Ljg array L, j, g: -10 to 10
 */
xyz.osaucs = function (X, Y, Z) {
	// XYZ already in 0-100, use directly
	var sum = X + Y + Z;
	// black has no chromaticity -> use D65 neutral so K stays finite (yields j=g=0)
	var x = sum === 0 ? 0.31272 : X / sum;
	var y = sum === 0 ? 0.32903 : Y / sum;

	// K factor formula from OSA-UCS specification
	// Note: Some sources may show slight variations in the constant term (1.8103)
	var K = 4.4934 * x * x + 4.3034 * y * y - 4.276 * x * y - 1.3744 * x - 2.56439 * y + 1.8103;
	var Y0 = K * Y;

	var L_ = 5.9 * (Math.pow(Y0, 1 / 3) - 2 / 3 + 0.042 * Math.pow(Math.max(Y0, 30) - 30, 1 / 3));
	var L = (L_ - 14.3993) / Math.sqrt(2);

	var C = L_ / (5.9 * (Math.pow(Y0, 1 / 3) - 2 / 3));

	var R = 0.7790 * X + 0.4194 * Y - 0.1648 * Z;
	var G = -0.4493 * X + 1.3265 * Y + 0.0927 * Z;
	var B = -0.1149 * X + 0.3394 * Y + 0.7170 * Z;

	R = Math.pow(R, 1 / 3) || 0;
	G = Math.pow(G, 1 / 3) || 0;
	B = Math.pow(B, 1 / 3) || 0;

	var a = -13.7 * R + 17.7 * G - 4 * B;
	var b = 1.7 * R + 8 * G - 9.7 * B;

	var g = C * a;
	var j = C * b;

	//polar form
	// var p = Math.sqrt(j*j + g*g);
	// var phi = Math.atan2(j, g);

	return [L, j, g];
};


export default (osaucs);
