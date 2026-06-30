/**
 * CAM02-UCS color space
 *
 * Uniform-color-space form of CIECAM02 (Luo, Cui & Li 2006): compresses lightness
 * J and colourfulness M, then lays out (J', a', b') for colour-difference (ΔE) and
 * gamut mapping. Built on ciecam02 (J, M, h). Same compression family as cam16-ucs.
 *
 * @see {@link https://doi.org/10.1002/col.20227}
 * @channel {J} 0 100 Lightness (J')
 * @channel {a} -50 50 Red-Green (a')
 * @channel {b} -50 50 Yellow-Blue (b')
 */
import ciecam02 from './ciecam02.js';

const cam02ucs = {
	name: 'cam02-ucs',
	range: [[0, 100], [-50, 50], [-50, 50]]
};

const c1 = 0.007;
const c2 = 0.0228;

// CIECAM02 (J, M, h) -> CAM02-UCS (J', a', b')
ciecam02['cam02-ucs'] = (J, M, h) => {
	const Jp = (1 + 100 * c1) * J / (1 + c1 * J);
	const Mp = Math.log(1 + c2 * M) / c2;
	const hr = h * Math.PI / 180;
	return [Jp, Mp * Math.cos(hr), Mp * Math.sin(hr)];
};

// CAM02-UCS -> CIECAM02
cam02ucs.ciecam02 = (Jp, ap, bp) => {
	const Mp = Math.sqrt(ap * ap + bp * bp);
	const M = (Math.exp(c2 * Mp) - 1) / c2;
	const J = Jp / ((1 + 100 * c1) - c1 * Jp);
	let h = Math.atan2(bp, ap) * 180 / Math.PI;
	if (h < 0) h += 360;
	return [J, M, h];
};

export default cam02ucs;
