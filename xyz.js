var rgb = require('./rgb');

var xyz = module.exports = {
  name: 'xyz',
  min: [0,0,0],
  max: [96,100,109],
  channel: ['lightness','u','v'],
  alias: ['ciexyz'],

  //Xn, Yn, Zn
  illuminant: {
    A:[109.85, 100, 35.58],
    C: [98.07, 100, 118.23],
    E: [100,100,100],
    D65: [95.04, 100, 108.88]
  },


  //TODO: fix this maths so to return 255,255,255 in rgb
  rgb: function(xyz) {
    var x = xyz[0] / 100,
        y = xyz[1] / 100,
        z = xyz[2] / 100,
        r, g, b;

    // assume sRGB
    // http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
    r = (x * 3.2404542) + (y * -1.5371385) + (z * -0.4985314);
    g = (x * -0.9692660) + (y * 1.8760108) + (z * 0.0415560);
    b = (x * 0.0556434) + (y * -0.2040259) + (z * 1.0572252);

    r = r > 0.0031308 ? ((1.055 * Math.pow(r, 1.0 / 2.4)) - 0.055)
      : r = (r * 12.92);

    g = g > 0.0031308 ? ((1.055 * Math.pow(g, 1.0 / 2.4)) - 0.055)
      : g = (g * 12.92);

    b = b > 0.0031308 ? ((1.055 * Math.pow(b, 1.0 / 2.4)) - 0.055)
      : b = (b * 12.92);

    r = Math.min(Math.max(0, r), 1);
    g = Math.min(Math.max(0, g), 1);
    b = Math.min(Math.max(0, b), 1);

    return [r * 255, g * 255, b * 255];
  },

  hsl: function(arg) {
    return rgb.hsl(xyz.rgb(arg));
  },

  hsv: function(arg) {
    return rgb.hsv(xyz.rgb(arg));
  },

  hwb: function(arg) {
    return rgb.hwb(xyz.rgb(arg));
  },

  cmyk: function(arg) {
    return rgb.cmyk(xyz.rgb(arg));
  },

  lab: function(xyz) {
    var x = xyz[0],
        y = xyz[1],
        z = xyz[2],
        l, a, b;

    x /= 95.047;
    y /= 100;
    z /= 108.883;

    x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + (16 / 116);
    y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + (16 / 116);
    z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + (16 / 116);

    l = (116 * y) - 16;
    a = 500 * (x - y);
    b = 200 * (y - z);

    return [l, a, b];
  },

  //TODO
  cam: function(xyz){
    var x = xyz[0], y = xyz[1], z = xyz[2];

    //Mcat02
    var m =[[0.7328, 0.4296, -0.1624], [-0.7036, 1.6975, 0.0061], [0.0030, 0.0136, 0.9834]];

    //get lms
    var L = x*m[0][0] + y*m[0][1]  + z*m[0][2];
    var M =  x*m[1][0] + y*m[1][1] + z*m[1][2];
    var S = x*m[2][0] + y*m[2][1] + z*m[2][2];

    //calc lc, mc, sc
    //FIXME: choose proper d
    var d = 0.85;
    var Lwr = 100, Mwr = 100, Swr = 100;
    var Lc = (Lwr*D/Lw + 1 - D) * L;
    var Mc = (Mwr*D/Mw + 1 - D) * M;
    var Sc = (Swr*D/Sw + 1 - D) * S;
  }
};