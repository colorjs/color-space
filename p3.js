import p3Linear from './p3-linear.js';
import xyz from './xyz.js';

const p3 = {
	name: 'p3',
	channel: ['red', 'green', 'blue']
};

p3.xyz = (r, g, b) => {
	const sign_r = r < 0 ? -1 : 1, abs_r = Math.abs(r);
	const sign_g = g < 0 ? -1 : 1, abs_g = Math.abs(g);
	const sign_b = b < 0 ? -1 : 1, abs_b = Math.abs(b);
	return p3Linear.xyz(
		sign_r * (abs_r > 0.04045 ? Math.pow((abs_r + 0.055) / 1.055, 2.4) : abs_r / 12.92),
		sign_g * (abs_g > 0.04045 ? Math.pow((abs_g + 0.055) / 1.055, 2.4) : abs_g / 12.92),
		sign_b * (abs_b > 0.04045 ? Math.pow((abs_b + 0.055) / 1.055, 2.4) : abs_b / 12.92)
	);
}

xyz.p3 = (x, y, z) => {
	const [lr, lg, lb] = xyz.p3Linear(x, y, z);
	const sign_lr = lr < 0 ? -1 : 1, abs_lr = Math.abs(lr);
	const sign_lg = lg < 0 ? -1 : 1, abs_lg = Math.abs(lg);
	const sign_lb = lb < 0 ? -1 : 1, abs_lb = Math.abs(lb);
	return [
		sign_lr * (abs_lr > 0.0031308 ? 1.055 * Math.pow(abs_lr, 1/2.4) - 0.055 : abs_lr * 12.92),
		sign_lg * (abs_lg > 0.0031308 ? 1.055 * Math.pow(abs_lg, 1/2.4) - 0.055 : abs_lg * 12.92),
		sign_lb * (abs_lb > 0.0031308 ? 1.055 * Math.pow(abs_lb, 1/2.4) - 0.055 : abs_lb * 12.92)
	];
}

export default p3;
