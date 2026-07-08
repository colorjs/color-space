/**
 * Absolute XYZ (D65) — CIE XYZ expressed in real physical units, candela per square
 * meter, instead of the usual 0-100 relative scale. Relative XYZ only says how a color
 * compares to a normalized white; absolute XYZ ties every value to an actual measurable
 * brightness, which HDR workflows need since the same relative color can sit at very
 * different real-world luminances. The two scales meet at ITU-R BT.2100's HDR reference
 * white.
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.2100}
 * @year 2016
 * @by ITU-R
 * @use Absolute-luminance XYZ anchored to BT.2100's 203 cd/m² HDR reference white; current HDR analysis tooling.
 * @channel {Xa} 0 192.9 Absolute X
 * @channel {Ya} 0 203 Absolute Y
 * @channel {Za} 0 221.1 Absolute Z
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic hdr
 */
// Implementation notes:
// The relative XYZ hub's Y=100 corresponds to 203 cd/m² (HDR reference white, ITU-R
// BT.2100).
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
