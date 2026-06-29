/**
 * CIE LUV color space (C'est la vie)
 *
 * Cylindrical variant: LChuv
 * Perceptually more uniform than XYZ
 *
 * @channel {L} 0 100 Lightness
 * @channel {U} -100 100 U chrominance
 * @channel {V} -100 100 V chrominance
 * @illuminant D65
 * @observer 2
 */
import xyz from './xyz.js';

var luv = {
	name: 'luv',

	xyz: function (l, u, v, i, o) {
		// Input: L: 0-100, u: -100 to 100, v: -100 to 100
		var _u, _v, x, y, z, xn, yn, zn, un, vn;

		if (l === 0) return [0, 0, 0];

		//get constants
		//var e = 0.008856451679035631; //(6/29)^3
		var k = 0.0011070564598794539; //(3/29)^3

		//get illuminant/observer
		i = i || 'D65';
		o = o || 2;

		xn = xyz.whitepoint[o][i][0];
		yn = xyz.whitepoint[o][i][1];
		zn = xyz.whitepoint[o][i][2];

		un = (4 * xn) / (xn + (15 * yn) + (3 * zn));
		vn = (9 * yn) / (xn + (15 * yn) + (3 * zn));

		// Compute u', v' from conventional values
		// Original: _u = u / (13 * L) + un
		_u = u / (13 * l) + un || 0;
		_v = v / (13 * l) + vn || 0;

		// Compute Y from L
		// Original: y = L > 8 ? yn * ((L + 16)/116)^3 : yn * L * k
		// Note: XYZ whitepoint is now in 0-100 range, so we need to scale
		y = l > 8 ? yn * Math.pow((l + 16) / 116, 3) : yn * l * k;

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

	//get constants
	var e = 0.008856451679035631; //(6/29)^3
	var k = 903.2962962962961; //(29/3)^3

	//get illuminant/observer coords
	i = i || 'D65';
	o = o || 2;

	xn = xyz.whitepoint[o][i][0];
	yn = xyz.whitepoint[o][i][1];
	zn = xyz.whitepoint[o][i][2];

	un = (4 * xn) / (xn + (15 * yn) + (3 * zn));
	vn = (9 * yn) / (xn + (15 * yn) + (3 * zn));


	_u = (4 * x) / (x + (15 * y) + (3 * z)) || 0;
	_v = (9 * y) / (x + (15 * y) + (3 * z)) || 0;

	var yr = y / yn;

	l = yr <= e ? k * yr : 116 * Math.pow(yr, 1 / 3) - 16;

	u = 13 * l * (_u - un);
	v = 13 * l * (_v - vn);

	// Output: L: 0-100, u: -100 to 100, v: -100 to 100
	return [l, u, v];
};
