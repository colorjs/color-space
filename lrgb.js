/**
 * Linear RGB space.
 *
 * @module  color-space/lrgb
 */
import rgb from './rgb.js';

const lrgb = {
	name: 'lrgb',
	min: [0, 0, 0],
	max: [1, 1, 1],
	channel: ['red', 'green', 'blue']
};

lrgb.rgb = lrgb => lrgb.map(channel => ((channel /= 255) <= 0.0031308
	? 12.92 * channel
	: 1.055 * channel ** (1 / 2.4) - 0.055) * 255)
rgb.lrgb = rgb => rgb.map(c => (c / 255) <= 0.04045 ? (c / 255) / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4);

// TODO: add xyz transform, see https://github.com/color-js/color.js/blob/main/src/spaces/srgb-linear.js

export default lrgb;
