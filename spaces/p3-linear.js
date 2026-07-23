/**
 * Linear-light Display P3 — the gamma-free counterpart to Apple's Display P3,
 * sharing its wide DCI-P3-derived primaries and D65 white point but with channel
 * values directly proportional to light intensity. It is the intermediate
 * space for accurate color math and image processing, before results are re-encoded
 * with the Display P3 transfer curve for output.
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#predefined-display-p3}
 * @wiki {@link https://en.wikipedia.org/wiki/DCI-P3#P3-D65_(Display_P3)}
 * @year 2015
 * @by Apple
 * @use Linear intermediate for Apple Display P3; current, feeds P3 color math before re-encoding.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method matrix
 * @encoding linear
 * @gamut display-p3
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';
import { mat3, inv3 } from '../util.js';

const p3Linear = {
	name: 'p3-linear',
	range: [[0, 1], [0, 1], [0, 1]]
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
