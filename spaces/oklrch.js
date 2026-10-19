/**
 * OkLrch is the cylindrical form of OkLrab, Björn Ottosson's toe-mapped variant of Oklab: its
 * a/b axes become chroma and hue, and the corrected darks carry over.
 *
 * @see {@link https://bottosson.github.io/posts/colorpicker/}
 * @year 2021
 * @by Björn Ottosson
 * @use Palettes and gamut mapping that need accurate darks; niche.
 * @channel {L} 0 1 Lightness
 * @channel {C} 0 0.4 Chroma
 * @channel {H} 0 360 Hue angle in degrees
 * @method cylindrical
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Oklrch
// https://bottosson.github.io/posts/colorpicker/

import oklrab from './oklrab.js';
import { cartToPolar, polarToCart } from '../math.js';

var oklrch = {
	name: 'oklrch',
	range: [[0, 1], [0, 0.4], [0, 360]]
};

// L,C,H -> L,a,b (C 0-0.4, H 0-360)
oklrch.oklrab = (l, c, h) => polarToCart(l, c, h);

// L,a,b -> L,C,H (achromatic hue -> 0)
oklrab.oklrch = (l, a, b) => cartToPolar(l, a, b);

export default oklrch;
