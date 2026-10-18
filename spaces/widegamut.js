/**
 * Adobe Wide Gamut RGB – a Photoshop working space from Adobe Systems whose primaries sit
 * on or near the spectral locus at 700, 525 and 450 nm, referenced to D50. It encloses
 * 77.6% of the CIELAB gamut in Lindbloom's comparison, against 50.6% for Adobe RGB
 * (1998), so it keeps saturated film and print colors that smaller spaces clip. The price
 * is coarse 8-bit steps and about 8% of code values that encode no real color, so 16-bit
 * editing is recommended. It shares Adobe RGB (1998)'s 563/256 power-law encoding.
 *
 * @see {@link https://www.babelcolor.com/index_htm_files/A%20review%20of%20RGB%20color%20spaces.pdf} Pascale (2003), A Review of RGB Color Spaces, Table 5
 * @wiki {@link https://en.wikipedia.org/wiki/Wide-gamut_RGB_color_space}
 * @year 1998
 * @by Adobe Systems
 * @use Very wide Photoshop RGB working space for 16-bit photo editing; legacy.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding gamma
 * @gamut widegamut
 * @illuminant D50
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Primaries R(0.7347, 0.2653) G(0.1152, 0.8264) B(0.1566, 0.0177), white D50 (0.3457, 0.3585):
// Pascale (2003) Table 5 and Wikipedia, the values colour-science 0.4.7
// RGB_COLOURSPACES['Adobe Wide Gamut RGB'] carries; Lindbloom's working-space table
// (brucelindbloom.com/WorkingSpaceInfo.html) prints them to 3 decimals. The green sits near,
// not on, the CIE 1931 525 nm locus point (0.1142, 0.8262).
// Gamma 563/256 = 2.19921875, Adobe's u8Fixed8 form of 2.2 as in a98rgb.js (Wikipedia,
// colour-science); Lindbloom and Pascale print 2.2.
// Lab-gamut share 77.6% / 50.6% and coding efficiency 91.9%: Lindbloom's table.
// M50 = normalized primary matrix (SMPTE RP 177) to D50, Bradford-adapted to the D65 hub with
// xyz.js bradford.D50_D65 (CSS Color 4), the adaptation prophoto-linear.js and lab.js use.
import xyz, { bradford } from './xyz.js';
import { mat3, mul3, inv3 } from '../math.js';
import { gammaEncode, gammaDecode } from '../transfers.js';

const widegamut = { name: 'widegamut', range: [[0, 1], [0, 1], [0, 1]] };

// linear Wide Gamut RGB -> XYZ D50 (Y 0..1)
const M50 = [
	0.7165007167793859, 0.10102057439747673, 0.14677438525270484,
	0.25872824304011305, 0.7246823149485658, 0.016589442011321044,
	0, 0.051211818965387526, 0.7738927835450726
];
const M = mul3(bradford.D50_D65, M50), MI = inv3(M);
const dec = v => gammaDecode(v, 563 / 256), enc = v => gammaEncode(v, 563 / 256);

widegamut.xyz = (r, g, b) => { const [x, y, z] = mat3(M, dec(r), dec(g), dec(b)); return [x * 100, y * 100, z * 100]; };
xyz.widegamut = (x, y, z) => { const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100); return [enc(r), enc(g), enc(b)]; };

export default widegamut;
