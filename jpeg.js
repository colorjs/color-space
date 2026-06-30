/**
 * https://en.wikipedia.org/wiki/YCbCr#JPEG_conversion
 *
 * JPEG conversion without head/footroom
 *
 * @module  color-space/jpeg
 *
 * @channel {Y} 0 255 Luma
 * @channel {Cb} 0 255 Blue-difference chroma
 * @channel {Cr} 0 255 Red-difference chroma
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
