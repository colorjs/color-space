/**
 * OKLCH is the cylindrical form of Björn Ottosson's 2020 OKLab, with perceptual
 * lightness, chroma and hue. Designed so equal numeric steps look equal to the eye,
 * it fixes CIELAB's blue-shift and is now the workhorse of modern CSS: `oklch()` is
 * the recommended way to define design-token palettes on the web.
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#ok-lab}
 * @wiki {@link https://en.wikipedia.org/wiki/Oklab_color_space}
 * @year 2020
 * @by Björn Ottosson
 * @use Design-token palettes and modern CSS color authoring; current, the recommended CSS form.
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
import oklab from './oklab.js';
import rgb from './rgb.js';
import { cartToPolar, polarToCart } from '../util.js';

var oklch = {
	name: 'oklch',
	range: [[0, 1], [0, 0.4], [0, 360]]
};

// L,C,H -> L,a,b (C 0-0.4, H 0-360)
oklch.oklab = (l, c, h) => polarToCart(l, c, h);

// L,a,b -> L,C,H (achromatic hue -> 0)
oklab.oklch = (l, a, b) => cartToPolar(l, a, b);

oklch.rgb = (l, c, h) => { const v = oklch.oklab(l, c, h); return oklab.rgb(v[0], v[1], v[2]) };
rgb.oklch = (r, g, b) => { const v = rgb.oklab(r, g, b); return oklab.oklch(v[0], v[1], v[2]) };

export default oklch;
