/**
 * YUV is the analog color encoding developed for PAL television. Color rides alongside the
 * black-and-white signal without breaking monochrome receivers: Y alone carries brightness,
 * and U and V add scaled blue- and red-difference chroma. Splitting luma from chroma let
 * broadcasters spend less bandwidth on color than on brightness, since the eye sees less
 * chroma detail.
 *
 * @see {@link https://www.itu.int/rec/R-REC-BT.470} ITU-R BT.470
 * @wiki {@link https://en.wikipedia.org/wiki/YUV}
 * @year 1967
 * @by Walter Bruch / Telefunken
 * @use Analog PAL television; historical, though “YUV” is now used loosely for digital video too.
 * @channel {Y} 0 1 Luma
 * @channel {U} -0.436 0.436 Chrominance blue component
 * @channel {V} -0.615 0.615 Chrominance red component
 * @method luma-chroma
 * @encoding gamma
 * @referred display
 * @dynamic sdr
 */
import rgb from './rgb.js';

var yuv = {
	name: 'yuv',
	range: [[0, 1], [-0.436, 0.436], [-0.615, 0.615]]
};

yuv.rgb = function (y, u, v) {
	// Input: Y: 0-1, U: -0.436 to 0.436, V: -0.615 to 0.615
	var r, g, b;

	// exact inverse of the BT.601 forward matrix below — exact round-trip;
	// out-of-gamut RGB passes through unclamped (library-wide rule)
	r = y + (v * 1.139837398373984);
	g = y + (u * -0.394651704358970) + (v * -0.580598606667498);
	b = y + (u * 2.032110091743120);

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
