// Oklab Polar
// https://bottosson.github.io/posts/oklab/

import oklab from './oklab.js';
import rgb from './rgb.js';

var oklch = {
	name: 'oklch',
	channel: ['l', 'c', 'h']
};

oklch.oklab = function (l, c, h) {
	var hRad = h * 2 * Math.PI;
	return [
		l,
		c * Math.cos(hRad),
		c * Math.sin(hRad)
	];
};

oklab.oklch = function (l, a, b) {
	var c = Math.sqrt(a * a + b * b);
	var h = Math.atan2(b, a) / (2 * Math.PI);

	if (h < 0) {
		h += 1;
	}

	return [l, c, h];
};

oklch.rgb = (...args) => oklab.rgb(...oklch.oklab(...args));
rgb.oklch = (...args) => oklab.oklch(...rgb.oklab(...args));

export default oklch;
