/**
 * Linear RGB space.
 * Channels are normalized to 0..1 range
 *
 * @module color-space/lrgb
 */
import rgb from './rgb.js';

const lrgb = {
	name: 'lrgb',
	channel: ['red', 'green', 'blue']
};

rgb.lrgb = (r, g, b) => [
	r > 0.04045 ? (((r + 0.055) / 1.055) ** 2.4) : (r / 12.92),
	g > 0.04045 ? (((g + 0.055) / 1.055) ** 2.4) : (g / 12.92),
	b > 0.04045 ? (((b + 0.055) / 1.055) ** 2.4) : (b / 12.92),
]

lrgb.rgb = (r, g, b) => [
  r > 0.0031308 ? 1.055 * r ** (1/2.4) - 0.055 : r * 12.92,
  g > 0.0031308 ? 1.055 * g ** (1/2.4) - 0.055 : g * 12.92,
  b > 0.0031308 ? 1.055 * b ** (1/2.4) - 0.055 : b * 12.92,
];


export default lrgb;
