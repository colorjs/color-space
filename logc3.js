/**
 * ARRI LogC3 / ALEXA Wide Gamut 3 color space
 *
 * ARRI's LogC3 curve (EI 800, SUP 3.x, Linear Scene Exposure Factor) over the ALEXA
 * Wide Gamut 3 primaries — the dominant cinema camera space before LogC4. Per-channel
 * LogC3 to scene-linear, then AWG3→XYZ(D65). 18% grey → 0.3910.
 *
 * @see {@link https://www.arri.com/resource/blob/31918/66f56e6abb6e5b6553929edf9aa7483e/2017-03-alexa-logc-curve-in-vfx-data.pdf}
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

const logc3 = { name: 'logc3', range: [[0, 1], [0, 1], [0, 1]] };

const cut = 0.010591, a = 5.555556, b = 0.052272, c = 0.247190, d = 0.385537, e = 5.367655, f = 0.092809;
const enc = x => x > cut ? c * Math.log10(a * x + b) + d : e * x + f;
const dec = y => y > e * cut + f ? (Math.pow(10, (y - d) / c) - b) / a : (y - f) / e;

const M = [
	0.6380076193, 0.2147038563, 0.0977444514,
	0.2919537790, 0.8238410415, -0.1157948205,
	0.0027982790, -0.0670342357, 1.1532937074
];
const MI = inv3(M);

logc3.xyz = (r, g, b) => { const [x, y, z] = mat3(M, dec(r), dec(g), dec(b)); return [x * 100, y * 100, z * 100]; };
xyz.logc3 = (x, y, z) => { const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100); return [enc(r), enc(g), enc(b)]; };

export default logc3;
