/**
 * xyY — a reformulation of CIE XYZ that separates a color's chromaticity (x, y) from its
 * luminance (Y), so hue and saturation can be studied independently of brightness.
 * Plotting x against y produces the familiar horseshoe-shaped chromaticity diagram used
 * to visualize gamuts, specify white points, and compare how much of the visible
 * spectrum a display or printer can reproduce.
 *
 * @see {@link http://www.brucelindbloom.com/index.html?Eqn_XYZ_to_xyY.html}
 * @wiki {@link https://en.wikipedia.org/wiki/CIE_1931_color_space#CIE_xyY_color_space}
 * @year 1931
 * @by CIE
 * @use Chromaticity reformulation of CIE XYZ for visualizing gamuts and white points; current standard tool.
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

// the D65 white's chromaticity — where achromatic (sum = 0) inputs sit
const [Xw, Yw, Zw] = xyz.whitepoint[2].D65;
const wx = Xw / (Xw + Yw + Zw), wy = Yw / (Xw + Yw + Zw);

xyz.xyy = function (X, Y, Z) {
	// Input: XYZ: 0-100
	// Output: x,y: 0-1, Y: 0-100
	var sum;
	sum = X + Y + Z;
	// black carries no chromaticity — it sits at the D65 white's (x, y),
	// mirroring the achromatic-hue convention; any chromaticity inverts to XYZ 0 at Y = 0
	if (sum === 0) {
		return [wx, wy, Y];
	}
	return [X / sum, Y / sum, Y];
};

export default (xyy);
