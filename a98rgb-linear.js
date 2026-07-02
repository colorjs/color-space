/**
 * Adobe RGB Linear color space
 *
 * Linear variant of Adobe RGB without gamma correction
 *
 * @see {@link https://en.wikipedia.org/wiki/Adobe_RGB_color_space}
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

const a98Linear = {
	name: 'a98rgb-linear',
	range: [[0, 1], [0, 1], [0, 1]]
};

// A98 RGB linear -> XYZ (D65, Y 0..1); inverse derived for an exact round-trip
const M = [
	0.5766690429101305, 0.1855582379065463, 0.1882286462349947,
	0.29734497525053605, 0.6273635662554661, 0.07529145849399788,
	0.02703136138641234, 0.07068885253582723, 0.9913375368376388
];
const MI = inv3(M);

a98Linear.xyz = (r, g, b) => {
	const [x, y, z] = mat3(M, r, g, b);
	return [x * 100, y * 100, z * 100];
};

xyz[a98Linear.name] = (x, y, z) => mat3(MI, x / 100, y / 100, z / 100);

export default a98Linear;
