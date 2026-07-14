/**
 * Canon Log 2 — Canon's wider-latitude cinema log curve, introduced with the EOS
 * C300 Mark II to capture more of the sensor's dynamic range than the original
 * Canon Log. Its flatter, lower-contrast curve trades a coarser midtone step for
 * extra stops of highlight and shadow information, intended for heavier grading
 * later. It shares the Cinema Gamut primaries with Canon Log and Canon Log 3.
 *
 * @see {@link https://en.wikipedia.org/wiki/Log_profile}
 * @wiki {@link https://en.wikipedia.org/wiki/Log_profile}
 * @year 2015
 * @by Canon
 * @use Cinema EOS camera log capture for maximum dynamic range; current alongside Canon Log 3.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding log
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// v1.2 constants, legal/NCV range. Reflectance-referred (×0.9, matching the ACES IDT
// and colour-science out_reflection): 18% gray→Y18, 90% card→Y90, perfect white→Y100.
// Canon IT 202007.
import xyz from './xyz.js';
import { mat3, inv3 } from '../util.js';

const clog2 = {
	name: 'clog2',
	range: [[0, 1], [0, 1], [0, 1]]
};

// Canon Log 2 v1.2 constants + 0.9 reflectance factor
const A = 0.24136077, Bm = 87.09937546, Cc = 0.092864125;

// Canon Log 2 -> scene-linear (reflectance-referred)
const decode = (v) => v >= Cc
	? ((Math.pow(10, (v - Cc) / A) - 1) / Bm) * 0.9
	: -((Math.pow(10, (Cc - v) / A) - 1) / Bm) * 0.9;

// scene-linear -> Canon Log 2
const encode = (l) => {
	const s = l / 0.9;
	return s >= 0
		? A * Math.log10(s * Bm + 1) + Cc
		: Cc - A * Math.log10(-s * Bm + 1);
};

// Cinema Gamut linear RGB -> XYZ (D65, Y 0..1)
const M = [
	0.716049646551520, 0.129683477875740, 0.104722802624412,
	0.261261357525555, 0.869642145754960, -0.130903503280514,
	-0.009676346575021, -0.236481636126349, 1.335215733461248
];
const MI = inv3(M);

clog2.xyz = (r, g, b) => {
	const [x, y, z] = mat3(M, decode(r), decode(g), decode(b));
	return [x * 100, y * 100, z * 100];
};

xyz.clog2 = (x, y, z) => {
	const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100);
	return [encode(r), encode(g), encode(b)];
};

export default clog2;
