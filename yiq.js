/**
 * YIQ https://en.wikipedia.org/?title=YIQ
 *
 * @module  color-space/yiq
 */
import rgb from './rgb.js';

var yiq = ({
	name: 'yiq',
	channel: ['Y', 'I', 'Q'],
});

yiq.rgb = function (y, i, q) {
	var r, g, b;

	r = (y * 1) + (i * 0.956) + (q * 0.621);
	g = (y * 1) + (i * -0.272) + (q * -0.647);
	b = (y * 1) + (i * -1.108) + (q * 1.705);

	r = Math.min(Math.max(0, r), 1);
	g = Math.min(Math.max(0, g), 1);
	b = Math.min(Math.max(0, b), 1);

	return [r, g, b];
};


//extend rgb
rgb.yiq = function (r, g, b) {
	var y = (r * 0.299) + (g * 0.587) + (b * 0.114);
	var i = 0, q = 0;
	if (r !== g || g !== b) {
		i = (r * 0.596) + (g * -0.275) + (b * -0.321);
		q = (r * 0.212) + (g * -0.528) + (b * 0.311);
	}
	return [y, i, q];
};


export default yiq;
