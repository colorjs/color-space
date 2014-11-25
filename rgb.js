var rgb = module.exports = {
  name: 'rgb',
  min: [0,0,0],
  max: [255,255,255],
  channel: ['red', 'green', 'blue'],

  hsl: function(rgb) {
    var r = rgb[0]/255,
        g = rgb[1]/255,
        b = rgb[2]/255,
        min = Math.min(r, g, b),
        max = Math.max(r, g, b),
        delta = max - min,
        h, s, l;

    if (max == min)
      h = 0;
    else if (r == max)
      h = (g - b) / delta;
    else if (g == max)
      h = 2 + (b - r) / delta;
    else if (b == max)
      h = 4 + (r - g)/ delta;

    h = Math.min(h * 60, 360);

    if (h < 0)
      h += 360;

    l = (min + max) / 2;

    if (max == min)
      s = 0;
    else if (l <= 0.5)
      s = delta / (max + min);
    else
      s = delta / (2 - max - min);

    return [h, s * 100, l * 100];
  },

  hsv: function(rgb) {
    var r = rgb[0],
        g = rgb[1],
        b = rgb[2],
        min = Math.min(r, g, b),
        max = Math.max(r, g, b),
        delta = max - min,
        h, s, v;

    if (max == 0)
      s = 0;
    else
      s = (delta/max * 1000)/10;

    if (max == min)
      h = 0;
    else if (r == max)
      h = (g - b) / delta;
    else if (g == max)
      h = 2 + (b - r) / delta;
    else if (b == max)
      h = 4 + (r - g) / delta;

    h = Math.min(h * 60, 360);

    if (h < 0)
      h += 360;

    v = ((max / 255) * 1000) / 10;

    return [h, s, v];
  },

  hwb: function(val) {
    var r = val[0],
        g = val[1],
        b = val[2],
        h = rgb.hsl(val)[0],
        w = 1/255 * Math.min(r, Math.min(g, b)),
        b = 1 - 1/255 * Math.max(r, Math.max(g, b));

    return [h, w * 100, b * 100];
  },

  cmyk: function(rgb) {
    var r = rgb[0] / 255,
        g = rgb[1] / 255,
        b = rgb[2] / 255,
        c, m, y, k;

    k = Math.min(1 - r, 1 - g, 1 - b);
    c = (1 - r - k) / (1 - k) || 0;
    m = (1 - g - k) / (1 - k) || 0;
    y = (1 - b - k) / (1 - k) || 0;
    return [c * 100, m * 100, y * 100, k * 100];
  },

  xyz: function(rgb) {
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
  },

  lab: function(args) {
    var xyz = rgb.xyz(args),
          x = xyz[0],
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
  }
};