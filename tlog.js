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
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// Constants derive from w=128 (linear value mapping to 1.0), g=16 (gradient at 0),
// o=0.075 (offset at 0). 18% grey → 0.3966.
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

const tlog = { name: 'tlog', range: [[0, 1], [0, 1], [0, 1]] };

// T-Log constants (FilmLight spec: w=128, g=16, o=0.075)
const w = 128, g = 16, o = 0.075;
const b = 1 / (0.7107 + 1.2359 * Math.log(w * g)), gs = g / (1 - o), C = b / gs;
const a = 1 - b * Math.log(w + C), y0 = a + b * Math.log(C), s = (1 - o) / (1 - y0);
const A = 1 + (a - 1) * s, B = b * s, G = gs * s;
const enc = x => x < 0 ? G * x + o : Math.log(x + C) * B + A;
const dec = t => t < o ? (t - o) / G : Math.exp((t - A) / B) - C;

// E-Gamut linear RGB -> XYZ (D65, Y 0..1); primaries R(0.8,0.3177) G(0.18,0.9) B(0.065,-0.0805)
const M = [
	0.7053968500877708, 0.1640413283099190, 0.0810177486539820,
	0.2801307240911059, 0.8202066415495949, -0.1003373656407007,
	-0.1037815115691633, -0.0729072570266306, 1.2657465193556721
];
const MI = inv3(M);

tlog.xyz = (r, g, b) => mat3(M, dec(r), dec(g), dec(b)).map(v => v * 100);
xyz.tlog = (x, y, z) => mat3(MI, x / 100, y / 100, z / 100).map(enc);

export default tlog;
