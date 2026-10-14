/**
 * ColorMatch RGB – the RGB space of Radius's PressView calibrated monitors for professional
 * graphic-arts work, shipped by Adobe as a Photoshop 5 working space. It uses P22-EBU
 * phosphor primaries, a D50 white and gamma 1.8. Its gamut is close to sRGB's, slightly
 * larger in the blue-greens and smaller in the red-blues, and it clips printable cyans
 * that Adobe RGB (1998) keeps.
 *
 * @see {@link https://www.babelcolor.com/index_htm_files/A%20review%20of%20RGB%20color%20spaces.pdf} Pascale (2003), A Review of RGB Color Spaces, Table 5
 * @year 1998
 * @by Radius (PressView); Adobe Systems
 * @use Photoshop RGB working space modeled on Radius PressView calibrated monitors; legacy.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding gamma
 * @gamut colormatch
 * @illuminant D50
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Primaries R(0.630, 0.340) G(0.295, 0.605) B(0.150, 0.075), white D50 (0.3457, 0.3585), gamma
// 1.8: Pascale (2003) Table 5, Lindbloom's working-space table and colour-science 0.4.7
// RGB_COLOURSPACES['ColorMatch RGB']; the colorant tags of Adobe's ColorMatchRGB.icc (Adobe ICC
// Profiles end-user, 2000) give the same to 4e-5 in xy and store the gamma as u8Fixed8 461/256.
// Gamut comparison with sRGB: Pascale; cyan clipping and "shipped with Photoshop 5.x":
// B. Fraser, "Out of Gamut: Finessing Photoshop Color", CreativePro, 2000-06-20.
// M50 = normalized primary matrix (SMPTE RP 177) to D50, Bradford-adapted to the D65 hub with
// xyz.js bradford.D50_D65 (CSS Color 4), the adaptation prophoto-linear.js and lab.js use.
import xyz, { bradford } from './xyz.js';
import { mat3, mul3, inv3 } from '../util.js';
import { gammaEncode, gammaDecode } from '../transfers.js';

const colormatch = { name: 'colormatch', range: [[0, 1], [0, 1], [0, 1]] };

// linear ColorMatch RGB -> XYZ D50 (Y 0..1)
const M50 = [
	0.5094667996305555, 0.3208795441773167, 0.13394933262169562,
	0.2749503363085538, 0.6580749973805986, 0.06697466631084781,
	0.024260323791931195, 0.10877272683976846, 0.6920715518787607
];
const M = mul3(bradford.D50_D65, M50), MI = inv3(M);
const dec = v => gammaDecode(v, 1.8), enc = v => gammaEncode(v, 1.8);

colormatch.xyz = (r, g, b) => { const [x, y, z] = mat3(M, dec(r), dec(g), dec(b)); return [x * 100, y * 100, z * 100]; };
xyz.colormatch = (x, y, z) => { const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100); return [enc(r), enc(g), enc(b)]; };

export default colormatch;
