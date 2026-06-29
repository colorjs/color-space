/**
 * Rec. 2100 with PQ (Perceptual Quantizer) transfer function
 *
 * ITU-R BT.2100 HDR (4K/8K) with PQ OETF
 * Used for HDR broadcast and streaming
 *
 * @channel {R} 0 1 Red (PQ encoded)
 * @channel {G} 0 1 Green (PQ encoded)
 * @channel {B} 0 1 Blue (PQ encoded)
 * @illuminant D65
 * @observer 2
 */
import rec2020Linear from './rec2020-linear.js';
import xyz from './xyz.js';

const rec2100pq = {
	name: 'rec2100pq'
};

const Yw = 203; // absolute luminance of media white, cd/m²
const n = 2610 / Math.pow(2, 14);
const ninv = Math.pow(2, 14) / 2610;
const m = 2523 / Math.pow(2, 5);
const minv = Math.pow(2, 5) / 2523;
const c1 = 3424 / Math.pow(2, 12);
const c2 = 2413 / Math.pow(2, 7);
const c3 = 2392 / Math.pow(2, 7);

function toLinear(val) {
	// PQ -> Linear
	const x = Math.pow(Math.max(Math.pow(val, minv) - c1, 0) / (c2 - c3 * Math.pow(val, minv)), ninv);
	return (x * 10000) / Yw;
}

function fromLinear(val) {
	// Linear -> PQ
	const x = Math.max((val * Yw) / 10000, 0);
	const num = c1 + c2 * Math.pow(x, n);
	const denom = 1 + c3 * Math.pow(x, n);
	return Math.pow(num / denom, m);
}

rec2100pq.xyz = (r, g, b) => {
	return rec2020Linear.xyz(toLinear(r), toLinear(g), toLinear(b));
}

xyz.rec2100pq = (x, y, z) => {
	const [lr, lg, lb] = xyz['rec2020-linear'](x, y, z);
	return [fromLinear(lr), fromLinear(lg), fromLinear(lb)];
}

export default rec2100pq;
