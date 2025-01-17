/**
 * RGB space.
 *
 * @module  color-space/rgb
 */



var rgb = /** @type {import('./index.js').ColorSpace} */ ({
	name: 'rgb',
	min: [0,0,0],
	max: [255,255,255],
	channel: ['red', 'green', 'blue'],
	alias: ['RGB']
});

export default rgb;
