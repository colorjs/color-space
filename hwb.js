/**
 * HWB color space (Hue, Whiteness, Blackness)
 *
 * Cylindrical representation using whiteness and blackness
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#the-hwb-notation}
 * @channel {H} 0 360 Hue angle in degrees
 * @channel {W} 0 100 Whiteness percentage
 * @channel {B} 0 100 Blackness percentage
 */
import rgb from './rgb.js';
import hsv from './hsv.js';
import hsl from './hsl.js';

var hwb = {
	name: 'hwb',
	rgb: function (h, wh, bl) {
		// Convert from H: 0-360, W/B: 0-100 to normalized
		h = h / 360;
		wh = wh / 100;
		bl = bl / 100;

		var ratio = wh + bl,
			i, v, f, n;

		var r, g, b;

		// wh + bl cant be > 1
		if (ratio > 1) {
			wh /= ratio;
			bl /= ratio;
		}

		i = Math.floor(6 * h);
		v = 1 - bl;
		f = 6 * h - i;

		//if it is even
		if ((i & 0x01) !== 0) {
			f = 1 - f;
		}

		n = wh + f * (v - wh);  // linear interpolation

		switch (i) {
			default:
			case 6:
			case 0: r = v; g = n; b = wh; break;
			case 1: r = n; g = v; b = wh; break;
			case 2: r = wh; g = v; b = n; break;
			case 3: r = wh; g = n; b = v; break;
			case 4: r = n; g = wh; b = v; break;
			case 5: r = v; g = wh; b = n; break;
		}

		// Scale to 0-255
		return [r * 255, g * 255, b * 255];
	},


	// http://alvyray.com/Papers/CG/HWB_JGTv208.pdf
	hsv: function (h, w, b) {
		// Convert from H: 0-360, W/B: 0-100
		w = w / 100;
		b = b / 100;

		var s, v;

		//if w+b > 100% - take proportion (how many times )
		if (w + b >= 1) {
			s = 0;
			v = w / (w + b);
		}

		//by default - take wiki formula
		else {
			s = 1 - (w / (1 - b));
			v = 1 - b;
		}

		// Output: H: 0-360, S/V: 0-100
		return [h, s * 100, v * 100];
	},

	hsl: function (h, w, b) {
		return hsv.hsl(...hwb.hsv(h, w, b));
	}
};

export default (hwb);


// extend rgb
rgb.hwb = function (r, g, b) {
	// Normalize from 0-255 to 0-1
	r = r / 255;
	g = g / 255;
	b = b / 255;

	var h = rgb.hsl(r * 255, g * 255, b * 255)[0],
		w = Math.min(r, Math.min(g, b));

	b = 1 - Math.max(r, Math.max(g, b));

	// Output: H: 0-360, W/B: 0-100
	return [h, w * 100, b * 100];
};


// keep proper hue on 0 values (conversion to rgb loses hue on zero-lightness)
hsv.hwb = function (h, s, v) {
	// Input/Output: H: 0-360, S/V/W/B: 0-100
	s = s / 100;
	v = v / 100;
	return [h, (v === 0 ? 0 : (v * (1 - s))) * 100, (1 - v) * 100];
};


//extend hsl with proper conversions
hsl.hwb = function (h, s, l) {
	return hsv.hwb(...hsl.hsv(h, s, l));
};
