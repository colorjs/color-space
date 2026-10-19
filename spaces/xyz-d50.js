/**
 * CIE XYZ referred to the D50 illuminant instead of D65. It is the profile connection space
 * ICC profiles convert through, a convention from graphic-arts and print viewing standards,
 * and Bradford chromatic adaptation relates it to D65 XYZ.
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#predefined-xyz}
 * @year 1994
 * @by ICC
 * @use Print and graphic-arts color management.
 * @channel {X} 0 96.42 X
 * @channel {Y} 0 100 Y
 * @channel {Z} 0 82.51 Z
 * @method matrix
 * @encoding linear
 * @illuminant D50
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz, { bradford } from './xyz.js';
import { mat3 } from '../math.js';

const xyzD50 = {
	name: 'xyz-d50',
	range: [[0, 96.42], [0, 100], [0, 82.51]]
};

xyzD50.xyz = (x, y, z) => mat3(bradford.D50_D65, x, y, z); // XYZ D50 -> D65
xyz[xyzD50.name] = (x, y, z) => mat3(bradford.D65_D50, x, y, z); // XYZ D65 -> D50

export default xyzD50;
