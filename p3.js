/**
 * Display P3 color space (Apple Display P3)
 *
 * DCI-P3 color space with gamma correction
 * Wider gamut than sRGB, used in modern displays
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#predefined-display-p3}
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import p3Linear from './p3-linear.js';
import xyz from './xyz.js';
import { srgbToLinear, linearToSrgb } from './transfers.js';

const p3 = {
	name: 'p3',
	range: [[0, 1], [0, 1], [0, 1]]
};

// Display-P3 shares the sRGB transfer; only the primaries (p3-linear) differ.
p3.xyz = (r, g, b) => p3Linear.xyz(srgbToLinear(r), srgbToLinear(g), srgbToLinear(b));

xyz.p3 = (x, y, z) => {
	const [lr, lg, lb] = xyz['p3-linear'](x, y, z);
	return [linearToSrgb(lr), linearToSrgb(lg), linearToSrgb(lb)];
}

export default p3;
