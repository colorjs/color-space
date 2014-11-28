var xyz = require('./xyz');
var lchuv = require('./lch');
var _husl = require('husl');

/**
 * A uniform wrapper for husl.
 * // http://www.boronine.com/husl/
 *
 * @module color-space/husl
 */

module.exports = {
	lchuv: _husl._conv.lch.husl,
	xyz: function(arg){return lchuv.xyz(_husl._conv.husl.lch(arg));}
};

//extend lchuv, xyz
lchuv.husl = _husl._conv.lch.husl;
xyz.husl = function(arg){return _husl._conv.lch.husl(xyz.lchuv(arg));};