/**
 * CIECAM97s is the interim color appearance model the CIE published in 1998 (CIE 131): one model
 * for industry to share until a better one was formulated, and the direct predecessor of
 * CIECAM02. A Bradford chromatic adaptation, with a nonlinear exponent on the short-wavelength
 * channel, feeds Hunt–Pointer–Estévez cone responses and a hyperbolic compression, giving
 * lightness, colorfulness and hue, plus chroma, saturation and brightness in the full model.
 *
 * @see {@link https://cie.co.at/publications/cie-1997-interim-colour-appearance-model-simple-version-ciecam97s} CIE 131-1998
 * @see {@link http://markfairchild.org/PDFs/CIECAM97s_TC_Draft.pdf} CIE TC1-34 final draft, April 1998
 * @year 1997
 * @by CIE
 * @use Historical: the CIE's interim appearance model, superseded by CIECAM02.
 * @successor ciecam02 CIECAM02 made the chromatic adaptation linear and set lightness to zero at black
 * @channel {J} 0 100 Lightness
 * @channel {M} 0 100 Colorfulness
 * @channel {h} 0 360 Hue angle in degrees
 * @method appearance
 * @encoding perceptual
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Equations of the CIE TC1-34 final draft (April 1998, published as CIE 131), §2. Baked to the
// reference conditions ciecam02.js uses: D65 adapting white (XYZ [95.05, 100, 108.88]),
// L_A = 318.31 cd/m², Y_b = 20, average surround (c 0.69, N_c 1.0, F_LL 1.0, F 1.0, Table 2.1)
// – Case 1 of the report's Table 4.1. M_B^-1 (eq. 2.13) is the exact inverse of M_B, not the
// 4-decimal print beside it: the near-neutral Case 1 is hypersensitive to it, and Table 4.1
// prints h 219.4, C 0.47, which the exact inverse gives (219.43, 0.474) and the print does not
// (212.28, 0.498 – the values Fairchild's AppModEx.xls spreadsheet of the table now shows).
// The blue exponent p acts on B/Y; Bc·Y = k_B·B·|B/Y|^(p−1) is the report's sign rule
// (eq. 2.5 and the note after it) without the division, and is 0 at Y = 0 (black).
// Inverse: the report's §4.2 is approximate in Y (its own note); here the one unknown, Y, is
// solved exactly – Y = M_B^-1[1]·[R, G, B] with B = σ·|Y|^(1−1/p) – by Newton's method
// (3 steps to 1e-15 over the sRGB cube).
// e interpolates linearly between unique hues (eq. 2.21), blue to red across 360°. Fairchild's
// spreadsheet splits that interval at 360° with e = 0.856 (eq. 2.21: 0.85649) and H = 385.9
// (eq. 2.22: 380.21), so for h > 237.53° or h < 20.14° its C and M sit up to 0.04 % low;
// Table 4.1's Case 4 H, 307, follows the split (eq. 2.22 gives 306.4; see docs/errata.md).
// CIECAM97s puts black at J ≈ 2.24: the achromatic noise term 2.05 is 1 short of 3.05, the
// value of 2R'a + G'a + B'a/20 at black (CIECAM02 fixed this).
import xyz, { M_BRADFORD as MB } from './xyz.js';
import { mat3, mul3, inv3, spow } from '../math.js';
import { m1, constrain } from './cam16.js';

const ciecam97s = { name: 'ciecam97s', range: [[0, 100], [0, 100], [0, 360]] };

// M_H (eq. 2.14) after M_B^-1
const MH = [0.38971, 0.68898, -0.07868, -0.22981, 1.18340, 0.04641, 0, 0, 1];
const MBinv = inv3(MB), MHB = mul3(MH, MBinv), MHBinv = inv3(MHB);

// average surround, Table 2.1
const F = 1, c = 0.69, Nc = 1, FLL = 1;

// unique hues and eccentricities (§2.3), red repeated at 360° + 20.14°
const HUE = [20.14, 90, 164.25, 237.53, 380.14], ECC = [0.8, 0.7, 1.0, 1.2, 0.8];
const ecc = h => {
	const hp = h < HUE[0] ? h + 360 : h;
	let i = 0;
	while (i < 3 && hp >= HUE[i + 1]) i++;
	return ECC[i] + (ECC[i + 1] - ECC[i]) * (hp - HUE[i]) / (HUE[i + 1] - HUE[i]);
};

// eqs. 2.15–2.17 and their inverse (4.12–4.15), odd about 1
const compress = (q, fl) => { const x = (fl * Math.abs(q) / 100) ** 0.73; return Math.sign(q) * 40 * x / (x + 2) + 1; };
const decompress = (q, fl) => { const w = q - 1, a = Math.abs(w); return Math.sign(w) * 100 / fl * (2 * a / (40 - a)) ** (1 / 0.73); };

// [Rc·Y, Gc·Y, Bc·Y] → post-adaptation responses R'a, G'a, B'a (eqs. 2.13, 2.15–2.17)
const respond = ([X, Y, Z], e) => {
	const [R, G, B] = mat3(MB, X, Y, Z);
	const bc = B === 0 || Y === 0 ? 0 : e.k[2] * B * Math.abs(B / Y) ** (e.p - 1);
	return mat3(MHB, e.k[0] * R, e.k[1] * G, bc).map(q => compress(q, e.FL));
};

/** Viewing-condition constants (average surround) for adapting white XYZw, L_A in cd/m², Y_b. */
export function environment(white, La, Yb) {
	const D = F - F / (1 + 2 * La ** 0.25 + La * La / 300);
	const k4 = (1 / (5 * La + 1)) ** 4;
	const FL = 0.2 * k4 * 5 * La + 0.1 * (1 - k4) ** 2 * Math.cbrt(5 * La);
	const n = Yb / white[1], Nbb = 0.725 * n ** -0.2, z = 1 + FLL * Math.sqrt(n);
	const [Rw, Gw, Bw] = mat3(MB, ...white).map(v => v / white[1]);
	const p = Bw ** 0.0834;
	const e = { D, FL, n, Nbb, z, p, k: [D / Rw + 1 - D, D / Gw + 1 - D, D / Bw ** p + 1 - D] };
	const [Ra, Ga, Ba] = respond(white, e);
	e.Aw = Nbb * (2 * Ra + Ga + Ba / 20 - 2.05);
	return e;
}

