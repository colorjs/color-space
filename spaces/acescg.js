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
import xyz from './xyz.js';
import { mat3 } from '../util.js';

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

// ACES (D60) to D65 Adaptation
const M_ADAPT_ACES_TO_D65 = [
	0.9872662260783373, -0.006109983795706587, 0.015908301183191198,
	-0.007571724739733996, 1.0018466927495386, 0.00531467636090522,
	0.0030642722309384765, -0.005187269825290497, 1.0814571442867786
];

// exact inverse of M_ADAPT_ACES_TO_D65 (the previous values were not a true inverse)
const M_ADAPT_D65_TO_ACES = [
	1.0129911456995835, 0.0061006416076959, -0.0149311429146671,
	0.0076709832089012, 0.9981775113912461, -0.0050182503890302,
	-0.0028334818392132, 0.0047705284353699, 0.9246965793797629
];

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
