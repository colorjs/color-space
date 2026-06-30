/**
 * Display P3 Linear color space
 *
 * Linear variant of DCI-P3 (Apple Display P3)
 * Without gamma correction, used for image processing
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#predefined-display-p3}
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

const p3Linear = {
	name: 'p3-linear'
};

// P3 linear -> XYZ (D65, Y 0..1); inverse derived for an exact round-trip
const M = [
	0.4865709486482162, 0.26566769316909306, 0.1982172852343625,
	0.2289745640697488, 0.6917385218365064, 0.079286914093745,
	0.0000000000000000, 0.04511338185890264, 1.043944368900976
];
const MI = inv3(M);

p3Linear.xyz = (r, g, b) => {
	const [x, y, z] = mat3(M, r, g, b);
	return [x * 100, y * 100, z * 100];
};

xyz[p3Linear.name] = (x, y, z) => mat3(MI, x / 100, y / 100, z / 100);

export default p3Linear;
