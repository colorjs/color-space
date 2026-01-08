/**
 * YIQ https://en.wikipedia.org/?title=YIQ
 *
 * @module  color-space/yiq
 */
import rgb from './rgb.js';

var yiq = ({
	name: 'yiq',
	channel: ['Y', 'I', 'Q'],
	range: [[0, 1], [-0.5957, 0.5957], [-0.5226, 0.5226]]
});

yiq.rgb = function (y, i, q) {
	// Input: Y: 0-1, I: -0.5957 to 0.5957, Q: -0.5226 to 0.5226
	var r, g, b;

	r = (y * 1) + (i * 0.956) + (q * 0.621);
	g = (y * 1) + (i * -0.272) + (q * -0.647);
	b = (y * 1) + (i * -1.108) + (q * 1.705);

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

	var y = (r * 0.299) + (g * 0.587) + (b * 0.114);
	var i = 0, q = 0;
	if (r !== g || g !== b) {
		i = (r * 0.596) + (g * -0.275) + (b * -0.321);
		q = (r * 0.212) + (g * -0.528) + (b * 0.311);
	}
	return [y, i, q];
};


export default yiq;
