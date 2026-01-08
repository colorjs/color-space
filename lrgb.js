/**
 * Linear RGB space.
 * Linear RGB uses 0-1 range (standard)
 * sRGB uses 0-255 range
 *
 * @module color-space/lrgb
 */
import rgb from './rgb.js';

const lrgb = {
	name: 'lrgb',
	channel: ['red', 'green', 'blue'],
	range: [[0, 1], [0, 1], [0, 1]]
};

rgb.lrgb = (r, g, b) => {
	// Scale from 0-255 to 0-1 first
	r = r / 255;
	g = g / 255;
	b = b / 255;

	const sign_r = r < 0 ? -1 : 1, abs_r = Math.abs(r);
	const sign_g = g < 0 ? -1 : 1, abs_g = Math.abs(g);
	const sign_b = b < 0 ? -1 : 1, abs_b = Math.abs(b);
	return [
		sign_r * (abs_r > 0.04045 ? Math.pow((abs_r + 0.055) / 1.055, 2.4) : abs_r / 12.92),
		sign_g * (abs_g > 0.04045 ? Math.pow((abs_g + 0.055) / 1.055, 2.4) : abs_g / 12.92),
		sign_b * (abs_b > 0.04045 ? Math.pow((abs_b + 0.055) / 1.055, 2.4) : abs_b / 12.92),
	]
}

lrgb.rgb = (r, g, b) => {
	const sign_r = r < 0 ? -1 : 1, abs_r = Math.abs(r);
	const sign_g = g < 0 ? -1 : 1, abs_g = Math.abs(g);
	const sign_b = b < 0 ? -1 : 1, abs_b = Math.abs(b);
	// Convert to 0-1 sRGB, then scale to 0-255
	return [
		255 * (sign_r * (abs_r > 0.0031308 ? 1.055 * Math.pow(abs_r, 1/2.4) - 0.055 : abs_r * 12.92)),
		255 * (sign_g * (abs_g > 0.0031308 ? 1.055 * Math.pow(abs_g, 1/2.4) - 0.055 : abs_g * 12.92)),
		255 * (sign_b * (abs_b > 0.0031308 ? 1.055 * Math.pow(abs_b, 1/2.4) - 0.055 : abs_b * 12.92)),
	];
};


export default lrgb;
