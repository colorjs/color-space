/**
 * LLAB — Luo, Lo & Kuo's 1996 colour appearance model, developed as a candidate
 * successor to CIELAB for cross-media image reproduction. It keeps CIELAB's opponent
 * skeleton but swaps in a BFD chromatic-adaptation transform, a surround-dependent
 * lightness exponent, and a logarithmic chroma compression that better tracks
 * perceived colourfulness. CIECAM97s absorbed its ideas the following year, ending
 * its short life as a standalone model.
 *
 * @see {@link https://doi.org/10.1002/(SICI)1520-6378(199612)21:6<412::AID-COL4>3.0.CO;2-Z} Luo, Lo & Kuo 1996
 * @year 1996
 * @by Luo, Lo & Kuo
 * @use Historical CIELAB successor candidate for cross-media reproduction; superseded by CIECAM97s/CIECAM02.
 * @channel {L} -10 100 Lightness
 * @channel {A} -80 100 Red-Green
 * @channel {B} -90 90 Yellow-Blue
 * @method appearance
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Baked to the reference conditions of the published worked example (Fairchild 2013 /
// colour-science): D65 white [95.05, 100, 108.88], adapting luminance L = 318.31 cd/m²,
// background Y_b = 20, "reference samples, average surround, <4°" induction (D=1,
// F_S=3, F_L=1, F_C=1). At the D65 reference the BFD adaptation collapses to identity,
// leaving the opponent stage: L = 116·f(Y/100)^z − 16 with z = 1+√(Y_b/100),
// a = 500·(f(X/95.05) − f(Y/100)), b = 200·(f(Y/100) − f(Z/108.88)); chroma compresses
// as Ch = 25·ln(1+0.05c) and colourfulness scales by S_M(L)·S_C(L_adapt). Output is the
// final opponent pair (A, B) = C_L·(cos h, sin h). Fully analytic both ways.
import xyz from './xyz.js';

const llab = { name: 'llab', range: [[-10, 100], [-80, 100], [-90, 90]] };

const z = 1 + Math.sqrt(0.2); // 1 + F_L·√(Y_b/100)
const SC = 1 + 0.47 * Math.log10(318.31) - 0.057 * Math.log10(318.31) ** 2;
const t0 = 0.008856, f0 = Math.cbrt(t0);
const f = x => x > t0 ? Math.cbrt(x) : ((f0 - 16 / 116) / t0) * x + 16 / 116;
const fInv = v => v > f0 ? v * v * v : (v - 16 / 116) * t0 / (f0 - 16 / 116);
const SM = L => 0.7 + 0.02 * L - 0.0002 * L * L;

xyz.llab = (X, Y, Z) => {
	const fy = f(Y / 100);
	const L = 116 * Math.pow(fy, z) - 16;
	const a = 500 * (f(X / 95.05) - fy), b = 200 * (fy - f(Z / 108.88));
	const c = Math.hypot(a, b);
	const CL = 25 * Math.log1p(0.05 * c) * SM(L) * SC;
	const h = Math.atan2(b, a);
	return [L, CL * Math.cos(h), CL * Math.sin(h)];
};

llab.xyz = (L, A, B) => {
	const CL = Math.hypot(A, B), h = Math.atan2(B, A);
	const c = (Math.exp(CL / (SM(L) * SC) / 25) - 1) / 0.05;
	const a = c * Math.cos(h), b = c * Math.sin(h);
	const fy = fInv(Math.pow((L + 16) / 116, 1 / z));
	const fyr = f(fy); // f(Y/100) as a value, for the opponent offsets
	return [95.05 * fInv(fyr + a / 500), 100 * fy, 108.88 * fInv(fyr - b / 200)];
};

export default llab;
