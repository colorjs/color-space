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

	// exact inverse of the BT.601 forward matrix below — exact round-trip
	r = y + (v * 1.139837398373984);
	g = y + (u * -0.394651704358970) + (v * -0.580598606667498);
	b = y + (u * 2.032110091743120);

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
	// BT.601 full-precision (round to the published -0.14713/-0.28886, -0.51499/-0.10001)
	var u = (r * -0.147137697516930) + (g * -0.288862302483070) + (b * 0.436);
	var v = (r * 0.615) + (g * -0.514985734664764) + (b * -0.100014265335235);

	return [y, u, v];
};


export default yuv;
