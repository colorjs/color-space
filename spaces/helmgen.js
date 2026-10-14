/**
 * HelmGen is the generation space (GenSpace) of Helmlab, published by Görkem Yıldız in
 * 2026 for UI design systems. It keeps Oklab's shape (cone-like LMS, a compressive
 * transfer, an opponent matrix) but swaps the cube root for a depressed cubic
 * y³ + αy = x, whose finite slope at zero removes the dark-end cusp singularities, then
 * adds a mild chroma power, a piecewise lightness correction and a lightness-gated hue
 * twist in the blues that keeps a blue-to-white gradient sky blue instead of lavender.
 * Fit to gradient benchmarks rather than color-difference data; its sibling MetricSpace
 * takes that role.
 *
 * @see {@link https://arxiv.org/abs/2602.23010}
 * @year 2026
 * @by Görkem Yıldız
 * @use Gradients, palettes and color-mix in design systems; new, shipped in Color.js 0.7.
 * @channel {L} 0 1 Lightness
 * @channel {a} -0.6 0.6 Green-Red axis
 * @channel {b} -0.6 0.6 Blue-Yellow axis
 * @method opponent
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Constants are helmlab 1.0.0's GenSpace (npm, MIT; = Color.js 0.7.1 helmgen, v0.11.1).
// Helmlab's XYZ white is ASTM E308 D65 [95.047, 100, 108.883]; the library's D65 differs
// by ~1e-5, so M1 folds in the Bradford step between them, as Color.js bakes it.
// Pipeline: XYZ → M1 → depressed cubic (inputs clamped at 0) → snap near-neutrals to the
// exact gray axis → M2 → C^0.978 → piecewise-linear L → Gaussian hue twist around
// h = 264.5°, gated by sin²(π·t) over L 0.37–1. Ranges: a/b ±0.6 and C 0.65 hold the
// Rec.2020 cube (measured |a|,|b| ≤ 0.54, C ≤ 0.64), as Color.js declares.
import xyz, { bradfordAdaptation } from './xyz.js';
import { mat3, mul3, inv3 } from '../util.js';

const helmgen = { name: 'helmgen', range: [[0, 1], [-0.6, 0.6], [-0.6, 0.6]] };

const M1 = mul3([
	0.8154374735648701, 0.3603221491264266, -0.12432703417946676,
	0.03298391207546648, 0.9292940788255503, 0.03614494665290377,
	0.048184113668356454, 0.26427748135788043, 0.6336388271114471
], bradfordAdaptation([95.04559270516717, 100, 108.90577507598783], [95.047, 100, 108.883]));
const M1_INV = inv3(M1);
const M2 = [
	0.21193779684470104, 0.7992121834263127, -0.00410075161564345,
	2.4672018828033475, -2.9877348024830788, 0.520532919679731,
	-0.11390787868068575, 1.3932982808117473, -1.279390402131062
];
const M2_INV = inv3(M2);

// depressed cubic y³ + αy = x: Cardano's real root in hyperbolic form, one Halley step
const ALPHA = 0.021, S = Math.sqrt(ALPHA / 3);
const cubic = (x) => {
	let y = 2 * S * Math.sinh(Math.asinh(x / (2 * S * S * S)) / 3);
	const f = y * y * y + ALPHA * y - x, d = 3 * y * y + ALPHA, d2 = 6 * y, q = 2 * d * d - f * d2;
	if (Math.abs(q) > 1e-30) y -= 2 * f * d / q;
	return y;
};

// pulls a triplet whose spread is ≲1e-5 of its mean onto the exact gray axis (a = b = 0)
const neutral = (v) => {
	const m = (v[0] + v[1] + v[2]) / 3, s = (Math.max(v[0], v[1], v[2]) - Math.min(v[0], v[1], v[2])) / Math.max(Math.abs(m), 1e-30);
	const w = Math.exp(-((s / 1e-5) ** 2));
	return [v[0] + w * (m - v[0]), v[1] + w * (m - v[1]), v[2] + w * (m - v[2])];
};

const CP = 0.978;
const chroma = (a, b, p) => {
	const C = Math.sqrt(a * a + b * b);
	if (C <= 1e-12) return [a, b];
	const k = C ** p / C;
	return [a * k, b * k];
};

// lightness: 21 nodes at L = 0, 0.05, …, 1
const PW = [0, 0.009494013522189627, 0.02564569838030986, 0.055259661658689105, 0.10574901531227408,
	0.16055853320726027, 0.21405964892993756, 0.26786230508811226, 0.3220435246104499, 0.3739052098520243,
	0.43020997780918835, 0.4835465162128873, 0.5399824670411353, 0.5956710081330342, 0.6542161666450478,
	0.7115380216519989, 0.7702762412711669, 0.8293313467712837, 0.889406386197059, 0.9462829573474728, 1];
const lFwd = (L) => {
	if (L <= 0 || L >= 1) return L;
	const i = Math.min(Math.floor(L * 20), 19), t = L * 20 - i;
	return PW[i] + t * (PW[i + 1] - PW[i]);
};
const lInv = (L) => {
	if (L <= 0 || L >= 1) return L;
	let i = 0;
	while (i < 19 && PW[i + 1] <= L) i++;
	return (i + (L - PW[i]) / (PW[i + 1] - PW[i])) / 20;
};

// hue twist: h + AMP·gate(L)·gauss(h − 264.5°)
const AMP = 0.058, CENTER = 264.5 * Math.PI / 180, SIGMA = 0.7, LLO = 0.37, LHI = 1;
const gate = (L) => Math.sin(Math.PI * Math.max(0, Math.min(1, (L - LLO) / (LHI - LLO)))) ** 2;
const wrap = (d) => d - Math.round(d / (2 * Math.PI)) * 2 * Math.PI;
const twist = (L, a, b, inv) => {
	const C = Math.sqrt(a * a + b * b), t = gate(L), g = AMP * t;
	if (C < 1e-12 || t < 1e-12) return [a, b];
	const h0 = Math.atan2(b, a);
	let h = h0;
	if (!inv) h += g * Math.exp(-0.5 * (wrap(h - CENTER) / SIGMA) ** 2);
	// inverse: solve h + g·gauss(h) = h0 by Halley's method
	else for (let i = 0; i < 8; i++) {
		const d = wrap(h - CENTER), e = g * Math.exp(-0.5 * (d / SIGMA) ** 2), s2 = SIGMA * SIGMA;
		const F = h + e - h0, F1 = 1 - e * d / s2, F2 = e * (d * d / s2 - 1) / s2, q = 2 * F1 * F1 - F * F2;
		if (Math.abs(q) > 1e-30) h -= 2 * F * F1 / q;
	}
	return [C * Math.cos(h), C * Math.sin(h)];
};

// XYZ (0-100) -> HelmGen Lab
xyz.helmgen = (X, Y, Z) => {
	const [l, m, s] = mat3(M1, X / 100, Y / 100, Z / 100);
	const c = neutral([cubic(Math.max(l, 0)), cubic(Math.max(m, 0)), cubic(Math.max(s, 0))]);
	let [L, a, b] = mat3(M2, c[0], c[1], c[2]);
	[a, b] = chroma(a, b, CP);
	L = lFwd(L);
	[a, b] = twist(L, a, b, false);
	return [L, a, b];
};

// HelmGen Lab -> XYZ (0-100)
helmgen.xyz = (L, a, b) => {
	[a, b] = twist(L, a, b, true);
	[a, b] = chroma(a, b, 1 / CP);
	const c = neutral(mat3(M2_INV, lInv(L), a, b));
	const [x, y, z] = mat3(M1_INV, c[0] ** 3 + ALPHA * c[0], c[1] ** 3 + ALPHA * c[1], c[2] ** 3 + ALPHA * c[2]);
	return [x * 100, y * 100, z * 100];
};

export default helmgen;
