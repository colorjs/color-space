var xyz = require('./xyz');

var luv = module.exports = {
  name: 'luv',

  min: [0,-100,-100],
  max: [100,100,100],
  channel: ['lightness', 'u', 'v'],
  alias: ['cieluv'],

  //Yn, un,vn: http://www.optique-ingenieur.org/en/courses/OPI_ang_M07_C02/co/Contenu_08.html
  illuminant: {
    A:[100, 255.97, 524.29],
    C: [100, 200.89, 460.89],
    E: [100,100,100],
    D65: [100, 197, 468.34]
  },

  xyz: function(luv){

  },

  lchuv: function(luv){
    var C = Math.sqrt();
  }
};


//http://www.brucelindbloom.com/index.html?Equations.html
xyz.luv = function(arg, i) {
  var _u, _v, l, u, v, x, y, z, yn, un, vn;

  //get constants
  var e = 0.008856451679035631; //(6/29)^3
  var k = 903.2962962962961; //(29/3)^3

  //get illuminant
  i = i || 'D65';

  yn = xyz.illuminant[i][1];
  un = luv.illuminant[i][1]/100;
  vn = luv.illuminant[i][2]/100;

  x = arg[0]/100, y = arg[1]/100, z = arg[2]/100;

  _u = (4 * x) / (x + (15 * y) + (3 * z));
  _v = (9 * y) / (x + (15 * y) + (3 * z));

  var yr = y/yn;

  l = yr <= e ? k * yr : 116 * Math.pow(yr, .333333333) - 16;

  u = 13 * l * (_u - un);
  v = 13 * l * (_v - vn);

  return [l, u, v];
};