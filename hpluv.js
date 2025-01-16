/**
 * A uniform wrapper for hpluv.
 * // http://www.hsluv.org/
 *
 * @module color-space/hpluv
 */
import xyz from './xyz.js';
import lchuv from './lchuv.js';
import hsluv, {_hsluv} from './hsluv.js';


/** @type {import('./index.js').ColorSpace} */
var hpluv = /** @type {*} */ ({
	name: 'hpluv',
	min: [0,0,0],
	max: [360,100,100],
	channel: ['hue', 'saturation', 'lightness'],
	alias: ['HPLuv', 'HuSLp'],

	lchuv: _hsluv.hpluvToLch,
	/** @type {import('./index.js').Transform} */
	xyz: function(arg){return lchuv.xyz(_hsluv.hpluvToLch(arg));},

	//a shorter way to convert to husl
	/** @type {import('./index.js').Transform} */
	hsluv: function(arg){
		return _hsluv.lchToHsluv( _hsluv.hpluvToLch(arg));
	}
});

export default hpluv;

//extend lchuv, xyz
lchuv.hpluv = _hsluv.lchToHpluv;
xyz.hpluv = function(arg){return _hsluv.lchToHpluv(xyz.lchuv(arg));};
