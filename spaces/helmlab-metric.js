/**
 * Helmlab MetricSpace is the color-difference space of Helmlab, published by Görkem Yıldız
 * in 2026 beside its generation sibling HelmGen. It starts as Oklab does (cone-like LMS, a
 * power per cone, an opponent matrix), then adds hue-dependent corrections fit jointly to
 * 3,813 judged color pairs (COMBVD): a Fourier hue rotation, a Helmholtz–Kohlrausch boost
 * that lifts the lightness of vivid colors, lightness and chroma rescalings, a neutral
 * correction that puts grays on a = b = 0, and a −28.2° turn of the a,b plane. White sits
 * at L ≈ 1.12, and vivid colors reach higher still.
 *
 * @see {@link https://arxiv.org/abs/2602.23010}
 * @year 2026
 * @by Görkem Yıldız
 * @use Color-difference research and Helmlab's ΔE; shipped in Color.js 0.7 without the neutral correction.
 * @channel {L} 0 1.6 Lightness
 * @channel {a} -1.5 1.5 Green-Red axis
 * @channel {b} -1.5 1.5 Blue-Yellow axis
 * @method opponent
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Parameters are helmlab 1.0.0's MetricSpace v21 (npm/PyPI, MIT; params.json, 72 trained
// values), as the paper's eleven stages: XYZ → M1 → signed power per cone → M2 → hue
// rotation δ(h) → H-K boost → cubic L → dark-L → chroma ×S(h) → C^p(h) → chroma ×T(L) →
// chroma ×HLC(h, L) → L ×exp(g(h)) → neutral correction → rotation by −28.2°.
// Helmlab's XYZ white is ASTM E308 D65 [95.047, 100, 108.883]; M1 folds in the Bradford
// step from the library's D65, as Color.js does. The neutral correction subtracts the a,b
// that grays reach after stage 9, read from a PCHIP curve over L through helmlab 1.0.0's
// gray ramp (Y = 0, 0.001…0.01, 0.01…0.1, 0.1…2, held flat past its last gray, L 1.34, to
// L 2.59; the paper describes 384 levels to Y 2.59, see docs/errata.md), rebuilt here from
// the pipeline itself rather than shipped as data; it matches the author's neutral-lut.json
// to its 12 printed decimals. Grays keep under 3.4e-5 of
// chroma from 10/255 up, 6.3e-4 at 1/255, below the ramp's first step. Helmlab applies the
// correction to the coordinates it reports (its Helmlab class; the paper's authoring
// setting) and removes it inside its ΔE. Color.js 0.7.1 and coloraide 8.13 leave it out,
// so their a,b differ from these by that offset (≈0.29 at mid gray) and agree otherwise
// to 1e-12. Newton counts (15, 12, 8) are the author's. Ranges as Color.js declares them:
// L 0–1.6 holds Display P3 (to 1.56; Rec.2020 reaches 2.16), a/b ±1.5 hold Rec.2020
// (measured −0.61…1.08).
import xyz, { bradfordAdaptation } from './xyz.js';
import { mat3, mul3, inv3, spow } from '../math.js';

const helmlabMetric = { name: 'helmlab-metric', range: [[0, 1.6], [-1.5, 1.5], [-1.5, 1.5]] };

const W = [95.04559270516717, 100, 108.90577507598783]; // the library's D65
const M1 = mul3([
	0.7212986433113499, 0.45344826541531813, -0.19288975751942616,
	-0.788211869495579, 1.795241376757236, 0.0876172451181785,
	-0.0917700599912156, 0.45765588659459255, 1.2922045513917677
], bradfordAdaptation(W, [95.047, 100, 108.883]));
const M1_INV = inv3(M1);
const M2 = [
	-0.26355622180094096, 0.4168322883703174, 0.4926763141656403,
	1.8897570508777322, -3.1212232034205774, 1.0421666921060384,
	0.3585108617962056, 1.7694028193790368, -1.4120626067695372
];
const M2_INV = inv3(M2);
const G = [0.47229813098762524, 0.5149184096354483, 0.5113233386366979];

// Fourier series Σ c_k·cos(kh) + s_k·sin(kh) over [[c1, s1], [c2, s2], …], and its derivative
const four = (h, k) => k.reduce((s, [c, n], i) => s + c * Math.cos((i + 1) * h) + n * Math.sin((i + 1) * h), 0);
const dfour = (h, k) => k.reduce((s, [c, n], i) => s - (i + 1) * c * Math.sin((i + 1) * h) + (i + 1) * n * Math.cos((i + 1) * h), 0);
const HUE = [[-0.02833024015436984, -0.21131429516166544], [0.2189784817615645, -0.06871898981942523], [0.005506053349515315, -0.0641329861299175], [-0.053592461436994296, -0.00954137464208059]];
const HK = [[0.7173169828841472, 0.6915224124600773], [0.48647127559605596, 0.9853124591201782]], HKW = 0.2676231133101982, HKP = 0.8934892185255707;
const LC = [0.5385456675962418, 0.12508858146241716, 0.6768950256217603], LH = [[-0.4963251525324449, -0.09564696283240552]];
const DARK = -0.029053748937210654, DH = [[1.3346761652952872, -0.1698908144723919]];
const CS = [[-0.195370576218515, 0.5330819227283227], [0.08863325582067766, 0.9365540137751136], [0.13789738139719568, 0.061650260197979936], [0.0641970862504494, -0.027401052793571013]];
const CP = [[-0.09900209889026965, 0.059635520647228726], [-0.013586499967803128, 0.2253393118474472]];
const LC1 = -1.5239477450767043, LC2 = -1.751157310240011;
const HLC = [[-0.43576378069144767, 1.060094063845983], [0.47931193034584496, -0.2622579649434462]];
const HL = [[0.13610794232685908, 0.1168702235362288], [-0.01617739641422492, 0.038145638815030566]];
const PHI = -28.2 * Math.PI / 180, RC = Math.cos(PHI), RS = Math.sin(PHI);

const clamp30 = (x) => Math.min(Math.max(x, -30), 30);
const hk = (a, b) => { const h = Math.atan2(b, a); return HKW * Math.sqrt(a * a + b * b) ** HKP * (1 + four(h, HK)); };
const lcorr = (L, h) => { const t = L * (1 - L); return L + LC[0] * t + LC[1] * t * (0.5 - L) + LC[2] * t * t + t * four(h, LH); };
const dark = (L, h) => { const o = L < 1 ? 1 - L : 0; return L * Math.exp(clamp30((DARK + four(h, DH)) * L * o * o)); };
const tL = (L) => Math.exp(clamp30(LC1 * (L - 0.5) + LC2 * (L - 0.5) ** 2));
const hlc = (h, L) => Math.exp(clamp30((L - 0.5) * four(h, HLC)));
const cpow = (a, b, inv) => {
	const h = Math.atan2(b, a), C = Math.sqrt(a * a + b * b), p = 1 + four(h, CP);
	const Cn = C > 0 ? C ** (inv ? 1 / p : p) : 0;
	return [Cn * Math.cos(h), Cn * Math.sin(h)];
};

// stages 1-9: XYZ (0-1) -> a,b before the neutral correction and the rotation
const raw = (X, Y, Z) => {
	const [l, m, s] = mat3(M1, X, Y, Z);
	let [L, a, b] = mat3(M2, spow(l, G[0]), spow(m, G[1]), spow(s, G[2]));
	const h0 = Math.atan2(b, a), C = Math.sqrt(a * a + b * b), hn = h0 + four(h0, HUE);
	a = C * Math.cos(hn), b = C * Math.sin(hn);
	const h = Math.atan2(b, a);
	L = dark(lcorr(L + hk(a, b), h), h);
	const cs = Math.exp(four(h, CS));
	[a, b] = cpow(a * cs, b * cs, false);
	const T = tL(L);
	a *= T, b *= T;
	const S = hlc(Math.atan2(b, a), L);
	a *= S, b *= S;
	return [L * Math.exp(four(Math.atan2(b, a), HL)), a, b];
};

// neutral correction: a,b of the gray ramp after stage 9, PCHIP over L (scipy's Fritsch–Carlson
// derivatives and one-sided ends), held flat beyond the knots
const linspace = (a, b, n) => Array.from({ length: n }, (_, i) => i === n - 1 ? b : a + i * ((b - a) / (n - 1)));
const ramp = [0, ...linspace(0.001, 0.01, 10), ...linspace(0.01, 0.1, 20), ...linspace(0.1, 2, 226)]
	.map((Y) => raw(Y * W[0] / 100, Y, Y * W[2] / 100)).sort((p, q) => p[0] - q[0])
	.filter((p, i, s) => i === 0 || p[0] - s[i - 1][0] > 1e-12);
const [Lt, at, bt] = ramp[ramp.length - 1];
ramp.push([Lt + 0.01, at, bt], [Lt + 0.02, at, bt], [2.59, at, bt]);
const pchip = (x, y) => {
	const n = x.length, h = [], m = [], d = new Array(n).fill(0);
	for (let i = 0; i < n - 1; i++) h[i] = x[i + 1] - x[i], m[i] = (y[i + 1] - y[i]) / h[i];
	for (let i = 1; i < n - 1; i++) if (Math.sign(m[i - 1]) === Math.sign(m[i]) && m[i - 1] !== 0 && m[i] !== 0) {
		const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1];
		d[i] = (w1 + w2) / (w1 / m[i - 1] + w2 / m[i]);
	}
	const end = (h0, h1, m0, m1) => {
		const e = ((2 * h0 + h1) * m0 - h0 * m1) / (h0 + h1);
		return Math.sign(e) !== Math.sign(m0) ? 0 : Math.sign(m0) !== Math.sign(m1) && Math.abs(e) > 3 * Math.abs(m0) ? 3 * m0 : e;
	};
	d[0] = end(h[0], h[1], m[0], m[1]), d[n - 1] = end(h[n - 2], h[n - 3], m[n - 2], m[n - 3]);
	return d;
};
const kL = ramp.map((p) => p[0]), ka = ramp.map((p) => p[1]), kb = ramp.map((p) => p[2]);
/** the neutral-correction knots: L, gray a, gray b and their PCHIP slopes (the GL chunk embeds them) */
export const neutral = { L: kL, a: ka, b: kb, da: pchip(kL, ka), db: pchip(kL, kb) };
const offset = (L) => {
	const { L: x, a, b, da, db } = neutral, n = x.length;
	if (L <= x[0]) return [a[0], b[0]];
	if (L >= x[n - 1]) return [a[n - 1], b[n - 1]];
	let lo = 0, hi = n - 1;
	while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (x[mid] <= L) lo = mid; else hi = mid; }
	const w = x[lo + 1] - x[lo], t = (L - x[lo]) / w, t2 = t * t, t3 = t2 * t;
	const herm = (y, d) => y[lo] * (2 * t3 - 3 * t2 + 1) + w * d[lo] * (t3 - 2 * t2 + t) + y[lo + 1] * (-2 * t3 + 3 * t2) + w * d[lo + 1] * (t3 - t2);
	return [herm(a, da), herm(b, db)];
};

