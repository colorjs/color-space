/**
 * HSM color space (Hue, Saturation, Mixture)
 *
 * Bianconi et al. (2009), "A New Color Space for Skin Color Detection",
 * Revista de Informática Teórica e Aplicada 16(2). Mixture M is the luminance-
 * weighted mean (4R+2G+B)/7; saturation is the chromatic distance normalised by
 * D(M), the maximum reachable chromatic distance at that mixture.
 *
 * @see {@link http://seer.ufrgs.br/rita/article/viewFile/rita_v16_n2_p141/7428}
 * @channel {H} 0 360 Hue
 * @channel {S} 0 100 Saturation
 * @channel {M} 0 100 Mixture
 * @referred display
 * @dynamic sdr
 */
import rgb from './rgb.js';

const hsm = {
	name: 'hsm',
	range: [[0, 360], [0, 100], [0, 100]]
};

export default hsm;

// Orthonormal basis of the chrominance plane 4(r-m)+2(g-m)+(b-m)=0:
// u = (3,-4,-4)/√41 (hue reference), v = n×u = (-4,19,-22)/√861, n=(4,2,1)/√21.
const SQRT41 = Math.sqrt(41), SQRT861 = Math.sqrt(861);
const U = [3 / SQRT41, -4 / SQRT41, -4 / SQRT41];
const V = [-4 / SQRT861, 19 / SQRT861, -22 / SQRT861];

// D(m): max distance from [m,m,m] to the isomixture plane 4r+2g+b=7m within the
// unit cube — the max over the 12 axis-aligned cube edges of their plane crossing.
// This is what bounds S to [0,100] (the old 6-segment form used wrong vertices).
function D(m) {
	if (m <= 0 || m >= 1) return 0;
	let max = 0, d, t;
	// R-axis edges (4r = 7m - 2g - b)
	if (m <= 4 / 7) { t = 7 * m / 4; d = Math.hypot(t - m, m, m); if (d > max) max = d; }
	if (m >= 1 / 7 && m <= 5 / 7) { t = (7 * m - 1) / 4; d = Math.hypot(t - m, m, 1 - m); if (d > max) max = d; }
	if (m >= 2 / 7 && m <= 6 / 7) { t = (7 * m - 2) / 4; d = Math.hypot(t - m, 1 - m, m); if (d > max) max = d; }
	if (m >= 3 / 7) { t = (7 * m - 3) / 4; d = Math.hypot(t - m, 1 - m, 1 - m); if (d > max) max = d; }
	// G-axis edges (2g = 7m - 4r - b)
	if (m <= 2 / 7) { t = 7 * m / 2; d = Math.hypot(m, t - m, m); if (d > max) max = d; }
	if (m >= 1 / 7 && m <= 3 / 7) { t = (7 * m - 1) / 2; d = Math.hypot(m, t - m, 1 - m); if (d > max) max = d; }
	if (m >= 4 / 7 && m <= 6 / 7) { t = (7 * m - 4) / 2; d = Math.hypot(1 - m, t - m, m); if (d > max) max = d; }
	if (m >= 5 / 7) { t = (7 * m - 5) / 2; d = Math.hypot(1 - m, t - m, 1 - m); if (d > max) max = d; }
	// B-axis edges (b = 7m - 4r - 2g)
	if (m <= 1 / 7) { t = 7 * m; d = Math.hypot(m, m, t - m); if (d > max) max = d; }
	if (m >= 2 / 7 && m <= 3 / 7) { t = 7 * m - 2; d = Math.hypot(m, 1 - m, t - m); if (d > max) max = d; }
	if (m >= 4 / 7 && m <= 5 / 7) { t = 7 * m - 4; d = Math.hypot(1 - m, m, t - m); if (d > max) max = d; }
	if (m >= 6 / 7) { t = 7 * m - 6; d = Math.hypot(1 - m, 1 - m, t - m); if (d > max) max = d; }
	return max;
}

rgb.hsm = function (r, g, b) {
	r /= 255; g /= 255; b /= 255;
	const m = (4 * r + 2 * g + b) / 7;
	const dr = r - m, dg = g - m, db = b - m;
	const d = Math.sqrt(dr * dr + dg * dg + db * db);
	const theta = d < 1e-12 ? 0 : Math.acos(Math.max(-1, Math.min(1, (3 * dr - 4 * dg - 4 * db) / (SQRT41 * d))));
	const h = b <= g ? theta / (2 * Math.PI) : 1 - theta / (2 * Math.PI);
	const Dm = D(m);
	const s = Dm < 1e-12 ? 0 : d / Dm;
	return [h * 360, s * 100, m * 100];
};

hsm.rgb = function (h, s, m) {
	h /= 360; s /= 100; m /= 100;
	const R = s * D(m);
	const cosT = Math.cos(2 * Math.PI * h), sinT = Math.sin(2 * Math.PI * h);
	const r = Math.max(0, Math.min(1, m + R * (U[0] * cosT + V[0] * sinT)));
	const g = Math.max(0, Math.min(1, m + R * (U[1] * cosT + V[1] * sinT)));
	const b = Math.max(0, Math.min(1, m + R * (U[2] * cosT + V[2] * sinT)));
	return [r * 255, g * 255, b * 255];
};
