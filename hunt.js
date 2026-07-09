/**
 * Hunt — Robert Hunt's colour appearance model (1982-1995), the most ambitious of the
 * classical CAMs: developed over decades at Kodak, it models cone AND rod responses,
 * luminance-level adaptation, surround induction, and predicts the full set of
 * appearance correlates for related and unrelated colours from dim starlight to
 * bright daylight. Its complexity is legendary — and directly ancestral: CIECAM97s
 * and CIECAM02 are, in Fairchild's phrase, Hunt models simplified for practice.
 *
 * @see {@link https://doi.org/10.1002/col.5080190504} Hunt 1994; Fairchild 2013, ch. 12
 * @year 1994
 * @by Robert W. G. Hunt
 * @use Historical flagship appearance model (Kodak); the direct ancestor of CIECAM97s/CIECAM02; kept for study.
 * @channel {J} 0 100 Lightness
 * @channel {C} 0 120 Chroma
 * @channel {h} 0 360 Hue
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Baked to the published worked example's conditions (colour-science doctest): D65
// white and background [95.05, 100, 108.88], adapting luminance L_A = 318.31 cd/m²,
// "Normal Scenes" surround (N_c=1, N_b=75), CCT_w = 6504 K for the rod (scotopic)
// signal, illuminant discounted, no Helson-Judd, scotopic response approximated by
// S = Y (as in the reference). Output is (J, C_94, h). The model has no closed-form
// inverse — Fairchild notes it must be reversed by successive approximation.
//
// hunt.xyz solves the inverse in ADAPTED-CONE space (r_a, g_a, b_a), not XYZ: the cone
// nonlinearity f_n(x)=40·x^0.73/(x^0.73+2) has an INFINITE slope at x=0, so the
// XYZ→(J,C,h) Jacobian is singular near black and a plain Newton diverges for
// saturated colours (a purple round-tripped with error ~19). In cone-adapted space
// black is the regular point (1,1,1), so the map is well conditioned; a
// Levenberg-Marquardt solve (damping handles the still-ill-scaled chroma directions)
// from the white-adapted seed converges to machine precision for every colour with
// lightness J ≥ 1. XYZ is then recovered analytically — the per-channel f_n inverse
// gives the cone signals, HPE⁻¹ gives XYZ. Colours below J = 1 (essentially black,
// <1% lightness) sit in a residual landscape with a microscopic basin around the true
// preimage and round-trip only approximately; they return a bounded near-black value.
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

const hunt = { name: 'hunt', range: [[0, 100], [0, 120], [0, 360]] };

// Hunt-Pointer-Estévez cones
const HPE = [0.38971, 0.68898, -0.07868, -0.22981, 1.18340, 0.04641, 0, 0, 1];
const HPEi = inv3(HPE);
const fn = x => { const p = Math.sign(x) * Math.pow(Math.abs(x), 0.73); return 40 * p / (p + 2); };
// inverse of f_n: y = 40·p/(p+2) with p = |x|^0.73  →  p = 2y/(40−y); |y| clamped < 40
const fnInv = y => { const a = Math.min(Math.abs(y), 39.9999); const p = 2 * a / (40 - a); return Math.sign(y) * Math.pow(p, 1 / 0.73); };

// baked viewing conditions
const XYZw = [95.05, 100, 108.88], LA = 318.31, Nc = 1, Nb = 75, Yb = 100, Yw = 100;
const Ncb = 0.725 * Math.pow(Yw / Yb, 0.2), Nbb = Ncb;
const k = 1 / (5 * LA + 1), k4 = k ** 4;
const FL = 0.2 * k4 * 5 * LA + 0.1 * (1 - k4) ** 2 * Math.pow(5 * LA, 1 / 3);
const LAS = 2.26 * LA * Math.pow(6504 / 4000 - 0.4, 1 / 3); // scotopic (CCT_w = 6504)
const Ft = LA / (LA + 0.1);
const rgbW = mat3(HPE, ...XYZw);
const Brgb = rgbW.map(v => 1e7 / (1e7 + 5 * LA * v / 100));
const rgbAw = rgbW.map((v, i) => 1 + Brgb[i] * fn(FL)); // f_n(F_L·rgb_w/rgb_w)
const Aaw = 2 * rgbAw[0] + rgbAw[1] + rgbAw[2] / 20 - 3.05 + 1;

// eccentricity: linear interpolation through (20.14,0.8) (90,0.7) (164.25,1.0) (237.53,1.2)
const HS = [20.14, 90, 164.25, 237.53], ES = [0.8, 0.7, 1.0, 1.2];
const ecc = h => {
	if (h < 20.14) return 0.856 - h / 20.14 * 0.056;
	if (h > 237.53) return 0.856 + 0.344 * (360 - h) / (360 - 237.53);
	let i = 0;
	while (i < 2 && h > HS[i + 1]) i++;
	return ES[i] + (ES[i + 1] - ES[i]) * (h - HS[i]) / (HS[i + 1] - HS[i]);
};

// rod (scotopic) contribution to the achromatic signal; S/S_w approximated by Y/Y_w
const rod = SSw => {
	const l = 5 * LAS / 2.26;
	const j = 0.00001 / (l + 0.00001);
	const FLS = 3800 * j * j * l + 0.2 * Math.pow(1 - j * j, 0.4) * Math.pow(l, 1 / 6);
	const BS = 0.5 / (1 + 0.3 * Math.pow(l * SSw, 0.3)) + 0.5 / (1 + 5 * l);
	return fn(FLS * SSw) * 3.05 * BS + 0.3;
};
const Aw = Nbb * (Aaw - 1 + rod(1) - 0.3 + Math.sqrt(1.09));
const N1 = Math.pow(7 * Aw, 0.5) / (5.33 * Math.pow(Nb, 0.13));
const N2 = 7 * Aw * Math.pow(Nb, 0.362) / 200;

// M_w: overall chromatic response of the white (uses the SAMPLE's e_s, per the model)
const Cw = [rgbAw[0] - rgbAw[1], rgbAw[1] - rgbAw[2], rgbAw[2] - rgbAw[0]];

// (J, C_94, h) from the adapted cone signals rgbA and the sample luminance Y — the
// stage both the forward and the inverse's residual share
const correlate = (rgbA, Y) => {
	const Aa = 2 * rgbA[0] + rgbA[1] + rgbA[2] / 20 - 3.05 + 1;
	const C1 = rgbA[0] - rgbA[1], C2 = rgbA[1] - rgbA[2], C3 = rgbA[2] - rgbA[0];
	const h = (Math.atan2(0.5 * (C2 - C3) / 4.5, C1 - C2 / 11) * 180 / Math.PI + 360) % 360;
	const es = ecc(h);
	const Myb = 100 * (0.5 * (C2 - C3) / 4.5) * (es * (10 / 13) * Nc * Ncb * Ft);
	const Mrg = 100 * (C1 - C2 / 11) * (es * (10 / 13) * Nc * Ncb);
	const M = Math.hypot(Myb, Mrg);
	const MybW = 100 * (0.5 * (Cw[1] - Cw[2]) / 4.5) * (es * (10 / 13) * Nc * Ncb * Ft);
	const MrgW = 100 * (Cw[0] - Cw[1] / 11) * (es * (10 / 13) * Nc * Ncb);
	const Mw = Math.hypot(MybW, MrgW);
	const s = 50 * M / (rgbA[0] + rgbA[1] + rgbA[2]);
	const A = Nbb * (Aa - 1 + rod(Y / Yw) - 0.3 + Math.sqrt(1.09));
	const Q = Math.pow(7 * (A + M / 100), 0.6) * N1 - N2;
	const Qw = Math.pow(7 * (Aw + Mw / 100), 0.6) * N1 - N2;
	const J = 100 * Math.pow(Q / Qw, 1 + Math.sqrt(Yb / Yw));
	const C94 = 2.44 * Math.pow(s, 0.69) * Math.pow(Q / Qw, Yb / Yw) * (1.64 - Math.pow(0.29, Yb / Yw));
	return [J, C94, h];
};

xyz.hunt = (X, Y, Z) => {
	const rgb = mat3(HPE, X, Y, Z);
	const rgbA = rgb.map((v, i) => 1 + Brgb[i] * fn(FL * v / rgbW[i]));
	return correlate(rgbA, Y);
};

hunt.xyz = (J, C, h) => {
	const hr = h * Math.PI / 180, T = [J, C * Math.cos(hr), C * Math.sin(hr)];
	// residual in adapted-cone space: recover the cone signals (per-channel f_n inverse)
	// and Y (HPE⁻¹) from rgbA, then the correlates, as cartesian (J, C·cos h, C·sin h)
	const g = rgbA => {
		const rgb = rgbA.map((v, i) => rgbW[i] / FL * fnInv((v - 1) / Brgb[i]));
		const Y = HPEi[3] * rgb[0] + HPEi[4] * rgb[1] + HPEi[5] * rgb[2];
		const [j, c, hh] = correlate(rgbA, Y), a = hh * Math.PI / 180;
		return [j, c * Math.cos(a), c * Math.sin(a)];
	};
	// Levenberg-Marquardt from the white-adapted seed (black = the regular (1,1,1))
	let p = rgbAw.slice();
	let f = g(p), e = [f[0] - T[0], f[1] - T[1], f[2] - T[2]], cost = e[0] * e[0] + e[1] * e[1] + e[2] * e[2], lam = 1e-3;
	for (let it = 0; it < 40 && cost > 1e-24; it++) {
		const hs = 1e-5, Jm = [[], [], []]; // numeric Jacobian d(cartesian)/d(rgbA)
		for (let c2 = 0; c2 < 3; c2++) { const pp = p.slice(); pp[c2] += hs; const fp = g(pp); for (let r = 0; r < 3; r++) Jm[r][c2] = (fp[r] - f[r]) / hs; }
		const H = [0, 0, 0, 0, 0, 0, 0, 0, 0], grad = [0, 0, 0]; // H = JᵀJ, grad = Jᵀe
		for (let a = 0; a < 3; a++) { for (let b = 0; b < 3; b++) { let sm = 0; for (let r = 0; r < 3; r++) sm += Jm[r][a] * Jm[r][b]; H[a * 3 + b] = sm; } let sg = 0; for (let r = 0; r < 3; r++) sg += Jm[r][a] * e[r]; grad[a] = sg; }
		let stepped = false;
		for (let tries = 0; tries < 15; tries++) { // grow damping until a step reduces cost
			const D = [H[0] * (1 + lam), H[1], H[2], H[3], H[4] * (1 + lam), H[5], H[6], H[7], H[8] * (1 + lam)];
			const dp = mat3(inv3(D), -grad[0], -grad[1], -grad[2]);
			if (!dp.every(Number.isFinite)) { lam *= 3; continue; }
			const np = [p[0] + dp[0], p[1] + dp[1], p[2] + dp[2]];
			const nf = g(np), ne = [nf[0] - T[0], nf[1] - T[1], nf[2] - T[2]], nc = ne[0] * ne[0] + ne[1] * ne[1] + ne[2] * ne[2];
			if (nc < cost) { p = np; f = nf; e = ne; cost = nc; lam = Math.max(lam * 0.3, 1e-10); stepped = true; break; }
			lam *= 3;
		}
		if (!stepped) break;
	}
	const rgb = p.map((v, i) => rgbW[i] / FL * fnInv((v - 1) / Brgb[i]));
	return mat3(HPEi, ...rgb);
};

export default hunt;
