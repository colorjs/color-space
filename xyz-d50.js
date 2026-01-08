import xyz from './xyz.js';

const xyzD50 = {
	name: 'xyz-d50',
	channel: ['x', 'y', 'z'],
	range: [[0, 100], [0, 100], [0, 100]]
};

const M_D50_D65 = [
	0.9555766, -0.0230393, 0.0631636,
	-0.0282895, 1.0099416, 0.0210077,
	0.0122982, -0.0204830, 1.3299098
];

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

xyzD50.xyz = (x, y, z) => {
	// XYZ D50 -> XYZ D65
	return applyMatrix(M_D50_D65, x, y, z);
}

xyz.xyzD50 = (x, y, z) => {
	// XYZ D65 -> XYZ D50
	return applyMatrix(M_D65_D50, x, y, z);
}

export default xyzD50;
