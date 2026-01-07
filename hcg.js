/**
 * @module color-space/hcg
 */
import rgb from './rgb.js';
import hsl from './hsl.js';
import hsv from './hsv.js';
import hwb from './hwb.js';

var hcg = {
	name: 'hcg',
	min: [0, 0, 0],
	max: [360, 1, 1],
	channel: ['hue', 'chroma', 'gray'],

	rgb: function (h, c, g) {
		h = h / 360;
		if (c === 0.0) {
			return [g, g, g];
		}
		var hi = (h % 1) * 6;
		var v = (hi % 1);
		var pure = [0, 0, 0];
		var w = 1 - v;
		switch (Math.floor(hi)) {
			case 0:
				pure[0] = 1; pure[1] = v; pure[2] = 0; break;
			case 1:
				pure[0] = w; pure[1] = 1; pure[2] = 0; break;
			case 2:
				pure[0] = 0; pure[1] = 1; pure[2] = v; break;
			case 3:
				pure[0] = 0; pure[1] = w; pure[2] = 1; break;
			case 4:
				pure[0] = v; pure[1] = 0; pure[2] = 1; break;
			default:
				pure[0] = 1; pure[1] = 0; pure[2] = w;
		}
		var mg = (1.0 - c) * g;
		var rgb = [
			(c * pure[0] + mg),
			(c * pure[1] + mg),
			(c * pure[2] + mg)
		];
		return rgb;
	},

	hsl: function (h, c, g) {
		h = h / 360;
		var l = g * (1.0 - c) + 0.5 * c;
		var s = 0;
		if (l < 1.0 && l > 0.0) {
			if (l < 0.5) {
				s = c / (2 * l);
			} else {
				s = c / (2 * (1 - l));
			}
		}
		return [h * 360, s, l];
	},

	hsv: function (h, c, g) {
		var v = c + g * (1.0 - c);
		var res;
		if (v > 0.0) {
			var f = c / v;
			res = [h, f, v];
		} else {
			res = [h, 0, v];
		}
		return res;
	},

	hwb: function (h, c, g) {
		var v = c + g * (1.0 - c);
		return [h, (v - c), (1 - v)];
	}
};

export default (hcg);


//append rgb
rgb.hcg = function (r, g, b) {
	var max = Math.max(Math.max(r, g), b);
	var min = Math.min(Math.min(r, g), b);
	var chroma = (max - min);
	var grayscale;
	var hue;
	if (chroma < 1) {
		grayscale = min / (1 - chroma);
	} else {
		grayscale = 0;
	}
	if (chroma > 0) {
		if (max === r) {
			hue = ((g - b) / chroma % 6);
		} else
			if (max === g) {
				hue = 2 + (b - r) / chroma;
			} else {
				hue = 4 + (r - g) / chroma;
			}
		hue /= 6;
		hue = (hue % 1);
	} else {
		hue = 0;
	}
	return [hue * 360, chroma, grayscale];
};

//extend hsl
hsl.hcg = function (h, s, l) {
	var c = 0;
	if (l < 0.5) {
		c = 2.0 * s * l;
	} else {
		c = 2.0 * s * (1.0 - l);
	}
	var res;
	if (c < 1.0) {
		var f = (l - 0.5 * c) / (1.0 - c);
		res = [h, c, f];
	} else {
		res = [h, c, 0];
	}
	return res;
};

//extend hsv
hsv.hcg = function (h, s, v) {
	var c = s * v;
	var res;
	if (c < 1.0) {
		var f = (v - c) / (1 - c);
		res = [h, c, f];
	} else {
		res = [h, c, 0];
	}
	return res;
}


//extend hwb
hwb.hcg = function (h, w, b) {
	var v = 1 - b;
	var c = v - w;
	var g = 0;
	if (c < 1) {
		g = (v - c) / (1 - c);
	}
	return [h, c, g];
}
