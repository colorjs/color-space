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
 * @aka Display P3; DCI-P3 D65
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
import p3Linear, { M as M_P3 } from './p3-linear.js';
import xyz, { M_LRGB_INV } from './xyz.js';
import rgb from './rgb.js';
import { mat3, mul3, inv3 } from '../math.js';
import { srgbToLinear, linearToSrgb } from '../transfers.js';

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

// ── the display route, composed in source (as lab.js composes its own): sRGB and P3
// share the transfer and the D65 white, so linear P3 → XYZ → linear sRGB pre-multiplies
// into one matrix and the 0-100 XYZ convention cancels out of the seam — one multiply
// per call instead of two hops through XYZ
const M_P3_LRGB = mul3(M_LRGB_INV, M_P3);   // linear P3 → linear sRGB
const M_LRGB_P3 = inv3(M_P3_LRGB);          // derived exact inverse

p3.rgb = (r, g, b) => {
	const v = mat3(M_P3_LRGB, srgbToLinear(r), srgbToLinear(g), srgbToLinear(b));
	return [255 * linearToSrgb(v[0]), 255 * linearToSrgb(v[1]), 255 * linearToSrgb(v[2])];
};

rgb.p3 = (r, g, b) => {
	const v = mat3(M_LRGB_P3, srgbToLinear(r / 255), srgbToLinear(g / 255), srgbToLinear(b / 255));
	return [linearToSrgb(v[0]), linearToSrgb(v[1]), linearToSrgb(v[2])];
};

export default p3;
