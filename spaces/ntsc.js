/**
 * NTSC RGB — the color primaries defined by the FCC in 1953 for the first US color television
 * broadcasts, later formalized in ITU-R BT.470 System M. It is referenced to Illuminant C with
 * a gamma of about 2.2; SMPTE-C and Rec. 709 later superseded its wide red and green
 * primaries.
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.470}
 * @wiki {@link https://en.wikipedia.org/wiki/NTSC#Colorimetry}
 * @year 1953
 * @by FCC
 * @use The “% NTSC” gamut-coverage benchmark.
 * @successor smpte-c Receivers moved to brighter phosphors, and SMPTE-C standardized them
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding gamma
 * @gamut ntsc
 * @illuminant C
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';
import { mat3, inv3 } from '../math.js';
import { gammaEncode, gammaDecode } from '../transfers.js';

const ntsc = { name: 'ntsc', range: [[0, 1], [0, 1], [0, 1]] };

// NTSC 1953 (Illuminant C) -> XYZ, Bradford-adapted to D65 (Y 0..1)
const M = [
	0.59890468, 0.16686952, 0.18468173,
	0.29604814, 0.59342244, 0.11052942,
	-0.00013817, 0.06404973, 1.02514619
];
const MI = inv3(M);
const dec = v => gammaDecode(v, 2.2), enc = v => gammaEncode(v, 2.2);

ntsc.xyz = (r, g, b) => { const [x, y, z] = mat3(M, dec(r), dec(g), dec(b)); return [x * 100, y * 100, z * 100]; };
xyz.ntsc = (x, y, z) => { const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100); return [enc(r), enc(g), enc(b)]; };

export default ntsc;
