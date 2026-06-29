/**
 * Rec. 2020 OETF color space
 *
 * Rec. 2020 with OETF (Opto-Electronic Transfer Function)
 * Standard for HD television (Rec. 709 variant)
 *
 * @channel {R} 0 1 Red (gamma corrected)
 * @channel {G} 0 1 Green (gamma corrected)
 * @channel {B} 0 1 Blue (gamma corrected)
 * @illuminant D65
 * @observer 2
 */
import rec2020Linear from './rec2020-linear.js';
import xyz from './xyz.js';

const rec2020oetf = {
	name: 'rec2020-oetf'
};

const alpha = 1.099;
const beta = 0.018;
const alphaMinus1 = alpha - 1;

function toLinear(val) {
	// OETF -> Linear
	const sign = val < 0 ? -1 : 1;
	const abs = Math.abs(val);
	// Inverting the OETF
	if (abs < beta * 4.5) { // Threshold in OETF?
		// Linear threshold is beta (0.018). OETF threshold is 4.5 * 0.018 = 0.081
		return sign * (abs / 4.5);
	}
	return sign * Math.pow((abs + alphaMinus1) / alpha, 1 / 0.45);
}

function fromLinear(val) {
	// Linear -> OETF
	const sign = val < 0 ? -1 : 1;
	const abs = Math.abs(val);
	if (abs < beta) {
		return sign * (4.5 * abs);
	}
	return sign * (alpha * Math.pow(abs, 0.45) - alphaMinus1);
}

rec2020oetf.xyz = (r, g, b) => {
	return rec2020Linear.xyz(toLinear(r), toLinear(g), toLinear(b));
}

xyz.rec2020oetf = (x, y, z) => {
	const [lr, lg, lb] = xyz['rec2020-linear'](x, y, z);
	return [fromLinear(lr), fromLinear(lg), fromLinear(lb)];
}

export default rec2020oetf;
