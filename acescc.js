/**
 * ACEScc color space (Academy Color Encoding System)
 *
 * Logarithmic encoding for color grading in cinema
 * Reference for film post-production
 *
 * @channel {R} -0.358 1.468 Red (log encoded)
 * @channel {G} -0.358 1.468 Green (log encoded)
 * @channel {B} -0.358 1.468 Blue (log encoded)
 */
import acescg from './acescg.js';
import xyz from './xyz.js';

const acescc = {
	name: 'acescc'
};

const eps = Math.pow(2, -16);
const low = (9.72 - 15) / 17.52;

function toLinear(val) {
	// ACEScc (Log) -> ACEScg (Linear)
	if (val <= low) {
		return (Math.pow(2, val * 17.52 - 9.72) - eps) * 2;
	} else if (val < 1.468) {
		return Math.pow(2, val * 17.52 - 9.72);
	} else {
		return 65504;
	}
}

function fromLinear(val) {
	// ACEScg (Linear) -> ACEScc (Log)
	if (val <= 0) {
		return (Math.log2(eps) + 9.72) / 17.52;
	} else if (val < eps) {
		return (Math.log2(eps + val * 0.5) + 9.72) / 17.52;
	} else {
		return (Math.log2(val) + 9.72) / 17.52;
	}
}

acescc.xyz = (r, g, b) => {
	// ACEScc -> ACEScgLinear -> XYZ
	// Reuse acescg.xyz logic by passing linear values
	return acescg.xyz(toLinear(r), toLinear(g), toLinear(b));
}

xyz.acescc = (x, y, z) => {
	// XYZ -> ACEScgLinear -> ACEScc
	const [r, g, b] = xyz.acescg(x, y, z);
	return [fromLinear(r), fromLinear(g), fromLinear(b)];
}

export default acescc;
