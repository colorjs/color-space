/**
 * xyY — a reformulation of CIE XYZ that separates a color's chromaticity (x, y) from its
 * luminance (Y), so hue and saturation can be studied independently of brightness.
 * Plotting x against y produces the familiar horseshoe-shaped chromaticity diagram used
 * to visualize gamuts, specify white points, and compare how much of the visible
 * spectrum a display or printer can reproduce.
 *
 * @see {@link http://www.brucelindbloom.com/index.html?Eqn_XYZ_to_xyY.html}
 * @channel {x} 0 1 Red chromaticity
 * @channel {y} 0 1 Green chromaticity
 * @channel {Y} 0 100 Luminance
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';

var xyy = {
	name: 'xyy',
	range: [[0, 1], [0, 1], [0, 100]]
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
