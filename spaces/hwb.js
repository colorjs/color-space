/**
 * HWB — Hue, Whiteness, Blackness, devised by Alvy Ray Smith in 1996 as an even more
 * intuitive alternative to HSV for humans mixing colors by hand. Instead of
 * saturation and value, it describes a color as a pure hue diluted with some amount
 * of white and some amount of black, mirroring how painters think about tinting and
 * shading a pigment. It is standardized in CSS Color 4 as the `hwb()` notation.
 *
 * @see {@link https://www.w3.org/TR/css-color-4/#the-hwb-notation}
 * @wiki {@link https://en.wikipedia.org/wiki/HWB_color_model}
 * @year 1996
 * @by Alvy Ray Smith
 * @use Intuitive tint/shade color picking; current, standardized as CSS Color 4's hwb().
 * @channel {H} 0 360 Hue angle in degrees
 * @channel {W} 0 100 Whiteness percentage
 * @channel {B} 0 100 Blackness percentage
 * @method cylindrical
 * @encoding gamma
 * @referred display
 * @dynamic sdr
 */
import rgb from './rgb.js';
import hsv from './hsv.js';
import hsl from './hsl.js';

var hwb = {
	name: 'hwb',
	range: [[0, 360], [0, 100], [0, 100]],
	rgb: function (h, wh, bl) {
		// Convert from H: 0-360, W/B: 0-100 to normalized
		h = h / 360;
		wh = wh / 100;
		bl = bl / 100;

		var ratio = wh + bl,
			i, v, f, n;

		var r, g, b;

		// white + black >= 1 is achromatic: an EXACT gray = white / (white + black),
		// per CSS Color 4. Computing it through the sector machinery below instead
		// (v = 1 - bl vs wh) leaves ~1e-14 residue between the channels, which any
		// downstream hue read (rgb -> hsv / hsl) amplifies into a random hue — so the
		// neighbouring hue sliders jump as whiteness is dragged past this point.
		// @see https://www.w3.org/TR/css-color-4/#hwb-to-rgb
		if (ratio >= 1) {
			var gray = wh / ratio * 255;
			return [gray, gray, gray];
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
