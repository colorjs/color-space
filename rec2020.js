/**
 * Rec. 2020 color space
 *
 * ITU-R BT.2020 standard for UHDTV/4K. Wide-gamut RGB with the BT.2020 transfer
 * function (same piecewise form as BT.709). Uses the CSS `color(rec2020 …)`
 * convention: channels 0-1, not 0-255.
 *
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @illuminant D65
 * @observer 2
 */
import rec2020Linear from './rec2020-linear.js';
import xyz from './xyz.js';

const rec2020 = {
	name: 'rec2020'
};

// ITU-R BT.2020 Table 4 (full precision)
const α = 1.09929682680944;
const β = 0.018053968510807;

// gamma-encoded signal -> linear light
const decode = (v) => {
	const s = Math.sign(v), a = Math.abs(v);
	return s * (a < β * 4.5 ? a / 4.5 : Math.pow((a + α - 1) / α, 1 / 0.45));
};

// linear light -> gamma-encoded signal
const encode = (v) => {
	const s = Math.sign(v), a = Math.abs(v);
	return s * (a < β ? 4.5 * a : α * Math.pow(a, 0.45) - (α - 1));
};

rec2020.xyz = (r, g, b) => rec2020Linear.xyz(decode(r), decode(g), decode(b));

xyz.rec2020 = (x, y, z) => {
	const [lr, lg, lb] = xyz['rec2020-linear'](x, y, z);
	return [encode(lr), encode(lg), encode(lb)];
};

export default rec2020;
