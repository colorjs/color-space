/**
 * DKL — the cardinal-axis space of human color vision, proposed by Derrington, Krauskopf
 * & Lennie in 1984 from recordings of neurons in the macaque lateral geniculate nucleus.
 * Rather than an arbitrary opponent model, its three axes are the actual directions
 * early visual neurons respond along: an achromatic luminance axis, an isoluminant
 * red-green axis, and a tritan blue-yellow axis, all measured relative to an adapting
 * white. It remains a standard framework in vision science for designing stimuli that
 * isolate one cardinal mechanism at a time.
 *
 * @see {@link https://doi.org/10.1113/jphysiol.1984.sp015499} Derrington et al. 1984
 * @year 1984
 * @by Derrington, Krauskopf & Lennie
 * @use Vision-science stimulus design isolating cardinal color mechanisms; current standard framework in that research field.
 * @channel {Ach} -100 0 Achromatic
 * @channel {RG} -31 0 Red-Green
 * @channel {YV} 0 99 Tritan
 * @method opponent
 * @encoding linear
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Un-normalised cardinal form; sources differ on axis scaling — normalise to your
// stimulus set if needed. Built on Smith-Pokorny cones; D65 → origin [0,0,0]. Axes:
// achromatic luminance (L+M), isoluminant red-green (L−M), tritan blue-yellow (S−(L+M)).
//
// Nominal ranges are the sRGB-reachable extent relative to the D65 background (empirical
// over the RGB cube): every SDR color is darker than the adapting white, so
// Ach = Y − 100 ∈ [−100, 0]; the raw (luminance-confounded) difference axes span
// RG ∈ [−31, 0.03] and YV ∈ [0, 98.2].
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

const dkl = { name: 'dkl', range: [[-100, 0], [-31, 0], [0, 99]] };

// Smith-Pokorny cone fundamentals (XYZ -> LMS, L+M = Y)
const M = [0.15514, 0.54312, -0.03286, -0.15514, 0.45684, 0.03286, 0, 0, 0.01608];
const MI = inv3(M);
const [Lw, Mw, Sw] = mat3(M, 95.0456, 100, 108.9058); // D65 cone white

xyz.dkl = (X, Y, Z) => {
	const [L, m, S] = mat3(M, X, Y, Z);
	return [(L + m) - (Lw + Mw), (L - m) - (Lw - Mw), (S - (L + m)) - (Sw - (Lw + Mw))];
};

dkl.xyz = (Ach, RG, YV) => {
	const sum = Ach + (Lw + Mw);       // L + M
	const diff = RG + (Lw - Mw);       // L − M
	const L = (sum + diff) / 2, m = (sum - diff) / 2;
	const S = YV + sum + (Sw - (Lw + Mw));
	return mat3(MI, L, m, S);
};

export default dkl;
