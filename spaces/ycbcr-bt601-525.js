/**
 * ITU-R BT.601 Y′CbCr for 525-line systems — the studio-range digital component
 * encoding used by NTSC-derived standard-definition video. It combines the BT.601
 * luma coefficients Kr=0.299 and Kb=0.114 with SMPTE-C primaries and 8-bit legal
 * code ranges (Y′ 16–235, Cb/Cr 16–240).
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.601}
 * @wiki {@link https://en.wikipedia.org/wiki/YCbCr}
 * @year 1982
 * @by ITU-R (CCIR)
 * @use Unambiguous 525-line/NTSC-family BT.601 limited-range Y′CbCr for SD video.
 * @channel {Y} 16 235 Luma code value
 * @channel {Cb} 16 240 Blue-difference chroma code value
 * @channel {Cr} 16 240 Red-difference chroma code value
 * @method luma-chroma
 * @encoding gamma
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import smpteC from './smpte-c.js';

const space = { name: 'ycbcr-bt601-525', range: [[16, 235], [16, 240], [16, 240]] };
const Kr = 0.299, Kb = 0.114, Kg = 1 - Kr - Kb;

smpteC[space.name] = (r, g, b) => {
	const y = Kr * r + Kg * g + Kb * b;
	return [16 + 219 * y, 128 + 112 * (b - y) / (1 - Kb), 128 + 112 * (r - y) / (1 - Kr)];
};

space[smpteC.name] = (y, cb, cr) => {
	const Y = (y - 16) / 219, Pb = (cb - 128) / 224, Pr = (cr - 128) / 224;
	const r = Y + 2 * (1 - Kr) * Pr, b = Y + 2 * (1 - Kb) * Pb;
	return [r, (Y - Kr * r - Kb * b) / Kg, b];
};

export default space;
