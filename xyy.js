/**
 * Additional xyY space, where xy are relative chromacity params
 *
 * @module color-space/xyy
 */
import xyz from './xyz.js';

var xyy = {
	name: 'xyy',
	min: [0, 0, 0],
	max: [1, 1, 1],
	channel: ['x', 'y', 'Y'],
};

xyy.xyz = function (x, y, Y) {
	var X, Z;
	if (y === 0) {
		return [0, 0, 0];
	}
	X = x * Y / y;
	Z = (1 - x - y) * Y / y;
	return [X, Y, Z];
};

xyz.xyy = function (X, Y, Z) {
	var sum;
	sum = X + Y + Z;
	if (sum === 0) {
		return [0, 0, Y];
	}
	return [X / sum, Y / sum, Y];
};

export default (xyy);
