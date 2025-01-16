/**
 * RGB space.
 *
 * @module  color-space/rgb
 */



/** @type {import('./index.js').ColorSpace} */
var rgb = /** @type {*} */ ({
	name: 'rgb',
	min: [0,0,0],
	max: [255,255,255],
	channel: ['red', 'green', 'blue'],
	alias: ['RGB']
});

export default rgb;
