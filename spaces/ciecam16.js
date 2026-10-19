/**
 * CIECAM16 is the color appearance model the CIE recommended in 2022 (CIE 248:2022) to replace
 * CIECAM02 in color management. It is CAM16 with its post-adaptation compression continued as
 * straight lines below and above a working range, which removes the infinite slope at zero and
 * the ceiling at the top; inside that range it gives the same lightness, colorfulness and hue
 * as CAM16 under the same viewing conditions.
 *
 * @see {@link https://doi.org/10.25039/TR.248.2022} CIE 248:2022
 * @see {@link https://github.com/colour-science/colour/blob/v0.4.7/colour/appearance/ciecam16.py} colour-science 0.4.7
 * @year 2022
 * @by CIE
 * @use Color management and cross-media reproduction; the CIE's recommended appearance model since 2022.
 * @channel {J} 0 100 Lightness
 * @channel {M} 0 100 Colorfulness
 * @channel {h} 0 360 Hue angle in degrees
 * @method appearance
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Baked to the CIE reference viewing conditions ciecam02.js and hellwig2022.js use: D65
// adapting white (XYZ [95.05, 100, 108.88]), L_A = 318.31 cd/m², Y_b = 20, average surround,
// not cam16.js's Material Design ones. CIE 248 differs from Li et al. 2017 in two places,
// following colour-science 0.4.7 (XYZ_to_CIECAM16 / CIECAM16_to_XYZ, which cites CIE 248):
// D_RGB = D·100/RGB_w + 1 − D (CAM16 has Y_w for 100, the same at Y_w = 100), and the
// compression f_e: f(q) = 400·(F_L·q/100)^0.42 / ((F_L·q/100)^0.42 + 27.13) between
// q_L = 0.26 and q_U = 150 of the adapted cone signal (white ≈ 100), the line f(q_L)·q/q_L
// through zero below (negatives included), and the tangent at q_U above. Both lines are
// exactly invertible. The 0.1 offset after f_e cancels in A, a, b; it reappears as 0.305
// in the chroma denominator, as in cam16.js.
import xyz from './xyz.js';
import { mat3, spow } from '../math.js';
import { environment, cat16, cat16Inv, m1, constrain } from './cam16.js';

const ciecam16 = { name: 'ciecam16', range: [[0, 100], [0, 100], [0, 360]] };

const white = [95.05, 100, 108.88];
const env = environment(white.map(c => c / 100), 318.31, 20, 'average', false);
const { fl, n, z, c, nc, nbb, ncb, dRgb, dRgbInv } = env;

// f_e (CIE 248) and its inverse, without the 0.1 offset
const qL = 0.26, qU = 150;
const f = q => { const x = (fl * q / 100) ** 0.42; return 400 * x / (x + 27.13); };
const fL = f(qL), fU = f(qU);
const dfU = 1.68 * 27.13 * fl * (fl * qU / 100) ** -0.58 / (27.13 + (fl * qU / 100) ** 0.42) ** 2;
const fe = q => q < qL ? fL * q / qL : q > qU ? fU + dfU * (q - qU) : f(q);
const feInv = y => y < fL ? qL * y / fL : y > fU ? qU + (y - fU) / dfU : 100 / fl * (27.13 * y / (400 - y)) ** (1 / 0.42);

const rgbAW = mat3(cat16, ...white).map((v, i) => fe(v * dRgb[i]));
const Aw = nbb * (2 * rgbAW[0] + rgbAW[1] + 0.05 * rgbAW[2]);
const kt = (5e4 / 13) * nc * ncb, kn = Math.pow(1.64 - Math.pow(0.29, n), 0.73);

xyz.ciecam16 = (X, Y, Z) => {
	const [R, G, B] = mat3(cat16, X, Y, Z).map((v, i) => fe(v * dRgb[i]));
	const a = R - 12 * G / 11 + B / 11, b = (R + G - 2 * B) / 9;
	const hr = Math.atan2(b, a);
	const et = 0.25 * (Math.cos(hr + 2) + 3.8);
	const J = 100 * spow(nbb * (2 * R + G + 0.05 * B) / Aw, c * z);
	const den = R + G + 1.05 * B + 0.305;
	const t = den === 0 ? 0 : kt * et * Math.hypot(a, b) / den;
	const C = spow(t, 0.9) * spow(J / 100, 0.5) * kn;
	return [J, C * Math.pow(fl, 0.25), constrain(hr * 180 / Math.PI)];
};

ciecam16.xyz = (J, M, h) => {
	const hr = h * Math.PI / 180, cosh = Math.cos(hr), sinh = Math.sin(hr);
	const Jroot = spow(J / 100, 0.5);
	const alpha = Jroot === 0 ? 0 : M / Math.pow(fl, 0.25) / Jroot;
	const t = spow(alpha / kn, 1 / 0.9);
	const et = 0.25 * (Math.cos(hr + 2) + 3.8);
	const p2 = Aw * spow(J / 100, 1 / (c * z)) / nbb;
	const den = 23 * kt * et + t * (11 * cosh + 108 * sinh);
	const r = den === 0 ? 0 : 23 * (p2 + 0.305) * t / den;
	const rgb = mat3(m1, p2, r * cosh, r * sinh).map((v, i) => feInv(v / 1403) * dRgbInv[i]);
	return mat3(cat16Inv, ...rgb);
};

export default ciecam16;
