/**
 * E-Gamut – FilmLight's wide RGB gamut for its Baselight grading systems, paired with
 * the T-Log curve as a camera-agnostic working space that footage from many cameras is
 * converted into for grading. All three of its primaries lie outside the spectral
 * locus. This is the scene-linear form, before T-Log, with highlights above 1.0.
 *
 * @see {@link https://github.com/colour-science/colour/blob/develop/colour/models/rgb/datasets/filmlight.py}
 * @year 2013
 * @by FilmLight
 * @use Scene-linear working gamut beneath T-Log; Baselight's camera-agnostic grading space.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method matrix
 * @encoding linear
 * @gamut egamut
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// Primaries R(0.8, 0.3177) G(0.18, 0.9) B(0.065, -0.0805), white D65 (0.3127, 0.3290):
// colour-science 0.4.7 RGB_COLOURSPACES['FilmLight E-Gamut'] (sourced there from
// FilmLight's Daniele Siragusano; no public FilmLight specification was found). M is
// their normalized primary matrix at full precision (equals colour-science's to 4e-16).
// MI = inv3(M). The single owner of this matrix: tlog.js composes its curve with these
// edges. E-Gamut 2 (FilmLight's later, wider gamut) is not used by any curve here.
import xyz from './xyz.js';
import { mat3, inv3 } from '../math.js';

const egamut = {
	name: 'egamut',
	range: [[0, 1], [0, 1], [0, 1]]
	// nominal: 1.0 = diffuse white; scene-linear values run above it (highlights) and
	// below 0 (noise, out-of-gamut), like acescg
};

// E-Gamut linear RGB -> XYZ (D65, Y 0..1)
const M = [
	0.7053968500877708, 0.1640413283099190, 0.0810177486539820,
	0.2801307240911059, 0.8202066415495949, -0.1003373656407007,
	-0.1037815115691633, -0.0729072570266306, 1.2657465193556721
];
const MI = inv3(M);

egamut.xyz = (r, g, b) => { const [x, y, z] = mat3(M, r, g, b); return [x * 100, y * 100, z * 100]; };
xyz.egamut = (x, y, z) => mat3(MI, x / 100, y / 100, z / 100);

export default egamut;
