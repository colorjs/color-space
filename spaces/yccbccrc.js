/**
 * YcCbcCrc is the constant-luminance encoding defined alongside ITU-R BT.2020 and
 * BT.2100 for ultra-high-definition and HDR/wide-gamut video. Ordinary Y'CbCr derives
 * luma from RGB values that have already been gamma-encoded, which lets highly
 * saturated colors leak into the luma channel and distort perceived brightness — a
 * problem that grows more visible with the wider gamuts and higher dynamic range
 * BT.2020 and BT.2100 target. YcCbcCrc avoids this by deriving luma from linear light
 * before applying the transfer curve, keeping brightness and chroma cleanly separated
 * even for the most saturated colors UHDTV and HDR can reproduce.
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.2020/en}
 * @year 2012
 * @by ITU-R
 * @use Constant-luminance luma/chroma encoding for UHDTV/HDR wide-gamut video (BT.2020/2100); current, less common than non-constant-luminance Y'CbCr.
 * @channel {Yc} 0 1 Constant-luminance luma
 * @channel {Cbc} -0.5 0.5 Blue-difference chroma
 * @channel {Crc} -0.5 0.5 Red-difference chroma
 * @method luma-chroma
 * @encoding linear
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Linear Rec.2020 RGB -> YcCbcCrc: Yc = Kr*R + Kg*G + Kb*B (BT.2020-2 Table 4
// coefficients) computed in linear light, then OETF-encoded; the Cbc/Crc chroma
// differences use BT.2020's piecewise normalisation rather than a simple halving.
import rec2020Linear from './rec2020-linear.js';
import { bt2020Encode as oetf, bt2020Decode as eotf } from '../transfers.js';

const yccbccrc = {
	name: 'yccbccrc',
	range: [[0, 1], [-0.5, 0.5], [-0.5, 0.5]]
};

// BT.2020-2 Table 4 (constant-luminance derivation)
const Kr = 0.2627, Kg = 0.6780, Kb = 0.0593;
const NBC = 1.9404, PBC = 1.5816, NRC = 1.7184, PRC = 0.9936;

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
