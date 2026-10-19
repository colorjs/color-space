/**
 * LCh-D65 is the cylindrical form of Lab-D65, CIELAB reanchored to the D65 white of displays:
 * its a and b axes become chroma and hue.
 *
 * @see {@link https://cie.co.at/publications/colorimetry-4th-edition}
 * @wiki {@link https://en.wikipedia.org/wiki/CIELAB_color_space#Cylindrical_model}
 * @year 1976
 * @by CIE
 * @use Saturation and hue handles in display-color tools, without chromatic adaptation.
 * @channel {L} 0 100 Lightness
 * @channel {C} 0 150 Chroma
 * @channel {H} 0 360 Hue angle in degrees
 * @method cylindrical
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import labD65 from './lab-d65.js';
import { cartToPolar, polarToCart } from '../math.js';

const lchD65 = {
	name: 'lch-d65',
	range: [[0, 100], [0, 150], [0, 360]]
};

// LCh -> Lab (D65)
lchD65[labD65.name] = (l, c, h) => polarToCart(l, c, h);

// Lab (D65) -> LCh (achromatic hue -> 0)
labD65[lchD65.name] = (l, a, b) => cartToPolar(l, a, b);

export default lchD65;
