/**
 * CAM02-LCD color space
 *
 * Uniform-color-space form of CIECAM02 optimised for LARGE colour differences
 * (Luo, Cui & Li 2006). Same J'/M' compression family as `cam02-ucs`, with the
 * LCD-tuned constant c2 = 0.0053. Built on `ciecam02` (J, M, h).
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
