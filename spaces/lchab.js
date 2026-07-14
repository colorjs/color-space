/**
 * LCh(ab) is the cylindrical form of CIELAB, the CIE's 1976 perceptual space,
 * converting its rectangular a/b axes into chroma and hue so color can be adjusted
 * the way people actually think about it — how saturated, and what hue — rather
 * than as red-green and yellow-blue offsets. Lightness carries over unchanged from
 * Lab, so the two share the same perceptual uniformity; only the color-axis
 * representation differs. It underlies CSS Color 4's lch() function and is a
 * common choice for building perceptually even saturation or hue controls.
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#cie-lab}
 * @wiki {@link https://en.wikipedia.org/wiki/CIELAB_color_space#Cylindrical_model}
 * @year 1976
 * @by CIE
 * @use Intuitive saturation/hue adjustment; current, underlies CSS Color 4's lch().
 * @channel {L} 0 100 Lightness
 * @channel {C} 0 150 Chroma
 * @channel {H} 0 360 Hue angle in degrees
 * @method cylindrical
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';
import lab from './lab.js';
import { cartToPolar, polarToCart } from '../util.js';


//cylindrical lab
var lchab = {
	name: 'lchab',
	range: [[0, 100], [0, 150], [0, 360]],

	xyz: function (l, c, h) {
		return lab.xyz(...lchab.lab(l, c, h));
	},

	// L,C,H -> L,a,b (C: 0-150, H: 0-360 -> a,b: -125 to 125)
	lab: (l, c, h) => polarToCart(l, c, h)
};


//extend lab: L,a,b -> L,C,H
lab.lchab = (l, a, b) => cartToPolar(l, a, b);

xyz.lchab = function (x, y, z) {
	return lab.lchab(...xyz.lab(x, y, z));
};


export default (lchab);
