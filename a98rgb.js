/**
 * Adobe RGB color space (Adobe RGB 1998)
 *
 * Wider gamut than sRGB, standard for photography
 *
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @illuminant D65
 * @observer 2
 */
import a98Linear from './a98rgb-linear.js';
import xyz from './xyz.js';

const a98rgb = {
	name: 'a98rgb'
};

const gamma = 563 / 256;
const invGamma = 256 / 563;

a98rgb.xyz = (r, g, b) => {
	return a98Linear.xyz(
		Math.sign(r) * Math.pow(Math.abs(r), gamma),
		Math.sign(g) * Math.pow(Math.abs(g), gamma),
		Math.sign(b) * Math.pow(Math.abs(b), gamma)
	);
}

xyz.a98rgb = (x, y, z) => {
	const [lr, lg, lb] = xyz['a98rgb-linear'](x, y, z);
	return [
		Math.sign(lr) * Math.pow(Math.abs(lr), invGamma),
		Math.sign(lg) * Math.pow(Math.abs(lg), invGamma),
		Math.sign(lb) * Math.pow(Math.abs(lb), invGamma)
	];
}

export default a98rgb;
