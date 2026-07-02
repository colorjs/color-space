/**
 * REDLog / REDcolor color space
 *
 * RED's original 10-bit log curve (RED One era, superseded by REDLogFilm and then
 * Log3G10) over the REDcolor primaries (D65). Black offset 10^(−1023/511).
 * 18% grey → 0.6376.
 *
 * @see {@link https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_REDLog.html}
 * @channel {R} 0 1 Red (REDLog)
 * @channel {G} 0 1 Green (REDLog)
 * @channel {B} 0 1 Blue (REDLog)
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

const redlog = { name: 'redlog', range: [[0, 1], [0, 1], [0, 1]] };

const bo = Math.pow(10, -1023 / 511);
const enc = x => (1023 + 511 * Math.log10(x * (1 - bo) + bo)) / 1023;
const dec = y => (Math.pow(10, (1023 * y - 1023) / 511) - bo) / (1 - bo);

// REDcolor linear RGB -> XYZ (D65, Y 0..1)
const M = [
	0.4230233052164921, 0.3621073093271542, 0.1653253125080252,
	0.1992333523893298, 0.7575963171907274, 0.0431703304199426,
	-0.0188501414613622, 0.0921223263657989, 1.0157855658554418
];
const MI = inv3(M);

redlog.xyz = (r, g, b) => mat3(M, dec(r), dec(g), dec(b)).map(v => v * 100);
xyz.redlog = (x, y, z) => mat3(MI, x / 100, y / 100, z / 100).map(enc);

export default redlog;
