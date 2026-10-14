/**
 * Best RGB – Don Hutcheson's variant of Don RGB 4 with the red primary moved onto the
 * spectral locus at 700 nm, to enclose the saturated reds and magentas of Fujichrome
 * Velvia film, and a slightly more saturated green. Its blue, shared with Don RGB 4, lies
 * just outside the locus, so about 3.5% of its code values encode no real color. Like Don
 * RGB 4 it uses a D50 white and gamma 2.2 and is distributed as an ICC profile.
 *
 * @see {@link http://www.hutchcolor.com/profiles.html} HutchColor, Free RGB color spaces (BestRGB.icm)
 * @year 2001
 * @by Don Hutcheson (HutchColor)
 * @use Wide-gamut photo working space for saturated film scans; niche, distributed as an ICC profile.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding gamma
 * @gamut bestrgb
 * @illuminant D50
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Primaries R(0.7347, 0.2653) G(0.215, 0.775) B(0.130, 0.035), white D50 (0.3457, 0.3585): the
// colorant tags of HutchColor's BestRGB.icm (header 2001-03-13, the source of @year) give these
// to 4e-5 in xy, and Lindbloom's working-space table prints the same. colour-science 0.4.7
// 'Best RGB' instead carries xy computed from those tags rounded to 3 decimals
// (0.735192 = 0.633/0.861 …), up to 8.4e-4 off.
// Gamma 2.2 (Lindbloom, colour-science); the profile stores it as u8Fixed8 563/256.
// Red = CIE 1931 700 nm (0.7347, 0.2653); the blue (0.130, 0.035) is left of the 460-465 nm
// locus segment (x 0.1396 at y 0.035). Coding efficiency 96.5%: Lindbloom's table.
// M50 = normalized primary matrix (SMPTE RP 177) to D50, Bradford-adapted to the D65 hub with
// xyz.js bradford.D50_D65 (CSS Color 4), the adaptation prophoto-linear.js and lab.js use.
import xyz, { bradford } from './xyz.js';
import { mat3, mul3, inv3 } from '../util.js';
import { gammaEncode, gammaDecode } from '../transfers.js';

const bestrgb = { name: 'bestrgb', range: [[0, 1], [0, 1], [0, 1]] };

// linear Best RGB -> XYZ D50 (Y 0..1)
const M50 = [
	0.6327705591439651, 0.2045469100324336, 0.12697820725316925,
	0.22849330249202926, 0.7373202570936561, 0.034186440414314796,
	0, 0.009513809768950408, 0.81559079274151
];
const M = mul3(bradford.D50_D65, M50), MI = inv3(M);
const dec = v => gammaDecode(v, 2.2), enc = v => gammaEncode(v, 2.2);

bestrgb.xyz = (r, g, b) => { const [x, y, z] = mat3(M, dec(r), dec(g), dec(b)); return [x * 100, y * 100, z * 100]; };
xyz.bestrgb = (x, y, z) => { const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100); return [enc(r), enc(g), enc(b)]; };

export default bestrgb;
