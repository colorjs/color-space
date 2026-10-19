/**
 * Don RGB 4 – a wide-gamut Photoshop working space from Don Hutcheson (HutchColor), with a
 * D50 white and gamma 2.2, made to hold the color gamut of Ektachrome transparency film
 * with virtually no clipping. It is distributed as an ICC profile. In Lindbloom's comparison
 * it encloses 72.1% of the CIELAB gamut and all of the film and print color sets he tested
 * except a sliver of the ColorChecker DC.
 *
 * @see {@link http://www.hutchcolor.com/profiles.html} HutchColor, Free RGB color spaces (DonRGB4.icm)
 * @year 1996
 * @by Don Hutcheson (HutchColor)
 * @use Editing transparency scans for photo and prepress; niche, distributed as an ICC profile.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding gamma
 * @gamut donrgb4
 * @illuminant D50
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Primaries R(0.696, 0.300) G(0.215, 0.765) B(0.130, 0.035), white D50 (0.3457, 0.3585): the
// colorant tags of HutchColor's DonRGB4.icm (header 1999-02-12) give these to 4e-5 in xy, and
// Lindbloom's working-space table prints the same. colour-science 0.4.7 'Don RGB 4' instead
// carries xy computed from those tags rounded to 3 decimals (0.696121 …), up to 4.3e-4 off.
// Gamma 2.2 (HutchColor, Lindbloom, colour-science); the profile stores it as u8Fixed8 563/256.
// Year 1996: HutchColor, "named by Damon Rando in 1996". Lab share 72.1% and color-set
// coverage: Lindbloom's table.
// M50 = normalized primary matrix (SMPTE RP 177) to D50, Bradford-adapted to the D65 hub with
// xyz.js bradford.D50_D65 (CSS Color 4), the adaptation prophoto-linear.js and lab.js use.
import xyz, { bradford } from './xyz.js';
import { mat3, mul3, inv3 } from '../math.js';
import { gammaEncode, gammaDecode } from '../transfers.js';

const donrgb4 = { name: 'donrgb4', range: [[0, 1], [0, 1], [0, 1]] };

// linear Don RGB 4 -> XYZ D50 (Y 0..1)
const M50 = [
	0.6458744296471505, 0.19333982709402667, 0.1250814196883905,
	0.2783941507099787, 0.6879300824508391, 0.03367576683918207,
	0.0037119220094664375, 0.017985100194793192, 0.8034075803062006
];
const M = mul3(bradford.D50_D65, M50), MI = inv3(M);
const dec = v => gammaDecode(v, 2.2), enc = v => gammaEncode(v, 2.2);

donrgb4.xyz = (r, g, b) => { const [x, y, z] = mat3(M, dec(r), dec(g), dec(b)); return [x * 100, y * 100, z * 100]; };
xyz.donrgb4 = (x, y, z) => { const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100); return [enc(r), enc(g), enc(b)]; };

export default donrgb4;
