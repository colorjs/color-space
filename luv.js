/**
 * CIE LUV (C'est la vie)
 *
 * @module color-space/luv
 */
import xyz from './xyz.js';

var luv = {
	name: 'luv',
	//NOTE: luv has no rigidly defined limits
	//easyrgb fails to get proper coords
	//boronine states no rigid limits
	//colorMine refers this ones:
	channel: ['lightness', 'u', 'v'],

	xyz: function (l, u, v, i, o) {
		// L is normalized to [0,1], u and v are signed values (centered at 0)
		// Our encoding: L_real = l*100, u_real = u*100, v_real = v*100
		//
		// Original formula uses unbounded u, v values
		// We divide by 100 to scale them, but they remain signed and unbounded

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
		// un = 0.19783000664283;
		// vn = 0.46831999493879;

		// Compute u', v' from our scaled values
		// Original: _u = u_real / (13 * L_real) + un
		// Substituting: _u = (u*100) / (13 * l*100) + un = u / (13*l) + un
		_u = u / (13 * l) + un || 0;
		_v = v / (13 * l) + vn || 0;

		// Compute Y from L
		// Original: y = L_real > 8 ? yn * ((L_real + 16)/116)^3 : yn * L_real * k
		// Threshold: l*100 > 8  =>  l > 0.08
		y = l > 0.08 ? yn * Math.pow((l * 100 + 16) / 116, 3) : yn * (l * 100) * k;

		//wikipedia method for X and Z from Y, u', v'
		x = y * 9 * _u / (4 * _v) || 0;
		z = y * (12 - 3 * _u - 20 * _v) / (4 * _v) || 0;

		//boronine method
		//https://github.com/boronine/husl/blob/master/husl.coffee#L201
		// x = 0 - (9 * y * _u) / ((_u - 4) * _v - _u * _v);
		// z = (9 * y - (15 * _v * y) - (_v * x)) / (3 * _v);

		return [x, y, z];
	}
};

export default (luv);

// http://www.brucelindbloom.com/index.html?Equations.html
// https://github.com/boronine/husl/blob/master/husl.coffee
//i - illuminant
//o - observer
xyz.luv = function (x, y, z, i, o) {
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

	// Normalize output to 0-1 range
	return [l / 100, u / 100, v / 100];
};
