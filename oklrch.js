/**
 * OkLrch is the cylindrical form of OkLrab, Björn Ottosson's toe-mapped variant of
 * Oklab, converting its lightness and rectangular a/b axes into lightness, chroma
 * and hue. It carries over OkLrab's corrected dark-tone behavior while presenting
 * color the way people usually reason about it — a hue at some strength and
 * brightness — making it a natural fit for palette generation and gamut-mapping
 * tools that need both accurate darks and an intuitive chroma/hue handle.
 *
 * @see {@link https://bottosson.github.io/posts/colorpicker/}
 * @year 2021
 * @by Björn Ottosson
 * @use Cylindrical OkLrab for palette generation and gamut mapping needing accurate darks; current, niche/technical use.
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
