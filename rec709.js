/**
 * Rec. 709 — the ITU-R BT.709 standard defining the color primaries and transfer
 * function for HDTV. It shares sRGB's red-green-blue primaries and D65 white point,
 * differing only in a camera-oriented transfer curve (OETF) designed for broadcast
 * cameras rather than computer displays. It remains the reference gamut for HD video
 * production and broadcast.
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.709}
 * @wiki {@link https://en.wikipedia.org/wiki/Rec._709}
 * @year 1990
 * @by ITU-R (CCIR)
 * @use Reference gamut/transfer curve for HD video production and broadcast; current HDTV standard.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import lrgb from './lrgb.js';
import { bt709Encode, bt709Decode } from './transfers.js';

const rec709 = {
	name: 'rec709',
	range: [[0, 1], [0, 1], [0, 1]]
};

// BT.709 shares sRGB primaries/white, so linear light = linear sRGB; only the OETF differs
rec709.lrgb = (r, g, b) => [bt709Decode(r), bt709Decode(g), bt709Decode(b)];
lrgb.rec709 = (r, g, b) => [bt709Encode(r), bt709Encode(g), bt709Encode(b)];

export default rec709;
