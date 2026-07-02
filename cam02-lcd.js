/**
 * CAM02-LCD is a variant of the CAM02-UCS uniform color space that Luo, Cui & Li
 * tuned in 2006 specifically for LARGE color differences, rather than the small,
 * fine-grained differences most difference formulas target. Like CAM02-UCS, it
 * reprojects CIECAM02's lightness and colorfulness into a near-Euclidean, Cartesian
 * layout, but with scaling calibrated against large-difference visual data. CAM16-LCD
 * later carried the same large-difference calibration over to CAM16.
 *
 * @see {@link https://doi.org/10.1002/col.20227}
 * @channel {J} 0 100 Lightness
 * @channel {a} -50 50 Red-Green
 * @channel {b} -50 50 Yellow-Blue
 * @referred display
 * @dynamic sdr
 */
import ciecam02 from './ciecam02.js';

const cam02lcd = { name: 'cam02-lcd', range: [[0, 100], [-50, 50], [-50, 50]] };

const c1 = 0.007, c2 = 0.0053;

ciecam02['cam02-lcd'] = (J, M, h) => {
	const Jp = (1 + 100 * c1) * J / (1 + c1 * J);
	const Mp = Math.log(1 + c2 * M) / c2;
	const hr = h * Math.PI / 180;
	return [Jp, Mp * Math.cos(hr), Mp * Math.sin(hr)];
};

cam02lcd.ciecam02 = (Jp, ap, bp) => {
	const Mp = Math.sqrt(ap * ap + bp * bp);
	const M = (Math.exp(c2 * Mp) - 1) / c2;
	const J = Jp / ((1 + 100 * c1) - c1 * Jp);
	let h = Math.atan2(bp, ap) * 180 / Math.PI;
	if (h < 0) h += 360;
	return [J, M, h];
};

export default cam02lcd;
