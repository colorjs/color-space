// rgb.js
var rgb = {
  name: "rgb",
  min: [0, 0, 0],
  max: [255, 255, 255],
  channel: ["red", "green", "blue"],
  alias: ["RGB"]
};
var rgb_default = rgb;

// hsl.js
var hsl = {
  name: "hsl",
  min: [0, 0, 0],
  max: [360, 100, 100],
  channel: ["hue", "saturation", "lightness"],
  alias: ["HSL"],
  rgb: function(hsl2) {
    var h = hsl2[0] / 360, s = hsl2[1] / 100, l2 = hsl2[2] / 100, t1, t2, t3, rgb2, val, i2 = 0;
    if (s === 0) return val = l2 * 255, [val, val, val];
    t2 = l2 < 0.5 ? l2 * (1 + s) : l2 + s - l2 * s;
    t1 = 2 * l2 - t2;
    rgb2 = [0, 0, 0];
    for (; i2 < 3; ) {
      t3 = h + 1 / 3 * -(i2 - 1);
      t3 < 0 ? t3++ : t3 > 1 && t3--;
      val = 6 * t3 < 1 ? t1 + (t2 - t1) * 6 * t3 : 2 * t3 < 1 ? t2 : 3 * t3 < 2 ? t1 + (t2 - t1) * (2 / 3 - t3) * 6 : t1;
      rgb2[i2++] = val * 255;
    }
    return rgb2;
  }
};
var hsl_default = hsl;
rgb_default.hsl = function(rgb2) {
  var r2 = rgb2[0] / 255, g2 = rgb2[1] / 255, b = rgb2[2] / 255, min = Math.min(r2, g2, b), max = Math.max(r2, g2, b), delta = max - min, h, s, l2;
  if (max === min) {
    h = 0;
  } else if (r2 === max) {
    h = (g2 - b) / delta;
  } else if (g2 === max) {
    h = 2 + (b - r2) / delta;
  } else if (b === max) {
    h = 4 + (r2 - g2) / delta;
  }
  h = Math.min(h * 60, 360);
  if (h < 0) {
    h += 360;
  }
  l2 = (min + max) / 2;
  if (max === min) {
    s = 0;
  } else if (l2 <= 0.5) {
    s = delta / (max + min);
  } else {
    s = delta / (2 - max - min);
  }
  return [h, s * 100, l2 * 100];
};

// hsv.js
var hsv = {
  name: "hsv",
  min: [0, 0, 0],
  max: [360, 100, 100],
  channel: ["hue", "saturation", "value"],
  alias: ["HSV", "HSB"],
  rgb: function(hsv2) {
    var h = hsv2[0] / 60, s = hsv2[1] / 100, v2 = hsv2[2] / 100, hi = Math.floor(h) % 6;
    var f2 = h - Math.floor(h), p2 = 255 * v2 * (1 - s), q2 = 255 * v2 * (1 - s * f2), t2 = 255 * v2 * (1 - s * (1 - f2));
    v2 *= 255;
    switch (hi) {
      case 0:
        return [v2, t2, p2];
      case 1:
        return [q2, v2, p2];
      case 2:
        return [p2, v2, t2];
      case 3:
        return [p2, q2, v2];
      case 4:
        return [t2, p2, v2];
      case 5:
        return [v2, p2, q2];
    }
  },
  hsl: function(hsv2) {
    var h = hsv2[0], s = hsv2[1] / 100, v2 = hsv2[2] / 100, sl, l2;
    l2 = (2 - s) * v2;
    sl = s * v2;
    sl /= l2 <= 1 ? l2 : 2 - l2;
    sl = sl || 0;
    l2 /= 2;
    return [h, sl * 100, l2 * 100];
  }
};
var hsv_default = hsv;
rgb_default.hsv = function(rgb2) {
  var r2 = rgb2[0], g2 = rgb2[1], b = rgb2[2], min = Math.min(r2, g2, b), max = Math.max(r2, g2, b), delta = max - min, h, s, v2;
  if (max === 0) {
    s = 0;
  } else {
    s = delta / max * 100;
  }
  if (max === min) {
    h = 0;
  } else if (r2 === max) {
    h = (g2 - b) / delta;
  } else if (g2 === max) {
    h = 2 + (b - r2) / delta;
  } else if (b === max) {
    h = 4 + (r2 - g2) / delta;
  }
  h = Math.min(h * 60, 360);
  if (h < 0) {
    h += 360;
  }
  v2 = max / 255 * 1e3 / 10;
  return [h, s, v2];
};
hsl_default.hsv = function(hsl2) {
  var h = hsl2[0], s = hsl2[1] / 100, l2 = hsl2[2] / 100, sv, v2;
  l2 *= 2;
  s *= l2 <= 1 ? l2 : 2 - l2;
  v2 = (l2 + s) / 2;
  sv = 2 * s / (l2 + s) || 0;
  return [h, sv * 100, v2 * 100];
};

// hsi.js
var hsi = {
  name: "hsi",
  min: [0, 0, 0],
  max: [360, 100, 255],
  channel: ["hue", "saturation", "intensity"],
  alias: ["HSI"]
};
var hsi_default = hsi;
hsi.rgb = function(hsi2) {
  var h = (hsi2[0] < 0 ? hsi2[0] % 360 + 360 : hsi2[0] % 360) * Math.PI / 180;
  var s = Math.max(0, Math.min(hsi2[1], 100)) / 100;
  var i2 = Math.max(0, Math.min(hsi2[2], 255)) / 255;
  var pi3 = Math.PI / 3;
  var r2, g2, b;
  if (h < 2 * pi3) {
    b = i2 * (1 - s);
    r2 = i2 * (1 + s * Math.cos(h) / Math.cos(pi3 - h));
    g2 = i2 * (1 + s * (1 - Math.cos(h) / Math.cos(pi3 - h)));
  } else if (h < 4 * pi3) {
    h = h - 2 * pi3;
    r2 = i2 * (1 - s);
    g2 = i2 * (1 + s * Math.cos(h) / Math.cos(pi3 - h));
    b = i2 * (1 + s * (1 - Math.cos(h) / Math.cos(pi3 - h)));
  } else {
    h = h - 4 * pi3;
    g2 = i2 * (1 - s);
    b = i2 * (1 + s * Math.cos(h) / Math.cos(pi3 - h));
    r2 = i2 * (1 + s * (1 - Math.cos(h) / Math.cos(pi3 - h)));
  }
  return [r2 * 255, g2 * 255, b * 255];
};
rgb_default.hsi = function(rgb2) {
  var sum = rgb2[0] + rgb2[1] + rgb2[2];
  var r2 = rgb2[0] / sum;
  var g2 = rgb2[1] / sum;
  var b = rgb2[2] / sum;
  var h = Math.acos(
    0.5 * (r2 - g2 + (r2 - b)) / Math.sqrt((r2 - g2) * (r2 - g2) + (r2 - b) * (g2 - b))
  );
  if (b > g2) {
    h = 2 * Math.PI - h;
  }
  var s = 1 - 3 * Math.min(r2, g2, b);
  var i2 = sum / 3;
  return [h * 180 / Math.PI, s * 100, i2];
};

// hwb.js
var hwb = {
  name: "hwb",
  min: [0, 0, 0],
  max: [360, 100, 100],
  channel: ["hue", "whiteness", "blackness"],
  alias: ["HWB"],
  // http://dev.w3.org/csswg/css-color/#hwb-to-rgb
  rgb: function(hwb2) {
    var h = hwb2[0] / 360, wh = hwb2[1] / 100, bl = hwb2[2] / 100, ratio = wh + bl, i2, v2, f2, n2;
    var r2, g2, b;
    if (ratio > 1) {
      wh /= ratio;
      bl /= ratio;
    }
    i2 = Math.floor(6 * h);
    v2 = 1 - bl;
    f2 = 6 * h - i2;
    if ((i2 & 1) !== 0) {
      f2 = 1 - f2;
    }
    n2 = wh + f2 * (v2 - wh);
    switch (i2) {
      default:
      case 6:
      case 0:
        r2 = v2;
        g2 = n2;
        b = wh;
        break;
      case 1:
        r2 = n2;
        g2 = v2;
        b = wh;
        break;
      case 2:
        r2 = wh;
        g2 = v2;
        b = n2;
        break;
      case 3:
        r2 = wh;
        g2 = n2;
        b = v2;
        break;
      case 4:
        r2 = n2;
        g2 = wh;
        b = v2;
        break;
      case 5:
        r2 = v2;
        g2 = wh;
        b = n2;
        break;
    }
    return [r2 * 255, g2 * 255, b * 255];
  },
  // http://alvyray.com/Papers/CG/HWB_JGTv208.pdf
  hsv: function(arg) {
    var h = arg[0], w = arg[1], b = arg[2], s, v2;
    if (w + b >= 100) {
      s = 0;
      v2 = 100 * w / (w + b);
    } else {
      s = 100 - w / (1 - b / 100);
      v2 = 100 - b;
    }
    return [h, s, v2];
  },
  hsl: function(arg) {
    return hsv_default.hsl(hwb.hsv(arg));
  }
};
var hwb_default = hwb;
rgb_default.hwb = function(val) {
  var r2 = val[0], g2 = val[1], b = val[2], h = rgb_default.hsl(val)[0], w = 1 / 255 * Math.min(r2, Math.min(g2, b));
  b = 1 - 1 / 255 * Math.max(r2, Math.max(g2, b));
  return [h, w * 100, b * 100];
};
hsv_default.hwb = function(arg) {
  var h = arg[0], s = arg[1], v2 = arg[2];
  return [h, v2 === 0 ? 0 : v2 * (1 - s / 100), 100 - v2];
};
hsl_default.hwb = function(arg) {
  return hsv_default.hwb(hsl_default.hsv(arg));
};

