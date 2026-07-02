/**
 * Linear RGB color space
 *
 * RGB without gamma correction, useful for color math
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#predefined-sRGB-linear}
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
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
