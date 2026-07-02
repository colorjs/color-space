/**
 * ZCAM color space (Safdar, Hardeberg & Luo 2021)
 *
 * The HDR-native colour appearance model — the CAM16 analogue built on the absolute
 * Izazbz substrate, predicting lightness J, colourfulness M and hue h (plus brightness,
 * vividness, blackness, whiteness in the full model). Operates on ABSOLUTE XYZ.
 *
 * CAUTION — like cam16/hellwig2022 the viewing conditions are baked, here to the
 * canonical ZCAM reference example: white XYZ_w = [256,264,202], L_A = 264 cd/m²,
 * Y_b = 100, average surround. Input XYZ is absolute (not the library's relative
 * 0-100); under these conditions XYZ_w=[256,264,202] → J≈100. Chaining from rgb maps a
 * relative colour into this absolute frame, so the result is "ZCAM of a dim sample".
 *
 * @see {@link https://doi.org/10.1364/OE.413659} Safdar et al. 2021
 * @channel {J} 0 100 Lightness
 * @channel {M} 0 100 Colourfulness
 * @channel {h} 0 360 Hue angle
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic hdr
 */
import xyz from './xyz.js';
import { mat3, inv3 } from './util.js';

const zcam = { name: 'zcam', range: [[0, 100], [0, 100], [0, 360]] };

const spow = (v, p) => v < 0 ? -Math.pow(-v, p) : Math.pow(v, p);

// Izazbz (Safdar 2021: Iz row = [0,1,0], d0 offset) — ZCAM's absolute substrate
const m1 = 2610 / 16384, m2 = 1.7 * 2523 / 32, c1 = 3424 / 4096, c2 = 2413 / 128, c3 = 2392 / 128;
const pqE = L => { const v = Math.pow(Math.max(L, 0) / 10000, m1); return Math.pow((c1 + c2 * v) / (1 + c3 * v), m2); };
const pqD = V => { const vp = Math.pow(Math.max(V, 0), 1 / m2); return Math.pow(Math.max(vp - c1, 0) / (c2 - c3 * vp), 1 / m1) * 10000; };
const M_XL = [0.41478972, 0.579999, 0.0146480, -0.2015100, 1.120649, 0.0531008, -0.0166008, 0.264800, 0.6684799];
const M_XLi = inv3(M_XL);
const M_LI = [0, 1, 0, 3.524, -4.066708, 0.542708, 0.199076, 1.096799, -1.295875];
const M_LIi = inv3(M_LI);
const d0 = 3.7035226210190005e-11, bp = 1.15, gp = 0.66;
const toIzazbz = (X, Y, Z) => { const I = mat3(M_LI, ...mat3(M_XL, bp * X - (bp - 1) * Z, gp * Y - (gp - 1) * X, Z).map(pqE)); return [I[0] - d0, I[1], I[2]]; };
const fromIzazbz = (Iz, az, bz) => { const lms = mat3(M_LIi, Iz + d0, az, bz).map(pqD); const [Xp, Yp, Z] = mat3(M_XLi, ...lms); const X = (Xp + (bp - 1) * Z) / bp; return [X, (Yp + (gp - 1) * X) / gp, Z]; };

const CAT02 = [0.7328, 0.4296, -0.1624, -0.7036, 1.6975, 0.0061, 0.0030, 0.0136, 0.9834];
const CAT02i = inv3(CAT02);
const TVS_D65 = [0.95046, 1, 1.08906], WO = [100, 100, 100];

// Zhai (2018) two-step CAT02 adaptation, baseline white WO
const zhai = (XYZ, Wb, Wd, D) => {
	const Rb = mat3(CAT02, ...XYZ), Rwb = mat3(CAT02, ...Wb), Rwd = mat3(CAT02, ...Wd), Rwo = mat3(CAT02, ...WO);
	const DRb = Rwb.map((_, i) => D * (Wb[1] / WO[1]) * (Rwo[i] / Rwb[i]) + 1 - D);
	const DRd = Rwd.map((_, i) => D * (Wd[1] / WO[1]) * (Rwo[i] / Rwd[i]) + 1 - D);
	return mat3(CAT02i, ...Rb.map((v, i) => v * (DRb[i] / DRd[i])));
};

// baked conditions (canonical ZCAM reference example)
const Xw = [256, 264, 202], La = 264, Yb = 100, Fs = 0.69;
const D = 1 - (1 / 3.6) * Math.exp((-La - 42) / 92);
const Fb = Math.sqrt(Yb / Xw[1]), FL = 0.171 * spow(La, 1 / 3) * (1 - Math.exp(-48 / 9 * La));
const Izw = toIzazbz(...Xw)[0];
const Qp = 1.6 * Fs / Math.pow(Fb, 0.12), Qm = Math.pow(Fs, 2.2) * Math.pow(Fb, 0.5) * spow(FL, 0.2);
const Qzw = 2700 * spow(Izw, Qp) * Qm;
const D2R = Math.PI / 180;

xyz.zcam = (X, Y, Z) => {
	const [Iz, az, bz] = toIzazbz(...zhai([X, Y, Z], Xw, TVS_D65, D));
	let h = Math.atan2(bz, az) / D2R; if (h < 0) h += 360;
	const ez = 1.015 + Math.cos((89.038 + h % 360) * D2R);
	const J = 100 * (2700 * spow(Iz, Qp) * Qm) / Qzw;
	const M = 100 * Math.pow(az * az + bz * bz, 0.37) * (spow(ez, 0.068) * spow(FL, 0.2)) / (Math.pow(Fb, 0.1) * spow(Izw, 0.78));
	return [J, M, h];
};

zcam.xyz = (J, M, h) => {
	const ez = 1.015 + Math.cos((89.038 + h % 360) * D2R);
	const Iz = spow(J * Qzw / 100 / (2700 * Qm), 1 / Qp);
	const r = Math.sqrt(Math.pow(M * Math.pow(Fb, 0.1) * spow(Izw, 0.78) / (100 * spow(ez, 0.068) * spow(FL, 0.2)), 1 / 0.37));
	const hr = h * D2R;
	return zhai(fromIzazbz(Iz, r * Math.cos(hr), r * Math.sin(hr)), TVS_D65, Xw, D);
};

export default zcam;