// cmyk.js
var cmyk = {
  name: "cmyk",
  min: [0, 0, 0, 0],
  max: [100, 100, 100, 100],
  channel: ["cyan", "magenta", "yellow", "black"],
  alias: ["CMYK"],
  rgb: (cmyk2) => {
    let c = cmyk2[0] / 100, m2 = cmyk2[1] / 100, y = cmyk2[2] / 100, k2 = cmyk2[3] / 100, r2, g2, b;
    r2 = 1 - Math.min(1, c * (1 - k2) + k2), g2 = 1 - Math.min(1, m2 * (1 - k2) + k2), b = 1 - Math.min(1, y * (1 - k2) + k2);
    return [r2 * 255, g2 * 255, b * 255];
  }
};
rgb_default.cmyk = (rgb2) => {
  let r2 = rgb2[0] / 255, g2 = rgb2[1] / 255, b = rgb2[2] / 255, c, m2, y, k2;
  k2 = Math.min(1 - r2, 1 - g2, 1 - b);
  c = (1 - r2 - k2) / (1 - k2) || 0;
  m2 = (1 - g2 - k2) / (1 - k2) || 0;
  y = (1 - b - k2) / (1 - k2) || 0;
  return [c * 100, m2 * 100, y * 100, k2 * 100];
};
var cmyk_default = cmyk;

// cmy.js
var cmy = {
  name: "cmy",
  min: [0, 0, 0],
  max: [100, 100, 100],
  channel: ["cyan", "magenta", "yellow"],
  alias: ["CMY"]
};
cmy.rgb = ([c, m2, y]) => [
  (1 - c / 100) * 255,
  (1 - m2 / 100) * 255,
  (1 - y / 100) * 255
];
rgb_default.cmy = ([r2, g2, b]) => [
  (1 - r2 / 255) * 100 || 0,
  (1 - g2 / 255) * 100 || 0,
  (1 - b / 255) * 100 || 0
];
var cmy_default = cmy;

// xyz.js
var xyz = {
  name: "xyz",
  min: [0, 0, 0],
  channel: ["X", "Y", "Z"],
  alias: ["XYZ", "ciexyz", "cie1931"],
  // Whitepoint reference values with observer/illuminant
  // http://en.wikipedia.org/wiki/Standard_illuminant
  whitepoint: {
    //1931 2°
    2: {
      //incadescent
      A: [109.85, 100, 35.585],
      // B:[],
      C: [98.074, 100, 118.232],
      D50: [96.422, 100, 82.521],
      D55: [95.682, 100, 92.149],
      //daylight
      D65: [95.045592705167, 100, 108.9057750759878],
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
      F11: [100.966, 100, 64.37],
      // F12: [],
      E: [100, 100, 100]
    },
    //1964  10°
    10: {
      //incadescent
      A: [111.144, 100, 35.2],
      C: [97.285, 100, 116.145],
      D50: [96.72, 100, 81.427],
      D55: [95.799, 100, 90.926],
      //daylight
      D65: [94.811, 100, 107.304],
      D75: [94.416, 100, 120.641],
      //flourescent
      F2: [103.28, 100, 69.026],
      F7: [95.792, 100, 107.687],
      F11: [103.866, 100, 65.627],
      E: [100, 100, 100]
    }
  }
};
xyz.max = xyz.whitepoint[2].D65;
xyz.rgb = function(_xyz, white) {
  white = white || xyz.whitepoint[2].E;
  var x = _xyz[0] / white[0], y = _xyz[1] / white[1], z = _xyz[2] / white[2], r2, g2, b;
  r2 = x * 3.240969941904521 + y * -1.537383177570093 + z * -0.498610760293;
  g2 = x * -0.96924363628087 + y * 1.87596750150772 + z * 0.041555057407175;
  b = x * 0.055630079696993 + y * -0.20397695888897 + z * 1.056971514242878;
  r2 = r2 > 31308e-7 ? 1.055 * Math.pow(r2, 1 / 2.4) - 0.055 : r2 = r2 * 12.92;
  g2 = g2 > 31308e-7 ? 1.055 * Math.pow(g2, 1 / 2.4) - 0.055 : g2 = g2 * 12.92;
  b = b > 31308e-7 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : b = b * 12.92;
  r2 = Math.min(Math.max(0, r2), 1);
  g2 = Math.min(Math.max(0, g2), 1);
  b = Math.min(Math.max(0, b), 1);
  return [r2 * 255, g2 * 255, b * 255];
};
rgb_default.xyz = function(rgb2, white) {
  var r2 = rgb2[0] / 255, g2 = rgb2[1] / 255, b = rgb2[2] / 255;
  r2 = r2 > 0.04045 ? Math.pow((r2 + 0.055) / 1.055, 2.4) : r2 / 12.92;
  g2 = g2 > 0.04045 ? Math.pow((g2 + 0.055) / 1.055, 2.4) : g2 / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  var x = r2 * 0.41239079926595 + g2 * 0.35758433938387 + b * 0.18048078840183;
  var y = r2 * 0.21263900587151 + g2 * 0.71516867876775 + b * 0.072192315360733;
  var z = r2 * 0.019330818715591 + g2 * 0.11919477979462 + b * 0.95053215224966;
  white = white || xyz.whitepoint[2].E;
  return [x * white[0], y * white[1], z * white[2]];
};
var xyz_default = xyz;

// xyy.js
var xyy = {
  name: "xyy",
  min: [0, 0, 0],
  max: [1, 1, 100],
  channel: ["x", "y", "Y"],
  alias: ["xyY", "Yxy", "yxy"]
};
xyy.xyz = function(arg) {
  var X, Y, Z, x, y;
  x = arg[0];
  y = arg[1];
  Y = arg[2];
  if (y === 0) {
    return [0, 0, 0];
  }
  X = x * Y / y;
  Z = (1 - x - y) * Y / y;
  return [X, Y, Z];
};
xyz_default.xyy = function(arg) {
  var sum, X, Y, Z;
  X = arg[0];
  Y = arg[1];
  Z = arg[2];
  sum = X + Y + Z;
  if (sum === 0) {
    return [0, 0, Y];
  }
  return [X / sum, Y / sum, Y];
};
var xyy_default = xyy;

// yiq.js
var yiq = {
  name: "yiq",
  min: [0, -0.5957, -0.5226],
  max: [1, 0.5957, 0.5226],
  channel: ["Y", "I", "Q"],
  alias: ["YIQ"]
};
yiq.rgb = function(yiq2) {
  var y = yiq2[0], i2 = yiq2[1], q2 = yiq2[2], r2, g2, b;
  r2 = y * 1 + i2 * 0.956 + q2 * 0.621;
  g2 = y * 1 + i2 * -0.272 + q2 * -0.647;
  b = y * 1 + i2 * -1.108 + q2 * 1.705;
  r2 = Math.min(Math.max(0, r2), 1);
  g2 = Math.min(Math.max(0, g2), 1);
  b = Math.min(Math.max(0, b), 1);
  return [r2 * 255, g2 * 255, b * 255];
};
rgb_default.yiq = function(rgb2) {
  var r2 = rgb2[0] / 255, g2 = rgb2[1] / 255, b = rgb2[2] / 255;
  var y = r2 * 0.299 + g2 * 0.587 + b * 0.114;
  var i2 = 0, q2 = 0;
  if (r2 !== g2 || g2 !== b) {
    i2 = r2 * 0.596 + g2 * -0.275 + b * -0.321;
    q2 = r2 * 0.212 + g2 * -0.528 + b * 0.311;
  }
  return [y, i2, q2];
};
var yiq_default = yiq;

// yuv.js
var yuv = {
  name: "yuv",
  min: [0, -0.5, -0.5],
  max: [1, 0.5, 0.5],
  channel: ["Y", "U", "V"],
  alias: ["YUV", "EBU"]
};
yuv.rgb = function(yuv2) {
  var y = yuv2[0], u2 = yuv2[1], v2 = yuv2[2], r2, g2, b;
  r2 = y * 1 + u2 * 0 + v2 * 1.13983;
  g2 = y * 1 + u2 * -0.39465 + v2 * -0.5806;
  b = y * 1 + u2 * 2.02311 + v2 * 0;
  r2 = Math.min(Math.max(0, r2), 1);
  g2 = Math.min(Math.max(0, g2), 1);
  b = Math.min(Math.max(0, b), 1);
  return [r2 * 255, g2 * 255, b * 255];
};
rgb_default.yuv = function(rgb2) {
  var r2 = rgb2[0] / 255, g2 = rgb2[1] / 255, b = rgb2[2] / 255;
  var y = r2 * 0.299 + g2 * 0.587 + b * 0.114;
  var u2 = r2 * -0.14713 + g2 * -0.28886 + b * 0.436;
  var v2 = r2 * 0.615 + g2 * -0.51499 + b * -0.10001;
  return [y, u2, v2];
};
var yuv_default = yuv;

// ydbdr.js
var ydbdr = {
  name: "ydbdr",
  min: [0, -1.333, -1.333],
  max: [1, 1.333, 1.333],
  channel: ["Y", "Db", "Dr"],
  alias: ["YDbDr"]
};
ydbdr.rgb = function(ydbdr2) {
  var y = ydbdr2[0], db = ydbdr2[1], dr = ydbdr2[2];
  var r2 = y + 92303716148e-15 * db - 0.525912630661865 * dr;
  var g2 = y - 0.129132898890509 * db + 0.267899328207599 * dr;
  var b = y + 0.664679059978955 * db - 79202543533e-15 * dr;
  return [r2 * 255, g2 * 255, b * 255];
};
rgb_default.ydbdr = function(rgb2) {
  var r2 = rgb2[0] / 255, g2 = rgb2[1] / 255, b = rgb2[2] / 255;
  return [
    0.299 * r2 + 0.587 * g2 + 0.114 * b,
    -0.45 * r2 - 0.883 * g2 + 1.333 * b,
    -1.333 * r2 + 1.116 * g2 + 0.217 * b
  ];
};
yuv_default.ydbdr = function(yuv2) {
  return [
    yuv2[0],
    3.059 * yuv2[1],
    -2.169 * yuv2[2]
  ];
};
ydbdr.yuv = function(ydbdr2) {
  return [
    ydbdr2[0],
    ydbdr2[1] / 3.059,
    -ydbdr2[2] / 2.169
  ];
};
var ydbdr_default = ydbdr;

