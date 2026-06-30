/**
 * OkLCh color space
 *
 * Cylindrical version of Oklab with cylindrical hue
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#ok-lab}
 * @channel {L} 0 100 Lightness
 * @channel {C} 0 40 Chroma
 * @channel {H} 0 360 Hue angle in degrees
 * @referred display
 * @dynamic sdr
 */
import oklab from './oklab.js';
import rgb from './rgb.js';
import { cartToPolar, polarToCart } from './util.js';

var oklch = {
	name: 'oklch'
};

// L,C,H -> L,a,b (C 0-40, H 0-360)
oklch.oklab = (l, c, h) => polarToCart(l, c, h);

// L,a,b -> L,C,H (achromatic hue -> 0)
oklab.oklch = (l, a, b) => cartToPolar(l, a, b);

oklch.rgb = (...args) => oklab.rgb(...oklch.oklab(...args));
rgb.oklch = (...args) => oklab.oklch(...rgb.oklab(...args));

export default oklch;
