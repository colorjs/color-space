/**
 * @module color-space/hwb
 */
import rgb from './rgb.js';
import hsv from './hsv.js';
import hsl from './hsl.js';

var hwb = {
	name: 'hwb',
	max: [360, 1, 1],
	channel: ['hue', 'whiteness', 'blackness'],
	alias: ['HWB'],
	rgb: function (h, wh, bl) {
		h = h / 360;
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

		return [r, g, b];
	},


	// http://alvyray.com/Papers/CG/HWB_JGTv208.pdf
	hsv: function (h, w, b) {
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


		return [h, s, v];
	},

	hsl: function (h, w, b) {
		return hsv.hsl(...hwb.hsv(h, w, b));
	}
};

export default (hwb);


// extend rgb
rgb.hwb = function (r, g, b) {
	var h = rgb.hsl(r, g, b)[0],
		w = Math.min(r, Math.min(g, b));

	b = 1 - Math.max(r, Math.max(g, b));

	return [h, w, b];
};


// keep proper hue on 0 values (conversion to rgb loses hue on zero-lightness)
hsv.hwb = function (h, s, v) {
	return [h, v === 0 ? 0 : (v * (1 - s)), 1 - v];
};


//extend hsl with proper conversions
hsl.hwb = function (h, s, l) {
	return hsv.hwb(...hsl.hsv(h, s, l));
};
