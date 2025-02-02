/**
 * OKLab
 * https://bottosson.github.io/posts/oklab/
 *
 * @module color-space/oklab
 */

import xyz from './xyz.js';
import rgb from './rgb.js';

const oklab = {
	name: 'oklab',
	min: [0, -0.4, -0.4],
	max: [1, 0.4, 0.4],
	channel: ['lightness', 'a', 'b']
};

export default oklab;

oklab.rgb = ([l, a, b]) => {
	// Step 1: Convert Oklab to linear LMS
	const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
	const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
	const s_ = l - 0.0894841775 * a - 1.291485548 * b;

	// Step 2: Cube the values (reverse of cube root)
	const l3 = l_ ** 3;
	const m3 = m_ ** 3;
	const s3 = s_ ** 3;

	// Step 3: Convert LMS to RGB with CORRECTED inverse matrix
	return [
		(4.0767416621 * l3 - 3.307711591 * m3 + 0.2309699292 * s3) * 255,
		(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3) * 255,
		(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3) * 255
	];
};

rgb.oklab = ([r, g, b]) => {
	r /= 255, g /= 255, b /= 255

	// Original RGB to LMS matrix coefficients
	const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
	const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
	const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

	// Cube root the LMS values
	const l_ = Math.cbrt(l);
	const m_ = Math.cbrt(m);
	const s_ = Math.cbrt(s);

	// Convert LMS to Oklab using direct coefficients
	return [
		0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,  // L
		1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,  // a
		0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_   // b
	];
};

// TODO: add xyz transform
// // D65
// oklab.xyz = (lab) => m3x3_mul(
// 	[
// 		1.2270138511035211, -0.04058017842328059, -0.0763812845057069,
// 		-0.5577999806518222, 1.1122568696168302, -0.4214819784180127,
// 		0.28125614896646783, -0.07167667866560119, 1.586163220440795,
// 	],
// 	powN3(
// 		m3x3_mul(
// 			[
// 				0.9999999984505198, 1.0000000088817607, 1.0000000546724108,
// 				0.3963377921737678, -0.10556134232365633, -0.08948418209496575,
// 				0.21580375806075877, -0.06385417477170588, -1.2914855378640917,
// 			],
// 			lab
// 		),
// 	3)
// )

// xyz.oklab = ([x, y, z]) => {
// 	// 1. Convert from xyz to LMS.
// 	const L = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z);
// 	const M = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z);
// 	const S = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z);

// 	// 2. Convert to OKLab via a linear transformation.
// 	const l = 0.2104542553 * L + 0.7936177850 * M - 0.0040720468 * S;
// 	const a = 1.9779984951 * L - 2.4285922050 * M + 0.4505937099 * S;
// 	const b = 0.0259040371 * L + 0.7827717662 * M - 0.8086757660 * S;

// 	return [l, a, b];
// };
