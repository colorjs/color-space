/**
 * HSV — Hue, Saturation, Value (also called HSB, for Brightness), another
 * cylindrical remapping of RGB from Alvy Ray Smith's 1978 paper. It shares HSL's hue
 * angle but replaces lightness with value, the brightness of the most intense color
 * channel, so pure hues stay fully saturated across the whole brightness range
 * instead of washing out toward white. It is the model behind most color-picker
 * "wheel plus square" interfaces.
 *
 * @see {@link https://en.wikipedia.org/wiki/HSL_and_HSV}
 * @wiki {@link https://en.wikipedia.org/wiki/HSL_and_HSV}
 * @year 1978
 * @by Alvy Ray Smith
 * @use Hue/saturation/value color picking with pure hues at full brightness; current, the standard 'wheel plus square' picker model.
 * @channel {H} 0 360 Hue angle in degrees
 * @channel {S} 0 100 Saturation percentage
 * @channel {V} 0 100 Value percentage
 * @method cylindrical
 * @encoding gamma
 * @referred display
 * @dynamic sdr
 */
import rgb from './rgb.js';
import hsl from './hsl.js';


var hsv = {
	name: 'hsv',
	range: [[0, 360], [0, 100], [0, 100]],

	rgb: function (h, s, v) {
		// Convert from H: 0-360, S/V: 0-100 to normalized
		h = (h / 360) * 6;
		s = s / 100;
		v = v / 100;

		var hi = (Math.floor(h) % 6);

		var f = h - Math.floor(h),
			p = v * (1 - s),
			q = v * (1 - (s * f)),
			t = v * (1 - (s * (1 - f)));

		var result;
		switch (hi) {
			case 0:
				result = [v, t, p]; break;
			case 1:
				result = [q, v, p]; break;
			case 2:
				result = [p, v, t]; break;
			case 3:
				result = [p, q, v]; break;
			case 4:
				result = [t, p, v]; break;
			case 5:
				result = [v, p, q]; break;
		}

		// Scale to 0-255
		return [result[0] * 255, result[1] * 255, result[2] * 255];
	},

	hsl: function (h, s, v) {
		// Convert from H: 0-360, S/V: 0-100
		s = s / 100;
		v = v / 100;

		var sl, l;

		l = (2 - s) * v;
		sl = s * v;
		sl /= (l <= 1) ? l : 2 - l;
		sl = sl || 0;
		l /= 2;

		// Return as H: 0-360, S/L: 0-100
		return [h, sl * 100, l * 100];
	}
};

export default (hsv);


//append rgb
rgb.hsv = function (r, g, b) {
	// Normalize from 0-255 to 0-1
	r = r / 255;
	g = g / 255;
	b = b / 255;

	var min = Math.min(r, g, b),
		max = Math.max(r, g, b),
		delta = max - min,
		h = 0, s, v;

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

	h = Math.min(h / 6, 1);

	if (h < 0) {
		h += 1;
	}

	v = max;

	// Convert to H: 0-360, S/V: 0-100
	return [h * 360, s * 100, v * 100];
};



//extend hsl
hsl.hsv = function (h, s, l) {
	// Input: H: 0-360, S/L: 0-100
	s = s / 100;
	l = l / 100;

	var l2 = l * 2;
	var s2 = s * (l2 <= 1 ? l2 : 2 - l2);
	var v = (l2 + s2) / 2;
	var sv = (2 * s2) / (l2 + s2);

	// Output: H: 0-360, S/V: 0-100
	return [h, sv * 100, v * 100];
};
