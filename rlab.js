/**
 * RLAB is the color appearance model Mark Fairchild published in 1996, developed for
 * predicting how colors reproduce across different media and viewing conditions — for
 * example, matching a printed image's appearance to how it looked on a display. It
 * adapts the cone responses, via a von Kries-style transform through
 * Hunt-Pointer-Estévez cone fundamentals, to the reference viewing condition, then
 * maps the result into a CIELAB-like lightness and opponent-color space, giving it
 * CIELAB's familiar structure while accounting for surround and adaptation effects
 * that plain CIELAB ignores. It was among the earliest appearance models built
 * specifically for cross-media color reproduction workflows.
 *
 * @see {@link https://doi.org/10.1002/(SICI)1520-6378(199610)21:5<338::AID-COL3>3.0.CO;2-Z} Fairchild 1996
 * @wiki {@link https://en.wikipedia.org/wiki/Color_appearance_model#RLAB}
 * @year 1996
 * @by Mark Fairchild
 * @use Cross-media color appearance model for print/display reproduction matching; historical/academic, superseded by CIECAM02/CAM16.
 * @channel {L} 0 100 Lightness
 * @channel {a} -125 125 Red-Green
 * @channel {b} -125 125 Yellow-Blue
 * @illuminant A
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Baked to the canonical reference conditions used in Fairchild's published worked
// example: adapting white = CIE Illuminant A [109.85, 100, 35.58], Y_n = 31.83 cd/m²,
// σ = 1/2.3 (average surround), D = 1 (hard-copy/reflective viewing).
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

const rlab = { name: 'rlab', range: [[0, 100], [-125, 125], [-125, 125]] };

const spow = (v, p) => v < 0 ? -Math.pow(-v, p) : Math.pow(v, p);
const HPE = [0.38971, 0.68898, -0.07868, -0.22981, 1.18340, 0.04641, 0, 0, 1];
const R = [1.9569, -1.1882, 0.2313, 0.3612, 0.6388, 0, 0, 0, 1];
const sigma = 1 / 2.3, Xn = [109.85, 100, 35.58], Yn = 31.83, D = 1;

// baked adaptation matrix M = R · diag(LMS_a_L) · HPE
const LMSn = mat3(HPE, ...Xn);
const lE = LMSn.map(v => 3 * v / (LMSn[0] + LMSn[1] + LMSn[2]));
const yc = Math.pow(Yn, 1 / 3);
const aL = lE.map((v, i) => { const pL = (1 + yc + v) / (1 + yc + 1 / v); return (pL + D * (1 - pL)) / LMSn[i]; });
const matmul = (A, B) => [0, 3, 6].flatMap(r => [0, 1, 2].map(c => A[r] * B[c] + A[r + 1] * B[c + 3] + A[r + 2] * B[c + 6]));
const M = matmul(R, [aL[0] * HPE[0], aL[0] * HPE[1], aL[0] * HPE[2], aL[1] * HPE[3], aL[1] * HPE[4], aL[1] * HPE[5], aL[2] * HPE[6], aL[2] * HPE[7], aL[2] * HPE[8]]);
const MI = inv3(M);

xyz.rlab = (X, Y, Z) => {
	const [xr, yr, zr] = mat3(M, X, Y, Z);
	return [100 * spow(yr, sigma), 430 * (spow(xr, sigma) - spow(yr, sigma)), 170 * (spow(yr, sigma) - spow(zr, sigma))];
};

rlab.xyz = (L, a, b) => {
	const yrs = spow(L / 100, 1);                 // Y_ref^sigma
	const yr = spow(L / 100, 1 / sigma);
	const xr = spow(a / 430 + yrs, 1 / sigma), zr = spow(yrs - b / 170, 1 / sigma);
	return mat3(MI, xr, yr, zr);
};

export default rlab;
