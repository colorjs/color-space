/**
 * CIE Lab color space (1976), D65 reference white
 *
 * Display-native CIELAB: the reference white is D65, matching sRGB / Rec.709 /
 * Display P3, so converting display RGB needs no chromatic adaptation. The
 * default `lab` uses D50 (the ICC / CSS Color 4 convention); use this when you
 * want Lab anchored to the display white instead.
 *
 * @see {@link https://en.wikipedia.org/wiki/CIELAB_color_space}
 * @channel {L} 0 100 Lightness
 * @channel {a} -125 125 Green-Red axis
 * @channel {b} -125 125 Blue-Yellow axis
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';
import { labF, labFInv } from './cie.js';

const labD65 = {
	name: 'lab-d65',
	range: [[0, 100], [-125, 125], [-125, 125]]
};

const white = [0.9504559270516716, 1, 1.0890577507598784]; // CSS Color 4 D65 (0-1)

labD65.xyz = (l, a, b) => {
	const fy = (l + 16) / 116;
	const fx = a / 500 + fy;
	const fz = fy - b / 200;
	return [labFInv(fx) * white[0] * 100, labFInv(fy) * white[1] * 100, labFInv(fz) * white[2] * 100];
};

xyz[labD65.name] = (x, y, z) => {
	const fx = labF(x / 100 / white[0]);
	const fy = labF(y / 100 / white[1]);
	const fz = labF(z / 100 / white[2]);
	return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
};

export default labD65;
