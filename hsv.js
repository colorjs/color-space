var rgb = require('./rgb');

var hsv = module.exports = {
  name: 'hsv',
  min: [0,0,0],
  max: [360,100,100],
  channel: ['hue', 'saturation', 'value'],
  alias: ['hsb'],

  rgb: function(hsv) {
    var h = hsv[0] / 60,
        s = hsv[1] / 100,
        v = hsv[2] / 100,
        hi = Math.floor(h) % 6;

    var f = h - Math.floor(h),
        p = 255 * v * (1 - s),
        q = 255 * v * (1 - (s * f)),
        t = 255 * v * (1 - (s * (1 - f))),
        v = 255 * v;

    switch(hi) {
      case 0:
        return [v, t, p];
      case 1:
        return [q, v, p];
      case 2:
        return [p, v, t];
      case 3:
        return [p, q, v];
      case 4:
        return [t, p, v];
      case 5:
        return [v, p, q];
    }
  },

  hsl: function(hsv) {
    var h = hsv[0],
      s = hsv[1] / 100,
      v = hsv[2] / 100,
      sl, l;

    l = (2 - s) * v;
    sl = s * v;
    sl /= (l <= 1) ? l : 2 - l;
    sl = sl || 0;
    l /= 2;
    return [h, sl * 100, l * 100];
  },

  hwb: function(args) {
    return rgb.hwb(hsv.rgb(args))
  },

  cmyk: function(args) {
    return rgb.cmyk(hsv.rgb(args));
  },



  xyz: function(arg) {
    return rgb.xyz(hsv.rgb(arg));
  },

  lab: function(arg) {
    return rgb.lab(hsv.rgb(arg));
  },

  lch: function(arg) {
    return rgb.lch(hsv.rgb(arg));
  },

  luv: function(arg) {
    return rgb.luv(hsv.rgb(arg));
  }
};