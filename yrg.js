/**
 * Yrg — Richard Kirk's 2019 luminance/chromaticity space, built at FilmLight on CIE 2006
 * cone fundamentals and tuned so that hues land at even spacing around the wheel,
 * matching the classical Munsell color order. Y carries cone-weighted luminance while r
 * and g are chromaticity coordinates derived affinely from the cone responses,
 * separating "how bright" from "what hue and how saturated" in a way suited to color
 * grading. It's the chromaticity basis of darktable's color-balance module.
 *
 * @see {@link https://doi.org/10.2352/issn.2169-2629.2019.27.38} Kirk 2019
 * @year 2019
 * @by Richard Kirk
 * @use Luminance/chromaticity space for color grading, basis of darktable's color-balance module; current, niche.
 * @channel {Y} 0 1.06 Luminance
 * @channel {r} 0.02 0.64 Red chromaticity
 * @channel {g} 0.21 0.78 Green chromaticity
 * @method chromaticity
 * @encoding linear
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// The inverse here solves the affine map exactly (Kirk's published inverse uses rounded
// coefficients); black maps to the r,g origin offsets.
//
// Nominal ranges are the sRGB gamut extent (empirical: Y ≤ 1.058 at white — Kirk's
// cone-fundamental luminance is not normalised to CIE Y; chromaticities span
// r ∈ [0.028, 0.638], g ∈ [0.214, 0.775] between the primaries). Pure black has no
// chromaticity and carries the affine origin (r, g) = (0.0206, −0.0515), just outside.
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

const yrg = { name: 'yrg', range: [[0, 1.06], [0.02, 0.64], [0.21, 0.78]] };

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
