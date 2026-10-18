/**
 * ARRI Wide Gamut 4 – the RGB primaries of ARRI's fourth color-science generation,
 * introduced with the ALEXA 35 in 2022 and paired with the LogC4 curve. Its red
 * primary is ACES AP0's red and its green sits on AP0's red-green edge, so the gamut
 * lies within AP0. This is the scene-linear form: decoded LogC4 data before any display
 * transform, with highlights above 1.0.
 *
 * @see {@link https://www.arri.com/resource/blob/278790/dc29f7399c1dc9553d329e27f1409a89/2022-05-arri-logc4-specification-data.pdf}
 * @year 2022
 * @by ARRI
 * @use Scene-linear camera gamut beneath LogC4 for ALEXA 35 footage in VFX and grading; current ARRI standard.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method matrix
 * @encoding linear
 * @gamut awg4
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// ARRI LogC4 Specification (2025-01-23): primaries §4.2.1 R(0.7347, 0.2653) G(0.1424,
// 0.8576) B(0.0991, -0.0308), white §4.2.2 D65 (0.3127, 0.3290); M is Eq 5a as printed
// (18 digits; equals colour-science 0.4.7 RGB_COLOURSPACES['ARRI Wide Gamut 4']).
// MI = inv3(M). The single owner of this matrix: logc4.js composes its curve with
// these edges.
import xyz from './xyz.js';
import { mat3, inv3 } from '../math.js';

const awg4 = {
	name: 'awg4',
	range: [[0, 1], [0, 1], [0, 1]]
	// nominal: 1.0 = a white diffusing reflector; scene-linear values run above it
	// (highlights) and below 0 (noise, out-of-gamut), like acescg
};

// AWG4 linear RGB -> XYZ (D65, Y 0..1), ARRI LogC4 Spec Eq 5a
const M = [
	0.704858320407232064, 0.129760295170463003, 0.115837311473976537,
	0.254524176404027025, 0.781477732712002049, -0.036001909116029039,
	0.000000000000000000, 0.000000000000000000, 1.089057750759878429
];
const MI = inv3(M);

awg4.xyz = (r, g, b) => { const [x, y, z] = mat3(M, r, g, b); return [x * 100, y * 100, z * 100]; };
xyz.awg4 = (x, y, z) => mat3(MI, x / 100, y / 100, z / 100);

export default awg4;
