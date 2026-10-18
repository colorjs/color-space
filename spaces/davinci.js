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
 * @year 2020
 * @by Blackmagic Design
 * @use Camera-agnostic grading intermediate and log curve; current default working space in DaVinci Resolve's color-managed pipeline.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding log
 * @gamut dwg
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// 18% grey → 0.3360. Gamut: DaVinci Wide Gamut, the whitepaper's exact matrices in dwg.js.
import xyz from './xyz.js';
import dwg from './dwg.js';

const davinci = { name: 'davinci', range: [[0, 1], [0, 1], [0, 1]] };

const A = 0.0075, B = 7, C = 0.07329248, M = 10.44426855, LIN_CUT = 0.00262409, LOG_CUT = 0.02740668;
const enc = x => x <= LIN_CUT ? x * M : C * (Math.log2(x + A) + B);
const dec = v => v <= LOG_CUT ? v / M : Math.pow(2, v / C - B) - A;

davinci.xyz = (r, g, b) => dwg.xyz(dec(r), dec(g), dec(b));
xyz.davinci = (x, y, z) => xyz.dwg(x, y, z).map(enc);

export default davinci;
