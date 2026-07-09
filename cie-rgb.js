/**
 * CIE RGB — the experimental color space built directly from the 1931 Wright-Guild
 * color-matching experiments, whose data became the foundation for the CIE XYZ
 * standard itself. Its three primaries are monochromatic single-wavelength lights
 * rather than the broadband primaries of any real display, referenced to an
 * equal-energy white point. It survives today mainly as a historical and
 * pedagogical space — the common ancestor from which nearly every later RGB space
 * descends.
 *
 * @see {@link https://en.wikipedia.org/wiki/CIE_1931_color_space}
 * @wiki {@link https://en.wikipedia.org/wiki/CIE_1931_color_space#CIE_RGB_color_space}
 * @year 1931
 * @by CIE
 * @use Historical/pedagogical reference space built from the Wright-Guild matching data; obsolete in production, ancestor of CIE XYZ.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding gamma
 * @illuminant E
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Primaries are monochromatic lines at 700 / 546.1 / 435.8 nm. Matrix derived via
// the Lindbloom method, Bradford-adapted from illuminant E to D65.
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
