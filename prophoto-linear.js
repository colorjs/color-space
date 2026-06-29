/**
 * ProPhoto RGB Linear color space
 *
 * Linear variant of ProPhoto without gamma correction
 * References D50 illuminant
 *
 * @channel {R} 0 1 Red (linear)
 * @channel {G} 0 1 Green (linear)
 * @channel {B} 0 1 Blue (linear)
 * @illuminant D50
 * @observer 2
 */
import xyz from './xyz.js';

const prophotoLinear = {
	name: 'prophoto-linear'
};

// ProPhoto (Linear) -> XYZ (D50)
const M_PP_XYZ50 = [
	0.79776664490064230, 0.13518129740053308, 0.03134773412839220,
	0.28807482881940130, 0.71183523424187300, 0.00008993693872564,
	0.00000000000000000, 0.00000000000000000, 0.82510460251046020
];

// XYZ (D50) -> ProPhoto (Linear)
const M_XYZ50_PP = [
	1.34578688164715830, -0.25557208737979464, -0.05110186497554526,
	-0.54463070512490190, 1.50824774284514680, 0.02052744743642139,
	0.00000000000000000, 0.00000000000000000, 1.21196754563894520
];

// D50 -> D65 Bradford Adaptation
const M_D50_D65 = [
	0.9555766, -0.0230393, 0.0631636,
	-0.0282895, 1.0099416, 0.0210077,
	0.0122982, -0.0204830, 1.3299098
];

// D65 -> D50 Bradford Adaptation
const M_D65_D50 = [
	1.0478112, 0.0228866, -0.0501270,
	0.0295424, 0.9904844, -0.0170491,
	-0.0092345, 0.0150436, 0.7521316
];

function applyMatrix(m, x, y, z) {
	return [
		x * m[0] + y * m[1] + z * m[2],
		x * m[3] + y * m[4] + z * m[5],
		x * m[6] + y * m[7] + z * m[8]
	];
}

prophotoLinear.xyz = (r, g, b) => {
	// ProPhoto Linear: 0-1, XYZ: 0-100
	// 1. ProPhoto -> XYZ D50
	const [x50, y50, z50] = applyMatrix(M_PP_XYZ50, r, g, b);
	// 2. XYZ D50 -> XYZ D65
	const [x, y, z] = applyMatrix(M_D50_D65, x50, y50, z50);
	return [x * 100, y * 100, z * 100];
}

xyz['prophoto-linear'] = (x, y, z) => {
	// XYZ: 0-100, ProPhoto Linear: 0-1
	x /= 100; y /= 100; z /= 100;
	// 1. XYZ D65 -> XYZ D50
	const [x50, y50, z50] = applyMatrix(M_D65_D50, x, y, z);
	// 2. XYZ D50 -> ProPhoto
	return applyMatrix(M_XYZ50_PP, x50, y50, z50);
}

export default prophotoLinear;
