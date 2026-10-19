/**
 * ADX10 – Academy Density Exchange at 10 bits per channel (SMPTE ST 2065-3): a scanned color
 * negative stored as Academy Printing Density, the density a print film's spectral
 * sensitivities would see (ST 2065-2). Codes count up from the film base at 95, 500 per unit
 * of red density as in Cineon; green and blue densities are scaled by 0.92 and 0.95 first. The
 * Academy's input transform reaches ACES2065-1 through one fixed characteristic curve, a toe
 * table then a straight line of gamma 0.55. The standard prefers ADX16; ADX10 serves 10-bit
 * hardware and tops out at 1.856 of red density above the base.
 *
 * @see {@link https://pub.smpte.org/doc/st2065-3/20200909-pub/st2065-3-2020.pdf}
 * @see {@link https://github.com/ampas/aces-dev/blob/v1.3/transforms/ctl/csc/ADX/ACEScsc.Academy.ADX10_to_ACES.ctl}
 * @wiki {@link https://en.wikipedia.org/wiki/Academy_Color_Encoding_System}
 * @year 2008
 * @by Academy (AMPAS)
 * @use Scanned film negatives entering ACES as 10-bit DPX, for archive, restoration and film-originated work.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding log
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// ST 2065-3:2020 Eq. 2: ADX10 = round(w·(APD − APD_Dmin)·500 + 95), w = 1.00, 0.92, 0.95,
// clamped to 0..1023; carried here as code/1023 floats, unrounded, as cineon.js carries its codes.
// ACES2065-1 by the Academy's ACEScsc.Academy.ADX10_to_ACES.ctl (aces-dev v1.3, ADX16's twin):
// channel-dependent density cdd = (code − 95)/500, CDD_TO_CID, relative log exposure by the
// CTL's interpolate1D over its 11-point LUT_1D for cid ≤ 0.6 (linear between knots, held at
// −6 below −0.19, CTL Manual §interpolate1D) and (100/55)·cid − REF_PT above, exposure 10^logE,
// EXP_TO_ACES. REF_PT puts 18% grey at density 0.7, code 445: 445/1023 → 0.18.
// The inverse runs the steps back, the same table read the other way (both columns rise): the
// code itself wherever the forward is one to one. Where CDD_TO_CID's negative term takes a
// channel below −0.19, the CTL holds its exposure at 1e-6 (17.5 stops under 18% grey) and no
// inverse can recover the code: exposure ≤ 1e-6 (the hold, black, what the matrix leaves
// negative) returns cid −0.19, code 0 on the neutral axis, a code the CTL decodes the same.
// OpenColorIO 2.6's ADX10_to_ACES2065-1 extends the first segment below −0.19 (to logE −10).
import aces2065 from './aces2065-1.js';
import { mat3, inv3 } from '../math.js';

const adx10 = { name: 'adx10', range: [[0, 1], [0, 1], [0, 1]] };

// the CTL's matrices, column-vector (its mult_f3_f33 multiplies by the transpose)
const CDD_TO_CID = [
	0.75573, 0.22197, 0.02230,
	0.05901, 0.96928, -0.02829,
	0.16134, 0.07406, 0.76460
];
const EXP_TO_ACES = [
	0.72286, 0.12630, 0.15084,
	0.11923, 0.76418, 0.11659,
	0.01427, 0.08213, 0.90359
];
const CID_TO_CDD = inv3(CDD_TO_CID), ACES_TO_EXP = inv3(EXP_TO_ACES);

// LUT_1D: channel-independent density → relative log exposure
const D = [-0.19, 0.01, 0.028, 0.054, 0.095, 0.145, 0.22, 0.3, 0.4, 0.5, 0.6];
const L = [-6, -2.721718645, -2.521718645, -2.321718645, -2.121718645, -1.921718645,
	-1.721718645, -1.521718645, -1.321718645, -1.121718645, -0.926545676714876];
const REF_PT = (7120 - 1520) / 8000 * (100 / 55) - Math.log10(0.18);

// CTL interpolate1D: linear between knots, held at the end values outside them
const lerp = (X, Y, p) => {
	const n = X.length - 1;
	if (p < X[0]) return Y[0];
	if (p >= X[n]) return Y[n];
	let i = 0;
	while (p >= X[i + 1]) i++;
	const s = (p - X[i]) / (X[i + 1] - X[i]);
	return Y[i] * (1 - s) + Y[i + 1] * s;
};
const logE = (d) => d <= 0.6 ? lerp(D, L, d) : 100 / 55 * d - REF_PT;
const cid = (e) => {
	const l = e > 0 ? Math.log10(e) : -Infinity;
	return l <= L[10] ? lerp(L, D, l) : (l + REF_PT) * 55 / 100;
};

// channel-dependent density ↔ ACES2065-1, shared with adx16.js
export const fromDensity = (r, g, b) => mat3(EXP_TO_ACES, ...mat3(CDD_TO_CID, r, g, b).map(d => Math.pow(10, logE(d))));
export const toDensity = (r, g, b) => mat3(CID_TO_CDD, ...mat3(ACES_TO_EXP, r, g, b).map(cid));

adx10['aces2065-1'] = (r, g, b) => fromDensity((r * 1023 - 95) / 500, (g * 1023 - 95) / 500, (b * 1023 - 95) / 500);
aces2065.adx10 = (r, g, b) => toDensity(r, g, b).map(d => (d * 500 + 95) / 1023);

export default adx10;
