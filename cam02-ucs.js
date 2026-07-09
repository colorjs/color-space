/**
 * CAM02-UCS is the uniform color space Luo, Cui & Li built on top of CIECAM02 in
 * 2006, transforming its lightness and colorfulness correlates through a compressive
 * scale so that equal numerical distances correspond much more closely to equal
 * perceived color differences. Reprojected into Cartesian coordinates, it behaves
 * like a CIELAB-style space but is far more perceptually uniform, making it well
 * suited to computing color differences (ΔE) and to gamut mapping. CAM16-UCS later
 * carried the same compression scheme over to CAM16.
 *
 * @see {@link https://doi.org/10.1002/col.20227}
 * @wiki {@link https://en.wikipedia.org/wiki/CIECAM02#Color_spaces}
 * @year 2006
 * @by Luo, Cui & Li
 * @use General-purpose uniform space for delta-E computation and gamut mapping; superseded by CAM16-UCS but still used in ICC v4 contexts.
 * @channel {J} 0 100 Lightness
 * @channel {a} -50 50 Red-Green
 * @channel {b} -50 50 Yellow-Blue
 * @method appearance
 * @encoding perceptual
 * @referred display
 * @dynamic sdr
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
