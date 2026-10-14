/**
 * Bruce RGB – a working space Bruce Fraser published in 1998 as a safe, output-oriented
 * choice for Photoshop 5 users editing 8-bit images heavily. He designed it as a compromise
 * between ColorMatch RGB, which clips printable cyans, and Adobe RGB (1998), which spends
 * code values on colors few printers reach. It shares the red and blue primaries and D65
 * white of sRGB and Adobe RGB (1998), differs only in its green, and uses gamma 2.2.
 *
 * @see {@link http://www.brucelindbloom.com/WorkingSpaceInfo.html} Lindbloom, RGB Working Space Information
 * @year 1998
 * @by Bruce Fraser
 * @use Conservative-gamut RGB working space for heavily edited 8-bit images; legacy.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding gamma
 * @gamut brucergb
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Primaries R(0.64, 0.33) G(0.28, 0.65) B(0.15, 0.06), white D65, gamma 2.2: Lindbloom's
// working-space table; colour-science 0.4.7 has no Bruce RGB. With Lindbloom's own white
// (ASTM D65, XYZ 0.95047, 1, 1.08883) these primaries reproduce his printed RGB-to-XYZ matrix
// to 4e-8; here the white is the hub's D65 (0.3127, 0.3290), so RGB white maps to hub white.
// History and design intent: B. Fraser, "Out of Gamut: Finessing Photoshop Color",
// CreativePro, 2000-06-20 ("This month BruceRGB celebrates its second birthday").
// M = normalized primary matrix (SMPTE RP 177), MI = inv3(M).
import xyz from './xyz.js';
import { mat3, inv3 } from '../util.js';
import { gammaEncode, gammaDecode } from '../transfers.js';

const brucergb = { name: 'brucergb', range: [[0, 1], [0, 1], [0, 1]] };

// linear Bruce RGB -> XYZ D65 (Y 0..1)
const M = [
	0.46735179379173347, 0.29445803317138564, 0.18864610008855276,
	0.24097826867386257, 0.6835632912907166, 0.0754584400354211,
	0.021907115333987485, 0.07361450829284635, 0.9935361271330445
];
const MI = inv3(M);
const dec = v => gammaDecode(v, 2.2), enc = v => gammaEncode(v, 2.2);

brucergb.xyz = (r, g, b) => { const [x, y, z] = mat3(M, dec(r), dec(g), dec(b)); return [x * 100, y * 100, z * 100]; };
xyz.brucergb = (x, y, z) => { const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100); return [enc(r), enc(g), enc(b)]; };

export default brucergb;
