/**
 * @module color-space/hsv
 */
import rgb from './rgb.js';
import hsl from './hsl.js';


var hsv = {
	name: 'hsv',
	min: [0, 0, 0],
	max: [360, 1, 1],
	channel: ['hue', 'saturation', 'value'],
	alias: ['HSV', 'HSB'],

	rgb: function (h, s, v) {
		h = h / 60;
		var hi = (Math.floor(h) % 6);

		var f = h - Math.floor(h),
			p = v * (1 - s),
			q = v * (1 - (s * f)),
			t = v * (1 - (s * (1 - f)));

		switch (hi) {
			case 0:
				return [v, t, p];
			case 1:
				return [q, v, p];
			case 2:
				return [p, v, t];
			case 3:
				return [p, q, v];
			case 4:
				return [t, p, v];
			case 5:
				return [v, p, q];
		}
	},

	hsl: function (h, s, v) {
		var sl, l;

		l = (2 - s) * v;
		sl = s * v;
		sl /= (l <= 1) ? l : 2 - l;
		sl = sl || 0;
		l /= 2;

		return [h, sl, l];
	}
};

export default (hsv);


//append rgb
rgb.hsv = function (r, g, b) {
	var min = Math.min(r, g, b),
		max = Math.max(r, g, b),
		delta = max - min,
		h, s, v;

	if (max === 0) {
		s = 0;
	}
	else {
		s = (delta / max);
	}

	if (max === min) {
		h = 0;
	}
	else if (r === max) {
		h = (g - b) / delta;
	}
	else if (g === max) {
		h = 2 + (b - r) / delta;
	}
	else if (b === max) {
		h = 4 + (r - g) / delta;
	}

	//FIXME h is possibly undefined
	//@ts-ignore
	h = Math.min(h * 60, 360);

	if (h < 0) {
		h += 360;
	}

	v = max;

	return [h, s, v];
};



//extend hsl
hsl.hsv = function (h, s, l) {
	var l = l * 2;
	var s = s * (l <= 1 ? l : 2 - l);
	var v = (l + s) / 2;
	var sv = (2 * s) / (l + s);
	return [h, sv, v];
};
