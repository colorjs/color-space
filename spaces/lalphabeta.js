/**
 * The lαβ color space was introduced by Ruderman, Cronin and Chiao in 1998 to
 * decorrelate natural-scene color statistics, and became widely known as the working
 * space behind Reinhard et al.'s 2001 color-transfer technique. It converts RGB into
 * LMS cone responses, takes their logarithm to compress the eye's wide dynamic range
 * the way the visual system itself does, and then rotates the result into three
 * near-uncorrelated axes: l for achromatic lightness, α for the yellow-blue axis, and
 * β for the red-green axis. Because natural images tend to vary almost independently
 * along these three axes, shifting one image's per-channel mean and spread to match
 * another's — entirely in lαβ — transfers the color mood of one photograph onto
 * another with minimal cross-channel artifacts.
 *
 * @see {@link https://doi.org/10.1109/38.946629} Reinhard et al. 2001; Ruderman et al. 1998
 * @year 1998
 * @by Ruderman, Cronin & Chiao
 * @use Natural-image color-statistics decorrelation for color transfer between photographs; still used in image-processing research (popularized by Reinhard et al. 2001).
 * @channel {l} -6 0 log-luminance
 * @channel {alpha} -1 0.9 Yellow-Blue
 * @channel {beta} -0.21 0.21 Red-Green
 * @method opponent
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Device RGB → LMS cones (paper eq. 4), log10, then the orthogonal l (achromatic) /
// α (yellow-blue) / β (red-green) rotation (eq. 6). Inverses use the exact matrix
// inversions (the paper prints rounded ones); LMS is floored at 1e-6 so black stays
// finite.
//
// Nominal ranges are the sRGB-reachable extent (empirical over the RGB cube):
// l ≥ −5.76 for any non-black color, α ∈ [−0.962, 0.862] (blue → red), β ∈ [−0.205,
// 0.204] (green → red); the ε-floored pure black sits at l ≈ −10.39, below the
// nominal range.
import rgb from './rgb.js';
import { mat3, inv3 } from '../util.js';

const lalphabeta = { name: 'lalphabeta', range: [[-6, 0], [-1, 0.9], [-0.21, 0.21]] };

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
