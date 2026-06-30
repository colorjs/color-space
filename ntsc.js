/**
 * NTSC RGB (1953) color space
 *
 * The original FCC-mandated US colour-television primaries (1953) — the founding
 * broadcast gamut, still quoted as a coverage benchmark ("% NTSC"). Illuminant C
 * white, γ≈2.2 (BT.470 System M). Wide green/red phosphors never achieved in practice
 * (superseded by SMPTE-C / Rec.709). Matrix from the primaries, Bradford C→D65.
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.470}
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @illuminant C
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';
import { gammaEncode, gammaDecode } from './transfers.js';

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
