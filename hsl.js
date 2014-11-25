var rgb = require('rgb');

var hsl = module.exports = {
  name: 'hsl',
  min: [0,0,0],
  max: [360,100,100],
  channel: ['hue', 'saturation', 'lightness'],

  rgb: function(hsl) {
    var h = hsl[0] / 360,
        s = hsl[1] / 100,
        l = hsl[2] / 100,
        t1, t2, t3, rgb, val;

    if (s == 0) {
      val = l * 255;
      return [val, val, val];
    }

    if (l < 0.5)
      t2 = l * (1 + s);
    else
      t2 = l + s - l * s;
    t1 = 2 * l - t2;

    rgb = [0, 0, 0];
    for (var i = 0; i < 3; i++) {
      t3 = h + 1 / 3 * - (i - 1);
      t3 < 0 && t3++;
      t3 > 1 && t3--;

      if (6 * t3 < 1)
        val = t1 + (t2 - t1) * 6 * t3;
      else if (2 * t3 < 1)
        val = t2;
      else if (3 * t3 < 2)
        val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
      else
        val = t1;

      rgb[i] = val * 255;
    }

    return rgb;
  },

  hsv: function(hsl) {
    var h = hsl[0],
        s = hsl[1] / 100,
        l = hsl[2] / 100,
        sv, v;
    l *= 2;
    s *= (l <= 1) ? l : 2 - l;
    v = (l + s) / 2;
    sv = (2 * s) / (l + s);
    return [h, sv * 100, v * 100];
  },

  hwb: function(args) {
    return rgb.hwb(hsl.rgb(args));
  },

  cmyk: function(args) {
    return rgb.cmyk(hsl.rgb(args));
  },


  xyz: function(arg) {
    return rgb.xyz(hsl.rgb(arg));
  },

  lab: function(arg) {
    return rgb.lab(hsl.rgb(arg));
  },

  lch: function(arg) {
    return rgb.lch(hsl.rgb(arg));
  },

  luv: function(arg) {
    return rgb.luv(hsl.rgb(arg));
  }
};