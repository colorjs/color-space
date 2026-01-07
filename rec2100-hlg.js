import rec2020Linear from './rec2020-linear.js';
import xyz from './xyz.js';

const rec2100hlg = {
	name: 'rec2100hlg',
	channel: ['red', 'green', 'blue']
};

const a = 0.17883277;
const b = 0.28466892;
const c = 0.55991073;
const scale = 3.7743;

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

xyz.rec2100hlg = (x, y, z) => {
	const [lr, lg, lb] = xyz.rec2020Linear(x, y, z);
	return [fromLinear(lr), fromLinear(lg), fromLinear(lb)];
}

export default rec2100hlg;
