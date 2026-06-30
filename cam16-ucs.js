/**
 * CAM16-UCS color space
 *
 * Uniform-color-space form of CAM16 (Li et al. 2017): compresses lightness J and
 * colourfulness M, then lays out (J', a', b') as a near-Euclidean space suitable
 * for colour-difference (ΔE) and gamut mapping. Built on cam16 (J, M, h).
 *
 * @see {@link https://doi.org/10.1002/col.22131}
 * @channel {J} 0 100 Lightness (J')
 * @channel {a} -50 50 Red-Green (a')
 * @channel {b} -50 50 Yellow-Blue (b')
 */
import cam16 from './cam16.js';

const cam16ucs = {
	name: 'cam16-ucs',
	range: [[0, 100], [-50, 50], [-50, 50]]
};

const c1 = 0.007;
const c2 = 0.0228;

// CAM16 (J, M, h) -> CAM16-UCS (J', a', b')
cam16[cam16ucs.name] = (J, M, h) => {
	const Jp = (1 + 100 * c1) * J / (1 + c1 * J);
	const Mp = Math.log(1 + c2 * M) / c2;
	const hr = h * Math.PI / 180;
	return [Jp, Mp * Math.cos(hr), Mp * Math.sin(hr)];
};

// CAM16-UCS -> CAM16
cam16ucs.cam16 = (Jp, ap, bp) => {
	const Mp = Math.sqrt(ap * ap + bp * bp);
	const M = (Math.exp(c2 * Mp) - 1) / c2;
	const J = Jp / ((1 + 100 * c1) - c1 * Jp);
	let h = Math.atan2(bp, ap) * 180 / Math.PI;
	if (h < 0) h += 360;
	return [J, M, h];
};

export default cam16ucs;
