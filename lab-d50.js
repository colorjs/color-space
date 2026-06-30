import xyz, { bradford, mat3 } from './xyz.js';

const labD50 = {
	name: 'lab-d50',
	range: [[0, 100], [-125, 125], [-125, 125]]
};

const whiteD50 = [0.9642956764295677, 1.00000, 0.8251046025104602]; // CSS Color 4 D50
const kappa = 24389 / 27;
const epsilon = 216 / 24389;
const epsilon3 = 24 / 116;

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

	// scale 0-1 -> XYZ 0-100 convention
	return mat3(bradford.D50_D65, x50, y50, z50).map(v => v * 100);
}

xyz['lab-d50'] = (x, y, z) => {
	// XYZ 0-100 convention -> 0-1 for the matrix/white-point math
	x = x / 100; y = y / 100; z = z / 100;
	const [x50, y50, z50] = mat3(bradford.D65_D50, x, y, z);

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
