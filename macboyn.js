/**
 * MacLeod-Boynton (MB) chromaticity — the cone-excitation diagram MacLeod & Boynton
 * introduced in 1979, plotting color as relative long- and short-wavelength cone
 * excitation on a constant-luminance plane. Isolating chromaticity at the level of the
 * cones themselves, rather than at the tristimulus values a display uses, made it the
 * foundation of the DKL cardinal-axis space and a staple of chromatic-discrimination
 * research in vision science.
 *
 * @see {@link https://doi.org/10.1364/JOSA.69.001183} MacLeod & Boynton 1979
 * @channel {l} 0 1 Red-green chromaticity
 * @channel {s} 0 1 Tritan chromaticity
 * @channel {Y} 0 100 Luminance
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// l = L/(L+M) and s = S/(L+M) on the Smith-Pokorny (1975) cone fundamentals, scaled so
// L+M = Y (luminance). Stored with the MB luminance (L+M ≈ Y) as a third channel for
// invertibility.
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

const macboyn = { name: 'macboyn', range: [[0, 1], [0, 1], [0, 100]] };

// Smith-Pokorny cone fundamentals (XYZ -> LMS), scaled so L+M = Y
const M = [
	0.15514, 0.54312, -0.03286,
	-0.15514, 0.45684, 0.03286,
	0, 0, 0.01608
];
const MI = inv3(M);

xyz.macboyn = (X, Y, Z) => {
	const [L, m, S] = mat3(M, X, Y, Z);
	const lum = L + m;
	if (lum === 0) return [0, 0, 0];
	return [L / lum, S / lum, lum];
};

macboyn.xyz = (l, s, lum) => mat3(MI, l * lum, (1 - l) * lum, s * lum);

export default macboyn;
