/**
 * SRLAB2 is Jan Behrens' combination of CIELAB and CIECAM02. It adapts color with CIECAM02's
 * CAT02 instead of CIELAB's simpler, less accurate step, then applies a CIELAB-style cube-root
 * opponent stage. It is more perceptually uniform than CIELAB, especially for saturated
 * colors, yet as easy to compute and invert as Lab, without CIECAM02's viewing-condition
 * machinery.
 *
 * @see {@link https://www.magnetkern.de/srlab2.html}
 * @year 2009
 * @by Jan Behrens
 * @use CIELAB/CIECAM02 hybrid for more perceptually-uniform color-difference work; niche open alternative to Lab.
 * @channel {L} 0 100 Lightness
 * @channel {a} -125 125 Red-Green
 * @channel {b} -125 125 Yellow-Blue
 * @method opponent
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';
import { mat3, inv3 } from '../math.js';

const srlab2 = { name: 'srlab2', range: [[0, 100], [-125, 125], [-125, 125]] };

const Wn = [95.0456, 100, 108.9058]; // D65 (0-100)
// XYZ(normalised) -> CAT02-adapted cone responses
const M1 = [0.320530, 0.636920, 0.042560, 0.161987, 0.756636, 0.081376, 0.017228, 0.108660, 0.874112];
const M1i = inv3(M1);
// transformed cone responses -> L, a, b
const M2 = [37.0950, 62.9054, -0.0008, 663.4684, -750.5078, 87.0328, 63.9569, 108.4576, -172.4152];
const M2i = inv3(M2);

const eps = 216 / 24389;
const f = x => x <= eps ? x * 24389 / 2700 : 1.16 * Math.cbrt(x) - 0.16;
const fInv = v => { if (v <= 216 / 24389 * 24389 / 2700) return v * 2700 / 24389; const t = (v + 0.16) / 1.16; return t * t * t };

xyz.srlab2 = (X, Y, Z) => mat3(M2, ...mat3(M1, X / Wn[0], Y / Wn[1], Z / Wn[2]).map(f));
srlab2.xyz = (L, a, b) => mat3(M1i, ...mat3(M2i, L, a, b).map(fInv)).map((v, i) => v * Wn[i]);

export default srlab2;
