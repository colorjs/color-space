import xyz from './xyz.js';

/* Utilities */
const spow = (a, b) => Math.sign(a) * Math.pow(Math.abs(a), b);
const copySign = (a, b) => Math.sign(b) * Math.abs(a);
const zdiv = (a, b) => b === 0 ? 0 : a / b;
const interpolate = (start, end, p) => start + (end - start) * p;
const constrain = (h) => {
	let r = h % 360;
	if (r < 0) r += 360;
	return r;
};
function bisectLeft(arr, x) {
	let lo = 0, hi = arr.length;
	while (lo < hi) {
		const mid = (lo + hi) >>> 1;
		if (arr[mid] < x) lo = mid + 1;
		else hi = mid;
	}
	return lo;
}
function multiply_v3_m3x3(v, m) {
	return [
		v[0] * m[0][0] + v[1] * m[0][1] + v[2] * m[0][2],
		v[0] * m[1][0] + v[1] * m[1][1] + v[2] * m[1][2],
		v[0] * m[2][0] + v[1] * m[2][1] + v[2] * m[2][2]
	];
}
// Note: m is in format [[row0], [row1], [row2]]
// But define m1 etc as array of arrays.

const white = [0.95047, 1.0, 1.08883];
const adaptedCoef = 0.42;
const adaptedCoefInv = 1 / adaptedCoef;
const tau = 2 * Math.PI;

const cat16 = [
	[0.401288, 0.650173, -0.051461],
	[-0.250268, 1.204414, 0.045854],
	[-0.002079, 0.048952, 0.953127]
];

const cat16Inv = [
	[1.8620678550872327, -1.0112546305316843, 0.14918677544445175],
	[0.38752654323613717, 0.6214474419314753, -0.008973985167612518],
	[-0.015841498849333856, -0.03412293802851557, 1.0499644368778496]
];

const m1 = [
	[460.0, 451.0, 288.0],
	[460.0, -891.0, -261.0],
	[460.0, -220.0, -6300.0]
];

const surroundMap = {
	dark: [0.8, 0.525, 0.8],
	dim: [0.9, 0.59, 0.9],
	average: [1, 0.69, 1],
};

const hueQuadMap = {
	h: [20.14, 90.0, 164.25, 237.53, 380.14],
	e: [0.8, 0.7, 1.0, 1.2, 0.8],
	H: [0.0, 100.0, 200.0, 300.0, 400.0],
};

function adapt(coords, fl) {
	return coords.map(c => {
		const x = spow(fl * Math.abs(c) * 0.01, adaptedCoef);
		return (400 * copySign(x, c)) / (x + 27.13);
	});
}

function unadapt(adapted, fl) {
	const constant = (100 / fl) * Math.pow(27.13, adaptedCoefInv);
	return adapted.map(c => {
		const cabs = Math.abs(c);
		return copySign(constant * spow(cabs / (400 - cabs), adaptedCoefInv), c);
	});
}

export function hueQuadrature(h) {
	let hp = constrain(h);
	if (hp <= hueQuadMap.h[0]) {
		hp += 360;
	}
	const i = bisectLeft(hueQuadMap.h, hp) - 1;
	const hi = hueQuadMap.h[i];
	const hii = hueQuadMap.h[i+1];
	const ei = hueQuadMap.e[i];
	const eii = hueQuadMap.e[i+1];
	const Hi = hueQuadMap.H[i];
	const t = (hp - hi) / ei;
	return Hi + (100 * t) / (t + (hii - hp) / eii);
}

export function invHueQuadrature(H) {
	let Hp = ((H % 400) + 400) % 400;
	const i = Math.floor(0.01 * Hp);
	Hp = Hp % 100;
	const hi = hueQuadMap.h[i];
	const hii = hueQuadMap.h[i+1];
	const ei = hueQuadMap.e[i];
	const eii = hueQuadMap.e[i+1];
	return constrain((Hp * (eii * hi - ei * hii) - 100 * hi * eii) / (Hp * (eii - ei) - 100 * eii));
}

