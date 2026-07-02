/**
 * RED Log3G12 / REDWideGamutRGB color space
 *
 * RED's Log3G12 — Log3G10's predecessor with 12 stops above 18% grey (grey → exactly
 * 1/3) — over the same REDWideGamutRGB primaries as `log3g10`. Sign-symmetric, so
 * negative scene values encode continuously.
 *
 * @see {@link https://colour.readthedocs.io/en/develop/generated/colour.models.log_encoding_Log3G12.html}
 * @channel {R} 0 1 Red (Log3G12)
 * @channel {G} 0 1 Green (Log3G12)
 * @channel {B} 0 1 Blue (Log3G12)
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

const log3g12 = { name: 'log3g12', range: [[0, 1], [0, 1], [0, 1]] };

const enc = x => Math.sign(x) * 0.184904 * Math.log10(Math.abs(x) * 347.189667 + 1);
const dec = y => Math.sign(y) * (Math.pow(10, Math.abs(y) / 0.184904) - 1) / 347.189667;

// REDWideGamutRGB -> XYZ (D65, Y 0..1) — same primaries as log3g10.js
const M = [
	0.7352752459058587, 0.0686094106139610, 0.1465712705318520,
	0.2866940994999349, 0.8429791340169754, -0.1296732335169103,
	-0.0796808568783677, -0.3473432169944297, 1.5160818246326759
];
const MI = inv3(M);

log3g12.xyz = (r, g, b) => mat3(M, dec(r), dec(g), dec(b)).map(v => v * 100);
xyz.log3g12 = (x, y, z) => mat3(MI, x / 100, y / 100, z / 100).map(enc);

export default log3g12;
