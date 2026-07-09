/**
 * Linear-light sRGB — the same D65 white point and primaries as sRGB, but with the
 * gamma-like transfer curve removed so that channel values sit directly proportional
 * to light intensity. It is not a space displays use directly; instead it is the
 * physically meaningful intermediate for color math such as mixing, blending and
 * colorimetric conversions, where operating on gamma-encoded values would give wrong
 * results.
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#predefined-sRGB-linear}
 * @year 1996
 * @by HP & Microsoft (sRGB)
 * @use Physically linear intermediate for color mixing, blending, and colorimetric conversion; current, foundational in color-managed rendering.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding linear
 * @referred display
 * @dynamic sdr
 */
import rgb from './rgb.js';
import { srgbToLinear, linearToSrgb } from './transfers.js';

const lrgb = {
	name: 'lrgb',
	range: [[0, 1], [0, 1], [0, 1]]
};

// sRGB 0-255 -> linear 0-1
rgb.lrgb = (r, g, b) => [srgbToLinear(r / 255), srgbToLinear(g / 255), srgbToLinear(b / 255)];

// linear 0-1 -> sRGB 0-255
lrgb.rgb = (r, g, b) => [255 * linearToSrgb(r), 255 * linearToSrgb(g), 255 * linearToSrgb(b)];


export default lrgb;