// ycgco.js
var ycgco = {
  name: "ycgco",
  min: [0, -0.5, -0.5],
  max: [1, 0.5, 0.5],
  channel: ["Y", "Cg", "Co"],
  alias: ["YCgCo"]
};
ycgco.rgb = function(arr) {
  var y = arr[0], cg = arr[1], co = arr[2];
  var tmp = y - cg;
  return [
    (tmp + co) * 255,
    (y + cg) * 255,
    (tmp - co) * 255
  ];
};
rgb_default.ycgco = function(arr) {
  var r2 = arr[0] / 255, g2 = arr[1] / 255, b = arr[2] / 255;
  return [
    0.25 * r2 + 0.5 * g2 + 0.25 * b,
    -0.25 * r2 + 0.5 * g2 - 0.25 * b,
    0.5 * r2 - 0.5 * b
  ];
};
var ycgco_default = ycgco;

// ypbpr.js
var ypbpr = {
  name: "ypbpr",
  min: [0, -0.5, -0.5],
  max: [1, 0.5, 0.5],
  channel: ["Y", "Pb", "Pr"],
  alias: ["YPbPr", "Y/PB/PR", "YPRPB", "PRPBY", "PBPRY", "Y/Pb/Pr", "YPrPb", "PrPbY", "PbPrY", "Y/R-Y/B-Y", "Y(R-Y)(B-Y)", "R-Y", "B-Y"]
};
ypbpr.rgb = function(ypbpr2, kb, kr) {
  var y = ypbpr2[0], pb = ypbpr2[1], pr = ypbpr2[2];
  kb = kb || 0.0722;
  kr = kr || 0.2126;
  var r2 = y + 2 * pr * (1 - kr);
  var b = y + 2 * pb * (1 - kb);
  var g2 = (y - kr * r2 - kb * b) / (1 - kr - kb);
  return [r2 * 255, g2 * 255, b * 255];
};
rgb_default.ypbpr = function(rgb2, kb, kr) {
  var r2 = rgb2[0] / 255, g2 = rgb2[1] / 255, b = rgb2[2] / 255;
  kb = kb || 0.0722;
  kr = kr || 0.2126;
  var y = kr * r2 + (1 - kr - kb) * g2 + kb * b;
  var pb = 0.5 * (b - y) / (1 - kb);
  var pr = 0.5 * (r2 - y) / (1 - kr);
  return [y, pb, pr];
};
var ypbpr_default = ypbpr;

// ycbcr.js
var ycbcr = {
  name: "ycbcr",
  min: [16, 16, 16],
  max: [235, 240, 240],
  channel: ["Y", "Cb", "Cr"],
  alias: ["YCbCr", "YCC"],
  /**
   * From digital to analog form.
   * Scale to min/max ranges
   */
  ypbpr: function(ycbcr2) {
    var y = ycbcr2[0], cb = ycbcr2[1], cr = ycbcr2[2];
    return [
      (y - 16) / 219,
      (cb - 128) / 224,
      (cr - 128) / 224
    ];
  }
};
ypbpr_default.ycbcr = function(ypbpr2) {
  var y = ypbpr2[0], pb = ypbpr2[1], pr = ypbpr2[2];
  return [
    16 + 219 * y,
    128 + 224 * pb,
    128 + 224 * pr
  ];
};
ycbcr.rgb = function(arr, kb, kr) {
  return ypbpr_default.rgb(ycbcr.ypbpr(arr), kb, kr);
};
rgb_default.ycbcr = function(arr, kb, kr) {
  return ypbpr_default.ycbcr(rgb_default.ypbpr(arr, kb, kr));
};
var ycbcr_default = ycbcr;

// xvycc.js
var xvycc = {
  name: "xvycc",
  min: [0, 0, 0],
  max: [255, 255, 255],
  channel: ["Y", "Cb", "Cr"],
  alias: ["xvYCC"],
  /**
   * From digital to analog form.
   * Scale to min/max ranges
   */
  ypbpr: function(xvycc2) {
    var y = xvycc2[0], cb = xvycc2[1], cr = xvycc2[2];
    return [
      (y - 16) / 219,
      (cb - 128) / 224,
      (cr - 128) / 224
    ];
  },
  /**
   * xvYCC to RGB
   * transform through analog form
   *
   * @param {Array<number>} arr RGB values
   * @param {number} kb
   * @param {number} kr
   * @return {Array<number>} xvYCC values
   */
  rgb: function(arr, kb, kr) {
    return ypbpr_default.rgb(xvycc.ypbpr(arr), kb, kr);
  }
};
var xvycc_default = xvycc;
ypbpr_default.xvycc = function(ypbpr2) {
  var y = ypbpr2[0], pb = ypbpr2[1], pr = ypbpr2[2];
  return [
    16 + 219 * y,
    128 + 224 * pb,
    128 + 224 * pr
  ];
};
rgb_default.xvycc = function(arr, kb, kr) {
  return ypbpr_default.xvycc(rgb_default.ypbpr(arr, kb, kr));
};

// yccbccrc.js
var yccbccrc = {
  name: "yccbccrc",
  min: [0, -0.5, -0.5],
  max: [1, 0.5, 0.5],
  channel: ["Yc", "Cbc", "Crc"],
  alias: ["YcCbcCrc"]
};
yccbccrc.rgb = function(yccbccrc2) {
  return ypbpr_default.rgb(yccbccrc2, 0.0593, 0.2627);
};
rgb_default.yccbccrc = function(arr) {
  return rgb_default.ypbpr(arr, 0.0593, 0.2627);
};
var yccbccrc_default = yccbccrc;

// ucs.js
var ucs = {
  name: "ucs",
  min: [0, 0, 0],
  max: [100, 100, 100],
  channel: ["U", "V", "W"],
  alias: ["UCS", "cie1960"]
};
var ucs_default = ucs;
ucs.xyz = function(ucs2) {
  var u2 = ucs2[0], v2 = ucs2[1], w = ucs2[2];
  return [
    1.5 * u2,
    v2,
    1.5 * u2 - 3 * v2 + 2 * w
  ];
};
xyz_default.ucs = function(xyz2) {
  var x = xyz2[0], y = xyz2[1], z = xyz2[2];
  return [
    x * 2 / 3,
    y,
    0.5 * (-x + 3 * y + z)
  ];
};

// uvw.js
var uvw = {
  name: "uvw",
  min: [-134, -140, 0],
  max: [224, 122, 100],
  channel: ["U", "V", "W"],
  alias: ["UVW", "cieuvw", "cie1964"]
};
var uvw_default = uvw;
uvw.xyz = function(arg, i2, o2) {
  var _u, _v, w, u2, v2, x, y, z, xn, yn, zn, un, vn;
  u2 = arg[0], v2 = arg[1], w = arg[2];
  if (w === 0) return [0, 0, 0];
  i2 = i2 || "D65";
  o2 = o2 || 2;
  xn = xyz_default.whitepoint[o2][i2][0];
  yn = xyz_default.whitepoint[o2][i2][1];
  zn = xyz_default.whitepoint[o2][i2][2];
  un = 4 * xn / (xn + 15 * yn + 3 * zn);
  vn = 6 * yn / (xn + 15 * yn + 3 * zn);
  y = Math.pow((w + 17) / 25, 3);
  _u = u2 / (13 * w) + un || 0;
  _v = v2 / (13 * w) + vn || 0;
  x = 6 / 4 * y * _u / _v;
  z = y * (2 / _v - 0.5 * _u / _v - 5);
  return [x, y, z];
};
xyz_default.uvw = function(arr, i2, o2) {
  var x = arr[0], y = arr[1], z = arr[2], xn, yn, zn, un, vn;
  i2 = i2 || "D65";
  o2 = o2 || 2;
  xn = xyz_default.whitepoint[o2][i2][0];
  yn = xyz_default.whitepoint[o2][i2][1];
  zn = xyz_default.whitepoint[o2][i2][2];
  un = 4 * xn / (xn + 15 * yn + 3 * zn);
  vn = 6 * yn / (xn + 15 * yn + 3 * zn);
  var _u = 4 * x / (x + 15 * y + 3 * z) || 0;
  var _v = 6 * y / (x + 15 * y + 3 * z) || 0;
  var w = 25 * Math.pow(y, 1 / 3) - 17;
  var u2 = 13 * w * (_u - un);
  var v2 = 13 * w * (_v - vn);
  return [u2, v2, w];
};
uvw.ucs = function(uvw2) {
  throw new Error("Not implemented");
};
ucs_default.uvw = function(ucs2) {
  throw new Error("Not implemented");
};

// jpeg.js
var jpeg = {
  name: "jpeg",
  min: [0, 0, 0],
  max: [255, 255, 255],
  channel: ["Y", "Cb", "Cr"],
  alias: ["JPEG"]
};
var jpeg_default = jpeg;
jpeg.rgb = function(arr) {
  var y = arr[0], cb = arr[1], cr = arr[2];
  return [
    y + 1.402 * (cr - 128),
    y - 0.34414 * (cb - 128) - 0.71414 * (cr - 128),
    y + 1.772 * (cb - 128)
  ];
};
rgb_default.jpeg = function(arr) {
  var r2 = arr[0], g2 = arr[1], b = arr[2];
  return [
    0.299 * r2 + 0.587 * g2 + 0.114 * b,
    128 - 0.168736 * r2 - 0.331264 * g2 + 0.5 * b,
    128 + 0.5 * r2 - 0.418688 * g2 - 0.081312 * b
  ];
};

