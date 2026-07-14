/**
 * ITU-R BT.709 Y′CbCr — the explicit studio-range digital component encoding for
 * HDTV. Unlike the legacy parameterised `ycbcr` node, this space fixes the standard:
 * BT.709 primaries/OETF, Kr=0.2126, Kb=0.0722, and 8-bit legal ranges Y′ 16–235,
 * Cb/Cr 16–240.
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.709}
 * @wiki {@link https://en.wikipedia.org/wiki/YCbCr}
 * @year 1990
 * @by ITU-R
 * @use Unambiguous BT.709 limited-range Y′CbCr for HDTV production, broadcast, and codecs.
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
import rec709 from './rec709.js';

const space = { name: 'ycbcr-bt709', range: [[16, 235], [16, 240], [16, 240]] };
const Kr = 0.2126, Kb = 0.0722, Kg = 1 - Kr - Kb;

rec709[space.name] = (r, g, b) => {
	const y = Kr * r + Kg * g + Kb * b;
	return [16 + 219 * y, 128 + 112 * (b - y) / (1 - Kb), 128 + 112 * (r - y) / (1 - Kr)];
};

space[rec709.name] = (y, cb, cr) => {
	const Y = (y - 16) / 219, Pb = (cb - 128) / 224, Pr = (cr - 128) / 224;
	const r = Y + 2 * (1 - Kr) * Pr, b = Y + 2 * (1 - Kb) * Pb;
	return [r, (Y - Kr * r - Kb * b) / Kg, b];
};

export default space;
