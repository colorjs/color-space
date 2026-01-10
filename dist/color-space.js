// rgb.js
var rgb = {
  name: "rgb",
  channel: ["red", "green", "blue"],
  range: [[0, 255], [0, 255], [0, 255]]
};
var rgb_default = rgb;

// hsl.js
var hsl = {
  name: "hsl",
  channel: ["hue", "saturation", "lightness"],
  range: [[0, 360], [0, 100], [0, 100]],
  rgb: function(h, s, l2) {
    h = h / 360;
    s = s / 100;
    l2 = l2 / 100;
    var t1, t2, t3, rgb2, val, i = 0;
    if (s === 0) return val = l2 * 255, [val, val, val];
    t2 = l2 < 0.5 ? l2 * (1 + s) : l2 + s - l2 * s;
    t1 = 2 * l2 - t2;
    rgb2 = [0, 0, 0];
    for (; i < 3; ) {
      t3 = h + 1 / 3 * -(i - 1);
      t3 < 0 ? t3++ : t3 > 1 && t3--;
      val = 6 * t3 < 1 ? t1 + (t2 - t1) * 6 * t3 : 2 * t3 < 1 ? t2 : 3 * t3 < 2 ? t1 + (t2 - t1) * (2 / 3 - t3) * 6 : t1;
      rgb2[i++] = val * 255;
    }
    return rgb2;
  }
};
var hsl_default = hsl;
rgb_default.hsl = function(r2, g2, b2) {
  r2 = r2 / 255;
  g2 = g2 / 255;
  b2 = b2 / 255;
  var min = Math.min(r2, g2, b2), max = Math.max(r2, g2, b2), delta = max - min, h = 0, s, l2;
  if (max === min) {
    h = 0;
  } else if (r2 === max) {
    h = (g2 - b2) / delta;
  } else if (g2 === max) {
    h = 2 + (b2 - r2) / delta;
  } else if (b2 === max) {
    h = 4 + (r2 - g2) / delta;
  }
  h = Math.min(h / 6, 1);
  if (h < 0) {
    h += 1;
  }
  l2 = (min + max) / 2;
  if (max === min) {
    s = 0;
  } else if (l2 <= 0.5) {
    s = delta / (max + min);
  } else {
    s = delta / (2 - max - min);
  }
  return [h * 360, s * 100, l2 * 100];
};

// hsv.js
var hsv = {
  name: "hsv",
  channel: ["hue", "saturation", "value"],
  range: [[0, 360], [0, 100], [0, 100]],
  rgb: function(h, s, v2) {
    h = h / 360 * 6;
    s = s / 100;
    v2 = v2 / 100;
    var hi = Math.floor(h) % 6;
    var f2 = h - Math.floor(h), p4 = v2 * (1 - s), q2 = v2 * (1 - s * f2), t2 = v2 * (1 - s * (1 - f2));
    var result;
    switch (hi) {
      case 0:
        result = [v2, t2, p4];
        break;
      case 1:
        result = [q2, v2, p4];
        break;
      case 2:
        result = [p4, v2, t2];
        break;
      case 3:
        result = [p4, q2, v2];
        break;
      case 4:
        result = [t2, p4, v2];
        break;
      case 5:
        result = [v2, p4, q2];
        break;
    }
    return [result[0] * 255, result[1] * 255, result[2] * 255];
  },
  hsl: function(h, s, v2) {
    s = s / 100;
    v2 = v2 / 100;
    var sl, l2;
    l2 = (2 - s) * v2;
    sl = s * v2;
    sl /= l2 <= 1 ? l2 : 2 - l2;
    sl = sl || 0;
    l2 /= 2;
    return [h, sl * 100, l2 * 100];
  }
};
var hsv_default = hsv;
rgb_default.hsv = function(r2, g2, b2) {
  r2 = r2 / 255;
  g2 = g2 / 255;
  b2 = b2 / 255;
  var min = Math.min(r2, g2, b2), max = Math.max(r2, g2, b2), delta = max - min, h = 0, s, v2;
  if (max === 0) {
    s = 0;
  } else {
    s = delta / max;
  }
  if (max === min) {
    h = 0;
  } else if (r2 === max) {
    h = (g2 - b2) / delta;
  } else if (g2 === max) {
    h = 2 + (b2 - r2) / delta;
  } else if (b2 === max) {
    h = 4 + (r2 - g2) / delta;
  }
  h = Math.min(h / 6, 1);
  if (h < 0) {
    h += 1;
  }
  v2 = max;
  return [h * 360, s * 100, v2 * 100];
};
hsl_default.hsv = function(h, s, l2) {
  s = s / 100;
  l2 = l2 / 100;
  var l22 = l2 * 2;
  var s2 = s * (l22 <= 1 ? l22 : 2 - l22);
  var v2 = (l22 + s2) / 2;
  var sv = 2 * s2 / (l22 + s2);
  return [h, sv * 100, v2 * 100];
};

// hsi.js
var hsi = {
  name: "hsi",
  //hue, saturation, intensity
  channel: ["hue", "saturation", "intensity"],
  range: [[0, 360], [0, 100], [0, 100]]
};
var hsi_default = hsi;
hsi.rgb = function(h, s, i) {
  h = h / 360 * 2 * Math.PI;
  s = s / 100;
  i = i / 100;
  h = h < 0 ? h % (2 * Math.PI) + 2 * Math.PI : h % (2 * Math.PI);
  var pi3 = Math.PI / 3;
  var r2, g2, b2;
  if (h < 2 * pi3) {
    b2 = i * (1 - s);
    r2 = i * (1 + s * Math.cos(h) / Math.cos(pi3 - h));
    g2 = i * (1 + s * (1 - Math.cos(h) / Math.cos(pi3 - h)));
  } else if (h < 4 * pi3) {
    h = h - 2 * pi3;
    r2 = i * (1 - s);
    g2 = i * (1 + s * Math.cos(h) / Math.cos(pi3 - h));
    b2 = i * (1 + s * (1 - Math.cos(h) / Math.cos(pi3 - h)));
  } else {
    h = h - 4 * pi3;
    g2 = i * (1 - s);
    b2 = i * (1 + s * Math.cos(h) / Math.cos(pi3 - h));
    r2 = i * (1 + s * (1 - Math.cos(h) / Math.cos(pi3 - h)));
  }
  return [r2 * 255, g2 * 255, b2 * 255];
};
rgb_default.hsi = function(r2, g2, b2) {
  r2 = r2 / 255;
  g2 = g2 / 255;
  b2 = b2 / 255;
  var sum = r2 + g2 + b2;
  var rNorm = r2 / sum;
  var gNorm = g2 / sum;
  var bNorm = b2 / sum;
  var h = Math.acos(
    0.5 * (rNorm - gNorm + (rNorm - bNorm)) / Math.sqrt((rNorm - gNorm) * (rNorm - gNorm) + (rNorm - bNorm) * (gNorm - bNorm))
  );
  if (bNorm > gNorm) {
    h = 2 * Math.PI - h;
  }
  var s = 1 - 3 * Math.min(rNorm, gNorm, bNorm);
  var i = sum / 3;
  return [h / (2 * Math.PI) * 360, s * 100, i * 100];
};

// hwb.js
var hwb = {
  name: "hwb",
  channel: ["hue", "whiteness", "blackness"],
  range: [[0, 360], [0, 100], [0, 100]],
  rgb: function(h, wh, bl) {
    h = h / 360;
    wh = wh / 100;
    bl = bl / 100;
    var ratio = wh + bl, i, v2, f2, n4;
    var r2, g2, b2;
    if (ratio > 1) {
      wh /= ratio;
      bl /= ratio;
    }
    i = Math.floor(6 * h);
    v2 = 1 - bl;
    f2 = 6 * h - i;
    if ((i & 1) !== 0) {
      f2 = 1 - f2;
    }
    n4 = wh + f2 * (v2 - wh);
    switch (i) {
      default:
      case 6:
      case 0:
        r2 = v2;
        g2 = n4;
        b2 = wh;
        break;
      case 1:
        r2 = n4;
        g2 = v2;
        b2 = wh;
        break;
      case 2:
        r2 = wh;
        g2 = v2;
        b2 = n4;
        break;
      case 3:
        r2 = wh;
        g2 = n4;
        b2 = v2;
        break;
      case 4:
        r2 = n4;
        g2 = wh;
        b2 = v2;
        break;
      case 5:
        r2 = v2;
        g2 = wh;
        b2 = n4;
        break;
    }
    return [r2 * 255, g2 * 255, b2 * 255];
  },
  // http://alvyray.com/Papers/CG/HWB_JGTv208.pdf
  hsv: function(h, w, b2) {
    w = w / 100;
    b2 = b2 / 100;
    var s, v2;
    if (w + b2 >= 1) {
      s = 0;
      v2 = w / (w + b2);
    } else {
      s = 1 - w / (1 - b2);
      v2 = 1 - b2;
    }
    return [h, s * 100, v2 * 100];
  },
  hsl: function(h, w, b2) {
    return hsv_default.hsl(...hwb.hsv(h, w, b2));
  }
};
var hwb_default = hwb;
rgb_default.hwb = function(r2, g2, b2) {
  r2 = r2 / 255;
  g2 = g2 / 255;
  b2 = b2 / 255;
  var h = rgb_default.hsl(r2 * 255, g2 * 255, b2 * 255)[0], w = Math.min(r2, Math.min(g2, b2));
  b2 = 1 - Math.max(r2, Math.max(g2, b2));
  return [h, w * 100, b2 * 100];
};
hsv_default.hwb = function(h, s, v2) {
  s = s / 100;
  v2 = v2 / 100;
  return [h, (v2 === 0 ? 0 : v2 * (1 - s)) * 100, (1 - v2) * 100];
};
hsl_default.hwb = function(h, s, l2) {
  return hsv_default.hwb(...hsl_default.hsv(h, s, l2));
};

// cmyk.js
var cmyk = {
  name: "cmyk",
  channel: ["cyan", "magenta", "yellow", "black"],
  range: [[0, 100], [0, 100], [0, 100], [0, 100]]
};
cmyk.rgb = (c4, m3, y, k2) => {
  c4 = c4 / 100;
  m3 = m3 / 100;
  y = y / 100;
  k2 = k2 / 100;
  return [
    (1 - Math.min(1, c4 * (1 - k2) + k2)) * 255,
    (1 - Math.min(1, m3 * (1 - k2) + k2)) * 255,
    (1 - Math.min(1, y * (1 - k2) + k2)) * 255
  ];
};
rgb_default.cmyk = (r2, g2, b2) => {
  r2 = r2 / 255;
  g2 = g2 / 255;
  b2 = b2 / 255;
  let c4, m3, y, k2;
  k2 = Math.min(1 - r2, 1 - g2, 1 - b2);
  c4 = (1 - r2 - k2) / (1 - k2) || 0;
  m3 = (1 - g2 - k2) / (1 - k2) || 0;
  y = (1 - b2 - k2) / (1 - k2) || 0;
  return [c4 * 100, m3 * 100, y * 100, k2 * 100];
};
var cmyk_default = cmyk;

// cmy.js
var cmy = {
  name: "cmy",
  channel: ["cyan", "magenta", "yellow"],
  range: [[0, 100], [0, 100], [0, 100]]
};
cmy.rgb = (c4, m3, y) => {
  return [
    (100 - c4) / 100 * 255,
    (100 - m3) / 100 * 255,
    (100 - y) / 100 * 255
  ];
};
rgb_default.cmy = (r2, g2, b2) => {
  return [
    (1 - r2 / 255) * 100 || 0,
    (1 - g2 / 255) * 100 || 0,
    (1 - b2 / 255) * 100 || 0
  ];
};
var cmy_default = cmy;

// lrgb.js
var lrgb = {
  name: "lrgb",
  channel: ["red", "green", "blue"],
  range: [[0, 1], [0, 1], [0, 1]]
};
rgb_default.lrgb = (r2, g2, b2) => {
  r2 = r2 / 255;
  g2 = g2 / 255;
  b2 = b2 / 255;
  const sign_r = r2 < 0 ? -1 : 1, abs_r = Math.abs(r2);
  const sign_g = g2 < 0 ? -1 : 1, abs_g = Math.abs(g2);
  const sign_b = b2 < 0 ? -1 : 1, abs_b = Math.abs(b2);
  return [
    sign_r * (abs_r > 0.04045 ? Math.pow((abs_r + 0.055) / 1.055, 2.4) : abs_r / 12.92),
    sign_g * (abs_g > 0.04045 ? Math.pow((abs_g + 0.055) / 1.055, 2.4) : abs_g / 12.92),
    sign_b * (abs_b > 0.04045 ? Math.pow((abs_b + 0.055) / 1.055, 2.4) : abs_b / 12.92)
  ];
};
lrgb.rgb = (r2, g2, b2) => {
  const sign_r = r2 < 0 ? -1 : 1, abs_r = Math.abs(r2);
  const sign_g = g2 < 0 ? -1 : 1, abs_g = Math.abs(g2);
  const sign_b = b2 < 0 ? -1 : 1, abs_b = Math.abs(b2);
  return [
    255 * (sign_r * (abs_r > 31308e-7 ? 1.055 * Math.pow(abs_r, 1 / 2.4) - 0.055 : abs_r * 12.92)),
    255 * (sign_g * (abs_g > 31308e-7 ? 1.055 * Math.pow(abs_g, 1 / 2.4) - 0.055 : abs_g * 12.92)),
    255 * (sign_b * (abs_b > 31308e-7 ? 1.055 * Math.pow(abs_b, 1 / 2.4) - 0.055 : abs_b * 12.92))
  ];
};
var lrgb_default = lrgb;

// xyz.js
var whitepoint = {
  // 1931 2° Observer
  2: {
    // Incandescent
    A: [109.85, 100, 35.585],
    B: [99.0927, 100, 85.313],
    C: [98.074, 100, 118.232],
    D50: [96.422, 100, 82.521],
    D55: [95.682, 100, 92.149],
    // Daylight
    D65: [95.0456, 100, 108.9058],
    D75: [94.972, 100, 122.638],
    // Fluorescent
    F1: [92.834, 100, 103.665],
    F2: [99.187, 100, 67.395],
    F3: [103.913, 100, 65.71],
    F4: [109.147, 100, 38.813],
    F5: [90.872, 100, 98.723],
    F6: [97.309, 100, 60.191],
    F7: [95.044, 100, 108.755],
    F8: [96.413, 100, 82.333],
    F9: [100.365, 100, 67.868],
    F10: [96.174, 100, 81.712],
    F11: [100.966, 100, 64.37],
    F12: [108.046, 100, 39.228],
    // Equal Energy
    E: [100, 100, 100]
  },
  // 1964 10° Observer
  10: {
    // Incandescent
    A: [111.144, 100, 35.2],
    B: [99.178, 100, 84.349],
    C: [97.285, 100, 116.145],
    D50: [96.72, 100, 81.427],
    D55: [95.799, 100, 90.926],
    // Daylight
    D65: [94.811, 100, 107.304],
    D75: [94.416, 100, 120.641],
    // Fluorescent
    F1: [94.791, 100, 103.191],
    F2: [103.28, 100, 69.026],
    F3: [108.968, 100, 66.5],
    F4: [114.961, 100, 40.963],
    F5: [93.369, 100, 98.636],
    F6: [102.148, 100, 62.074],
    F7: [95.792, 100, 107.687],
    F8: [97.115, 100, 81.135],
    F9: [102.116, 100, 67.826],
    F10: [99.001, 100, 83.134],
    F11: [103.866, 100, 65.627],
    F12: [111.428, 100, 40.353],
    // Equal Energy
    E: [100, 100, 100]
  }
};
var xyz = {
  name: "xyz",
  channel: ["X", "Y", "Z"],
  range: [[0, 100], [0, 100], [0, 100]],
  whitepoint
};
xyz.lrgb = (x, y, z) => {
  x = x / 100;
  y = y / 100;
  z = z / 100;
  return [
    x * 3.240969941904521 + y * -1.537383177570093 + z * -0.498610760293,
    x * -0.96924363628087 + y * 1.87596750150772 + z * 0.041555057407175,
    x * 0.055630079696993 + y * -0.20397695888897 + z * 1.056971514242878
  ];
};
lrgb_default.xyz = (r2, g2, b2) => {
  const xyz2 = [
    r2 * 0.41239079926595 + g2 * 0.35758433938387 + b2 * 0.18048078840183,
    r2 * 0.21263900587151 + g2 * 0.71516867876775 + b2 * 0.072192315360733,
    r2 * 0.019330818715591 + g2 * 0.11919477979462 + b2 * 0.95053215224966
  ];
  return xyz2.map((v2) => v2 * 100);
};
rgb_default.xyz = (r2, g2, b2) => lrgb_default.xyz(...rgb_default.lrgb(r2, g2, b2));
xyz.rgb = (x, y, z) => lrgb_default.rgb(...xyz.lrgb(x, y, z));
var xyz_default = xyz;

// xyy.js
var xyy = {
  name: "xyy",
  channel: ["x", "y", "Y"],
  range: [[0, 1], [0, 1], [0, 100]]
};
xyy.xyz = function(x, y, Y) {
  var X, Z;
  if (y === 0) {
    return [0, 0, 0];
  }
  X = x * Y / y;
  Z = (1 - x - y) * Y / y;
  return [X, Y, Z];
};
xyz_default.xyy = function(X, Y, Z) {
  var sum;
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
  channel: ["Y", "I", "Q"],
  range: [[0, 1], [-0.5957, 0.5957], [-0.5226, 0.5226]]
};
yiq.rgb = function(y, i, q2) {
  var r2, g2, b2;
  r2 = y * 1 + i * 0.956 + q2 * 0.621;
  g2 = y * 1 + i * -0.272 + q2 * -0.647;
  b2 = y * 1 + i * -1.108 + q2 * 1.705;
  r2 = Math.min(Math.max(0, r2), 1);
  g2 = Math.min(Math.max(0, g2), 1);
  b2 = Math.min(Math.max(0, b2), 1);
  return [r2 * 255, g2 * 255, b2 * 255];
};
rgb_default.yiq = function(r2, g2, b2) {
  r2 = r2 / 255;
  g2 = g2 / 255;
  b2 = b2 / 255;
  var y = r2 * 0.299 + g2 * 0.587 + b2 * 0.114;
  var i = 0, q2 = 0;
  if (r2 !== g2 || g2 !== b2) {
    i = r2 * 0.596 + g2 * -0.275 + b2 * -0.321;
    q2 = r2 * 0.212 + g2 * -0.528 + b2 * 0.311;
  }
  return [y, i, q2];
};
var yiq_default = yiq;

