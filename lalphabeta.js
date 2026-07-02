/**
 * lαβ color space (Ruderman 1998)
 *
 * The decorrelated log-cone space behind classic colour transfer (Reinhard et al.
 * 2001): device RGB → LMS cones (paper eq. 4), log10, then the orthogonal l
 * (achromatic) / α (yellow-blue) / β (red-green) rotation (eq. 6). Statistics of
 * natural scenes are nearly independent across these axes, so moving means/variances
 * per axis transfers one image's colour mood onto another. Inverses use the exact
 * matrix inversions (the paper prints rounded ones); LMS is floored at 1e-6 so black
 * stays finite.
 *
 * @see {@link https://doi.org/10.1109/38.946629} Reinhard et al. 2001; Ruderman et al. 1998
 * @channel {l} -10.4 0 log-luminance
 * @channel {alpha} -3 3 Yellow-Blue
 * @channel {beta} -3 3 Red-Green
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import rgb from './rgb.js';
import { mat3, inv3 } from './util.js';

const lalphabeta = { name: 'lalphabeta', range: [[-10.4, 0], [-3, 3], [-3, 3]] };

// RGB -> LMS (Reinhard 2001 eq. 4)
const M = [0.3811, 0.5783, 0.0402, 0.1967, 0.7244, 0.0782, 0.0241, 0.1288, 0.8444];
const MI = inv3(M);
const s3 = Math.sqrt(3), s6 = Math.sqrt(6), s2 = Math.sqrt(2);

rgb.lalphabeta = (r, g, b) => {
	const [L, m, S] = mat3(M, r / 255, g / 255, b / 255).map(v => Math.log10(Math.max(v, 1e-6)));
	return [(L + m + S) / s3, (L + m - 2 * S) / s6, (L - m) / s2];
};

lalphabeta.rgb = (l, a, b) => {
	const t1 = l * s3 / 3, t2 = a * s6 / 6, t3 = b * s2 / 2; // undo the orthonormal rotation
	const L = t1 + t2 + t3, m = t1 + t2 - t3, S = t1 - 2 * t2;
	return mat3(MI, Math.pow(10, L), Math.pow(10, m), Math.pow(10, S)).map(v => v * 255);
};

export default lalphabeta;
