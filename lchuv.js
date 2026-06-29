/**
 * LCh(uv) color space
 *
 * Cylindrical CIE LUV with lightness, chroma, and hue
 *
 * @channel {L} 0 100 Lightness
 * @channel {C} 0 150 Chroma
 * @channel {H} 0 360 Hue angle in degrees
 * @illuminant D65
 * @observer 2
 */
import luv from './luv.js';
import xyz from './xyz.js';

// cylindrical luv
var lchuv = {
	name: 'lchuv',

	luv: function (l, c, h) {
		// Input: L: 0-100, C: 0-150, H: 0-360
		// Output: L: 0-100, u: -100 to 100, v: -100 to 100
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
	// Input: L: 0-100, u: -100 to 100, v: -100 to 100
	// Output: L: 0-100, C: 0-150, H: 0-360
	var c = Math.sqrt(u * u + v * v);
	// achromatic (c=0, incl. ±0 u/v): hue undefined -> 0, avoid atan2(-0,-0)=-π => 180
	var h = c === 0 ? 0 : Math.atan2(v, u) / (2 * Math.PI) * 360;
	if (h < 0) {
		h += 360;
	}

	return [l, c, h]
};

xyz.lchuv = function (x, y, z) {
	return luv.lchuv(...xyz.luv(x, y, z));
};
