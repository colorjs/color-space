/**
 * Ekta Space PS 5 – a working space photographer Joseph Holmes built for high-quality
 * storage of transparency-film scans, sized to the film's gamut rather than to a display.
 * Its blue primary lies outside the spectral locus, so a small part of its code range
 * encodes no real color. It uses a D50 white and gamma 2.2 and is distributed as an ICC
 * profile for Photoshop.
 *
 * @see {@link https://www.josephholmes.com/userfiles/Ekta_Space_PS5_JHolmes.zip} Holmes, Ekta Space PS 5 ICC profile
 * @year 1998
 * @by Joseph Holmes
 * @use Editing transparency-film scans; niche, distributed as an ICC profile.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding gamma
 * @gamut ektaspace
 * @illuminant D50
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Primaries R(0.695, 0.305) G(0.260, 0.700) B(0.110, 0.005), white D50 (0.3457, 0.3585): the
// colorant tags of Holmes's "Ekta Space PS 5, J Holmes.icc" (cprt "Copyright 1998 Joseph
// Holmes", the source of @year) give these to 3e-5 in xy, and Lindbloom's working-space
// table prints the same. colour-science 0.4.7 'Ekta Space PS 5' instead carries xy computed
// from those tags rounded to 3 decimals (0.694737 = 0.594/0.855 …), up to 4.8e-4 off.
// Gamma 2.2 (Lindbloom, colour-science); the profile stores it as u8Fixed8 563/256.
// Purpose: Lindbloom, Working Space Authors (brucelindbloom.com/WorkingSpaceAuthors.html).
// The blue (0.110, 0.005) is left of the spectral locus (x 0.174 at y 0.005); Lindbloom's
// table gives a coding efficiency of 99.5%.
// M50 = normalized primary matrix (SMPTE RP 177) to D50, Bradford-adapted to the D65 hub with
// xyz.js bradford.D50_D65 (CSS Color 4), the adaptation prophoto-linear.js and lab.js use.
import xyz, { bradford } from './xyz.js';
import { mat3, mul3, inv3 } from '../math.js';
import { gammaEncode, gammaDecode } from '../transfers.js';

const ektaspace = { name: 'ektaspace', range: [[0, 1], [0, 1], [0, 1]] };

// linear Ekta Space PS 5 -> XYZ D50 (Y 0..1)
const M50 = [
	0.593996781668917, 0.2729631548632102, 0.09733573989744039,
	0.260674846631683, 0.7349008015547968, 0.004424351813520018,
	0, 0.041994331517416994, 0.7831102709930432
];
const M = mul3(bradford.D50_D65, M50), MI = inv3(M);
const dec = v => gammaDecode(v, 2.2), enc = v => gammaEncode(v, 2.2);

ektaspace.xyz = (r, g, b) => { const [x, y, z] = mat3(M, dec(r), dec(g), dec(b)); return [x * 100, y * 100, z * 100]; };
xyz.ektaspace = (x, y, z) => { const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100); return [enc(r), enc(g), enc(b)]; };

export default ektaspace;
