/**
 * Adobe RGB color space (Adobe RGB 1998)
 *
 * Wider gamut than sRGB, standard for photography
 *
 * @see {@link https://en.wikipedia.org/wiki/Adobe_RGB_color_space}
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import a98Linear from './a98rgb-linear.js';
import xyz from './xyz.js';
import { spow } from './util.js';

const a98rgb = {
	name: 'a98rgb',
	range: [[0, 1], [0, 1], [0, 1]]
};

const gamma = 563 / 256;
const invGamma = 256 / 563;

a98rgb.xyz = (r, g, b) => a98Linear.xyz(spow(r, gamma), spow(g, gamma), spow(b, gamma));

xyz.a98rgb = (x, y, z) => {
	const [lr, lg, lb] = xyz['a98rgb-linear'](x, y, z);
	return [spow(lr, invGamma), spow(lg, invGamma), spow(lb, invGamma)];
}

export default a98rgb;
