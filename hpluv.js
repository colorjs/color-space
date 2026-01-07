/**
 * A uniform wrapper for hpluv.
 * // http://www.hsluv.org/
 *
 * @module color-space/hpluv
 */
import xyz from './xyz.js';
import lchuv from './lchuv.js';
import { _hsluv } from './hsluv.js';

var hpluv = {
	name: 'hpluv',
	channel: ['hue', 'saturation', 'lightness'],

	lchuv: (h, s, l) => {
		// Denormalize to 0-360 hue and 0-100 lightness for library
		const lch = _hsluv.hpluvToLch([h * 360, s * 100, l * 100]);
		// Normalize output (lightness 0-100 → 0-1, hue 0-360 → 0-1)
		return [lch[0] / 100, lch[1], lch[2] / 360];
	},
	xyz: function (h, s, l) {
		// Denormalize input for library
		const lch = _hsluv.hpluvToLch([h * 360, s * 100, l * 100]);
		// Pass normalized LCH to lchuv.xyz
		return lchuv.xyz(lch[0] / 100, lch[1], lch[2] / 360);
	},

	//a shorter way to convert to husl
	hsluv: function (h, s, l) {
		// Denormalize input, get result, normalize output
		const lch = _hsluv.hpluvToLch([h * 360, s * 100, l * 100]);
		const hsl = _hsluv.lchToHsluv(lch);
		return [hsl[0] / 360, hsl[1] / 100, hsl[2] / 100];
	}
};

export default hpluv;

//extend lchuv, xyz
lchuv.hpluv = (l, c, h) => {
	// Denormalize for library (lightness 0-1 → 0-100, hue 0-1 → 0-360)
	const hpl = _hsluv.lchToHpluv([l * 100, c, h * 360]);
	// Normalize output to 0-1 ranges
	return [hpl[0] / 360, hpl[1] / 100, hpl[2] / 100];
};
xyz.hpluv = function (x, y, z) {
	const lch = xyz.lchuv(x, y, z);
	// lch is normalized, pass to lchuv.hpluv
	return lchuv.hpluv(lch[0], lch[1], lch[2]);
};
