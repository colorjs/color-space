/**
 * @module color-space/cmy
 */
import { conversionPlaceholders } from './_space.js';
import rgb from './rgb.js';

/** @type {import('./_space.js').ColorSpace} */
var cmy = Object.assign({}, conversionPlaceholders, {
	/** @type {import('./_space.js').SpaceId} */
	name: 'cmy',
	min: [0,0,0],
	max: [100,100,100],
	channel: ['cyan', 'magenta', 'yellow'],
	alias: ['CMY']
});


/**
 * CMY to RGB
 *
 * @param {Array<number>} cmy Channels
 *
 * @return {Array<number>} RGB channels
 */
cmy.rgb = function(cmy) {
	var c = cmy[0] / 100,
		m = cmy[1] / 100,
		y = cmy[2] / 100;

	return [
		(1 - c) * 255,
		(1 - m) * 255,
		(1 - y) * 255
	];
};


/**
 * RGB to CMY
 *
 * @param {Array<number>} rgb channels
 *
 * @return {Array<number>} CMY channels
 */
rgb.cmy = function(rgb) {
	var r = rgb[0] / 255,
		g = rgb[1] / 255,
		b = rgb[2] / 255;

	return [
		(1-r) * 100 || 0,
		(1-g) * 100 || 0,
		(1-b) * 100 || 0
	];
};

export default cmy
