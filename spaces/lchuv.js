/**
 * LCh(uv) is the cylindrical form of CIELUV, the CIE's 1976 companion to CIELAB: its u/v axes
 * become chroma and hue, a handle for adjusting or comparing colors. Its hue angle comes
 * straight from LUV's u′v′ diagram, where mixtures of lights fall on straight lines, so a
 * light mixed with white keeps its hue angle. HSLuv and HPLuv rescale its chroma to fit the
 * sRGB gamut.
 *
 * @see {@link https://cie.co.at/publications/colorimetry-4th-edition} CIE 15:2018
 * @wiki {@link https://en.wikipedia.org/wiki/CIELUV#Cylindrical_representation_(CIELCh)}
 * @year 1976
 * @by CIE
 * @use Saturation/hue adjustment in additive-mixture contexts; basis for HSLuv/HPLuv.
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
import { cartToPolar, polarToCart } from '../math.js';

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
