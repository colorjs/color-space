/**
 * Beta RGB – a working space Bruce Lindbloom derived as the smallest RGB gamut that
 * encloses a reference set of film, color-chart and printing colors, so it holds them
 * with less wasted code range than larger spaces such as ProPhoto RGB. Its white is D50,
 * the white of ICC profiles and Photoshop's Lab, chosen to avoid an adaptation step, and
 * it uses gamma 2.2: Lindbloom's own perturbation analysis found an optimum near 2.12 and
 * he kept the conventional value.
 *
 * @see {@link https://web.archive.org/web/20030415230837/http://www.brucelindbloom.com/BetaRGB.html} Lindbloom, Beta RGB (archived 2003-04-15)
 * @year 2003
 * @by Bruce Lindbloom
 * @use Optimized capture, archiving and editing working space for high-end photo work; niche.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding gamma
 * @gamut betargb
 * @illuminant D50
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Primaries R(0.6888, 0.3112) G(0.1986, 0.7551) B(0.1265, 0.0352), white D50 (0.3457, 0.3585),
// gamma 2.2: Lindbloom's Beta RGB page (earliest archived copy April 2003; the live page now
// redirects to his home page) and his working-space table (brucelindbloom.com/WorkingSpaceInfo.html);
// colour-science 0.4.7 RGB_COLOURSPACES['Beta RGB'] carries the same.
// M50 = normalized primary matrix (SMPTE RP 177) to D50, Bradford-adapted to the D65 hub with
// xyz.js bradford.D50_D65 (CSS Color 4), the adaptation prophoto-linear.js and lab.js use.
import xyz, { bradford } from './xyz.js';
import { mat3, mul3, inv3 } from '../util.js';
import { gammaEncode, gammaDecode } from '../transfers.js';

const betargb = { name: 'betargb', range: [[0, 1], [0, 1], [0, 1]] };

// linear Beta RGB -> XYZ D50 (Y 0..1)
const M50 = [
	0.6713559029385414, 0.1745723808403657, 0.11836739265066047,
	0.30331875289557797, 0.6637442334972817, 0.032937013607140304,
	0, 0.040698394929048004, 0.7844062075814123
];
const M = mul3(bradford.D50_D65, M50), MI = inv3(M);
const dec = v => gammaDecode(v, 2.2), enc = v => gammaEncode(v, 2.2);

betargb.xyz = (r, g, b) => { const [x, y, z] = mat3(M, dec(r), dec(g), dec(b)); return [x * 100, y * 100, z * 100]; };
xyz.betargb = (x, y, z) => { const [r, g, b] = mat3(MI, x / 100, y / 100, z / 100); return [enc(r), enc(g), enc(b)]; };

export default betargb;
