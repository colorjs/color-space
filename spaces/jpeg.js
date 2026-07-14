/**
 * The full-range YCbCr color space defined for JPEG still-image compression (ITU-T
 * T.871 / JFIF), also called PC-range or full-swing YCbCr. Unlike broadcast YCbCr —
 * which reserves the extremes of its 8-bit range as headroom and footroom for analog
 * signal overshoot — JPEG YCbCr uses the full 0-255 range on all three channels,
 * matching how still images are stored and displayed on computers. Y carries luma
 * while Cb and Cr are blue-difference and red-difference chroma, using the same
 * BT.601-derived coefficients as standard-definition video.
 *
 * @module  color-space/jpeg
 *
 * @see {@link https://www.itu.int/rec/T-REC-T.871}
 * @wiki {@link https://en.wikipedia.org/wiki/YCbCr#JPEG_conversion}
 * @year 1992
 * @by Eric Hamilton / C-Cube Microsystems (JFIF)
 * @use Full-range YCbCr for JPEG/JFIF still-image storage; current, ubiquitous (later formalized as ITU-T T.871).
 * @channel {Y} 0 255 Luma
 * @channel {Cb} 0 255 Blue-difference chroma
 * @channel {Cr} 0 255 Red-difference chroma
 * @method luma-chroma
 * @encoding gamma
 * @referred display
 * @dynamic sdr
 */
import rgb from './rgb.js';


var jpeg = {
	name: 'jpeg',
	channel: ['Y', 'Cb', 'Cr'],
	range: [[0, 255], [0, 255], [0, 255]]
};

export default (jpeg);


/**
 * JPEG to RGB
 * transform through analog form
 *
 * @param {Array<number>} y,cb,cr JPEG values 0-255
 *
 * @return {Array<number>} RGB values 0-255
 */
jpeg.rgb = function (y, cb, cr) {
	// JPEG uses Y,Cb,Cr ∈ [0,255] with Cb,Cr centered at 128
	// Normalize to 0-1 for calculation
	y = y / 255;
	cb = cb / 255;
	cr = cr / 255;

	const center = 128 / 255;

	const rgb = [
		y + 1.402 * (cr - center),
		y - 0.34414 * (cb - center) - 0.71414 * (cr - center),
		y + 1.772 * (cb - center)
	];

	// Scale to 0-255
	return rgb.map(v => v * 255);
};


/**
 * RGB to JPEG
 * transform through analog form
 *
 * @param {Array<number>} r,g,b RGB values 0-255
 *
 * @return {Array<number>} JPEG values 0-255
 */
rgb.jpeg = function (r, g, b) {
	// Normalize from 0-255 to 0-1
	r = r / 255;
	g = g / 255;
	b = b / 255;

	const center = 128 / 255;

	const jpeg = [
		0.299 * r + 0.587 * g + 0.114 * b,
		center - 0.168736 * r - 0.331264 * g + 0.5 * b,
		center + 0.5 * r - 0.418688 * g - 0.081312 * b
	];

	// Scale to 0-255
	return jpeg.map(v => v * 255);
};
