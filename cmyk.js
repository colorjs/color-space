var rgb = require('rgb');

var cmyk = module.exports = {
  name: 'cmyk',
  min: [0,0,0,0],
  max: [100,100,100,100],
  channel: ['cyan', 'magenta', 'yellow', 'black'],

  rgb: function(cmyk) {
    var c = cmyk[0] / 100,
        m = cmyk[1] / 100,
        y = cmyk[2] / 100,
        k = cmyk[3] / 100,
        r, g, b;

    r = 1 - Math.min(1, c * (1 - k) + k);
    g = 1 - Math.min(1, m * (1 - k) + k);
    b = 1 - Math.min(1, y * (1 - k) + k);
    return [r * 255, g * 255, b * 255];
  },

  hsl: function(args) {
    return rgb.hsl(cmyk.rgb(args));
  },

  hsv: function(args) {
    return rgb.hsv(cmyk.rgb(args));
  },

  hwb: function(args) {
    return rgb.hwb(cmyk.rgb(args));
  },


  xyz: function(arg) {
    return rgb.xyz(cmyk.rgb(arg));
  },

  lab: function(arg) {
    return rgb.lab(cmyk.rgb(arg));
  },

  lch: function(arg) {
    return rgb.lch(cmyk.rgb(arg));
  },

  luv: function(arg) {
    return rgb.luv(cmyk.rgb(arg));
  }
};