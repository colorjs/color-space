/**
 * Cylindrical CIE LUV
 *
 * @module color-space/lchuv
 */
import luv from './luv.js';
import xyz from './xyz.js';

// cylindrical luv
var lchuv = {
	name: 'lchuv',
	channel: ['lightness', 'chroma', 'hue'],
	alias: ['LCHuv', 'cielchuv'],
	min: [0, 0, 0],
	max: [100, 100, 360],

	luv: function (luv) {
		var l = luv[0],
			c = luv[1],
			h = luv[2],
			u, v, hr;

		hr = h / 360 * 2 * Math.PI;
		u = c * Math.cos(hr);
		v = c * Math.sin(hr);
		return [l, u, v];
	},

	xyz: function (arg) {
		return luv.xyz(lchuv.luv(arg));
	}
};

export default (lchuv);

luv.lchuv = function (luv) {
	var l = luv[0], u = luv[1], v = luv[2];

	var c = Math.sqrt(u * u + v * v);
	var hr = Math.atan2(v, u);
	var h = hr * 360 / 2 / Math.PI;
	if (h < 0) {
		h += 360;
	}

	return [l, c, h]
};

xyz.lchuv = function (arg) {
	return luv.lchuv(xyz.luv(arg));
};
