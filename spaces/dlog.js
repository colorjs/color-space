/**
 * D-Log — DJI's log curve for its cinema-oriented cameras, including the Zenmuse X7
 * and Ronin 4D, designed to preserve dynamic range for grading rather than direct
 * viewing. It pairs a linear toe near black with a log10 highlight curve, mapped to
 * the D-Gamut primaries built for those cameras' sensors. It's distinct from D-Log M,
 * the separate curve DJI uses on its consumer drones.
 *
 * @see {@link https://dl.djicdn.com/downloads/zenmuse+x7/20171010/D-Log_D-Gamut_Whitepaper.pdf}
 * @wiki {@link https://en.wikipedia.org/wiki/Log_profile}
 * @year 2017
 * @by DJI
 * @use Log curve for DJI cinema-oriented drone/gimbal cameras; current on Zenmuse/Ronin cinema product lines.
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
// 18% grey → 0.3988. D-Log M, the consumer-drone variant, is an unpublished black
// box and is deliberately not implemented here. Gamut: D-Gamut, matrix in dgamut.js.
import xyz from './xyz.js';
import dgamut from './dgamut.js';

const dlog = { name: 'dlog', range: [[0, 1], [0, 1], [0, 1]] };

const enc = x => x <= 0.0078 ? 6.025 * x + 0.0929 : Math.log10(x * 0.9892 + 0.0108) * 0.256663 + 0.584555;
const dec = y => y <= 0.14 ? (y - 0.0929) / 6.025 : (Math.pow(10, (y - 0.584555) / 0.256663) - 0.0108) / 0.9892;

dlog.xyz = (r, g, b) => dgamut.xyz(dec(r), dec(g), dec(b));
xyz.dlog = (x, y, z) => { const [r, g, b] = xyz.dgamut(x, y, z); return [enc(r), enc(g), enc(b)]; };

export default dlog;
