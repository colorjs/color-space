/**
 * Lab-D65 is CIELAB — the CIE's 1976 perceptual space — reanchored to the D65
 * white point instead of the standard's usual D50, so it lines up directly with
 * sRGB, Rec. 709 and Display P3. Keeping Lab and the display on the same white
 * point avoids an extra chromatic-adaptation step when converting to and from RGB,
 * which matters for work that stays entirely within a D65 display's color world
 * rather than crossing into device-independent interchange. Its structure is
 * otherwise identical to standard CIELAB: perceptually even lightness paired with
 * red-green and yellow-blue opponent axes.
 *
 * @see {@link https://en.wikipedia.org/wiki/CIELAB_color_space}
 * @wiki {@link https://en.wikipedia.org/wiki/CIELAB_color_space}
 * @year 1976
 * @by CIE
 * @use D65-anchored CIELAB avoiding chromatic adaptation for sRGB/Rec.709/P3 work; current, common in display-color tooling.
 * @channel {L} 0 100 Lightness
 * @channel {a} -125 125 Green-Red axis
 * @channel {b} -125 125 Blue-Yellow axis
 * @method opponent
 * @encoding perceptual
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