// lab.js
var lab = {
  name: "lab",
  min: [0, -100, -100],
  max: [100, 100, 100],
  channel: ["lightness", "a", "b"],
  alias: ["LAB", "cielab"]
};
lab.xyz = ([l2, a, b]) => {
  var x, y, z, y2;
  if (l2 <= 8) {
    y = l2 * 100 / 903.3;
    y2 = 7.787 * (y / 100) + 16 / 116;
  } else {
    y = 100 * Math.pow((l2 + 16) / 116, 3);
    y2 = Math.pow(y / 100, 1 / 3);
  }
  x = x / 95.047 <= 8856e-6 ? x = 95.047 * (a / 500 + y2 - 16 / 116) / 7.787 : 95.047 * Math.pow(a / 500 + y2, 3);
  z = z / 108.883 <= 8859e-6 ? z = 108.883 * (y2 - b / 200 - 16 / 116) / 7.787 : 108.883 * Math.pow(y2 - b / 200, 3);
  return [x, y, z];
};
var lab_default = lab;
xyz_default.lab = ([x, y, z]) => {
  var l2, a, b;
  x /= 95.047;
  y /= 100;
  z /= 108.883;
  x = x > 8856e-6 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 8856e-6 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 8856e-6 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;
  l2 = 116 * y - 16;
  a = 500 * (x - y);
  b = 200 * (y - z);
  return [l2, a, b];
};

// labh.js
var labh = {
  name: "labh",
  //mins/maxes are taken from colormine
  //FIXME: check whether mins/maxes correct
  min: [0, -128, -128],
  max: [100, 128, 128],
  channel: ["lightness", "a", "b"],
  alias: ["LABh", "hunter-lab", "hlab"],
  //maths are taken from EasyRGB
  xyz: function(lab2) {
    var l2 = lab2[0], a = lab2[1], b = lab2[2];
    var _y = l2 / 10;
    var _x = a / 17.5 * l2 / 10;
    var _z = b / 7 * l2 / 10;
    var y = _y * _y;
    var x = (_x + y) / 1.02;
    var z = -(_z - y) / 0.847;
    return [x, y, z];
  }
};
var labh_default = labh;
xyz_default.labh = function(xyz2) {
  var x = xyz2[0], y = xyz2[1], z = xyz2[2];
  var _y12 = Math.sqrt(y);
  var l2 = 10 * _y12;
  var a = y === 0 ? 0 : 17.5 * ((1.02 * x - y) / _y12);
  var b = y === 0 ? 0 : 7 * ((y - 0.847 * z) / _y12);
  return [l2, a, b];
};

// lms.js
var lms = {
  name: "lms",
  min: [0, 0, 0],
  max: [100, 100, 100],
  channel: ["long", "medium", "short"],
  //transform matrices
  matrix: {
    HPE: [
      0.38971,
      0.68898,
      -0.07868,
      -0.22981,
      1.1834,
      0.04641,
      0,
      0,
      1
    ],
    VONKRIES: [
      0.4002,
      0.7076,
      -0.0808,
      -0.2263,
      1.1653,
      0.0457,
      0,
      0,
      0.9182
    ],
    BFD: [
      0.8951,
      0.2664,
      -0.1614,
      -0.7502,
      1.7135,
      0.0367,
      0.0389,
      -0.0686,
      1.0296
    ],
    CAT97: [
      0.8562,
      0.3372,
      -0.1934,
      -0.836,
      1.8327,
      33e-4,
      0.0357,
      -469e-5,
      1.0112
    ],
    CAT00: [
      0.7982,
      0.3389,
      -0.1371,
      -0.5918,
      1.5512,
      0.0406,
      8e-4,
      0.0239,
      0.9753
    ],
    CAT02: [
      0.7328,
      0.4296,
      -0.1624,
      -0.7036,
      1.6975,
      61e-4,
      3e-3,
      0.0136,
      0.9834
    ]
  }
};
var lms_default = lms;
lms.xyz = function(arg, matrix) {
  var l2 = arg[0], m2 = arg[1], s = arg[2];
  if (!matrix) {
    matrix = [
      1.096123820835514,
      -0.278869000218287,
      0.182745179382773,
      0.454369041975359,
      0.473533154307412,
      0.072097803717229,
      -0.009627608738429,
      -0.005698031216113,
      1.015325639954543
    ];
  }
  return [
    l2 * matrix[0] + m2 * matrix[1] + s * matrix[2],
    l2 * matrix[3] + m2 * matrix[4] + s * matrix[5],
    l2 * matrix[6] + m2 * matrix[7] + s * matrix[8]
  ];
};
xyz_default.lms = function(arg, matrix) {
  var x = arg[0], y = arg[1], z = arg[2];
  if (!matrix) {
    matrix = lms.matrix.CAT02;
  }
  return [
    x * matrix[0] + y * matrix[1] + z * matrix[2],
    x * matrix[3] + y * matrix[4] + z * matrix[5],
    x * matrix[6] + y * matrix[7] + z * matrix[8]
  ];
};

// lchab.js
var lchab = {
  name: "lchab",
  min: [0, 0, 0],
  max: [100, 100, 360],
  channel: ["lightness", "chroma", "hue"],
  alias: ["LCHab", "cielch", "LCH", "HLC", "LSH"],
  xyz: function(arg) {
    return lab_default.xyz(lchab.lab(arg));
  },
  lab: function(lch) {
    var l2 = lch[0], c = lch[1], h = lch[2], a, b, hr;
    hr = h / 360 * 2 * Math.PI;
    a = c * Math.cos(hr);
    b = c * Math.sin(hr);
    return [l2, a, b];
  }
};
lab_default.lchab = function(lab2) {
  var l2 = lab2[0], a = lab2[1], b = lab2[2], hr, h, c;
  hr = Math.atan2(b, a);
  h = hr * 360 / 2 / Math.PI;
  if (h < 0) {
    h += 360;
  }
  c = Math.sqrt(a * a + b * b);
  return [l2, c, h];
};
xyz_default.lchab = function(arg) {
  return lab_default.lchab(xyz_default.lab(arg));
};
var lchab_default = lchab;

// luv.js
var luv = {
  name: "luv",
  //NOTE: luv has no rigidly defined limits
  //easyrgb fails to get proper coords
  //boronine states no rigid limits
  //colorMine refers this ones:
  min: [0, -134, -140],
  max: [100, 224, 122],
  channel: ["lightness", "u", "v"],
  alias: ["LUV", "cieluv", "cie1976"],
  xyz: function(arg, i2, o2) {
    var _u, _v, l2, u2, v2, x, y, z, xn, yn, zn, un, vn;
    l2 = arg[0], u2 = arg[1], v2 = arg[2];
    if (l2 === 0) return [0, 0, 0];
    var k2 = 0.0011070564598794539;
    i2 = i2 || "D65";
    o2 = o2 || 2;
    xn = xyz_default.whitepoint[o2][i2][0];
    yn = xyz_default.whitepoint[o2][i2][1];
    zn = xyz_default.whitepoint[o2][i2][2];
    un = 4 * xn / (xn + 15 * yn + 3 * zn);
    vn = 9 * yn / (xn + 15 * yn + 3 * zn);
    _u = u2 / (13 * l2) + un || 0;
    _v = v2 / (13 * l2) + vn || 0;
    y = l2 > 8 ? yn * Math.pow((l2 + 16) / 116, 3) : yn * l2 * k2;
    x = y * 9 * _u / (4 * _v) || 0;
    z = y * (12 - 3 * _u - 20 * _v) / (4 * _v) || 0;
    return [x, y, z];
  }
};
var luv_default = luv;
xyz_default.luv = function(arg, i2, o2) {
  var _u, _v, l2, u2, v2, x, y, z, xn, yn, zn, un, vn;
  var e = 0.008856451679035631;
  var k2 = 903.2962962962961;
  i2 = i2 || "D65";
  o2 = o2 || 2;
  xn = xyz_default.whitepoint[o2][i2][0];
  yn = xyz_default.whitepoint[o2][i2][1];
  zn = xyz_default.whitepoint[o2][i2][2];
  un = 4 * xn / (xn + 15 * yn + 3 * zn);
  vn = 9 * yn / (xn + 15 * yn + 3 * zn);
  x = arg[0], y = arg[1], z = arg[2];
  _u = 4 * x / (x + 15 * y + 3 * z) || 0;
  _v = 9 * y / (x + 15 * y + 3 * z) || 0;
  var yr = y / yn;
  l2 = yr <= e ? k2 * yr : 116 * Math.pow(yr, 1 / 3) - 16;
  u2 = 13 * l2 * (_u - un);
  v2 = 13 * l2 * (_v - vn);
  return [l2, u2, v2];
};

// lchuv.js
var lchuv = {
  name: "lchuv",
  channel: ["lightness", "chroma", "hue"],
  alias: ["LCHuv", "cielchuv"],
  min: [0, 0, 0],
  max: [100, 100, 360],
  luv: function(luv2) {
    var l2 = luv2[0], c = luv2[1], h = luv2[2], u2, v2, hr;
    hr = h / 360 * 2 * Math.PI;
    u2 = c * Math.cos(hr);
    v2 = c * Math.sin(hr);
    return [l2, u2, v2];
  },
  xyz: function(arg) {
    return luv_default.xyz(lchuv.luv(arg));
  }
};
var lchuv_default = lchuv;
luv_default.lchuv = function(luv2) {
  var l2 = luv2[0], u2 = luv2[1], v2 = luv2[2];
  var c = Math.sqrt(u2 * u2 + v2 * v2);
  var hr = Math.atan2(v2, u2);
  var h = hr * 360 / 2 / Math.PI;
  if (h < 0) {
    h += 360;
  }
  return [l2, c, h];
};
xyz_default.lchuv = function(arg) {
  return luv_default.lchuv(xyz_default.luv(arg));
};

