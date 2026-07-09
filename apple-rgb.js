/**
 * Apple RGB — the working space used by classic Mac OS, modeling the color response
 * of Apple's original Trinitron CRT displays. Referenced to the D65 white point with
 * a gamma of about 1.8, Apple's historic system default, it remained a common
 * Photoshop working space for years and is still encountered in millions of legacy
 * image files.
 *
 * @see {@link http://www.brucelindbloom.com/WorkingSpaceInfo.html}
 * @wiki {@link https://en.wikipedia.org/wiki/RGB_color_spaces#Apple_RGB}
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding gamma
 * @gamut apple-rgb
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';
import { gammaEncode, gammaDecode } from './transfers.js';

const appleRgb = { name: 'apple-rgb', range: [[0, 1], [0, 1], [0, 1]] };

// Apple RGB (D65) -> XYZ (Y 0..1)
const M = [
	0.44966162, 0.31625612, 0.18453819,
	0.24461592, 0.67204425, 0.08333983,
	0.02518105, 0.14118577, 0.92269093
];
const MI = inv3(M);
const dec = v => gammaDecode(v, 1.8), enc = v => gammaEncode(v, 1.8);

appleRgb.xyz = (r, g, b) => { const [x, y, z] = mat3(M, dec(r), dec(g), dec(b)); return [x * 100, y * 100, z * 100]; };
xyz['apple-rgb'] = (x, y, z) => { const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100); return [enc(r), enc(g), enc(b)]; };

export default appleRgb;
