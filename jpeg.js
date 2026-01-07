/**
 * https://en.wikipedia.org/wiki/YCbCr#JPEG_conversion
 *
 * JPEG conversion without head/footroom
 *
 * @module  color-space/jpeg
 */
import rgb from './rgb.js';


var jpeg = {
	name: 'jpeg',
	channel: ['Y', 'Cb', 'Cr'],
};

export default (jpeg);


/**
 * JPEG to RGB
 * transform through analog form
 *
 * @param {Array<number>} y,cb,cr JPEG values normalized 0-1
 *
 * @return {Array<number>} RGB values normalized 0-1
 */
jpeg.rgb = function (y, cb, cr) {
	// JPEG uses Y,Cb,Cr ∈ [0,255] with Cb,Cr centered at 128
	// We normalize: Y/255, Cb/255, Cr/255 → all ∈ [0,1]
	// Cb,Cr are signed: 0.5 represents the center (128)
	//
	// Original formula: r = y_real + 1.402*(cr_real - 128)
	// With our encoding: r = y + 1.402*(cr - 0.5019607843...)
	const center = 128 / 255;  // 0.5019607843137255
	
	return [
		y + 1.402 * (cr - center),
		y - 0.34414 * (cb - center) - 0.71414 * (cr - center),
		y + 1.772 * (cb - center)
	]
};


/**
 * RGB to JPEG
 * transform through analog form
 *
 * @param {Array<number>} r,g,b RGB values normalized 0-1
 *
 * @return {Array<number>} JPEG values normalized to 0-1
 */
rgb.jpeg = function (r, g, b) {
	// JPEG uses Y,Cb,Cr ∈ [0,255] with Cb,Cr centered at 128
	// We return: Y/255, Cb/255, Cr/255 → all ∈ [0,1]
	//
	// Original formulas:
	// y_real = 0.299*r_real + 0.587*g_real + 0.114*b_real
	// cb_real = 128 - 0.168736*r_real - 0.331264*g_real + 0.5*b_real
	// cr_real = 128 + 0.5*r_real - 0.418688*g_real - 0.081312*b_real
	//
	// Simplifying with r,g,b ∈ [0,1] and r_real = r*255:
	// y = 0.299*r + 0.587*g + 0.114*b
	// cb = 128/255 - 0.168736*r - 0.331264*g + 0.5*b
	// cr = 128/255 + 0.5*r - 0.418688*g - 0.081312*b
	const center = 128 / 255;  // 0.5019607843137255
	
	return [
		0.299 * r + 0.587 * g + 0.114 * b,
		center - 0.168736 * r - 0.331264 * g + 0.5 * b,
		center + 0.5 * r - 0.418688 * g - 0.081312 * b
	]
};