// hsluv.js
function f(a) {
  var c = [], b = Math.pow(a + 16, 3) / 1560896;
  b = b > g ? b : a / k;
  for (var d = 0; 3 > d; ) {
    var e = d++, h = l[e][0], w = l[e][1];
    e = l[e][2];
    for (var x = 0; 2 > x; ) {
      var y = x++, z = (632260 * e - 126452 * w) * b + 126452 * y;
      c.push({ b: (284517 * h - 94839 * e) * b / z, a: ((838422 * e + 769860 * w + 731718 * h) * a * b - 769860 * y * a) / z });
    }
  }
  return c;
}
function m(a) {
  a = f(a);
  for (var c = Infinity, b = 0; b < a.length; ) {
    var d = a[b];
    ++b;
    c = Math.min(c, Math.abs(d.a) / Math.sqrt(Math.pow(d.b, 2) + 1));
  }
  return c;
}
function n(a, c) {
  c = c / 360 * Math.PI * 2;
  a = f(a);
  for (var b = Infinity, d = 0; d < a.length; ) {
    var e = a[d];
    ++d;
    e = e.a / (Math.sin(c) - e.b * Math.cos(c));
    0 <= e && (b = Math.min(b, e));
  }
  return b;
}
function p(a, c) {
  for (var b = 0, d = 0, e = a.length; d < e; ) {
    var h = d++;
    b += a[h] * c[h];
  }
  return b;
}
function q(a) {
  return 31308e-7 >= a ? 12.92 * a : 1.055 * Math.pow(a, 0.4166666666666667) - 0.055;
}
function r(a) {
  return 0.04045 < a ? Math.pow((a + 0.055) / 1.055, 2.4) : a / 12.92;
}
function t(a) {
  return [q(p(l[0], a)), q(p(l[1], a)), q(p(l[2], a))];
}
function u(a) {
  a = [r(a[0]), r(a[1]), r(a[2])];
  return [p(v[0], a), p(v[1], a), p(v[2], a)];
}
function A(a) {
  var c = a[0], b = a[1];
  a = c + 15 * b + 3 * a[2];
  0 != a ? (c = 4 * c / a, a = 9 * b / a) : a = c = NaN;
  b = b <= g ? b / B * k : 116 * Math.pow(b / B, 0.3333333333333333) - 16;
  return 0 == b ? [0, 0, 0] : [b, 13 * b * (c - C), 13 * b * (a - D)];
}
function E(a) {
  var c = a[0];
  if (0 == c) return [0, 0, 0];
  var b = a[1] / (13 * c) + C;
  a = a[2] / (13 * c) + D;
  c = 8 >= c ? B * c / k : B * Math.pow((c + 16) / 116, 3);
  b = 0 - 9 * c * b / ((b - 4) * a - b * a);
  return [b, c, (9 * c - 15 * a * c - a * b) / (3 * a)];
}
function F(a) {
  var c = a[0], b = a[1], d = a[2];
  a = Math.sqrt(b * b + d * d);
  1e-8 > a ? b = 0 : (b = 180 * Math.atan2(d, b) / Math.PI, 0 > b && (b = 360 + b));
  return [c, a, b];
}
function G(a) {
  var c = a[1], b = a[2] / 360 * 2 * Math.PI;
  return [a[0], Math.cos(b) * c, Math.sin(b) * c];
}
function H(a) {
  var c = a[0], b = a[1];
  a = a[2];
  if (99.9999999 < a) return [100, 0, c];
  if (1e-8 > a) return [0, 0, c];
  b = n(a, c) / 100 * b;
  return [a, b, c];
}
function I(a) {
  var c = a[0], b = a[1];
  a = a[2];
  if (99.9999999 < c) return [a, 0, 100];
  if (1e-8 > c) return [a, 0, 0];
  var d = n(c, a);
  return [a, b / d * 100, c];
}
function J(a) {
  var c = a[0], b = a[1];
  a = a[2];
  if (99.9999999 < a) return [100, 0, c];
  if (1e-8 > a) return [0, 0, c];
  b = m(a) / 100 * b;
  return [a, b, c];
}
function K(a) {
  var c = a[0], b = a[1];
  a = a[2];
  if (99.9999999 < c) return [a, 0, 100];
  if (1e-8 > c) return [a, 0, 0];
  var d = m(c);
  return [a, b / d * 100, c];
}
function O(a) {
  return t(E(G(a)));
}
function P(a) {
  return F(A(u(a)));
}
function Q(a) {
  return O(H(a));
}
function R(a) {
  return I(P(a));
}
function S(a) {
  return O(J(a));
}
function T(a) {
  return K(P(a));
}
var l = [[3.240969941904521, -1.537383177570093, -0.498610760293], [-0.96924363628087, 1.87596750150772, 0.041555057407175], [0.055630079696993, -0.20397695888897, 1.056971514242878]];
var v = [[0.41239079926595, 0.35758433938387, 0.18048078840183], [0.21263900587151, 0.71516867876775, 0.072192315360733], [0.019330818715591, 0.11919477979462, 0.95053215224966]];
var B = 1;
var C = 0.19783000664283;
var D = 0.46831999493879;
var k = 903.2962962;
var g = 0.0088564516;
var _hsluv = {
  hsluvToRgb: Q,
  hsluvToLch: H,
  rgbToHsluv: R,
  rgbToHpluv: T,
  rgbToXyz: u,
  rgbToLch: P,
  hpluvToRgb: S,
  hpluvToLch: J,
  lchToHpluv: K,
  lchToHsluv: I,
  lchToLuv: G,
  lchToRgb: O,
  luvToLch: F,
  luvToXyz: E,
  xyzToLuv: A,
  xyzToRgb: t
};
var hsluv = {
  name: "hsluv",
  min: [0, 0, 0],
  max: [360, 100, 100],
  channel: ["hue", "saturation", "lightness"],
  alias: ["HSLuv", "HuSL"],
  lchuv: _hsluv.hsluvToLch,
  xyz: function(arg) {
    return lchuv_default.xyz(_hsluv.hsluvToLch(arg));
  },
  //a shorter way to convert to hpluv
  hpluv: function(arg) {
    return _hsluv.lchToHpluv(_hsluv.hsluvToLch(arg));
  },
  // export internal math
  _hsluv
};
var hsluv_default = hsluv;
lchuv_default.hsluv = _hsluv.lchToHsluv;
xyz_default.hsluv = function(arg) {
  return _hsluv.lchToHsluv(xyz_default.lchuv(arg));
};
rgb_default.hsluv = _hsluv.rgbToHsluv;

// hpluv.js
var hpluv = {
  name: "hpluv",
  min: [0, 0, 0],
  max: [360, 100, 100],
  channel: ["hue", "saturation", "lightness"],
  alias: ["HPLuv", "HuSLp"],
  lchuv: _hsluv.hpluvToLch,
  xyz: function(arg) {
    return lchuv_default.xyz(_hsluv.hpluvToLch(arg));
  },
  //a shorter way to convert to husl
  hsluv: function(arg) {
    return _hsluv.lchToHsluv(_hsluv.hpluvToLch(arg));
  }
};
var hpluv_default = hpluv;
lchuv_default.hpluv = _hsluv.lchToHpluv;
xyz_default.hpluv = function(arg) {
  return _hsluv.lchToHpluv(xyz_default.lchuv(arg));
};

// oklab.js
var oklab = {
  name: "oklab",
  min: [0, -0.4, -0.4],
  max: [1, 0.4, 0.4],
  channel: ["lightness", "a", "b"]
};
var oklab_default = oklab;
oklab.rgb = ([l2, a, b]) => {
  const l_ = l2 + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l2 - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l2 - 0.0894841775 * a - 1.291485548 * b;
  const l3 = l_ ** 3;
  const m3 = m_ ** 3;
  const s3 = s_ ** 3;
  return [
    (4.0767416621 * l3 - 3.307711591 * m3 + 0.2309699292 * s3) * 255,
    (-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3) * 255,
    (-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3) * 255
  ];
};
rgb_default.oklab = ([r2, g2, b]) => {
  r2 /= 255, g2 /= 255, b /= 255;
  const l2 = 0.4122214708 * r2 + 0.5363325363 * g2 + 0.0514459929 * b;
  const m2 = 0.2119034982 * r2 + 0.6806995451 * g2 + 0.1073969566 * b;
  const s = 0.0883024619 * r2 + 0.2817188376 * g2 + 0.6299787005 * b;
  const l_ = Math.cbrt(l2);
  const m_ = Math.cbrt(m2);
  const s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    // L
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    // a
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_
    // b
  ];
};

// cubehelix.js
var defaults = {
  // 0..3
  start: 0,
  // -10..10
  rotation: 0.5,
  // 0..1+
  hue: 1,
  // 0..2
  gamma: 1
};
var cubehelix = {
  name: "cubehelix",
  channel: ["fraction"],
  min: [0],
  max: [1],
  defaults
};
cubehelix.rgb = function(fraction, options = {}) {
  if (Array.isArray(fraction)) fraction = fraction[0];
  var start = options.start !== void 0 ? options.start : defaults.start;
  var rotation = options.rotation !== void 0 ? options.rotation : defaults.rotation;
  var gamma = options.gamma !== void 0 ? options.gamma : defaults.gamma;
  var hue = options.hue !== void 0 ? options.hue : defaults.hue;
  var angle = 2 * Math.PI * (start / 3 + 1 + rotation * fraction);
  fraction = Math.pow(fraction, gamma);
  var amp = hue * fraction * (1 - fraction) / 2;
  var r2 = fraction + amp * (-0.14861 * Math.cos(angle) + 1.78277 * Math.sin(angle));
  var g2 = fraction + amp * (-0.29227 * Math.cos(angle) - 0.90649 * Math.sin(angle));
  var b = fraction + amp * (1.97294 * Math.cos(angle));
  r2 = Math.max(1, Math.min(r2, 0));
  g2 = Math.max(1, Math.min(g2, 0));
  b = Math.max(1, Math.min(b, 0));
  return [r2 * 255, g2 * 255, b * 255];
};
rgb_default.cubehelix = function(rgb2) {
  throw new Error("rgb.cubehelix conversion is not implemented yet");
};
var cubehelix_default = cubehelix;

