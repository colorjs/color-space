/**
 * Adobe RGB — introduced by Adobe in 1998 as a wider-gamut alternative to sRGB,
 * designed to reproduce more of the cyans and greens achievable in CMYK printing.
 * It keeps sRGB's D65 white point but uses different primaries and a slightly
 * different gamma, making it a longstanding standard working space in photography
 * and print production, where sRGB's narrower gamut would clip too much color.
 *
 * @see {@link https://en.wikipedia.org/wiki/Adobe_RGB_color_space}
 * @wiki {@link https://en.wikipedia.org/wiki/Adobe_RGB_color_space}
 * @year 1998
 * @by Adobe Systems
 * @use Wide-gamut photography and print working space; still common where sRGB's gamut clips CMYK-reproducible colors.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding gamma
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
