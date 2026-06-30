/**
 * Rec. 709 color space
 *
 * ITU-R BT.709 HDTV: the same primaries and D65 white as sRGB, but with the
 * BT.709 camera transfer function (OETF) instead of the sRGB curve. The linear
 * light is identical to linear sRGB, so this connects through `lrgb`.
 *
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