// coloroid.js
var coloroid = {
  name: "coloroid",
  alias: ["ATV"],
  // hue, saturation, luminosity
  // note that hue values are ids, not the numbers - not every value is possible
  // e.g. 38 will be rounded to 36
  channel: ["A", "T", "V"],
  min: [10, 0, 0],
  max: [76, 100, 100],
  // Coloroid table
  // Regression of values is almost impossible, as hues don’t correlate
  // Even angle values are picked very inconsistently, based on aesthetical evaluation.
  // - tgф, ctgф are removed, ф is searched instead
  // - eλ = xλ + yλ + zλ
  // - λ is removed as not used
  table: [
    //A    angle  eλ        xλ       yλ
    [10, 59, 1.724349, 0.44987, 0.53641],
    [11, 55.3, 1.740844, 0.46248, 0.52444],
    [12, 51.7, 1.754985, 0.47451, 0.51298],
    [13, 48.2, 1.767087, 0.48601, 0.50325],
    [14, 44.8, 1.775953, 0.49578, 0.49052],
    [15, 41.5, 1.785073, 0.5079, 0.43035],
    [16, 38.2, 1.791104, 0.51874, 0.46934],
    [20, 34.9, 1.794831, 0.5298, 0.45783],
    [21, 31.5, 1.798664, 0.54137, 0.44559],
    [22, 28, 1.794819, 0.55367, 0.43253],
    [23, 24.4, 1.78961, 0.5668, 0.41811],
    [24, 20.6, 1.809483, 0.58128, 0.40176],
    [25, 16.6, 1.760983, 0.59766, 0.383],
    [26, 12.3, 1.723443, 0.61653, 0.36061],
    [30, 7.7, 1.652891, 0.63896, 0.33358],
    [31, 2.8, 1.502607, 0.66619, 0.2993],
    [32, -2.5, 1.0725, 0.70061, 0.26753],
    [33, -8.4, 1.136637, 0.63925, 0.22631],
    [34, -19.8, 1.232286, 0.53962, 0.19721],
    [35, -31.6, 1.31012, 0.5034, 0.17495],
    [40, -43.2, 1.37661, 0.46041, 0.15603],
    [41, -54.6, 1.438692, 0.42386, 0.13846],
    [42, -65.8, 1.501582, 0.38991, 0.12083],
    [43, -76.8, 1.570447, 0.35586, 0.10328],
    [44, -86.8, 1.645583, 0.32195, 0.08496],
    [45, -95.8, 1.732083, 0.28657, 0.05155],
    [46, -108.4, 1.915753, 0.22202, 0.01771],
    [50, -117.2, 2.14631, 0.15664, 0.05227],
    [51, -124.7, 1.649939, 0.12736, 0.0902],
    [52, -131.8, 1.273415, 0.10813, 0.12506],
    [53, -138.5, 1.080809, 0.09414, 0.15741],
    [54, -145.1, 0.957076, 0.03249, 0.18958],
    [55, -152, 0.868976, 0.07206, 0.24109],
    [56, -163.4, 0.771731, 0.05787, 0.30378],
    [60, -177.2, 0.697108, 0.04353, 0.35696],
    [61, 171.6, 0.655803, 0.03291, 0.41971],
    [62, 152.4, 0.623958, 0.0224, 0.49954],
    [63, 148.4, 0.596037, 0.01196, 0.60321],
    [64, 136.8, 0.607413, 425e-5, 0.73542],
    [65, 125.4, 0.659923, 0.01099, 0.83391],
    [66, 114.2, 0.859517, 0.0805, 0.77474],
    [70, 103.2, 1.195683, 0.20259, 0.7046],
    [71, 93.2, 1.407534, 0.28807, 0.6523],
    [72, 84.2, 1.532829, 0.34422, 0.6193],
    [73, 77.3, 1.603792, 0.37838, 0.59533],
    [74, 71.6, 1.649448, 0.4029, 0.57716],
    [75, 66.9, 1.68108, 0.42141, 0.56222],
    [76, 62.8, 1.704979, 0.43647, 0.54895]
  ],
  /**
   * Backwise - from coloroid to xyY
   *
   * @param {Array<number>} arg Coloroid values
   *
   * @return {Array<number>} xyY values
   */
  xyy: function([A2, T2, V]) {
    var row;
    for (var i2 = 0; i2 < table.length; i2++) {
      if (A2 <= table[i2][0]) {
        row = table[i2];
        break;
      }
    }
    var yl = row[4], el = row[2], xl = row[3];
    var Y = V * V / 100;
    var Yl = yl * el * 100;
    var x = (100 * Y * x0 * ew + 100 * xl * el * T2 - Yl * T2 * x0 * ew) / (100 * T2 * el - Yl * T2 * ew + 100 * Y * ew);
    var y = (100 * Y + 100 * T2 * yl * el - Yl * T2) / (Y * ew * 100 + T2 * 100 * el - T2 * Yl * ew);
    return [x, y, Y];
  }
};
var table = coloroid.table;
var angleTable = table.slice(-13).concat(table.slice(0, -13));
var i = "D65";
var o = 2;
var Xn = xyz_default.whitepoint[o][i][0];
var Yn = xyz_default.whitepoint[o][i][1];
var Zn = xyz_default.whitepoint[o][i][2];
var y0 = Xn / (Xn + Yn + Zn);
var x0 = Yn / (Xn + Yn + Zn);
var ew = (Xn + Yn + Zn) / 100;
xyy_default.coloroid = function(arg) {
  var x = arg[0], y = arg[1], Y = arg[2];
  var V = 10 * Math.sqrt(Y);
  var angle = Math.atan2(y - y0, x - x0) * 180 / Math.PI;
  var row;
  var prev = angleTable.length - 1;
  for (var i2 = 0; i2 < angleTable.length; i2++) {
    if (angle > angleTable[i2][1]) {
      break;
    }
    prev = i2;
  }
  row = Math.abs(angleTable[i2 + 1][1] - angle) > Math.abs(angleTable[prev][1] - angle) ? angleTable[i2 + 1] : angleTable[prev];
  var A2 = row[0];
  var yl = row[4], el = row[2], xl = row[3];
  var Yl = yl * el * 100;
  var T2 = 100 * Y * (x0 * ew - x * ew) / (100 * (x * el - xl * el) + Yl * (x0 * ew - x * ew));
  return [A2, T2, V];
};
xyz_default.coloroid = function(arg) {
  return xyy_default.coloroid(xyz_default.xyy(arg));
};
coloroid.xyz = function(arg) {
  return xyy_default.xyz(coloroid.xyy(arg));
};
var coloroid_default = coloroid;

// hcg.js
var hcg = {
  name: "hcg",
  min: [0, 0, 0],
  max: [360, 100, 100],
  channel: ["hue", "chroma", "gray"],
  alias: ["HCG", "HSG"],
  rgb: function(hcg2) {
    var h = hcg2[0] / 360;
    var c = hcg2[1] / 100;
    var g2 = hcg2[2] / 100;
    if (c === 0) {
      return [g2 * 255, g2 * 255, g2 * 255];
    }
    var hi = h % 1 * 6;
    var v2 = hi % 1;
    var pure = [0, 0, 0];
    var w = 1 - v2;
    switch (Math.floor(hi)) {
      case 0:
        pure[0] = 1;
        pure[1] = v2;
        pure[2] = 0;
        break;
      case 1:
        pure[0] = w;
        pure[1] = 1;
        pure[2] = 0;
        break;
      case 2:
        pure[0] = 0;
        pure[1] = 1;
        pure[2] = v2;
        break;
      case 3:
        pure[0] = 0;
        pure[1] = w;
        pure[2] = 1;
        break;
      case 4:
        pure[0] = v2;
        pure[1] = 0;
        pure[2] = 1;
        break;
      default:
        pure[0] = 1;
        pure[1] = 0;
        pure[2] = w;
    }
    var mg = (1 - c) * g2;
    var rgb2 = [
      (c * pure[0] + mg) * 255,
      (c * pure[1] + mg) * 255,
      (c * pure[2] + mg) * 255
    ];
    return rgb2;
  },
  hsl: function(hcg2) {
    var c = hcg2[1] / 100;
    var g2 = hcg2[2] / 100;
    var l2 = g2 * (1 - c) + 0.5 * c;
    var s = 0;
    if (l2 < 1 && l2 > 0) {
      if (l2 < 0.5) {
        s = c / (2 * l2);
      } else {
        s = c / (2 * (1 - l2));
      }
    }
    return [hcg2[0], s * 100, l2 * 100];
  },
  hsv: function(hcg2) {
    var c = hcg2[1] / 100;
    var g2 = hcg2[2] / 100;
    var v2 = c + g2 * (1 - c);
    var res;
    if (v2 > 0) {
      var f2 = c / v2;
      res = [hcg2[0], f2 * 100, v2 * 100];
    } else {
      res = [hcg2[0], 0, v2 * 100];
    }
    return res;
  },
  hwb: function(hcg2) {
    var c = hcg2[1] / 100;
    var g2 = hcg2[2] / 100;
    var v2 = c + g2 * (1 - c);
    return [hcg2[0], (v2 - c) * 100, (1 - v2) * 100];
  }
};
var hcg_default = hcg;
rgb_default.hcg = function(rgb2) {
  var r2 = rgb2[0] / 255;
  var g2 = rgb2[1] / 255;
  var b = rgb2[2] / 255;
  var max = Math.max(Math.max(r2, g2), b);
  var min = Math.min(Math.min(r2, g2), b);
  var chroma = max - min;
  var grayscale;
  var hue;
  if (chroma < 1) {
    grayscale = min / (1 - chroma);
  } else {
    grayscale = 0;
  }
  if (chroma > 0) {
    if (max === r2) {
      hue = (g2 - b) / chroma % 6;
    } else if (max === g2) {
      hue = 2 + (b - r2) / chroma;
    } else {
      hue = 4 + (r2 - g2) / chroma;
    }
    hue /= 6;
    hue = hue % 1;
  } else {
    hue = 0;
  }
  return [hue * 360, chroma * 100, grayscale * 100];
};
hsl_default.hcg = function(hsl2) {
  var s = hsl2[1] / 100;
  var l2 = hsl2[2] / 100;
  var c = 0;
  if (l2 < 0.5) {
    c = 2 * s * l2;
  } else {
    c = 2 * s * (1 - l2);
  }
  var res;
  if (c < 1) {
    var f2 = (l2 - 0.5 * c) / (1 - c);
    res = [hsl2[0], c * 100, f2 * 100];
  } else {
    res = [hsl2[0], c * 100, 0];
  }
  return res;
};
hsv_default.hcg = function(hsv2) {
  var s = hsv2[1] / 100;
  var v2 = hsv2[2] / 100;
  var c = s * v2;
  var res;
  if (c < 1) {
    var f2 = (v2 - c) / (1 - c);
    res = [hsv2[0], c * 100, f2 * 100];
  } else {
    res = [hsv2[0], c * 100, 0];
  }
  return res;
};
hwb_default.hcg = function(hwb2) {
  var w = hwb2[1] / 100;
  var b = hwb2[2] / 100;
  var v2 = 1 - b;
  var c = v2 - w;
  var g2 = 0;
  if (c < 1) {
    g2 = (v2 - c) / (1 - c);
  }
  return [hwb2[0], c * 100, g2 * 100];
};

