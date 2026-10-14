/**
 * T-Log — FilmLight's log curve for its Baselight color-grading systems, paired
 * with the wide E-Gamut primaries as a camera-agnostic working space that footage
 * from almost any camera can be converted into for grading. Its curve is a
 * near-pure log function with a linear extension below zero, avoiding the harsh
 * clipping a pure log would give to noise and sub-black signal. Baselight
 * facilities use T-Log/E-Gamut much the way ACES or DaVinci Wide Gamut are used
 * elsewhere — as a common space for mixing footage from multiple camera sources.
 *
 * @see {@link https://github.com/colour-science/colour/blob/develop/colour/models/rgb/transfer_functions/filmlight_t_log.py}
 * @year 2013
 * @by FilmLight
 * @use FilmLight’s Cineon-derived log on E-Gamut; Baselight’s camera-agnostic grading working space.
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
