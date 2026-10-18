/**
 * REDWideGamutRGB – RED Digital Cinema's standardized camera RGB, introduced in 2017
 * with the IPP2 image pipeline and paired with the Log3G10 curve. RED designed it to
 * encompass every color a RED camera can generate without clipping, which puts its
 * green primary far outside the spectral locus (y ≈ 1.49). This is the scene-linear
 * form, before Log3G10, with highlights above 1.0.
 *
 * @see {@link https://docs.red.com/955-0187/PDF/915-0187%20Rev-C%20%20%20RED%20OPS%2C%20White%20Paper%20on%20REDWideGamutRGB%20and%20Log3G10.pdf}
 * @year 2017
 * @by RED Digital Cinema
 * @use Scene-linear camera gamut beneath Log3G10 and Log3G12 for RED footage in VFX and grading; current on RED's IPP2 cameras.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method matrix
 * @encoding linear
 * @gamut rwg
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// RED "White Paper on REDWideGamutRGB and Log3G10" (915-0187 Rev C, 11/17): primaries
// R(0.780308, 0.304253) G(0.121595, 1.493994) B(0.095612, -0.084589), white D65 (0.3127,
// 0.3290). M is their normalized primary matrix at full precision; RED and colour-science
// 0.4.7 RGB_COLOURSPACES['REDWideGamutRGB'] print it to 6 decimals (agree to 5e-7).
// MI = inv3(M). The single owner of this matrix: log3g10.js and log3g12.js compose
// their curves with these edges.
import xyz from './xyz.js';
import { mat3, inv3 } from '../math.js';

const rwg = {
	name: 'rwg',
	range: [[0, 1], [0, 1], [0, 1]]
	// nominal: 1.0 = diffuse white; scene-linear values run above it (highlights) and
	// below 0 (noise, out-of-gamut), like acescg
};

// REDWideGamutRGB linear RGB -> XYZ (D65, Y 0..1)
const M = [
	0.7352752459058587, 0.0686094106139610, 0.1465712705318520,
	0.2866940994999349, 0.8429791340169754, -0.1296732335169103,
	-0.0796808568783677, -0.3473432169944297, 1.5160818246326759
];
const MI = inv3(M);

rwg.xyz = (r, g, b) => { const [x, y, z] = mat3(M, r, g, b); return [x * 100, y * 100, z * 100]; };
xyz.rwg = (x, y, z) => mat3(MI, x / 100, y / 100, z / 100);

export default rwg;
