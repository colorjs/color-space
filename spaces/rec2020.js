/**
 * Rec. 2020 — the ITU-R BT.2020 standard for the gamut and transfer function of
 * ultra-high-definition television. Its curve keeps Rec. 709's piecewise shape; its far wider
 * primaries, close to the limits of human vision, are the target for 4K and 8K broadcast and
 * streaming.
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.2020}
 * @wiki {@link https://en.wikipedia.org/wiki/Rec._2020}
 * @year 2012
 * @by ITU-R
 * @use The standard gamut for 4K/8K UHDTV broadcast and HDR.
 * @aka BT.2020; ITU-R BT.2020
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding gamma
 * @gamut rec2020
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import rec2020Linear from './rec2020-linear.js';
import xyz from './xyz.js';
import { bt2020Encode as encode, bt2020Decode as decode } from '../transfers.js';

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
