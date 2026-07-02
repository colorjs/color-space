/**
 * DaVinci Wide Gamut — Blackmagic's own wide color space and log curve, introduced
 * in 2020 with DaVinci Resolve 17 as the default working space for Resolve's
 * color-managed pipeline. Rather than targeting one camera, it's built as a
 * camera-agnostic intermediate that footage from any brand can be converted into and
 * graded consistently, similar in purpose to ACES but native to Resolve. Its DaVinci
 * Intermediate log curve preserves highlight and shadow detail from any source
 * camera ahead of the creative grade.
 *
 * @see {@link https://documents.blackmagicdesign.com/InformationNotes/DaVinci_Resolve_17_Wide_Gamut_Intermediate.pdf}
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// Matrices are the exact values from the Blackmagic whitepaper. 18% grey → 0.3360.
import xyz from './xyz.js';
import { mat3 } from './util.js';

const davinci = { name: 'davinci', range: [[0, 1], [0, 1], [0, 1]] };

const A = 0.0075, B = 7, C = 0.07329248, M = 10.44426855, LIN_CUT = 0.00262409, LOG_CUT = 0.02740668;
const enc = x => x <= LIN_CUT ? x * M : C * (Math.log2(x + A) + B);
const dec = v => v <= LOG_CUT ? v / M : Math.pow(2, v / C - B) - A;

// DaVinci Wide Gamut <-> XYZ (D65, Y 0..1) — whitepaper matrices
const MX = [
	0.70062239, 0.14877482, 0.10105872,
	0.27411851, 0.87363190, -0.14775041,
	-0.09896291, -0.13789533, 1.32591599
];
const MXI = [
	1.51667204, -0.28147805, -0.14696363,
	-0.46491710, 1.25142378, 0.17488461,
	0.06484905, 0.10913934, 0.76141462
];

davinci.xyz = (r, g, b) => mat3(MX, dec(r), dec(g), dec(b)).map(v => v * 100);
xyz.davinci = (x, y, z) => mat3(MXI, x / 100, y / 100, z / 100).map(enc);

export default davinci;
