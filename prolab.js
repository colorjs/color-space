/**
 * proLab is a projective perceptual color space proposed by Konovalenko and
 * colleagues in 2021. Where CIELAB reshapes XYZ with an independent cube root on
 * each channel, proLab applies a single projective transformation, so that
 * straight-line mixtures of light — additive color mixing — stay straight lines in
 * proLab coordinates while distances still track human discrimination thresholds
 * the way CIELAB's do. That combination suits image-processing and color-difference
 * work that depends on linear blending staying linear after the color transform.
 *
 * @see {@link https://arxiv.org/abs/2012.07653}
 * @year 2021
 * @by Konovalenko et al.
 * @use Projective, linear-mixture-preserving perceptual space for image processing; emerging, niche.
 * @channel {L} 0 100 Lightness
 * @channel {a} -125 125 Red-Green
 * @channel {b} -125 125 Yellow-Blue
 * @method opponent
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// The XYZ -> proLab step is a single 4x4 homogeneous (projective) matrix
// transform, not CIELAB's per-channel cube root.
import xyz from './xyz.js';

const prolab = { name: 'prolab', range: [[0, 100], [-125, 125], [-125, 125]] };

const Wn = [95.0456, 100, 108.9058]; // D65 (0-100)
const Q = [
	[75.54, 486.66, 167.39, 0],
	[617.72, -595.45, -22.27, 0],
	[48.34, 194.94, -243.28, 0],
	[0.7554, 3.8666, 1.6739, 1]
];
const QI = [
	[0.0013706328, 0.0013873820, 0.0008160689, 0],
	[0.0013706328, -0.0002431549, 0.0009653292, 0],
	[0.0013706328, 0.0000808346, -0.0031748190, 0],
	[-0.0086293672, -0.0002431549, 0.0009653292, 1]
];
const mul4 = (M, v) => M.map(r => r[0] * v[0] + r[1] * v[1] + r[2] * v[2] + r[3] * v[3]);

// XYZ (0-100) -> proLab (projective, normalised by D65)
xyz.prolab = (X, Y, Z) => {
	const v = mul4(Q, [X / Wn[0], Y / Wn[1], Z / Wn[2], 1]);
	return [v[0] / v[3], v[1] / v[3], v[2] / v[3]];
};

// proLab -> XYZ (0-100)
prolab.xyz = (L, a, b) => {
	const v = mul4(QI, [L, a, b, 1]);
	return [v[0] / v[3] * Wn[0], v[1] / v[3] * Wn[1], v[2] / v[3] * Wn[2]];
};

export default prolab;
