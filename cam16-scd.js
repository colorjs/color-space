/**
 * CAM16-SCD color space
 *
 * Uniform-color-space form of CAM16 optimised for SMALL colour differences (Li et al.
 * 2017, using the Luo 2006 coefficients). Same J'/M' compression family as `cam16-ucs`,
 * with the SCD-tuned constant c2 = 0.0363. Built on `cam16` (J, M, h).
 *
 * @see {@link https://doi.org/10.1002/col.22131}
 * @channel {J} 0 100 Lightness
 * @channel {a} -50 50 Red-Green
 * @channel {b} -50 50 Yellow-Blue
 * @referred display
 * @dynamic sdr
 */
import cam16 from './cam16.js';

const cam16scd = { name: 'cam16-scd', range: [[0, 100], [-50, 50], [-50, 50]] };

const c1 = 0.007, c2 = 0.0363;

cam16['cam16-scd'] = (J, M, h) => {
	const Jp = (1 + 100 * c1) * J / (1 + c1 * J);
	const Mp = Math.log(1 + c2 * M) / c2;
	const hr = h * Math.PI / 180;
	return [Jp, Mp * Math.cos(hr), Mp * Math.sin(hr)];
};

cam16scd.cam16 = (Jp, ap, bp) => {
	const Mp = Math.sqrt(ap * ap + bp * bp);
	const M = (Math.exp(c2 * Mp) - 1) / c2;
	const J = Jp / ((1 + 100 * c1) - c1 * Jp);
	let h = Math.atan2(bp, ap) * 180 / Math.PI;
	if (h < 0) h += 360;
	return [J, M, h];
};

export default cam16scd;
