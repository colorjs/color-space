/**
 * YcCbcCrc color space — ITU-R BT.2020 / BT.2100 constant-luminance (CL) system.
 *
 * Unlike the non-constant-luminance Y'CbCr, the luma Yc is formed in LINEAR light
 * (Yc = Kr·R + Kg·G + Kb·B) then OETF-encoded, and the chroma differences use the
 * BT.2020 piecewise normalisation. Operates on linear Rec.2020 RGB.
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.2020/en}
 * @channel {Yc} 0 1 Constant-luminance luma
 * @channel {Cbc} -0.5 0.5 Blue-difference chroma
 * @channel {Crc} -0.5 0.5 Red-difference chroma
 * @illuminant D65
 * @observer 2
 */
import rec2020Linear from './rec2020-linear.js';

const yccbccrc = {
	name: 'yccbccrc',
	range: [[0, 1], [-0.5, 0.5], [-0.5, 0.5]]
};

// BT.2020-2 Table 4 (constant-luminance derivation)
const Kr = 0.2627, Kg = 0.6780, Kb = 0.0593;
const NBC = 1.9404, PBC = 1.5816, NRC = 1.7184, PRC = 0.9936;
// BT.2020 OETF (full-precision α/β)
const A = 1.09929682680944, B = 0.018053968510807;
const oetf = (v) => { const s = v < 0 ? -1 : 1, x = Math.abs(v); return s * (x < B ? 4.5 * x : A * Math.pow(x, 0.45) - (A - 1)); };
const eotf = (v) => { const s = v < 0 ? -1 : 1, x = Math.abs(v); return s * (x < 4.5 * B ? x / 4.5 : Math.pow((x + (A - 1)) / A, 1 / 0.45)); };

// linear Rec.2020 RGB -> YcCbcCrc
rec2020Linear.yccbccrc = (R, G, B) => {
	const Ycp = oetf(Kr * R + Kg * G + Kb * B), Rp = oetf(R), Bp = oetf(B);
	const dB = Bp - Ycp, dR = Rp - Ycp;
	return [Ycp, dB < 0 ? dB / NBC : dB / PBC, dR < 0 ? dR / NRC : dR / PRC];
};

// YcCbcCrc -> linear Rec.2020 RGB
yccbccrc[rec2020Linear.name] = (Ycp, Cbc, Crc) => {
	const Bp = Ycp + (Cbc < 0 ? Cbc * NBC : Cbc * PBC);
	const Rp = Ycp + (Crc < 0 ? Crc * NRC : Crc * PRC);
	const Yc = eotf(Ycp), R = eotf(Rp), Bl = eotf(Bp);
	return [R, (Yc - Kr * R - Kb * Bl) / Kg, Bl];
};

export default yccbccrc;
