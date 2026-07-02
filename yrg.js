/**
 * Yrg color space (Kirk 2019)
 *
 * Richard Kirk's (FilmLight) luminance/chromaticity space on CIE 2006 LMS cones with
 * evenly-spaced Munsell hues — the chromaticity basis of darktable's colour-balance
 * UCS. Y is cone-weighted luminance; r,g are affine cone chromaticities. The inverse
 * here solves the affine map exactly (Kirk's published inverse uses rounded
 * coefficients); black maps to the r,g origin offsets.
 *
 * @see {@link https://doi.org/10.2352/issn.2169-2629.2019.27.38} Kirk 2019
 * @channel {Y} 0 1 Luminance
 * @channel {r} 0 1 Red chromaticity
 * @channel {g} 0 1 Green chromaticity
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

const yrg = { name: 'yrg', range: [[0, 1], [0, 1], [0, 1]] };

// XYZ -> LMS, CIE 2006 (Kirk 2019)
const M = [0.257085, 0.859943, -0.031061, -0.394427, 1.175800, 0.106423, 0.064856, -0.076250, 0.559067];
const MI = inv3(M);
const kL = 0.68990272, kM = 0.34832189;
const det = 1.0671 * 1.7182 - 0.6873 * 0.0362; // affine chromaticity map determinant

xyz.yrg = (x, y, z) => {
	const [L, m, S] = mat3(M, x / 100, y / 100, z / 100);
	const a = L + m + S;
	const l = a ? L / a : 0, mm = a ? m / a : 0;
	return [kL * L + kM * m, 1.0671 * l - 0.6873 * mm + 0.02062, -0.0362 * l + 1.7182 * mm - 0.05155];
};

yrg.xyz = (Y, r, g) => {
	const l = (1.7182 * (r - 0.02062) + 0.6873 * (g + 0.05155)) / det;
	const mm = (0.0362 * (r - 0.02062) + 1.0671 * (g + 0.05155)) / det;
	const d = kL * l + kM * mm;
	const a = d ? Y / d : 0;
	return mat3(MI, l * a, mm * a, (1 - l - mm) * a).map(v => v * 100);
};

export default yrg;
