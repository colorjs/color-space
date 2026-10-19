/**
 * The Kim-Weyrich-Kautz model is a color appearance model published at SIGGRAPH 2009 from
 * psychophysical data gathered at luminance levels up to 16,860 cd/m². It keeps CIECAM02's
 * CAT02 adaptation but feeds absolute cone signals through a sigmoid set by the adapting
 * luminance, then reads lightness through a media-dependent factor (LCD, transparency, CRT,
 * paper).
 *
 * @see {@link https://doi.org/10.1145/1531326.1531333} Kim, Weyrich & Kautz 2009, ACM TOG 28(3), 27
 * @year 2009
 * @by Min H. Kim, Tim Weyrich & Jan Kautz
 * @use Cross-media reproduction and HDR tone mapping; academic.
 * @channel {J} -110 110 Lightness
 * @channel {M} 0 110 Colorfulness
 * @channel {h} 0 360 Hue angle in degrees
 * @method appearance
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic hdr
 */
// Implementation notes:
// Equations and constants: Kim, Weyrich & Kautz 2009 (author copy
// https://jankautz.com/publications/XLRCAM_SIG09.pdf) – cone sigmoid n_c = 0.57 (Eq. 2),
// A = (40L' + 20M' + S')/61 (Eq. 3), J' with α_j 0.89, β_j 0.24, σ_j 0.65, n_j 3.65
// (Eqs. 4–5), J = 100·[E(J' − 1) + 1] with E = 1.4572 for CRT displays (Eq. 6), a, b
// (Eqs. 8–9), C = 456.5·√(a² + b²)^0.62 (Eq. 10), M = C·(0.11·log10 L_w + 0.61) (Eq. 11),
// h (Eq. 13). CAT02 (Moroney et al. 2002, CIE 159:2004) and Hunt-Pointer-Estévez as in
// colour-science 0.4.7 colour/appearance/kim2009.py (CAT_CAT02, MATRIX_XYZ_TO_HPE).
// Viewing conditions are cam16.js's: white D65 [95.047, 100, 108.883], L_A = 64/π·0.2
// cd/m², Y_b = 20, average surround (F = 1), CRT media (colour's default). The model
// wants absolute XYZ, so relative Y = 100 is taken as white luminance L_w = 100·L_A/Y_b
// = 64/π cd/m² (L_A is 20 % of white, the gray-world reading of Y_b = 20).
// Deviations, shared with colour-science: J' below zero (A/A_w < β_j, grays darker than
// Y ≈ 1.3 % of white here) is sign-extended instead of clamped as the paper suggests
// (Sec. 5.3), so the model stays invertible. Black lands at J ≈ −108 and white at
// J ≈ 108 with E = 1.4572, hence ±110; M reaches ≈ 83 over sRGB and ≈ 109 over BT.2020.
// The inverse [A, a, b] -> L'M'S' matrix is derived (the paper's appendix prints it
// rounded to 4 decimals). With D < 1 the white keeps M ≈ 4.
import xyz from './xyz.js';
import { mat3, mul3, inv3, spow, cartToPolar, polarToCart } from '../math.js';

const kim2009 = { name: 'kim2009', range: [[-110, 110], [0, 110], [0, 360]] };

const LA = 64 / Math.PI * 0.2, Yb = 20, F = 1, E = 1.4572;
const Lw = 100 * LA / Yb;
const W = [95.047, 100, 108.883];

const CAT02 = [0.7328, 0.4296, -0.1624, -0.7036, 1.6975, 0.0061, 0.0030, 0.0136, 0.9834];
const HPE = [0.38971, 0.68898, -0.07868, -0.22981, 1.18340, 0.04641, 0, 0, 1];
// relative XYZ -> absolute (×L_w/100), CAT02 von Kries step with degree D, CAT02⁻¹, HPE
const D = F * (1 - (1 / 3.6) * Math.exp((-LA - 42) / 92));
const Dk = mat3(CAT02, ...W).map(v => W[1] * D / v + 1 - D);
const K = mul3(mul3(HPE, inv3(CAT02)), mul3([Dk[0], 0, 0, 0, Dk[1], 0, 0, 0, Dk[2]], CAT02)).map(v => v * Lw / 100);
const KI = inv3(K);
// L'M'S' -> A, a, b (Eqs. 3, 8, 9) and its derived inverse
const OPP = [40 / 61, 20 / 61, 1 / 61, 1, -12 / 11, 1 / 11, 1 / 9, 1 / 9, -2 / 9];
const OPPI = inv3(OPP);

const nc = 0.57, LAn = Math.pow(LA, nc);
const cone = v => { const p = spow(v, nc); return p / (p + LAn); };
const uncone = p => spow(LAn * p / (1 - p), 1 / nc);
const aj = 0.89, bj = 0.24, sn = Math.pow(0.65, 3.65), nj = 3.65;
const Mk = 0.11 * Math.log10(Lw) + 0.61;
const Aw = mat3(OPP, ...mat3(K, ...W).map(cone))[0];

xyz.kim2009 = (X, Y, Z) => {
	const [A, a, b] = mat3(OPP, ...mat3(K, X, Y, Z).map(cone));
	const r = A / Aw;
	const Jp = spow(-(r - bj) * sn / (r - bj - aj), 1 / nj);
	const [, ab, h] = cartToPolar(0, a, b);
	return [100 * (E * (Jp - 1) + 1), 456.5 * Math.pow(ab, 0.62) * Mk, h];
};

kim2009.xyz = (J, M, h) => {
	const Jn = spow((J / 100 - 1) / E + 1, nj);
	const A = Aw * (aj * Jn / (Jn + sn) + bj);
	const [, a, b] = polarToCart(0, spow(M / Mk / 456.5, 1 / 0.62), h);
	return mat3(KI, ...mat3(OPPI, A, a, b).map(uncone));
};

export default kim2009;
