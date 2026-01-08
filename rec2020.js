import rec2020Linear from './rec2020-linear.js';
import xyz from './xyz.js';

const rec2020 = {
	name: 'rec2020',
	channel: ['red', 'green', 'blue'],
	range: [[0, 255], [0, 255], [0, 255]]
};

rec2020.xyz = (r, g, b) => {
	return rec2020Linear.xyz(
		Math.sign(r) * Math.pow(Math.abs(r), 2.4),
		Math.sign(g) * Math.pow(Math.abs(g), 2.4),
		Math.sign(b) * Math.pow(Math.abs(b), 2.4)
	);
}

xyz.rec2020 = (x, y, z) => {
	const [lr, lg, lb] = xyz.rec2020Linear(x, y, z);
	return [
		Math.sign(lr) * Math.pow(Math.abs(lr), 1/2.4),
		Math.sign(lg) * Math.pow(Math.abs(lg), 1/2.4),
		Math.sign(lb) * Math.pow(Math.abs(lb), 1/2.4)
	];
}

export default rec2020;
