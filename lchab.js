/**
 * Cylindrical LAB
 *
 * @module color-space/lchab
 */
import xyz from './xyz.js';
import lab from './lab.js';


//cylindrical lab
var lchab = {
	name: 'lchab',
	channel: ['lightness', 'chroma', 'hue'],
	range: [[0, 100], [0, 150], [0, 360]],

	xyz: function (l, c, h) {
		return lab.xyz(...lchab.lab(l, c, h));
	},

	lab: function (l, c, h) {
		// Input: L: 0-100, C: 0-150, H: 0-360
		// Output: L: 0-100, a: -125 to 125, b: -125 to 125
		var a, b, hr;

		hr = h / 360 * 2 * Math.PI;
		a = c * Math.cos(hr);
		b = c * Math.sin(hr);
		return [l, a, b];
	}
};


//extend lab
lab.lchab = function (l, a, b) {
	// Input: L: 0-100, a: -125 to 125, b: -125 to 125
	// Output: L: 0-100, C: 0-150, H: 0-360
	var hr, h, c;

	hr = Math.atan2(b, a);
	h = hr / (2 * Math.PI) * 360;
	if (h < 0) {
		h += 360;
	}
	c = Math.sqrt(a * a + b * b);
	return [l, c, h];
};

xyz.lchab = function (x, y, z) {
	return lab.lchab(...xyz.lab(x, y, z));
};


export default (lchab);
