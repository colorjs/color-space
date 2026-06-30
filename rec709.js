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

const rec709 = {
	name: 'rec709',
	range: [[0, 1], [0, 1], [0, 1]]
};

// BT.709 OETF: linear -> signal
const encode = (v) => {
	const s = v < 0 ? -1 : 1, a = Math.abs(v);
	return s * (a < 0.018 ? 4.5 * a : 1.099 * Math.pow(a, 0.45) - 0.099);
};
// inverse OETF: signal -> linear
const decode = (v) => {
	const s = v < 0 ? -1 : 1, a = Math.abs(v);
	return s * (a < 0.081 ? a / 4.5 : Math.pow((a + 0.099) / 1.099, 1 / 0.45));
};

rec709.lrgb = (r, g, b) => [decode(r), decode(g), decode(b)];
lrgb.rec709 = (r, g, b) => [encode(r), encode(g), encode(b)];

export default rec709;
