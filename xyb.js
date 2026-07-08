/**
 * XYB is the internal color space of JPEG XL, the royalty-free image format designed
 * as a modern successor to JPEG for both lossy and lossless compression. Rather than
 * building on broadcast-derived YCbCr like its predecessor, XYB is modeled on the
 * eye's LMS cone responses, split into a red-green channel (X), a luminance channel
 * (Y), and a blue-yellow channel (B), then compressed with a perceptually motivated
 * power law so encoding error can be concentrated where vision is least sensitive to
 * it. It is not meant for authoring or display — images are still edited and viewed
 * in ordinary RGB — but is what the JPEG XL codec actually compresses under the hood.
 *
 * @see {@link https://arxiv.org/abs/1908.03565}
 * @wiki {@link https://en.wikipedia.org/wiki/LMS_color_space#Image_processing}
 * @year 2019
 * @by Jyrki Alakuijala et al. (Google)
 * @use Internal perceptual color space of the JPEG XL codec; current, used under the hood, not for authoring.
 * @channel {X} -0.0154 0.0281 Red-green
 * @channel {Y} 0 0.8453 Luminance
 * @channel {B} -0.2778 0.388 Blue
 * @referred display
 * @dynamic sdr
 */
// Implementation notes:
// Transfer function uses a perceptual gamma of 3 (cube-root forward, cube inverse),
// biased by a small additive constant so it stays well-defined near zero. Ported from
// culori's implementation.

import rgb from './rgb.js';
import lrgb from './lrgb.js';

// XYB constants
const bias = 0.00379307325527544933;
const bias_cbrt = Math.cbrt(bias);

const xyb = {
	name: 'xyb',
	min: [-0.0154, 0, -0.2778],
	max: [0.0281, 0.8453, 0.388],
	channel: ['x', 'y', 'b'],

	// Range documentation (not used in conventional v3)
	range: [[-0.0154, 0.0281], [0, 0.8453], [-0.2778, 0.388]],

	xyz: function(x, y, b) {
		return rgb.xyz(...xyb.rgb(x, y, b));
	},

	rgb: function(x, y, b) {
		x = x !== undefined ? x : 0;
		y = y !== undefined ? y : 0;
		b = b !== undefined ? b : 0;

		// Inverse transfer function (gamma = 3)
		const transfer = v => Math.pow(v + bias_cbrt, 3);

		// Reconstruct LMS
		const l = transfer(x + y) - bias;
		const m = transfer(y - x) - bias;
		// Account for chroma from luma: add Y back to B
		const s = transfer(b + y) - bias;

		// LMS to linear RGB
		const lrgbR =
			11.031566904639861 * l -
			9.866943908131562 * m -
			0.16462299650829934 * s;
		const lrgbG =
			-3.2541473810744237 * l +
			4.418770377582723 * m -
			0.16462299650829934 * s;
		const lrgbB =
			-3.6588512867136815 * l +
			2.7129230459360922 * m +
			1.9459282407775895 * s;

		// Linear RGB to sRGB (gamma correction)
		return lrgb.rgb(lrgbR, lrgbG, lrgbB);
	}
};

// Add RGB input support
rgb.xyb = function(r, g, b) {
	// sRGB to linear RGB
	const [lrgbR, lrgbG, lrgbB] = rgb.lrgb(r, g, b);

	// Forward transfer function (cube root, gamma = 1/3)
	const transfer = v => Math.cbrt(v) - bias_cbrt;

	// Linear RGB to LMS (with bias)
	const l = transfer(0.3 * lrgbR + 0.622 * lrgbG + 0.078 * lrgbB + bias);
	const m = transfer(0.23 * lrgbR + 0.692 * lrgbG + 0.078 * lrgbB + bias);
	const s = transfer(
		0.24342268924547819 * lrgbR +
		0.20476744424496821 * lrgbG +
		0.5518098665095536 * lrgbB +
		bias
	);

	// LMS to XYB
	const xybX = (l - m) / 2;
	const xybY = (l + m) / 2;
	// Apply default chroma from luma (subtract Y from B)
	const xybB = s - xybY;

	return [xybX, xybY, xybB];
};

export default xyb;
