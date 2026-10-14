/**
 * Rec. 2100 HLG — ITU-R BT.2100's other HDR transfer function, Hybrid Log-Gamma,
 * developed jointly by the BBC and NHK for broadcast. Where PQ encodes absolute
 * luminance, HLG stays scene-referred and backward compatible: it behaves like ordinary
 * gamma near black and switches to a logarithmic curve for highlights, so an unmodified
 * SDR display can still render a reasonable picture without any metadata. It's the
 * format of choice for live HDR broadcast.
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.2100}
 * @wiki {@link https://en.wikipedia.org/wiki/Hybrid_log-gamma}
 * @year 2016
 * @by BBC & NHK / ITU-R
 * @use Backward-compatible scene-referred HDR transfer function for live broadcast; current standard.
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @method transfer
 * @encoding hlg
 * @gamut rec2020
 * @illuminant D65
 * @observer 2
 * @referred scene
 * @dynamic hdr
 */
import rec2020Linear from './rec2020-linear.js';
import xyz from './xyz.js';
import { hlgEncode, hlgDecode } from '../transfers.js';

const rec2100hlg = {
	name: 'rec2100-hlg',
	range: [[0, 1], [0, 1], [0, 1]]
};

rec2100hlg.xyz = (r, g, b) => {
	return rec2020Linear.xyz(hlgDecode(r), hlgDecode(g), hlgDecode(b));
}

xyz[rec2100hlg.name] = (x, y, z) => {
	const [lr, lg, lb] = xyz['rec2020-linear'](x, y, z);
	return [hlgEncode(lr), hlgEncode(lg), hlgEncode(lb)];
}

export default rec2100hlg;
