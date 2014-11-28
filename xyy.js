var xyz = require('./xyz');

var xyy = module.exports = {
  name: 'xyy',
  min: [0,0,0],
  max: [100,100,100],
  channel: ['x','y','Y'],
  alias: ['Yxy', 'xyY', 'yxy'],

  // https://github.com/boronine/colorspaces.js/blob/master/colorspaces.js#L128
  xyz: function(arg) {
	var _X, _Y, _Z, _x, _y;
	_x = arg[0], _y = arg[1], _Y = arg[2];
	if (_y === 0) {
		return [0, 0, 0];
	}
	_X = _x * _Y / _y;
	_Z = (1 - _x - _y) * _Y / _y;
	return [_X, _Y, _Z];
  }
};


//extend xyz
xyz.xyy = function(arg) {
	var sum, _X, _Y, _Z;
	_X = arg[0], _Y = arg[1], _Z = arg[2];
	sum = _X + _Y + _Z;
	if (sum === 0) {
		return [0, 0, _Y];
	}
	return [_X / sum, _Y / sum, _Y];
};