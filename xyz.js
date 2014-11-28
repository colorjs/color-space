var rgb = require('./rgb');

var xyz = module.exports = {
  name: 'xyz',
  min: [0,0,0],
  max: [96,100,109],
  channel: ['lightness','u','v'],
  alias: ['ciexyz'],

  //observer/illuminant
  // http://en.wikipedia.org/wiki/Standard_illuminant
  //Xn, Yn, Zn
  whitepoint: {
    2: {
      //incadescent
      A:[109.85, 100, 35.585],
      // B:[],
      C: [98.074, 100, 118.232],
      D50: [96.422, 100, 82.521],
      D55: [95.682, 100, 92.149],
      //daylight
      D65: [95.047, 100, 108.883],
      D75: [94.972, 100, 122.638],
      //flourescent
      // F1: [],
      F2: [99.187, 100, 67.395],
      // F3: [],
      // F4: [],
      // F5: [],
      // F6:[],
      F7: [95.044, 100, 108.755],
      // F8: [],
      // F9: [],
      // F10: [],
      F11: [100.966, 100, 64.370],
      // F12: [],
      E: [100,100,100]
    },

    10: {
      //incadescent
      A:[111.144, 100, 35.200],
      C: [97.285, 100, 116.145],
      D50: [96.720, 100, 81.427],
      D55: [95.799, 100, 90.926],
      //daylight
      D65: [94.811, 100, 107.304],
      D75: [94.416, 100, 120.641],
      //flourescent
      F2: [103.280, 100, 69.026],
      F7: [95.792, 100, 107.687],
      F11: [103.866, 100, 65.627],
      E: [100,100,100]
    }
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
  }
};


//extend rgb
rgb.xyz = function(rgb) {
  var r = rgb[0] / 255,
      g = rgb[1] / 255,
      b = rgb[2] / 255;

  // assume sRGB
  r = r > 0.04045 ? Math.pow(((r + 0.055) / 1.055), 2.4) : (r / 12.92);
  g = g > 0.04045 ? Math.pow(((g + 0.055) / 1.055), 2.4) : (g / 12.92);
  b = b > 0.04045 ? Math.pow(((b + 0.055) / 1.055), 2.4) : (b / 12.92);

  var x = (r * 0.4124) + (g * 0.3576) + (b * 0.1805);
  var y = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
  var z = (r * 0.0193) + (g * 0.1192) + (b * 0.9505);

  return [x * 100, y *100, z * 100];
};