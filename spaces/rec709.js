/**
 * Rec. 709 — the ITU-R BT.709 standard for HDTV primaries and transfer function. It has the
 * same primaries and D65 white as sRGB; only the curve differs, a camera OETF made for
 * broadcast cameras instead of computer displays.
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.709}
 * @wiki {@link https://en.wikipedia.org/wiki/Rec._709}
 * @year 1990
 * @by ITU-R (CCIR)
 * @use HD video production and broadcast.
 * @aka BT.709; ITU-R BT.709
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding gamma
 * @gamut srgb
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import lrgb from './lrgb.js';
import { bt709Encode, bt709Decode } from '../transfers.js';

const rec709 = {
	name: 'rec709',
	range: [[0, 1], [0, 1], [0, 1]]
};

// BT.709 shares sRGB primaries/white, so linear light = linear sRGB; only the OETF differs
rec709.lrgb = (r, g, b) => [bt709Decode(r), bt709Decode(g), bt709Decode(b)];
lrgb.rec709 = (r, g, b) => [bt709Encode(r), bt709Encode(g), bt709Encode(b)];

export default rec709;
