/**
 * xyY color space
 *
 * Chromaticity coordinates (x, y) with luminance (Y)
 * Useful for color matching and display calibration
 *
 * @channel {x} 0 1 Red chromaticity
 * @channel {y} 0 1 Green chromaticity
 * @channel {Y} 0 100 Luminance (CIE Y)
 */
import xyz from './xyz.js';

var xyy = {
	name: 'xyy'
};

xyy.xyz = function (x, y, Y) {
	// Input: x,y: 0-1, Y: 0-100
	// Output: XYZ: 0-100
	var X, Z;
	if (y === 0) {
		return [0, 0, 0];
	}
	X = x * Y / y;
	Z = (1 - x - y) * Y / y;
	return [X, Y, Z];
};

xyz.xyy = function (X, Y, Z) {
	// Input: XYZ: 0-100
	// Output: x,y: 0-1, Y: 0-100
	var sum;
	sum = X + Y + Z;
	if (sum === 0) {
		return [0, 0, Y];
	}
	return [X / sum, Y / sum, Y];
};

export default (xyy);
