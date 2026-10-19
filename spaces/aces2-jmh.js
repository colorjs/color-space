/**
 * ACES 2.0 JMh is the appearance space the ACES 2.0 output transforms work in. They convert
 * ACES2065-1 to lightness J, colorfulness M and hue h, tone-map J and compress M at constant
 * hue, then convert to the display's RGB. The model is a simplified Hellwig 2022: viewing
 * conditions fixed at a 100 cd/m² reference white and adapting field, background Y_b 20 and a
 * dim surround, full adaptation to the ACES white, a cone matrix built from its own primaries
 * in place of CAT16, and no eccentricity factor in colorfulness.
 *
 * @see {@link https://github.com/aces-aswf/aces-core/blob/2d7af39344725aaa8ac3bf1746693c9a1d6c4792/lib/Lib.Academy.OutputTransform.ctl} ACES 2.0 reference CTL (v2.0.0+2025.04.04): init_JMhParams, RGB_to_JMh, JMh_to_RGB
 * @see {@link https://docs.acescentral.com/system-components/output-transforms/}
 * @year 2024
 * @by Academy (AMPAS)
 * @use The working space of the ACES 2.0 output transforms, where tone scale, chroma compression and gamut compression run; OpenColorIO exposes it as the fixed function ACES_RGB_TO_JMh_20.
 * @channel {J} 0 100 Lightness
 * @channel {M} 0 120 Colorfulness
 * @channel {h} 0 360 Hue angle
 * @method appearance
 * @encoding perceptual
 * @illuminant D60
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
// Implementation notes:
// Hangs off ACES2065-1, the output transform's input: its init_JMhParams(AP0) builds the
// model from the AP0 primaries and the ACES white, with RGB 1.0 = the 100 cd/m² reference
// white (J 100). Full adaptation makes the JMh of a color the same from AP0 or AP1 input.
// The CTL folds F_L/100 into D_RGB and the 400 into its A/a/b matrix; this keeps CAM16's
// adapt/unadapt (400·x/(x+27.13), x = (F_L·|c|/100)^0.42) and m1, the exact inverse of
// [A, a, b] = [2R+G+B/20, R−12G/11+B/11, (R+G−2B)/9]; the products are the same.
// Unclamped, like the neighbouring appearance models: the CTL returns JMh 0 for A ≤ 0 and
// caps the adapted response at 0.99 of its asymptote on the way back; here A < 0 gives a
// negative J (spow) and the inverse is exact. Verified against OpenColorIO 2.6.0 both ways.
import aces from './aces2065-1.js';
import { gamut, matrix } from '../gamuts.js';
import { mat3, mul3, inv3, spow } from '../math.js';
import { environment, adapt, unadapt, m1, constrain } from './cam16.js';

const jmh = { name: 'aces2-jmh', range: [[0, 100], [0, 120], [0, 360]] };

const ap0 = matrix(gamut.ap0);	// AP0 → XYZ, ACES white Y = 1

// The CTL's viewing conditions: L_A = 100 cd/m², Y_b = 20 of a 100 cd/m² white, dim surround
// (c 0.59, N_c 0.9). Only F_L, c, N_c and z are taken: the adaptation below is ACES's own.
const env = environment(mat3(ap0, 1, 1, 1), 100, 20, 'dim', true);

// Cone matrix: XYZ → RGB of the CTL's CAM16_PRI. Their white (0.333, 0.333) only scales the
// rows, which full adaptation cancels, so E stands in for it.
const cone = inv3(matrix({ primaries: { r: [0.8336, 0.1735], g: [2.3854, -1.4659], b: [0.087, -0.125] }, white: 'E' }));

// AP0 → adapted cone responses: ×100 (reference white 100 cd/m²), D = 1, so the ACES
// white reads 100 in every cone.
const lms = mul3(cone, ap0);
const W = mat3(lms, 1, 1, 1);
const K = lms.map((v, i) => 100 * v / W[i / 3 | 0]);
const Kinv = inv3(K);

// Achromatic response of the white: all three cones adapt to the same value.
const Aw = 3.05 * adapt([100], env.fl)[0];
const cz = env.c * env.z;

aces[jmh.name] = (R, G, B) => {
	const rgbA = adapt(mat3(K, R, G, B), env.fl);
	const a = rgbA[0] - 12 * rgbA[1] / 11 + rgbA[2] / 11;
	const b = (rgbA[0] + rgbA[1] - 2 * rgbA[2]) / 9;
	const A = 2 * rgbA[0] + rgbA[1] + 0.05 * rgbA[2];
	return [100 * spow(A / Aw, cz), 43 * env.nc * Math.hypot(a, b), constrain(Math.atan2(b, a) * 180 / Math.PI)];
};

jmh['aces2065-1'] = (J, M, h) => {
	const hr = h * Math.PI / 180;
	const A = Aw * spow(J / 100, 1 / cz);
	const r = M / (43 * env.nc);
	const rgbA = mat3(m1, A, r * Math.cos(hr), r * Math.sin(hr)).map(c => c / 1403);
	return mat3(Kinv, ...unadapt(rgbA, env.fl));
};

export default jmh;
