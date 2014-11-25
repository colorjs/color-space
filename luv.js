var xyz = require('./xyz');
var rgb = require('./rgb');

var luv = module.exports = {
  name: 'luv',
  min: [0,-100,-100],
  max: [100,100,100],
  channel: ['lightness', 'u', 'v'],
  alias: ['cieluv'],

  xyz: function(arg, i, o){
    var _u, _v, l, u, v, x, y, z, xn, yn, zn, un, vn;

    //get constants
    var e = 0.008856451679035631; //(6/29)^3
    var k = 0.0011070564598794539; //(3/29)^3

    //get illuminant/observer
    i = i || 'D65';
    o = o || 2;

    xn = xyz.observer[o][i][0];
    yn = xyz.observer[o][i][1];
    zn = xyz.observer[o][i][2];

    un = (4 * xn) / (xn + (15 * yn) + (3 * zn));
    vn = (9 * yn) / (xn + (15 * yn) + (3 * zn));


    l = arg[0], u = arg[1], v = arg[2];

    _u = u / (13 * l) + un || 0;
    _v = v / (13 * l) + vn || 0;

    y = l > 8 ? yn * Math.pow( (l + 16) / 116 , 3) : yn * l * k;

    x = y * 9 * _u / (4 * _v);

    z = y * (12 - 3 * _u - 20 * _v) / (4 * _v);


    return [x, y, z];
  }
};


//http://www.brucelindbloom.com/index.html?Equations.html
//i - illuminant
//o - observer
xyz.luv = function(arg, i, o) {
  var _u, _v, l, u, v, x, y, z, xn, yn, zn, un, vn;

  //get constants
  var e = 0.008856451679035631; //(6/29)^3
  var k = 903.2962962962961; //(29/3)^3

  //get illuminant/observer
  i = i || 'D65';
  o = o || 2;

  xn = xyz.observer[o][i][0];
  yn = xyz.observer[o][i][1];
  zn = xyz.observer[o][i][2];

  un = (4 * xn) / (xn + (15 * yn) + (3 * zn));
  vn = (9 * yn) / (xn + (15 * yn) + (3 * zn));


  x = arg[0], y = arg[1], z = arg[2];


  _u = (4 * x) / (x + (15 * y) + (3 * z)) || 0;
  _v = (9 * y) / (x + (15 * y) + (3 * z)) || 0;

  var yr = y/yn;

  l = yr <= e ? k * yr : 116 * Math.pow(yr, 1/3) - 16;

  u = 13 * l * (_u - un);
  v = 13 * l * (_v - vn);

  return [l, u, v];
};


rgb.luv = function(args){
  return xyz.luv(rgb.xyz(args));
};