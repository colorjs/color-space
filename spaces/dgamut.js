/**
 * D-Gamut – DJI's camera RGB primaries for its cinema color system, introduced in
 * 2017 with the Zenmuse X7 and paired with the D-Log curve. DJI built it to cover
 * Rec.709 and DCI-P3 with margin, and set each primary as nearly as possible on the
 * line from D65 through the matching DCI-P3 primary, so hues hold when footage is
 * gamut-mapped to P3. This is the scene-linear form, before D-Log, with highlights
 * above 1.0.
 *
 * @see {@link https://dl.djicdn.com/downloads/zenmuse+x7/20171010/D-Log_D-Gamut_Whitepaper.pdf}
 * @year 2017
 * @by DJI
 * @use Scene-linear gamut under D-Log for VFX and grading of DJI Zenmuse and Ronin footage.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method matrix
 * @encoding linear
 * @gamut dgamut
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// DJI "D-Log and D-Gamut" white paper (2017): primaries R(0.71, 0.31) G(0.21, 0.88)
// B(0.09, -0.08), white D65 (0.3127, 0.3290); M is its printed 4-decimal matrix (=
// colour-science 0.4.7 RGB_COLOURSPACES['DJI D-Gamut']), which maps RGB white to XYZ
// (0.9504, 1, 1.0888) – D65 to 6e-5 – and differs from the exact normalized primary
// matrix by up to 1.8e-4. MI = inv3(M); the paper's own inverse is printed to 4
// decimals too. The single owner of this matrix: dlog.js composes its curve with these
// edges.
import xyz from './xyz.js';
import { mat3, inv3 } from '../math.js';

const dgamut = {
	name: 'dgamut',
	range: [[0, 1], [0, 1], [0, 1]]
	// nominal: 1.0 = diffuse white; scene-linear values run above it (highlights) and
	// below 0 (noise, out-of-gamut), like acescg
};

// D-Gamut linear RGB -> XYZ (D65, Y 0..1)
const M = [
	0.6482, 0.1940, 0.1082,
	0.2830, 0.8132, -0.0962,
	-0.0183, -0.0832, 1.1903
];
const MI = inv3(M);

dgamut.xyz = (r, g, b) => { const [x, y, z] = mat3(M, r, g, b); return [x * 100, y * 100, z * 100]; };
xyz.dgamut = (x, y, z) => mat3(MI, x / 100, y / 100, z / 100);

export default dgamut;
