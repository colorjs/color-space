/**
 * DJI D-Log / D-Gamut color space
 *
 * DJI's D-Log curve (linear toe + log10 highlight) over the D-Gamut primaries
 * (X7/Ronin 4D cinema cameras). Per-channel D-Log to scene-linear, then D-Gamut→XYZ
 * (D65). 18% grey → 0.3988. (D-Log M, the consumer-drone variant, is an unpublished
 * black box and is deliberately NOT included.)
 *
 * @see {@link https://dl.djicdn.com/downloads/zenmuse+x7/20171010/D-Log_D-Gamut_Whitepaper.pdf}
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

const dlog = { name: 'dlog', range: [[0, 1], [0, 1], [0, 1]] };

const enc = x => x <= 0.0078 ? 6.025 * x + 0.0929 : Math.log10(x * 0.9892 + 0.0108) * 0.256663 + 0.584555;
const dec = y => y <= 0.14 ? (y - 0.0929) / 6.025 : (Math.pow(10, (y - 0.584555) / 0.256663) - 0.0108) / 0.9892;

// D-Gamut linear RGB -> XYZ (D65, Y 0..1) — colour-science MATRIX_DJI_D_GAMUT_TO_XYZ
const M = [
	0.6482, 0.1940, 0.1082,
	0.2830, 0.8132, -0.0962,
	-0.0183, -0.0832, 1.1903
];
const MI = inv3(M);

dlog.xyz = (r, g, b) => { const [x, y, z] = mat3(M, dec(r), dec(g), dec(b)); return [x * 100, y * 100, z * 100]; };
xyz.dlog = (x, y, z) => { const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100); return [enc(r), enc(g), enc(b)]; };

export default dlog;