// yuv.js
var yuv = {
  name: "yuv",
  channel: ["Y", "U", "V"],
  range: [[0, 1], [-0.436, 0.436], [-0.615, 0.615]]
};
yuv.rgb = function(y, u2, v2) {
  var r2, g2, b2;
  r2 = y * 1 + u2 * 0 + v2 * 1.13983;
  g2 = y * 1 + u2 * -0.39465 + v2 * -0.5806;
  b2 = y * 1 + u2 * 2.02311 + v2 * 0;
  r2 = Math.min(Math.max(0, r2), 1);
  g2 = Math.min(Math.max(0, g2), 1);
  b2 = Math.min(Math.max(0, b2), 1);
  return [r2 * 255, g2 * 255, b2 * 255];
};
rgb_default.yuv = function(r2, g2, b2) {
  r2 = r2 / 255;
  g2 = g2 / 255;
  b2 = b2 / 255;
  var y = r2 * 0.299 + g2 * 0.587 + b2 * 0.114;
  var u2 = r2 * -0.14713 + g2 * -0.28886 + b2 * 0.436;
  var v2 = r2 * 0.615 + g2 * -0.51499 + b2 * -0.10001;
  return [y, u2, v2];
};
var yuv_default = yuv;

// ydbdr.js
var ydbdr = {
  name: "ydbdr",
  channel: ["Y", "Db", "Dr"],
  range: [[0, 1], [-1.333, 1.333], [-1.333, 1.333]]
};
ydbdr.rgb = function(y, db, dr) {
  var r2 = y + 92303716148e-15 * db - 0.525912630661865 * dr;
  var g2 = y - 0.129132898890509 * db + 0.267899328207599 * dr;
  var b2 = y + 0.664679059978955 * db - 79202543533e-15 * dr;
  return [r2 * 255, g2 * 255, b2 * 255];
};
rgb_default.ydbdr = function(r2, g2, b2) {
  r2 = r2 / 255;
  g2 = g2 / 255;
  b2 = b2 / 255;
  return [
    0.299 * r2 + 0.587 * g2 + 0.114 * b2,
    -0.45 * r2 - 0.883 * g2 + 1.333 * b2,
    -1.333 * r2 + 1.116 * g2 + 0.217 * b2
  ];
};
yuv_default.ydbdr = function(y, u2, v2) {
  return [
    y,
    3.059 * u2,
    -2.169 * v2
  ];
};
ydbdr.yuv = function(y, db, dr) {
  return [
    y,
    db / 3.059,
    -dr / 2.169
  ];
};
var ydbdr_default = ydbdr;

// ycgco.js
var ycgco = {
  name: "ycgco",
  channel: ["Y", "Cg", "Co"],
  range: [[0, 1], [-0.5, 0.5], [-0.5, 0.5]]
};
ycgco.rgb = function(y, cg, co) {
  var tmp = y - cg;
  return [
    (tmp + co) * 255,
    (y + cg) * 255,
    (tmp - co) * 255
  ];
};
rgb_default.ycgco = function(r2, g2, b2) {
  r2 = r2 / 255;
  g2 = g2 / 255;
  b2 = b2 / 255;
  return [
    0.25 * r2 + 0.5 * g2 + 0.25 * b2,
    -0.25 * r2 + 0.5 * g2 - 0.25 * b2,
    0.5 * r2 - 0.5 * b2
  ];
};
var ycgco_default = ycgco;

// ypbpr.js
var ypbpr = {
  name: "ypbpr",
  channel: ["Y", "Pb", "Pr"],
  range: [[0, 1], [-0.5, 0.5], [-0.5, 0.5]]
};
ypbpr.rgb = function(y, pb, pr, kb, kr) {
  kb = kb || 0.0722;
  kr = kr || 0.2126;
  var r2 = y + 2 * pr * (1 - kr);
  var b2 = y + 2 * pb * (1 - kb);
  var g2 = (y - kr * r2 - kb * b2) / (1 - kr - kb);
  return [r2 * 255, g2 * 255, b2 * 255];
};
rgb_default.ypbpr = function(r2, g2, b2, kb, kr) {
  r2 = r2 / 255;
  g2 = g2 / 255;
  b2 = b2 / 255;
  kb = kb || 0.0722;
  kr = kr || 0.2126;
  var y = kr * r2 + (1 - kr - kb) * g2 + kb * b2;
  var pb = 0.5 * (b2 - y) / (1 - kb);
  var pr = 0.5 * (r2 - y) / (1 - kr);
  return [y, pb, pr];
};
var ypbpr_default = ypbpr;

// ycbcr.js
var ycbcr = {
  name: "ycbcr",
  channel: ["Y", "Cb", "Cr"],
  range: [[16, 235], [16, 240], [16, 240]],
  /**
   * YCbCr to YPbPr (digital to analog)
   * Input: Y: 16-235, Cb/Cr: 16-240
   * Output: Y/Pb/Pr: 0-1
   */
  ypbpr: function(y, cb, cr) {
    return [
      (y - 16) / (235 - 16),
      (cb - 128) / (240 - 16),
      (cr - 128) / (240 - 16)
    ];
  }
};
ypbpr_default.ycbcr = function(y, pb, pr) {
  return [
    y * (235 - 16) + 16,
    pb * (240 - 16) + 128,
    pr * (240 - 16) + 128
  ];
};
ycbcr.rgb = function(y, cb, cr, kb, kr) {
  return ypbpr_default.rgb(...ycbcr.ypbpr(y, cb, cr), kb, kr);
};
rgb_default.ycbcr = function(r2, g2, b2, kb, kr) {
  return ypbpr_default.ycbcr(...rgb_default.ypbpr(r2, g2, b2, kb, kr));
};
var ycbcr_default = ycbcr;

// xvycc.js
var xvycc = {
  name: "xvycc",
  channel: ["Y", "Cb", "Cr"],
  range: [[16, 235], [16, 240], [16, 240]],
  // Standard digital range (can be extended to 1-254)
  /**
   * xvYCC to RGB
   * Uses ITU-R BT.709 or BT.601 transformation
   * Extended range allows RGB values outside [0,255]
   *
   * Formula: R = Y + 2*Cr*(1-Kr)
   *          B = Y + 2*Cb*(1-Kb)
   *          G = (Y - Kr*R - Kb*B)/(1-Kr-Kb)
   *
   * Reference test values (BT.709):
   *   Black [0,0,0] → [Y=16, Cb=128, Cr=128]
   *   White [255,255,255] → [Y=235, Cb=128, Cr=128]
   *
   * @param {number} y Y component (luminance) [16-235] (can extend to 1-254)
   * @param {number} cb Cb component (blue-difference) [16-240] (can extend)
   * @param {number} cr Cr component (red-difference) [16-240] (can extend)
   * @param {number} kb Blue weight (default: 0.0722 for BT.709)
   * @param {number} kr Red weight (default: 0.2126 for BT.709)
   * @return {Array<number>} RGB values 0-255 (may extend beyond)
   */
  rgb: function(y, cb, cr, kb, kr) {
    kb = kb || 0.0722;
    kr = kr || 0.2126;
    var y_norm = (y - 16) / (235 - 16);
    var cb_norm = (cb - 128) / (240 - 16);
    var cr_norm = (cr - 128) / (240 - 16);
    var r_norm = y_norm + 2 * cr_norm * (1 - kr);
    var b_norm = y_norm + 2 * cb_norm * (1 - kb);
    var g_norm = (y_norm - kr * r_norm - kb * b_norm) / (1 - kr - kb);
    return [r_norm * 255, g_norm * 255, b_norm * 255];
  },
  /**
   * xvYCC to XYZ
   * Converts through RGB using the standard transformation
   *
   * @param {number} y Y component (luminance) [16-235]
   * @param {number} cb Cb component (blue-difference) [16-240]
   * @param {number} cr Cr component (red-difference) [16-240]
   * @param {number} kb Blue weight (default: 0.0722 for BT.709)
   * @param {number} kr Red weight (default: 0.2126 for BT.709)
   * @return {Array<number>} XYZ values 0-100
   */
  xyz: function(y, cb, cr, kb, kr) {
    return rgb_default.xyz(...xvycc.rgb(y, cb, cr, kb, kr));
  },
  /**
   * xvYCC to YPbPr
   * Converts between digital (16-235/240) and analog (0-1/-0.5-0.5) ranges
   *
   * @param {number} y Y component [16-235]
   * @param {number} cb Cb component [16-240]
   * @param {number} cr Cr component [16-240]
   * @return {Array<number>} YPbPr values [Y: 0-1, Pb: -0.5-0.5, Pr: -0.5-0.5]
   */
  ypbpr: function(y, cb, cr) {
    var y_analog = (y - 16) / (235 - 16);
    var pb = (cb - 128) / (240 - 16);
    var pr = (cr - 128) / (240 - 16);
    return [y_analog, pb, pr];
  }
};
var xvycc_default = xvycc;
rgb_default.xvycc = function(r2, g2, b2, kb, kr) {
  kb = kb || 0.0722;
  kr = kr || 0.2126;
  var r_norm = r2 / 255;
  var g_norm = g2 / 255;
  var b_norm = b2 / 255;
  var y_norm = kr * r_norm + (1 - kr - kb) * g_norm + kb * b_norm;
  var cb_norm = 0.5 * (b_norm - y_norm) / (1 - kb);
  var cr_norm = 0.5 * (r_norm - y_norm) / (1 - kr);
  var y = y_norm * (235 - 16) + 16;
  var cb = cb_norm * (240 - 16) + 128;
  var cr = cr_norm * (240 - 16) + 128;
  return [y, cb, cr];
};
xyz_default.xvycc = function(x, y, z, kb, kr) {
  return rgb_default.xvycc(...xyz_default.rgb(x, y, z), kb, kr);
};
ypbpr_default.xvycc = function(y, pb, pr) {
  var y_digital = y * (235 - 16) + 16;
  var cb = pb * (240 - 16) + 128;
  var cr = pr * (240 - 16) + 128;
  return [y_digital, cb, cr];
};

// yccbccrc.js
var yccbccrc = {
  name: "yccbccrc",
  channel: ["Yc", "Cbc", "Crc"],
  range: [[0, 1], [-0.5, 0.5], [-0.5, 0.5]]
};
yccbccrc.rgb = function(y, cb, cr) {
  return ypbpr_default.rgb(y, cb, cr, 0.0593, 0.2627);
};
rgb_default.yccbccrc = function(r2, g2, b2) {
  return rgb_default.ypbpr(r2, g2, b2, 0.0593, 0.2627);
};
var yccbccrc_default = yccbccrc;

// ucs.js
var ucs = {
  name: "ucs",
  channel: ["U", "V", "W"],
  range: [[0, 100], [0, 100], [0, 100]]
};
var ucs_default = ucs;
ucs.xyz = function(u2, v2, w) {
  return [
    1.5 * u2,
    v2,
    1.5 * u2 - 3 * v2 + 2 * w
  ];
};
xyz_default.ucs = function(x, y, z) {
  return [
    x * 2 / 3,
    y,
    0.5 * (-x + 3 * y + z)
  ];
};

// uvw.js
var uvw = {
  name: "uvw",
  channel: ["U", "V", "W"],
  range: [[-100, 100], [-100, 100], [0, 100]]
};
var uvw_default = uvw;
uvw.xyz = function(u2, v2, w, i, o) {
  var _u, _v, x, y, z, xn, yn, zn, un, vn;
  if (w === 0) return [0, 0, 0];
  i = i || "D65";
  o = o || 2;
  xn = xyz_default.whitepoint[o][i][0];
  yn = xyz_default.whitepoint[o][i][1];
  zn = xyz_default.whitepoint[o][i][2];
  un = 4 * xn / (xn + 15 * yn + 3 * zn);
  vn = 6 * yn / (xn + 15 * yn + 3 * zn);
  y = Math.pow((w + 17) / 25, 3);
  _u = u2 / (13 * w) + un || 0;
  _v = v2 / (13 * w) + vn || 0;
  x = 6 / 4 * y * _u / _v;
  z = y * (2 / _v - 0.5 * _u / _v - 5);
  return [x * 100, y * 100, z * 100];
};
xyz_default.uvw = function(x, y, z, i, o) {
  x = x / 100;
  y = y / 100;
  z = z / 100;
  var xn, yn, zn, un, vn;
  i = i || "D65";
  o = o || 2;
  xn = xyz_default.whitepoint[o][i][0];
  yn = xyz_default.whitepoint[o][i][1];
  zn = xyz_default.whitepoint[o][i][2];
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
  channel: ["Y", "Cb", "Cr"],
  range: [[0, 255], [0, 255], [0, 255]]
};
var jpeg_default = jpeg;
jpeg.rgb = function(y, cb, cr) {
  y = y / 255;
  cb = cb / 255;
  cr = cr / 255;
  const center = 128 / 255;
  const rgb2 = [
    y + 1.402 * (cr - center),
    y - 0.34414 * (cb - center) - 0.71414 * (cr - center),
    y + 1.772 * (cb - center)
  ];
  return rgb2.map((v2) => v2 * 255);
};
rgb_default.jpeg = function(r2, g2, b2) {
  r2 = r2 / 255;
  g2 = g2 / 255;
  b2 = b2 / 255;
  const center = 128 / 255;
  const jpeg2 = [
    0.299 * r2 + 0.587 * g2 + 0.114 * b2,
    center - 0.168736 * r2 - 0.331264 * g2 + 0.5 * b2,
    center + 0.5 * r2 - 0.418688 * g2 - 0.081312 * b2
  ];
  return jpeg2.map((v2) => v2 * 255);
};

// lab.js
var lab = {
  name: "lab",
  channel: ["lightness", "a", "b"],
  range: [[0, 100], [-125, 125], [-125, 125]]
};
var \u03B5 = 216 / 24389;
var \u03B53 = 24 / 116;
var \u03BA = 24389 / 27;
var white = [0.95047, 1, 1.08883];
lab.xyz = (l2, a2, b2) => {
  let f2 = [];
  f2[1] = (l2 + 16) / 116;
  f2[0] = a2 / 500 + f2[1];
  f2[2] = f2[1] - b2 / 200;
  let xyz2 = [
    f2[0] > \u03B53 ? Math.pow(f2[0], 3) : (116 * f2[0] - 16) / \u03BA,
    l2 > 8 ? Math.pow((l2 + 16) / 116, 3) : l2 / \u03BA,
    f2[2] > \u03B53 ? Math.pow(f2[2], 3) : (116 * f2[2] - 16) / \u03BA
  ];
  return xyz2.map((value, i) => value * white[i] * 100);
};
xyz_default.lab = (x, y, z) => {
  x = x / 100;
  y = y / 100;
  z = z / 100;
  x /= 0.95047;
  z /= 1.08883;
  x = x > 8856e-6 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 8856e-6 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 8856e-6 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;
  return [
    116 * y - 16,
    // L in 0-100
    500 * (x - y),
    // a in -125 to 125
    200 * (y - z)
    // b in -125 to 125
  ];
};
var lab_default = lab;

// labh.js
var labh = {
  name: "labh",
  channel: ["lightness", "a", "b"],
  range: [[0, 100], [-100, 100], [-100, 100]]
};
labh.xyz = (l2, a2, b2) => {
  let _y = l2 / 10;
  let _x = a2 / 17.5 * _y;
  let _z = b2 / 7 * _y;
  let y = _y * _y;
  let x = (_x + y) / 1.02;
  let z = -(_z - y) / 0.847;
  return [x, y, z];
};
xyz_default.labh = (x, y, z) => {
  let _y12 = Math.sqrt(y);
  let l2 = _y12 * 10;
  let a2 = y === 0 ? 0 : 17.5 * ((1.02 * x - y) / _y12);
  let b2 = y === 0 ? 0 : 7 * ((y - 0.847 * z) / _y12);
  return [l2, a2, b2];
};
var labh_default = labh;

// lms.js
var lms = {
  name: "lms",
  channel: ["long", "medium", "short"],
  range: [[0, 100], [0, 100], [0, 100]],
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
lms.xyz = function(l2, m3, s, matrix) {
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
    l2 * matrix[0] + m3 * matrix[1] + s * matrix[2],
    l2 * matrix[3] + m3 * matrix[4] + s * matrix[5],
    l2 * matrix[6] + m3 * matrix[7] + s * matrix[8]
  ];
};
xyz_default.lms = function(x, y, z, matrix) {
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
  channel: ["lightness", "chroma", "hue"],
  range: [[0, 100], [0, 150], [0, 360]],
  xyz: function(l2, c4, h) {
    return lab_default.xyz(...lchab.lab(l2, c4, h));
  },
  lab: function(l2, c4, h) {
    var a2, b2, hr;
    hr = h / 360 * 2 * Math.PI;
    a2 = c4 * Math.cos(hr);
    b2 = c4 * Math.sin(hr);
    return [l2, a2, b2];
  }
};
lab_default.lchab = function(l2, a2, b2) {
  var hr, h, c4;
  hr = Math.atan2(b2, a2);
  h = hr / (2 * Math.PI) * 360;
  if (h < 0) {
    h += 360;
  }
  c4 = Math.sqrt(a2 * a2 + b2 * b2);
  return [l2, c4, h];
};
xyz_default.lchab = function(x, y, z) {
  return lab_default.lchab(...xyz_default.lab(x, y, z));
};
var lchab_default = lchab;

