/**
 * ITU-R BT.2020 non-constant-luminance Y′CbCr — the explicit studio-range digital
 * component encoding for UHDTV. It uses Rec.2020 primaries/OETF, Kr=0.2627,
 * Kb=0.0593, and 8-bit legal ranges Y′ 16–235, Cb/Cr 16–240. This is the common
 * non-constant-luminance form, distinct from the library's `yccbccrc` constant-
 * luminance representation.
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.2020}
 * @wiki {@link https://en.wikipedia.org/wiki/Rec._2020}
 * @year 2012
 * @by ITU-R
 * @use Unambiguous BT.2020 non-constant-luminance limited-range Y′CbCr for UHDTV and wide-gamut codecs.
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
import rec2020 from './rec2020.js';

const space = { name: 'ycbcr-bt2020', range: [[16, 235], [16, 240], [16, 240]] };
const Kr = 0.2627, Kb = 0.0593, Kg = 1 - Kr - Kb;

rec2020[space.name] = (r, g, b) => {
	const y = Kr * r + Kg * g + Kb * b;
	return [16 + 219 * y, 128 + 112 * (b - y) / (1 - Kb), 128 + 112 * (r - y) / (1 - Kr)];
};

space[rec2020.name] = (y, cb, cr) => {
	const Y = (y - 16) / 219, Pb = (cb - 128) / 224, Pr = (cr - 128) / 224;
	const r = Y + 2 * (1 - Kr) * Pr, b = Y + 2 * (1 - Kb) * Pb;
	return [r, (Y - Kr * r - Kb * b) / Kg, b];
};

export default space;
