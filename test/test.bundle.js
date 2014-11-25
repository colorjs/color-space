require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"../index":[function(require,module,exports){
//TODO: save hue on setting sat = 0;

var spaces = {
  rgb: require('./rgb'),
  hsl: require('./hsl'),
  hsv: require('./hsv'),
  hwb: require('./hwb'),
  cmyk: require('./cmyk'),
  xyz: require('./xyz'),
  lab: require('./lab'),
  lch: require('./lch'),
  lchuv: require('./lchuv'),
  luv: require('./luv')
};

//make each space able to transform to every other space
var fromSpace, toSpace;
for (var fromSpaceName in spaces) {
  fromSpace = spaces[fromSpaceName];
  for (var toSpaceName in spaces) {
    if (!fromSpace[toSpaceName]) {
      fromSpace[toSpaceName] = getConverter(fromSpace, toSpaceName);
    }
  }
};

//return converter through xyz/rgb space
function getConverter(fromSpace, toSpaceName){
  //create xyz converter, if available
  if (fromSpace.xyz && spaces.xyz[toSpaceName]) {
    return function(arg){
      return spaces.xyz[toSpaceName](fromSpace.xyz(arg));
    };
  }
  //create rgb converter
  else if (fromSpace.rgb && spaces.rgb[toSpaceName]) {
    return function(arg){
      return spaces.rgb[toSpaceName](fromSpace.rgb(arg));
    };
  }

  return fromSpace[toSpaceName];
}


/**
 * @module color-space
 */
module.exports = spaces;
},{"./cmyk":1,"./hsl":2,"./hsv":3,"./hwb":4,"./lab":5,"./lch":6,"./lchuv":7,"./luv":8,"./rgb":15,"./xyz":16}],"assert":[function(require,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = require('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && (isNaN(value) || !isFinite(value))) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":12}],1:[function(require,module,exports){
var rgb = require('./rgb');

var cmyk = module.exports = {
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


  xyz: function(arg) {
    return rgb.xyz(cmyk.rgb(arg));
  },

  lab: function(arg) {
    return rgb.lab(cmyk.rgb(arg));
  },

  lch: function(arg) {
    return rgb.lch(cmyk.rgb(arg));
  },

  luv: function(arg) {
    return rgb.luv(cmyk.rgb(arg));
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
},{"./rgb":15}],2:[function(require,module,exports){
var rgb = require('./rgb');

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
};
},{"./rgb":15}],3:[function(require,module,exports){
var rgb = require('./rgb');
var hsl = require('./hsl');

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
},{"./hsl":2,"./rgb":15}],4:[function(require,module,exports){
var rgb = require('./rgb');

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


  xyz: function(args) {
    return rgb.xyz(hwb.rgb(args));
  },

  lab: function(arg) {
    return rgb.lab(hwb.rgb(arg));
  },

  lch: function(arg) {
    return rgb.lch(hwb.rgb(arg));
  },

  luv: function(arg) {
    return rgb.luv(hwb.rgb(arg));
  }
};


//extend rgb
rgb.hwb = function(val) {
  var r = val[0],
      g = val[1],
      b = val[2],
      h = rgb.hsl(val)[0],
      w = 1/255 * Math.min(r, Math.min(g, b)),
      b = 1 - 1/255 * Math.max(r, Math.max(g, b));

  return [h, w * 100, b * 100];
};
},{"./rgb":15}],5:[function(require,module,exports){
var rgb = require('./rgb');
var xyz = require('./xyz');

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
  }
};


//extend rgb
rgb.lab = function(args) {
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
},{"./rgb":15,"./xyz":16}],6:[function(require,module,exports){
var xyz = require('./xyz');
var lab = require('./lab');


//cylindrical lab
var lch = module.exports = {
  name: 'lch',
  min: [0,0,0],
  max: [100,100,360],
  channel: ['lightness', 'chroma', 'hue'],
  alias: ['cielch', 'lchab'],

  xyz: function(arg) {
    return lab.xyz(lch.lab(arg));
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
lab.lch = function(lab) {
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

xyz.lch = function(arg){
  return lab.lch(xyz.lab(arg));
};
},{"./lab":5,"./xyz":16}],7:[function(require,module,exports){
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
},{"./luv":8,"./xyz":16}],8:[function(require,module,exports){
var xyz = require('./xyz');
var rgb = require('./rgb');

var luv = module.exports = {
  name: 'luv',
  min: [0,-100,-100],
  max: [100,100,100],
  channel: ['lightness', 'u', 'v'],
  alias: ['cieluv'],

  xyz: function(arg, i, o){
    var _u, _v, l, u, v, x, y, z, xn, yn, zn, un, vn;

    //get constants
    var e = 0.008856451679035631; //(6/29)^3
    var k = 0.0011070564598794539; //(3/29)^3

    //get illuminant/observer
    i = i || 'D65';
    o = o || 2;

    xn = xyz.observer[o][i][0];
    yn = xyz.observer[o][i][1];
    zn = xyz.observer[o][i][2];

    un = (4 * xn) / (xn + (15 * yn) + (3 * zn));
    vn = (9 * yn) / (xn + (15 * yn) + (3 * zn));


    l = arg[0], u = arg[1], v = arg[2];

    _u = u / (13 * l) + un || 0;
    _v = v / (13 * l) + vn || 0;

    y = l > 8 ? yn * Math.pow( (l + 16) / 116 , 3) : yn * l * k;

    x = y * 9 * _u / (4 * _v);

    z = y * (12 - 3 * _u - 20 * _v) / (4 * _v);


    return [x, y, z];
  }
};


//http://www.brucelindbloom.com/index.html?Equations.html
//i - illuminant
//o - observer
xyz.luv = function(arg, i, o) {
  var _u, _v, l, u, v, x, y, z, xn, yn, zn, un, vn;

  //get constants
  var e = 0.008856451679035631; //(6/29)^3
  var k = 903.2962962962961; //(29/3)^3

  //get illuminant/observer
  i = i || 'D65';
  o = o || 2;

  xn = xyz.observer[o][i][0];
  yn = xyz.observer[o][i][1];
  zn = xyz.observer[o][i][2];

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


rgb.luv = function(args){
  return xyz.luv(rgb.xyz(args));
};
},{"./rgb":15,"./xyz":16}],9:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],10:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    var queue = [];

    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(function () {
            var queueList = queue.slice();
            queue.length = 0;
            queueList.forEach(function (fn) {
                fn();
            });
        });

        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }

    if (canPost) {
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],11:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],12:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":11,"_process":10,"inherits":9}],13:[function(require,module,exports){
'use strict';

var proto = Element.prototype;
var vendor = proto.matches
  || proto.matchesSelector
  || proto.webkitMatchesSelector
  || proto.mozMatchesSelector
  || proto.msMatchesSelector
  || proto.oMatchesSelector;

module.exports = match;

/**
 * Match `el` to `selector`.
 *
 * @param {Element} el
 * @param {String} selector
 * @return {Boolean}
 * @api public
 */

function match(el, selector) {
  if (vendor) return vendor.call(el, selector);
  var nodes = el.parentNode.querySelectorAll(selector);
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i] == el) return true;
  }
  return false;
}
},{}],14:[function(require,module,exports){
var slice = [].slice;

module.exports = function (selector, multiple) {
  var ctx = this === window ? document : this;

  return (typeof selector == 'string')
    ? (multiple) ? slice.call(ctx.querySelectorAll(selector), 0) : ctx.querySelector(selector)
    : (selector instanceof Node || selector === window || !selector.length) ? (multiple ? [selector] : selector) : slice.call(selector, 0);
};
},{}],15:[function(require,module,exports){
var rgb = module.exports = {
  name: 'rgb',
  min: [0,0,0],
  max: [255,255,255],
  channel: ['red', 'green', 'blue']
};
},{}],16:[function(require,module,exports){
var rgb = require('./rgb');

var xyz = module.exports = {
  name: 'xyz',
  min: [0,0,0],
  max: [96,100,109],
  channel: ['lightness','u','v'],
  alias: ['ciexyz'],

  //observer/illuminant
  //http://www.easyrgb.com/index.php?X=MATH&H=15#text15
  //Xn, Yn, Zn
  observer: {
    2: {
      //incadescent
      A:[109.85, 100, 35.585],
      C: [98.074, 100, 118.232],
      D50: [96.422, 100, 82.521],
      D55: [95.682, 100, 92.149],
      //daylight
      D65: [95.047, 100, 108.883],
      D75: [94.972, 100, 122.638],
      //flourescent
      F2: [99.187, 100, 67.395],
      F7: [95.044, 100, 108.755],
      F11: [100.966, 100, 64.370],
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
},{"./rgb":15}],"mumath":[function(require,module,exports){
/**
 * Simple math utils.
 * @module  mumath
 */

module.exports = {
	between: wrap(between),
	isBetween: wrap(isBetween),
	toPrecision: wrap(toPrecision),
	getPrecision: getPrecision,
	min: wrap(Math.min),
	max: wrap(Math.max),
	add: wrap(function(a,b){return a+b}),
	sub: wrap(function(a,b){return a-b}),
	div: wrap(function(a,b){return a/b}),
	mul: wrap(function(a,b){return a*b}),
	mod: wrap(function(a,b){return a%b}),
	floor: wrap(function(a){return Math.floor(a)}),
	ceil: wrap(function(a){return Math.ceil(a)}),
	round: wrap(function(a){return Math.round(a)})
};


/**
 * Get fn wrapped with array/object attrs recognition
 *
 * @return {Function} Target function
 */
function wrap(fn){
	return function(a){
		var args = arguments;
		if (a instanceof Array) {
			var result = new Array(a.length), slice;
			for (var i = 0; i < a.length; i++){
				slice = [];
				for (var j = 0, l = args.length, val; j < l; j++){
					val = args[j] instanceof Array ? args[j][i] : args[j];
					val = val || 0;
					slice.push(val);
				}
				result[i] = fn.apply(this, slice);
			}
			return result;
		}
		else if (typeof a === 'object') {
			var result = {}, slice;
			for (var i in a){
				slice = [];
				for (var j = 0, l = args.length, val; j < l; j++){
					val = typeof args[j] === 'object' ? args[j][i] : args[j];
					val = val || 0;
					slice.push(val);
				}
				result[i] = fn.apply(this, slice);
			}
			return result;
		}
		else {
			return fn.apply(this, args);
		}
	};
}


/**
 * Clamper.
 * Detects proper clamp min/max.
 *
 * @param {number} a Current value to cut off
 * @param {number} min One side limit
 * @param {number} max Other side limit
 *
 * @return {number} Clamped value
 */

function between(a, min, max){
	return max > min ? Math.max(Math.min(a,max),min) : Math.max(Math.min(a,min),max);
}


/**
 * Whether element is between left & right including
 *
 * @param {number} a
 * @param {number} left
 * @param {number} right
 *
 * @return {Boolean}
 */

function isBetween(a, left, right){
	if (a <= right && a >= left) return true;
	return false;
}



/**
 * Precision round
 *
 * @param {number} value
 * @param {number} step Minimal discrete to round
 *
 * @return {number}
 *
 * @example
 * toPrecision(213.34, 1) == 213
 * toPrecision(213.34, .1) == 213.3
 * toPrecision(213.34, 10) == 210
 */

function toPrecision(value, step) {
	step = parseFloat(step);
	if (step === 0) return value;
	value = Math.round(value / step) * step;
	return parseFloat(value.toFixed(getPrecision(step)));
}


/**
 * Get precision from float:
 *
 * @example
 * 1.1 → 1, 1234 → 0, .1234 → 4
 *
 * @param {number} n
 *
 * @return {number} decimap places
 */

function getPrecision(n){
	var s = n + '',
		d = s.indexOf('.') + 1;

	return !d ? 0 : s.length - d;
}

},{}],"query-relative":[function(require,module,exports){
var doc = document, root = doc.documentElement;


var _q = require('tiny-element');
var matches = require('matches-selector');


//TODO: detect inner parenthesis, like :closest(:not(abc))

/**
 * @module query-relative
 */
module.exports = function(targets, str, multiple){
	//no target means global target
	if (typeof targets === 'string') {
		multiple = str;
		str = targets;
		targets = doc;
	}

	var res = q(targets,str);

	return !multiple && isList(res) ? res[0] : unique(res);
};


/**
 * Query selector including initial pseudos, return list
 *
 * @param {string} str A query string
 * @param {Element}? target A query context element
 *
 * @return {[type]} [description]
 */
function q(targets, str) {
	//if targets is undefined, perform usual global query
	if (!targets) targets = this;


	//treat empty string as a target itself
	if (!str){
		// console.groupEnd();
		return targets;
	}

	//filter window etc non-queryable objects
	if (targets === window) targets === doc;
	else if (!(targets instanceof Node) && !isList(targets)) {
		// console.groupEnd();
		return targets;
	}


	var m, result;
	// console.group(targets, str, isList(targets))

	//detect whether query includes special pseudos
	if (m = /:(parent|closest|next|prev|root)(?:\(([^\)]*)\))?/.exec(str)) {
		var pseudo = m[1], idx = m.index, param = m[2], token = m[0];

		//1. pre-query
		if (idx) {
			targets = queryList(targets, str.slice(0, idx), true);
		}

		//2. query
		result = transformSet(targets, pseudos[pseudo], param);

		if (!result) {
			// console.groupEnd();
			return null;
		}
		if (isList(result) && !result.length) return result;

		//2.1 if rest str starts with >, add scoping
		var strRest = str.slice(idx + token.length).trim();
		if (strRest[0] === '>') {
			if (scopeAvail) {
				strRest = ':scope ' + strRest;
			}
			//fake selector via fake id on selected element
			else {
				var id = genId();
				transformSet(result, function(el, id){ el.setAttribute('data-__qr', id); }, id);

				strRest = '[data-__qr' + id + ']' + strRest;
			}
		}

		//3. Post-query or die
		result = q(result, strRest);
	}

	//make default query
	else {
		result = queryList(targets, str);
	}

	// console.groupEnd();
	return result;
}

/** Query elements from a list of targets, return list of queried items */
function queryList (targets, query) {
	if (isList(targets)) {
		return transformSet(targets, function(item, query){
			return _q.call(item, query, true);
		}, query);
	}
	//q single
	else return _q.call(targets, query, true);
}


/** Apply transformaion function on each element from a list, return resulting set */
function transformSet(list, fn, arg) {
	var res = [];
	if (!isList(list)) list = [list];
	for (var i = list.length, el, chunk; i--;) {
		el = list[i];
		if (el) {
			chunk = fn(el, arg);
			if (chunk) {
				res = [].concat(chunk, res);
			}
		}
	}
	return res;
}


//detect :scope
var scopeAvail = true;
try {
	doc.querySelector(':scope');
}
//scope isn’t supported
catch (e){
	scopeAvail = false;
}

/** generate unique id for selector */
var counter = Date.now() % 1e9;
function genId(e, q){
	return (Math.random() * 1e9 >>> 0) + (counter++);
}


/** Custom :pseudos */
var pseudos = {
	/** Get parent, if any */
	parent: function(e, q){
		//root el is considered the topmost
		if (e === doc) return root;
		var res = e.parentNode;
		return res === doc ? e : res;
	},

	/**
	* Get closest parent matching selector (or self)
	*/
	closest: function(e, q){
		//root el is considered the topmost
		if (e === doc) return root;
		if (!q || (q instanceof Node ? e == q : matches(e, q))) return e;
		while ((e = e.parentNode) !== doc) {
			if (!q || (q instanceof Node ? e == q : matches(e, q))) return e;
		}
	},

	/**
	 * Find the prev sibling matching selector
	 */
	prev: function(e, q){
		while (e = e.previousSibling) {
			if (e.nodeType !== 1) continue;
			if (!q || (q instanceof Node ? e == q : matches(e, q))) return e;
		}
	},

	/**
	 * Get the next sibling matching selector
	 */
	next: function(e, q){
		while (e = e.nextSibling) {
			if (e.nodeType !== 1) continue;
			if (!q || (q instanceof Node ? e == q : matches(e, q))) return e;
		}
	},

	/**
	 * Get root for any request
	 */
	root: function(){
		return root;
	}
};


/** simple list checker */
function isList(a){
	return a instanceof Array || a instanceof NodeList;
}


/**
 * uniquify an array
 * http://jszen.com/best-way-to-get-unique-values-of-an-array-in-javascript.7.html
 */
function unique(arr){
	if (!(arr instanceof Array)) return arr;

	var n = [];
	for(var i = 0; i < arr.length; i++)
	{
		if (n.indexOf(arr[i]) == -1) n.push(arr[i]);
	}
	return n;
}


//export pseudos
exports.closest = pseudos.closest;
exports.parent = pseudos.parent;
exports.next = pseudos.next;
exports.prev = pseudos.prev;
},{"matches-selector":13,"tiny-element":14}]},{},[]);
