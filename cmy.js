/**
 * @module color-space/cmy
 */
import rgb from './rgb.js';

const cmy = {
	name: 'cmy',
	min: [0, 0, 0],
	max: [100, 100, 100],
	channel: ['cyan', 'magenta', 'yellow'],
	alias: ['CMY']
};

/**
 * CMY to RGB
 *
 * @param {Array<number>} CMY channels
 *
 * @return {Array<number>} RGB channels
 */
cmy.rgb = ([c, m, y]) => [
	(1 - c / 100) * 255,
	(1 - m / 100) * 255,
	(1 - y / 100) * 255
];

/**
 * RGB to CMY
 *
 * @param {Array<number>} rgb channels
 *
 * @return {Array<number>} CMY channels
 */
rgb.cmy = ([r, g, b]) => [
	(1 - r / 255) * 100 || 0,
	(1 - g / 255) * 100 || 0,
	(1 - b / 255) * 100 || 0
];


export default cmy;
