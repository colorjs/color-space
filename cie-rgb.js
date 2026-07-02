/**
 * CIE RGB (1931) color space
 *
 * The original Wright-Guild experimental RGB whose colour-matching functions defined
 * CIE XYZ — monochromatic primaries at 700 / 546.1 / 435.8 nm, equal-energy white E,
 * linear (no gamma). The ancestor of all RGB spaces. Matrix derived from the primaries
 * (Lindbloom method) and Bradford-adapted from E to the library's D65 XYZ.
 *
 * @see {@link https://en.wikipedia.org/wiki/CIE_1931_color_space}
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @illuminant E
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

const cieRgb = { name: 'cie-rgb', range: [[0, 1], [0, 1], [0, 1]] };

// CIE RGB (white E) -> XYZ, Bradford-adapted to D65 (Y 0..1)
const M = [
	0.46229840, 0.27412836, 0.21402917,
	0.16323997, 0.82414259, 0.01261744,
	0.00074240, 0.00922993, 1.07908542
];
const MI = inv3(M);

cieRgb.xyz = (r, g, b) => { const [x, y, z] = mat3(M, r, g, b); return [x * 100, y * 100, z * 100]; };
xyz['cie-rgb'] = (x, y, z) => mat3(MI, x / 100, y / 100, z / 100);

export default cieRgb;
