/**
 * LCh(ab) color space
 *
 * Cylindrical LAB with lightness, chroma, and hue
 * More intuitive than rectangular Lab coordinates
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#cie-lab}
 * @channel {L} 0 100 Lightness
 * @channel {C} 0 150 Chroma
 * @channel {H} 0 360 Hue angle in degrees
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';
import lab from './lab.js';
import { cartToPolar, polarToCart } from './util.js';


//cylindrical lab
var lchab = {
	name: 'lchab',

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
