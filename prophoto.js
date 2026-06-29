/**
 * ProPhoto RGB color space
 *
 * Largest gamut RGB color space designed for professional photography
 * References D50 white point
 *
 * @channel {R} 0 1 Red
 * @channel {G} 0 1 Green
 * @channel {B} 0 1 Blue
 * @illuminant D50
 * @observer 2
 */
import prophotoLinear from './prophoto-linear.js';
import xyz from './xyz.js';

const prophoto = {
	name: 'prophoto'
};

const Et = 1 / 512;
const Et2 = 16 / 512;

function toLinear(val) {
	const sign = val < 0 ? -1 : 1;
	const abs = Math.abs(val);
	if (abs < Et2) {
		return val / 16;
	}
	return sign * Math.pow(abs, 1.8);
}

function fromLinear(val) {
	const sign = val < 0 ? -1 : 1;
	const abs = Math.abs(val);
	if (abs >= Et) {
		return sign * Math.pow(abs, 1 / 1.8);
	}
	return 16 * val;
}

prophoto.xyz = (r, g, b) => {
	return prophotoLinear.xyz(toLinear(r), toLinear(g), toLinear(b));
}

xyz.prophoto = (x, y, z) => {
	const [lr, lg, lb] = xyz['prophoto-linear'](x, y, z);
	return [fromLinear(lr), fromLinear(lg), fromLinear(lb)];
}

export default prophoto;
