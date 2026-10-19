/**
 * Log-compressed OSA-UCS is the space in which plain Euclidean distance is ΔE_E, the
 * color-difference formula for small to medium differences that Claudio Oleari (Parma),
 * Manuel Melgosa and Rafael Huertas (Granada) published in 2009. It takes OSA-UCS lightness
 * and Oleari's opponent coordinates G, J (logarithms of tristimulus ratios, scaled by
 * lightness), compresses lightness and chroma logarithmically and keeps hue. Its authors
 * found ΔE_E statistically equivalent to CIEDE2000 on many available visual datasets.
 *
 * @see {@link https://doi.org/10.1364/JOSAA.26.000121}
 * @year 2009
 * @by Claudio Oleari, Manuel Melgosa, Rafael Huertas
 * @use Research on small to medium color differences and image-difference metrics (S-DEE, WLF-DEE); far less used than CIEDE2000.
 * @channel {L} -81 22 Lightness
 * @channel {G} -45 35 Red-Green axis
 * @channel {J} -40 40 Yellow-Blue axis
 * @method opponent
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Oleari, Melgosa & Huertas, JOSA A 26(1):121–134 (2009), as restated in full by Simone,
// Pedersen, Farup & Oleari, EURASIP J. Image Video Process. 2013:39, eqs. 1–9, and by Pant
// & Farup, Color Res. Appl. 37(6) (2012), eqs. 39–51 (same constants in both):
//   L_OSA = (5.9(∛Y0 − 2/3 + 0.042·∛(Y0 − 30)) − 14.4)/√2,  Y0 = K(x,y)·Y  (MacAdam 1974)
//   [A B C] = M·[X Y Z];  u = ln((A/B)/0.9366),  v = ln((B/C)/0.9807)
//   J = 2(0.5735·L_OSA + 7.0892)·(0.1792u + 0.9837v)
//   G = −2(0.7640·L_OSA + 9.2521)·(0.9482u − 0.3175v)     (the form of Oleari, JOSA A 21:677, 2004)
//   L_E = ln(1 + (b_L/a_L)·10·L_OSA)/b_L,  C_E = ln(1 + (b_C/a_C)·10·C_OSA)/b_C,
//   C_OSA = √(G² + J²);  a_L = 2.890, b_L = 0.015, a_C = 1.256, b_C = 0.050.
// K, L' and its root are osaucs.js's; the offset is these sources' 14.4 (colour-science's too;
// osaucs.js keeps 14.3993). K's y coefficient: the sources print 2.5643, osaucs.js 2.56439
// (under 1e-3 in L_E).
// G, J are Oleari's log-ratio refit of the OSA-UCS samples, not MacAdam's cube-root j, g
// (osaucs.js): they agree in sign and within a few units. 0.9366 and 0.9807 are A/B and B/C
// of the D65 10° white, so that white is neutral; the 2° D65 white of this library's XYZ
// sits at C_E ≈ 1.4 (OSA-UCS is defined on 10° tristimulus values, fed here unconverted, as
// osaucs.js does). Orientation: the sources write h = arctan(−J/G), G_E = −C_E·cos h,
// J_E = C_E·sin h; the branch that keeps hue (the compression is of chroma alone) is
// G_E = G·C_E/C_OSA, J_E = J·C_E/C_OSA – G > 0 green, J > 0 yellow.
// The other branch, which Pant & Farup's eq. 47 takes, mirrors both axes and leaves ΔE_E
// unchanged. Black has no chromaticity: G = J = 0. Below L_OSA ≈ −12.1 (Y0 < 0.04, the
// darkest 8-bit steps) the lightness scales of G and J pass zero and flip sign – the
// formula's own limit, kept. The inverse is closed form up to MacAdam's lightness root.
// Channel ranges: black L_E = −80.5, white 21.0; the sRGB cube spans G_E −42.1…+30.8,
// J_E −39.1…+36.0 (rounded outward). Display P3 reaches G_E −46.1, Rec. 2020 −52.0.
import xyz from './xyz.js';
import { Kfactor, lightness, lightnessRoot } from './osaucs.js';
import { mat3, inv3 } from '../math.js';

var osaucsEe = {
	name: 'osaucs-ee',
	range: [[-81, 22], [-45, 35], [-40, 40]]
};

// XYZ -> A, B, C, Oleari's main reference frame; single source of truth, inverse derived
const M_ABC = [
	0.6597, 0.4492, -0.1089,
	-0.3053, 1.2126, 0.0927,
	-0.0374, 0.4795, 0.5579
];
const M_ABC_INV = inv3(M_ABC);

// opponent mixing of the two log ratios [u, v] -> J, G (before their lightness scales)
const J1 = 0.1792, J2 = 0.9837, G1 = 0.9482, G2 = -0.3175, DET = J1 * G2 - J2 * G1;
const aL = 2.890, bL = 0.015, aC = 1.256, bC = 0.050;
const sJ = (L) => 2 * (0.5735 * L + 7.0892), sG = (L) => -2 * (0.7640 * L + 9.2521);

/**
 * XYZ (0-100) -> log-compressed OSA-UCS
 *
 * @return {Array<number>} L_E, G_E, J_E
 */
xyz[osaucsEe.name] = function (X, Y, Z) {
	var sum = X + Y + Z;
	var Y0 = sum === 0 ? 0 : Kfactor(X / sum, Y / sum) * Y;
	var L = (lightness(Y0) - 14.4) / Math.SQRT2;

	var [A, B, C] = mat3(M_ABC, X, Y, Z);
	var u = sum === 0 ? 0 : Math.log(A / B / 0.9366);
	var v = sum === 0 ? 0 : Math.log(B / C / 0.9807);
	var J = sJ(L) * (J1 * u + J2 * v);
	var G = sG(L) * (G1 * u + G2 * v);

	var LE = Math.log(1 + bL / aL * 10 * L) / bL;
	var Co = Math.sqrt(G * G + J * J);
	if (Co === 0) return [LE, 0, 0];
	var k = Math.log(1 + bC / aC * 10 * Co) / (bC * Co); // C_E / C_OSA
	return [LE, k * G, k * J];
};

/**
 * Log-compressed OSA-UCS -> XYZ (0-100). The log ratios fix A:B:C, MacAdam's lightness
 * fixes Y0 = K(x,y)·Y and with it the scale.
 */
osaucsEe.xyz = function (LE, GE, JE) {
	var L = (Math.exp(bL * LE) - 1) * aL / (10 * bL);
	var CE = Math.sqrt(GE * GE + JE * JE);
	var k = CE === 0 ? 0 : (Math.exp(bC * CE) - 1) * aC / (10 * bC * CE); // C_OSA / C_E
	var p = JE === 0 ? 0 : k * JE / sJ(L), q = GE === 0 ? 0 : k * GE / sG(L);
	var u = (G2 * p - J2 * q) / DET, v = (J1 * q - G1 * p) / DET;

	var [X, Y, Z] = mat3(M_ABC_INV, 0.9366 * Math.exp(u), 1, 1 / (0.9807 * Math.exp(v)));
	var t = lightnessRoot(L * Math.SQRT2 + 14.4);
	var s = t * t * t / (Kfactor(X / (X + Y + Z), Y / (X + Y + Z)) * Y);
	return [s * X, s * Y, s * Z];
};

export default (osaucsEe);
