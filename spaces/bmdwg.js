/**
 * Blackmagic Wide Gamut (Gen 5) – the camera RGB primaries of Blackmagic Design's
 * Generation 5 color science, introduced in 2020 and paired with the Blackmagic Film
 * Gen 5 log curve in Blackmagic RAW. All three of its primaries are virtual, outside
 * the spectral locus, placed to hold what the sensor records. This is the scene-linear
 * form, before the log curve, with highlights above 1.0.
 *
 * @see {@link https://github.com/aces-aswf/aces-input-and-colorspaces/blob/main/blackmagic_design/CSC.Blackmagic.BMDFilm_WideGamut_Gen5_to_ACES.ctl}
 * @year 2020
 * @by Blackmagic Design
 * @use Scene-linear camera gamut beneath Blackmagic Film Gen 5 for BRAW footage in VFX and grading; current on Gen 5 color-science cameras.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method matrix
 * @encoding linear
 * @gamut bmdwg
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// Primaries R(0.7177215, 0.3171181) G(0.2280410, 0.8615690) B(0.1005841, -0.0820452):
// Blackmagic's vendor-supplied ACES CSC (BMD_CAM_WG_GEN5_PRI), the values colour-science
// cites from "Blackmagic Generation 5 Color Science" (2021). Both give the white as
// (0.3127170, 0.3290312), D65 to seven digits; M normalizes the primaries to the D65 (0.3127, 0.3290) the hub uses (within
// 5e-11 of that exact matrix), so Blackmagic white lands on hub D65. colour-science 0.4.7
// RGB_COLOURSPACES['Blackmagic Wide Gamut'] normalizes to the seven-digit white instead:
// the two differ by up to 2.5e-4 (a 3e-5 shift in white xy). MI = inv3(M). The single
// owner of this matrix: bmdfilm.js composes its curve with these edges.
import xyz from './xyz.js';
import { mat3, inv3 } from '../math.js';

const bmdwg = {
	name: 'bmdwg',
	range: [[0, 1], [0, 1], [0, 1]]
	// nominal: 1.0 = diffuse white; scene-linear values run above it (highlights) and
	// below 0 (noise, out-of-gamut), like acescg
};

// BMD Wide Gamut Gen5 linear RGB -> XYZ (D65, Y 0..1)
const M = [
	0.6065383683, 0.2204127353, 0.1235048234,
	0.2679929401, 0.8327484091, -0.1007413492,
	-0.0294425542, -0.0866124303, 1.2051127352
];
const MI = inv3(M);

bmdwg.xyz = (r, g, b) => { const [x, y, z] = mat3(M, r, g, b); return [x * 100, y * 100, z * 100]; };
xyz.bmdwg = (x, y, z) => mat3(MI, x / 100, y / 100, z / 100);

export default bmdwg;
