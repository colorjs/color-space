var xyz = require('./xyz');
var lchuv = require('./lch');
var _husl = require('husl');

/**
 * A uniform wrapper for huslp.
 * // http://www.boronine.com/husl/
 *
 * @module color-space/huslp
 */
module.exports = {
	lchuv: _husl._conv.lch.huslp,
	xyz: function(arg){return lchuv.xyz(_husl._conv.huslp.lch(arg));}
};

//extend lchuv, xyz
lchuv.huslp = _husl._conv.lch.huslp;
xyz.huslp = function(arg){return _husl._conv.lch.huslp(xyz.lchuv(arg));};