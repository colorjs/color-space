var rgb = require('rgb');
var xyz = require('xyz');

var lab = module.exports = {
  name: 'lab',
  min: [0,-100,-100],
  max: [100,100,100],
  channel: ['lightness', 'a', 'b'],
  alias: ['cielab'],

  xyz: function(lab) {
    var l = lab[0],
        a = lab[1],
        b = lab[2],
        x, y, z, y2;

    if (l <= 8) {
      y = (l * 100) / 903.3;
      y2 = (7.787 * (y / 100)) + (16 / 116);
    } else {
      y = 100 * Math.pow((l + 16) / 116, 3);
      y2 = Math.pow(y / 100, 1/3);
    }

    x = x / 95.047 <= 0.008856 ? x = (95.047 * ((a / 500) + y2 - (16 / 116))) / 7.787 : 95.047 * Math.pow((a / 500) + y2, 3);

    z = z / 108.883 <= 0.008859 ? z = (108.883 * (y2 - (b / 200) - (16 / 116))) / 7.787 : 108.883 * Math.pow(y2 - (b / 200), 3);

    return [x, y, z];
  },

  lch: function(lab) {
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
  },

  luv: function(arg) {
  },


  rgb: function(args) {
    return xyz.rgb(lab.xyz(args));
  },

  hsl: function(arg) {
    return rgb.hsl(lab.rgb(arg));
  },

  hsv: function(arg) {
    return rgb.hsv(lab.rgb(arg));
  },

  hwb: function(arg) {
    return rgb.hwb(lab.rgb(arg));
  },

  cmyk: function(arg) {
    return rgb.cmyk(lab.rgb(arg));
  }
};

//