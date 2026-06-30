/**
 * LCh (D65) color space
 *
 * Cylindrical (polar) form of lab-d65 — intuitive hue/chroma with the D65 white
 * point. For the CSS/ICC D50 LCh, use `lchab`.
 *
 * @see {@link https://cie.co.at/publications/colorimetry-4th-edition}
 * @channel {L} 0 100 Lightness
 * @channel {C} 0 150 Chroma
 * @channel {H} 0 360 Hue angle in degrees
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import labD65 from './lab-d65.js';
import { cartToPolar, polarToCart } from './util.js';

const lchD65 = {
	name: 'lch-d65',
	range: [[0, 100], [0, 150], [0, 360]]
};

// LCh -> Lab (D65)
lchD65[labD65.name] = (l, c, h) => polarToCart(l, c, h);

// Lab (D65) -> LCh (achromatic hue -> 0)
labD65[lchD65.name] = (l, a, b) => cartToPolar(l, a, b);

export default lchD65;
