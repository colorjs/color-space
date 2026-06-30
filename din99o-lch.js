/**
 * DIN99o LCh color space
 *
 * Cylindrical (polar) form of DIN99o Lab. Defined relative to din99o-lab;
 * everything else is reached by chaining through it.
 *
 * @see {@link https://en.wikipedia.org/wiki/DIN99}
 * @channel {L} 0 100 Lightness
 * @channel {C} 0 51.484 Chroma
 * @channel {H} 0 360 Hue angle in degrees
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import din99oLab from './din99o-lab.js';
import { cartToPolar, polarToCart } from './util.js';

const din99oLch = {
	name: 'din99o-lch',
	range: [[0, 100], [0, 51.484], [0, 360]]
};

// DIN99o LCh -> DIN99o Lab (polar -> cartesian)
din99oLch[din99oLab.name] = (l, c, h) => polarToCart(l, c, h);

// DIN99o Lab -> DIN99o LCh (cartesian -> polar, achromatic hue -> 0)
din99oLab[din99oLch.name] = (l, a, b) => cartToPolar(l, a, b);

export default din99oLch;
