import xyz from './xyz.js';

const ictcp = {
	name: 'ictcp',
	channel: ['I', 'Ct', 'Cp'],
	range: [[0, 100], [-50, 50], [-50, 50]]
};

const Yw = 203; // nits

const c1 = 3424 / 4096;
const c2 = 2413 / 128;
const c3 = 2392 / 128;
const m1 = 2610 / 16384;
const m2 = 2523 / 32;
const im1 = 16384 / 2610;
const im2 = 32 / 2523;

const M_XYZ_LMS = [
	0.3592832590121217, 0.6976051147779502, -0.0358915932320290,
	-0.1920808463704993, 1.1004767970374321, 0.0753748658519118,
	0.0070797844607479, 0.0748396662186362, 0.8433265453898765
];

const M_LMS_XYZ = [
	2.0701522183894223, -1.3263473389671563, 0.2066510476294053,
	0.3647385209748072, 0.6805660249472273, -0.0453045459220347,
	-0.0497472075358123, -0.0492609666966131, 1.1880659249923042
];

const M_LMS_IPT = [
	2048 / 4096, 2048 / 4096, 0,
	6610 / 4096, -13613 / 4096, 7003 / 4096,
	17933 / 4096, -17390 / 4096, -543 / 4096
];

const M_IPT_LMS = [
	1.0, 0.0086090370379328, 0.1110296250030260,
	1.0, -0.0086090370379328, -0.1110296250030259,
	1.0, 0.5600313357106791, -0.3206271749873188
];

function applyMatrix(m, x, y, z) {
	return [
		x * m[0] + y * m[1] + z * m[2],
		x * m[3] + y * m[4] + z * m[5],
		x * m[6] + y * m[7] + z * m[8]
	];
}

function LMStoICtCp(l, m, s) {
	const lms = [l, m, s];
	const PQLMS = lms.map(val => {
		// val is absolute nits
		const v = Math.max(val / 10000, 0); // normalize 10000 nits -> 1
		const num = c1 + c2 * Math.pow(v, m1);
		const denom = 1 + c3 * Math.pow(v, m1);
		return Math.pow(num / denom, m2);
	});
	return applyMatrix(M_LMS_IPT, PQLMS[0], PQLMS[1], PQLMS[2]);
}

function ICtCptoLMS(i, ct, cp) {
	const PQLMS = applyMatrix(M_IPT_LMS, i, ct, cp);
	return PQLMS.map(val => {
		const num = Math.max(Math.pow(val, im2) - c1, 0);
		const denom = c2 - c3 * Math.pow(val, im2);
		return 10000 * Math.pow(num / denom, im1);
	});
}

xyz.ictcp = (x, y, z) => {
	// XYZ in 0-100 range, normalize to 0-1 for computation
	x = x / 100;
	y = y / 100;
	z = z / 100;

	// XYZ Relative -> XYZ Abs
	const xa = x * Yw;
	const ya = y * Yw;
	const za = z * Yw;
	// XYZ Abs -> LMS Abs
	const [l, m, s] = applyMatrix(M_XYZ_LMS, xa, ya, za);
	// LMS Abs -> ICtCp
	const [i, ct, cp] = LMStoICtCp(l, m, s);
	// Scale to conventional ranges
	return [i * 100, ct * 100, cp * 100];
}

ictcp.xyz = (i, ct, cp) => {
	// Normalize from conventional ranges
	i = i / 100;
	ct = ct / 100;
	cp = cp / 100;

	// ICtCp -> LMS Abs
	const [l, m, s] = ICtCptoLMS(i, ct, cp);
	// LMS Abs -> XYZ Abs
	const [xa, ya, za] = applyMatrix(M_LMS_XYZ, l, m, s);
	// XYZ Abs -> XYZ Relative (scale to 0-100)
	return [xa / Yw * 100, ya / Yw * 100, za / Yw * 100];
}

export default ictcp;
