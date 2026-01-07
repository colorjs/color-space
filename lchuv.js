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
	min: [0, 0, 0],
	max: [100, 100, 360],

	luv: function (l, c, h) {
		var u, v, hr;

		hr = h / 360 * 2 * Math.PI;
		u = c * Math.cos(hr);
		v = c * Math.sin(hr);
		return [l, u, v];
	},

	xyz: function (l, c, h) {
		return luv.xyz(...lchuv.luv(l, c, h));
	}
};

export default (lchuv);

luv.lchuv = function (l, u, v) {
	var c = Math.sqrt(u * u + v * v);
	var hr = Math.atan2(v, u);
	var h = hr * 360 / 2 / Math.PI;
	if (h < 0) {
		h += 360;
	}

	return [l, c, h]
};

xyz.lchuv = function (x, y, z) {
	return luv.lchuv(...xyz.luv(x, y, z));
};
