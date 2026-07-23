/**
 * CAM16-LCD is a variant of the CAM16-UCS uniform color space that Li et al. tuned in
 * 2017 specifically for LARGE color differences, carrying over compression
 * coefficients from Luo, Cui & Li's 2006 work on perceptually uniform CIECAM spaces.
 * Like CAM16-UCS it reprojects CAM16's lightness and colorfulness into a
 * near-Euclidean, Cartesian layout, but its scaling is calibrated against
 * large-difference visual data rather than the small, fine-grained differences most
 * color-difference formulas target — the CAM16 counterpart to CAM02-LCD.
 *
 * @see {@link https://doi.org/10.1002/col.22131}
 * @year 2017
 * @by Li et al.
 * @use Uniform space for large color-difference/gamut-mapping comparisons; current default for that role.
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

const cam16lcd = { name: 'cam16-lcd', range: [[0, 100], [-50, 50], [-50, 50]] };

const c1 = 0.007, c2 = 0.0053;

cam16['cam16-lcd'] = (J, M, h) => {
	const Jp = (1 + 100 * c1) * J / (1 + c1 * J);
	const Mp = Math.log(1 + c2 * M) / c2;
	const hr = h * Math.PI / 180;
	return [Jp, Mp * Math.cos(hr), Mp * Math.sin(hr)];
};

cam16lcd.cam16 = (Jp, ap, bp) => {
	const Mp = Math.sqrt(ap * ap + bp * bp);
	const M = (Math.exp(c2 * Mp) - 1) / c2;
	const J = Jp / ((1 + 100 * c1) - c1 * Jp);
	let h = Math.atan2(bp, ap) * 180 / Math.PI;
	if (h < 0) h += 360;
	return [J, M, h];
};

export default cam16lcd;
