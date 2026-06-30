/**
 * HCG color space (Hue, Chroma, Gray)
 *
 * Alternative cylindrical RGB representation
 * Uses gray component instead of value or lightness
 *
 * @channel {H} 0 360 Hue angle in degrees
 * @channel {C} 0 100 Chroma percentage
 * @channel {G} 0 100 Gray component percentage
 */
import rgb from './rgb.js';
import hsl from './hsl.js';
import hsv from './hsv.js';
import hwb from './hwb.js';

var hcg = {
	name: 'hcg',

	rgb: function (h, c, g) {
		// Input: H: 0-360, C/G: 0-100
		// Normalize
		h = h / 360;
		c = c / 100;
		g = g / 100;

		if (c === 0.0) {
			// Scale to 0-255
			return [g * 255, g * 255, g * 255];
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
			(c * pure[0] + mg) * 255,
			(c * pure[1] + mg) * 255,
			(c * pure[2] + mg) * 255
		];
		return rgb;
	},

	hsl: function (h, c, g) {
		// Input: H: 0-360, C/G: 0-100
		// Output: H: 0-360, S/L: 0-100
		c = c / 100;
		g = g / 100;

		var l = g * (1.0 - c) + 0.5 * c;
		var s = 0;
		if (l < 1.0 && l > 0.0) {
			if (l < 0.5) {
				s = c / (2 * l);
			} else {
				s = c / (2 * (1 - l));
			}
		}
		return [h, s * 100, l * 100];
	},

	hsv: function (h, c, g) {
		// Input/Output: H: 0-360, C/G/S/V: 0-100
		c = c / 100;
		g = g / 100;

		var v = c + g * (1.0 - c);
		var res;
		if (v > 0.0) {
			var f = c / v;
			res = [h, f * 100, v * 100];
		} else {
			res = [h, 0, v * 100];
		}
		return res;
	},

	hwb: function (h, c, g) {
		// Input/Output: H: 0-360, C/G/W/B: 0-100
		c = c / 100;
		g = g / 100;

		var v = c + g * (1.0 - c);
		return [h, (v - c) * 100, (1 - v) * 100];
	}
};

export default (hcg);


//append rgb
rgb.hcg = function (r, g, b) {
	// Normalize from 0-255 to 0-1
	r = r / 255;
	g = g / 255;
	b = b / 255;

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
		if (hue < 0) hue += 1; // JS % keeps sign; wrap negative hues into [0,1)
	} else {
		hue = 0;
	}
	// Output: H: 0-360, C/G: 0-100
	return [hue * 360, chroma * 100, grayscale * 100];
};

//extend hsl
hsl.hcg = function (h, s, l) {
	// Input: H: 0-360, S/L: 0-100
	// Output: H: 0-360, C/G: 0-100
	s = s / 100;
	l = l / 100;

	var c = 0;
	if (l < 0.5) {
		c = 2.0 * s * l;
	} else {
		c = 2.0 * s * (1.0 - l);
	}
	var res;
	if (c < 1.0) {
		var f = (l - 0.5 * c) / (1.0 - c);
		res = [h, c * 100, f * 100];
	} else {
		res = [h, c * 100, 0];
	}
	return res;
};

//extend hsv
hsv.hcg = function (h, s, v) {
	// Input: H: 0-360, S/V: 0-100
	// Output: H: 0-360, C/G: 0-100
	s = s / 100;
	v = v / 100;

	var c = s * v;
	var res;
	if (c < 1.0) {
		var f = (v - c) / (1 - c);
		res = [h, c * 100, f * 100];
	} else {
		res = [h, c * 100, 0];
	}
	return res;
}


//extend hwb
hwb.hcg = function (h, w, b) {
	// Input: H: 0-360, W/B: 0-100
	// Output: H: 0-360, C/G: 0-100
	w = w / 100;
	b = b / 100;

	var v = 1 - b;
	var c = v - w;
	var g = 0;
	if (c < 1) {
		g = (v - c) / (1 - c);
	}
	return [h, c * 100, g * 100];
}
