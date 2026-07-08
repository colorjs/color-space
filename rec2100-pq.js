/**
 * Rec. 2100 PQ — the HDR RGB encoding from ITU-R BT.2100, pairing Rec. 2020's wide-gamut
 * primaries with the PQ (Perceptual Quantizer) transfer function, SMPTE ST 2084,
 * originally developed by Dolby. Unlike SDR gamma, PQ encodes absolute scene luminance
 * directly, so a given code value always means the same brightness regardless of a
 * display's peak brightness. It's the transfer function behind HDR10 and most HDR video
 * streaming and mastering pipelines.
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.2100}
 * @wiki {@link https://en.wikipedia.org/wiki/Rec._2100}
 * @year 2016
 * @by Dolby / ITU-R
 * @use Absolute-luminance HDR encoding behind HDR10 and most HDR streaming/mastering; current, dominant.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic hdr
 */
import rec2020Linear from './rec2020-linear.js';
import xyz from './xyz.js';
import { pqST2084Encode, pqST2084Decode } from './transfers.js';

const rec2100pq = {
	name: 'rec2100-pq',
	range: [[0, 1], [0, 1], [0, 1]]
};

const Yw = 203; // absolute luminance of media white, cd/m²
// relative linear <-> PQ signal, normalising absolute ST 2084 nits by media white
const toLinear = (v) => pqST2084Decode(v) / Yw;
const fromLinear = (v) => pqST2084Encode(v * Yw);

rec2100pq.xyz = (r, g, b) => {
	return rec2020Linear.xyz(toLinear(r), toLinear(g), toLinear(b));
}

xyz[rec2100pq.name] = (x, y, z) => {
	const [lr, lg, lb] = xyz['rec2020-linear'](x, y, z);
	return [fromLinear(lr), fromLinear(lg), fromLinear(lb)];
}

export default rec2100pq;
