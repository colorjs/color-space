var rgb = {
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
  },

  lch: function(args) {
    return lab.lch(rgb.lab(args));
  },

  luv: function(){

  },

  lchuv: function(args){
    return luv.lchuv(rgb.luv(args));
  },

  min: [0,0,0],
  max: [255,255,255],
  channel: ['red', 'green', 'blue']
};


var hsl = {
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

  min: [0,0,0],
  max: [360,100,100],
  channel: ['hue', 'saturation', 'lightness']
};


var hsv = {
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

  min: [0,0,0],
  max: [360,100,100],
  channel: ['hue', 'saturation', 'value'],
  alias: ['hsb']
};


var hwb = {
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

  min: [0,0,0],
  max: [360,100,100],
  channel: ['hue', 'whiteness', 'blackness']
};


var cmyk = {
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

  min: [0,0,0,0],
  max: [100,100,100,100],
  channel: ['cyan', 'magenta', 'yellow', 'black']
};


var xyz = {
  rgb: function(xyz) {
    var x = xyz[0] / 100,
        y = xyz[1] / 100,
        z = xyz[2] / 100,
        r, g, b;

    r = (x * 3.2406) + (y * -1.5372) + (z * -0.4986);
    g = (x * -0.9689) + (y * 1.8758) + (z * 0.0415);
    b = (x * 0.0557) + (y * -0.2040) + (z * 1.0570);

    // assume sRGB
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

  lch: function(args) {
    return lab.lch(xyz.lab(args));
  },

  luv: function(xyz, i) {
    var _u, _v, l, u, v, x, y, z, yn, un, vn;

    //get illuminant
    i = i || 'D65';

    x = xyz[0], y = xyz[1], z = xyz[2];
    yn = luv.illuminant[i][0], un = luv.illuminant[i][1], vn = luv.illuminant[i][2];
    console.log()
    _u = (4 * x) / (x + (15 * y) + (3 * z));
    _v = (9 * y) / (x + (15 * y) + (3 * z));

    var yyn = y/yn;

    yyn_ratio = 0.008856451679035631; //(6/29)^3

    l = yyn <= yyn_ratio ?
        903.2962962962961 * yyn : //(29/3)^3
        116 * Math.pow(yyn, .333333333) - 16;

    u = 13 * l * (_u - un);
    v = 13 * l * (_v - vn);

    return [l, u, v];
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
  },

  min: [0,0,0],
  max: [100,100,100],
  channel: ['x','y','z'],
  alias: ['ciexyz'],

  //Xn, Yn, Zn
  illuminant: {
    A:[109.85, 100, 35.58],
    C: [98.07, 100, 118.23],
    D65: [95.04, 100, 108.88]
  }
};


var lab = {
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

  rgb: function(args) {
    return xyz.rgb(lab.xyz(args));
  },

  min: [0,-100,-100],
  max: [100,100,100],
  channel: ['lightness', 'a', 'b'],
  alias: ['cielab']
};

//cylindrical lab
var lch = {
  lab: function(lch) {
    var l = lch[0],
        c = lch[1],
        h = lch[2],
        a, b, hr;

    hr = h / 360 * 2 * Math.PI;
    a = c * Math.cos(hr);
    b = c * Math.sin(hr);
    return [l, a, b];
  },

  xyz: function(args) {
    return lab.xyz(lch.lab(args));
  },

  rgb: function(args) {
    return lab.rgb(lch.lab(args));
  },

  min: [0,0,0],
  max: [100,100,360],
  channel: ['lightness', 'chroma', 'hue'],
  alias: ['cielch']
};



//TODO
var luv = {
  xyz: function(luv){

  },

  lchuv: function(luv){
    var C = Math.sqrt();
  },

  min: [0,-100,-100],
  max: [100,100,100],
  channel: ['lightness', 'u', 'v'],
  alias: ['cieluv'],


  //Yn, un,vn: http://www.optique-ingenieur.org/en/courses/OPI_ang_M07_C02/co/Contenu_08.html
  illuminant: {
    A:[100, 255.97, 524.29],
    C: [100, 200.89, 460.89],
    D65: [100, 197.83, 468.34]
  }
};


//TODO
//cylindrical luv
var lchuv = {
  luv: function(){

  },
  alias: ['cielchuv']
};



//TODO
var xyy = {
  alias: ['ciexyy']
};




//CIECAM02 http://en.wikipedia.org/wiki/CIECAM02
var cam = {

  alias: ['ciecam']
};


//@link http://www.boronine.com/husl/
//TODO
var husl = {

};


//TODO
var huslp = {

};



/**
 * @module color-space
 */
module.exports = {
  rgb: rgb,
  hsl: hsl,
  hsv: hsv,
  hwb: hwb,
  cmyk: cmyk,
  xyz: xyz,
  lab: lab,
  lch: lch
};