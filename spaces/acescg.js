/**
 * ACEScg — the Academy Color Encoding System's linear working space, defined by AMPAS
 * in 2014 for CGI rendering and visual-effects compositing. Built on the wide AP1
 * primaries, it stores scene-referred light linearly rather than through a log curve,
 * with headroom above white for highlights and light sources that would otherwise
 * clip. It's the standard render and composite space in VFX and animation pipelines
 * built around ACES.
 *
 * @see {@link https://docs.acescentral.com/encodings/acescg/}
 * @wiki {@link https://en.wikipedia.org/wiki/Academy_Color_Encoding_System#ACEScg}
 * @year 2014
 * @by Academy (AMPAS)
 * @use Linear render/composite working space for CGI and VFX; current standard in ACES-based VFX/animation pipelines.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method matrix
 * @encoding linear
 * @gamut ap1
 * @referred scene
 * @dynamic hdr
 */
import xyz, { bradfordAdaptation } from './xyz.js';
import { mat3, inv3 } from '../util.js';

const acescg = {
	name: 'acescg',
	range: [[0, 1], [0, 1], [0, 1]]
};

const M_ACESCG_TO_XYZ_ACES = [
	0.6624541811085053, 0.13400420645643313, 0.1561876870049078,
	0.27222871678091454, 0.6740817658111484, 0.05368951740793705,
	-0.005574649490394108, 0.004060733528982826, 1.0103391003129971
];

// exact inverse of M_ACESCG_TO_XYZ_ACES (so the round-trip is exact)
const M_XYZ_ACES_TO_ACESCG = [
	1.6410233796943261, -0.3248032941847900, -0.2364246952376123,
	-0.6636628587229831, 1.6153315916573381, 0.0167563476855301,
	0.0117218943283754, -0.0082844419962374, 0.9883948585390218
];

// White XYZ (Y = 1) from CIE 1931 xy: the ACES white x 0.32168, y 0.33767 (SMPTE ST 2065-1, as
// AP0/AP1 white in ampas/aces-dev ACESlib.Utilities_Color.ctl) and D65 x 0.3127, y 0.3290 (the
// sRGB / CSS Color 4 digits the hub uses).
const white = (x, y) => [x / y, 1, (1 - x - y) / y];

// D65 <-> ACES white, Bradford — derived from the two whites (the CTL's calculate_cat_matrix
// default), not typed, so sRGB white lands on ACEScg [1, 1, 1]. gl/acescg.glsl.js carries
// these digits printed from here.
const M_ADAPT_D65_TO_ACES = bradfordAdaptation(white(0.3127, 0.3290), white(0.32168, 0.33767));
const M_ADAPT_ACES_TO_D65 = inv3(M_ADAPT_D65_TO_ACES);

acescg.xyz = (r, g, b) => {
	// ACEScg -> XYZ (ACES)
	const [x, y, z] = mat3(M_ACESCG_TO_XYZ_ACES, r, g, b);
	// XYZ (ACES) -> XYZ (D65, 0-100)
	const [x65, y65, z65] = mat3(M_ADAPT_ACES_TO_D65, x, y, z);
	return [x65 * 100, y65 * 100, z65 * 100];
}

xyz.acescg = (x, y, z) => {
	// XYZ (D65, 0-100) -> XYZ (D65, 0-1)
	x = x / 100;
	y = y / 100;
	z = z / 100;
	// XYZ (D65) -> XYZ (ACES)
	const [xa, ya, za] = mat3(M_ADAPT_D65_TO_ACES, x, y, z);
	// XYZ (ACES) -> ACEScg
	return mat3(M_XYZ_ACES_TO_ACESCG, xa, ya, za);
}

export default acescg;
