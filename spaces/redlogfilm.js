/**
 * REDLogFilm — RED Digital Cinema's second log curve, built to match Kodak's
 * Cineon printing-density curve exactly so RED footage could drop into existing
 * film-style, Cineon-based color pipelines. It shares the REDcolor primaries with
 * the original REDLog, sitting between it and the Log3G10/REDWideGamutRGB pairing
 * used on today's RED cameras.
 *
 * @see {@link https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_REDLogFilm.html}
 * @wiki {@link https://en.wikipedia.org/wiki/Log_profile}
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding log
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// Exactly the Cineon curve: black 95 / white 685 over 10 bits. 18% grey → 0.4573,
// as Cineon.
import xyz from './xyz.js';
import { mat3, inv3 } from '../util.js';

const redlogfilm = { name: 'redlogfilm', range: [[0, 1], [0, 1], [0, 1]] };

const bo = Math.pow(10, (95 - 685) / 300); // Cineon black offset
const enc = x => (685 + 300 * Math.log10(x * (1 - bo) + bo)) / 1023;
const dec = y => (Math.pow(10, (1023 * y - 685) / 300) - bo) / (1 - bo);

// REDcolor linear RGB -> XYZ (D65, Y 0..1) — same primaries as redlog.js
const M = [
	0.4230233052164921, 0.3621073093271542, 0.1653253125080252,
	0.1992333523893298, 0.7575963171907274, 0.0431703304199426,
	-0.0188501414613622, 0.0921223263657989, 1.0157855658554418
];
const MI = inv3(M);

redlogfilm.xyz = (r, g, b) => mat3(M, dec(r), dec(g), dec(b)).map(v => v * 100);
xyz.redlogfilm = (x, y, z) => mat3(MI, x / 100, y / 100, z / 100).map(enc);

export default redlogfilm;
