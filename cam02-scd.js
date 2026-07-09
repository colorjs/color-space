/**
 * CAM02-SCD is a variant of the CAM02-UCS uniform color space that Luo, Cui & Li
 * tuned in 2006 specifically for SMALL color differences, such as those relevant to
 * tolerance and quality-control judgments. Like CAM02-UCS, it reprojects CIECAM02's
 * lightness and colorfulness into a near-Euclidean, Cartesian layout, but with
 * scaling calibrated against small, near-threshold visual differences. CAM16-SCD
 * later carried the same small-difference calibration over to CAM16.
 *
 * @see {@link https://doi.org/10.1002/col.20227}
 * @year 2006
 * @by Luo, Cui & Li
 * @use Uniform space for small color-difference tolerance/QC judgments; largely superseded by CAM16-SCD.
 * @channel {J} 0 100 Lightness
 * @channel {a} -50 50 Red-Green
 * @channel {b} -50 50 Yellow-Blue
 * @method appearance
 * @encoding perceptual
 * @referred display
 * @dynamic sdr
 */
import ciecam02 from './ciecam02.js';

const cam02scd = { name: 'cam02-scd', range: [[0, 100], [-50, 50], [-50, 50]] };

const c1 = 0.007, c2 = 0.0363;

ciecam02['cam02-scd'] = (J, M, h) => {
	const Jp = (1 + 100 * c1) * J / (1 + c1 * J);
	const Mp = Math.log(1 + c2 * M) / c2;
	const hr = h * Math.PI / 180;
	return [Jp, Mp * Math.cos(hr), Mp * Math.sin(hr)];
};

cam02scd.ciecam02 = (Jp, ap, bp) => {
	const Mp = Math.sqrt(ap * ap + bp * bp);
	const M = (Math.exp(c2 * Mp) - 1) / c2;
	const J = Jp / ((1 + 100 * c1) - c1 * Jp);
	let h = Math.atan2(bp, ap) * 180 / Math.PI;
	if (h < 0) h += 360;
	return [J, M, h];
};

export default cam02scd;
