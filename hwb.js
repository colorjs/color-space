var rgb = require('rgb');

module.exports = {
  name: 'hwb',
  min: [0,0,0],
  max: [360,100,100],
  channel: ['hue', 'whiteness', 'blackness'],

  // http://dev.w3.org/csswg/css-color/#hwb-to-rgb
  rgb: function(hwb) {
    var h = hwb[0] / 360,
        wh = hwb[1] / 100,
        bl = hwb[2] / 100,
        ratio = wh + bl,
        i, v, f, n;

    var r, g, b;

    // wh + bl cant be > 1
    if (ratio > 1) {
      wh /= ratio;
      bl /= ratio;
    }

    i = Math.floor(6 * h);
    v = 1 - bl;
    f = 6 * h - i;
    if ((i & 0x01) != 0) {
      f = 1 - f;
    }
    n = wh + f * (v - wh);  // linear interpolation

    switch (i) {
      default:
      case 6:
      case 0: r = v; g = n; b = wh; break;
      case 1: r = n; g = v; b = wh; break;
      case 2: r = wh; g = v; b = n; break;
      case 3: r = wh; g = n; b = v; break;
      case 4: r = n; g = wh; b = v; break;
      case 5: r = v; g = wh; b = n; break;
    }

    return [r * 255, g * 255, b * 255];
  },

  hsl: function(args) {
    return rgb.hsl(hwb.rgb(args));
  },

  hsv: function(args) {
    return rgb.hsv(hwb.rgb(args));
  },

  cmyk: function(args) {
    return rgb.cmyk(hwb.rgb(args));
  },


  xyz: function(args) {
    return rgb.xyz(hwb.rgb(args));
  },

  lab: function(arg) {
    return rgb.lab(hwb.rgb(arg));
  },

  lch: function(arg) {
    return rgb.lch(hwb.rgb(arg));
  },

  luv: function(arg) {
    return rgb.luv(hwb.rgb(arg));
  }
};
