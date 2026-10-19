/**
 * LCh(ab) is the cylindrical form of CIELAB, the CIE's 1976 perceptual space: its a/b axes
 * become chroma and hue, so you adjust how saturated and which hue instead of red-green and
 * yellow-blue offsets. Lightness carries over unchanged from Lab, and so does its uniformity.
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#cie-lab}
 * @wiki {@link https://en.wikipedia.org/wiki/CIELAB_color_space#Cylindrical_model}
 * @year 1976
 * @by CIE
 * @aka CIE LCh; CIELCh
 * @use Saturation and hue adjustment; underlies CSS Color 4's lch().
 * @channel {L} 0 100 Lightness
 * @channel {C} 0 150 Chroma
 * @channel {H} 0 360 Hue angle in degrees
 * @method cylindrical
 * @encoding perceptual
 * @illuminant D50
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import lab from './lab.js';
import { cartToPolar, polarToCart } from '../math.js';


//cylindrical lab
var lchab = {
	name: 'lchab',
	range: [[0, 100], [0, 150], [0, 360]],

	// L,C,H -> L,a,b (C: 0-150, H: 0-360 -> a,b: -125 to 125)
	lab: (l, c, h) => polarToCart(l, c, h)
};


//extend lab: L,a,b -> L,C,H
lab.lchab = (l, a, b) => cartToPolar(l, a, b);

export default (lchab);