// luv.js
var luv = {
  name: "luv",
  //NOTE: luv has no rigidly defined limits
  //easyrgb fails to get proper coords
  //boronine states no rigid limits
  //colorMine refers this ones:
  channel: ["lightness", "u", "v"],
  range: [[0, 100], [-100, 100], [-100, 100]],
  xyz: function(l2, u2, v2, i, o) {
    var _u, _v, x, y, z, xn, yn, zn, un, vn;
    if (l2 === 0) return [0, 0, 0];
    var k2 = 0.0011070564598794539;
    i = i || "D65";
    o = o || 2;
    xn = xyz_default.whitepoint[o][i][0];
    yn = xyz_default.whitepoint[o][i][1];
    zn = xyz_default.whitepoint[o][i][2];
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
xyz_default.luv = function(x, y, z, i, o) {
  var _u, _v, l2, u2, v2, xn, yn, zn, un, vn;
  var e = 0.008856451679035631;
  var k2 = 903.2962962962961;
  i = i || "D65";
  o = o || 2;
  xn = xyz_default.whitepoint[o][i][0];
  yn = xyz_default.whitepoint[o][i][1];
  zn = xyz_default.whitepoint[o][i][2];
  un = 4 * xn / (xn + 15 * yn + 3 * zn);
  vn = 9 * yn / (xn + 15 * yn + 3 * zn);
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
  range: [[0, 100], [0, 150], [0, 360]],
  luv: function(l2, c4, h) {
    var u2, v2, hr;
    hr = h / 360 * 2 * Math.PI;
    u2 = c4 * Math.cos(hr);
    v2 = c4 * Math.sin(hr);
    return [l2, u2, v2];
  },
  xyz: function(l2, c4, h) {
    return luv_default.xyz(...lchuv.luv(l2, c4, h));
  }
};
var lchuv_default = lchuv;
luv_default.lchuv = function(l2, u2, v2) {
  var c4 = Math.sqrt(u2 * u2 + v2 * v2);
  var hr = Math.atan2(v2, u2);
  var h = hr / (2 * Math.PI) * 360;
  if (h < 0) {
    h += 360;
  }
  return [l2, c4, h];
};
xyz_default.lchuv = function(x, y, z) {
  return luv_default.lchuv(...xyz_default.luv(x, y, z));
};

// hsluv.js
function f(a2) {
  var c4 = [], b2 = Math.pow(a2 + 16, 3) / 1560896;
  b2 = b2 > g ? b2 : a2 / k;
  for (var d2 = 0; 3 > d2; ) {
    var e = d2++, h = l[e][0], w = l[e][1];
    e = l[e][2];
    for (var x = 0; 2 > x; ) {
      var y = x++, z = (632260 * e - 126452 * w) * b2 + 126452 * y;
      c4.push({ b: (284517 * h - 94839 * e) * b2 / z, a: ((838422 * e + 769860 * w + 731718 * h) * a2 * b2 - 769860 * y * a2) / z });
    }
  }
  return c4;
}
function m(a2) {
  a2 = f(a2);
  for (var c4 = Infinity, b2 = 0; b2 < a2.length; ) {
    var d2 = a2[b2];
    ++b2;
    c4 = Math.min(c4, Math.abs(d2.a) / Math.sqrt(Math.pow(d2.b, 2) + 1));
  }
  return c4;
}
function n(a2, c4) {
  c4 = c4 / 360 * Math.PI * 2;
  a2 = f(a2);
  for (var b2 = Infinity, d2 = 0; d2 < a2.length; ) {
    var e = a2[d2];
    ++d2;
    e = e.a / (Math.sin(c4) - e.b * Math.cos(c4));
    0 <= e && (b2 = Math.min(b2, e));
  }
  return b2;
}
function p(a2, c4) {
  for (var b2 = 0, d2 = 0, e = a2.length; d2 < e; ) {
    var h = d2++;
    b2 += a2[h] * c4[h];
  }
  return b2;
}
function q(a2) {
  return 31308e-7 >= a2 ? 12.92 * a2 : 1.055 * Math.pow(a2, 0.4166666666666667) - 0.055;
}
function r(a2) {
  return 0.04045 < a2 ? Math.pow((a2 + 0.055) / 1.055, 2.4) : a2 / 12.92;
}
function t(a2) {
  return [q(p(l[0], a2)), q(p(l[1], a2)), q(p(l[2], a2))];
}
function u(a2) {
  a2 = [r(a2[0]), r(a2[1]), r(a2[2])];
  return [p(v[0], a2), p(v[1], a2), p(v[2], a2)];
}
function A(a2) {
  var c4 = a2[0], b2 = a2[1];
  a2 = c4 + 15 * b2 + 3 * a2[2];
  0 != a2 ? (c4 = 4 * c4 / a2, a2 = 9 * b2 / a2) : a2 = c4 = NaN;
  b2 = b2 <= g ? b2 / B * k : 116 * Math.pow(b2 / B, 0.3333333333333333) - 16;
  return 0 == b2 ? [0, 0, 0] : [b2, 13 * b2 * (c4 - C), 13 * b2 * (a2 - D)];
}
function E(a2) {
  var c4 = a2[0];
  if (0 == c4) return [0, 0, 0];
  var b2 = a2[1] / (13 * c4) + C;
  a2 = a2[2] / (13 * c4) + D;
  c4 = 8 >= c4 ? B * c4 / k : B * Math.pow((c4 + 16) / 116, 3);
  b2 = 0 - 9 * c4 * b2 / ((b2 - 4) * a2 - b2 * a2);
  return [b2, c4, (9 * c4 - 15 * a2 * c4 - a2 * b2) / (3 * a2)];
}
function F(a2) {
  var c4 = a2[0], b2 = a2[1], d2 = a2[2];
  a2 = Math.sqrt(b2 * b2 + d2 * d2);
  1e-8 > a2 ? b2 = 0 : (b2 = 180 * Math.atan2(d2, b2) / Math.PI, 0 > b2 && (b2 = 360 + b2));
  return [c4, a2, b2];
}
function G(a2) {
  var c4 = a2[1], b2 = a2[2] / 360 * 2 * Math.PI;
  return [a2[0], Math.cos(b2) * c4, Math.sin(b2) * c4];
}
function H(a2) {
  var c4 = a2[0], b2 = a2[1];
  a2 = a2[2];
  if (99.9999999 < a2) return [100, 0, c4];
  if (1e-8 > a2) return [0, 0, c4];
  b2 = n(a2, c4) / 100 * b2;
  return [a2, b2, c4];
}
function I(a2) {
  var c4 = a2[0], b2 = a2[1];
  a2 = a2[2];
  if (99.9999999 < c4) return [a2, 0, 100];
  if (1e-8 > c4) return [a2, 0, 0];
  var d2 = n(c4, a2);
  return [a2, b2 / d2 * 100, c4];
}
function J(a2) {
  var c4 = a2[0], b2 = a2[1];
  a2 = a2[2];
  if (99.9999999 < a2) return [100, 0, c4];
  if (1e-8 > a2) return [0, 0, c4];
  b2 = m(a2) / 100 * b2;
  return [a2, b2, c4];
}
function K(a2) {
  var c4 = a2[0], b2 = a2[1];
  a2 = a2[2];
  if (99.9999999 < c4) return [a2, 0, 100];
  if (1e-8 > c4) return [a2, 0, 0];
  var d2 = m(c4);
  return [a2, b2 / d2 * 100, c4];
}
function O(a2) {
  return t(E(G(a2)));
}
function P(a2) {
  return F(A(u(a2)));
}
function Q(a2) {
  return O(H(a2));
}
function R(a2) {
  return I(P(a2));
}
function S(a2) {
  return O(J(a2));
}
function T(a2) {
  return K(P(a2));
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
  channel: ["hue", "saturation", "lightness"],
  range: [[0, 360], [0, 100], [0, 100]],
  lchuv: (h, s, l2) => {
    const lch = _hsluv.hsluvToLch([h, s, l2]);
    return [lch[0], lch[1], lch[2]];
  },
  rgb: function(h, s, l2) {
    const xyz_vals = hsluv.xyz(h, s, l2);
    return xyz_default.rgb(xyz_vals[0], xyz_vals[1], xyz_vals[2]);
  },
  xyz: function(h, s, l2) {
    const lch = hsluv.lchuv(h, s, l2);
    return lchuv_default.xyz(lch[0], lch[1], lch[2]);
  },
  //a shorter way to convert to hpluv
  hpluv: function(h, s, l2) {
    const lch = _hsluv.hsluvToLch([h, s, l2]);
    const hpl = _hsluv.lchToHpluv(lch);
    return [hpl[0], hpl[1], hpl[2]];
  },
  // export internal math
  _hsluv
};
var hsluv_default = hsluv;
lchuv_default.hsluv = (l2, c4, h) => {
  const hsl2 = _hsluv.lchToHsluv([l2, c4, h]);
  return [hsl2[0], hsl2[1], hsl2[2]];
};
xyz_default.hsluv = function(x, y, z) {
  const lch = xyz_default.lchuv(x, y, z);
  return lchuv_default.hsluv(lch[0], lch[1], lch[2]);
};
rgb_default.hsluv = (r2, g2, b2) => {
  const hsl2 = _hsluv.rgbToHsluv([r2 / 255, g2 / 255, b2 / 255]);
  return [hsl2[0], hsl2[1], hsl2[2]];
};

// hpluv.js
var hpluv = {
  name: "hpluv",
  min: [0, 0, 0],
  max: [360, 100, 100],
  channel: ["h", "s", "l"],
  alias: ["hpl"],
  // Range documentation (not used in conventional v3)
  range: [[0, 360], [0, 100], [0, 100]],
  lchuv: (h, s, l2) => {
    h = h !== void 0 ? h : 0;
    s = s !== void 0 ? s : 0;
    l2 = l2 !== void 0 ? l2 : 0;
    const lch = _hsluv.hpluvToLch([h, s, l2]);
    return [lch[0], lch[1], lch[2]];
  },
  xyz: function(h, s, l2) {
    const lch = hpluv.lchuv(h, s, l2);
    return lchuv_default.xyz(lch[0], lch[1], lch[2]);
  },
  rgb: function(h, s, l2) {
    const lch = hpluv.lchuv(h, s, l2);
    return lchuv_default.rgb(lch[0], lch[1], lch[2]);
  },
  //a shorter way to convert to hsluv
  hsluv: function(h, s, l2) {
    h = h !== void 0 ? h : 0;
    s = s !== void 0 ? s : 0;
    l2 = l2 !== void 0 ? l2 : 0;
    const lch = _hsluv.hpluvToLch([h, s, l2]);
    const hsl2 = _hsluv.lchToHsluv(lch);
    return [hsl2[0], hsl2[1], hsl2[2]];
  }
};
var hpluv_default = hpluv;
lchuv_default.hpluv = (l2, c4, h) => {
  l2 = l2 !== void 0 ? l2 : 0;
  c4 = c4 !== void 0 ? c4 : 0;
  h = h !== void 0 ? h : 0;
  const hpl = _hsluv.lchToHpluv([l2, c4, h]);
  return [hpl[0], hpl[1], hpl[2]];
};
xyz_default.hpluv = function(x, y, z) {
  const lch = xyz_default.lchuv(x, y, z);
  return lchuv_default.hpluv(lch[0], lch[1], lch[2]);
};
rgb_default.hpluv = function(r2, g2, b2) {
  const lch = rgb_default.lchuv(r2, g2, b2);
  return lchuv_default.hpluv(lch[0], lch[1], lch[2]);
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
  range: [[0, 1]],
  defaults
};
cubehelix.rgb = function(fraction, options = {}) {
  var start = options.start !== void 0 ? options.start : defaults.start;
  var rotation = options.rotation !== void 0 ? options.rotation : defaults.rotation;
  var gamma2 = options.gamma !== void 0 ? options.gamma : defaults.gamma;
  var hue = options.hue !== void 0 ? options.hue : defaults.hue;
  var angle = 2 * Math.PI * (start / 3 + 1 + rotation * fraction);
  fraction = Math.pow(fraction, gamma2);
  var amp = hue * fraction * (1 - fraction) / 2;
  var r2 = fraction + amp * (-0.14861 * Math.cos(angle) + 1.78277 * Math.sin(angle));
  var g2 = fraction + amp * (-0.29227 * Math.cos(angle) - 0.90649 * Math.sin(angle));
  var b2 = fraction + amp * (1.97294 * Math.cos(angle));
  r2 = Math.max(0, Math.min(r2, 1));
  g2 = Math.max(0, Math.min(g2, 1));
  b2 = Math.max(0, Math.min(b2, 1));
  return [r2 * 255, g2 * 255, b2 * 255];
};
rgb_default.cubehelix = function(rgb2) {
  throw new Error("rgb.cubehelix conversion is not implemented yet");
};
var cubehelix_default = cubehelix;

// coloroid.js
var whitepoint2 = xyz_default.whitepoint;
var coloroid = {
  name: "coloroid",
  // hue, saturation, luminosity
  channel: ["A", "T", "V"],
  range: [[0, 72], [0, 100], [0, 100]],
  // min: [1, 0, 0],
  // max: [48, 100, 100],
  // Coloroid table
  // Regression of values is almost impossible, as hues don't correlate
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
   * @param {number} A
   * @param {number} T
   * @param {number} V
   *
   * @return {Array<number>} xyY values
   */
  xyy: function(A2, T2, V) {
    var table = this.table;
    var row;
    for (var i = 0; i < table.length; i++) {
      if (A2 <= table[i][0]) {
        row = table[i];
        break;
      }
    }
    if (!row) {
      row = table[table.length - 1];
    }
    var yl = row[4], el = row[2], xl = row[3];
    var Y = V / 10 * (V / 10);
    var Yl = yl * el * 100;
    var x = (100 * Y * x0 * ew * 100 + 100 * xl * el * T2 - Yl * T2 * x0 * ew) / (100 * T2 * el - Yl * T2 * ew + 100 * Y * ew * 100);
    var y = (100 * Y * 100 + 100 * T2 * yl * el - Yl * T2) / (Y * 100 * ew * 100 + T2 * 100 * el - T2 * Yl * ew);
    return [x, y, Y];
  }
};
var TABLE = coloroid.table.slice(-13).concat(coloroid.table.slice(0, -13));
var [Xn, Yn, Zn] = whitepoint2[2].D65;
var x0 = Xn / (Xn + Yn + Zn);
var y0 = Yn / (Xn + Yn + Zn);
var ew = (Xn + Yn + Zn) / 100;
xyy_default.coloroid = function(x, y, Y) {
  var V = 10 * Math.sqrt(Y);
  var angle = Math.atan2(y - y0, x - x0) * 180 / Math.PI;
  var row;
  var prev = TABLE.length - 1;
  for (var i = 0; i < TABLE.length; i++) {
    if (angle > TABLE[i][1]) {
      break;
    }
    prev = i;
  }
  row = Math.abs(TABLE[i + 1][1] - angle) > Math.abs(TABLE[prev][1] - angle) ? TABLE[i + 1] : TABLE[prev];
  var A2 = row[0];
  var yl = row[4], el = row[2], xl = row[3];
  var Yl = yl * el * 100;
  var T2 = 100 * Y * (x0 * ew - x * ew) / (100 * (x * el - xl * el) + Yl * (x0 * ew - x * ew));
  return [A2, T2, V];
};
xyz_default.coloroid = function(x, y, z) {
  return xyy_default.coloroid(...xyz_default.xyy(x, y, z));
};
coloroid.xyz = function(a2, t2, v2) {
  return xyy_default.xyz(...coloroid.xyy(a2, t2, v2));
};
var coloroid_default = coloroid;

// hcg.js
var hcg = {
  name: "hcg",
  channel: ["hue", "chroma", "gray"],
  range: [[0, 360], [0, 100], [0, 100]],
  rgb: function(h, c4, g2) {
    h = h / 360;
    c4 = c4 / 100;
    g2 = g2 / 100;
    if (c4 === 0) {
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
    var mg = (1 - c4) * g2;
    var rgb2 = [
      (c4 * pure[0] + mg) * 255,
      (c4 * pure[1] + mg) * 255,
      (c4 * pure[2] + mg) * 255
    ];
    return rgb2;
  },
  hsl: function(h, c4, g2) {
    c4 = c4 / 100;
    g2 = g2 / 100;
    var l2 = g2 * (1 - c4) + 0.5 * c4;
    var s = 0;
    if (l2 < 1 && l2 > 0) {
      if (l2 < 0.5) {
        s = c4 / (2 * l2);
      } else {
        s = c4 / (2 * (1 - l2));
      }
    }
    return [h, s * 100, l2 * 100];
  },
  hsv: function(h, c4, g2) {
    c4 = c4 / 100;
    g2 = g2 / 100;
    var v2 = c4 + g2 * (1 - c4);
    var res;
    if (v2 > 0) {
      var f2 = c4 / v2;
      res = [h, f2 * 100, v2 * 100];
    } else {
      res = [h, 0, v2 * 100];
    }
    return res;
  },
  hwb: function(h, c4, g2) {
    c4 = c4 / 100;
    g2 = g2 / 100;
    var v2 = c4 + g2 * (1 - c4);
    return [h, (v2 - c4) * 100, (1 - v2) * 100];
  }
};
var hcg_default = hcg;
rgb_default.hcg = function(r2, g2, b2) {
  r2 = r2 / 255;
  g2 = g2 / 255;
  b2 = b2 / 255;
  var max = Math.max(Math.max(r2, g2), b2);
  var min = Math.min(Math.min(r2, g2), b2);
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
      hue = (g2 - b2) / chroma % 6;
    } else if (max === g2) {
      hue = 2 + (b2 - r2) / chroma;
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
hsl_default.hcg = function(h, s, l2) {
  s = s / 100;
  l2 = l2 / 100;
  var c4 = 0;
  if (l2 < 0.5) {
    c4 = 2 * s * l2;
  } else {
    c4 = 2 * s * (1 - l2);
  }
  var res;
  if (c4 < 1) {
    var f2 = (l2 - 0.5 * c4) / (1 - c4);
    res = [h, c4 * 100, f2 * 100];
  } else {
    res = [h, c4 * 100, 0];
  }
  return res;
};
hsv_default.hcg = function(h, s, v2) {
  s = s / 100;
  v2 = v2 / 100;
  var c4 = s * v2;
  var res;
  if (c4 < 1) {
    var f2 = (v2 - c4) / (1 - c4);
    res = [h, c4 * 100, f2 * 100];
  } else {
    res = [h, c4 * 100, 0];
  }
  return res;
};
hwb_default.hcg = function(h, w, b2) {
  w = w / 100;
  b2 = b2 / 100;
  var v2 = 1 - b2;
  var c4 = v2 - w;
  var g2 = 0;
  if (c4 < 1) {
    g2 = (v2 - c4) / (1 - c4);
  }
  return [h, c4 * 100, g2 * 100];
};

// hcy.js
var hcy = {
  name: "hcy",
  channel: ["hue", "chroma", "luminance"],
  range: [[0, 360], [0, 100], [0, 100]]
};
var hcy_default = hcy;
hcy.rgb = function(h, s, i) {
  h = h / 360 * 2 * Math.PI;
  s = s / 100;
  i = i / 100;
  h = h < 0 ? h % (2 * Math.PI) + 2 * Math.PI : h % (2 * Math.PI);
  var pi3 = Math.PI / 3;
  var r2, g2, b2;
  if (h < 2 * pi3) {
    b2 = i * (1 - s);
    r2 = i * (1 + s * Math.cos(h) / Math.cos(pi3 - h));
    g2 = i * (1 + s * (1 - Math.cos(h) / Math.cos(pi3 - h)));
  } else if (h < 4 * pi3) {
    h = h - 2 * pi3;
    r2 = i * (1 - s);
    g2 = i * (1 + s * Math.cos(h) / Math.cos(pi3 - h));
    b2 = i * (1 + s * (1 - Math.cos(h) / Math.cos(pi3 - h)));
  } else {
    h = h - 4 * pi3;
    g2 = i * (1 - s);
    b2 = i * (1 + s * Math.cos(h) / Math.cos(pi3 - h));
    r2 = i * (1 + s * (1 - Math.cos(h) / Math.cos(pi3 - h)));
  }
  return [r2 * 255, g2 * 255, b2 * 255];
};
rgb_default.hcy = function(r2, g2, b2) {
  r2 = r2 / 255;
  g2 = g2 / 255;
  b2 = b2 / 255;
  var sum = r2 + g2 + b2;
  var rNorm = r2 / sum;
  var gNorm = g2 / sum;
  var bNorm = b2 / sum;
  var h = Math.acos(
    0.5 * (rNorm - gNorm + (rNorm - bNorm)) / Math.sqrt((rNorm - gNorm) * (rNorm - gNorm) + (rNorm - bNorm) * (gNorm - bNorm))
  );
  if (bNorm > gNorm) {
    h = 2 * Math.PI - h;
  }
  var s = 1 - 3 * Math.min(rNorm, gNorm, bNorm);
  var i = sum / 3;
  return [h / (2 * Math.PI) * 360, s * 100, i * 100];
};

// tsl.js
var tsl = {
  name: "tsl",
  channel: ["tint", "saturation", "lightness"],
  range: [[0, 360], [0, 1], [0, 255]]
};
var tsl_default = tsl;
tsl.rgb = function(T2, S2, L) {
  T2 = T2 / 360;
  var x = Math.tan(2 * Math.PI * (T2 - 1 / 4));
  x *= x;
  var r2 = Math.sqrt(5 * S2 * S2 / (9 * (1 / x + 1))) + 1 / 3;
  var g2 = Math.sqrt(5 * S2 * S2 / (9 * (x + 1))) + 1 / 3;
  var k2 = L / (0.185 * r2 + 0.473 * g2 + 0.114);
  var B2 = k2 * (1 - r2 - g2);
  var G2 = k2 * g2;
  var R2 = k2 * r2;
  return [R2, G2, B2];
};
rgb_default.tsl = function(r2, g2, b2) {
  var sum = r2 + g2 + b2;
  var r_ = (r2 / sum || 0) - 1 / 3, g_ = (g2 / sum || 0) - 1 / 3, T2 = g_ != 0 ? 0.5 - Math.atan2(g_, r_) / 2 / Math.PI : 0, S2 = Math.sqrt(9 / 5 * (r_ * r_ + g_ * g_)), L = r2 * 0.299 + g2 * 0.587 + b2 * 0.114;
  return [T2 * 360, S2, L];
};

// yes.js
var yes = {
  name: "yes",
  channel: ["luminance", "e-factor", "s-factor"],
  range: [[0, 1], [-0.5, 0.5], [-0.5, 0.5]]
};
yes.rgb = function(y, e, s) {
  var m3 = [
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
  var r2 = y * m3[0] + e * m3[1] + s * m3[2], g2 = y * m3[3] + e * m3[4] + s * m3[5], b2 = y * m3[6] + e * m3[7] + s * m3[8];
  return [r2 * 255, g2 * 255, b2 * 255];
};
rgb_default.yes = function(r2, g2, b2) {
  r2 = r2 / 255;
  g2 = g2 / 255;
  b2 = b2 / 255;
  var m3 = [
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
    r2 * m3[0] + g2 * m3[1] + b2 * m3[2],
    r2 * m3[3] + g2 * m3[4] + b2 * m3[5],
    r2 * m3[6] + g2 * m3[7] + b2 * m3[8]
  ];
};
var yes_default = yes;

// osaucs.js
var osaucs = {
  name: "osaucs",
  channel: ["L", "j", "g"],
  range: [[-10, 10], [-10, 10], [-10, 10]]
};
osaucs.xyz = function(L, j, g2) {
  var x, y, z;
  throw "Unimplemented";
  return [x, y, z];
};
xyz_default.osaucs = function(X, Y, Z) {
  var x = X / (X + Y + Z);
  var y = Y / (X + Y + Z);
  var K4 = 4.4934 * x * x + 4.3034 * y * y - 4.276 * x * y - 1.3744 * x - 2.56439 * y + 1.8103;
  var Y0 = K4 * Y;
  var L_ = 5.9 * (Math.pow(Y0, 1 / 3) - 2 / 3 + 0.042 * Math.pow(Math.max(Y0, 30) - 30, 1 / 3));
  var L = (L_ - 14.3993) / Math.sqrt(2);
  var C2 = L_ / (5.9 * (Math.pow(Y0, 1 / 3) - 2 / 3));
  var R2 = 0.779 * X + 0.4194 * Y - 0.1648 * Z;
  var G2 = -0.4493 * X + 1.3265 * Y + 0.0927 * Z;
  var B2 = -0.1149 * X + 0.3394 * Y + 0.717 * Z;
  R2 = Math.pow(R2, 1 / 3) || 0;
  G2 = Math.pow(G2, 1 / 3) || 0;
  B2 = Math.pow(B2, 1 / 3) || 0;
  var a2 = -13.7 * R2 + 17.7 * G2 - 4 * B2;
  var b2 = 1.7 * R2 + 8 * G2 - 9.7 * B2;
  var g2 = C2 * a2;
  var j = C2 * b2;
  return [L, j, g2];
};
var osaucs_default = osaucs;

// hsp.js
var Pr = 0.299;
var Pg = 0.587;
var Pb = 0.114;
var hsp = {
  name: "hsp",
  channel: ["hue", "saturation", "perceived_brightness"],
  range: [[0, 360], [0, 100], [0, 100]],
  rgb: function(h, s, p4) {
    h = h / 360;
    s = s / 100;
    p4 = p4 / 100;
    var r2, g2, b2, part, minOverMax = 1 - s;
    if (minOverMax > 0) {
      if (h < 1 / 6) {
        h = 6 * (h - 0 / 6);
        part = 1 + h * (1 / minOverMax - 1);
        b2 = p4 / Math.sqrt(Pr / minOverMax / minOverMax + Pg * part * part + Pb);
        r2 = b2 / minOverMax;
        g2 = b2 + h * (r2 - b2);
      } else if (h < 2 / 6) {
        h = 6 * (-h + 2 / 6);
        part = 1 + h * (1 / minOverMax - 1);
        b2 = p4 / Math.sqrt(Pg / minOverMax / minOverMax + Pr * part * part + Pb);
        g2 = b2 / minOverMax;
        r2 = b2 + h * (g2 - b2);
      } else if (h < 3 / 6) {
        h = 6 * (h - 2 / 6);
        part = 1 + h * (1 / minOverMax - 1);
        r2 = p4 / Math.sqrt(Pg / minOverMax / minOverMax + Pb * part * part + Pr);
        g2 = r2 / minOverMax;
        b2 = r2 + h * (g2 - r2);
      } else if (h < 4 / 6) {
        h = 6 * (-h + 4 / 6);
        part = 1 + h * (1 / minOverMax - 1);
        r2 = p4 / Math.sqrt(Pb / minOverMax / minOverMax + Pg * part * part + Pr);
        b2 = r2 / minOverMax;
        g2 = r2 + h * (b2 - r2);
      } else if (h < 5 / 6) {
        h = 6 * (h - 4 / 6);
        part = 1 + h * (1 / minOverMax - 1);
        g2 = p4 / Math.sqrt(Pb / minOverMax / minOverMax + Pr * part * part + Pg);
        b2 = g2 / minOverMax;
        r2 = g2 + h * (b2 - g2);
      } else {
        h = 6 * (-h + 6 / 6);
        part = 1 + h * (1 / minOverMax - 1);
        g2 = p4 / Math.sqrt(Pr / minOverMax / minOverMax + Pb * part * part + Pg);
        r2 = g2 / minOverMax;
        b2 = g2 + h * (r2 - g2);
      }
    } else {
      if (h < 1 / 6) {
        h = 6 * (h - 0 / 6);
        r2 = Math.sqrt(p4 * p4 / (Pr + Pg * h * h));
        g2 = r2 * h;
        b2 = 0;
      } else if (h < 2 / 6) {
        h = 6 * (-h + 2 / 6);
        g2 = Math.sqrt(p4 * p4 / (Pg + Pr * h * h));
        r2 = g2 * h;
        b2 = 0;
      } else if (h < 3 / 6) {
        h = 6 * (h - 2 / 6);
        g2 = Math.sqrt(p4 * p4 / (Pg + Pb * h * h));
        b2 = g2 * h;
        r2 = 0;
      } else if (h < 4 / 6) {
        h = 6 * (-h + 4 / 6);
        b2 = Math.sqrt(p4 * p4 / (Pb + Pg * h * h));
        g2 = b2 * h;
        r2 = 0;
      } else if (h < 5 / 6) {
        h = 6 * (h - 4 / 6);
        b2 = Math.sqrt(p4 * p4 / (Pb + Pr * h * h));
        r2 = b2 * h;
        g2 = 0;
      } else {
        h = 6 * (-h + 6 / 6);
        r2 = Math.sqrt(p4 * p4 / (Pr + Pb * h * h));
        b2 = r2 * h;
        g2 = 0;
      }
    }
    return [r2 * 255, g2 * 255, b2 * 255];
  }
};
var hsp_default = hsp;
rgb_default.hsp = function(r2, g2, b2) {
  r2 = r2 / 255;
  g2 = g2 / 255;
  b2 = b2 / 255;
  var h = 0, s = 0, p4;
  p4 = Math.sqrt(r2 * r2 * Pr + g2 * g2 * Pg + b2 * b2 * Pb);
  if (r2 === g2 && r2 === b2) {
    h = 0;
    s = 0;
  } else {
    if (r2 >= g2 && r2 >= b2) {
      if (b2 >= g2) {
        h = 6 / 6 - 1 / 6 * (b2 - g2) / (r2 - g2);
        s = 1 - g2 / r2;
      } else {
        h = 0 / 6 + 1 / 6 * (g2 - b2) / (r2 - b2);
        s = 1 - b2 / r2;
      }
    }
    if (g2 >= r2 && g2 >= b2) {
      if (r2 >= b2) {
        h = 2 / 6 - 1 / 6 * (r2 - b2) / (g2 - b2);
        s = 1 - b2 / g2;
      } else {
        h = 2 / 6 + 1 / 6 * (b2 - r2) / (g2 - r2);
        s = 1 - r2 / g2;
      }
    }
    if (b2 >= r2 && b2 >= g2) {
      if (g2 >= r2) {
        h = 4 / 6 - 1 / 6 * (g2 - r2) / (b2 - r2);
        s = 1 - r2 / b2;
      } else {
        h = 4 / 6 + 1 / 6 * (r2 - g2) / (b2 - g2);
        s = 1 - g2 / b2;
      }
    }
  }
  return [h * 360, s * 100, p4 * 100];
};

// hsm.js
var hsm = {
  name: "hsm",
  channel: ["hue", "saturation", "mixture"],
  range: [[0, 360], [0, 100], [0, 100]]
};
var hsm_default = hsm;
hsm.rgb = function(h, s, m3) {
  h = h / 360;
  s = s / 100;
  m3 = m3 / 100;
  let D2;
  if (m3 >= 0 && m3 <= 1 / 7) D2 = Math.sqrt((0 - m3) ** 2 + (0 - m3) ** 2 + (7 - m3) ** 2);
  else if (m3 > 1 / 7 && m3 <= 3 / 7) D2 = Math.sqrt((0 - m3) ** 2 + ((7 * m3 - 1) / 2 - m3) ** 2 + (1 - m3) ** 2);
  else if (m3 > 3 / 7 && m3 <= 0.5) D2 = Math.sqrt(((7 * m3 - 3) / 2 - m3) ** 2 + (1 - m3) ** 2 + (1 - m3) ** 2);
  else if (m3 > 0.5 && m3 <= 4 / 7) D2 = Math.sqrt((7 * m3 / 4 - m3) ** 2 + (0 - m3) ** 2 + (0 - m3) ** 2);
  else if (m3 > 4 / 7 && m3 <= 6 / 7) D2 = Math.sqrt((1 - m3) ** 2 + ((7 * m3 - 4) / 2 - m3) ** 2 + (0 - m3) ** 2);
  else if (m3 > 6 / 7 && m3 <= 1) D2 = Math.sqrt((1 - m3) ** 2 + (1 - m3) ** 2 + (7 * m3 - 6 - m3) ** 2);
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
  const r2 = Math.max(0, Math.min(1, m3 + dr));
  const g2 = Math.max(0, Math.min(1, m3 + dg));
  const b2 = Math.max(0, Math.min(1, m3 + db));
  return [r2 * 255, g2 * 255, b2 * 255];
};
rgb_default.hsm = function(r2, g2, b2) {
  r2 = r2 / 255;
  g2 = g2 / 255;
  b2 = b2 / 255;
  let m3 = (4 * r2 + 2 * g2 + b2) / 7;
  let dr = r2 - m3, dg = g2 - m3, db = b2 - m3;
  let d2 = Math.sqrt(dr * dr + dg * dg + db * db);
  let theta = Math.acos((3 * dr - 4 * dg - 4 * db) / Math.sqrt(41 * (dr * dr + dg * dg + db * db)) || 0);
  let h = b2 <= g2 ? theta / (2 * Math.PI) : 1 - theta / (2 * Math.PI);
  let s;
  if (0 <= m3 && m3 <= 1 / 7) s = d2 / Math.sqrt((0 - m3) ** 2 + (0 - m3) ** 2 + (7 - m3) ** 2);
  else if (1 / 7 < m3 && m3 <= 3 / 7) s = d2 / Math.sqrt((0 - m3) ** 2 + ((7 * m3 - 1) / 2 - m3) ** 2 + (1 - m3) ** 2);
  else if (3 / 7 < m3 && m3 <= 1 / 2) s = d2 / Math.sqrt(((7 * m3 - 3) / 2 - m3) ** 2 + (1 - m3) ** 2 + (1 - m3) ** 2);
  else if (1 / 2 < m3 && m3 <= 4 / 7) s = d2 / Math.sqrt((7 * m3 / 4 - m3) ** 2 + (0 - m3) ** 2 + (0 - m3) ** 2);
  else if (4 / 7 < m3 && m3 <= 6 / 7) s = d2 / Math.sqrt((1 - m3) ** 2 + ((7 * m3 - 4) / 2 - m3) ** 2 + (0 - m3) ** 2);
  else if (6 / 7 < m3 && m3 < 1) s = d2 / Math.sqrt((1 - m3) ** 2 + (1 - m3) ** 2 + (7 * m3 - 6 - m3) ** 2);
  else s = 0;
  return [h * 360, s * 100, m3 * 100];
};

// oklab.js
var oklab = {
  name: "oklab",
  channel: ["lightness", "a", "b"],
  range: [[0, 100], [-40, 40], [-40, 40]]
};
oklab.rgb = (l2, a2, b2) => {
  l2 = l2 / 100;
  a2 = a2 / 100;
  b2 = b2 / 100;
  const l_ = l2 + 0.3963377774 * a2 + 0.2158037573 * b2;
  const m_ = l2 - 0.1055613458 * a2 - 0.0638541728 * b2;
  const s_ = l2 - 0.0894841775 * a2 - 1.291485548 * b2;
  const l3 = l_ ** 3;
  const m3 = m_ ** 3;
  const s3 = s_ ** 3;
  const rgb2 = [
    4.0767416621 * l3 - 3.307711591 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3
  ];
  return rgb2.map((v2) => Math.max(0, Math.min(255, v2 * 255)));
};
rgb_default.oklab = (r2, g2, b2) => {
  r2 = r2 / 255;
  g2 = g2 / 255;
  b2 = b2 / 255;
  const l2 = 0.4122214708 * r2 + 0.5363325363 * g2 + 0.0514459929 * b2;
  const m3 = 0.2119034982 * r2 + 0.6806995451 * g2 + 0.1073969566 * b2;
  const s = 0.0883024619 * r2 + 0.2817188376 * g2 + 0.6299787005 * b2;
  const l_ = Math.cbrt(l2);
  const m_ = Math.cbrt(m3);
  const s_ = Math.cbrt(s);
  const oklab2 = [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    // L
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    // a
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_
    // b
  ];
  return [oklab2[0] * 100, oklab2[1] * 100, oklab2[2] * 100];
};
oklab.xyz = (l2, a2, b2) => {
  l2 = l2 / 100;
  a2 = a2 / 100;
  b2 = b2 / 100;
  const l_ = l2 + 0.3963377774 * a2 + 0.2158037573 * b2;
  const m_ = l2 - 0.1055613458 * a2 - 0.0638541728 * b2;
  const s_ = l2 - 0.0894841775 * a2 - 1.291485548 * b2;
  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;
  const xyz2 = [
    1.2270138511 * l3 - 0.5577999807 * m3 + 0.281256149 * s3,
    -0.0405801784 * l3 + 1.1122568696 * m3 - 0.0716766787 * s3,
    -0.0763812845 * l3 - 0.4214819784 * m3 + 1.5861632204 * s3
  ];
  return xyz2.map((v2) => v2 * 100);
};
xyz_default.oklab = (x, y, z) => {
  x = x / 100;
  y = y / 100;
  z = z / 100;
  const L = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z);
  const M = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z);
  const S2 = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.633851707 * z);
  const l2 = 0.2104542553 * L + 0.793617785 * M - 0.0040720468 * S2;
  const a2 = 1.9779984951 * L - 2.428592205 * M + 0.4505937099 * S2;
  const b2 = 0.0259040371 * L + 0.7827717662 * M - 0.808675766 * S2;
  return [l2 * 100, a2 * 100, b2 * 100];
};
var oklab_default = oklab;

// oklch.js
var oklch = {
  name: "oklch",
  channel: ["l", "c", "h"],
  range: [[0, 100], [0, 40], [0, 360]]
};
oklch.oklab = function(l2, c4, h) {
  var hRad = h / 360 * 2 * Math.PI;
  var a2 = c4 * Math.cos(hRad);
  var b2 = c4 * Math.sin(hRad);
  return [l2, a2, b2];
};
oklab_default.oklch = function(l2, a2, b2) {
  var c4 = Math.sqrt(a2 * a2 + b2 * b2);
  var h = Math.atan2(b2, a2);
  h = h * 180 / Math.PI;
  if (h < 0) {
    h += 360;
  }
  return [l2, c4, h];
};
oklch.rgb = (...args) => oklab_default.rgb(...oklch.oklab(...args));
rgb_default.oklch = (...args) => oklab_default.oklch(...rgb_default.oklab(...args));
var oklch_default = oklch;

// okhsl.js
var okhsl = {
  name: "okhsl",
  channel: ["h", "s", "l"],
  range: [[0, 360], [0, 100], [0, 100]]
};
var tau = 2 * Math.PI;
var toSRGBLinear = [
  [4.076741636075958, -3.307711539258063, 0.2309699031821043],
  [-1.2684379732850315, 2.609757349287688, -0.341319376002657],
  [-0.0041960761386756, -0.7034186179359362, 1.7076146940746117]
];
var LabtoLMS_M = [
  [1, 0.3963377773761749, 0.2158037573099136],
  [1, -0.1055613458156586, -0.0638541728258133],
  [1, -0.0894841775298119, -1.2914855480194092]
];
var RGBCoeff = [
  // Red
  [
    // Limit
    [-1.8817031, -0.80936501],
    // `Kn` coefficients
    [1.19086277, 1.76576728, 0.59662641, 0.75515197, 0.56771245]
  ],
  // Green
  [
    // Limit
    [1.8144408, -1.19445267],
    // `Kn` coefficients
    [0.73956515, -0.45954404, 0.08285427, 0.12541073, -0.14503204]
  ],
  // Blue
  [
    // Limit
    [0.13110758, 1.81333971],
    // `Kn` coefficients
    [1.35733652, -915799e-8, -1.1513021, -0.50559606, 692167e-8]
  ]
];
var floatMax = Number.MAX_VALUE;
var K1 = 0.206;
var K2 = 0.03;
var K3 = (1 + K1) / (1 + K2);
function vdot(a2, b2) {
  var l2 = a2.length;
  var s = 0;
  for (var i = 0; i < l2; i++) {
    s += a2[i] * b2[i];
  }
  return s;
}
function toe(x) {
  return 0.5 * (K3 * x - K1 + Math.sqrt((K3 * x - K1) * (K3 * x - K1) + 4 * K2 * K3 * x));
}
function toeInv(x) {
  return (x ** 2 + K1 * x) / (K3 * (x + K2));
}
function toSt(cusp) {
  var l2 = cusp[0];
  var c4 = cusp[1];
  return [c4 / l2, c4 / (1 - l2)];
}
function getStMid(a2, b2) {
  var s = 0.11516993 + 1 / (7.4477897 + 4.1590124 * b2 + a2 * (-2.19557347 + 1.75198401 * b2 + a2 * (-2.13704948 - 10.02301043 * b2 + a2 * (-4.24894561 + 5.38770819 * b2 + 4.69891013 * a2))));
  var t2 = 0.11239642 + 1 / (1.6132032 - 0.68124379 * b2 + a2 * (0.40370612 + 0.90148123 * b2 + a2 * (-0.27087943 + 0.6122399 * b2 + a2 * (299215e-8 - 0.45399568 * b2 - 0.14661872 * a2))));
  return [s, t2];
}
function multiply_v3_m3x3(v2, m3) {
  var [x, y, z] = v2;
  var out = [0, 0, 0];
  out[0] = x * m3[0][0] + y * m3[0][1] + z * m3[0][2];
  out[1] = x * m3[1][0] + y * m3[1][1] + z * m3[1][2];
  out[2] = x * m3[2][0] + y * m3[2][1] + z * m3[2][2];
  return out;
}
function oklabToLinearRGB(lab2, lmsToRgb) {
  var lms2 = multiply_v3_m3x3(lab2, LabtoLMS_M);
  lms2[0] = lms2[0] ** 3;
  lms2[1] = lms2[1] ** 3;
  lms2[2] = lms2[2] ** 3;
  return multiply_v3_m3x3(lms2, lmsToRgb);
}
function findCusp(a2, b2, lmsToRgb, okCoeff) {
  var sCusp = computeMaxSaturation(a2, b2, lmsToRgb, okCoeff);
  var rgb2 = oklabToLinearRGB([1, sCusp * a2, sCusp * b2], lmsToRgb);
  var lCusp = spow(1 / Math.max(...rgb2), 1 / 3);
  var cCusp = lCusp * sCusp;
  return [lCusp, cCusp];
}
function spow(a2, b2) {
  return Math.abs(a2) ** b2 * Math.sign(a2);
}
function findGamutIntersection(a2, b2, l1, c14, l0, lmsToRgb, okCoeff, cusp) {
  var t2;
  if (cusp === void 0) {
    cusp = findCusp(a2, b2, lmsToRgb, okCoeff);
  }
  if ((l1 - l0) * cusp[1] - (cusp[0] - l0) * c14 <= 0) {
    t2 = cusp[1] * l0 / (c14 * cusp[0] + cusp[1] * (l0 - l1));
  } else {
    t2 = cusp[1] * (l0 - 1) / (c14 * (cusp[0] - 1) + cusp[1] * (l0 - l1));
    var dl = l1 - l0;
    var dc = c14;
    var kl = vdot(LabtoLMS_M[0].slice(1), [a2, b2]);
    var km = vdot(LabtoLMS_M[1].slice(1), [a2, b2]);
    var ks = vdot(LabtoLMS_M[2].slice(1), [a2, b2]);
    var ldt_ = dl + dc * kl;
    var mdt_ = dl + dc * km;
    var sdt_ = dl + dc * ks;
    var L = l0 * (1 - t2) + t2 * l1;
    var C2 = t2 * c14;
    var l_ = L + C2 * kl;
    var m_ = L + C2 * km;
    var s_ = L + C2 * ks;
    var l2 = l_ ** 3;
    var m3 = m_ ** 3;
    var s = s_ ** 3;
    var ldt = 3 * ldt_ * l_ ** 2;
    var mdt = 3 * mdt_ * m_ ** 2;
    var sdt = 3 * sdt_ * s_ ** 2;
    var ldt2 = 6 * ldt_ ** 2 * l_;
    var mdt2 = 6 * mdt_ ** 2 * m_;
    var sdt2 = 6 * sdt_ ** 2 * s_;
    var r_ = vdot(lmsToRgb[0], [l2, m3, s]) - 1;
    var r1 = vdot(lmsToRgb[0], [ldt, mdt, sdt]);
    var r2 = vdot(lmsToRgb[0], [ldt2, mdt2, sdt2]);
    var ur = r1 / (r1 * r1 - 0.5 * r_ * r2);
    var tr = -r_ * ur;
    var g_ = vdot(lmsToRgb[1], [l2, m3, s]) - 1;
    var g1 = vdot(lmsToRgb[1], [ldt, mdt, sdt]);
    var g2 = vdot(lmsToRgb[1], [ldt2, mdt2, sdt2]);
    var ug = g1 / (g1 * g1 - 0.5 * g_ * g2);
    var tg = -g_ * ug;
    var b_ = vdot(lmsToRgb[2], [l2, m3, s]) - 1;
    var b1 = vdot(lmsToRgb[2], [ldt, mdt, sdt]);
    var b22 = vdot(lmsToRgb[2], [ldt2, mdt2, sdt2]);
    var ub = b1 / (b1 * b1 - 0.5 * b_ * b22);
    var tb = -b_ * ub;
    tr = ur >= 0 ? tr : floatMax;
    tg = ug >= 0 ? tg : floatMax;
    tb = ub >= 0 ? tb : floatMax;
    t2 += Math.min(tr, Math.min(tg, tb));
  }
  return t2;
}
function getCs(lab2, lmsToRgb, okCoeff) {
  var [l2, a2, b2] = lab2;
  var cusp = findCusp(a2, b2, lmsToRgb, okCoeff);
  var cMax = findGamutIntersection(a2, b2, l2, 1, l2, lmsToRgb, okCoeff, cusp);
  var stMax = toSt(cusp);
  var k2 = cMax / Math.min(l2 * stMax[0], (1 - l2) * stMax[1]);
  var stMid = getStMid(a2, b2);
  var ca = l2 * stMid[0];
  var cb = (1 - l2) * stMid[1];
  var cMid = 0.9 * k2 * Math.sqrt(Math.sqrt(1 / (1 / ca ** 4 + 1 / cb ** 4)));
  ca = l2 * 0.4;
  cb = (1 - l2) * 0.8;
  var c0 = Math.sqrt(1 / (1 / ca ** 2 + 1 / cb ** 2));
  return [c0, cMid, cMax];
}
function computeMaxSaturation(a2, b2, lmsToRgb, okCoeff) {
  var k0, k1, k2, k3, k4, wl, wm, ws;
  if (vdot(okCoeff[0][0], [a2, b2]) > 1) {
    [k0, k1, k2, k3, k4] = okCoeff[0][1];
    [wl, wm, ws] = lmsToRgb[0];
  } else if (vdot(okCoeff[1][0], [a2, b2]) > 1) {
    [k0, k1, k2, k3, k4] = okCoeff[1][1];
    [wl, wm, ws] = lmsToRgb[1];
  } else {
    [k0, k1, k2, k3, k4] = okCoeff[2][1];
    [wl, wm, ws] = lmsToRgb[2];
  }
  var sat = k0 + k1 * a2 + k2 * b2 + k3 * a2 ** 2 + k4 * a2 * b2;
  var kl = vdot(LabtoLMS_M[0].slice(1), [a2, b2]);
  var km = vdot(LabtoLMS_M[1].slice(1), [a2, b2]);
  var ks = vdot(LabtoLMS_M[2].slice(1), [a2, b2]);
  var l_ = 1 + sat * kl;
  var m_ = 1 + sat * km;
  var s_ = 1 + sat * ks;
  var l2 = l_ ** 3;
  var m3 = m_ ** 3;
  var s = s_ ** 3;
  var lds = 3 * kl * l_ ** 2;
  var mds = 3 * km * m_ ** 2;
  var sds = 3 * ks * s_ ** 2;
  var lds2 = 6 * kl ** 2 * l_;
  var mds2 = 6 * km ** 2 * m_;
  var sds2 = 6 * ks ** 2 * s_;
  var f2 = wl * l2 + wm * m3 + ws * s;
  var f1 = wl * lds + wm * mds + ws * sds;
  var f22 = wl * lds2 + wm * mds2 + ws * sds2;
  sat = sat - f2 * f1 / (f1 ** 2 - 0.5 * f2 * f22);
  return sat;
}
function constrain(angle) {
  return (angle % 1 + 1) % 1;
}
okhsl.oklab = function(h, s, l2) {
  h = h / 360;
  s = s / 100;
  l2 = l2 / 100;
  var L = toeInv(l2);
  var a2 = null;
  var b2 = null;
  h = constrain(h);
  if (L !== 0 && L !== 1 && s !== 0) {
    var a_ = Math.cos(tau * h);
    var b_ = Math.sin(tau * h);
    var [c0, cMid, cMax] = getCs([L, a_, b_], toSRGBLinear, RGBCoeff);
    var mid = 0.8;
    var midInv = 1.25;
    var t2, k0, k1, k2;
    if (s < mid) {
      t2 = midInv * s;
      k0 = 0;
      k1 = mid * c0;
      k2 = 1 - k1 / cMid;
    } else {
      t2 = 5 * (s - 0.8);
      k0 = cMid;
      k1 = 0.2 * cMid ** 2 * 1.25 ** 2 / c0;
      k2 = 1 - k1 / (cMax - cMid);
    }
    var c4 = k0 + t2 * k1 / (1 - k2 * t2);
    a2 = c4 * a_;
    b2 = c4 * b_;
  }
  return [L * 100, (a2 || 0) * 100, (b2 || 0) * 100];
};
oklab_default.okhsl = function(l2, a2, b2) {
  l2 = l2 / 100;
  a2 = a2 / 100;
  b2 = b2 / 100;
  var \u03B5L = 1e-7;
  var \u03B5S = 1e-4;
  var L = l2;
  var s = 0;
  var l_ = toe(L);
  var c4 = Math.sqrt(a2 ** 2 + b2 ** 2);
  var h = 0.5 + Math.atan2(-b2, -a2) / tau;
  if (l_ !== 0 && l_ !== 1 && c4 !== 0) {
    var a_ = a2 / c4;
    var b_ = b2 / c4;
    var [c0, cMid, cMax] = getCs([L, a_, b_], toSRGBLinear, RGBCoeff);
    var mid = 0.8;
    var midInv = 1.25;
    var k0, k1, k2, t2;
    if (c4 < cMid) {
      k1 = mid * c0;
      k2 = 1 - k1 / cMid;
      t2 = c4 / (k1 + k2 * c4);
      s = t2 * mid;
    } else {
      k0 = cMid;
      k1 = 0.2 * cMid ** 2 * midInv ** 2 / c0;
      k2 = 1 - k1 / (cMax - cMid);
      t2 = (c4 - k0) / (k1 + k2 * (c4 - k0));
      s = mid + 0.2 * t2;
    }
  }
  var achromatic = Math.abs(s) < \u03B5S;
  if (achromatic || l_ === 0 || Math.abs(1 - l_) < \u03B5L) {
    h = 0;
    if (!achromatic) {
      s = 0;
    }
  } else {
    h = constrain(h);
  }
  return [h * 360, s * 100, l_ * 100];
};
okhsl.rgb = (...args) => oklab_default.rgb(...okhsl.oklab(...args));
rgb_default.okhsl = (...args) => oklab_default.okhsl(...rgb_default.oklab(...args));
var okhsl_default = okhsl;

// okhsv.js
var okhsv = {
  name: "okhsv",
  channel: ["h", "s", "v"],
  range: [[0, 360], [0, 100], [0, 100]]
};
function spow2(a2, b2) {
  return Math.abs(a2) ** b2 * Math.sign(a2);
}
function constrain2(angle) {
  return (angle % 1 + 1) % 1;
}
okhsv.oklab = function(h, s, v2) {
  h = h / 360;
  s = s / 100;
  v2 = v2 / 100;
  h = constrain2(h);
  var l2 = toeInv(v2);
  var a2 = null;
  var b2 = null;
  if (l2 !== 0 && s !== 0) {
    var a_ = Math.cos(tau * h);
    var b_ = Math.sin(tau * h);
    var cusp = findCusp(a_, b_, toSRGBLinear, RGBCoeff);
    var [sMax, tMax] = toSt(cusp);
    var s0 = 0.5;
    var k2 = 1 - s0 / sMax;
    var lv = 1 - s * s0 / (s0 + tMax - tMax * k2 * s);
    var cv = s * tMax * s0 / (s0 + tMax - tMax * k2 * s);
    l2 = v2 * lv;
    var c4 = v2 * cv;
    var lvt = toeInv(lv);
    var cvt = cv * lvt / lv;
    var lNew = toeInv(l2);
    c4 = c4 * lNew / l2;
    l2 = lNew;
    var [rs, gs, bs] = oklabToLinearRGB([lvt, a_ * cvt, b_ * cvt], toSRGBLinear);
    var scaleL = spow2(1 / Math.max(Math.max(rs, gs), Math.max(bs, 0)), 1 / 3);
    l2 = l2 * scaleL;
    c4 = c4 * scaleL;
    a2 = c4 * a_;
    b2 = c4 * b_;
  }
  return [l2 * 100, (a2 || 0) * 100, (b2 || 0) * 100];
};
oklab_default.okhsv = function(l2, a2, b2) {
  l2 = l2 / 100;
  a2 = a2 / 100;
  b2 = b2 / 100;
  var \u03B52 = 1e-4;
  var L = l2;
  var s = 0;
  var v2 = toe(L);
  var c4 = Math.sqrt(a2 ** 2 + b2 ** 2);
  var h = 0.5 + Math.atan2(-b2, -a2) / tau;
  if (L !== 0 && L !== 1 && c4 !== 0) {
    var a_ = a2 / c4;
    var b_ = b2 / c4;
    var cusp = findCusp(a_, b_, toSRGBLinear, RGBCoeff);
    var [sMax, tMax] = toSt(cusp);
    var s0 = 0.5;
    var k2 = 1 - s0 / sMax;
    var t2 = tMax / (c4 + L * tMax);
    var lv = t2 * L;
    var cv = t2 * c4;
    var lvt = toeInv(lv);
    var cvt = cv * lvt / lv;
    var [rs, gs, bs] = oklabToLinearRGB([lvt, a_ * cvt, b_ * cvt], toSRGBLinear);
    var scaleL = spow2(1 / Math.max(Math.max(rs, gs), Math.max(bs, 0)), 1 / 3);
    L = L / scaleL;
    c4 = c4 / scaleL;
    c4 = c4 * toe(L) / L;
    L = toe(L);
    v2 = L / lv;
    s = (s0 + tMax) * cv / (tMax * s0 + tMax * k2 * cv);
  }
  if (Math.abs(s) < \u03B52 || v2 === 0) {
    h = 0;
  } else {
    h = constrain2(h);
  }
  return [h * 360, s * 100, v2 * 100];
};
okhsv.rgb = (...args) => oklab_default.rgb(...okhsv.oklab(...args));
rgb_default.okhsv = (...args) => oklab_default.okhsv(...rgb_default.oklab(...args));
var okhsv_default = okhsv;

// oklrab.js
var oklrab = {
  name: "oklrab",
  channel: ["l", "a", "b"],
  range: [[0, 100], [-40, 40], [-40, 40]]
};
oklrab.oklab = function(l2, a2, b2) {
  return [toeInv(l2 / 100) * 100, a2, b2];
};
oklab_default.oklrab = function(l2, a2, b2) {
  return [toe(l2 / 100) * 100, a2, b2];
};
var oklrab_default = oklrab;

// oklrch.js
var oklrch = {
  name: "oklrch",
  channel: ["l", "c", "h"],
  range: [[0, 100], [0, 40], [0, 360]]
};
oklrch.oklrab = function(l2, c4, h) {
  var hRad = h / 360 * 2 * Math.PI;
  var a2 = c4 * Math.cos(hRad);
  var b2 = c4 * Math.sin(hRad);
  return [l2, a2, b2];
};
oklrab_default.oklrch = function(l2, a2, b2) {
  var c4 = Math.sqrt(a2 * a2 + b2 * b2);
  var h = Math.atan2(b2, a2);
  h = h * 180 / Math.PI;
  if (h < 0) {
    h += 360;
  }
  return [l2, c4, h];
};
var oklrch_default = oklrch;

// jzazbz.js
var jzazbz = {
  name: "jzazbz",
  channel: ["Jz", "az", "bz"],
  range: [[0, 100], [-50, 50], [-50, 50]]
};
var b_param = 1.15;
var g_param = 0.66;
var d = -0.56;
var d0 = 16295499532821565e-27;
var Yw = 203;
var n2 = 2610 / 4096 * 0.25;
var n_val = 2610 / 16384;
var ninv = 16384 / 2610;
var c1 = 3424 / 4096;
var c2 = 2413 / 128;
var c3 = 2392 / 128;
var p2 = 1.7 * 2523 / 32;
var pinv = 32 / (1.7 * 2523);
function spow3(a2, b2) {
  return Math.sign(a2) * Math.abs(a2) ** b2;
}
function mm(v2, m3) {
  return [
    v2[0] * m3[0][0] + v2[1] * m3[0][1] + v2[2] * m3[0][2],
    v2[0] * m3[1][0] + v2[1] * m3[1][1] + v2[2] * m3[1][2],
    v2[0] * m3[2][0] + v2[1] * m3[2][1] + v2[2] * m3[2][2]
  ];
}
var XYZtoCone_M = [
  [0.41478972, 0.579999, 0.014648],
  [-0.20151, 1.120649, 0.0531008],
  [-0.0166008, 0.2648, 0.6684799]
];
var ConetoXYZ_M = [
  [1.9242264357876067, -1.0047923125953657, 0.037651404030618],
  [0.35031676209499907, 0.7264811939316552, -0.06538442294808501],
  [-0.09098281098284752, -0.3127282905230739, 1.5227665613052603]
];
var ConetoIab_M = [
  [0.5, 0.5, 0],
  [3.524, -4.066708, 0.542708],
  [0.199076, 1.096799, -1.295875]
];
var IabtoCone_M = [
  [1, 0.13860504327153927, 0.05804731615611883],
  [1, -0.1386050432715393, -0.058047316156118904],
  [1, -0.09601924202631895, -0.811891896056039]
];
xyz_default.jzazbz = function(x, y, z) {
  x = x / 100;
  y = y / 100;
  z = z / 100;
  let Xa = x * Yw;
  let Ya = y * Yw;
  let Za = z * Yw;
  let Xm = b_param * Xa - (b_param - 1) * Za;
  let Ym = g_param * Ya - (g_param - 1) * Xa;
  let LMS = mm([Xm, Ym, Za], XYZtoCone_M);
  let PQLMS = LMS.map((val) => {
    let v2 = val / 1e4;
    let num = c1 + c2 * spow3(v2, n_val);
    let denom = 1 + c3 * spow3(v2, n_val);
    return spow3(num / denom, p2);
  });
  let [Iz, az, bz] = mm(PQLMS, ConetoIab_M);
  let Jz = (1 + d) * Iz / (1 + d * Iz) - d0;
  return [Jz * 100, az * 100, bz * 100];
};
jzazbz.xyz = function(Jz, az, bz) {
  Jz = Jz / 100;
  az = az / 100;
  bz = bz / 100;
  let Iz = (Jz + d0) / (1 + d - d * (Jz + d0));
  let PQLMS = mm([Iz, az, bz], IabtoCone_M);
  let LMS = PQLMS.map((val) => {
    let num = c1 - spow3(val, pinv);
    let denom = c3 * spow3(val, pinv) - c2;
    let x = spow3(num / denom, ninv);
    return x * 1e4;
  });
  let [Xm, Ym, Za] = mm(LMS, ConetoXYZ_M);
  let Xa = (Xm + (b_param - 1) * Za) / b_param;
  let Ya = (Ym + (g_param - 1) * Xa) / g_param;
  return [Xa / Yw * 100, Ya / Yw * 100, Za / Yw * 100];
};
var jzazbz_default = jzazbz;

// jzczhz.js
var jzczhz = {
  name: "jzczhz",
  channel: ["Jz", "Cz", "hz"],
  range: [[0, 100], [0, 50], [0, 360]]
};
jzczhz.jzazbz = function(Jz, Cz, hz) {
  Jz = Jz / 100;
  Cz = Cz / 100;
  hz = hz / 360;
  let h = hz * 2 * Math.PI;
  return [
    Jz,
    Cz * Math.cos(h),
    Cz * Math.sin(h)
  ];
};
jzazbz_default.jzczhz = function(Jz, az, bz) {
  let h = Math.atan2(bz, az) / (2 * Math.PI);
  if (h < 0) {
    h += 1;
  }
  return [
    Jz * 100,
    Math.sqrt(az * az + bz * bz) * 100,
    h * 360
  ];
};
var jzczhz_default = jzczhz;

// p3-linear.js
var p3Linear = {
  name: "p3-linear",
  channel: ["red", "green", "blue"],
  range: [[0, 1], [0, 1], [0, 1]]
};
p3Linear.xyz = (r2, g2, b2) => {
  const x = r2 * 0.4865709486482162 + g2 * 0.26566769316909306 + b2 * 0.1982172852343625;
  const y = r2 * 0.2289745640697488 + g2 * 0.6917385218365064 + b2 * 0.079286914093745;
  const z = r2 * 0 + g2 * 0.04511338185890264 + b2 * 1.043944368900976;
  return [x * 100, y * 100, z * 100];
};
xyz_default.p3Linear = (x, y, z) => {
  x /= 100;
  y /= 100;
  z /= 100;
  const r2 = x * 2.493496911941425 + y * -0.9313836179191239 + z * -0.40271078445071684;
  const g2 = x * -0.8294889695615747 + y * 1.7626640603183463 + z * 0.023624685841943577;
  const b2 = x * 0.03584583024378447 + y * -0.07617238926804182 + z * 0.9568845240076872;
  return [r2, g2, b2];
};
var p3_linear_default = p3Linear;

// p3.js
var p3 = {
  name: "p3",
  channel: ["red", "green", "blue"],
  range: [[0, 255], [0, 255], [0, 255]]
};
p3.xyz = (r2, g2, b2) => {
  const sign_r = r2 < 0 ? -1 : 1, abs_r = Math.abs(r2);
  const sign_g = g2 < 0 ? -1 : 1, abs_g = Math.abs(g2);
  const sign_b = b2 < 0 ? -1 : 1, abs_b = Math.abs(b2);
  return p3_linear_default.xyz(
    sign_r * (abs_r > 0.04045 ? Math.pow((abs_r + 0.055) / 1.055, 2.4) : abs_r / 12.92),
    sign_g * (abs_g > 0.04045 ? Math.pow((abs_g + 0.055) / 1.055, 2.4) : abs_g / 12.92),
    sign_b * (abs_b > 0.04045 ? Math.pow((abs_b + 0.055) / 1.055, 2.4) : abs_b / 12.92)
  );
};
xyz_default.p3 = (x, y, z) => {
  const [lr, lg, lb] = xyz_default.p3Linear(x, y, z);
  const sign_lr = lr < 0 ? -1 : 1, abs_lr = Math.abs(lr);
  const sign_lg = lg < 0 ? -1 : 1, abs_lg = Math.abs(lg);
  const sign_lb = lb < 0 ? -1 : 1, abs_lb = Math.abs(lb);
  return [
    sign_lr * (abs_lr > 31308e-7 ? 1.055 * Math.pow(abs_lr, 1 / 2.4) - 0.055 : abs_lr * 12.92),
    sign_lg * (abs_lg > 31308e-7 ? 1.055 * Math.pow(abs_lg, 1 / 2.4) - 0.055 : abs_lg * 12.92),
    sign_lb * (abs_lb > 31308e-7 ? 1.055 * Math.pow(abs_lb, 1 / 2.4) - 0.055 : abs_lb * 12.92)
  ];
};
var p3_default = p3;

// rec2020-linear.js
var rec2020Linear = {
  name: "rec2020-linear",
  channel: ["red", "green", "blue"],
  range: [[0, 1], [0, 1], [0, 1]]
};
rec2020Linear.xyz = (r2, g2, b2) => {
  const x = r2 * 0.6369580483012914 + g2 * 0.14461690358620832 + b2 * 0.1688809751641721;
  const y = r2 * 0.2627002120112671 + g2 * 0.6779980715188708 + b2 * 0.05930171646986196;
  const z = r2 * 0 + g2 * 0.028072693049087428 + b2 * 1.060985057710791;
  return [x * 100, y * 100, z * 100];
};
xyz_default.rec2020Linear = (x, y, z) => {
  x /= 100;
  y /= 100;
  z /= 100;
  const r2 = x * 1.716651187971268 + y * -0.355670783776392 + z * -0.25336628137366;
  const g2 = x * -0.666684351832489 + y * 1.616481236634939 + z * 0.0157685458139111;
  const b2 = x * 0.017639857445311 + y * -0.042770613257809 + z * 0.942103121235474;
  return [r2, g2, b2];
};
var rec2020_linear_default = rec2020Linear;

// rec2020.js
var rec2020 = {
  name: "rec2020",
  channel: ["red", "green", "blue"],
  range: [[0, 255], [0, 255], [0, 255]]
};
rec2020.xyz = (r2, g2, b2) => {
  return rec2020_linear_default.xyz(
    Math.sign(r2) * Math.pow(Math.abs(r2), 2.4),
    Math.sign(g2) * Math.pow(Math.abs(g2), 2.4),
    Math.sign(b2) * Math.pow(Math.abs(b2), 2.4)
  );
};
xyz_default.rec2020 = (x, y, z) => {
  const [lr, lg, lb] = xyz_default.rec2020Linear(x, y, z);
  return [
    Math.sign(lr) * Math.pow(Math.abs(lr), 1 / 2.4),
    Math.sign(lg) * Math.pow(Math.abs(lg), 1 / 2.4),
    Math.sign(lb) * Math.pow(Math.abs(lb), 1 / 2.4)
  ];
};
var rec2020_default = rec2020;

// rec2020-oetf.js
var rec2020oetf = {
  name: "rec2020-oetf",
  channel: ["red", "green", "blue"],
  range: [[0, 1], [0, 1], [0, 1]]
};
var alpha = 1.099;
var beta = 0.018;
var alphaMinus1 = alpha - 1;
function toLinear(val) {
  const sign = val < 0 ? -1 : 1;
  const abs = Math.abs(val);
  if (abs < beta * 4.5) {
    return sign * (abs / 4.5);
  }
  return sign * Math.pow((abs + alphaMinus1) / alpha, 1 / 0.45);
}
function fromLinear(val) {
  const sign = val < 0 ? -1 : 1;
  const abs = Math.abs(val);
  if (abs < beta) {
    return sign * (4.5 * abs);
  }
  return sign * (alpha * Math.pow(abs, 0.45) - alphaMinus1);
}
rec2020oetf.xyz = (r2, g2, b2) => {
  return rec2020_linear_default.xyz(toLinear(r2), toLinear(g2), toLinear(b2));
};
xyz_default.rec2020oetf = (x, y, z) => {
  const [lr, lg, lb] = xyz_default.rec2020Linear(x, y, z);
  return [fromLinear(lr), fromLinear(lg), fromLinear(lb)];
};
var rec2020_oetf_default = rec2020oetf;

// rec2100-pq.js
var rec2100pq = {
  name: "rec2100pq",
  channel: ["red", "green", "blue"],
  range: [[0, 1], [0, 1], [0, 1]]
};
var Yw2 = 203;
var n3 = 2610 / Math.pow(2, 14);
var ninv2 = Math.pow(2, 14) / 2610;
var m2 = 2523 / Math.pow(2, 5);
var minv = Math.pow(2, 5) / 2523;
var c12 = 3424 / Math.pow(2, 12);
var c22 = 2413 / Math.pow(2, 7);
var c32 = 2392 / Math.pow(2, 7);
function toLinear2(val) {
  const x = Math.pow(Math.max(Math.pow(val, minv) - c12, 0) / (c22 - c32 * Math.pow(val, minv)), ninv2);
  return x * 1e4 / Yw2;
}
function fromLinear2(val) {
  const x = Math.max(val * Yw2 / 1e4, 0);
  const num = c12 + c22 * Math.pow(x, n3);
  const denom = 1 + c32 * Math.pow(x, n3);
  return Math.pow(num / denom, m2);
}
rec2100pq.xyz = (r2, g2, b2) => {
  return rec2020_linear_default.xyz(toLinear2(r2), toLinear2(g2), toLinear2(b2));
};
xyz_default.rec2100pq = (x, y, z) => {
  const [lr, lg, lb] = xyz_default.rec2020Linear(x, y, z);
  return [fromLinear2(lr), fromLinear2(lg), fromLinear2(lb)];
};
var rec2100_pq_default = rec2100pq;

// rec2100-hlg.js
var rec2100hlg = {
  name: "rec2100hlg",
  channel: ["red", "green", "blue"],
  range: [[0, 1], [0, 1], [0, 1]]
};
var a = 0.17883277;
var b = 0.28466892;
var c = 0.55991073;
var scale = 3.7743;
function toLinear3(val) {
  if (val <= 0.5) {
    return Math.pow(val, 2) / 3 * scale;
  }
  return (Math.exp((val - c) / a) + b) / 12 * scale;
}
function fromLinear3(val) {
  val /= scale;
  if (val <= 1 / 12) {
    return Math.sqrt(3 * val);
  }
  return a * Math.log(12 * val - b) + c;
}
rec2100hlg.xyz = (r2, g2, b2) => {
  return rec2020_linear_default.xyz(toLinear3(r2), toLinear3(g2), toLinear3(b2));
};
xyz_default.rec2100hlg = (x, y, z) => {
  const [lr, lg, lb] = xyz_default.rec2020Linear(x, y, z);
  return [fromLinear3(lr), fromLinear3(lg), fromLinear3(lb)];
};
var rec2100_hlg_default = rec2100hlg;

// a98rgb-linear.js
var a98Linear = {
  name: "a98rgb-linear",
  channel: ["red", "green", "blue"],
  range: [[0, 1], [0, 1], [0, 1]]
};
a98Linear.xyz = (r2, g2, b2) => {
  const x = r2 * 0.5766690429101305 + g2 * 0.1855582379065463 + b2 * 0.1882286462349947;
  const y = r2 * 0.29734497525053605 + g2 * 0.6273635662554661 + b2 * 0.07529145849399788;
  const z = r2 * 0.02703136138641234 + g2 * 0.07068885253582723 + b2 * 0.9913375368376388;
  return [x * 100, y * 100, z * 100];
};
xyz_default.a98Linear = (x, y, z) => {
  x /= 100;
  y /= 100;
  z /= 100;
  const r2 = x * 2.0415879038107465 + y * -0.5650069742788596 + z * -0.34473135077832956;
  const g2 = x * -0.9692436362808795 + y * 1.8759675015077202 + z * 0.04155505740717557;
  const b2 = x * 0.013444280632031142 + y * -0.11836239223101838 + z * 1.0151749943912054;
  return [r2, g2, b2];
};
var a98rgb_linear_default = a98Linear;

// a98rgb.js
var a98rgb = {
  name: "a98rgb",
  channel: ["red", "green", "blue"],
  range: [[0, 255], [0, 255], [0, 255]]
};
var gamma = 563 / 256;
var invGamma = 256 / 563;
a98rgb.xyz = (r2, g2, b2) => {
  return a98rgb_linear_default.xyz(
    Math.sign(r2) * Math.pow(Math.abs(r2), gamma),
    Math.sign(g2) * Math.pow(Math.abs(g2), gamma),
    Math.sign(b2) * Math.pow(Math.abs(b2), gamma)
  );
};
xyz_default.a98rgb = (x, y, z) => {
  const [lr, lg, lb] = xyz_default.a98Linear(x, y, z);
  return [
    Math.sign(lr) * Math.pow(Math.abs(lr), invGamma),
    Math.sign(lg) * Math.pow(Math.abs(lg), invGamma),
    Math.sign(lb) * Math.pow(Math.abs(lb), invGamma)
  ];
};
var a98rgb_default = a98rgb;

// prophoto-linear.js
var prophotoLinear = {
  name: "prophoto-linear",
  channel: ["red", "green", "blue"],
  range: [[0, 1], [0, 1], [0, 1]]
};
var M_PP_XYZ50 = [
  0.7977666449006423,
  0.13518129740053308,
  0.0313477341283922,
  0.2880748288194013,
  0.711835234241873,
  8993693872564e-17,
  0,
  0,
  0.8251046025104602
];
var M_XYZ50_PP = [
  1.3457868816471583,
  -0.25557208737979464,
  -0.05110186497554526,
  -0.5446307051249019,
  1.5082477428451468,
  0.02052744743642139,
  0,
  0,
  1.2119675456389452
];
var M_D50_D65 = [
  0.9555766,
  -0.0230393,
  0.0631636,
  -0.0282895,
  1.0099416,
  0.0210077,
  0.0122982,
  -0.020483,
  1.3299098
];
var M_D65_D50 = [
  1.0478112,
  0.0228866,
  -0.050127,
  0.0295424,
  0.9904844,
  -0.0170491,
  -92345e-7,
  0.0150436,
  0.7521316
];
function applyMatrix(m3, x, y, z) {
  return [
    x * m3[0] + y * m3[1] + z * m3[2],
    x * m3[3] + y * m3[4] + z * m3[5],
    x * m3[6] + y * m3[7] + z * m3[8]
  ];
}
prophotoLinear.xyz = (r2, g2, b2) => {
  const [x50, y50, z50] = applyMatrix(M_PP_XYZ50, r2, g2, b2);
  const [x, y, z] = applyMatrix(M_D50_D65, x50, y50, z50);
  return [x * 100, y * 100, z * 100];
};
xyz_default.prophotoLinear = (x, y, z) => {
  x /= 100;
  y /= 100;
  z /= 100;
  const [x50, y50, z50] = applyMatrix(M_D65_D50, x, y, z);
  return applyMatrix(M_XYZ50_PP, x50, y50, z50);
};
var prophoto_linear_default = prophotoLinear;

// prophoto.js
var prophoto = {
  name: "prophoto",
  channel: ["red", "green", "blue"],
  range: [[0, 1], [0, 1], [0, 1]]
};
var Et = 1 / 512;
var Et2 = 16 / 512;
function toLinear4(val) {
  const sign = val < 0 ? -1 : 1;
  const abs = Math.abs(val);
  if (abs < Et2) {
    return val / 16;
  }
  return sign * Math.pow(abs, 1.8);
}
function fromLinear4(val) {
  const sign = val < 0 ? -1 : 1;
  const abs = Math.abs(val);
  if (abs >= Et) {
    return sign * Math.pow(abs, 1 / 1.8);
  }
  return 16 * val;
}
prophoto.xyz = (r2, g2, b2) => {
  return prophoto_linear_default.xyz(toLinear4(r2), toLinear4(g2), toLinear4(b2));
};
xyz_default.prophoto = (x, y, z) => {
  const [lr, lg, lb] = xyz_default.prophotoLinear(x, y, z);
  return [fromLinear4(lr), fromLinear4(lg), fromLinear4(lb)];
};
var prophoto_default = prophoto;

// acescg.js
var acescg = {
  name: "acescg",
  channel: ["red", "green", "blue"],
  range: [[0, 65504], [0, 65504], [0, 65504]]
};
var M_ACESCG_TO_XYZ_ACES = [
  0.6624541811085053,
  0.13400420645643313,
  0.1561876870049078,
  0.27222871678091454,
  0.6740817658111484,
  0.05368951740793705,
  -0.005574649490394108,
  0.004060733528982826,
  1.0103391003129971
];
var M_XYZ_ACES_TO_ACESCG = [
  1.6410233796943257,
  -0.32480329418479,
  -0.23642469523761225,
  -0.6636628587229829,
  1.6153315916573379,
  0.016756347685530137,
  0.011721894328375376,
  -0.008284441996237409,
  0.9883948585390215
];
var M_ADAPT_ACES_TO_D65 = [
  0.9872662260783373,
  -0.006109983795706587,
  0.015908301183191198,
  -0.007571724739733996,
  1.0018466927495386,
  0.00531467636090522,
  0.0030642722309384765,
  -0.005187269825290497,
  1.0814571442867786
];
var M_ADAPT_D65_TO_ACES = [
  1.012991082631989,
  0.006069728174445534,
  -0.014930967980690574,
  0.007670955598086201,
  0.9981681512691919,
  -0.005018288931202118,
  -0.0028342548582215646,
  0.004584233291118761,
  0.9246970826867343
];
function applyMatrix2(m3, x, y, z) {
  return [
    x * m3[0] + y * m3[1] + z * m3[2],
    x * m3[3] + y * m3[4] + z * m3[5],
    x * m3[6] + y * m3[7] + z * m3[8]
  ];
}
acescg.xyz = (r2, g2, b2) => {
  const [x, y, z] = applyMatrix2(M_ACESCG_TO_XYZ_ACES, r2, g2, b2);
  const [x65, y65, z65] = applyMatrix2(M_ADAPT_ACES_TO_D65, x, y, z);
  return [x65 * 100, y65 * 100, z65 * 100];
};
xyz_default.acescg = (x, y, z) => {
  x = x / 100;
  y = y / 100;
  z = z / 100;
  const [xa, ya, za] = applyMatrix2(M_ADAPT_D65_TO_ACES, x, y, z);
  return applyMatrix2(M_XYZ_ACES_TO_ACESCG, xa, ya, za);
};
var acescg_default = acescg;

// acescc.js
var acescc = {
  name: "acescc",
  channel: ["red", "green", "blue"],
  range: [[-0.358, 1.468], [-0.358, 1.468], [-0.358, 1.468]]
};
var eps = Math.pow(2, -16);
var low = (9.72 - 15) / 17.52;
function toLinear5(val) {
  if (val <= low) {
    return (Math.pow(2, val * 17.52 - 9.72) - eps) * 2;
  } else if (val < 1.468) {
    return Math.pow(2, val * 17.52 - 9.72);
  } else {
    return 65504;
  }
}
function fromLinear5(val) {
  if (val <= 0) {
    return (Math.log2(eps) + 9.72) / 17.52;
  } else if (val < eps) {
    return (Math.log2(eps + val * 0.5) + 9.72) / 17.52;
  } else {
    return (Math.log2(val) + 9.72) / 17.52;
  }
}
acescc.xyz = (r2, g2, b2) => {
  return acescg_default.xyz(toLinear5(r2), toLinear5(g2), toLinear5(b2));
};
xyz_default.acescc = (x, y, z) => {
  const [r2, g2, b2] = xyz_default.acescg(x, y, z);
  return [fromLinear5(r2), fromLinear5(g2), fromLinear5(b2)];
};
var acescc_default = acescc;

// ictcp.js
var ictcp = {
  name: "ictcp",
  channel: ["I", "Ct", "Cp"],
  range: [[0, 100], [-50, 50], [-50, 50]]
};
var Yw3 = 203;
var c13 = 3424 / 4096;
var c23 = 2413 / 128;
var c33 = 2392 / 128;
var m1 = 2610 / 16384;
var m22 = 2523 / 32;
var im1 = 16384 / 2610;
var im2 = 32 / 2523;
var M_XYZ_LMS = [
  0.3592832590121217,
  0.6976051147779502,
  -0.035891593232029,
  -0.1920808463704993,
  1.100476797037432,
  0.0753748658519118,
  0.0070797844607479,
  0.0748396662186362,
  0.8433265453898765
];
var M_LMS_XYZ = [
  2.0701522183894223,
  -1.3263473389671563,
  0.2066510476294053,
  0.3647385209748072,
  0.6805660249472273,
  -0.0453045459220347,
  -0.0497472075358123,
  -0.0492609666966131,
  1.1880659249923042
];
var M_LMS_IPT = [
  2048 / 4096,
  2048 / 4096,
  0,
  6610 / 4096,
  -13613 / 4096,
  7003 / 4096,
  17933 / 4096,
  -17390 / 4096,
  -543 / 4096
];
var M_IPT_LMS = [
  1,
  0.0086090370379328,
  0.111029625003026,
  1,
  -0.0086090370379328,
  -0.1110296250030259,
  1,
  0.5600313357106791,
  -0.3206271749873188
];
function applyMatrix3(m3, x, y, z) {
  return [
    x * m3[0] + y * m3[1] + z * m3[2],
    x * m3[3] + y * m3[4] + z * m3[5],
    x * m3[6] + y * m3[7] + z * m3[8]
  ];
}
function LMStoICtCp(l2, m3, s) {
  const lms2 = [l2, m3, s];
  const PQLMS = lms2.map((val) => {
    const v2 = Math.max(val / 1e4, 0);
    const num = c13 + c23 * Math.pow(v2, m1);
    const denom = 1 + c33 * Math.pow(v2, m1);
    return Math.pow(num / denom, m22);
  });
  return applyMatrix3(M_LMS_IPT, PQLMS[0], PQLMS[1], PQLMS[2]);
}
function ICtCptoLMS(i, ct, cp) {
  const PQLMS = applyMatrix3(M_IPT_LMS, i, ct, cp);
  return PQLMS.map((val) => {
    const num = Math.max(Math.pow(val, im2) - c13, 0);
    const denom = c23 - c33 * Math.pow(val, im2);
    return 1e4 * Math.pow(num / denom, im1);
  });
}
xyz_default.ictcp = (x, y, z) => {
  x = x / 100;
  y = y / 100;
  z = z / 100;
  const xa = x * Yw3;
  const ya = y * Yw3;
  const za = z * Yw3;
  const [l2, m3, s] = applyMatrix3(M_XYZ_LMS, xa, ya, za);
  const [i, ct, cp] = LMStoICtCp(l2, m3, s);
  return [i * 100, ct * 100, cp * 100];
};
ictcp.xyz = (i, ct, cp) => {
  i = i / 100;
  ct = ct / 100;
  cp = cp / 100;
  const [l2, m3, s] = ICtCptoLMS(i, ct, cp);
  const [xa, ya, za] = applyMatrix3(M_LMS_XYZ, l2, m3, s);
  return [xa / Yw3 * 100, ya / Yw3 * 100, za / Yw3 * 100];
};
var ictcp_default = ictcp;

// cam16.js
var spow4 = (a2, b2) => Math.sign(a2) * Math.pow(Math.abs(a2), b2);
var copySign = (a2, b2) => Math.sign(b2) * Math.abs(a2);
var zdiv = (a2, b2) => b2 === 0 ? 0 : a2 / b2;
var interpolate = (start, end, p4) => start + (end - start) * p4;
var constrain3 = (h) => {
  let r2 = h % 360;
  if (r2 < 0) r2 += 360;
  return r2;
};
function bisectLeft(arr, x) {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = lo + hi >>> 1;
    if (arr[mid] < x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
function multiply_v3_m3x32(v2, m3) {
  return [
    v2[0] * m3[0][0] + v2[1] * m3[0][1] + v2[2] * m3[0][2],
    v2[0] * m3[1][0] + v2[1] * m3[1][1] + v2[2] * m3[1][2],
    v2[0] * m3[2][0] + v2[1] * m3[2][1] + v2[2] * m3[2][2]
  ];
}
var white2 = [0.95047, 1, 1.08883];
var adaptedCoef = 0.42;
var adaptedCoefInv = 1 / adaptedCoef;
var tau2 = 2 * Math.PI;
var cat16 = [
  [0.401288, 0.650173, -0.051461],
  [-0.250268, 1.204414, 0.045854],
  [-2079e-6, 0.048952, 0.953127]
];
var cat16Inv = [
  [1.8620678550872327, -1.0112546305316843, 0.14918677544445175],
  [0.38752654323613717, 0.6214474419314753, -0.008973985167612518],
  [-0.015841498849333856, -0.03412293802851557, 1.0499644368778496]
];
var m12 = [
  [460, 451, 288],
  [460, -891, -261],
  [460, -220, -6300]
];
var surroundMap = {
  dark: [0.8, 0.525, 0.8],
  dim: [0.9, 0.59, 0.9],
  average: [1, 0.69, 1]
};
var hueQuadMap = {
  h: [20.14, 90, 164.25, 237.53, 380.14],
  e: [0.8, 0.7, 1, 1.2, 0.8],
  H: [0, 100, 200, 300, 400]
};
function adapt(coords, fl) {
  return coords.map((c4) => {
    const x = spow4(fl * Math.abs(c4) * 0.01, adaptedCoef);
    return 400 * copySign(x, c4) / (x + 27.13);
  });
}
function unadapt(adapted, fl) {
  const constant = 100 / fl * Math.pow(27.13, adaptedCoefInv);
  return adapted.map((c4) => {
    const cabs = Math.abs(c4);
    return copySign(constant * spow4(cabs / (400 - cabs), adaptedCoefInv), c4);
  });
}
function hueQuadrature(h) {
  let hp = constrain3(h);
  if (hp <= hueQuadMap.h[0]) {
    hp += 360;
  }
  const i = bisectLeft(hueQuadMap.h, hp) - 1;
  const hi = hueQuadMap.h[i];
  const hii = hueQuadMap.h[i + 1];
  const ei = hueQuadMap.e[i];
  const eii = hueQuadMap.e[i + 1];
  const Hi = hueQuadMap.H[i];
  const t2 = (hp - hi) / ei;
  return Hi + 100 * t2 / (t2 + (hii - hp) / eii);
}
function invHueQuadrature(H2) {
  let Hp = (H2 % 400 + 400) % 400;
  const i = Math.floor(0.01 * Hp);
  Hp = Hp % 100;
  const hi = hueQuadMap.h[i];
  const hii = hueQuadMap.h[i + 1];
  const ei = hueQuadMap.e[i];
  const eii = hueQuadMap.e[i + 1];
  return constrain3((Hp * (eii * hi - ei * hii) - 100 * hi * eii) / (Hp * (eii - ei) - 100 * eii));
}
function environment(refWhite, adaptingLuminance, backgroundLuminance, surround, discounting) {
  const env = {};
  env.discounting = discounting;
  env.refWhite = refWhite;
  env.surround = surround;
  const xyzW = refWhite.map((c4) => c4 * 100);
  env.la = adaptingLuminance;
  env.yb = backgroundLuminance;
  const yw = xyzW[1];
  const rgbW = multiply_v3_m3x32(xyzW, cat16);
  const values = surroundMap[surround];
  const f2 = values[0];
  env.c = values[1];
  env.nc = values[2];
  const k2 = 1 / (5 * env.la + 1);
  const k4 = Math.pow(k2, 4);
  env.fl = k4 * env.la + 0.1 * (1 - k4) * (1 - k4) * Math.cbrt(5 * env.la);
  env.flRoot = Math.pow(env.fl, 0.25);
  env.n = env.yb / yw;
  env.z = 1.48 + Math.sqrt(env.n);
  env.nbb = 0.725 * Math.pow(env.n, -0.2);
  env.ncb = env.nbb;
  const d2 = discounting ? 1 : Math.max(Math.min(f2 * (1 - 1 / 3.6 * Math.exp((-env.la - 42) / 92)), 1), 0);
  env.dRgb = rgbW.map((c4) => interpolate(1, yw / c4, d2));
  env.dRgbInv = env.dRgb.map((c4) => 1 / c4);
  const rgbCW = rgbW.map((c4, i) => c4 * env.dRgb[i]);
  const rgbAW = adapt(rgbCW, env.fl);
  env.aW = env.nbb * (2 * rgbAW[0] + rgbAW[1] + 0.05 * rgbAW[2]);
  return env;
}
var viewingConditions = environment(white2, 64 / Math.PI * 0.2, 20, "average", false);
function fromCam16(cam162, env) {
  let hRad = 0;
  if (cam162.h !== void 0) hRad = constrain3(cam162.h) * (Math.PI / 180);
  else hRad = invHueQuadrature(cam162.H) * (Math.PI / 180);
  const cosh = Math.cos(hRad);
  const sinh = Math.sin(hRad);
  let Jroot = 0;
  if (cam162.J !== void 0) Jroot = spow4(cam162.J, 1 / 2) * 0.1;
  let alpha2 = 0;
  if (cam162.C !== void 0) alpha2 = cam162.C / Jroot;
  else if (cam162.M !== void 0) alpha2 = cam162.M / env.flRoot / Jroot;
  const t2 = spow4(alpha2 * Math.pow(1.64 - Math.pow(0.29, env.n), -0.73), 10 / 9);
  const et = 0.25 * (Math.cos(hRad + 2) + 3.8);
  const A2 = env.aW * spow4(Jroot, 2 / env.c / env.z);
  const p1 = 5e4 / 13 * env.nc * env.ncb * et;
  const p22 = A2 / env.nbb;
  const r2 = 23 * (p22 + 0.305) * zdiv(t2, 23 * p1 + t2 * (11 * cosh + 108 * sinh));
  const a2 = r2 * cosh;
  const b2 = r2 * sinh;
  const rgb_c = unadapt(
    multiply_v3_m3x32([p22, a2, b2], m12).map((c4) => c4 / 1403),
    env.fl
  );
  return multiply_v3_m3x32(
    rgb_c.map((c4, i) => c4 * env.dRgbInv[i]),
    cat16Inv
  );
}
function toCam16(xyzd65, env) {
  const xyz100 = xyzd65;
  const rgbA = adapt(
    multiply_v3_m3x32(xyz100, cat16).map((c4, i) => c4 * env.dRgb[i]),
    env.fl
  );
  const a2 = rgbA[0] + (-12 * rgbA[1] + rgbA[2]) / 11;
  const b2 = (rgbA[0] + rgbA[1] - 2 * rgbA[2]) / 9;
  const hRad = (Math.atan2(b2, a2) % tau2 + tau2) % tau2;
  const et = 0.25 * (Math.cos(hRad + 2) + 3.8);
  const t2 = 5e4 / 13 * env.nc * env.ncb * zdiv(et * Math.sqrt(a2 * a2 + b2 * b2), rgbA[0] + rgbA[1] + 1.05 * rgbA[2] + 0.305);
  const alpha2 = spow4(t2, 0.9) * Math.pow(1.64 - Math.pow(0.29, env.n), 0.73);
  const A2 = env.nbb * (2 * rgbA[0] + rgbA[1] + 0.05 * rgbA[2]);
  const Jroot = spow4(A2 / env.aW, 0.5 * env.c * env.z);
  const J2 = 100 * spow4(Jroot, 2);
  const Q2 = 4 / env.c * Jroot * (env.aW + 4) * env.flRoot;
  const C2 = alpha2 * Jroot;
  const M = C2 * env.flRoot;
  const h = constrain3(hRad * (180 / Math.PI));
  const H2 = hueQuadrature(h);
  const s = 50 * spow4(env.c * alpha2 / (env.aW + 4), 1 / 2);
  return { J: J2, C: C2, h, s, Q: Q2, M, H: H2 };
}
var cam16 = {
  name: "cam16",
  channel: ["J", "M", "h"],
  range: [[0, 100], [0, 100], [0, 360]]
};
xyz_default.cam16 = (x, y, z) => {
  const res = toCam16([x, y, z], viewingConditions);
  return [res.J, res.M, res.h];
};
cam16.xyz = (J2, M, h) => {
  return fromCam16({ J: J2, M, h }, viewingConditions);
};
var cam16_default = cam16;

// hct.js
var constrainLocal = (h) => {
  let r2 = h % 360;
  if (r2 < 0) r2 += 360;
  return r2;
};
var eps2 = 216 / 24389;
var kappa = 24389 / 27;
function toLstar(y) {
  y = y / 100;
  const fy = y > eps2 ? Math.cbrt(y) : (kappa * y + 16) / 116;
  return 116 * fy - 16;
}
function fromLstar(l2) {
  const y01 = l2 > 8 ? Math.pow((l2 + 16) / 116, 3) : l2 / kappa;
  return y01 * 100;
}
var hct = {
  name: "hct",
  channel: ["h", "c", "t"],
  range: [[0, 360], [0, 150], [0, 100]]
};
xyz_default.hct = (x, y, z) => {
  const t2 = toLstar(y);
  if (t2 === 0) return [0, 0, 0];
  const cam = toCam16([x, y, z], viewingConditions);
  return [constrainLocal(cam.h), cam.C, t2];
};
hct.xyz = (h, c4, t2) => {
  if (t2 === 0) return [0, 0, 0];
  const y = fromLstar(t2);
  let j;
  if (t2 > 0) {
    j = 0.00379058511492914 * t2 * t2 + 0.608983189401032 * t2 + 0.9155088574762233;
  } else {
    j = 9514440756550361e-21 * t2 * t2 + 0.08693057439788597 * t2 - 21.928975842194614;
  }
  let xyzRes;
  let attempt = 0;
  let last = Infinity;
  let best = j;
  const threshold = 2e-12;
  const max_attempts = 15;
  while (attempt <= max_attempts) {
    xyzRes = fromCam16({ J: j, C: c4, h }, viewingConditions);
    const delta = Math.abs(xyzRes[1] - y);
    if (delta < last) {
      if (delta <= threshold) {
        return xyzRes;
      }
      best = j;
      last = delta;
    }
    if (xyzRes[1] === 0) break;
    j = j - (xyzRes[1] - y) * j / (2 * xyzRes[1]);
    attempt++;
  }
  return fromCam16({ J: best, C: c4, h }, viewingConditions);
};
var hct_default = hct;

// xyz-d50.js
var xyzD50 = {
  name: "xyz-d50",
  channel: ["x", "y", "z"],
  range: [[0, 100], [0, 100], [0, 100]]
};
var M_D50_D652 = [
  0.9555766,
  -0.0230393,
  0.0631636,
  -0.0282895,
  1.0099416,
  0.0210077,
  0.0122982,
  -0.020483,
  1.3299098
];
var M_D65_D502 = [
  1.0478112,
  0.0228866,
  -0.050127,
  0.0295424,
  0.9904844,
  -0.0170491,
  -92345e-7,
  0.0150436,
  0.7521316
];
function applyMatrix4(m3, x, y, z) {
  return [
    x * m3[0] + y * m3[1] + z * m3[2],
    x * m3[3] + y * m3[4] + z * m3[5],
    x * m3[6] + y * m3[7] + z * m3[8]
  ];
}
xyzD50.xyz = (x, y, z) => {
  return applyMatrix4(M_D50_D652, x, y, z);
};
xyz_default.xyzD50 = (x, y, z) => {
  return applyMatrix4(M_D65_D502, x, y, z);
};
var xyz_d50_default = xyzD50;

// xyz-abs-d65.js
var xyzAbsD65 = {
  name: "xyz-abs-d65",
  channel: ["x", "y", "z"],
  range: [[0, 1e4], [0, 1e4], [0, 1e4]]
};
var Yw4 = 203;
xyzAbsD65.xyz = (x, y, z) => {
  return [x / Yw4 * 100, y / Yw4 * 100, z / Yw4 * 100];
};
xyz_default.xyzAbsD65 = (x, y, z) => {
  return [x / 100 * Yw4, y / 100 * Yw4, z / 100 * Yw4];
};
var xyz_abs_d65_default = xyzAbsD65;

// lab-d50.js
var labD50 = {
  name: "lab-d50",
  channel: ["l", "a", "b"],
  range: [[0, 100], [-125, 125], [-125, 125]]
};
var whiteD50 = [0.96422, 1, 0.82521];
var kappa2 = 24389 / 27;
var epsilon = 216 / 24389;
var epsilon3 = 24 / 116;
var M_D50_D653 = [
  0.9555766,
  -0.0230393,
  0.0631636,
  -0.0282895,
  1.0099416,
  0.0210077,
  0.0122982,
  -0.020483,
  1.3299098
];
var M_D65_D503 = [
  1.0478112,
  0.0228866,
  -0.050127,
  0.0295424,
  0.9904844,
  -0.0170491,
  -92345e-7,
  0.0150436,
  0.7521316
];
function applyMatrix5(m3, x, y, z) {
  return [
    x * m3[0] + y * m3[1] + z * m3[2],
    x * m3[3] + y * m3[4] + z * m3[5],
    x * m3[6] + y * m3[7] + z * m3[8]
  ];
}
labD50.xyz = (l2, a2, b2) => {
  const fy = (l2 + 16) / 116;
  const fx = a2 / 500 + fy;
  const fz = fy - b2 / 200;
  const xr = fx > epsilon3 ? Math.pow(fx, 3) : (116 * fx - 16) / kappa2;
  const yr = l2 > 8 ? Math.pow(fy, 3) : l2 / kappa2;
  const zr = fz > epsilon3 ? Math.pow(fz, 3) : (116 * fz - 16) / kappa2;
  const x50 = xr * whiteD50[0];
  const y50 = yr * whiteD50[1];
  const z50 = zr * whiteD50[2];
  return applyMatrix5(M_D50_D653, x50, y50, z50);
};
xyz_default.labD50 = (x, y, z) => {
  const [x50, y50, z50] = applyMatrix5(M_D65_D503, x, y, z);
  const xr = x50 / whiteD50[0];
  const yr = y50 / whiteD50[1];
  const zr = z50 / whiteD50[2];
  const fx = xr > epsilon ? Math.cbrt(xr) : (kappa2 * xr + 16) / 116;
  const fy = yr > epsilon ? Math.cbrt(yr) : (kappa2 * yr + 16) / 116;
  const fz = zr > epsilon ? Math.cbrt(zr) : (kappa2 * zr + 16) / 116;
  const l2 = 116 * fy - 16;
  const a2 = 500 * (fx - fy);
  const b2 = 200 * (fy - fz);
  return [l2, a2, b2];
};
var lab_d50_default = labD50;

// gray.js
var gray = {
  name: "gray",
  channel: ["gray"],
  range: [[0, 1]]
};
gray.rgb = (g2) => [g2 * 255, g2 * 255, g2 * 255];
rgb_default.gray = (r2, g2, b2) => [(0.2126 * r2 + 0.7152 * g2 + 0.0722 * b2) / 255];
var gray_default = gray;

// rg.js
var rg = {
  name: "rg",
  channel: ["r", "g"],
  range: [[0, 1], [0, 1]]
};
rg.rgb = (r2, g2) => {
  const b2 = 1 - r2 - g2;
  const max = Math.max(r2, g2, b2);
  if (max === 0) return [0, 0, 0];
  return [r2 / max * 255, g2 / max * 255, b2 / max * 255];
};
rgb_default.rg = (r2, g2, b2) => {
  r2 = r2 / 255;
  g2 = g2 / 255;
  b2 = b2 / 255;
  const sum = r2 + g2 + b2;
  if (sum === 0) return [0, 0];
  return [r2 / sum, g2 / sum];
};
var rg_default = rg;

// hcl.js
var HCLgamma = 3;
var HCLy0 = 100;
var HCLmaxL = 0.530454533953517;
var PI = Math.PI;
var hcl = {
  name: "hcl",
  channel: ["hue", "chroma", "luminance"],
  range: [[0, 360], [0, 150], [0, 100]]
};
hcl.rgb = (h, c4, l2) => {
  h = h / 360;
  c4 = c4 / 100;
  l2 = l2 / 100;
  if (l2 === 0) return [0, 0, 0];
  const L = l2 * HCLmaxL;
  const Q2 = Math.exp((1 - c4 / (2 * L)) * (HCLgamma / HCLy0));
  const U = (2 * L - c4) / (2 * Q2 - 1);
  const V = c4 / Q2;
  const A2 = (h + Math.min(2 * h % 1 / 4, -2 * h % 1 / 8)) * PI * 2;
  let rgb2 = [0, 0, 0];
  let T2;
  const H2 = h * 6;
  if (H2 <= 0.999) {
    T2 = Math.tan(A2);
    rgb2[0] = 1;
    rgb2[1] = T2 / (1 + T2);
  } else if (H2 <= 1.001) {
    rgb2[0] = 1;
    rgb2[1] = 1;
  } else if (H2 <= 2) {
    T2 = Math.tan(A2);
    rgb2[0] = (1 + T2) / T2;
    rgb2[1] = 1;
  } else if (H2 <= 3) {
    T2 = Math.tan(A2);
    rgb2[1] = 1;
    rgb2[2] = 1 + T2;
  } else if (H2 <= 3.999) {
    T2 = Math.tan(A2);
    rgb2[1] = 1 / (1 + T2);
    rgb2[2] = 1;
  } else if (H2 <= 4.001) {
    rgb2[1] = 0;
    rgb2[2] = 1;
  } else if (H2 <= 5) {
    T2 = Math.tan(A2);
    rgb2[0] = -1 / T2;
    rgb2[2] = 1;
  } else {
    T2 = Math.tan(A2);
    rgb2[0] = 1;
    rgb2[2] = -T2;
  }
  return [
    (rgb2[0] * V + U) * 255,
    (rgb2[1] * V + U) * 255,
    (rgb2[2] * V + U) * 255
  ];
};
rgb_default.hcl = (r2, g2, b2) => {
  r2 = r2 / 255;
  g2 = g2 / 255;
  b2 = b2 / 255;
  let H2 = 0;
  const U = Math.min(r2, g2, b2);
  const V = Math.max(r2, g2, b2);
  let Q2 = HCLgamma / HCLy0;
  const C2 = V - U;
  if (C2 !== 0) {
    H2 = Math.atan2(g2 - b2, r2 - g2) / PI;
    Q2 *= U / V;
  }
  Q2 = Math.exp(Q2);
  const frac = (x) => x - Math.floor(x);
  H2 = frac(H2 / 2 - Math.min(frac(H2), frac(-H2)) / 6);
  const C_adjusted = C2 * Q2;
  const L = ((V - U) * Q2 + U) / (HCLmaxL * 2);
  return [H2 * 360, C_adjusted * 100, L * 100];
};
var hcl_default = hcl;

// din99o-lab.js
var kE = 1;
var kCH = 1;
var \u03B8 = 26 / 180 * Math.PI;
var cos\u03B8 = Math.cos(\u03B8);
var sin\u03B8 = Math.sin(\u03B8);
var factor = 100 / Math.log(139 / 100);
var din99oLab = {
  name: "din99o-lab",
  min: [0, -40.09, -40.469],
  max: [100, 45.501, 44.344],
  channel: ["l", "a", "b"],
  alias: ["din99o"],
  // Range documentation (not used in conventional v3)
  range: [[0, 100], [-40.09, 45.501], [-40.469, 44.344]],
  xyz: function(l2, a2, b2) {
    return lab_default.xyz(...this.lab(l2, a2, b2));
  },
  rgb: function(l2, a2, b2) {
    return lab_default.rgb(...this.lab(l2, a2, b2));
  },
  // Convert DIN99o Lab to CIELab D65
  lab: function(l2, a2, b2) {
    l2 = l2 !== void 0 ? l2 : 0;
    a2 = a2 !== void 0 ? a2 : 0;
    b2 = b2 !== void 0 ? b2 : 0;
    const labL = (Math.exp(l2 * kE / factor) - 1) / 39e-4;
    const c4 = Math.sqrt(a2 * a2 + b2 * b2);
    if (c4 === 0) {
      return [labL, 0, 0];
    }
    const h = Math.atan2(b2, a2);
    const G2 = (Math.exp(0.0435 * c4 * kCH * kE) - 1) / 0.075;
    const e = G2 * Math.cos(h - \u03B8);
    const f2 = G2 * Math.sin(h - \u03B8);
    const labA = e * cos\u03B8 - f2 / 0.83 * sin\u03B8;
    const labB = e * sin\u03B8 + f2 / 0.83 * cos\u03B8;
    return [labL, labA, labB];
  }
};
din99oLab.lab.lab = (l2, a2, b2) => [l2, a2, b2];
rgb_default.din99oLab = function(r2, g2, b2) {
  const [labL, labA, labB] = this.lab(r2, g2, b2);
  return lab_default.din99oLab(labL, labA, labB);
};
lab_default.din99oLab = function(l2, a2, b2) {
  l2 = l2 !== void 0 ? l2 : 0;
  a2 = a2 !== void 0 ? a2 : 0;
  b2 = b2 !== void 0 ? b2 : 0;
  const e = a2 * cos\u03B8 + b2 * sin\u03B8;
  const f2 = 0.83 * (b2 * cos\u03B8 - a2 * sin\u03B8);
  const G2 = Math.sqrt(e * e + f2 * f2);
  const dinL = factor / kE * Math.log(1 + 39e-4 * l2);
  const dinC = Math.log(1 + 0.075 * G2) / (0.0435 * kCH * kE);
  if (dinC === 0) {
    return [dinL, 0, 0];
  }
  const h = Math.atan2(f2, e) + \u03B8;
  const dinA = dinC * Math.cos(h);
  const dinB = dinC * Math.sin(h);
  return [dinL, dinA, dinB];
};
var din99o_lab_default = din99oLab;

// din99o-lch.js
var din99oLch = {
  name: "din99o-lch",
  min: [0, 0, 0],
  max: [100, 51.484, 360],
  channel: ["l", "c", "h"],
  alias: ["din99o-polar"],
  // Range documentation (not used in conventional v3)
  range: [[0, 100], [0, 51.484], [0, 360]],
  xyz: function(l2, c4, h) {
    return din99o_lab_default.xyz(...this.din99oLab(l2, c4, h));
  },
  rgb: function(l2, c4, h) {
    return din99o_lab_default.rgb(...this.din99oLab(l2, c4, h));
  },
  lab: function(l2, c4, h) {
    return din99o_lab_default.lab(...this.din99oLab(l2, c4, h));
  },
  // Convert DIN99o LCh to DIN99o Lab
  din99oLab: function(l2, c4, h) {
    l2 = l2 !== void 0 ? l2 : 0;
    c4 = c4 !== void 0 ? c4 : 0;
    h = h !== void 0 ? h : 0;
    const hRad = h / 180 * Math.PI;
    const a2 = c4 * Math.cos(hRad);
    const b2 = c4 * Math.sin(hRad);
    return [l2, a2, b2];
  }
};
din99oLch.din99oLab.din99oLab = (l2, c4, h) => [l2, c4, h];
rgb_default.din99oLch = function(r2, g2, b2) {
  return din99o_lab_default.din99oLch(...this.din99oLab(r2, g2, b2));
};
lab_default.din99oLch = function(l2, a2, b2) {
  return din99o_lab_default.din99oLch(...this.din99oLab(l2, a2, b2));
};
din99o_lab_default.din99oLch = function(l2, a2, b2) {
  l2 = l2 !== void 0 ? l2 : 0;
  a2 = a2 !== void 0 ? a2 : 0;
  b2 = b2 !== void 0 ? b2 : 0;
  const c4 = Math.sqrt(a2 * a2 + b2 * b2);
  const h = Math.atan2(b2, a2) * (180 / Math.PI);
  return [l2, c4, h >= 0 ? h : h + 360];
};
var din99o_lch_default = din99oLch;

// xyb.js
var bias = 0.0037930732552754493;
var bias_cbrt = Math.cbrt(bias);
var xyb = {
  name: "xyb",
  min: [-0.0154, 0, -0.2778],
  max: [0.0281, 0.8453, 0.388],
  channel: ["x", "y", "b"],
  // Range documentation (not used in conventional v3)
  range: [[-0.0154, 0.0281], [0, 0.8453], [-0.2778, 0.388]],
  xyz: function(x, y, b2) {
    return rgb_default.xyz(...this.rgb(x, y, b2));
  },
  rgb: function(x, y, b2) {
    x = x !== void 0 ? x : 0;
    y = y !== void 0 ? y : 0;
    b2 = b2 !== void 0 ? b2 : 0;
    const transfer = (v2) => Math.pow(v2 + bias_cbrt, 3);
    const l2 = transfer(x + y) - bias;
    const m3 = transfer(y - x) - bias;
    const s = transfer(b2 + y) - bias;
    const lrgbR = 11.031566904639861 * l2 - 9.866943908131562 * m3 - 0.16462299650829934 * s;
    const lrgbG = -3.2541473810744237 * l2 + 4.418770377582723 * m3 - 0.16462299650829934 * s;
    const lrgbB = -3.6588512867136815 * l2 + 2.7129230459360922 * m3 + 1.9459282407775895 * s;
    return lrgb_default.rgb(lrgbR, lrgbG, lrgbB);
  }
};
rgb_default.xyb = function(r2, g2, b2) {
  const [lrgbR, lrgbG, lrgbB] = this.lrgb(r2, g2, b2);
  const transfer = (v2) => Math.cbrt(v2) - bias_cbrt;
  const l2 = transfer(0.3 * lrgbR + 0.622 * lrgbG + 0.078 * lrgbB + bias);
  const m3 = transfer(0.23 * lrgbR + 0.692 * lrgbG + 0.078 * lrgbB + bias);
  const s = transfer(
    0.2434226892454782 * lrgbR + 0.2047674442449682 * lrgbG + 0.5518098665095535 * lrgbB + bias
  );
  const xybX = (l2 - m3) / 2;
  const xybY = (l2 + m3) / 2;
  const xybB = s - xybY;
  return [xybX, xybY, xybB];
};
var xyb_default = xyb;

// index.js
var space = {};
var index_default = space;
function register(newSpace) {
  const newSpaceName = newSpace.name;
  for (const existingSpaceName in space) {
    if (!newSpace[existingSpaceName]) newSpace[existingSpaceName] = createConverter(newSpace, existingSpaceName);
    const existingSpace = space[existingSpaceName];
    if (!existingSpace[newSpaceName]) existingSpace[newSpaceName] = createConverter(existingSpace, newSpaceName);
  }
  space[newSpaceName] = newSpace;
}
function createConverter(fromSpace, toSpaceName) {
  if (fromSpace.xyz && space.xyz[toSpaceName])
    return (...args) => space.xyz[toSpaceName](...fromSpace.xyz(...args));
  if (fromSpace.rgb && space.rgb[toSpaceName])
    return (...args) => space.rgb[toSpaceName](...fromSpace.rgb(...args));
}
[rgb_default, xyz_default, hsl_default, hsv_default, hsi_default, hwb_default, cmyk_default, cmy_default, xyy_default, yiq_default, yuv_default, ydbdr_default, ycgco_default, ypbpr_default, ycbcr_default, xvycc_default, yccbccrc_default, ucs_default, uvw_default, jpeg_default, lab_default, labh_default, lms_default, lchab_default, luv_default, lchuv_default, hsluv_default, hpluv_default, cubehelix_default, coloroid_default, hcg_default, hcy_default, tsl_default, yes_default, osaucs_default, hsp_default, hsm_default, lrgb_default, oklab_default, oklch_default, okhsl_default, okhsv_default, oklrab_default, oklrch_default, jzazbz_default, jzczhz_default, p3_default, p3_linear_default, rec2020_default, rec2020_linear_default, rec2020_oetf_default, rec2100_pq_default, rec2100_hlg_default, a98rgb_default, a98rgb_linear_default, prophoto_default, prophoto_linear_default, acescg_default, acescc_default, ictcp_default, cam16_default, hct_default, xyz_d50_default, xyz_abs_d65_default, lab_d50_default, gray_default, rg_default, hcl_default, din99o_lab_default, din99o_lch_default, xyb_default].map(register);
export {
  index_default as default,
  register
};
