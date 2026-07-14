/**
 * PAL/SECAM RGB — the primaries used by 625-line analogue television across Europe
 * and much of the world, defined in EBU Tech 3213 and ITU-R BT.470 (System B/G).
 * It shares sRGB's D65 white point and a similar gamma of about 2.2, but its green
 * primary is subtly different, making it formally distinct from Rec. 709 — the
 * correct gamut to use when working with archival PAL or SECAM broadcast material.
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.470}
 * @year 1967
 * @by Walter Bruch / Telefunken
 * @use Legacy analog PAL/SECAM broadcast TV primaries (Europe, EBU Tech 3213/BT.470); historical.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding gamma
 * @gamut pal
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Green primary at (0.29, 0.60) vs sRGB's (0.30, 0.60) - the source of the gamut
// difference from Rec. 709. Matrix derived from the primaries.
import xyz from './xyz.js';
import { mat3, inv3 } from '../util.js';
import { gammaEncode, gammaDecode } from '../transfers.js';

const pal = { name: 'pal', range: [[0, 1], [0, 1], [0, 1]] };

// PAL/SECAM (D65) -> XYZ (Y 0..1)
const M = [
	0.43055381, 0.34154980, 0.17835231,
	0.22200431, 0.70665477, 0.07134092,
	0.02018221, 0.12955337, 0.93932217
];
const MI = inv3(M);
const dec = v => gammaDecode(v, 2.2), enc = v => gammaEncode(v, 2.2);

pal.xyz = (r, g, b) => { const [x, y, z] = mat3(M, dec(r), dec(g), dec(b)); return [x * 100, y * 100, z * 100]; };
xyz.pal = (x, y, z) => { const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100); return [enc(r), enc(g), enc(b)]; };

export default pal;
