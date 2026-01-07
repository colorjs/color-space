// Oklrch
// https://bottosson.github.io/posts/colorpicker/

import oklrab from './oklrab.js';

var oklrch = {
	name: 'oklrch',
	channel: ['l', 'c', 'h']
};

oklrch.oklrab = function (l, c, h) {
	var hRad = h * 2 * Math.PI;
	return [
		l,
		c * Math.cos(hRad),
		c * Math.sin(hRad)
	];
};

oklrab.oklrch = function (l, a, b) {
	var c = Math.sqrt(a * a + b * b);
	var h = Math.atan2(b, a) / (2 * Math.PI);

	if (h < 0) {
		h += 1;
	}

	return [l, c, h];
};

export default oklrch;
