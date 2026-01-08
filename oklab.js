import xyz from './xyz.js';
import rgb from './rgb.js';

const oklab = {
	name: 'oklab',
	channel: ['lightness', 'a', 'b'],
	range: [[0, 100], [-40, 40], [-40, 40]]
};

oklab.rgb = (l, a, b) => {
	// Input: L: 0-100, a: -40 to 40, b: -40 to 40
	// Normalize to 0-1 and -0.4 to 0.4
	l = l / 100;
	a = a / 100;
	b = b / 100;

	// Step 1: Convert Oklab to linear LMS
	const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
	const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
	const s_ = l - 0.0894841775 * a - 1.291485548 * b;

	// Step 2: Cube the values (reverse of cube root)
	const l3 = l_ ** 3;
	const m3 = m_ ** 3;
	const s3 = s_ ** 3;

	// Step 3: Convert LMS to RGB (0-1)
	const rgb = [
		(4.0767416621 * l3 - 3.307711591 * m3 + 0.2309699292 * s3),
		(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3),
		(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3)
	];

	// Scale to 0-255 and clamp to valid range
	return rgb.map(v => Math.max(0, Math.min(255, v * 255)));
};

rgb.oklab = (r, g, b) => {
	// Normalize from 0-255 to 0-1
	r = r / 255;
	g = g / 255;
	b = b / 255;

	// Original RGB to LMS matrix coefficients
	const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
	const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
	const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

	// Cube root the LMS values
	const l_ = Math.cbrt(l);
	const m_ = Math.cbrt(m);
	const s_ = Math.cbrt(s);

	// Convert LMS to Oklab using direct coefficients
	const oklab = [
		0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,  // L
		1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,  // a
		0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_   // b
	];

	// Scale to L: 0-100, a/b: -40 to 40
	return [oklab[0] * 100, oklab[1] * 100, oklab[2] * 100];
};

// D65
oklab.xyz = (l, a, b) => {
	// Input: L: 0-100, a: -40 to 40, b: -40 to 40
	// Normalize
	l = l / 100;
	a = a / 100;
	b = b / 100;

	// 1. Convert Oklab to linear LMS
	const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
	const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
	const s_ = l - 0.0894841775 * a - 1.291485548 * b;

	// 2. Cube the values
	const l3 = l_ * l_ * l_;
	const m3 = m_ * m_ * m_;
	const s3 = s_ * s_ * s_;

	// 3. Convert LMS to XYZ (0-1)
	// Inverse M1
	const xyz = [
		1.2270138511 * l3 - 0.5577999807 * m3 + 0.2812561490 * s3,
		-0.0405801784 * l3 + 1.1122568696 * m3 - 0.0716766787 * s3,
		-0.0763812845 * l3 - 0.4214819784 * m3 + 1.5861632204 * s3
	];

	// Scale to 0-100
	return xyz.map(v => v * 100);
}

xyz.oklab = (x, y, z) => {
	// Input: XYZ in 0-100 range
	// Normalize to 0-1
	x = x / 100;
	y = y / 100;
	z = z / 100;

	// 1. Convert from xyz to LMS.
	const L = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z);
	const M = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z);
	const S = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z);

	// 2. Convert to OKLab via a linear transformation.
	const l = 0.2104542553 * L + 0.7936177850 * M - 0.0040720468 * S;
	const a = 1.9779984951 * L - 2.4285922050 * M + 0.4505937099 * S;
	const b = 0.0259040371 * L + 0.7827717662 * M - 0.8086757660 * S;

	// Scale to L: 0-100, a/b: -40 to 40
	return [l * 100, a * 100, b * 100];
};

export default oklab;
