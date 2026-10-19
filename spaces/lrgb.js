/**
 * Linear-light sRGB — sRGB's D65 white point and primaries without its gamma-like transfer
 * curve, so channel values are proportional to light intensity. Displays don't use it
 * directly; color math does, since operating on gamma-encoded values gives wrong results.
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#predefined-sRGB-linear}
 * @year 1996
 * @by HP & Microsoft (sRGB)
 * @use Color mixing and colorimetric conversion; foundational in color-managed rendering.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding linear
 * @gamut srgb
 * @referred display
 * @dynamic sdr
 */
import rgb from './rgb.js';
import { srgbToLinear, linearToSrgb } from '../transfers.js';

const lrgb = {
	name: 'lrgb',
	range: [[0, 1], [0, 1], [0, 1]]
};

// sRGB 0-255 -> linear 0-1
rgb.lrgb = (r, g, b) => [srgbToLinear(r / 255), srgbToLinear(g / 255), srgbToLinear(b / 255)];

// linear 0-1 -> sRGB 0-255
lrgb.rgb = (r, g, b) => [255 * linearToSrgb(r), 255 * linearToSrgb(g), 255 * linearToSrgb(b)];


export default lrgb;
