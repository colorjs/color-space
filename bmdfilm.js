/**
 * Blackmagic Film Gen5 / BMD Wide Gamut color space
 *
 * Blackmagic Design's Generation 5 film curve (a piecewise linear-toe + natural-log
 * curve) over the BMD Wide Gamut Gen5 primaries. Per-channel to scene-linear, then
 * BMD Wide Gamut→XYZ(D65). 18% grey → 0.3836. (Spec reverse-engineered from the BRAW
 * SDK; constants verified against colour-science / OCIO.)
 *
 * @see {@link https://github.com/colour-science/colour/blob/develop/colour/models/rgb/transfer_functions/blackmagic_design.py}
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

const bmdfilm = { name: 'bmdfilm', range: [[0, 1], [0, 1], [0, 1]] };

const A = 0.08692876065491224, B = 0.005494072432257808, C = 0.5300133392291939, D = 8.283605932402494, E = 0.09246575342465753, LC = 0.005;
const LOGC = D * LC + E;
const enc = L => L < LC ? D * L + E : A * Math.log(L + B) + C;
const dec = V => V < LOGC ? (V - E) / D : Math.exp((V - C) / A) - B;

// BMD Wide Gamut Gen5 linear RGB -> XYZ (D65, Y 0..1)
const M = [
	0.6065383683, 0.2204127353, 0.1235048234,
	0.2679929401, 0.8327484091, -0.1007413492,
	-0.0294425542, -0.0866124303, 1.2051127352
];
const MI = inv3(M);

bmdfilm.xyz = (r, g, b) => { const [x, y, z] = mat3(M, dec(r), dec(g), dec(b)); return [x * 100, y * 100, z * 100]; };
xyz.bmdfilm = (x, y, z) => { const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100); return [enc(r), enc(g), enc(b)]; };

export default bmdfilm;
