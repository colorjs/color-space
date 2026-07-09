/**
 * Display P3 — Apple's wide-gamut display space, introduced with the 2015 iMac and
 * standardized into CSS Color 4 as `display-p3`. It keeps sRGB's transfer curve and
 * D65 white but adopts the wider DCI-P3 film primaries, covering about 25% more
 * colors — the default canvas of modern iPhones, iPads and Macs.
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#predefined-display-p3}
 * @wiki {@link https://en.wikipedia.org/wiki/DCI-P3#P3-D65_(Display_P3)}
 * @year 2015
 * @by Apple
 * @use Wide-gamut display space for Apple devices; current default on iPhone/iPad/Mac, standardized in CSS Color 4.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding gamma
 * @gamut display-p3
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