export function environment(refWhite, adaptingLuminance, backgroundLuminance, surround, discounting) {
	const env = {};
	env.discounting = discounting;
	env.refWhite = refWhite;
	env.surround = surround;
	const xyzW = refWhite.map(c => c * 100);
	env.la = adaptingLuminance;
	env.yb = backgroundLuminance;
	const yw = xyzW[1];
	const rgbW = multiply_v3_m3x3(xyzW, cat16);
	const values = surroundMap[surround];
	const f = values[0];
	env.c = values[1];
	env.nc = values[2];
	const k = 1 / (5 * env.la + 1);
	const k4 = Math.pow(k, 4);
	env.fl = k4 * env.la + 0.1 * (1 - k4) * (1 - k4) * Math.cbrt(5 * env.la);
	env.flRoot = Math.pow(env.fl, 0.25);
	env.n = env.yb / yw;
	env.z = 1.48 + Math.sqrt(env.n);
	env.nbb = 0.725 * Math.pow(env.n, -0.2);
	env.ncb = env.nbb;
	const d = discounting ? 1 : Math.max(Math.min(f * (1 - (1 / 3.6) * Math.exp((-env.la - 42) / 92)), 1), 0);
	env.dRgb = rgbW.map(c => interpolate(1, yw / c, d));
	env.dRgbInv = env.dRgb.map(c => 1 / c);
	const rgbCW = rgbW.map((c, i) => c * env.dRgb[i]);
	const rgbAW = adapt(rgbCW, env.fl);
	env.aW = env.nbb * (2 * rgbAW[0] + rgbAW[1] + 0.05 * rgbAW[2]);
	return env;
}

export const viewingConditions = environment(white, (64 / Math.PI) * 0.2, 20, "average", false);

export function fromCam16(cam16, env) {
	// cam16 has J, C, h ideally. (Or M, s, Q, H).
	// We assume J, M, h input mostly.
	let hRad = 0.0;
	if (cam16.h !== undefined) hRad = constrain(cam16.h) * (Math.PI / 180);
	else hRad = invHueQuadrature(cam16.H) * (Math.PI / 180); // Fallback if H provided

	const cosh = Math.cos(hRad);
	const sinh = Math.sin(hRad);
	let Jroot = 0.0;
	if (cam16.J !== undefined) Jroot = spow(cam16.J, 1/2) * 0.1;
	// ... other cases omitted for simplicity as we use J,M,h

	let alpha = 0;
	if (cam16.C !== undefined) alpha = cam16.C / Jroot;
	else if (cam16.M !== undefined) alpha = cam16.M / env.flRoot / Jroot;

	const t = spow(alpha * Math.pow(1.64 - Math.pow(0.29, env.n), -0.73), 10 / 9);
	const et = 0.25 * (Math.cos(hRad + 2) + 3.8);
	const A = env.aW * spow(Jroot, 2 / env.c / env.z);
	const p1 = (5e4 / 13) * env.nc * env.ncb * et;
	const p2 = A / env.nbb;
	const r = 23 * (p2 + 0.305) * zdiv(t, 23 * p1 + t * (11 * cosh + 108 * sinh));
	const a = r * cosh;
	const b = r * sinh;

	const rgb_c = unadapt(
		multiply_v3_m3x3([p2, a, b], m1).map(c => c / 1403),
		env.fl
	);

	return multiply_v3_m3x3(
		rgb_c.map((c, i) => c * env.dRgbInv[i]),
		cat16Inv
	);
}

export function toCam16(xyzd65, env) {
	// XYZ in 0-100 range
	const xyz100 = xyzd65;
	const rgbA = adapt(
		multiply_v3_m3x3(xyz100, cat16).map((c, i) => c * env.dRgb[i]),
		env.fl
	);
	const a = rgbA[0] + (-12 * rgbA[1] + rgbA[2]) / 11;
	const b = (rgbA[0] + rgbA[1] - 2 * rgbA[2]) / 9;
	const hRad = ((Math.atan2(b, a) % tau) + tau) % tau;
	const et = 0.25 * (Math.cos(hRad + 2) + 3.8);
	const t = (5e4 / 13) * env.nc * env.ncb * zdiv(et * Math.sqrt(a * a + b * b), rgbA[0] + rgbA[1] + 1.05 * rgbA[2] + 0.305);
	const alpha = spow(t, 0.9) * Math.pow(1.64 - Math.pow(0.29, env.n), 0.73);
	const A = env.nbb * (2 * rgbA[0] + rgbA[1] + 0.05 * rgbA[2]);
	const Jroot = spow(A / env.aW, 0.5 * env.c * env.z);
	const J = 100 * spow(Jroot, 2);
	const Q = (4 / env.c) * Jroot * (env.aW + 4) * env.flRoot;
	const C = alpha * Jroot;
	const M = C * env.flRoot;
	const h = constrain(hRad * (180 / Math.PI));
	const H = hueQuadrature(h);
	const s = 50 * spow((env.c * alpha) / (env.aW + 4), 1 / 2);
	return { J, C, h, s, Q, M, H };
}

/* CAM16 Space */
const cam16 = {
	name: 'cam16',
	channel: ['J', 'M', 'h'],
	range: [[0, 100], [0, 100], [0, 360]]
};

xyz.cam16 = (x, y, z) => {
	const res = toCam16([x, y, z], viewingConditions);
	return [res.J, res.M, res.h];
}

cam16.xyz = (J, M, h) => {
	return fromCam16({ J, M, h }, viewingConditions);
}

export default cam16;
