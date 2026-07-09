/**
 * sUCS is the uniform color space built from sCAM, a "simple" color-appearance
 * model published by Li and Luo in 2024. It aims to match the perceptual uniformity
 * of CAM16-UCS — equal numeric distances corresponding to equal perceived
 * differences — through a far lighter calculation pipeline than a full appearance
 * model like CAM16 requires. It's meant as a fast, lower-complexity substitute for
 * CAM16-UCS or Oklab in tasks such as color-difference measurement that don't need
 * viewing-condition parameters.
 *
 * @see {@link https://doi.org/10.1364/OE.510196} Li & Luo 2024, Opt. Express 32, 3100
 * @year 2024
 * @by Li & Luo
 * @use Lightweight uniform color space alternative to CAM16-UCS/Oklab for color-difference tasks; new/emerging.
 * @channel {I} 0 100 Lightness
 * @channel {a} -50 50 Red-Green
 * @channel {b} -50 50 Yellow-Blue
 * @method opponent
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// XYZ -> LMS (Hunt-Pointer-Estevez-like matrix) -> signed power 0.43 -> fixed
// opponent matrix to I (lightness), a, b.
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

const sucs = { name: 'sucs', range: [[0, 100], [-50, 50], [-50, 50]] };

const spow = (v, p) => v < 0 ? -Math.pow(-v, p) : Math.pow(v, p);

const M_XYZ_LMS = [0.4002, 0.7075, -0.0807, -0.2280, 1.1500, 0.0612, 0, 0, 0.9184];
const M_LMS_XYZ = inv3(M_XYZ_LMS);
const M_LMSP_IAB = [200 / 3.05, 100 / 3.05, 5 / 3.05, 430, -470, 40, 49, 49, -98];
const M_IAB_LMSP = inv3(M_LMSP_IAB);

// XYZ (0-100) -> sUCS Iab
xyz.sucs = (X, Y, Z) => {
	const [l, m, s] = mat3(M_XYZ_LMS, X / 100, Y / 100, Z / 100);
	return mat3(M_LMSP_IAB, spow(l, 0.43), spow(m, 0.43), spow(s, 0.43));
};

// sUCS Iab -> XYZ (0-100)
sucs.xyz = (I, a, b) => {
	const [lp, mp, sp] = mat3(M_IAB_LMSP, I, a, b);
	const [x, y, z] = mat3(M_LMS_XYZ, spow(lp, 1 / 0.43), spow(mp, 1 / 0.43), spow(sp, 1 / 0.43));
	return [x * 100, y * 100, z * 100];
};

export default sucs;
