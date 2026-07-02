/**
 * YIQ is the luma/chroma encoding adopted for NTSC color television in the United
 * States in 1953, engineered to add color broadcasts without breaking the millions of
 * monochrome sets already in homes. The luma channel Y alone reproduces the original
 * black-and-white picture, while I (in-phase) and Q (quadrature) carry the
 * chrominance, named for how they modulate the phase of the color subcarrier. I and Q
 * are rotated relative to the simpler blue-difference/red-difference axes of YUV
 * specifically to exploit the eye's greater sensitivity along the orange-cyan
 * direction than the green-purple direction, letting Q carry less bandwidth.
 *
 * @see {@link https://en.wikipedia.org/wiki/YIQ}
 * @channel {Y} 0 1 Luma
 * @channel {I} -0.5957 0.5957 In-phase
 * @channel {Q} -0.5226 0.5226 Quadrature
 * @referred display
 * @dynamic sdr
 */
import rgb from './rgb.js';

var yiq = {
	name: 'yiq',
	range: [[0, 1], [-0.5957, 0.5957], [-0.5226, 0.5226]]
};

yiq.rgb = function (y, i, q) {
	// Input: Y: 0-1, I: -0.5957 to 0.5957, Q: -0.5226 to 0.5226
	var r, g, b;

	// exact inverse (inv3) of the FCC forward matrix below — exact round-trip
	r = y + (i * 0.9562957197589483) + (q * 0.6210244164652611);
	g = y + (i * -0.27212209931851045) + (q * -0.647380596825695);
	b = y + (i * -1.1069890167364902) + (q * 1.7046149983646481);

	r = Math.min(Math.max(0, r), 1);
	g = Math.min(Math.max(0, g), 1);
	b = Math.min(Math.max(0, b), 1);

	// Scale to 0-255
	return [r * 255, g * 255, b * 255];
};


//extend rgb
rgb.yiq = function (r, g, b) {
	// Normalize from 0-255 to 0-1
	r = r / 255;
	g = g / 255;
	b = b / 255;

	// FCC (1953 NTSC) luma + I/Q chroma
	var y = (r * 0.299) + (g * 0.587) + (b * 0.114);
	var i = 0, q = 0;
	if (r !== g || g !== b) {
		i = (r * 0.595716) + (g * -0.274453) + (b * -0.321263);
		q = (r * 0.211456) + (g * -0.522591) + (b * 0.311135);
	}
	return [y, i, q];
};


export default yiq;
