/**
 * DaVinci Wide Gamut – Blackmagic Design's camera-agnostic RGB gamut, introduced in
 * 2020 with DaVinci Resolve 17 together with the DaVinci Intermediate log curve.
 * Blackmagic designed it to hold the vast majority of colors modern cameras capture,
 * so footage from many sources can be stored and graded in one space before output to
 * Rec.709 or Rec.2020. This is the scene-linear form, before the DaVinci Intermediate
 * curve, with highlights above 1.0.
 *
 * @see {@link https://documents.blackmagicdesign.com/InformationNotes/DaVinci_Resolve_17_Wide_Gamut_Intermediate.pdf}
 * @year 2020
 * @by Blackmagic Design
 * @use Scene-linear camera-agnostic working gamut beneath DaVinci Intermediate; current in DaVinci Resolve's color-managed pipeline.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method matrix
 * @encoding linear
 * @gamut dwg
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// Blackmagic "DaVinci Wide Gamut Intermediate" (v1.1, 2021-07-31): primaries R(0.8000,
// 0.3130) G(0.1682, 0.9877) B(0.0790, -0.1155), white D65 (0.3127, 0.3290); both
// matrices as printed there (8 decimals). They are each other's inverse only to 1e-8
// (M·MI − I ≤ 1.2e-8), so a round trip through this space carries that error; MI is
// kept as printed, not inv3(M), so davinci.js stays bit-identical. M agrees with
// colour-science 0.4.7 RGB_COLOURSPACES['DaVinci Wide Gamut'] (derived from the
// primaries) to 5e-9. The single owner of these matrices: davinci.js composes its
// curve with these edges.
import xyz from './xyz.js';
import { mat3 } from '../util.js';

const dwg = {
	name: 'dwg',
	range: [[0, 1], [0, 1], [0, 1]]
	// nominal: 1.0 = diffuse white; scene-linear values run above it (highlights) and
	// below 0 (noise, out-of-gamut), like acescg
};

// DaVinci Wide Gamut <-> XYZ (D65, Y 0..1) – whitepaper matrices
const M = [
	0.70062239, 0.14877482, 0.10105872,
	0.27411851, 0.87363190, -0.14775041,
	-0.09896291, -0.13789533, 1.32591599
];
const MI = [
	1.51667204, -0.28147805, -0.14696363,
	-0.46491710, 1.25142378, 0.17488461,
	0.06484905, 0.10913934, 0.76141462
];

dwg.xyz = (r, g, b) => { const [x, y, z] = mat3(M, r, g, b); return [x * 100, y * 100, z * 100]; };
xyz.dwg = (x, y, z) => mat3(MI, x / 100, y / 100, z / 100);

export default dwg;
