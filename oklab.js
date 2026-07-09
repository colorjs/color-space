/**
 * Oklab is Björn Ottosson's 2020 perceptual color space, created as a practical
 * replacement for CIELAB in graphics and design work. It models color starting from
 * how the eye's cone cells respond to light, then reshapes that signal so equal
 * numeric steps correspond to equal perceived change in lightness, hue and chroma.
 * That uniformity avoids the hue drift and desaturation that CIELAB and HSL produce
 * when interpolating between colors, which is why Oklab now underlies CSS Color 4's
 * oklab() and oklch() functions and much of the tooling built for gradients and
 * palette generation.
 *
 * @see {@link https://bottosson.github.io/posts/oklab/}
 * @wiki {@link https://en.wikipedia.org/wiki/Oklab_color_space}
 * @year 2020
 * @by Björn Ottosson
 * @use Perceptual color space for gradients and design tooling; current, underlies CSS Color 4's oklab()/oklch().
 * @channel {L} 0 1 Lightness
 * @channel {a} -0.4 0.4 Green-Red axis
 * @channel {b} -0.4 0.4 Blue-Yellow axis
 * @method opponent
 * @encoding perceptual
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';
import rgb from './rgb.js';
import lrgb from './lrgb.js';

const oklab = {
	name: 'oklab',
	range: [[0, 1], [-0.4, 0.4], [-0.4, 0.4]]
};

oklab.rgb = (l, a, b) => {
	// Input: native Oklab (L 0-1, a/b ±0.4)
	// 1. Oklab -> LMS'
	const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
	const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
	const s_ = l - 0.0894841775 * a - 1.291485548 * b;

	// 2. cube -> linear LMS
	const l3 = l_ ** 3;
	const m3 = m_ ** 3;
	const s3 = s_ ** 3;

	// 3. LMS -> linear sRGB, then gamma-encode + scale to 0-255 via lrgb
	return lrgb.rgb(
		4.0767416621 * l3 - 3.307711591 * m3 + 0.2309699292 * s3,
		-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
		-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3
	);
};

rgb.oklab = (r, g, b) => {
	// sRGB (0-255, gamma-encoded) -> linear sRGB (0-1)
	const [lr, lg, lb] = rgb.lrgb(r, g, b);

	// linear sRGB -> LMS (Ottosson M1)
	const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
	const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
	const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

	// LMS -> LMS' (cube root)
	const l_ = Math.cbrt(l);
	const m_ = Math.cbrt(m);
	const s_ = Math.cbrt(s);

	// LMS' -> Oklab (native: L 0-1, a/b ±0.4)
	return [
		0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
		1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
		0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
	];
};

// D65
oklab.xyz = (l, a, b) => {
	// Input: native Oklab (L 0-1, a/b ±0.4); output XYZ 0-100
	// 1. Convert Oklab to linear LMS
	const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
	const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
	const s_ = l - 0.0894841775 * a - 1.291485548 * b;

	// 2. Cube the values
	const l3 = l_ * l_ * l_;
	const m3 = m_ * m_ * m_;
	const s3 = s_ * s_ * s_;

	// 3. Convert LMS to XYZ (0-1), then scale to 0-100
	// Inverse M1
	const xyz = [
		1.2270138511 * l3 - 0.5577999807 * m3 + 0.2812561490 * s3,
		-0.0405801784 * l3 + 1.1122568696 * m3 - 0.0716766787 * s3,
		-0.0763812845 * l3 - 0.4214819784 * m3 + 1.5861632204 * s3
	];

	return xyz.map(v => v * 100);
}

xyz.oklab = (x, y, z) => {
	// Input: XYZ 0-100; output native Oklab (L 0-1, a/b ±0.4)
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

	return [l, a, b];
};

export default oklab;