// XYZ (0-100) -> Helmlab MetricSpace Lab
xyz['helmlab-metric'] = (X, Y, Z) => {
	let [L, a, b] = raw(X / 100, Y / 100, Z / 100);
	const [ea, eb] = offset(L);
	a -= ea, b -= eb;
	return [L, a * RC - b * RS, a * RS + b * RC];
};

// Helmlab MetricSpace Lab -> XYZ (0-100): each stage undone in reverse, the L and hue steps by Newton
helmlabMetric.xyz = (L, a0, b0) => {
	const [ea, eb] = offset(L);
	let a = a0 * RC + b0 * RS + ea, b = -a0 * RS + b0 * RC + eb;
	L /= Math.exp(four(Math.atan2(b, a), HL));
	const T = hlc(Math.atan2(b, a), L) * tL(L);
	a /= T, b /= T;
	[a, b] = cpow(a, b, true);
	const cs = Math.exp(four(Math.atan2(b, a), CS));
	a /= cs, b /= cs;
	let h = Math.atan2(b, a);
	const k = DARK + four(h, DH), Ld = L;
	for (let i = 0; i < 12; i++) {
		const o = L < 1 ? 1 - L : 0, e = Math.exp(clamp30(k * L * o * o));
		let fp = e * (1 + L * k * o * (1 - 3 * L));
		if (Math.abs(fp) < 1e-10) fp = 1;
		L -= (L * e - Ld) / fp;
	}
	const lh = four(h, LH), L1 = L;
	for (let i = 0; i < 15; i++) {
		const t = L * (1 - L), dt = 1 - 2 * L;
		let fp = 1 + (LC[0] + lh) * dt + LC[1] * (dt * (0.5 - L) - t) + LC[2] * 2 * t * dt;
		if (Math.abs(fp) < 1e-10) fp = 1;
		L -= (L + (LC[0] + lh) * t + LC[1] * t * (0.5 - L) + LC[2] * t * t - L1) / fp;
	}
	L -= hk(a, b);
	const C = Math.sqrt(a * a + b * b), h0 = h;
	for (let i = 0; i < 8; i++) {
		let fp = 1 + dfour(h, HUE);
		if (Math.abs(fp) < 1e-10) fp = 1;
		h -= (h + four(h, HUE) - h0) / fp;
	}
	const [l, m, s] = mat3(M2_INV, L, C * Math.cos(h), C * Math.sin(h));
	const [x, y, z] = mat3(M1_INV, spow(l, 1 / G[0]), spow(m, 1 / G[1]), spow(s, 1 / G[2]));
	return [x * 100, y * 100, z * 100];
};

export default helmlabMetric;
