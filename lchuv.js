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
 * @referred display
 * @dynamic sdr
 */
import luv from './luv.js';
import xyz from './xyz.js';
import { cartToPolar, polarToCart } from './util.js';

// cylindrical luv
var lchuv = {
	name: 'lchuv',

	// L,C,H -> L,u,v (u,v: -100 to 100)
	luv: (l, c, h) => polarToCart(l, c, h),

	xyz: function (l, c, h) {
		return luv.xyz(...lchuv.luv(l, c, h));
	}
};

export default (lchuv);

// L,u,v -> L,C,H (achromatic hue -> 0 via cartToPolar's threshold)
luv.lchuv = (l, u, v) => cartToPolar(l, u, v);

xyz.lchuv = function (x, y, z) {
	return luv.lchuv(...xyz.luv(x, y, z));
};
