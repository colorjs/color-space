/**
 * CIE XYZ referred to the D50 illuminant instead of D65. D50 is the profile connection
 * space ICC color-management profiles convert through, a convention inherited from
 * graphic arts and print viewing standards, so this variant is the one to reach for when
 * reading or writing ICC-based workflows. It relates to D65 XYZ by Bradford chromatic
 * adaptation.
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#predefined-xyz}
 * @year 1994
 * @by ICC
 * @use CIE XYZ under D50, the ICC profile-connection space for print/graphic-arts color management; current standard.
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
import { mat3 } from './util.js';

const xyzD50 = {
	name: 'xyz-d50',
	range: [[0, 96.42], [0, 100], [0, 82.51]]
};

xyzD50.xyz = (x, y, z) => mat3(bradford.D50_D65, x, y, z); // XYZ D50 -> D65
xyz[xyzD50.name] = (x, y, z) => mat3(bradford.D65_D50, x, y, z); // XYZ D65 -> D50

export default xyzD50;
