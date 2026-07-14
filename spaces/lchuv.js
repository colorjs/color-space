/**
 * LCh(uv) is the cylindrical form of CIELUV, the CIE's 1976 companion to CIELAB,
 * converting its rectangular u/v axes into chroma and hue much as LCh(ab) does for
 * Lab. It inherits LUV's defining additivity — mixtures of lights move predictably
 * through the space — while giving a more intuitive saturation-and-hue handle for
 * adjusting or comparing colors. It's also the basis for HSLuv and HPLuv, which
 * rescale its chroma to fit the sRGB gamut.
 *
 * @see {@link https://en.wikipedia.org/wiki/CIELUV#Cylindrical_representation_(CIELCh)}
 * @wiki {@link https://en.wikipedia.org/wiki/CIELUV#Cylindrical_representation_(CIELCh)}
 * @year 1976
 * @by CIE
 * @use Saturation/hue adjustment in additive-mixture contexts; current, basis for HSLuv/HPLuv.
 * @channel {L} 0 100 Lightness
 * @channel {C} 0 220 Chroma
 * @channel {H} 0 360 Hue angle in degrees
 * @method cylindrical
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import luv from './luv.js';
import xyz from './xyz.js';
import { cartToPolar, polarToCart } from '../util.js';

// cylindrical luv
var lchuv = {
	name: 'lchuv',
	// C 0-220 — colorjs.io/coloraide reference range (sRGB reaches C ≈ 179)
	range: [[0, 100], [0, 220], [0, 360]],

	// L,C,H -> L,u,v (u,v: ±215)
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
