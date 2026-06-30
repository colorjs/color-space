/**
 * CIE Lab color space (1976), D65 reference white
 *
 * Display-native CIELAB: the reference white is D65, matching sRGB / Rec.709 /
 * Display P3, so converting display RGB needs no chromatic adaptation. The
 * default `lab` uses D50 (the ICC / CSS Color 4 convention); use this when you
 * want Lab anchored to the display white instead.
 *
 * @channel {L} 0 100 Lightness
 * @channel {a} -125 125 Green-Red axis
 * @channel {b} -125 125 Blue-Yellow axis
 * @illuminant D65
 * @observer 2
 */
import xyz from './xyz.js';

const labD65 = {
	name: 'lab-d65',
	range: [[0, 100], [-125, 125], [-125, 125]]
};

const ε = 216 / 24389;   // (6/29)^3
const ε3 = 24 / 116;     // 6/29
const κ = 24389 / 27;    // (29/3)^3
const white = [0.9504559270516716, 1, 1.0890577507598784]; // CSS Color 4 D65 (0-1)

labD65.xyz = (l, a, b) => {
	const fy = (l + 16) / 116;
	const fx = a / 500 + fy;
	const fz = fy - b / 200;
	const xr = fx > ε3 ? fx ** 3 : (116 * fx - 16) / κ;
	const yr = l > 8 ? fy ** 3 : l / κ;
	const zr = fz > ε3 ? fz ** 3 : (116 * fz - 16) / κ;
	return [xr * white[0] * 100, yr * white[1] * 100, zr * white[2] * 100];
};

xyz['lab-d65'] = (x, y, z) => {
	const xr = x / 100 / white[0];
	const yr = y / 100 / white[1];
	const zr = z / 100 / white[2];
	const fx = xr > ε ? Math.cbrt(xr) : (κ * xr + 16) / 116;
	const fy = yr > ε ? Math.cbrt(yr) : (κ * yr + 16) / 116;
	const fz = zr > ε ? Math.cbrt(zr) : (κ * zr + 16) / 116;
	return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
};

export default labD65;
