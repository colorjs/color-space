/**
 * T-Log — FilmLight's log curve for its Baselight grading systems, paired with the wide
 * E-Gamut primaries. It is a near-pure log with a linear extension below zero, so noise and
 * sub-black signal pass without the harsh clipping a pure log would give. Baselight facilities
 * use T-Log/E-Gamut the way others use ACES or DaVinci Wide Gamut: a common space for footage
 * from many cameras.
 *
 * @see {@link https://github.com/colour-science/colour/blob/develop/colour/models/rgb/transfer_functions/filmlight_t_log.py}
 * @year 2013
 * @by FilmLight
 * @use Grading in Baselight, on a Cineon-derived curve.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding log
 * @gamut egamut
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// Cineon-derived, as @use says: colour-science's T-Log cites FilmLight (Siragusano 2018) for "a cineon
// driven log tone-curve", similar to Cineon's LogC function.
// Constants derive from w=128 (linear value mapping to 1.0), g=16 (gradient at 0),
// o=0.075 (offset at 0). 18% grey → 0.3966. Gamut: E-Gamut, matrix in egamut.js.
import xyz from './xyz.js';
import egamut from './egamut.js';

const tlog = { name: 'tlog', range: [[0, 1], [0, 1], [0, 1]] };

// T-Log constants (FilmLight spec: w=128, g=16, o=0.075)
const w = 128, g = 16, o = 0.075;
const b = 1 / (0.7107 + 1.2359 * Math.log(w * g)), gs = g / (1 - o), C = b / gs;
const a = 1 - b * Math.log(w + C), y0 = a + b * Math.log(C), s = (1 - o) / (1 - y0);
const A = 1 + (a - 1) * s, B = b * s, G = gs * s;
const enc = x => x < 0 ? G * x + o : Math.log(x + C) * B + A;
const dec = t => t < o ? (t - o) / G : Math.exp((t - A) / B) - C;

tlog.xyz = (r, g, b) => egamut.xyz(dec(r), dec(g), dec(b));
xyz.tlog = (x, y, z) => xyz.egamut(x, y, z).map(enc);

export default tlog;
