/**
 * Rec. 2020 Linear color space
 *
 * Linear variant of ITU-R Rec. 2020 (UHDTV/4K standard)
 * Without gamma correction for image processing
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.2020}
 * @channel {R} 0 1 Red (linear)
 * @channel {G} 0 1 Green (linear)
 * @channel {B} 0 1 Blue (linear)
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
