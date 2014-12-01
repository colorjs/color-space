!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.colorSpace=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @module color-space/cmyk
 */

var rgb = require('./rgb');

module.exports = {
	name: 'cmyk',
	min: [0,0,0,0],
	max: [100,100,100,100],
	channel: ['cyan', 'magenta', 'yellow', 'black'],

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
	}
};


//extend rgb
rgb.cmyk = function(rgb) {
	var r = rgb[0] / 255,
			g = rgb[1] / 255,
			b = rgb[2] / 255,
			c, m, y, k;

	k = Math.min(1 - r, 1 - g, 1 - b);
	c = (1 - r - k) / (1 - k) || 0;
	m = (1 - g - k) / (1 - k) || 0;
	y = (1 - b - k) / (1 - k) || 0;
	return [c * 100, m * 100, y * 100, k * 100];
};
},{"./rgb":13}],2:[function(require,module,exports){
/**
 * @module color-space/hsl
 */

var rgb = require('./rgb');

module.exports = {
	name: 'hsl',
	min: [0,0,0],
	max: [360,100,100],
	channel: ['hue', 'saturation', 'lightness'],

	rgb: function(hsl) {
		var h = hsl[0] / 360,
				s = hsl[1] / 100,
				l = hsl[2] / 100,
				t1, t2, t3, rgb, val;

		if (s === 0) {
			val = l * 255;
			return [val, val, val];
		}

		if (l < 0.5) {
			t2 = l * (1 + s);
		}
		else {
			t2 = l + s - l * s;
		}
		t1 = 2 * l - t2;

		rgb = [0, 0, 0];
		for (var i = 0; i < 3; i++) {
			t3 = h + 1 / 3 * - (i - 1);
			if (t3 < 0) t3++;
			else if (t3 > 1) t3--;

			if (6 * t3 < 1) {
				val = t1 + (t2 - t1) * 6 * t3;
			}
			else if (2 * t3 < 1) {
				val = t2;
			}
			else if (3 * t3 < 2) {
				val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
			}
			else {
				val = t1;
			}

			rgb[i] = val * 255;
		}

		return rgb;
	}
};


//extend rgb
rgb.hsl = function(rgb) {
	var r = rgb[0]/255,
			g = rgb[1]/255,
			b = rgb[2]/255,
			min = Math.min(r, g, b),
			max = Math.max(r, g, b),
			delta = max - min,
			h, s, l;

	if (max === min) {
		h = 0;
	}
	else if (r === max) {
		h = (g - b) / delta;
	}
	else if (g === max) {
		h = 2 + (b - r) / delta;
	}
	else if (b === max) {
		h = 4 + (r - g)/ delta;
	}

	h = Math.min(h * 60, 360);

	if (h < 0)
		h += 360;

	l = (min + max) / 2;

	if (max === min) {
		s = 0;
	}
	else if (l <= 0.5) {
		s = delta / (max + min);
	}
	else {
		s = delta / (2 - max - min);
	}

	return [h, s * 100, l * 100];
};
},{"./rgb":13}],3:[function(require,module,exports){
/**
 * @module color-space/hsv
 */

var rgb = require('./rgb');
var hsl = require('./hsl');

module.exports = {
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
				t = 255 * v * (1 - (s * (1 - f)));
		v *= 255;

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
	}
};


//append rgb
rgb.hsv = function(rgb) {
	var r = rgb[0],
			g = rgb[1],
			b = rgb[2],
			min = Math.min(r, g, b),
			max = Math.max(r, g, b),
			delta = max - min,
			h, s, v;

	if (max === 0) {
		s = 0;
	}
	else {
		s = (delta/max * 1000)/10;
	}

	if (max === min) {
		h = 0;
	}
	else if (r === max) {
		h = (g - b) / delta;
	}
	else if (g === max) {
		h = 2 + (b - r) / delta;
	}
	else if (b === max) {
		h = 4 + (r - g) / delta;
	}

	h = Math.min(h * 60, 360);

	if (h < 0) {
		h += 360;
	}

	v = ((max / 255) * 1000) / 10;

	return [h, s, v];
};



//extend hsl
hsl.hsv = function(hsl) {
	var h = hsl[0],
			s = hsl[1] / 100,
			l = hsl[2] / 100,
			sv, v;
	l *= 2;
	s *= (l <= 1) ? l : 2 - l;
	v = (l + s) / 2;
	sv = (2 * s) / (l + s) || 0;

	return [h, sv * 100, v * 100];
};
},{"./hsl":2,"./rgb":13}],4:[function(require,module,exports){
/**
 * A uniform wrapper for husl.
 * // http://www.boronine.com/husl/
 *
 * @module color-space/husl
 */

var xyz = require('./xyz');
var lchuv = require('./lchuv');
var _husl = require('husl');


module.exports = {
	name: 'husl',
	min: [0,0,0],
	max: [360,100,100],
	channel: ['hue', 'saturation', 'lightness'],

	lchuv: _husl._conv.husl.lch,

	xyz: function(arg){
		return lchuv.xyz(_husl._conv.husl.lch(arg));
	},

	//a shorter way to convert to huslp
	huslp: function(arg){
		return _husl._conv.lch.huslp( _husl._conv.husl.lch(arg));
	}
};

//extend lchuv, xyz
lchuv.husl = _husl._conv.lch.husl;
xyz.husl = function(arg){
	return _husl._conv.lch.husl(xyz.lchuv(arg));
};
},{"./lchuv":10,"./xyz":15,"husl":12}],5:[function(require,module,exports){
/**
 * A uniform wrapper for huslp.
 * // http://www.boronine.com/husl/
 *
 * @module color-space/huslp
 */

var xyz = require('./xyz');
var lchuv = require('./lchuv');
var _husl = require('husl');

module.exports = {
	name: 'huslp',
	min: [0,0,0],
	max: [360,100,100],
	channel: ['hue', 'saturation', 'lightness'],

	lchuv: _husl._conv.huslp.lch,
	xyz: function(arg){return lchuv.xyz(_husl._conv.huslp.lch(arg));},

	//a shorter way to convert to husl
	husl: function(arg){
		return _husl._conv.lch.husl( _husl._conv.huslp.lch(arg));
	}
};

//extend lchuv, xyz
lchuv.huslp = _husl._conv.lch.huslp;
xyz.huslp = function(arg){return _husl._conv.lch.huslp(xyz.lchuv(arg));};
},{"./lchuv":10,"./xyz":15,"husl":12}],6:[function(require,module,exports){
/**
 * @module color-space/hwb
 */

var rgb = require('./rgb');
var hsv = require('./hsv');
var hsl = require('./hsl');


var hwb = module.exports = {
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

		//if it is even
		if ((i & 0x01) !== 0) {
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


	// http://alvyray.com/Papers/CG/HWB_JGTv208.pdf
	hsv: function(arg){
		var h = arg[0], w = arg[1], b = arg[2], s, v;

		//if w+b > 100% - take proportion (how many times )
		if (w + b >= 100){
			s = 0;
			v = 100 * w/(w+b);
		}

		//by default - take wiki formula
		else {
			s = 100-(w/(1-b/100));
			v = 100-b;
		}


		return [h, s, v];
	},

	hsl: function(arg){
		return hsv.hsl(hwb.hsv(arg));
	}
};


//extend rgb
rgb.hwb = function(val) {
	var r = val[0],
			g = val[1],
			b = val[2],
			h = rgb.hsl(val)[0],
			w = 1/255 * Math.min(r, Math.min(g, b));

			b = 1 - 1/255 * Math.max(r, Math.max(g, b));

	return [h, w * 100, b * 100];
};



//keep proper hue on 0 values (conversion to rgb loses hue on zero-lightness)
hsv.hwb = function(arg){
	var h = arg[0], s = arg[1], v = arg[2];
	return [h, v === 0 ? 0 : (v * (1-s/100)), 100 - v];
};


//extend hsl with proper conversions
hsl.hwb = function(arg){
	return hsv.hwb(hsl.hsv(arg));
};
},{"./hsl":2,"./hsv":3,"./rgb":13}],7:[function(require,module,exports){
/**
 * @module color-space
 *
 * @todo  to-source method, preparing the code for webworker
 * @todo  implement all side spaces from http://en.wikipedia.org/wiki/Category:Color_space yuv, yiq etc.
 * @todo  here are additional spaces http://www.jentronics.com/color.html ITU, REC709, SMTPE, NTSC, GREY
 *
 * @todo implement asm-js way to convert spaces (promises to be times faster)
 *
 */

var addConvertor = require('./util/add-convertor');


/** Exported spaces */
var spaces = {
	rgb: require('./rgb'),
	hsl: require('./hsl'),
	hsv: require('./hsv'),
	hwb: require('./hwb'),
	cmyk: require('./cmyk'),
	xyz: require('./xyz'),
	lab: require('./lab'),
	lchab: require('./lchab'),
	luv: require('./luv'),
	lchuv: require('./lchuv'),
	husl: require('./husl'),
	huslp: require('./huslp')
};



//build absent convertors from each to every space
var fromSpace, toSpace;
for (var fromSpaceName in spaces) {
	fromSpace = spaces[fromSpaceName];
	for (var toSpaceName in spaces) {
		if (toSpaceName !== fromSpaceName) {
			toSpace = spaces[toSpaceName];
			addConvertor(fromSpace, toSpace);
		}
	}
}


module.exports = spaces;
},{"./cmyk":1,"./hsl":2,"./hsv":3,"./husl":4,"./huslp":5,"./hwb":6,"./lab":8,"./lchab":9,"./lchuv":10,"./luv":11,"./rgb":13,"./util/add-convertor":14,"./xyz":15}],8:[function(require,module,exports){
/**
 * CIE LAB space model
 *
 * @module color-space/lab
 */

var xyz = require('./xyz');

module.exports = {
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
	}
};


//extend xyz
xyz.lab = function(xyz){
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
};
},{"./xyz":15}],9:[function(require,module,exports){
/**
 * Cylindrical LAB
 *
 * @module color-space/lchab
 */

var xyz = require('./xyz');
var lab = require('./lab');


//cylindrical lab
var lchab = module.exports = {
	name: 'lchab',
	min: [0,0,0],
	max: [100,100,360],
	channel: ['lightness', 'chroma', 'hue'],
	alias: ['cielch', 'lch'],

	xyz: function(arg) {
		return lab.xyz(lchab.lab(arg));
	},

	lab: function(lch) {
		var l = lch[0],
				c = lch[1],
				h = lch[2],
				a, b, hr;

		hr = h / 360 * 2 * Math.PI;
		a = c * Math.cos(hr);
		b = c * Math.sin(hr);
		return [l, a, b];
	}
};


//extend lab
lab.lchab = function(lab) {
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
};

xyz.lchab = function(arg){
	return lab.lchab(xyz.lab(arg));
};
},{"./lab":8,"./xyz":15}],10:[function(require,module,exports){
/**
 * Cylindrical CIE LUV
 *
 * @module color-space/lchuv
 */

var luv = require('./luv');
var xyz = require('./xyz');

//cylindrical luv
var lchuv = module.exports = {
	name: 'lchuv',
	channel: ['lightness', 'chroma', 'hue'],
	alias: ['cielchuv'],
	min: [0,0,0],
	max: [100,100,360],

	luv: function(luv){
		var l = luv[0],
		c = luv[1],
		h = luv[2],
		u, v, hr;

		hr = h / 360 * 2 * Math.PI;
		u = c * Math.cos(hr);
		v = c * Math.sin(hr);
		return [l, u, v];
	},

	xyz: function(arg) {
		return luv.xyz(lchuv.luv(arg));
	},
};

luv.lchuv = function(luv){
	var l = luv[0], u = luv[1], v = luv[2];

	var c = Math.sqrt(u*u + v*v);
	var hr = Math.atan2(v,u);
	var h = hr * 360 / 2 / Math.PI;
	if (h < 0) {
		h += 360;
	}

	return [l,c,h]
};

xyz.lchuv = function(arg){
  return luv.lchuv(xyz.luv(arg));
};
},{"./luv":11,"./xyz":15}],11:[function(require,module,exports){
/**
 * CIE LUV (C'est la vie)
 *
 * @module color-space/luv
 */

var xyz = require('./xyz');

module.exports = {
	name: 'luv',
	//NOTE: luv has no rigidly defined limits
	//easyrgb fails to get proper coords
	//boronine states no rigid limits
	//colorMine refers this ones:
	min: [0,-134,-140],
	max: [100,224,122],
	channel: ['lightness', 'u', 'v'],
	alias: ['cieluv'],

	xyz: function(arg, i, o){
		var _u, _v, l, u, v, x, y, z, xn, yn, zn, un, vn;
		l = arg[0], u = arg[1], v = arg[2];

		if (l === 0) return [0,0,0];

		//get constants
		var e = 0.008856451679035631; //(6/29)^3
		var k = 0.0011070564598794539; //(3/29)^3

		//get illuminant/observer
		i = i || 'D65';
		o = o || 2;

		xn = xyz.whitepoint[o][i][0];
		yn = xyz.whitepoint[o][i][1];
		zn = xyz.whitepoint[o][i][2];

		un = (4 * xn) / (xn + (15 * yn) + (3 * zn));
		vn = (9 * yn) / (xn + (15 * yn) + (3 * zn));
		// un = 0.19783000664283;
		// vn = 0.46831999493879;


		_u = u / (13 * l) + un || 0;
		_v = v / (13 * l) + vn || 0;

		y = l > 8 ? yn * Math.pow( (l + 16) / 116 , 3) : yn * l * k;

		//wikipedia method
		x = y * 9 * _u / (4 * _v) || 0;
		z = y * (12 - 3 * _u - 20 * _v) / (4 * _v) || 0;

		//boronine method
		//https://github.com/boronine/husl/blob/master/husl.coffee#L201
		// x = 0 - (9 * y * _u) / ((_u - 4) * _v - _u * _v);
		// z = (9 * y - (15 * _v * y) - (_v * x)) / (3 * _v);

		return [x, y, z];
	}
};

// http://www.brucelindbloom.com/index.html?Equations.html
// https://github.com/boronine/husl/blob/master/husl.coffee
//i - illuminant
//o - observer
xyz.luv = function(arg, i, o) {
	var _u, _v, l, u, v, x, y, z, xn, yn, zn, un, vn;

	//get constants
	var e = 0.008856451679035631; //(6/29)^3
	var k = 903.2962962962961; //(29/3)^3

	//get illuminant/observer coords
	i = i || 'D65';
	o = o || 2;

	xn = xyz.whitepoint[o][i][0];
	yn = xyz.whitepoint[o][i][1];
	zn = xyz.whitepoint[o][i][2];

	un = (4 * xn) / (xn + (15 * yn) + (3 * zn));
	vn = (9 * yn) / (xn + (15 * yn) + (3 * zn));


	x = arg[0], y = arg[1], z = arg[2];


	_u = (4 * x) / (x + (15 * y) + (3 * z)) || 0;
	_v = (9 * y) / (x + (15 * y) + (3 * z)) || 0;

	var yr = y/yn;

	l = yr <= e ? k * yr : 116 * Math.pow(yr, 1/3) - 16;

	u = 13 * l * (_u - un);
	v = 13 * l * (_v - vn);

	return [l, u, v];
};
},{"./xyz":15}],12:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
(function() {
  var L_to_Y, Y_to_L, conv, distanceFromPole, dotProduct, epsilon, fromLinear, getBounds, intersectLineLine, kappa, lengthOfRayUntilIntersect, m, m_inv, maxChromaForLH, maxSafeChromaForL, refU, refV, refX, refY, refZ, rgbPrepare, root, round, toLinear;

  m = {
    R: [3.240969941904521, -1.537383177570093, -0.498610760293],
    G: [-0.96924363628087, 1.87596750150772, 0.041555057407175],
    B: [0.055630079696993, -0.20397695888897, 1.056971514242878]
  };

  m_inv = {
    X: [0.41239079926595, 0.35758433938387, 0.18048078840183],
    Y: [0.21263900587151, 0.71516867876775, 0.072192315360733],
    Z: [0.019330818715591, 0.11919477979462, 0.95053215224966]
  };

  refX = 0.95045592705167;

  refY = 1.0;

  refZ = 1.089057750759878;

  refU = 0.19783000664283;

  refV = 0.46831999493879;

  kappa = 903.2962962;

  epsilon = 0.0088564516;

  getBounds = function(L) {
    var bottom, channel, m1, m2, m3, ret, sub1, sub2, t, top1, top2, _i, _j, _len, _len1, _ref, _ref1, _ref2;
    sub1 = Math.pow(L + 16, 3) / 1560896;
    sub2 = sub1 > epsilon ? sub1 : L / kappa;
    ret = [];
    _ref = ['R', 'G', 'B'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      channel = _ref[_i];
      _ref1 = m[channel], m1 = _ref1[0], m2 = _ref1[1], m3 = _ref1[2];
      _ref2 = [0, 1];
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        t = _ref2[_j];
        top1 = (284517 * m1 - 94839 * m3) * sub2;
        top2 = (838422 * m3 + 769860 * m2 + 731718 * m1) * L * sub2 - 769860 * t * L;
        bottom = (632260 * m3 - 126452 * m2) * sub2 + 126452 * t;
        ret.push([top1 / bottom, top2 / bottom]);
      }
    }
    return ret;
  };

  intersectLineLine = function(line1, line2) {
    return (line1[1] - line2[1]) / (line2[0] - line1[0]);
  };

  distanceFromPole = function(point) {
    return Math.sqrt(Math.pow(point[0], 2) + Math.pow(point[1], 2));
  };

  lengthOfRayUntilIntersect = function(theta, line) {
    var b1, len, m1;
    m1 = line[0], b1 = line[1];
    len = b1 / (Math.sin(theta) - m1 * Math.cos(theta));
    if (len < 0) {
      return null;
    }
    return len;
  };

  maxSafeChromaForL = function(L) {
    var b1, lengths, m1, x, _i, _len, _ref, _ref1;
    lengths = [];
    _ref = getBounds(L);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      _ref1 = _ref[_i], m1 = _ref1[0], b1 = _ref1[1];
      x = intersectLineLine([m1, b1], [-1 / m1, 0]);
      lengths.push(distanceFromPole([x, b1 + x * m1]));
    }
    return Math.min.apply(Math, lengths);
  };

  maxChromaForLH = function(L, H) {
    var hrad, l, lengths, line, _i, _len, _ref;
    hrad = H / 360 * Math.PI * 2;
    lengths = [];
    _ref = getBounds(L);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      line = _ref[_i];
      l = lengthOfRayUntilIntersect(hrad, line);
      if (l !== null) {
        lengths.push(l);
      }
    }
    return Math.min.apply(Math, lengths);
  };

  dotProduct = function(a, b) {
    var i, ret, _i, _ref;
    ret = 0;
    for (i = _i = 0, _ref = a.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
      ret += a[i] * b[i];
    }
    return ret;
  };

  round = function(num, places) {
    var n;
    n = Math.pow(10, places);
    return Math.round(num * n) / n;
  };

  fromLinear = function(c) {
    if (c <= 0.0031308) {
      return 12.92 * c;
    } else {
      return 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    }
  };

  toLinear = function(c) {
    var a;
    a = 0.055;
    if (c > 0.04045) {
      return Math.pow((c + a) / (1 + a), 2.4);
    } else {
      return c / 12.92;
    }
  };

  rgbPrepare = function(tuple) {
    var ch, n, _i, _j, _len, _len1, _results;
    tuple = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = tuple.length; _i < _len; _i++) {
        n = tuple[_i];
        _results.push(round(n, 3));
      }
      return _results;
    })();
    for (_i = 0, _len = tuple.length; _i < _len; _i++) {
      ch = tuple[_i];
      if (ch < -0.0001 || ch > 1.0001) {
        throw new Error("Illegal rgb value: " + ch);
      }
      if (ch < 0) {
        ch = 0;
      }
      if (ch > 1) {
        ch = 1;
      }
    }
    _results = [];
    for (_j = 0, _len1 = tuple.length; _j < _len1; _j++) {
      ch = tuple[_j];
      _results.push(Math.round(ch * 255));
    }
    return _results;
  };

  conv = {
    'xyz': {},
    'luv': {},
    'lch': {},
    'husl': {},
    'huslp': {},
    'rgb': {},
    'hex': {}
  };

  conv.xyz.rgb = function(tuple) {
    var B, G, R;
    R = fromLinear(dotProduct(m.R, tuple));
    G = fromLinear(dotProduct(m.G, tuple));
    B = fromLinear(dotProduct(m.B, tuple));
    return [R, G, B];
  };

  conv.rgb.xyz = function(tuple) {
    var B, G, R, X, Y, Z, rgbl;
    R = tuple[0], G = tuple[1], B = tuple[2];
    rgbl = [toLinear(R), toLinear(G), toLinear(B)];
    X = dotProduct(m_inv.X, rgbl);
    Y = dotProduct(m_inv.Y, rgbl);
    Z = dotProduct(m_inv.Z, rgbl);
    return [X, Y, Z];
  };

  Y_to_L = function(Y) {
    if (Y <= epsilon) {
      return (Y / refY) * kappa;
    } else {
      return 116 * Math.pow(Y / refY, 1 / 3) - 16;
    }
  };

  L_to_Y = function(L) {
    if (L <= 8) {
      return refY * L / kappa;
    } else {
      return refY * Math.pow((L + 16) / 116, 3);
    }
  };

  conv.xyz.luv = function(tuple) {
    var L, U, V, X, Y, Z, varU, varV;
    X = tuple[0], Y = tuple[1], Z = tuple[2];
    varU = (4 * X) / (X + (15 * Y) + (3 * Z));
    varV = (9 * Y) / (X + (15 * Y) + (3 * Z));
    L = Y_to_L(Y);
    if (L === 0) {
      return [0, 0, 0];
    }
    U = 13 * L * (varU - refU);
    V = 13 * L * (varV - refV);
    return [L, U, V];
  };

  conv.luv.xyz = function(tuple) {
    var L, U, V, X, Y, Z, varU, varV;
    L = tuple[0], U = tuple[1], V = tuple[2];
    if (L === 0) {
      return [0, 0, 0];
    }
    varU = U / (13 * L) + refU;
    varV = V / (13 * L) + refV;
    Y = L_to_Y(L);

    X = 0 - (9 * Y * varU) / ((varU - 4) * varV - varU * varV);
    Z = (9 * Y - (15 * varV * Y) - (varV * X)) / (3 * varV);

    // console.log(tuple, [X*100,Y*100,Z*100])
    return [X, Y, Z];
  };

  conv.luv.lch = function(tuple) {
    var C, H, Hrad, L, U, V;
    L = tuple[0], U = tuple[1], V = tuple[2];
    C = Math.pow(Math.pow(U, 2) + Math.pow(V, 2), 1 / 2);
    Hrad = Math.atan2(V, U);
    H = Hrad * 360 / 2 / Math.PI;
    if (H < 0) {
      H = 360 + H;
    }
    return [L, C, H];
  };

  conv.lch.luv = function(tuple) {
    var C, H, Hrad, L, U, V;
    L = tuple[0], C = tuple[1], H = tuple[2];
    Hrad = H / 360 * 2 * Math.PI;
    U = Math.cos(Hrad) * C;
    V = Math.sin(Hrad) * C;
    return [L, U, V];
  };

  conv.husl.lch = function(tuple) {
    var C, H, L, S, max;
    H = tuple[0], S = tuple[1], L = tuple[2];
    if (L > 99.9999999) {
      return [100, 0, H];
    }
    if (L < 0.00000001) {
      return [0, 0, H];
    }
    max = maxChromaForLH(L, H);
    C = max / 100 * S;
    return [L, C, H];
  };

  conv.lch.husl = function(tuple) {
    var C, H, L, S, max;
    L = tuple[0], C = tuple[1], H = tuple[2];
    if (L > 99.9999999) {
      return [H, 0, 100];
    }
    if (L < 0.00000001) {
      return [H, 0, 0];
    }
    max = maxChromaForLH(L, H);
    S = C / max * 100;
    return [H, S, L];
  };

  conv.huslp.lch = function(tuple) {
    var C, H, L, S, max;
    H = tuple[0], S = tuple[1], L = tuple[2];
    if (L > 99.9999999) {
      return [100, 0, H];
    }
    if (L < 0.00000001) {
      return [0, 0, H];
    }
    max = maxSafeChromaForL(L);
    C = max / 100 * S;
    return [L, C, H];
  };

  conv.lch.huslp = function(tuple) {
    var C, H, L, S, max;
    L = tuple[0], C = tuple[1], H = tuple[2];
    if (L > 99.9999999) {
      return [H, 0, 100];
    }
    if (L < 0.00000001) {
      return [H, 0, 0];
    }
    max = maxSafeChromaForL(L);
    S = C / max * 100;
    return [H, S, L];
  };

  conv.rgb.hex = function(tuple) {
    var ch, hex, _i, _len;
    hex = "#";
    tuple = rgbPrepare(tuple);
    for (_i = 0, _len = tuple.length; _i < _len; _i++) {
      ch = tuple[_i];
      ch = ch.toString(16);
      if (ch.length === 1) {
        ch = "0" + ch;
      }
      hex += ch;
    }
    return hex;
  };

  conv.hex.rgb = function(hex) {
    var b, g, n, r, _i, _len, _ref, _results;
    if (hex.charAt(0) === "#") {
      hex = hex.substring(1, 7);
    }
    r = hex.substring(0, 2);
    g = hex.substring(2, 4);
    b = hex.substring(4, 6);
    _ref = [r, g, b];
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      n = _ref[_i];
      _results.push(parseInt(n, 16) / 255);
    }
    return _results;
  };

  conv.lch.rgb = function(tuple) {
    return conv.xyz.rgb(conv.luv.xyz(conv.lch.luv(tuple)));
  };

  conv.rgb.lch = function(tuple) {
    return conv.luv.lch(conv.xyz.luv(conv.rgb.xyz(tuple)));
  };

  conv.husl.rgb = function(tuple) {
    return conv.lch.rgb(conv.husl.lch(tuple));
  };

  conv.rgb.husl = function(tuple) {
    return conv.lch.husl(conv.rgb.lch(tuple));
  };

  conv.huslp.rgb = function(tuple) {
    return conv.lch.rgb(conv.huslp.lch(tuple));
  };

  conv.rgb.huslp = function(tuple) {
    return conv.lch.huslp(conv.rgb.lch(tuple));
  };

  root = {};

  root.fromRGB = function(R, G, B) {
    return conv.rgb.husl([R, G, B]);
  };

  root.fromHex = function(hex) {
    return conv.rgb.husl(conv.hex.rgb(hex));
  };

  root.toRGB = function(H, S, L) {
    return conv.husl.rgb([H, S, L]);
  };

  root.toHex = function(H, S, L) {
    return conv.rgb.hex(conv.husl.rgb([H, S, L]));
  };

  root.p = {};

  root.p.toRGB = function(H, S, L) {
    return conv.xyz.rgb(conv.luv.xyz(conv.lch.luv(conv.huslp.lch([H, S, L]))));
  };

  root.p.toHex = function(H, S, L) {
    return conv.rgb.hex(conv.xyz.rgb(conv.luv.xyz(conv.lch.luv(conv.huslp.lch([H, S, L])))));
  };

  root.p.fromRGB = function(R, G, B) {
    return conv.lch.huslp(conv.luv.lch(conv.xyz.luv(conv.rgb.xyz([R, G, B]))));
  };

  root.p.fromHex = function(hex) {
    return conv.lch.huslp(conv.luv.lch(conv.xyz.luv(conv.rgb.xyz(conv.hex.rgb(hex)))));
  };

  root._conv = conv;

  root._round = round;

  root._rgbPrepare = rgbPrepare;

  root._getBounds = getBounds;

  root._maxChromaForLH = maxChromaForLH;

  root._maxSafeChromaForL = maxSafeChromaForL;

  if (!((typeof module !== "undefined" && module !== null) || (typeof jQuery !== "undefined" && jQuery !== null) || (typeof requirejs !== "undefined" && requirejs !== null))) {
    this.HUSL = root;
  }

  if (typeof module !== "undefined" && module !== null) {
    module.exports = root;
  }

  if (typeof jQuery !== "undefined" && jQuery !== null) {
    jQuery.husl = root;
  }

  if ((typeof requirejs !== "undefined" && requirejs !== null) && (typeof define !== "undefined" && define !== null)) {
    define(root);
  }

}).call(this);

},{}],13:[function(require,module,exports){
/**
 * RGB space.
 *
 * @module  color-space/rgb
 */

module.exports = {
	name: 'rgb',
	min: [0,0,0],
	max: [255,255,255],
	channel: ['red', 'green', 'blue']
};
},{}],14:[function(require,module,exports){
/**
 * Add a convertor from one to another space via XYZ or RGB space as a medium.
 *
 * @module  color-space/add-convertor
 */

var xyz = require('../xyz');
var rgb = require('../rgb');

module.exports = addConvertor;


/**
 * Add convertor from space A to space B.
 * So space A will be able to transform to B.
 */
function addConvertor(fromSpace, toSpace){
	if (!fromSpace[toSpace.name]) {
		fromSpace[toSpace.name] = getConvertor(fromSpace, toSpace);
	}

	return fromSpace;
}


/** return converter through xyz/rgb space */
function getConvertor(fromSpace, toSpace){
	var toSpaceName = toSpace.name;

	//create xyz converter, if available
	if (fromSpace.xyz && xyz[toSpaceName]) {
		return function(arg){
			return xyz[toSpaceName](fromSpace.xyz(arg));
		};
	}
	//create rgb converter
	else if (fromSpace.rgb && rgb[toSpaceName]) {
		return function(arg){
			return rgb[toSpaceName](fromSpace.rgb(arg));
		};
	}

	else throw Error('Can’t add convertor from ' + fromSpace.name + ' to ' + toSpaceName);

	return fromSpace[toSpaceName];
}

},{"../rgb":13,"../xyz":15}],15:[function(require,module,exports){
/**
 * CIE XYZ
 *
 * @module  color-space/xyz
 */

var rgb = require('./rgb');

var xyz = module.exports = {
	name: 'xyz',
	min: [0,0,0],
	max: [96,100,109],
	channel: ['lightness','u','v'],
	alias: ['ciexyz'],

	//whitepoint with observer/illuminant
	// http://en.wikipedia.org/wiki/Standard_illuminant
	whitepoint: {
		2: {
			//incadescent
			A:[109.85, 100, 35.585],
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

	rgb: function(xyz) {
		var x = xyz[0] / 100,
				y = xyz[1] / 100,
				z = xyz[2] / 100,
				r, g, b;

		// assume sRGB
		// http://www.brucelindbloom.com/index.html?Eqn_RGB_XYZ_Matrix.html
		r = (x * 3.240969941904521) + (y * -1.537383177570093) + (z * -0.498610760293);
		g = (x * -0.96924363628087) + (y * 1.87596750150772) + (z * 0.041555057407175);
		b = (x * 0.055630079696993) + (y * -0.20397695888897) + (z * 1.056971514242878);

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

	var x = (r * 0.41239079926595) + (g * 0.35758433938387) + (b * 0.18048078840183);
	var y = (r * 0.21263900587151) + (g * 0.71516867876775) + (b * 0.072192315360733);
	var z = (r * 0.019330818715591) + (g * 0.11919477979462) + (b * 0.95053215224966);

	return [x * 100, y *100, z * 100];
};
},{"./rgb":13}]},{},[7])(7)
});