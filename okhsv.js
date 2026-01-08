// Okhsv
// https://bottosson.github.io/posts/colorpicker/

import oklab from './oklab.js';
import rgb from './rgb.js';
import {
	tau,
	toe,
	toeInv,
	findCusp,
	toSt,
	oklabToLinearRGB,
	toSRGBLinear,
	RGBCoeff,
} from './okhsl.js';

var okhsv = {
	name: 'okhsv',
	channel: ['h', 's', 'v'],
	range: [[0, 360], [0, 100], [0, 100]]
};

function spow(a, b) {
	return Math.abs(a) ** b * Math.sign(a);
}

function constrain(angle) {
	return ((angle % 1) + 1) % 1;
}

// Okhsv -> Oklab
okhsv.oklab = function (h, s, v) {
	// Normalize from conventional ranges
	h = h / 360;
	s = s / 100;
	v = v / 100;

	// Convert from Okhsv to Oklab.
	h = constrain(h);

	var l = toeInv(v);
	var a = null;
	var b = null;

	// Avoid processing gray or colors with undefined hues
	if (l !== 0.0 && s !== 0.0) {
		var a_ = Math.cos(tau * h);
		var b_ = Math.sin(tau * h);

		var cusp = findCusp(a_, b_, toSRGBLinear, RGBCoeff);
		var [sMax, tMax] = toSt(cusp);
		var s0 = 0.5;
		var k = 1 - s0 / sMax;

		// first we compute L and V as if the gamut is a perfect triangle:

		// L, C when v==1:
		var lv = 1 - (s * s0) / (s0 + tMax - tMax * k * s);
		var cv = (s * tMax * s0) / (s0 + tMax - tMax * k * s);

		l = v * lv;
		var c = v * cv;

		// then we compensate for both toe and the curved top part of the triangle:
		var lvt = toeInv(lv);
		var cvt = (cv * lvt) / lv;

		var lNew = toeInv(l);
		c = (c * lNew) / l;
		l = lNew;

		// RGB scale
		var [rs, gs, bs] = oklabToLinearRGB([lvt, a_ * cvt, b_ * cvt], toSRGBLinear);
		var scaleL = spow(1.0 / Math.max(Math.max(rs, gs), Math.max(bs, 0.0)), 1 / 3);

		l = l * scaleL;
		c = c * scaleL;

		a = c * a_;
		b = c * b_;
	}

	// Return in Oklab conventional range: L 0-100, a/b ±40
	return [l * 100, (a || 0) * 100, (b || 0) * 100];
};

// Oklab -> Okhsv
oklab.okhsv = function (l, a, b) {
	// Input: Oklab L 0-100, a/b ±40
	// Normalize to 0-1 scale
	l = l / 100;
	a = a / 100;
	b = b / 100;

	// Oklab to Okhsv.

	// Epsilon for saturation just needs to be sufficiently close when denoting achromatic
	var ε = 1e-4;
	var L = l;
	var s = 0.0;
	var v = toe(L);
	var c = Math.sqrt(a ** 2 + b ** 2);
	var h = 0.5 + Math.atan2(-b, -a) / tau;

	if (L !== 0.0 && L !== 1 && c !== 0.0) {
		var a_ = a / c;
		var b_ = b / c;

		var cusp = findCusp(a_, b_, toSRGBLinear, RGBCoeff);
		var [sMax, tMax] = toSt(cusp);
		var s0 = 0.5;
		var k = 1 - s0 / sMax;

		// first we find `L_v`, `C_v`, `L_vt` and `C_vt`
		var t = tMax / (c + L * tMax);
		var lv = t * L;
		var cv = t * c;

		var lvt = toeInv(lv);
		var cvt = (cv * lvt) / lv;

		// we can then use these to invert the step that compensates
		// for the toe and the curved top part of the triangle:
		var [rs, gs, bs] = oklabToLinearRGB([lvt, a_ * cvt, b_ * cvt], toSRGBLinear);
		var scaleL = spow(1.0 / Math.max(Math.max(rs, gs), Math.max(bs, 0.0)), 1 / 3);

		L = L / scaleL;
		c = c / scaleL;

		c = (c * toe(L)) / L;
		L = toe(L);

		// we can now compute v and s:
		v = L / lv;
		s = ((s0 + tMax) * cv) / (tMax * s0 + tMax * k * cv);
	}

	if (Math.abs(s) < ε || v === 0.0) {
		h = 0;
	} else {
		h = constrain(h);
	}

	// Scale to conventional ranges
	return [h * 360, s * 100, v * 100];
};

okhsv.rgb = (...args) => oklab.rgb(...okhsv.oklab(...args));
rgb.okhsv = (...args) => oklab.okhsv(...rgb.oklab(...args));

export default okhsv;
