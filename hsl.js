/**
 * HSL color space (Hue, Saturation, Lightness)
 *
 * Cylindrical representation of RGB with perceptual intent
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#the-hsl-notation}
 * @channel {H} 0 360 Hue angle in degrees
 * @channel {S} 0 100 Saturation percentage
 * @channel {L} 0 100 Lightness percentage
 */
import rgb from './rgb.js';

var hsl = {
	name: 'hsl',

	rgb: function (h, s, l) {
		// Convert from H: 0-360, S/L: 0-100 to normalized 0-1
		h = h / 360;
		s = s / 100;
		l = l / 100;

		var t1, t2, t3, rgb, val, i = 0;

		if (s === 0) return val = l * 255, [val, val, val];

		t2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
		t1 = 2 * l - t2;

		rgb = [0, 0, 0];
		for (; i < 3;) {
			t3 = h + 1 / 3 * - (i - 1);
			t3 < 0 ? t3++ : t3 > 1 && t3--;
			val = 6 * t3 < 1 ? t1 + (t2 - t1) * 6 * t3 :
				2 * t3 < 1 ? t2 :
					3 * t3 < 2 ? t1 + (t2 - t1) * (2 / 3 - t3) * 6 :
						t1;
			rgb[i++] = val * 255; // Scale to 0-255
		}

		return rgb;
	}
};

export default (hsl);


//extend rgb
rgb.hsl = function (r, g, b) {
	// Normalize RGB from 0-255 to 0-1
	r = r / 255;
	g = g / 255;
	b = b / 255;

	var min = Math.min(r, g, b),
		max = Math.max(r, g, b),
		delta = max - min,
		h = 0, s, l;

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

	l = (min + max) / 2;

	if (max === min) {
		s = 0;
	}
	else if (l <= 0.5) {
		s = delta / (max + min);
	}
	else {
		s = delta / (2 - max - min);
	}

	// Convert to H: 0-360, S/L: 0-100
	return [h * 360, s * 100, l * 100];
};
