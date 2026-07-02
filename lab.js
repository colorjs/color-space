/**
 * CIE Lab color space (1976)
 *
 * Perceptual color space with approximately uniform lightness. Reference white
 * is D50 — the ICC color-management (PCS) and CSS Color 4 convention for Lab,
 * and the conventional default for Lab as a device-independent interchange
 * space. For a display-native D65 Lab, use `lab-d65`.
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#lab-colors}
 * @channel {L} 0 100 Lightness
 * @channel {a} -125 125 Green-Red axis
 * @channel {b} -125 125 Blue-Yellow axis
 * @illuminant D50
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz, { bradford } from './xyz.js';
import { mat3 } from './util.js';
import { labF, labFInv } from './cie.js';

const lab = {
	name: 'lab',
	range: [[0, 100], [-125, 125], [-125, 125]]
};

const whiteD50 = [0.9642956764295677, 1, 0.8251046025104602]; // CSS Color 4 D50 (0-1)

lab.xyz = (l, a, b) => {
	const fy = (l + 16) / 116;
	const fx = a / 500 + fy;
	const fz = fy - b / 200;
	// Lab is D50-relative -> XYZ D50 (0-1) -> adapt to D65 -> 0-100 convention
	return mat3(bradford.D50_D65, labFInv(fx) * whiteD50[0], labFInv(fy) * whiteD50[1], labFInv(fz) * whiteD50[2]).map(v => v * 100);
};

xyz.lab = (x, y, z) => {
	// XYZ D65 (0-100) -> D50 (0-1) -> Lab
	const [x50, y50, z50] = mat3(bradford.D65_D50, x / 100, y / 100, z / 100);
	const fx = labF(x50 / whiteD50[0]);
	const fy = labF(y50 / whiteD50[1]);
	const fz = labF(z50 / whiteD50[2]);
	return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
};

export default lab;
