import xyz from './xyz.js';

const labD50 = {
	name: 'lab-d50',
	channel: ['l', 'a', 'b']
};

const whiteD50 = [0.96422, 1.00000, 0.82521];
const kappa = 24389 / 27;
const epsilon = 216 / 24389;
const epsilon3 = 24 / 116;

// D50 -> D65 Bradford
const M_D50_D65 = [
	0.9555766, -0.0230393, 0.0631636,
	-0.0282895, 1.0099416, 0.0210077,
	0.0122982, -0.0204830, 1.3299098
];
// D65 -> D50 Bradford
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

labD50.xyz = (l, a, b) => {
	const fy = (l + 16) / 116;
	const fx = a / 500 + fy;
	const fz = fy - b / 200;

	const xr = fx > epsilon3 ? Math.pow(fx, 3) : (116 * fx - 16) / kappa;
	const yr = l > 8 ? Math.pow(fy, 3) : l / kappa;
	const zr = fz > epsilon3 ? Math.pow(fz, 3) : (116 * fz - 16) / kappa;

	const x50 = xr * whiteD50[0];
	const y50 = yr * whiteD50[1];
	const z50 = zr * whiteD50[2];

	return applyMatrix(M_D50_D65, x50, y50, z50);
}

xyz.labD50 = (x, y, z) => {
	const [x50, y50, z50] = applyMatrix(M_D65_D50, x, y, z);
	
	const xr = x50 / whiteD50[0];
	const yr = y50 / whiteD50[1];
	const zr = z50 / whiteD50[2];

	const fx = xr > epsilon ? Math.cbrt(xr) : (kappa * xr + 16) / 116;
	const fy = yr > epsilon ? Math.cbrt(yr) : (kappa * yr + 16) / 116;
	const fz = zr > epsilon ? Math.cbrt(zr) : (kappa * zr + 16) / 116;

	const l = 116 * fy - 16;
	const a = 500 * (fx - fy);
	const b = 200 * (fy - fz);

	return [l, a, b];
}

export default labD50;
