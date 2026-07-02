/**
 * CIE XYZ with the D50 white point (ICC profile connection space). Bradford-adapted
 * from the D65 `xyz` hub.
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#predefined-xyz}
 * @channel {X} 0 96.42 X
 * @channel {Y} 0 100 Y
 * @channel {Z} 0 82.51 Z
 * @illuminant D50
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz, { bradford } from './xyz.js';
import { mat3 } from './util.js';

const xyzD50 = {
	name: 'xyz-d50',
	range: [[0, 96.42], [0, 100], [0, 82.51]]
};

xyzD50.xyz = (x, y, z) => mat3(bradford.D50_D65, x, y, z); // XYZ D50 -> D65
xyz[xyzD50.name] = (x, y, z) => mat3(bradford.D65_D50, x, y, z); // XYZ D65 -> D50

export default xyzD50;
