/**
 * CIE DSH — dominant wavelength / saturation (excitation purity) / hue
 *
 * Helmholtz coordinates of CIE 1931 xy chromaticity: a polar representation where
 * the dominant wavelength is the hue analog (so DSH's "H" IS the dominant wavelength
 * `d` — they are the same coordinate) and excitation purity is the saturation analog.
 * The third stored channel is luminance Y, making the transform an invertible wrapped
 * xyY. Negative `d` is a complementary wavelength: non-spectral purples have no
 * dominant wavelength, so the line from white is reversed onto the opposite locus arc.
 *
 * Forward intersects the ray (D65 white -> colour) with the CIE 1931 2° spectral
 * locus (embedded at 5 nm; finer sampling shifts the wavelength by <0.1 nm). Inverse
 * is exact: colour = white + purity·(locus(d) - white).
 *
 * @see {@link https://en.wikipedia.org/wiki/Dominant_wavelength}
 * @see {@link https://cie.co.at/publications/colorimetry-4th-edition} CIE 15:2004
 * @channel {d} -700 700 Dominant wavelength (nm; negative = complementary/purple)
 * @channel {s} 0 1 Excitation purity
 * @channel {Y} 0 100 Luminance (CIE Y)
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyy from './xyy.js';

const dsh = { name: 'dsh' };

// D65 2° white chromaticity (matches the library's XYZ D65 convention)
const Wx = 0.31270, Wy = 0.32900;

// CIE 1931 2° spectral locus xy, 360-700 nm at 5 nm (CVRL ciexyz31.csv -> x/(x+y+z))
const LOCUS = [
	[360, 0.17556, 0.00529], [365, 0.17516, 0.00526], [370, 0.17482, 0.00522], [375, 0.17451, 0.00518], [380, 0.17411, 0.00496],
	[385, 0.17401, 0.00498], [390, 0.1738, 0.00492], [395, 0.17356, 0.00492], [400, 0.17334, 0.0048], [405, 0.17302, 0.00478],
	[410, 0.17258, 0.0048], [415, 0.17209, 0.00483], [420, 0.17141, 0.0051], [425, 0.1703, 0.00579], [430, 0.16888, 0.0069],
	[435, 0.1669, 0.00856], [440, 0.16441, 0.01086], [445, 0.1611, 0.01379], [450, 0.15664, 0.0177], [455, 0.15099, 0.02274],
	[460, 0.14396, 0.0297], [465, 0.1355, 0.03988], [470, 0.12412, 0.0578], [475, 0.10959, 0.08684], [480, 0.09129, 0.1327],
	[485, 0.06871, 0.20072], [490, 0.04539, 0.29498], [495, 0.02346, 0.4127], [500, 0.00817, 0.53842], [505, 0.00386, 0.65482],
	[510, 0.01387, 0.75019], [515, 0.03885, 0.81202], [520, 0.0743, 0.8338], [525, 0.11416, 0.82621], [530, 0.15472, 0.80586],
	[535, 0.19288, 0.78163], [540, 0.22962, 0.75433], [545, 0.26578, 0.72432], [550, 0.3016, 0.69231], [555, 0.33736, 0.65885],
	[560, 0.3731, 0.62445], [565, 0.40874, 0.58961], [570, 0.44406, 0.55471], [575, 0.47877, 0.5202], [580, 0.51249, 0.48659],
	[585, 0.54479, 0.45443], [590, 0.57515, 0.42423], [595, 0.60293, 0.3965], [600, 0.62704, 0.37249], [605, 0.64823, 0.35139],
	[610, 0.66576, 0.33401], [615, 0.68008, 0.31975], [620, 0.6915, 0.30834], [625, 0.70061, 0.2993], [630, 0.70792, 0.29203],
	[635, 0.71403, 0.28593], [640, 0.71903, 0.28093], [645, 0.72303, 0.27695], [650, 0.72599, 0.27401], [655, 0.72827, 0.27173],
	[660, 0.72997, 0.27003], [665, 0.73109, 0.26891], [670, 0.73199, 0.26801], [675, 0.73272, 0.26728], [680, 0.73342, 0.26658],
	[685, 0.73405, 0.26595], [690, 0.73439, 0.26561], [695, 0.73459, 0.26541], [700, 0.73469, 0.26531]
];
const N = LOCUS.length;

// segment i of the closed boundary: spectral arc (i<N-1) or the line of purples (i=N-1)
const segA = (i) => LOCUS[i];
const segB = (i) => i < N - 1 ? LOCUS[i + 1] : LOCUS[0];

// nearest t>0 hit of ray (white + t·dir) with the boundary; returns {i,u,px,py}
const cast = (dx, dy) => {
	let best = null;
	for (let i = 0; i < N; i++) {
		const A = segA(i), B = segB(i);
		const ex = B[1] - A[1], ey = B[2] - A[2];
		const denom = dx * ey - dy * ex;
		if (Math.abs(denom) < 1e-15) continue;
		const fx = A[1] - Wx, fy = A[2] - Wy;
		const t = (fx * ey - fy * ex) / denom;
		const u = (fx * dy - fy * dx) / denom;
		if (t > 1e-9 && u >= -1e-9 && u <= 1 + 1e-9 && (!best || t < best.t))
			best = { i, t, u, px: Wx + t * dx, py: Wy + t * dy };
	}
	return best;
};

// spectral locus xy at wavelength wl (linear interpolation between 5 nm samples)
const locusAt = (wl) => {
	if (wl <= LOCUS[0][0]) return [LOCUS[0][1], LOCUS[0][2]];
	if (wl >= LOCUS[N - 1][0]) return [LOCUS[N - 1][1], LOCUS[N - 1][2]];
	for (let i = 0; i < N - 1; i++) {
		if (wl >= LOCUS[i][0] && wl <= LOCUS[i + 1][0]) {
			const f = (wl - LOCUS[i][0]) / (LOCUS[i + 1][0] - LOCUS[i][0]);
			return [LOCUS[i][1] + f * (LOCUS[i + 1][1] - LOCUS[i][1]), LOCUS[i][2] + f * (LOCUS[i + 1][2] - LOCUS[i][2])];
		}
	}
};

/**
 * xyY -> DSH: dominant wavelength, excitation purity, luminance
 */
