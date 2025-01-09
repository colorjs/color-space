/**
 * RGB space.
 *
 * @module  color-space/rgb
 */

import { conversionPlaceholders } from './_space.js';

/** @type {import('./_space.js').ColorSpace} */
var rgb = Object.assign({}, conversionPlaceholders, {
	/** @type {import('./_space.js').SpaceId} */
	name: 'rgb',
	min: [0,0,0],
	max: [255,255,255],
	channel: ['red', 'green', 'blue'],
	alias: ['RGB']
});

export default rgb;
