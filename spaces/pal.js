/**
 * PAL/SECAM RGB — the primaries of 625-line analogue television across Europe and much of the
 * world, defined in EBU Tech 3213 and ITU-R BT.470 (System B/G). It has sRGB's D65 white but a
 * slightly different green primary, so it is a separate gamut from Rec. 709 and the one for
 * archival PAL or SECAM material. BT.470 assumes a display gamma of 2.8 for it, against 2.2 for
 * NTSC.
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.470}
 * @year 1967
 * @by Walter Bruch / Telefunken
 * @use Analog PAL/SECAM broadcast TV (BT.470); historical.
 * @aka EBU Tech 3213; EBU 3213-E
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
// difference from Rec. 709. Matrix derived from the primaries. Pure gamma 2.8, the display gamma
// BT.470-6 assumes for 625-line PAL/SECAM (Table 1 item 5), as colour-science's Pal/Secam.
import xyz from './xyz.js';
import { mat3, inv3 } from '../math.js';
import { gammaEncode, gammaDecode } from '../transfers.js';

const pal = { name: 'pal', range: [[0, 1], [0, 1], [0, 1]] };

// PAL/SECAM (D65) -> XYZ (Y 0..1)
const M = [
	0.43055381, 0.34154980, 0.17835231,
	0.22200431, 0.70665477, 0.07134092,
	0.02018221, 0.12955337, 0.93932217
];
const MI = inv3(M);
const dec = v => gammaDecode(v, 2.8), enc = v => gammaEncode(v, 2.8);

pal.xyz = (r, g, b) => { const [x, y, z] = mat3(M, dec(r), dec(g), dec(b)); return [x * 100, y * 100, z * 100]; };
xyz.pal = (x, y, z) => { const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100); return [enc(r), enc(g), enc(b)]; };

export default pal;
