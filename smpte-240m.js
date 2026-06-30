/**
 * SMPTE-240M color space
 *
 * The interim HDTV standard (SMPTE 240M, 1988-1998) that preceded Rec.709. Shares
 * the SMPTE-C / SMPTE 170M primaries (same matrix as `smpte-c`) but defines its own
 * formal OETF (a 0.45-power curve with a linear toe), distinct from BT.601/709. D65.
 *
 * @see {@link https://ieeexplore.ieee.org/document/7291461}
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';
import { smpte240mEncode as enc, smpte240mDecode as dec } from './transfers.js';

const smpte240m = { name: 'smpte-240m', range: [[0, 1], [0, 1], [0, 1]] };

// SMPTE 170M primaries (D65) -> XYZ (Y 0..1) — identical to smpte-c
const M = [
	0.39352090365939, 0.365258076717604, 0.191676946674678,
	0.212376360705067, 0.701059856925723, 0.086563782369210,
	0.018739090650447, 0.111933926736040, 0.958384733373392
];
const MI = inv3(M);

smpte240m.xyz = (r, g, b) => { const [x, y, z] = mat3(M, dec(r), dec(g), dec(b)); return [x * 100, y * 100, z * 100]; };
xyz['smpte-240m'] = (x, y, z) => { const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100); return [enc(r), enc(g), enc(b)]; };

export default smpte240m;
