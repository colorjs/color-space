/**
 * CIECAM02 color appearance model
 *
 * The CIE 2002 appearance model (predecessor of CAM16, still used in ICC v4
 * workflows). Reports [J, M, h] under the standard Moroney et al. (2002) viewing
 * conditions: D65 adapting white, La = 318.31 cd/m², Yb = 20, average surround.
 *
 * @see {@link https://doi.org/10.1002/col.10125}
 * @channel {J} 0 100 Lightness
 * @channel {M} 0 100 Colorfulness
 * @channel {h} 0 360 Hue angle in degrees
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';
import { spow } from './util.js';

const mv = (m, v) => [
	m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
	m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
	m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2]
];
const compress = (v) => { const f = spow(FL * Math.abs(v) / 100, 0.42); return 400 * Math.sign(v) * f / (f + 27.13) + 0.1; };
const decompress = (v) => { const w = v - 0.1; return Math.sign(w) * (100 / FL) * Math.pow(27.13 * Math.abs(w) / (400 - Math.abs(w)), 1 / 0.42); };

// CAT02 chromatic adaptation (CIE 159:2004) and HPE·inv(CAT02) post-adaptation matrix
const M_CAT02 = [[0.7328, 0.4296, -0.1624], [-0.7036, 1.6975, 0.0061], [0.0030, 0.0136, 0.9834]];
const M_CAT02_INV = [[1.096124, -0.278869, 0.182745], [0.454369, 0.473533, 0.072098], [-0.009628, -0.005698, 1.015326]];
const M_HPE_CAT02 = [[0.7409792, 0.2180250, 0.0410058], [0.2853532, 0.6242014, 0.0904454], [-0.0096280, -0.0056980, 1.0153260]];
const M_HPE_CAT02_INV = [[1.5591519556, -0.5447222871, -0.0144452601], [-0.7143265795, 1.8503102655, -0.1359765427], [0.0107761273, 0.0052185029, 0.9840052620]];

// Viewing conditions: D65, La = 318.31, Yb = 20, average surround (Moroney et al. 2002).
// Adapting white is the conventional CIECAM02 D65 [95.05, 100, 108.88]; near-neutral
// hue is hypersensitive to it, so use the paper's value to reproduce the reference.
const XYZ_w = [95.05, 100, 108.88], Yw = 100;
const La = 318.31, Yb = 20, F = 1, c = 0.69, Nc = 1;
const lmsW = mv(M_CAT02, XYZ_w);
const D = Math.min(Math.max(F * (1 - (1 / 3.6) * Math.exp((-La - 42) / 92)), 0), 1);
const k = 1 / (5 * La + 1), k4 = k * k * k * k;
const FL = 0.2 * k4 * (5 * La) + 0.1 * Math.pow(1 - k4, 2) * Math.pow(5 * La, 1 / 3);
const n = Yb / Yw, z = 1.48 + Math.sqrt(n);
const Nbb = 0.725 * Math.pow(1 / n, 0.2), Ncb = Nbb;
const adapt = (v, i) => (Yw * D / lmsW[i] + 1 - D) * v;
const lmsWa = mv(M_HPE_CAT02, lmsW.map(adapt)).map(compress);
const Aw = Nbb * (2 * lmsWa[0] + lmsWa[1] + 0.05 * lmsWa[2] - 0.305);

const ciecam02 = {
	name: 'ciecam02',
	range: [[0, 100], [0, 100], [0, 360]]
};

xyz.ciecam02 = (x, y, z_) => {
	const lmsP = mv(M_HPE_CAT02, mv(M_CAT02, [x, y, z_]).map(adapt));
	const [Ra, Ga, Ba] = lmsP.map(compress);
	const a = Ra - 12 * Ga / 11 + Ba / 11;
	const b = (Ra + Ga - 2 * Ba) / 9;
	let h = Math.atan2(b, a) * 180 / Math.PI; if (h < 0) h += 360;
	const et = 0.25 * (Math.cos(h * Math.PI / 180 + 2) + 3.8);
	const A = Nbb * (2 * Ra + Ga + 0.05 * Ba - 0.305);
	const J = 100 * Math.pow(A / Aw, c * z);
	const t = (50000 / 13) * Nc * Ncb * et * Math.sqrt(a * a + b * b) / (Ra + Ga + (21 / 20) * Ba);
	const alpha = Math.pow(t, 0.9) * Math.pow(1.64 - Math.pow(0.29, n), 0.73);
	const C = alpha * Math.sqrt(J / 100);
	return [J, C * Math.pow(FL, 0.25), h];
};

ciecam02.xyz = (J, M, h) => {
	const C = M / Math.pow(FL, 0.25);
	const alpha = J === 0 ? 0 : C / Math.sqrt(J / 100);
	const t = Math.pow(alpha / Math.pow(1.64 - Math.pow(0.29, n), 0.73), 1 / 0.9);
	const hr = h * Math.PI / 180, cosh = Math.cos(hr), sinh = Math.sin(hr);
	const et = 0.25 * (Math.cos(hr + 2) + 3.8);
	const A = Aw * Math.pow(J / 100, 1 / (c * z));
	const p2 = A / Nbb + 0.305;
	const p1 = (50000 / 13) * Nc * Ncb * et;
	// solve [2,1,0.05; 1,-12/11,1/11; 1,1,-2]·[Ra,Ga,Ba] = [p2, r·cos h, 9r·sin h]
	const Mi = [[0.3278688525, 0.3214540271, 0.0228082680], [0.3278688525, -0.6350677120, -0.0206699929], [0.3278688525, -0.1568068425, -0.4989308624]];
	const kp = [Mi[0][0], Mi[1][0], Mi[2][0]];
	const kr = [Mi[0][1] * cosh + Mi[0][2] * 9 * sinh, Mi[1][1] * cosh + Mi[1][2] * 9 * sinh, Mi[2][1] * cosh + Mi[2][2] * 9 * sinh];
	const Sp = kp[0] + kp[1] + 1.05 * kp[2], Sr = kr[0] + kr[1] + 1.05 * kr[2];
	const r = (t !== 0 && Math.abs(p1 - t * Sr) > 1e-15) ? t * Sp * p2 / (p1 - t * Sr) : 0;
	const Ra = kp[0] * p2 + kr[0] * r, Ga = kp[1] * p2 + kr[1] * r, Ba = kp[2] * p2 + kr[2] * r;
	const lmsC = mv(M_HPE_CAT02_INV, [Ra, Ga, Ba].map(decompress));
	const lms = lmsC.map((v, i) => v / (Yw * D / lmsW[i] + 1 - D));
	return mv(M_CAT02_INV, lms);
};

export default ciecam02;
