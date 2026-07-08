/**
 * SRLAB2 is Jan Behrens' attempt to combine the best of CIELAB and CIECAM02. It
 * runs color through CIECAM02's CAT02 chromatic adaptation and then finishes with a
 * CIELAB-style cube-root opponent stage, rather than CIELAB's simpler and less
 * accurate adaptation step. The result is noticeably more perceptually uniform than
 * plain CIELAB, especially for saturated colors, while staying as easy to compute
 * and invert as Lab itself, without CIECAM02's full viewing-condition machinery.
 *
 * @see {@link https://www.magnetkern.de/srlab2.html}
 * @year 2009
 * @by Jan Behrens
 * @use CIELAB/CIECAM02 hybrid for more perceptually-uniform color-difference work; niche open alternative to Lab.
 * @channel {L} 0 100 Lightness
 * @channel {a} -125 125 Red-Green
 * @channel {b} -125 125 Yellow-Blue
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

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
const fInv = v => v <= 216 / 24389 * 24389 / 2700 ? v * 2700 / 24389 : Math.pow((v + 0.16) / 1.16, 3);

xyz.srlab2 = (X, Y, Z) => mat3(M2, ...mat3(M1, X / Wn[0], Y / Wn[1], Z / Wn[2]).map(f));
srlab2.xyz = (L, a, b) => mat3(M1i, ...mat3(M2i, L, a, b).map(fInv)).map((v, i) => v * Wn[i]);

export default srlab2;
