/**
 * OKLCH is the cylindrical form of Björn Ottosson's 2020 OKLab, with perceptual
 * lightness, chroma and hue. Designed so equal numeric steps look equal to the eye,
 * it fixes CIELAB's blue-shift and is now the workhorse of modern CSS: `oklch()` is
 * the recommended way to define design-token palettes on the web.
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#ok-lab}
 * @channel {L} 0 1 Lightness
 * @channel {C} 0 0.4 Chroma
 * @channel {H} 0 360 Hue angle in degrees
 * @referred display
 * @dynamic sdr
 */
import oklab from './oklab.js';
import rgb from './rgb.js';
import { cartToPolar, polarToCart } from './util.js';

var oklch = {
	name: 'oklch',
	range: [[0, 1], [0, 0.4], [0, 360]]
};

// L,C,H -> L,a,b (C 0-0.4, H 0-360)
oklch.oklab = (l, c, h) => polarToCart(l, c, h);

// L,a,b -> L,C,H (achromatic hue -> 0)
oklab.oklch = (l, a, b) => cartToPolar(l, a, b);

oklch.rgb = (...args) => oklab.rgb(...oklch.oklab(...args));
rgb.oklch = (...args) => oklab.oklch(...rgb.oklab(...args));

export default oklch;