// hcy.js
var hcy = {
  name: "hcy",
  min: [0, 0, 0],
  max: [360, 100, 255],
  channel: ["hue", "chroma", "luminance"],
  alias: ["HCY"]
};
var hcy_default = hcy;
hcy.rgb = function(hcy2) {
  var h = (hcy2[0] < 0 ? hcy2[0] % 360 + 360 : hcy2[0] % 360) * Math.PI / 180;
  var s = Math.max(0, Math.min(hcy2[1], 100)) / 100;
  var i2 = Math.max(0, Math.min(hcy2[2], 255)) / 255;
  var pi3 = Math.PI / 3;
  var r2, g2, b;
  if (h < 2 * pi3) {
    b = i2 * (1 - s);
    r2 = i2 * (1 + s * Math.cos(h) / Math.cos(pi3 - h));
    g2 = i2 * (1 + s * (1 - Math.cos(h) / Math.cos(pi3 - h)));
  } else if (h < 4 * pi3) {
    h = h - 2 * pi3;
    r2 = i2 * (1 - s);
    g2 = i2 * (1 + s * Math.cos(h) / Math.cos(pi3 - h));
    b = i2 * (1 + s * (1 - Math.cos(h) / Math.cos(pi3 - h)));
  } else {
    h = h - 4 * pi3;
    g2 = i2 * (1 - s);
    b = i2 * (1 + s * Math.cos(h) / Math.cos(pi3 - h));
    r2 = i2 * (1 + s * (1 - Math.cos(h) / Math.cos(pi3 - h)));
  }
  return [r2 * 255, g2 * 255, b * 255];
};
rgb_default.hcy = function(rgb2) {
  var sum = rgb2[0] + rgb2[1] + rgb2[2];
  var r2 = rgb2[0] / sum;
  var g2 = rgb2[1] / sum;
  var b = rgb2[2] / sum;
  var h = Math.acos(
    0.5 * (r2 - g2 + (r2 - b)) / Math.sqrt((r2 - g2) * (r2 - g2) + (r2 - b) * (g2 - b))
  );
  if (b > g2) {
    h = 2 * Math.PI - h;
  }
  var s = 1 - 3 * Math.min(r2, g2, b);
  var i2 = sum / 3;
  return [h * 180 / Math.PI, s * 100, i2];
};

// tsl.js
var tsl = {
  name: "tsl",
  min: [0, 0, 0],
  max: [1, 1, 1],
  channel: ["tint", "saturation", "lightness"],
  alias: ["TSL"]
};
var tsl_default = tsl;
tsl.rgb = function(tsl2) {
  var T2 = tsl2[0], S2 = tsl2[1], L = tsl2[2];
  var x = Math.tan(2 * Math.PI * (T2 - 1 / 4));
  x *= x;
  var r2 = Math.sqrt(5 * S2 * S2 / (9 * (1 / x + 1))) + 1 / 3;
  var g2 = Math.sqrt(5 * S2 * S2 / (9 * (x + 1))) + 1 / 3;
  var k2 = L / (0.185 * r2 + 0.473 * g2 + 0.114);
  var B2 = k2 * (1 - r2 - g2);
  var G2 = k2 * g2;
  var R2 = k2 * r2;
  return [
    R2 * 255,
    G2 * 255,
    B2 * 255
  ];
};
rgb_default.tsl = function(rgb2) {
  var [r2, g2, b] = rgb2;
  var r_ = (r2 / (r2 + g2 + b) || 0) - 1 / 3, g_ = (g2 / (r2 + g2 + b) || 0) - 1 / 3, T2 = g_ != 0 ? 0.5 - Math.atan2(g_, r_) / 2 / Math.PI : 0, S2 = Math.sqrt(9 / 5 * (r_ * r_ + g_ * g_)), L = (r2 * 0.299 + g2 * 0.587 + b * 0.114) / 255;
  return [T2, S2, L];
};

// yes.js
var yes = {
  name: "yes",
  min: [0, 0, 0],
  max: [1, 1, 1],
  channel: ["luminance", "e-factor", "s-factor"]
};
yes.rgb = function(arg) {
  var y = arg[0], e = arg[1], s = arg[2];
  var m2 = [
    1,
    1.431,
    0.126,
    1,
    -0.569,
    0.126,
    1,
    0.431,
    -1.874
  ];
  var r2 = y * m2[0] + e * m2[1] + s * m2[2], g2 = y * m2[3] + e * m2[4] + s * m2[5], b = y * m2[6] + e * m2[7] + s * m2[8];
  return [r2 * 255, g2 * 255, b * 255];
};
rgb_default.yes = function(arg) {
  var r2 = arg[0] / 255, g2 = arg[1] / 255, b = arg[2] / 255;
  var m2 = [
    0.253,
    0.684,
    0.063,
    0.5,
    -0.5,
    0,
    0.25,
    0.25,
    -0.5
  ];
  return [
    r2 * m2[0] + g2 * m2[1] + b * m2[2],
    r2 * m2[3] + g2 * m2[4] + b * m2[5],
    r2 * m2[6] + g2 * m2[7] + b * m2[8]
  ];
};
var yes_default = yes;

// osaucs.js
var osaucs = {
  name: "osaucs",
  alias: ["OSA-UCS"],
  channel: ["L", "j", "g"],
  min: [-10, -6, -10],
  max: [8, 12, 6]
};
osaucs.xyz = function(arg) {
  var x, y, z;
  throw "Unimplemented";
  return [x, y, z];
};
xyz_default.osaucs = function(arg) {
  var X = arg[0], Y = arg[1], Z = arg[2];
  var x = X / (X + Y + Z);
  var y = Y / (X + Y + Z);
  var K2 = 4.4934 * x * x + 4.3034 * y * y - 4.276 * x * y - 1.3744 * x - 2.56439 * y + 1.8103;
  var Y0 = K2 * Y;
  var L_ = 5.9 * (Math.pow(Y0, 1 / 3) - 2 / 3 + 0.042 * Math.pow(Math.max(Y0, 30) - 30, 1 / 3));
  var L = (L_ - 14.3993) / Math.sqrt(2);
  var C2 = L_ / (5.9 * (Math.pow(Y0, 1 / 3) - 2 / 3));
  var R2 = 0.779 * X + 0.4194 * Y - 0.1648 * Z;
  var G2 = -0.4493 * X + 1.3265 * Y + 0.0927 * Z;
  var B2 = -0.1149 * X + 0.3394 * Y + 0.717 * Z;
  R2 = Math.pow(R2, 1 / 3) || 0;
  G2 = Math.pow(G2, 1 / 3) || 0;
  B2 = Math.pow(B2, 1 / 3) || 0;
  var a = -13.7 * R2 + 17.7 * G2 - 4 * B2;
  var b = 1.7 * R2 + 8 * G2 - 9.7 * B2;
  var g2 = C2 * a;
  var j = C2 * b;
  return [L, j, g2];
};
var osaucs_default = osaucs;

