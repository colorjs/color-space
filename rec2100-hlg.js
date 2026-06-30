/**
 * Rec. 2100 with HLG (Hybrid Log-Gamma) transfer function
 *
 * ITU-R BT.2100 HDR with HLG OETF for broadcast
 * Backward compatible with SDR displays
 *
 * @channel {R} 0 1 Red (HLG encoded)
 * @channel {G} 0 1 Green (HLG encoded)
 * @channel {B} 0 1 Blue (HLG encoded)
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic hdr
 */
import rec2020Linear from './rec2020-linear.js';
import xyz from './xyz.js';

const rec2100hlg = {
	name: 'rec2100-hlg'
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
