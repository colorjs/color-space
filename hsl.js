/**
 * @module color-space/hsl
 */
import rgb from './rgb.js';

export default {
	name: 'hsl',
	min: [0,0,0],
	max: [360,100,100],
	channel: ['hue', 'saturation', 'lightness'],
	alias: ['HSL'],

	rgb: function(hsl) {
		var h = hsl[0]/360, s = hsl[1]/100, l = hsl[2]/100, t1, t2, t3, rgb, val, i=0;

		if (s === 0) return val = l * 255, [val, val, val];

		t2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
		t1 = 2 * l - t2;

		rgb = [0, 0, 0];
		for (;i<3;) {
			t3 = h + 1 / 3 * - (i - 1);
			t3 < 0 ? t3++ : t3 > 1 && t3--;
			val = 6 * t3 < 1 ? t1 + (t2 - t1) * 6 * t3 :
			2 * t3 < 1 ? t2 :
			3 * t3 < 2 ?  t1 + (t2 - t1) * (2 / 3 - t3) * 6 :
			t1;
			rgb[i++] = val * 255;
		}

		return rgb;
	}
};


//extend rgb
rgb.hsl = function(rgb) {
	var r = rgb[0]/255,
			g = rgb[1]/255,
			b = rgb[2]/255,
			min = Math.min(r, g, b),
			max = Math.max(r, g, b),
			delta = max - min,
			h, s, l;

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
		h = 4 + (r - g)/ delta;
	}

	h = Math.min(h * 60, 360);

	if (h < 0) {
		h += 360;
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

	return [h, s * 100, l * 100];
};
