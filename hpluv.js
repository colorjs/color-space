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
	min: [0, 0, 0],
	max: [360, 100, 100],
	channel: ['hue', 'saturation', 'lightness'],
	alias: ['HPLuv', 'HuSLp'],

	lchuv: (h, s, l) => _hsluv.hpluvToLch([h, s, l]),
	xyz: function (h, s, l) { return lchuv.xyz(..._hsluv.hpluvToLch([h, s, l])); },

	//a shorter way to convert to husl
	hsluv: function (h, s, l) {
		return _hsluv.lchToHsluv(_hsluv.hpluvToLch([h, s, l]));
	}
};

export default hpluv;

//extend lchuv, xyz
lchuv.hpluv = (l, c, h) => _hsluv.lchToHpluv([l, c, h]);
xyz.hpluv = function (x, y, z) { return _hsluv.lchToHpluv(xyz.lchuv(x, y, z)); };
