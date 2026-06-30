/**
 * CIE Lab color space (1976)
 *
 * Perceptual color space with approximately uniform lightness. Reference white
 * is D50 — the ICC color-management (PCS) and CSS Color 4 convention for Lab,
 * and the conventional default for Lab as a device-independent interchange
 * space. For a display-native D65 Lab, use `lab-d65`.
 *
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

const lab = {
	name: 'lab',
	range: [[0, 100], [-125, 125], [-125, 125]]
};

const ε = 216 / 24389;   // (6/29)^3
const ε3 = 24 / 116;     // 6/29
const κ = 24389 / 27;    // (29/3)^3
const whiteD50 = [0.9642956764295677, 1, 0.8251046025104602]; // CSS Color 4 D50 (0-1)

lab.xyz = (l, a, b) => {
	const fy = (l + 16) / 116;
	const fx = a / 500 + fy;
	const fz = fy - b / 200;
	const xr = fx > ε3 ? fx ** 3 : (116 * fx - 16) / κ;
	const yr = l > 8 ? fy ** 3 : l / κ;
	const zr = fz > ε3 ? fz ** 3 : (116 * fz - 16) / κ;
	// Lab is D50-relative -> XYZ D50 (0-1) -> adapt to D65 -> 0-100 convention
	return mat3(bradford.D50_D65, xr * whiteD50[0], yr * whiteD50[1], zr * whiteD50[2]).map(v => v * 100);
};

xyz.lab = (x, y, z) => {
	// XYZ D65 (0-100) -> D50 (0-1) -> Lab
	const [x50, y50, z50] = mat3(bradford.D65_D50, x / 100, y / 100, z / 100);
	const xr = x50 / whiteD50[0];
	const yr = y50 / whiteD50[1];
	const zr = z50 / whiteD50[2];
	const fx = xr > ε ? Math.cbrt(xr) : (κ * xr + 16) / 116;
	const fy = yr > ε ? Math.cbrt(yr) : (κ * yr + 16) / 116;
	const fz = zr > ε ? Math.cbrt(zr) : (κ * zr + 16) / 116;
	return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
};

export default lab;
