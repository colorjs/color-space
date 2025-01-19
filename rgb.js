/**
 * RGB space.
 *
 * @module  color-space/rgb
 */


/** @type {Partial<import('./index.js').ColorSpace>} */
var rgb = {
	name: 'rgb',
	min: [0,0,0],
	max: [255,255,255],
	channel: ['red', 'green', 'blue'],
	alias: ['RGB']
};

export default /** @type {import('./index.js').ColorSpace} */ (rgb);
