/**
 * Additional xyY space, where xy are relative chromacity params
 *
 * @module color-space/xyy
 */
import { conversionPlaceholders } from './_space.js';
import xyz from './xyz.js';

/** @type {import('./_space.js').ColorSpace} */
var xyy = Object.assign({}, conversionPlaceholders, {
	/** @type {import('./_space.js').SpaceId} */
	name: 'xyy',
	min: [0,0,0],
	max: [1,1,100],
	channel: ['x','y','Y'],
	alias: ['xyY', 'Yxy', 'yxy']
});

xyy.xyz = function(arg) {
	var X, Y, Z, x, y;
	x = arg[0]; y = arg[1]; Y = arg[2];
	if (y === 0) {
		return [0, 0, 0];
	}
	X = x * Y / y;
	Z = (1 - x - y) * Y / y;
	return [X, Y, Z];
};

xyz.xyy = function(arg) {
	var sum, X, Y, Z;
	X = arg[0]; Y = arg[1]; Z = arg[2];
	sum = X + Y + Z;
	if (sum === 0) {
		return [0, 0, Y];
	}
	return [X / sum, Y / sum, Y];
};

export default xyy;
