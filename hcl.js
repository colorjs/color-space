/**
 * HCL Color Space
 * http://www.chilliant.com/rgb2hsv.html
 * https://en.wikipedia.org/wiki/HCL_color_space
 *
 * Note: This is the cylindrical representation from the Chilliant implementation,
 * not to be confused with CIE LCh (which is also sometimes called HCL).
 *
 * @module color-space/hcl
 *
 * @see {@link http://www.chilliant.com/rgb2hsv.html}
 * @channel {H} 0 360 Hue
 * @channel {C} 0 100 Chroma
 * @channel {L} 0 100 Luminance
 * @referred display
 * @dynamic sdr
 */
import rgb from './rgb.js';

const HCLgamma = 3;
const HCLy0 = 100;
const HCLmaxL = 0.530454533953517; // exp(HCLgamma / HCLy0) - 0.5
const PI = Math.PI;
const Epsilon = 1e-10;
const frac = (x) => x - Math.floor(x); // mathematical fractional part (always >= 0), not JS %

const hcl = {
	name: 'hcl',
	range: [[0, 360], [0, 100], [0, 100]]
};

/**
 * HCL to RGB
 */
hcl.rgb = (h, c, l) => {
	// Normalize from conventional ranges
	h = h / 360;
	c = c / 100;
	l = l / 100;

	if (l === 0) return [0, 0, 0];

	const L = l * HCLmaxL;
	const Q = Math.exp((1 - c / (2 * L)) * (HCLgamma / HCLy0));
	const U = (2 * L - c) / (2 * Q - 1);
	const V = c / Q;
	const A = (h + Math.min(frac(2 * h) / 4, frac(-2 * h) / 8)) * PI * 2;

	let rgb = [0, 0, 0];
	let T;
	const H = h * 6;

	if (H <= 0.999) {
		T = Math.tan(A);
		rgb[0] = 1;
		rgb[1] = T / (1 + T);
	} else if (H <= 1.001) {
		rgb[0] = 1;
		rgb[1] = 1;
	} else if (H <= 2) {
		T = Math.tan(A);
		rgb[0] = (1 + T) / T;
		rgb[1] = 1;
	} else if (H <= 3) {
		T = Math.tan(A);
		rgb[1] = 1;
		rgb[2] = 1 + T;
	} else if (H <= 3.999) {
		T = Math.tan(A);
		rgb[1] = 1 / (1 + T);
		rgb[2] = 1;
	} else if (H <= 4.001) {
		rgb[1] = 0;
		rgb[2] = 1;
	} else if (H <= 5) {
		T = Math.tan(A);
		rgb[0] = -1 / T;
		rgb[2] = 1;
	} else {
		T = Math.tan(A);
		rgb[0] = 1;
		rgb[2] = -T;
	}

	return [
		(rgb[0] * V + U) * 255,
		(rgb[1] * V + U) * 255,
		(rgb[2] * V + U) * 255
	];
};

/**
 * RGB to HCL
 */
rgb.hcl = (r, g, b) => {
	// Normalize RGB from 0-255 to 0-1
	r = r / 255;
	g = g / 255;
	b = b / 255;

	let H = 0;
	const U = Math.min(r, g, b);
	const V = Math.max(r, g, b);
	let Q = HCLgamma / HCLy0;

	const C = V - U;

	if (C !== 0) {
		H = Math.atan2(g - b, r - g) / PI;
		Q *= U / V;
	}

	Q = Math.exp(Q);
	H = frac(H / 2 - Math.min(frac(H), frac(-H)) / 6);

	const C_adjusted = C * Q;
	// Chilliant: L = mix(-U, V, Q) = (V + U)·Q - U (white -> exactly 1; was (V-U)·Q + U, a mis-port)
	const L = ((V + U) * Q - U) / (HCLmaxL * 2);

	// Scale to conventional ranges
	return [H * 360, C_adjusted * 100, L * 100];
};

export default hcl;
