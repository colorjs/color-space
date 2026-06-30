/**
 * OkLrch color space
 *
 * Cylindrical variant of OkLrab
 * Uses chroma and hue for intuitive color selection
 *
 * @channel {L} 0 100 Lightness
 * @channel {C} 0 40 Chroma
 * @channel {H} 0 360 Hue angle in degrees
 * @referred display
 * @dynamic sdr
 */
// Oklrch
// https://bottosson.github.io/posts/colorpicker/

import oklrab from './oklrab.js';
import { cartToPolar, polarToCart } from './util.js';

var oklrch = {
	name: 'oklrch'
};

// L,C,H -> L,a,b (C 0-40, H 0-360)
oklrch.oklrab = (l, c, h) => polarToCart(l, c, h);

// L,a,b -> L,C,H (achromatic hue -> 0)
oklrab.oklrch = (l, a, b) => cartToPolar(l, a, b);

export default oklrch;
