/**
 * Blackmagic Film — Blackmagic Design's log curve for its Generation 5 color
 * science, which debuted on the URSA Mini Pro 12K and rolled out across the Pocket
 * Cinema Camera line. It combines a linear toe near black with a natural-log
 * highlight region to hold detail across the sensor's full dynamic range for
 * grading in DaVinci Resolve. It pairs with the BMD Wide Gamut Gen5 primaries and
 * ships inside Blackmagic RAW (BRAW) footage.
 *
 * @see {@link https://github.com/colour-science/colour/blob/develop/colour/models/rgb/transfer_functions/blackmagic_design.py}
 * @year 2020
 * @by Blackmagic Design
 * @use BRAW on Blackmagic's URSA Mini Pro and Pocket Cinema cameras with Gen 5 color science.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding log
 * @gamut bmdwg
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// 18% grey → 0.3836. Spec reverse-engineered from the BRAW SDK; constants verified
// against colour-science / OCIO. Gamut: BMD Wide Gamut Gen5, matrix in bmdwg.js.
import xyz from './xyz.js';
import bmdwg from './bmdwg.js';

const bmdfilm = { name: 'bmdfilm', range: [[0, 1], [0, 1], [0, 1]] };

const A = 0.08692876065491224, B = 0.005494072432257808, C = 0.5300133392291939, D = 8.283605932402494, E = 0.09246575342465753, LC = 0.005;
const LOGC = D * LC + E;
const enc = L => L < LC ? D * L + E : A * Math.log(L + B) + C;
const dec = V => V < LOGC ? (V - E) / D : Math.exp((V - C) / A) - B;

bmdfilm.xyz = (r, g, b) => bmdwg.xyz(dec(r), dec(g), dec(b));
xyz.bmdfilm = (x, y, z) => { const [r, g, b] = xyz.bmdwg(x, y, z); return [enc(r), enc(g), enc(b)]; };

export default bmdfilm;
