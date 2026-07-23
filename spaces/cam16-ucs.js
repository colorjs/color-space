/**
 * CAM16-UCS is the uniform color space Li et al. built on top of CAM16 in their 2017
 * paper, transforming CAM16's lightness and colorfulness correlates through a
 * compressive scale so that equal numerical distances correspond much more closely
 * to equal perceived color differences. Reprojected into Cartesian coordinates, it
 * behaves like a CIELAB-style space but is far more perceptually uniform, so it is
 * well suited to computing color differences (ΔE) and to gamut mapping, where
 * straight-line distance needs to track actual visual difference.
 *
 * @see {@link https://doi.org/10.1002/col.22131}
 * @wiki {@link https://en.wikipedia.org/wiki/Color_appearance_model#CAM16}
 * @year 2017
 * @by Li et al.
 * @use General-purpose uniform space for delta-E computation and gamut mapping; current default successor to CAM02-UCS.
 * @channel {J} 0 100 Lightness
 * @channel {a} -50 50 Red-Green
 * @channel {b} -50 50 Yellow-Blue
 * @method appearance
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
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
