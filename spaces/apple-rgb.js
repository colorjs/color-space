/**
 * Apple RGB — the working space of classic Mac OS, modeled on Apple's original Trinitron CRT
 * displays. It pairs a D65 white with a gamma of about 1.8, Apple's historic system default,
 * and was a common Photoshop working space for years; legacy image files still carry it.
 *
 * @see {@link http://www.brucelindbloom.com/WorkingSpaceInfo.html}
 * @wiki {@link https://en.wikipedia.org/wiki/RGB_color_spaces#Apple_RGB}
 * @year 1987
 * @by Apple Computer
 * @use Mac and Photoshop working space (D65, γ 1.8) from the 13″ AppleColor monitor.
 * @successor rgb sRGB became the default of Windows, the web and Photoshop 5
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
import { mat3, inv3 } from '../math.js';
import { gammaEncode, gammaDecode } from '../transfers.js';

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
