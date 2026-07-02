/**
 * Rec. 2100 HLG — ITU-R BT.2100's other HDR transfer function, Hybrid Log-Gamma,
 * developed jointly by the BBC and NHK for broadcast. Where PQ encodes absolute
 * luminance, HLG stays scene-referred and backward compatible: it behaves like ordinary
 * gamma near black and switches to a logarithmic curve for highlights, so an unmodified
 * SDR display can still render a reasonable picture without any metadata. It's the
 * format of choice for live HDR broadcast.
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.2100}
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

const rec2100hlg = {
	name: 'rec2100-hlg',
	range: [[0, 1], [0, 1], [0, 1]]
};

const a = 0.17883277;
const b = 0.28466892;
const c = 0.55991073;
// normalize so HLG diffuse white (signal 0.75) maps to scene-linear 1.0
const scale = 12 / (Math.exp((0.75 - c) / a) + b); // = 3.774118…

function toLinear(val) {
	// HLG -> Linear
	if (val <= 0.5) {
		return (Math.pow(val, 2) / 3) * scale;
	}
	return ((Math.exp((val - c) / a) + b) / 12) * scale;
}

function fromLinear(val) {
	// Linear -> HLG
	val /= scale;
	if (val <= 1 / 12) {
		return Math.sqrt(3 * val);
	}
	return a * Math.log(12 * val - b) + c;
}

rec2100hlg.xyz = (r, g, b) => {
	return rec2020Linear.xyz(toLinear(r), toLinear(g), toLinear(b));
}

xyz[rec2100hlg.name] = (x, y, z) => {
	const [lr, lg, lb] = xyz['rec2020-linear'](x, y, z);
	return [fromLinear(lr), fromLinear(lg), fromLinear(lb)];
}

export default rec2100hlg;
