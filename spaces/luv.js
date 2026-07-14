/**
 * CIE L*u*v* (CIELUV) is the CIE's 1976 companion to CIELAB, an alternative
 * attempt at perceptual uniformity built from a projected version of the CIE
 * chromaticity diagram rather than Lab's opponent differencing. Its defining
 * property is additivity: the position of a mixture of two lights falls on the
 * straight line between the two lights' own coordinates, something Lab cannot do.
 * That has made LUV the traditional choice for additive-color contexts like
 * displays and stage lighting, while Lab remains dominant for reflective and print
 * color.
 *
 * @see {@link https://en.wikipedia.org/wiki/CIELUV}
 * @wiki {@link https://en.wikipedia.org/wiki/CIELUV}
 * @year 1976
 * @by CIE
 * @use Additive-mixture-accurate perceptual space for displays and stage lighting; still used, less common than CIELAB.
 * @channel {L} 0 100 Lightness
 * @channel {U} -215 215 U chrominance
 * @channel {V} -215 215 V chrominance
 * @method opponent
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';
import whitepoint from '../whitepoints.js';
import { labF, labFInv } from '../cie.js';

var luv = {
	name: 'luv',
	// u/v ±215 — colorjs.io/coloraide reference range (sRGB reaches u ≈ 175, v ≈ −134..107)
	range: [[0, 100], [-215, 215], [-215, 215]],

	xyz: function (l, u, v, i, o) {
		// Input: L: 0-100, u/v: ±215
		var _u, _v, x, y, z, xn, yn, zn, un, vn;

		if (l === 0) return [0, 0, 0];

		//get illuminant/observer
		i = i || 'D65';
		o = o || 2;

		xn = whitepoint[o][i][0];
		yn = whitepoint[o][i][1];
		zn = whitepoint[o][i][2];

		un = (4 * xn) / (xn + (15 * yn) + (3 * zn));
		vn = (9 * yn) / (xn + (15 * yn) + (3 * zn));

		// Compute u', v' from conventional values
		// Original: _u = u / (13 * L) + un
		_u = u / (13 * l) + un || 0;
		_v = v / (13 * l) + vn || 0;

		// Y from L* (CIELAB companding), scaled by the white's Y
		y = yn * labFInv((l + 16) / 116);

		//wikipedia method for X and Z from Y, u', v'
		x = y * 9 * _u / (4 * _v) || 0;
		z = y * (12 - 3 * _u - 20 * _v) / (4 * _v) || 0;

		//boronine method
		//https://github.com/boronine/husl/blob/master/husl.coffee#L201
		// x = 0 - (9 * y * _u) / ((_u - 4) * _v - _u * _v);
		// z = (9 * y - (15 * _v * y) - (_v * x)) / (3 * _v);

		// Output: XYZ in 0-100 range
		return [x, y, z];
	}
};

export default (luv);

// http://www.brucelindbloom.com/index.html?Equations.html
// https://github.com/boronine/husl/blob/master/husl.coffee
//i - illuminant
//o - observer
xyz.luv = function (x, y, z, i, o) {
	// Input: XYZ in 0-100 range
	var _u, _v, l, u, v, xn, yn, zn, un, vn;

	//get illuminant/observer coords
	i = i || 'D65';
	o = o || 2;

	xn = whitepoint[o][i][0];
	yn = whitepoint[o][i][1];
	zn = whitepoint[o][i][2];

	un = (4 * xn) / (xn + (15 * yn) + (3 * zn));
	vn = (9 * yn) / (xn + (15 * yn) + (3 * zn));


	_u = (4 * x) / (x + (15 * y) + (3 * z)) || 0;
	_v = (9 * y) / (x + (15 * y) + (3 * z)) || 0;

	// L* via CIELAB companding (fixes the prior 2-ULP κ literal + Math.pow vs Math.cbrt)
	l = 116 * labF(y / yn) - 16;

	u = 13 * l * (_u - un);
	v = 13 * l * (_v - vn);

	// Output: L: 0-100, u/v: ±215 reference range
	return [l, u, v];
};