/** XYZ (0–100) → { J, Q, C, M, s, h } (§2.3). */
export function toCiecam97s(XYZ, e) {
	const [Ra, Ga, Ba] = respond(XYZ, e);
	const a = Ra - 12 * Ga / 11 + Ba / 11, b = (Ra + Ga - 2 * Ba) / 9;
	const h = constrain(Math.atan2(b, a) * 180 / Math.PI);
	const J = 100 * spow(e.Nbb * (2 * Ra + Ga + Ba / 20 - 2.05) / e.Aw, c * e.z);
	const den = Ra + Ga + 21 / 20 * Ba;
	const s = den === 0 ? 0 : 50 * Math.hypot(a, b) * 100 * ecc(h) * (10 / 13) * Nc * e.Nbb / den;
	const C = 2.44 * spow(s, 0.69) * spow(J / 100, 0.67 * e.n) * (1.64 - 0.29 ** e.n);
	const Q = (1.24 / c) * spow(J / 100, 0.67) * (e.Aw + 3) ** 0.9;
	return { J, Q, C, M: C * e.FL ** 0.15, s, h };
}

/** J, M, h → XYZ (0–100), exact (§4.2 with Y solved instead of approximated). */
export function fromCiecam97s(J, M, h, e) {
	const jn = 2.44 * spow(J / 100, 0.67 * e.n) * (1.64 - 0.29 ** e.n);
	const s = jn === 0 ? 0 : spow(M / e.FL ** 0.15 / jn, 1 / 0.69);
	const p2 = e.Aw * spow(J / 100, 1 / (c * e.z)) / e.Nbb + 2.05;
	const hr = h * Math.PI / 180, cosh = Math.cos(hr), sinh = Math.sin(hr);
	// s = K·r / (p2 − r(11 cos h + 108 sin h)/23), the denominator being R'a + G'a + 21/20 B'a
	const den = (5e4 / 13) * ecc(constrain(h)) * Nc * e.Nbb + s * (11 * cosh + 108 * sinh) / 23;
	const r = den === 0 ? 0 : s * p2 / den;
	const v = mat3(MHBinv, ...mat3(m1, p2, r * cosh, r * sinh).map(q => decompress(q / 1403, e.FL)));
	const R = v[0] / e.k[0], G = v[1] / e.k[1];
	const sig = spow(v[2] / e.k[2], 1 / e.p), q = 1 - 1 / e.p;
	const a0 = MBinv[3] * R + MBinv[4] * G, g = MBinv[5] * sig;
	let Y = a0 + g;
	for (let i = 0; i < 8 && sig !== 0 && Y !== 0; i++) {
		const yq = Math.abs(Y) ** q;
		Y -= (Y - a0 - g * yq) / (1 - q * g * yq / Y);
	}
	return mat3(MBinv, R, G, sig === 0 ? 0 : sig * Math.abs(Y) ** q);
}

const white = [95.05, 100, 108.88];
const env = environment(white, 318.31, 20);

xyz.ciecam97s = (X, Y, Z) => {
	const { J, M, h } = toCiecam97s([X, Y, Z], env);
	return [J, M, h];
};

ciecam97s.xyz = (J, M, h) => fromCiecam97s(J, M, h, env);

export default ciecam97s;
