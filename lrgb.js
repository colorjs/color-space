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

lrgb.rgb = ([r, g, b]) => [
	((r = Math.abs(r / 255)) > 0.0031308
		? (Math.sign(r) || 1) * (1.055 * r ** (1 / 2.4) - 0.055)
		: r * 12.92),
	((g = Math.abs(g / 255)) > 0.0031308
		? (Math.sign(g) || 1) * (1.055 * g ** (1 / 2.4) - 0.055)
		: g * 12.92),
	((b = Math.abs(b / 255)) > 0.0031308
		? (Math.sign(b) || 1) * (1.055 * b ** (1 / 2.4) - 0.055)
		: b * 12.92)
];

rgb.lrgb = ([r, g, b]) => [
	((r = Math.abs(r / 255)) <= 0.04045
		? r / 12.92
		: (Math.sign(r) || 1) * ((r + 0.055) / 1.055) ** 2.4),
	((g = Math.abs(g / 255)) <= 0.04045
		? g / 12.92
		: (Math.sign(g) || 1) * ((g + 0.055) / 1.055) ** 2.4),
	((b = Math.abs(b / 255)) <= 0.04045
		? b / 12.92
		: (Math.sign(b) || 1) * ((b + 0.055) / 1.055) ** 2.4)
];


export default lrgb;