// hsp.js
var Pr = 0.299;
var Pg = 0.587;
var Pb = 0.114;
var hsp = {
  name: "hsp",
  min: [0, 0, 0],
  max: [360, 100, 255],
  channel: ["hue", "saturation", "perceived_brightness"],
  alias: ["HSP"],
  rgb: function(hsp2) {
    var h = hsp2[0] / 360, s = hsp2[1] / 100, p2 = hsp2[2], r2, g2, b, part, minOverMax = 1 - s;
    if (minOverMax > 0) {
      if (h < 1 / 6) {
        h = 6 * (h - 0 / 6);
        part = 1 + h * (1 / minOverMax - 1);
        b = p2 / Math.sqrt(Pr / minOverMax / minOverMax + Pg * part * part + Pb);
        r2 = b / minOverMax;
        g2 = b + h * (r2 - b);
      } else if (h < 2 / 6) {
        h = 6 * (-h + 2 / 6);
        part = 1 + h * (1 / minOverMax - 1);
        b = p2 / Math.sqrt(Pg / minOverMax / minOverMax + Pr * part * part + Pb);
        g2 = b / minOverMax;
        r2 = b + h * (g2 - b);
      } else if (h < 3 / 6) {
        h = 6 * (h - 2 / 6);
        part = 1 + h * (1 / minOverMax - 1);
        r2 = p2 / Math.sqrt(Pg / minOverMax / minOverMax + Pb * part * part + Pr);
        g2 = r2 / minOverMax;
        b = r2 + h * (g2 - r2);
      } else if (h < 4 / 6) {
        h = 6 * (-h + 4 / 6);
        part = 1 + h * (1 / minOverMax - 1);
        r2 = p2 / Math.sqrt(Pb / minOverMax / minOverMax + Pg * part * part + Pr);
        b = r2 / minOverMax;
        g2 = r2 + h * (b - r2);
      } else if (h < 5 / 6) {
        h = 6 * (h - 4 / 6);
        part = 1 + h * (1 / minOverMax - 1);
        g2 = p2 / Math.sqrt(Pb / minOverMax / minOverMax + Pr * part * part + Pg);
        b = g2 / minOverMax;
        r2 = g2 + h * (b - g2);
      } else {
        h = 6 * (-h + 6 / 6);
        part = 1 + h * (1 / minOverMax - 1);
        g2 = p2 / Math.sqrt(Pr / minOverMax / minOverMax + Pb * part * part + Pg);
        r2 = g2 / minOverMax;
        b = g2 + h * (r2 - g2);
      }
    } else {
      if (h < 1 / 6) {
        h = 6 * (h - 0 / 6);
        r2 = Math.sqrt(p2 * p2 / (Pr + Pg * h * h));
        g2 = r2 * h;
        b = 0;
      } else if (h < 2 / 6) {
        h = 6 * (-h + 2 / 6);
        g2 = Math.sqrt(p2 * p2 / (Pg + Pr * h * h));
        r2 = g2 * h;
        b = 0;
      } else if (h < 3 / 6) {
        h = 6 * (h - 2 / 6);
        g2 = Math.sqrt(p2 * p2 / (Pg + Pb * h * h));
        b = g2 * h;
        r2 = 0;
      } else if (h < 4 / 6) {
        h = 6 * (-h + 4 / 6);
        b = Math.sqrt(p2 * p2 / (Pb + Pg * h * h));
        g2 = b * h;
        r2 = 0;
      } else if (h < 5 / 6) {
        h = 6 * (h - 4 / 6);
        b = Math.sqrt(p2 * p2 / (Pb + Pr * h * h));
        r2 = b * h;
        g2 = 0;
      } else {
        h = 6 * (-h + 6 / 6);
        r2 = Math.sqrt(p2 * p2 / (Pr + Pb * h * h));
        b = r2 * h;
        g2 = 0;
      }
    }
    return [Math.round(r2), Math.round(g2), Math.round(b)];
  }
};
var hsp_default = hsp;
rgb_default.hsp = function(rgb2) {
  var r2 = parseInt(rgb2[0], 10), g2 = parseInt(rgb2[1], 10), b = parseInt(rgb2[2], 10), h, s, p2;
  p2 = Math.sqrt(r2 * r2 * Pr + g2 * g2 * Pg + b * b * Pb);
  if (r2 === g2 && r2 === b) {
    h = 0;
    s = 0;
  } else {
    if (r2 >= g2 && r2 >= b) {
      if (b >= g2) {
        h = 6 / 6 - 1 / 6 * (b - g2) / (r2 - g2);
        s = 1 - g2 / r2;
      } else {
        h = 0 / 6 + 1 / 6 * (g2 - b) / (r2 - b);
        s = 1 - b / r2;
      }
    }
    if (g2 >= r2 && g2 >= b) {
      if (r2 >= b) {
        h = 2 / 6 - 1 / 6 * (r2 - b) / (g2 - b);
        s = 1 - b / g2;
      } else {
        h = 2 / 6 + 1 / 6 * (b - r2) / (g2 - r2);
        s = 1 - r2 / g2;
      }
    }
    if (b >= r2 && b >= g2) {
      if (g2 >= r2) {
        h = 4 / 6 - 1 / 6 * (g2 - r2) / (b - r2);
        s = 1 - r2 / b;
      } else {
        h = 4 / 6 + 1 / 6 * (r2 - g2) / (b - g2);
        s = 1 - g2 / b;
      }
    }
  }
  return [Math.round(h * 360), s * 100, Math.round(p2)];
};

// hsm.js
var hsm = {
  name: "hsm",
  min: [0, 0, 0],
  max: [1, 1, 1],
  channel: ["hue", "saturation", "mixture"]
};
var hsm_default = hsm;
hsm.rgb = function([h, s, m2]) {
  let D2;
  if (m2 >= 0 && m2 <= 1 / 7) D2 = Math.sqrt((0 - m2) ** 2 + (0 - m2) ** 2 + (7 - m2) ** 2);
  else if (m2 > 1 / 7 && m2 <= 3 / 7) D2 = Math.sqrt((0 - m2) ** 2 + ((7 * m2 - 1) / 2 - m2) ** 2 + (1 - m2) ** 2);
  else if (m2 > 3 / 7 && m2 <= 0.5) D2 = Math.sqrt(((7 * m2 - 3) / 2 - m2) ** 2 + (1 - m2) ** 2 + (1 - m2) ** 2);
  else if (m2 > 0.5 && m2 <= 4 / 7) D2 = Math.sqrt((7 * m2 / 4 - m2) ** 2 + (0 - m2) ** 2 + (0 - m2) ** 2);
  else if (m2 > 4 / 7 && m2 <= 6 / 7) D2 = Math.sqrt((1 - m2) ** 2 + ((7 * m2 - 4) / 2 - m2) ** 2 + (0 - m2) ** 2);
  else if (m2 > 6 / 7 && m2 <= 1) D2 = Math.sqrt((1 - m2) ** 2 + (1 - m2) ** 2 + (7 * m2 - 6 - m2) ** 2);
  else D2 = 1;
  const R2 = s * D2;
  const cosTheta = Math.cos(2 * Math.PI * h);
  const sinTheta = Math.sin(2 * Math.PI * h);
  const u_r = 3 / Math.sqrt(41), v_r = -4 / Math.sqrt(861);
  const u_g = -4 / Math.sqrt(41), v_g = 19 / Math.sqrt(861);
  const u_b = -4 / Math.sqrt(41), v_b = -22 / Math.sqrt(861);
  const dr = R2 * (u_r * cosTheta + v_r * sinTheta);
  const dg = R2 * (u_g * cosTheta + v_g * sinTheta);
  const db = R2 * (u_b * cosTheta + v_b * sinTheta);
  const r2 = Math.max(0, Math.min(1, m2 + dr)) * 255;
  const g2 = Math.max(0, Math.min(1, m2 + dg)) * 255;
  const b = Math.max(0, Math.min(1, m2 + db)) * 255;
  return [r2, g2, b];
};
rgb_default.hsm = function([r2, g2, b]) {
  r2 /= 255, g2 /= 255, b /= 255;
  let m2 = (4 * r2 + 2 * g2 + b) / 7;
  let dr = r2 - m2, dg = g2 - m2, db = b - m2;
  let d = Math.sqrt(dr * dr + dg * dg + db * db);
  let theta = Math.acos((3 * dr - 4 * dg - 4 * db) / Math.sqrt(41 * (dr * dr + dg * dg + db * db)) || 0);
  let h = b <= g2 ? theta / (2 * Math.PI) : 1 - theta / (2 * Math.PI);
  let s;
  if (0 <= m2 && m2 <= 1 / 7) s = d / Math.sqrt((0 - m2) ** 2 + (0 - m2) ** 2 + (7 - m2) ** 2);
  else if (1 / 7 < m2 && m2 <= 3 / 7) s = d / Math.sqrt((0 - m2) ** 2 + ((7 * m2 - 1) / 2 - m2) ** 2 + (1 - m2) ** 2);
  else if (3 / 7 < m2 && m2 <= 1 / 2) s = d / Math.sqrt(((7 * m2 - 3) / 2 - m2) ** 2 + (1 - m2) ** 2 + (1 - m2) ** 2);
  else if (1 / 2 < m2 && m2 <= 4 / 7) s = d / Math.sqrt((7 * m2 / 4 - m2) ** 2 + (0 - m2) ** 2 + (0 - m2) ** 2);
  else if (4 / 7 < m2 && m2 <= 6 / 7) s = d / Math.sqrt((1 - m2) ** 2 + ((7 * m2 - 4) / 2 - m2) ** 2 + (0 - m2) ** 2);
  else if (6 / 7 < m2 && m2 < 1) s = d / Math.sqrt((1 - m2) ** 2 + (1 - m2) ** 2 + (7 * m2 - 6 - m2) ** 2);
  else s = 0;
  return [h, s, m2];
};

// lrgb.js
var lrgb = {
  name: "lrgb",
  min: [0, 0, 0],
  max: [1, 1, 1],
  channel: ["red", "green", "blue"]
};
lrgb.rgb = (rgb2) => rgb2.map((c) => (c /= 255) > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92);
rgb_default.lrgb = (rgb2) => rgb2.map((c) => c / 255 <= 0.04045 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4);
var lrgb_default = lrgb;

// index.js
var spaces = {};
var index_default = spaces;
function register(newSpace) {
  const newSpaceName = newSpace.name;
  for (const existingSpaceName in spaces) {
    if (!newSpace[existingSpaceName]) newSpace[existingSpaceName] = createConverter(newSpace, existingSpaceName);
    const existingSpace = spaces[existingSpaceName];
    if (!existingSpace[newSpaceName]) existingSpace[newSpaceName] = createConverter(existingSpace, newSpaceName);
  }
  spaces[newSpaceName] = newSpace;
}
function createConverter(fromSpace, toSpaceName) {
  if (fromSpace.xyz && spaces.xyz[toSpaceName])
    return (arg) => spaces.xyz[toSpaceName](fromSpace.xyz(arg));
  if (fromSpace.rgb && spaces.rgb[toSpaceName])
    return (arg) => spaces.rgb[toSpaceName](fromSpace.rgb(arg));
  return () => {
    throw new Error(`Conversion ${fromSpace.name} to ${toSpaceName} is not available`);
  };
}
[rgb_default, xyz_default, hsl_default, hsv_default, hsi_default, hwb_default, cmyk_default, cmy_default, xyy_default, yiq_default, yuv_default, ydbdr_default, ycgco_default, ypbpr_default, ycbcr_default, xvycc_default, yccbccrc_default, ucs_default, uvw_default, jpeg_default, lab_default, labh_default, lms_default, lchab_default, luv_default, lchuv_default, hsluv_default, hpluv_default, cubehelix_default, coloroid_default, hcg_default, hcy_default, tsl_default, yes_default, osaucs_default, hsp_default, hsm_default, lrgb_default, oklab_default].map(register);
export {
  index_default as default,
  register
};
