/**
 * Rec. 2020 — the ITU-R BT.2020 standard defining the color gamut and transfer
 * characteristics for ultra-high-definition television. It uses a transfer function
 * with the same piecewise shape as Rec. 709, but spans a dramatically wider set of
 * primaries that approach the outer limits of human color perception — the target
 * gamut for 4K and 8K UHD broadcast, streaming and HDR displays.
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.2020}
 * @wiki {@link https://en.wikipedia.org/wiki/Rec._2020}
 * @year 2012
 * @by ITU-R
 * @use Wide-gamut color space for UHDTV 4K/8K broadcast and HDR; current standard.
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
