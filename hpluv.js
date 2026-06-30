/**
 * HPLuv color space (High-Precision LUV)
 *
 * Variant of HSLuv for pastel colors with consistent perceptual lightness
 * Optimized for sRGB gamut
 *
 * @see {@link https://www.hsluv.org/}
 * @channel {H} 0 360 Hue angle in degrees
 * @channel {S} 0 100 Saturation percentage (pastel gamut; exceeds 100 outside it)
 * @channel {L} 0 100 Lightness percentage
 * @illuminant D65
 * @observer 2
 * @referred display
 * @dynamic sdr
 */
import xyz from './xyz.js';
import lchuv from './lchuv.js';
import rgb from './rgb.js';
import { _hsluv } from './hsluv.js';

var hpluv = {
	name: 'hpluv',
	min: [0, 0, 0],
	max: [360, 100, 100],
	channel: ['h', 's', 'l'],
	alias: ['hpl'],

	// Range documentation (not used in conventional v3)
	range: [[0, 360], [0, 100], [0, 100]],

	lchuv: (h, s, l) => {
		h = h !== undefined ? h : 0;
		s = s !== undefined ? s : 0;
		l = l !== undefined ? l : 0;
		// Input: H: 0-360, S/L: 0-100
		const lch = _hsluv.hpluvToLch([h, s, l]);
		// Output: L: 0-100, C: 0-150, H: 0-360
		return [lch[0], lch[1], lch[2]];
	},

	xyz: function (h, s, l) {
		const lch = hpluv.lchuv(h, s, l);
		return lchuv.xyz(lch[0], lch[1], lch[2]);
	},

	rgb: function (h, s, l) {
		const lch = hpluv.lchuv(h, s, l);
		return lchuv.rgb(lch[0], lch[1], lch[2]);
	},

	//a shorter way to convert to hsluv
	hsluv: function (h, s, l) {
		h = h !== undefined ? h : 0;
		s = s !== undefined ? s : 0;
		l = l !== undefined ? l : 0;
		// Input/Output: H: 0-360, S/L: 0-100
		const lch = _hsluv.hpluvToLch([h, s, l]);
		const hsl = _hsluv.lchToHsluv(lch);
		return [hsl[0], hsl[1], hsl[2]];
	}
};

export default hpluv;

//extend lchuv
lchuv.hpluv = (l, c, h) => {
	l = l !== undefined ? l : 0;
	c = c !== undefined ? c : 0;
	h = h !== undefined ? h : 0;
	// Input: L: 0-100, C: 0-150, H: 0-360
	const hpl = _hsluv.lchToHpluv([l, c, h]);
	// Output: H: 0-360, P/L: 0-100
	return [hpl[0], hpl[1], hpl[2]];
};

//extend xyz
xyz.hpluv = function (x, y, z) {
	const lch = xyz.lchuv(x, y, z);
	return lchuv.hpluv(lch[0], lch[1], lch[2]);
};

//extend rgb
rgb.hpluv = function (r, g, b) {
	const lch = rgb.lchuv(r, g, b);
	return lchuv.hpluv(lch[0], lch[1], lch[2]);
};
