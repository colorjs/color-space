/**
 * DKL color space (Derrington-Krauskopf-Lennie)
 *
 * The cardinal-axis space of human colour vision (Derrington, Krauskopf & Lennie 1984;
 * Brainard 1996) — the three directions the LGN/early visual system encodes, relative
 * to an adapting white (here D65): an achromatic luminance axis (L+M), an isoluminant
 * red-green axis (L−M), and a tritan blue-yellow axis (S−(L+M)). Built on Smith-Pokorny
 * cones; D65 → origin [0,0,0]. (Un-normalised cardinal form; sources differ on axis
 * scaling — normalise to your stimulus set if needed.)
 *
 * @see {@link https://doi.org/10.1113/jphysiol.1984.sp015499} Derrington et al. 1984
 * @channel {Ach} -100 100 Achromatic
 * @channel {RG} -100 100 Red-Green
 * @channel {YV} -100 100 Tritan
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

const dkl = { name: 'dkl', range: [[-100, 100], [-100, 100], [-100, 100]] };

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
