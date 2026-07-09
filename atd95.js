/**
 * ATD95 — Sherman Lee Guth's final ATD model (1995), a vision-science account of the
 * opponent pathways: retinal illuminance drives gain-controlled cone responses into
 * two sequential opponent stages — A (achromatic), T (tritan, red-green) and D
 * (deutan, yellow-blue) — modelling discrimination and adaptation data rather than
 * appearance scales. Guth himself stressed it "cannot be considered a colour
 * appearance model"; it ships here as the coordinate system of its second
 * (large-field) stage, the one his hue and saturation predictions read from.
 *
 * @see {@link https://doi.org/10.1117/12.206546} Guth 1995
 * @year 1995
 * @by Sherman Lee Guth
 * @use Historical vision-science opponent model (discrimination, not appearance); kept for study.
 * @channel {A} 0 0.05 Achromatic
 * @channel {T} -0.01 0.08 Tritan
 * @channel {D} -0.03 0.06 Deutan
 * @method appearance
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Baked to the published worked example's conditions (colour-science doctest): D65
// white [95.05, 100, 108.88], absolute adapting luminance Y_0 = 318.31 cd/m²,
// k_1 = 0, k_2 = 50, σ = 300. With k_1 = 0 the adaptation gains σ/(σ+LMS_a) are
// constants, so the whole chain — retinal illuminance 18·(Y_0·XYZ/100)^0.8, cone
// matrix with 0.7-power compression, linear opponent stages, and the saturating
// v/(200+|v|) response — is per-channel monotone or linear, hence analytically
// invertible. Output is the stage-2 final responses (A₂, T₂, D₂).
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

const atd95 = { name: 'atd95', range: [[0, 0.05], [-0.01, 0.08], [-0.03, 0.06]] };

const M = [0.2435, 0.8524, -0.0516, -0.3954, 1.1642, 0.0837, 0, 0.0400, 0.6225];
const MI = inv3(M);
const SCALE = [0.66, 1, 0.43], OFF = [0.024, 0.036, 0.31];
const Y0 = 318.31, K2 = 50, SIG = 300;
const spow = (v, p) => Math.sign(v) * Math.pow(Math.abs(v), p);

const retinal = v => 18 * Math.pow(Y0 * v / 100, 0.8);
const lms = XYZr => mat3(M, ...XYZr).map((v, i) => spow(v * SCALE[i], 0.7) + OFF[i]);

// k1 = 0: the adapting signal is K2 x the white's retinal XYZ — constant gains
const LMSa = lms([95.05, 100, 108.88].map(v => K2 * retinal(v)));
const G = LMSa.map(v => SIG / (SIG + v));

const fr = v => v / (200 + Math.abs(v));
const frInv = y => 200 * y / (1 - Math.abs(y));

xyz.atd95 = (X, Y, Z) => {
	const [L, m, S] = lms([X, Y, Z].map(v => retinal(Math.max(v, 0)))).map((v, i) => v * G[i]);
	const A1 = 3.57 * L + 2.64 * m, T1 = 7.18 * L - 6.21 * m, D1 = -0.7 * L + 0.085 * m + S;
	return [fr(0.09 * A1), fr(0.43 * T1 + 0.76 * D1), fr(D1)];
};

atd95.xyz = (A, T, D) => {
	const A1 = frInv(A) / 0.09, D1 = frInv(D), T1 = (frInv(T) - 0.76 * D1) / 0.43;
	const det = 3.57 * -6.21 - 2.64 * 7.18;
	const L = (-6.21 * A1 - 2.64 * T1) / det, m = (-7.18 * A1 + 3.57 * T1) / det;
	const S = D1 + 0.7 * L - 0.085 * m;
	const XYZr = mat3(MI, ...[L, m, S].map((v, i) => spow((v / G[i] - OFF[i]), 1 / 0.7) / SCALE[i]));
	return XYZr.map(v => Math.pow(Math.max(v, 0) / 18, 1 / 0.8) * 100 / Y0);
};

export default atd95;
