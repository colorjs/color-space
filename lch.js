var xyz = require('./xyz');
var lab = require('./lab');


//cylindrical lab
var lch = module.exports = {
  name: 'lch',
  min: [0,0,0],
  max: [100,100,360],
  channel: ['lightness', 'chroma', 'hue'],
  alias: ['cielch', 'lchab'],

  xyz: function(arg) {
    return lab.xyz(lch.lab(arg));
  },

  lab: function(lch) {
    var l = lch[0],
        c = lch[1],
        h = lch[2],
        a, b, hr;

    hr = h / 360 * 2 * Math.PI;
    a = c * Math.cos(hr);
    b = c * Math.sin(hr);
    return [l, a, b];
  }
};


//extend lab
lab.lch = function(lab) {
  var l = lab[0],
      a = lab[1],
      b = lab[2],
      hr, h, c;

  hr = Math.atan2(b, a);
  h = hr * 360 / 2 / Math.PI;
  if (h < 0) {
    h += 360;
  }
  c = Math.sqrt(a * a + b * b);
  return [l, c, h];
};

xyz.lch = function(arg){
  return lab.lch(xyz.lab(arg));
};