/**
 * SMPTE 240M — the interim HDTV standard published by SMPTE in 1988, used during the
 * early analog high-definition era before Rec. 709 was finalized. It shares its wide
 * broadcast primaries with SMPTE-C, referenced to D65 white, but defines its own
 * transfer function — a gamma-like curve with a linear segment near black — distinct
 * from the curves used in BT.601 and BT.709.
 *
 * @see {@link https://ieeexplore.ieee.org/document/7291461}
 * @wiki {@link https://en.wikipedia.org/wiki/List_of_color_spaces_and_their_uses#Others_with_RGB_primaries}
 * @year 1988
 * @by SMPTE
 * @use Interim analog HDTV standard preceding Rec. 709; historical, superseded.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding gamma
 * @gamut smpte-c
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// OETF is a 0.45-power curve with a linear toe near black.
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
