/**
 * Maxwell triangle — the barycentric chromaticity diagram for a trichromatic
 * observer. Three receptor catches are normalized to sum to one, then placed at
 * the vertices of an equilateral triangle. It is used across comparative vision:
 * human LMS catches, bee UV/blue/green catches, or any other trichromatic visual
 * phenotype share the same geometry once their observer-specific catches exist.
 * This graph node is anchored to the library's fixed human LMS cone space;
 * species-relative spectral receptor models require external context and are out of scope.
 *
 * @see {@link https://doi.org/10.1017/S1464793102005985} Kelber, Vorobyev & Osorio 2003
 * @see {@link https://github.com/rmaia/pavo/blob/master/R/trispace.R} pavo trispace
 * @wiki {@link https://en.wikipedia.org/wiki/Maxwell_disc#Maxwell_color_triangle}
 * @year 1860
 * @by James Clerk Maxwell
 * @use Trichromatic receptor-catch chromaticity for comparative and biological vision; human-LMS form in the universal graph.
 * @channel {x} -0.7071067811865476 0.7071067811865476 Horizontal opponent coordinate
 * @channel {y} -0.4082482904638631 0.8164965809277261 Vertical opponent coordinate
 * @method chromaticity
 * @encoding chromaticity
 * @observer 2
 * @referred display
 * @loss projective Receptor magnitude is discarded; the inverse reconstructs LMS catches with sum=100.
 * @dynamic sdr
 */
import lms from './lms.js';

const maxwell = {
	name: 'maxwell',
	range: [[-0.7071067811865476, 0.7071067811865476], [-0.4082482904638631, 0.8164965809277261]]
};

// pavo vertex order: S at top, M bottom-left, L bottom-right.
lms.maxwell = (L, M, S) => {
	const sum = S + M + L;
	if (sum === 0) return [0, 0];
	S /= sum; M /= sum; L /= sum;
	return [(L - M) / Math.sqrt(2), S * Math.sqrt(2 / 3) - (M + L) / Math.sqrt(6)];
};

// Barycentric inverse, choosing the conventional catch magnitude L+M+S=100.
maxwell.lms = (x, y) => {
	const S = (y + 1 / Math.sqrt(6)) / Math.sqrt(3 / 2);
	const rem = 1 - S, diff = x * Math.sqrt(2);
	return [50 * (rem + diff), 50 * (rem - diff), 100 * S];
};

export default maxwell;