xyy.dsh = (x, y, Y) => {
	const dx = x - Wx, dy = y - Wy;
	const mag = Math.hypot(dx, dy);
	if (mag < 1e-10) return [0, 0, Y]; // achromatic: no hue, zero purity

	const fwd = cast(dx, dy);
	if (!fwd) return [NaN, NaN, Y];

	if (fwd.i === N - 1) {
		// hit the line of purples -> complementary wavelength on the opposite arc
		const bwd = cast(-dx, -dy);
		const A = segA(bwd.i), B = segB(bwd.i);
		const wl = A[0] + bwd.u * (B[0] - A[0]);
		return [-wl, mag / Math.hypot(fwd.px - Wx, fwd.py - Wy), Y];
	}
	const A = segA(fwd.i), B = segB(fwd.i);
	const wl = A[0] + fwd.u * (B[0] - A[0]);
	return [wl, mag / Math.hypot(fwd.px - Wx, fwd.py - Wy), Y];
};

/**
 * DSH -> xyY (exact): colour lies at purity·(locus - white) from white
 */
dsh.xyy = (d, s, Y) => {
	if (s === 0 || d === 0) return [Wx, Wy, Y];
	if (d > 0) {
		const [lx, ly] = locusAt(d);
		return [Wx + s * (lx - Wx), Wy + s * (ly - Wy), Y];
	}
	// purple: cast from white away from the complementary point onto the line of purples
	const [cx, cy] = locusAt(-d);
	const hit = cast(Wx - cx, Wy - cy);
	return [Wx + s * (hit.px - Wx), Wy + s * (hit.py - Wy), Y];
};

export default dsh;
