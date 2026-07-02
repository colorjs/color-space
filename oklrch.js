/**
 * OkLrch color space
 *
 * Cylindrical variant of OkLrab
 * Uses chroma and hue for intuitive color selection
 *
 * @see {@link https://bottosson.github.io/posts/colorpicker/}
 * @channel {L} 0 1 Lightness
 * @channel {C} 0 0.4 Chroma
 * @channel {H} 0 360 Hue angle in degrees
 * @referred display
 * @dynamic sdr
 */
// Oklrch
// https://bottosson.github.io/posts/colorpicker/

import oklrab from './oklrab.js';
import { cartToPolar, polarToCart } from './util.js';

var oklrch = {
	name: 'oklrch',
	range: [[0, 1], [0, 0.4], [0, 360]]
};

// L,C,H -> L,a,b (C 0-0.4, H 0-360)
oklrch.oklrab = (l, c, h) => polarToCart(l, c, h);

// L,a,b -> L,C,H (achromatic hue -> 0)
oklrab.oklrch = (l, a, b) => cartToPolar(l, a, b);

export default oklrch;
