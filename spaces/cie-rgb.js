/**
 * CIE RGB — the color space built directly from the Wright and Guild color-matching
 * experiments of 1928–1931, whose data became the foundation of CIE XYZ. Its primaries are
 * single-wavelength lights, unlike the broadband primaries of any real display, with an
 * equal-energy white. Nearly every later RGB space descends from it.
 *
 * @see {@link https://doi.org/10.1098/rsta.1932.0005} Guild 1931, Phil. Trans. A 230, 149
 * @wiki {@link https://en.wikipedia.org/wiki/CIE_1931_color_space#CIE_RGB_color_space}
 * @year 1931
 * @by CIE
 * @use Teaching and historical reference.
 * @successor xyz Its color-matching functions go negative, so the CIE adopted all-positive XYZ the same year
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding gamma
 * @gamut cie-rgb
 * @illuminant E
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Primaries are monochromatic lines at 700 / 546.1 / 435.8 nm. Matrix derived via
// the Lindbloom method, Bradford-adapted from illuminant E to D65.
import xyz from './xyz.js';
import { mat3, inv3 } from '../math.js';

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
