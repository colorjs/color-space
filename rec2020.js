/**
 * Rec. 2020 color space
 *
 * ITU-R BT.2020 standard for UHDTV/4K. Wide-gamut RGB with the BT.2020 transfer
 * function (same piecewise form as BT.709). Uses the CSS `color(rec2020 …)`
 * convention: channels 0-1, not 0-255.
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.2020}
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import rec2020Linear from './rec2020-linear.js';
import xyz from './xyz.js';
import { bt2020Encode as encode, bt2020Decode as decode } from './transfers.js';

const rec2020 = {
	name: 'rec2020',
	range: [[0, 1], [0, 1], [0, 1]]
};

rec2020.xyz = (r, g, b) => rec2020Linear.xyz(decode(r), decode(g), decode(b));

xyz.rec2020 = (x, y, z) => {
	const [lr, lg, lb] = xyz['rec2020-linear'](x, y, z);
	return [encode(lr), encode(lg), encode(lb)];
};

export default rec2020;
