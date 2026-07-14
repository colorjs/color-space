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
 * @method appearance
 * @encoding perceptual
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
// S = Y (as in the reference). Output is (J, C_94, h).
//
// Fairchild calls the model "not analytically invertible", but under these baked
// conditions (Y_b = Y_w = 100) the inverse is very nearly closed form. From J alone,
// Q/Q_w = √(J/100); C_94 then gives the saturation s directly; the hue h fixes the
// DIRECTION of the opponent pair (C1, C2) = ρ·d(h), leaving a single magnitude ρ and a
// single lightness Aa, both AFFINE in ρ once s is known. The only genuine coupling is
// the rod (scotopic) term, which enters the achromatic signal through the sample
// luminance Y — and Y depends on the very cones we are solving for. That closes with a
// short 1-D fixed point on Y (rod is a small correction, so it contracts in ~8 steps).
// Cone signals come back per-channel via f_n⁻¹, then HPE⁻¹ gives XYZ. This replaces the
// former Levenberg-Marquardt solve: no Jacobian, no damping, ~4× faster, and it seals
// the near-black plane gaps the LM basin used to void. Machine-exact for J ≥ 1; below
// that the preimage is degenerate and the fixed point returns a bounded near-black value.
import xyz from './xyz.js';
import { mat3, inv3 } from '../util.js';

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
	const BS = 0.5 / (1 + 0.3 * Math.pow(Math.max(l * SSw, 0), 0.3)) + 0.5 / (1 + 5 * l);
	return fn(FLS * SSw) * 3.05 * BS + 0.3;
};
const Aw = Nbb * (Aaw - 1 + rod(1) - 0.3 + Math.sqrt(1.09));
const N1 = Math.pow(7 * Aw, 0.5) / (5.33 * Math.pow(Nb, 0.13));
const N2 = 7 * Aw * Math.pow(Nb, 0.362) / 200;

// M_w: overall chromatic response of the white (uses the SAMPLE's e_s, per the model)
const Cw = [rgbAw[0] - rgbAw[1], rgbAw[1] - rgbAw[2], rgbAw[2] - rgbAw[0]];
const S109 = Math.sqrt(1.09);
// the white's brightness Q_w at eccentricity e_s (per-sample e_s, as the model specifies)
const Qw = es => { const fac = es * (10 / 13) * Nc * Ncb;
	const MybW = 100 * (0.5 * (Cw[1] - Cw[2]) / 4.5) * fac * Ft, MrgW = 100 * (Cw[0] - Cw[1] / 11) * fac;
	return Math.pow(7 * (Aw + Math.hypot(MybW, MrgW) / 100), 0.6) * N1 - N2; };
// sample luminance Y from adapted cones (per-channel f_n⁻¹ then HPE⁻¹ row Y) — the inverse's one coupling
const coneY = rgbA => { const rgb = rgbA.map((v, i) => rgbW[i] / FL * fnInv((v - 1) / Brgb[i]));
	return HPEi[3] * rgb[0] + HPEi[4] * rgb[1] + HPEi[5] * rgb[2]; };

// (J, C_94, h) from the adapted cone signals rgbA and the sample luminance Y (the forward)
const correlate = (rgbA, Y) => {
	const Aa = 2 * rgbA[0] + rgbA[1] + rgbA[2] / 20 - 3.05 + 1;
	const C1 = rgbA[0] - rgbA[1], C2 = rgbA[1] - rgbA[2], C3 = rgbA[2] - rgbA[0];
	const h = (Math.atan2(0.5 * (C2 - C3) / 4.5, C1 - C2 / 11) * 180 / Math.PI + 360) % 360;
	const es = ecc(h);
	const Myb = 100 * (0.5 * (C2 - C3) / 4.5) * (es * (10 / 13) * Nc * Ncb * Ft);
	const Mrg = 100 * (C1 - C2 / 11) * (es * (10 / 13) * Nc * Ncb);
	const M = Math.hypot(Myb, Mrg);
	const s = 50 * M / (rgbA[0] + rgbA[1] + rgbA[2]);
	const A = Nbb * (Aa - 1 + rod(Y / Yw) - 0.3 + S109);
	const Q = Math.pow(7 * (A + M / 100), 0.6) * N1 - N2;
	const qr = Q / Qw(es);
	const J = 100 * Math.pow(qr, 1 + Math.sqrt(Yb / Yw));
	const C94 = 2.44 * Math.pow(s, 0.69) * Math.pow(qr, Yb / Yw) * (1.64 - Math.pow(0.29, Yb / Yw));
	return [J, C94, h];
};

xyz.hunt = (X, Y, Z) => {
	const rgb = mat3(HPE, X, Y, Z);
	const rgbA = rgb.map((v, i) => 1 + Brgb[i] * fn(FL * v / rgbW[i]));
	return correlate(rgbA, Y);
};

hunt.xyz = (J, C, h) => {
	const es = ecc(h), qr = Math.sqrt(Math.max(J, 0) / 100);
	const Q = qr * Qw(es), K = Math.pow(Math.max(Q + N2, 0) / N1, 1 / 0.6) / 7;   // K = A + M/100, exact from J
	const hr = h * Math.PI / 180, ch = Math.cos(hr), sh = Math.sin(hr), fac = es * (10 / 13) * Nc * Ncb;
	// hue fixes the opponent DIRECTION: (C1, C2) = ρ·(d1, d2); chroma M = K_m·ρ
	const d1 = (22 * ch + 9 * sh) / 23, d2 = 11 * (9 * sh - ch) / 23, Km = 100 * fac * Math.hypot(Ft * sh, ch);
	let rgbA;
	if (C < 1e-9) {   // achromatic: r_a = g_a = b_a; solve lightness against the rod's Y-coupling
		let a = rgbAw[0];
		for (let i = 0; i < 30; i++) { const na = (K / Nbb + 1 - rod(coneY([a, a, a]) / Yw) + 0.3 - S109 + 2.05) / 3.05;
			if (Math.abs(na - a) < 1e-13) { a = na; break; } a = na; }   // A = K, Aa = 3.05·a − 2.05
		rgbA = [a, a, a];
	} else {
		const s = Math.pow(C / (2.44 * 1.35 * qr), 1 / 0.69);       // saturation, exact from C_94
		const Ka = 3.05 / 3 * (50 * Km / s - (d1 - d2)) + 2 * d1 - d2 / 20;   // Aa = K_a·ρ − 2.05
		let Y = 50, rho = 0, r1 = 0;
		for (let i = 0; i < 30; i++) {   // 1-D fixed point on Y (rod is a small, contracting correction)
			rho = (K - Nbb * (S109 - 3.35 + rod(Y / Yw))) / (Nbb * Ka + Km / 100);
			r1 = (50 * Km * rho / s - rho * (d1 - d2)) / 3;
			const nY = coneY([r1 + rho * d1, r1, r1 - rho * d2]);
			if (Math.abs(nY - Y) < 1e-11) { Y = nY; break; } Y = nY;
		}
		rgbA = [r1 + rho * d1, r1, r1 - rho * d2];
	}
	return mat3(HPEi, ...rgbA.map((v, i) => rgbW[i] / FL * fnInv((v - 1) / Brgb[i])));
};

export default hunt;
