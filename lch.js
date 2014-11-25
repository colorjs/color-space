var rgb = require('./rgb');
var xyz = require('./xyz');
var lab = require('./lab');

//cylindrical lab
var lch = module.exports = {
  name: 'lch',
  min: [0,0,0],
  max: [100,100,360],
  channel: ['lightness', 'chroma', 'hue'],
  alias: ['cielch', 'lchab'],

  lab: function(lch) {
    var l = lch[0],
        c = lch[1],
        h = lch[2],
        a, b, hr;

    hr = h / 360 * 2 * Math.PI;
    a = c * Math.cos(hr);
    b = c * Math.sin(hr);
    return [l, a, b];
  },

  xyz: function(args) {
    return lab.xyz(lch.lab(args));
  },

  rgb: function(args) {
    return lab.rgb(lch.lab(args));
  },


  hsl: function(arg) {
    return rgb.hsl(lch.rgb(arg));
  },

  hsv: function(arg) {
    return rgb.hsv(lch.rgb(arg));
  },

  hwb: function(arg) {
    return rgb.hwb(lch.rgb(arg));
  },

  cmyk: function(arg) {
    return rgb.cmyk(lch.rgb(arg));
  },

  luv: function(){

  }
};


//Extend rgb space
rgb.lch = function(args) {
  return lab.lch(rgb.lab(args));
};

xyz.lch = function(args) {
  return lab.lch(xyz.lab(args));
};