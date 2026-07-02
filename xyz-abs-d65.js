/**
 * Absolute XYZ (D65) — CIE XYZ in absolute luminance (cd/m²), where the relative
 * XYZ hub's Y=100 corresponds to 203 cd/m² (HDR reference white, ITU-R BT.2100).
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.2100}
 * @channel {Xa} 0 192.9 Absolute X
 * @channel {Ya} 0 203 Absolute Y
 * @channel {Za} 0 221.1 Absolute Z
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic hdr
 */
import xyz from './xyz.js';

const xyzAbsD65 = {
	name: 'xyz-abs-d65',
	range: [[0, 192.9], [0, 203], [0, 221.1]]
};

const Yw = 203; // nits

xyzAbsD65.xyz = (x, y, z) => {
	// Abs (nits) -> Relative (0-100)
	return [x / Yw * 100, y / Yw * 100, z / Yw * 100];
}

xyz[xyzAbsD65.name] = (x, y, z) => {
	// Relative (0-100) -> Abs (nits)
	return [x / 100 * Yw, y / 100 * Yw, z / 100 * Yw];
}

export default xyzAbsD65;
