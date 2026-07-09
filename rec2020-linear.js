/**
 * Linear-light Rec. 2020 — the gamma-free counterpart to the ITU-R BT.2020 UHDTV
 * standard, sharing its extremely wide primaries and D65 white point but with
 * channel values directly proportional to light intensity. It is the working space
 * for accurate color math, compositing and grading of UHD/HDR content, before
 * results are re-encoded with the Rec. 2020 transfer function for delivery.
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.2020}
 * @wiki {@link https://en.wikipedia.org/wiki/Rec._2020}
 * @year 2012
 * @by ITU-R
 * @use Linear intermediate for Rec. 2020 UHDTV primaries; current UHD/HDR grading working space.
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
import { mat3, inv3 } from './util.js';

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
