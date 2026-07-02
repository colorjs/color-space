/**
 * The Hellwig-Fairchild model, published in 2022, is the CIE-recommended refinement
 * of CAM16 and the mathematical basis of CIECAM16 (CIE 248:2022). It keeps CAM16's
 * chromatic-adaptation transform, opponent-color dimensions, and lightness correlate
 * largely intact, but revises the achromatic response and brightness equations for
 * more consistent behavior across the model's full range. Like CAM16 it reports
 * lightness, colorfulness, and hue as its core correlates, making it a close drop-in
 * successor wherever a CIE-endorsed appearance model is called for.
 *
 * @see {@link https://doi.org/10.1002/col.22792} Hellwig & Fairchild 2022
 * @channel {J} 0 100 Lightness
 * @channel {M} 0 60 Colourfulness
 * @channel {h} 0 360 Hue angle
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Achromatic response: 2R+G+0.05B−0.305 (no n_bb scaling, the CAM16→Hellwig change).
// Brightness linearised as Q = (2/c)(J/100)·A_w. Uses the canonical Hellwig2022/
// CIECAM reference viewing conditions — D65 white, L_A = 318.31 cd/m², Y_b = 20,
// average surround — not CAM16's Material Design conditions.
import xyz from './xyz.js';
import { mat3, spow } from './util.js';
import { environment, adapt, unadapt, cat16, cat16Inv, m1, constrain } from './cam16.js';

const hellwig = { name: 'hellwig2022', range: [[0, 100], [0, 60], [0, 360]] };

// Standard CAM viewing conditions (D65 white, L_A=318.31, Y_b=20, average surround) —
// the canonical Hellwig2022 / CIECAM reference, NOT cam16's Material-design conditions.
const white = [95.05, 100, 108.88];
const env = environment(white.map(c => c / 100), 318.31, 20, 'average', false);

// Hellwig achromatic response of the adapted white. The model's −0.305 offset cancels
// in the lightness ratio and the brightness uses the un-offset A_w, so net there is no
// offset (verified: J=41.7312, Q=55.852 vs colour-science). No n_bb scaling (the CAM16→
// Hellwig change).
const rgbAW = adapt(mat3(cat16, ...white).map((c, i) => c * env.dRgb[i]), env.fl);
const Aw = 2 * rgbAW[0] + rgbAW[1] + 0.05 * rgbAW[2];

// Hellwig 4-harmonic eccentricity factor (h in radians)
const ecc = h => -0.0582 * Math.cos(h) - 0.0258 * Math.cos(2 * h) - 0.1347 * Math.cos(3 * h) + 0.0289 * Math.cos(4 * h)
	- 0.1475 * Math.sin(h) - 0.0308 * Math.sin(2 * h) + 0.0385 * Math.sin(3 * h) + 0.0096 * Math.sin(4 * h) + 1;

xyz.hellwig2022 = (X, Y, Z) => {
	const rgbA = adapt(mat3(cat16, X, Y, Z).map((c, i) => c * env.dRgb[i]), env.fl);
	const a = rgbA[0] - 12 * rgbA[1] / 11 + rgbA[2] / 11;
	const b = (rgbA[0] + rgbA[1] - 2 * rgbA[2]) / 9;
	const hr = Math.atan2(b, a);
	const A = 2 * rgbA[0] + rgbA[1] + 0.05 * rgbA[2];
	const J = 100 * spow(A / Aw, env.c * env.z);
	const M = 43 * env.nc * ecc(hr) * Math.hypot(a, b);
	return [J, M, constrain(hr * 180 / Math.PI)];
};

hellwig.xyz = (J, M, h) => {
	const hr = h * Math.PI / 180;
	const A = Aw * spow(J / 100, 1 / (env.c * env.z));
	const r = M / (43 * env.nc * ecc(hr));
	const rgbA = mat3(m1, A, r * Math.cos(hr), r * Math.sin(hr)).map(c => c / 1403);
	const rgb = unadapt(rgbA, env.fl).map((c, i) => c * env.dRgbInv[i]);
	return mat3(cat16Inv, ...rgb);
};

export default hellwig;
