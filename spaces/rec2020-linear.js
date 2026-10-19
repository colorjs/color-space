/**
 * Linear-light Rec. 2020 — the UHDTV standard ITU-R BT.2020 without its transfer curve: the
 * same very wide primaries and D65 white, with channel values proportional to light. Color
 * math is accurate here; the Rec. 2020 curve is reapplied for delivery.
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.2020}
 * @wiki {@link https://en.wikipedia.org/wiki/Rec._2020}
 * @year 2012
 * @by ITU-R
 * @use A UHD and HDR grading working space.
 * @aka F-Gamut; N-Gamut
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method matrix
 * @encoding linear
 * @gamut rec2020
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';
import { mat3, inv3 } from '../math.js';

const rec2020Linear = {
	name: 'rec2020-linear',
	range: [[0, 1], [0, 1], [0, 1]]
};

// Rec.2020 linear -> XYZ (D65, Y 0..1); inverse derived for an exact round-trip
const M = [
	0.6369580483012914, 0.14461690358620832, 0.1688809751641721,
	0.2627002120112671, 0.6779980715188708, 0.05930171646986196,
	0.0000000000000000, 0.028072693049087428, 1.060985057710791
];
const MI = inv3(M);

rec2020Linear.xyz = (r, g, b) => {
	const [x, y, z] = mat3(M, r, g, b);
	return [x * 100, y * 100, z * 100];
};

xyz[rec2020Linear.name] = (x, y, z) => mat3(MI, x / 100, y / 100, z / 100);

export default rec2020Linear;
