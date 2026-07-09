/**
 * Ostwald — Wilhelm Ostwald's colour system (Die Farbenlehre, 1917-1923), the Nobel
 * laureate chemist's ordering of colour as mixtures of exactly three sensations:
 * white, black, and a "full colour" (Vollfarbe). His full colours are ideal
 * semichromes — optimal colours reflecting 100% over the half-spectrum bounded by a
 * complementary wavelength pair and 0% elsewhere — the most saturated object colours
 * physically possible for their hue. Every colour is then w·White + b·Black +
 * f·FullColour with w+b+f=1, arranged as the famous double cone. The physical atlas
 * died with its licensing, but the ideal system is pure mathematics over the CIE
 * observer, and that is what ships here.
 *
 * @see {@link https://doi.org/10.1364/JOSA.34.000361} Foss 1944, analysis of the ideal Ostwald system
 * @wiki {@link https://en.wikipedia.org/wiki/Ostwald_color_system}
 * @year 1917
 * @by Wilhelm Ostwald
 * @use Historical colour-order system (double cone of white/black/full-colour content); the ideal semichrome construction, kept for study.
 * @channel {h} 0 360 Hue
 * @channel {W} 0 100 White content
 * @channel {B} 0 100 Black content
 * @method system
 * @encoding perceptual
 * @illuminant C
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Full colours are computed at load: for each short-side wavelength λ₁, the
// complementary λ₂ is found on the long arm of the spectral locus (collinearity
// through the illuminant-C white point), and the semichrome integrals
// ∫band CMF·S_C dλ give the band-pass and band-stop (purple) full colours — ~90
// nodes forming a closed polygon of maximal object colours around white. Hue is the
// xy angle around C white; conversion is a ray-polygon intersection (as in
// `coloroid`) plus an exact 2×2 mixture solve, so round-trips are exact. W=100 is
// illuminant-C white (x = 0.3101, y = 0.3162); W=B=0 is the pure full colour.
import xyz from './xyz.js';
import { CMF } from './wavelength.js';

const ostwald = { name: 'ostwald', range: [[0, 360], [0, 100], [0, 100]] };

// CIE illuminant C spectral power, 380-700 nm at 5 nm (CIE 15 dataset)
const SC = [33.0, 39.92, 47.4, 55.17, 63.3, 71.81, 80.6, 89.53, 98.1, 105.8, 112.4, 117.75, 121.5, 123.45, 124.0, 123.6,
	123.1, 123.3, 123.8, 124.09, 123.9, 122.92, 120.7, 116.9, 112.1, 106.98, 102.3, 98.81, 96.9, 96.78, 98.0, 99.94,
	102.1, 103.95, 105.2, 105.67, 105.3, 104.11, 102.3, 100.15, 97.8, 95.43, 93.2, 91.22, 89.7, 88.83, 88.4, 88.19,
	88.1, 88.06, 88.0, 87.86, 87.8, 87.99, 88.2, 88.2, 87.9, 87.22, 86.3, 85.3, 84.0, 82.21, 80.2, 78.24, 76.3];

// cumulative CMF·S_C sums -> band integrals by interpolation
const N = CMF.length;
const cum = [[0, 0, 0]];
for (let i = 1; i < N; i++) cum.push([0, 1, 2].map(k =>
	cum[i - 1][k] + (CMF[i - 1][k + 1] * SC[i - 1] + CMF[i][k + 1] * SC[i]) / 2));
const at = wl => { // cumulative integral at wavelength wl
	const t = Math.min(N - 1.000001, Math.max(0, (wl - 380) / 5)), i = Math.floor(t), f = t - i;
	return [0, 1, 2].map(k => cum[i][k] + f * (cum[i + 1][k] - cum[i][k]));
};
const TOT = cum[N - 1];
const scale = 100 / TOT[1]; // white Y = 100
const W_XYZ = TOT.map(v => v * scale);
const sw = W_XYZ[0] + W_XYZ[1] + W_XYZ[2], wx = W_XYZ[0] / sw, wy = W_XYZ[1] / sw;

const locus = wl => { // spectral chromaticity at wl (5 nm interpolated)
	const t = Math.min(N - 1.000001, Math.max(0, (wl - 380) / 5)), i = Math.floor(t), f = t - i;
	const c = [0, 1, 2].map(k => CMF[i][k + 1] + f * (CMF[i + 1][k + 1] - CMF[i][k + 1]));
	const s = c[0] + c[1] + c[2];
	return [c[0] / s, c[1] / s];
};
// complementary wavelength of λ1 (short arm): collinearity through white on the long arm
const comp = wl1 => {
	const [x1, y1] = locus(wl1), dx = wx - x1, dy = wy - y1;
	const cross = wl2 => { const [x2, y2] = locus(wl2); return dx * (y2 - wy) - dy * (x2 - wx); };
	let lo = 540, hi = 700;
	for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (cross(lo) * cross(m) <= 0) hi = m; else lo = m; }
	return (lo + hi) / 2;
};
// the last λ1 whose complement is still on the locus (comp -> 700)
let l1max = 493;
{
	const [x7, y7] = locus(700);
	const cr = wl1 => { const [x1, y1] = locus(wl1); return (wx - x1) * (y7 - wy) - (wy - y1) * (x7 - wx); };
	let lo = 460, hi = 540;
	for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (cr(lo) * cr(m) <= 0) hi = m; else lo = m; }
	l1max = (lo + hi) / 2;
}

// full-colour polygon: band-pass and band-stop semichromes for each complementary pair
const NODES = [];
for (let i = 0; i <= 45; i++) {
	const l1 = 380 + (l1max - 380) * i / 45, l2 = comp(l1);
	const a = at(l1), b = at(l2);
	const pass = [0, 1, 2].map(k => (b[k] - a[k]) * scale);
	const stop = [0, 1, 2].map(k => W_XYZ[k] - pass[k]);
	for (const F of [pass, stop]) {
		const s = F[0] + F[1] + F[2];
		if (s <= 0) continue;
		NODES.push({ ang: Math.atan2(F[1] / s - wy, F[0] / s - wx), F });
	}
}
NODES.sort((a, b) => a.ang - b.ang);

// interpolated full colour in the hue direction (ux, uy from white): the xy ray-segment
// hit finds the polygon segment; the blend σ then solves the XYZ-space collinearity
// exactly (chromaticity of an XYZ blend is not the blend of chromaticities), so the
// returned F is exactly coplanar with white and the hue ray — round-trips stay exact.
const full = (ux, uy) => {
	for (let i = 0; i < NODES.length; i++) {
		const P = NODES[i].F, Q = NODES[(i + 1) % NODES.length].F;
		const ps = P[0] + P[1] + P[2], qs = Q[0] + Q[1] + Q[2];
		const px = P[0] / ps - wx, py = P[1] / ps - wy;
		const qx = Q[0] / qs - wx, qy = Q[1] / qs - wy;
		const det = ux * -(qy - py) + uy * (qx - px);
		if (det === 0) continue;
		const t = (px * -(qy - py) + py * (qx - px)) / det;
		const s = (ux * py - uy * px) / det;
		if (t > 0 && s >= 0 && s < 1) {
			const D = [Q[0] - P[0], Q[1] - P[1], Q[2] - P[2]], sD = D[0] + D[1] + D[2];
			const c0 = (P[0] - ps * wx) * uy - (P[1] - ps * wy) * ux;
			const c1 = (D[0] - sD * wx) * uy - (D[1] - sD * wy) * ux;
			const sig = c1 === 0 ? s : -c0 / c1;
			return [0, 1, 2].map(k => P[k] + sig * D[k]);
		}
	}
	return NODES[0].F;
};

ostwald.xyz = (h, W, B) => {
	const f = 1 - (W + B) / 100, a = h * Math.PI / 180;
	const F = full(Math.cos(a), Math.sin(a));
	return [0, 1, 2].map(k => (W / 100) * W_XYZ[k] + f * F[k]);
};

xyz.ostwald = (X, Y, Z) => {
	const s = X + Y + Z;
	let ux, uy;
	if (s === 0) { ux = 1; uy = 0; } else { ux = X / s - wx; uy = Y / s - wy; }
	if (ux === 0 && uy === 0) { ux = 1; uy = 0; } // achromatic: any hue, f = 0
	const h = (Math.atan2(uy, ux) * 180 / Math.PI + 360) % 360;
	const F = full(ux, uy);
	// exact mixture solve w'·W_XYZ + f·F = XYZ on the better-conditioned coordinate pair
	const dXY = W_XYZ[0] * F[1] - W_XYZ[1] * F[0], dYZ = W_XYZ[1] * F[2] - W_XYZ[2] * F[1];
	let wp, f;
	if (Math.abs(dXY) >= Math.abs(dYZ)) {
		wp = (X * F[1] - Y * F[0]) / dXY;
		f = (W_XYZ[0] * Y - W_XYZ[1] * X) / dXY;
	} else {
		wp = (Y * F[2] - Z * F[1]) / dYZ;
		f = (W_XYZ[1] * Z - W_XYZ[2] * Y) / dYZ;
	}
	return [h, wp * 100, 100 * (1 - wp - f)];
};

export default ostwald;
