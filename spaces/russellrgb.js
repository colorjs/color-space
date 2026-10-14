/**
 * Russell RGB – a working space photographer Russell Cottrell derived in 2011 by extending
 * Bruce Lindbloom's Beta RGB into the cyans and blues, because the gamuts of his 10- and
 * 12-ink pigment inkjet printers slightly exceeded Beta RGB there. It uses Cottrell's
 * preferred 5500 K (D55) reference white and gamma 2.2, and is distributed as an ICC
 * profile made in Photoshop.
 *
 * @see {@link https://www.russellcottrell.com/photo/RussellRGB.htm} Cottrell, The Russell RGB working color space
 * @year 2011
 * @by Russell Cottrell
 * @use Print-oriented wide-gamut working space for pigment inkjet output; niche.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding gamma
 * @gamut russellrgb
 * @illuminant D55
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Primaries R(0.69, 0.31) G(0.18, 0.77) B(0.10, 0.02), gamma 2.2: Cottrell's page (its printed
// RGB-to-XYZ matrix) and colour-science 0.4.7 RGB_COLOURSPACES['Russell RGB'].
// White x 0.3324, y 0.3474: Photoshop's 5500 K, the white of Cottrell's matrix (its row sums
// give this xy to 4e-9; these primaries reproduce the matrix to 4e-8) and of his
// RussellRGB.icc wtpt tag (header 2011-09-05, the source of @year). colour-science uses CIE D55
// (0.33243, 0.34744) instead, which moves its matrix by up to 3e-4.
// The profile stores gamma as u8Fixed8 563/256; Cottrell states 2.2.
// M = Bradford(white -> D65, xyz.js bradfordAdaptation) x normalized primary matrix (SMPTE RP
// 177), as dci-p3.js adapts DCI white; MI = inv3(M).
import xyz, { bradfordAdaptation } from './xyz.js';
import { mat3, mul3, inv3 } from '../util.js';
import { gammaEncode, gammaDecode } from '../transfers.js';

const russellrgb = { name: 'russellrgb', range: [[0, 1], [0, 1], [0, 1]] };

// white XYZ (Y = 1) from CIE 1931 xy
const white = (x, y) => [x / y, 1, (1 - x - y) / y];

// linear Russell RGB -> XYZ, 5500 K white (Y 0..1)
const M55 = [
	0.701573104610983, 0.15541570023565063, 0.09983330223454093,
	0.3151995107672533, 0.6648338287858389, 0.019966660446908185,
	0, 0.04317102784323632, 0.8785330596639601
];
const M = mul3(bradfordAdaptation(white(0.3324, 0.3474), white(0.3127, 0.3290)), M55), MI = inv3(M);
const dec = v => gammaDecode(v, 2.2), enc = v => gammaEncode(v, 2.2);

russellrgb.xyz = (r, g, b) => { const [x, y, z] = mat3(M, dec(r), dec(g), dec(b)); return [x * 100, y * 100, z * 100]; };
xyz.russellrgb = (x, y, z) => { const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100); return [enc(r), enc(g), enc(b)]; };

export default russellrgb;
