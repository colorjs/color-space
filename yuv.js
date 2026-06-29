/**
 * YUV color space
 *
 * Television analog encoding separating luma from chroma
 * Used in PAL/SECAM broadcast standards
 *
 * @channel {Y} 0 1 Luma (brightness)
 * @channel {U} -0.436 0.436 Chrominance blue component
 * @channel {V} -0.615 0.615 Chrominance red component
 */
import rgb from './rgb.js';

var yuv = {
	name: 'yuv'
};

yuv.rgb = function (y, u, v) {
	// Input: Y: 0-1, U: -0.436 to 0.436, V: -0.615 to 0.615
	var r, g, b;

	r = (y * 1) + (u * 0) + (v * 1.13983);
	g = (y * 1) + (u * -0.39465) + (v * -0.58060);
	b = (y * 1) + (u * 2.02311) + (v * 0);

	r = Math.min(Math.max(0, r), 1);
	g = Math.min(Math.max(0, g), 1);
	b = Math.min(Math.max(0, b), 1);

	// Scale to 0-255
	return [r * 255, g * 255, b * 255];
}


//extend rgb
rgb.yuv = function (r, g, b) {
	// Normalize from 0-255 to 0-1
	r = r / 255;
	g = g / 255;
	b = b / 255;

	var y = (r * 0.299) + (g * 0.587) + (b * 0.114);
	var u = (r * -0.14713) + (g * -0.28886) + (b * 0.436);
	var v = (r * 0.615) + (g * -0.51499) + (b * -0.10001);

	return [y, u, v];
};


export default yuv;
