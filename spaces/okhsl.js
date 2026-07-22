/**
 * OkHSL is Björn Ottosson's 2021 hue-saturation-lightness remapping of Oklab, built
 * for use in ordinary color-picker interfaces. Saturation is rescaled per hue and
 * lightness so that 100% always lands exactly on the sRGB gamut boundary, giving
 * sliders that stay in gamut and feel evenly spaced across their whole range — a
 * guarantee plain HSL, built on gamma-encoded RGB, never offered. It pairs with
 * OkHSV and OkHWB as a family of perceptually even color pickers derived from Oklab.
 *
 * @see {@link https://bottosson.github.io/posts/colorpicker/#okhsl}
 * @year 2021
 * @by Björn Ottosson
 * @use Perceptually even HSL-style color picker bounded to the sRGB gamut; current, used in modern design tools.
 * @channel {H} 0 360 Hue angle in degrees
 * @channel {S} 0 100 Saturation percentage
 * @channel {L} 0 100 Lightness percentage
 * @method cylindrical
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Okhsl
// https://bottosson.github.io/posts/colorpicker/

import oklab from './oklab.js';
import rgb from './rgb.js';
import { spow } from '../util.js';

var okhsl = {
	name: 'okhsl',
	range: [[0, 360], [0, 100], [0, 100]]
};

export var tau = 2 * Math.PI;

var toLMS = [
	[0.4122214694707629, 0.5363325372617349, 0.0514459932675022],
	[0.2119034958178251, 0.6806995506452344, 0.1073969535369405],
	[0.0883024591900564, 0.2817188391361215, 0.6299787016738222],
];

export var toSRGBLinear = [
	[4.0767416360759583, -3.3077115392580629, 0.2309699031821043],
	[-1.2684379732850315, 2.6097573492876882, -0.3413193760026570],
	[-0.0041960761386756, -0.7034186179359362, 1.7076146940746117],
];

var LabtoLMS_M = [
	[1.0000000000000000, 0.3963377773761749, 0.2158037573099136],
	[1.0000000000000000, -0.1055613458156586, -0.0638541728258133],
	[1.0000000000000000, -0.0894841775298119, -1.2914855480194092],
];

export var RGBCoeff = [
	// Red
	[
		// Limit
		[-1.8817031, -0.80936501],
		// `Kn` coefficients
		[1.19086277, 1.76576728, 0.59662641, 0.75515197, 0.56771245],
	],
	// Green
	[
		// Limit
		[1.8144408, -1.19445267],
		// `Kn` coefficients
		[0.73956515, -0.45954404, 0.08285427, 0.12541073, -0.14503204],
	],
	// Blue
	[
		// Limit
		[0.13110758, 1.81333971],
		// `Kn` coefficients
		[1.35733652, -0.00915799, -1.1513021, -0.50559606, 0.00692167],
	],
];

var floatMax = Number.MAX_VALUE;
var K1 = 0.206;
var K2 = 0.03;
var K3 = (1.0 + K1) / (1.0 + K2);

function vdot(a, b) {
	// Dot two vectors
	var l = a.length;
	// if (l !== b.length) {
	// 	throw new Error(`Vectors of size ${l} and ${b.length} are not aligned`);
	// }

	var s = 0.0;
	for (var i = 0; i < l; i++) {
		s += a[i] * b[i];
	}

	return s;
}

export function toe(x) {
	return 0.5 * (K3 * x - K1 + Math.sqrt((K3 * x - K1) * (K3 * x - K1) + 4 * K2 * K3 * x));
}

export function toeInv(x) {
	return (x ** 2 + K1 * x) / (K3 * (x + K2));
}

export function toSt(cusp) {
	// To ST.
	var l = cusp[0];
	var c = cusp[1];
	return [c / l, c / (1 - l)];
}

function getStMid(a, b) {
	// Returns a smooth approximation of the location of the cusp.
	var s = 0.11516993 + 1.0 / (
		7.44778970 + 4.15901240 * b +
		a * (
			-2.19557347 + 1.75198401 * b +
			a * (
				-2.13704948 - 10.02301043 * b +
				a * (
					-4.24894561 + 5.38770819 * b + 4.69891013 * a
				)
			)
		)
	);

	var t = 0.11239642 + 1.0 / (
		1.61320320 - 0.68124379 * b +
		a * (
			0.40370612 + 0.90148123 * b +
			a * (
				-0.27087943 + 0.61223990 * b +
				a * (
					0.00299215 - 0.45399568 * b - 0.14661872 * a
				)
			)
		)
	);

	return [s, t];
}

function multiply_v3_m3x3(v, m) {
	var [x, y, z] = v;
	var out = [0, 0, 0];
	out[0] = x * m[0][0] + y * m[0][1] + z * m[0][2];
	out[1] = x * m[1][0] + y * m[1][1] + z * m[1][2];
	out[2] = x * m[2][0] + y * m[2][1] + z * m[2][2];
	return out;
}

export function oklabToLinearRGB(lab, lmsToRgb) {
	var lms = multiply_v3_m3x3(lab, LabtoLMS_M);

	lms[0] = lms[0] ** 3;
	lms[1] = lms[1] ** 3;
	lms[2] = lms[2] ** 3;

	return multiply_v3_m3x3(lms, lmsToRgb);
}

export function findCusp(a, b, lmsToRgb, okCoeff) {
	// Finds L_cusp and C_cusp for a given hue.
	// a and b must be normalized so a^2 + b^2 == 1.

	// First, find the maximum saturation (saturation S = C/L)
	var sCusp = computeMaxSaturation(a, b, lmsToRgb, okCoeff);

	// Convert to linear RGB to find the first point where at least one of r, g or b >= 1:
	var rgb = oklabToLinearRGB([1, sCusp * a, sCusp * b], lmsToRgb);
	var lCusp = spow(1.0 / Math.max(...rgb), 1 / 3);
	var cCusp = lCusp * sCusp;

	return [lCusp, cCusp];
}

function findGamutIntersection(a, b, l1, c1, l0, lmsToRgb, okCoeff, cusp) {
	var t;

	if (cusp === undefined) {
		cusp = findCusp(a, b, lmsToRgb, okCoeff);
	}

	// Find the intersection for upper and lower half separately
	if ((l1 - l0) * cusp[1] - (cusp[0] - l0) * c1 <= 0.0) {
		// Lower half
		t = (cusp[1] * l0) / (c1 * cusp[0] + cusp[1] * (l0 - l1));
	} else {
		// Upper half

		// First intersect with triangle
		t = (cusp[1] * (l0 - 1.0)) / (c1 * (cusp[0] - 1.0) + cusp[1] * (l0 - l1));

		// Then one step Halley's method
		var dl = l1 - l0;
		var dc = c1;

		var kl = vdot(LabtoLMS_M[0].slice(1), [a, b]);
		var km = vdot(LabtoLMS_M[1].slice(1), [a, b]);
		var ks = vdot(LabtoLMS_M[2].slice(1), [a, b]);

		var ldt_ = dl + dc * kl;
		var mdt_ = dl + dc * km;
		var sdt_ = dl + dc * ks;

		// If higher accuracy is required, 2 or 3 iterations of the following block can be used:
		var L = l0 * (1.0 - t) + t * l1;
		var C = t * c1;

		var l_ = L + C * kl;
		var m_ = L + C * km;
		var s_ = L + C * ks;

		var l = l_ ** 3;
		var m = m_ ** 3;
		var s = s_ ** 3;

		var ldt = 3 * ldt_ * l_ ** 2;
		var mdt = 3 * mdt_ * m_ ** 2;
		var sdt = 3 * sdt_ * s_ ** 2;

		var ldt2 = 6 * ldt_ ** 2 * l_;
		var mdt2 = 6 * mdt_ ** 2 * m_;
		var sdt2 = 6 * sdt_ ** 2 * s_;

		var r_ = vdot(lmsToRgb[0], [l, m, s]) - 1;
		var r1 = vdot(lmsToRgb[0], [ldt, mdt, sdt]);
		var r2 = vdot(lmsToRgb[0], [ldt2, mdt2, sdt2]);

		var ur = r1 / (r1 * r1 - 0.5 * r_ * r2);
		var tr = -r_ * ur;

		var g_ = vdot(lmsToRgb[1], [l, m, s]) - 1;
		var g1 = vdot(lmsToRgb[1], [ldt, mdt, sdt]);
		var g2 = vdot(lmsToRgb[1], [ldt2, mdt2, sdt2]);

		var ug = g1 / (g1 * g1 - 0.5 * g_ * g2);
		var tg = -g_ * ug;

		var b_ = vdot(lmsToRgb[2], [l, m, s]) - 1;
		var b1 = vdot(lmsToRgb[2], [ldt, mdt, sdt]);
		var b2 = vdot(lmsToRgb[2], [ldt2, mdt2, sdt2]);

		var ub = b1 / (b1 * b1 - 0.5 * b_ * b2);
		var tb = -b_ * ub;

		tr = ur >= 0.0 ? tr : floatMax;
		tg = ug >= 0.0 ? tg : floatMax;
		tb = ub >= 0.0 ? tb : floatMax;

		t += Math.min(tr, Math.min(tg, tb));
	}

	return t;
}

function getCs(lab, lmsToRgb, okCoeff) {
	var [l, a, b] = lab;

	var cusp = findCusp(a, b, lmsToRgb, okCoeff);

	var cMax = findGamutIntersection(a, b, l, 1, l, lmsToRgb, okCoeff, cusp);
	var stMax = toSt(cusp);

	// Scale factor to compensate for the curved part of gamut shape:
	var k = cMax / Math.min(l * stMax[0], (1 - l) * stMax[1]);

	var stMid = getStMid(a, b);

	// Use a soft minimum function, instead of a sharp triangle shape to get a smooth value for chroma.
	var ca = l * stMid[0];
	var cb = (1.0 - l) * stMid[1];
	var cMid = 0.9 * k * Math.sqrt(Math.sqrt(1.0 / (1.0 / ca ** 4 + 1.0 / cb ** 4)));

	// For `C_0`, the shape is independent of hue, so `ST` are constant.
	// Values picked to roughly be the average values of `ST`.
	ca = l * 0.4;
	cb = (1.0 - l) * 0.8;

	// Use a soft minimum function, instead of a sharp triangle shape to get a smooth value for chroma.
	var c0 = Math.sqrt(1.0 / (1.0 / ca ** 2 + 1.0 / cb ** 2));

	return [c0, cMid, cMax];
}

function computeMaxSaturation(a, b, lmsToRgb, okCoeff) {
	// Finds the maximum saturation possible for a given hue that fits in RGB.
	var k0, k1, k2, k3, k4, wl, wm, ws;

	if (vdot(okCoeff[0][0], [a, b]) > 1) {
		// Red component
		[k0, k1, k2, k3, k4] = okCoeff[0][1];
		[wl, wm, ws] = lmsToRgb[0];
	} else if (vdot(okCoeff[1][0], [a, b]) > 1) {
		// Green component
		[k0, k1, k2, k3, k4] = okCoeff[1][1];
		[wl, wm, ws] = lmsToRgb[1];
	} else {
		// Blue component
		[k0, k1, k2, k3, k4] = okCoeff[2][1];
		[wl, wm, ws] = lmsToRgb[2];
	}

	// Approximate max saturation using a polynomial:
	var sat = k0 + k1 * a + k2 * b + k3 * a ** 2 + k4 * a * b;

	// Do one step Halley's method to get closer.
	var kl = vdot(LabtoLMS_M[0].slice(1), [a, b]);
	var km = vdot(LabtoLMS_M[1].slice(1), [a, b]);
	var ks = vdot(LabtoLMS_M[2].slice(1), [a, b]);

	var l_ = 1.0 + sat * kl;
	var m_ = 1.0 + sat * km;
	var s_ = 1.0 + sat * ks;

	var l = l_ ** 3;
	var m = m_ ** 3;
	var s = s_ ** 3;

	var lds = 3.0 * kl * l_ ** 2;
	var mds = 3.0 * km * m_ ** 2;
	var sds = 3.0 * ks * s_ ** 2;

	var lds2 = 6.0 * kl ** 2 * l_;
	var mds2 = 6.0 * km ** 2 * m_;
	var sds2 = 6.0 * ks ** 2 * s_;

	var f = wl * l + wm * m + ws * s;
	var f1 = wl * lds + wm * mds + ws * sds;
	var f2 = wl * lds2 + wm * mds2 + ws * sds2;

	sat = sat - (f * f1) / (f1 ** 2 - 0.5 * f * f2);

	return sat;
}

function constrain(angle) {
	return ((angle % 1) + 1) % 1;
}

// Okhsl -> Oklab
okhsl.oklab = function (h, s, l) {
	// Normalize from conventional ranges
	h = h / 360;
	s = s / 100;
	l = l / 100;

	// Convert Okhsl to Oklab.
	var L = toeInv(l);
	var a = null;
	var b = null;
	h = constrain(h);

	if (L !== 0.0 && L !== 1.0 && s !== 0) {
		var a_ = Math.cos(tau * h);
		var b_ = Math.sin(tau * h);

		var [c0, cMid, cMax] = getCs([L, a_, b_], toSRGBLinear, RGBCoeff);

		var mid = 0.8;
		var midInv = 1.25;
		var t, k0, k1, k2;

		if (s < mid) {
			t = midInv * s;
			k0 = 0.0;
			k1 = mid * c0;
			k2 = 1.0 - k1 / cMid;
		} else {
			t = 5 * (s - 0.8);
			k0 = cMid;
			k1 = (0.2 * cMid ** 2 * 1.25 ** 2) / c0;
			k2 = 1.0 - k1 / (cMax - cMid);
		}

		var c = k0 + (t * k1) / (1.0 - k2 * t);

		a = c * a_;
		b = c * b_;
	}

	// Return native Oklab (L 0-1, a/b ±0.4)
	return [L, a || 0, b || 0];
};

// Oklab -> Okhsl
oklab.okhsl = function (l, a, b) {
	// Input: native Oklab (L 0-1, a/b ±0.4)

	// Oklab to Okhsl.
	var εL = 1e-7;
	var εS = 1e-4;
	var L = l; // L is normalized 0-1
	var s = 0.0;
	var l_ = toe(L); // l_ is output l (0-1)

	var c = Math.sqrt(a ** 2 + b ** 2);
	var h = 0.5 + Math.atan2(-b, -a) / tau;

	if (l_ !== 0.0 && l_ !== 1.0 && c !== 0) {
		var a_ = a / c;
		var b_ = b / c;

		var [c0, cMid, cMax] = getCs([L, a_, b_], toSRGBLinear, RGBCoeff);

		var mid = 0.8;
		var midInv = 1.25;
		var k0, k1, k2, t;

		if (c < cMid) {
			k1 = mid * c0;
			k2 = 1.0 - k1 / cMid;

			t = c / (k1 + k2 * c);
			s = t * mid;
		} else {
			k0 = cMid;
			k1 = (0.2 * cMid ** 2 * midInv ** 2) / c0;
			k2 = 1.0 - k1 / (cMax - cMid);

			t = (c - k0) / (k1 + k2 * (c - k0));
			s = mid + 0.2 * t;
		}
	}

	var achromatic = Math.abs(s) < εS;
	if (achromatic || l_ === 0.0 || Math.abs(1 - l_) < εL) {
		h = 0; // null in original, 0 here
		if (!achromatic) {
			s = 0.0;
		}
	} else {
		h = constrain(h);
	}

	// Scale to conventional ranges
	return [h * 360, s * 100, l_ * 100];
};

okhsl.rgb = (h, s, l) => { const v = okhsl.oklab(h, s, l); return oklab.rgb(v[0], v[1], v[2]) };
rgb.okhsl = (r, g, b) => { const v = rgb.oklab(r, g, b); return oklab.okhsl(v[0], v[1], v[2]) };

export default okhsl;
