require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"../cmy":[function(require,module,exports){
/**
 * @module color-space/cmy
 */
var rgb = require('./rgb');

module.exports = {
	name: 'cmy',
	min: [0,0,0],
	max: [100,100,100],
	channel: ['cyan', 'magenta', 'yellow'],

	rgb: function(cmy) {
		var c = cmyk[0] / 100,
			m = cmyk[1] / 100,
			y = cmyk[2] / 100;

		return [
			(1 - c) * 255,
			(1 - m) * 255,
			(1 - y) * 255
		];
	}
};


//extend rgb
rgb.cmy = function(rgb) {
	var r = rgb[0] / 255,
		g = rgb[1] / 255,
		b = rgb[2] / 255;

	return [
		(1-r) * 100 || 0,
		(1-g) * 100 || 0,
		(1-b) * 100 || 0
	];
};
},{"./rgb":22}],"../index":[function(require,module,exports){
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
},{"./cmyk":1,"./hsl":2,"./hsv":3,"./husl":4,"./huslp":5,"./hwb":6,"./lab":7,"./lchab":8,"./lchuv":9,"./luv":10,"./rgb":22,"./util/add-convertor":23,"./xyz":24}],"../labh":[function(require,module,exports){
/**
 * Hunter-lab space.
 *
 * @module  color-space/labh
 */

var xyz = require('./xyz');

module.exports = {
	name: 'labh',

	//mins/maxes are taken from colormine
	//FIXME: check whether mins/maxes correct
	min: [0,-128,-128],
	max: [100,128,128],
	channel: ['lightness', 'a', 'b'],
	alias: ['hunter-lab', 'hlab'],

	//maths are taken from EasyRGB
	xyz: function(lab) {
		var l = lab[0], a = lab[1], b = lab[2];

		var _y = l / 10;
		var _x = a / 17.5 * l / 10;
		var _z = b / 7 * l / 10;

		var y = _y * _y;
		var x = ( _x + y ) / 1.02;
		var z = -( _z - y ) / 0.847;

		return [x,y,z];
	}
};

//extend xyz
xyz.labh = function(xyz){
	var x = xyz[0], y = xyz[1], z = xyz[2];
	var l = 10 * Math.sqrt( y );
	var a = y === 0 ? 0 : 17.5 * ((( 1.02 * x ) - y ) / Math.sqrt( y ) );
	var b = y === 0 ? 0 : 7 * ( ( y - ( 0.847 * z ) ) / Math.sqrt( y ) );

	return [l, a, b];
};
},{"./xyz":24}],"../util/add-space":[function(require,module,exports){
/**
 * Append a new color space to the set
 * Bind all necessary conversions etc
 *
 * @module  color-space/add-space
 */

var addConvertor = require('./add-convertor');

/**
 * Appends a converter from every space in the set to a new space.
 * Appends a converter from the new space to every space in the set.
 *
 * @param {object} space New space with basic xyz/rgb converters
 * @param {object} spaces Set of color spaces
 *
 * @return {object} A new space
 */
module.exports = function(spaces, space){
	var spaceName = space.name;

	//ignore existing space
	if (spaces[spaceName]) return;

	//add convertors to every existing space
	var otherSpace;
	for (var otherSpaceName in spaces) {
		otherSpace = spaces[otherSpaceName];
		addConvertor(space, otherSpace);
		addConvertor(otherSpace, space);
	}

	//save a new space
	spaces[spaceName] = space;

	return space;
};
},{"./add-convertor":23}],"../xyy":[function(require,module,exports){
/**
 * Additional xyY space.
 *
 * @module color-space/xyy
 */
var xyz = require('./xyz');

module.exports = {
	name: 'xyy',
	min: [0,0,0],
	max: [1,1,100],
	channel: ['x','y','Y'],
	alias: ['Yxy', 'xyY', 'yxy'],

	// https://github.com/boronine/colorspaces.js/blob/master/colorspaces.js#L128
	xyz: function(arg) {
		var X, Y, Z, x, y;
		x = arg[0], y = arg[1], Y = arg[2];
		if (y === 0) {
			return [0, 0, 0];
		}
		X = x * Y / y;
		Z = (1 - x - y) * Y / y;
		return [X, Y, Z];
	}
};


//extend xyz
xyz.xyy = function(arg) {
	var sum, X, Y, Z;
	X = arg[0], Y = arg[1], Z = arg[2];
	sum = X + Y + Z;
	if (sum === 0) {
		return [0, 0, Y];
	}
	return [X / sum, Y / sum, Y];
};
},{"./xyz":24}],"assert":[function(require,module,exports){
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

},{"util/":14}],1:[function(require,module,exports){
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
},{"./rgb":22}],2:[function(require,module,exports){
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
},{"./rgb":22}],3:[function(require,module,exports){
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
},{"./hsl":2,"./rgb":22}],4:[function(require,module,exports){
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
},{"./lchuv":9,"./xyz":24,"husl":"husl"}],5:[function(require,module,exports){
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
},{"./lchuv":9,"./xyz":24,"husl":"husl"}],6:[function(require,module,exports){
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
},{"./hsl":2,"./hsv":3,"./rgb":22}],7:[function(require,module,exports){
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
},{"./xyz":24}],8:[function(require,module,exports){
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
},{"./lab":7,"./xyz":24}],9:[function(require,module,exports){
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
},{"./luv":10,"./xyz":24}],10:[function(require,module,exports){
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
},{"./xyz":24}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],14:[function(require,module,exports){
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
},{"./support/isBuffer":13,"_process":12,"inherits":11}],15:[function(require,module,exports){
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

module.exports = require('./wrap')(function(a, min, max){
	return max > min ? Math.max(Math.min(a,max),min) : Math.max(Math.min(a,min),max);
});
},{"./wrap":19}],16:[function(require,module,exports){
/**
 * Whether element is between left & right including
 *
 * @param {number} a
 * @param {number} left
 * @param {number} right
 *
 * @return {Boolean}
 */
module.exports = require('./wrap')(function(a, left, right){
	if (a <= right && a >= left) return true;
	return false;
});
},{"./wrap":19}],17:[function(require,module,exports){
/**
 * Get precision from float:
 *
 * @example
 * 1.1 → 1, 1234 → 0, .1234 → 4
 *
 *
 * @param {number} n
 *
 * @return {number} decimap places
 */

module.exports = require('./wrap')(function(n){
	var s = n + '',
		d = s.indexOf('.') + 1;

	return !d ? 0 : s.length - d;
});
},{"./wrap":19}],18:[function(require,module,exports){
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
var precision = require('./precision');

module.exports = require('./wrap')(function(value, step) {
	if (step === 0) return value;
	if (!step) return Math.round(value);
	step = parseFloat(step);
	value = Math.round(value / step) * step;
	return parseFloat(value.toFixed(precision(step)));
});
},{"./precision":17,"./wrap":19}],19:[function(require,module,exports){
/**
 * Get fn wrapped with array/object attrs recognition
 *
 * @return {Function} Target function
 */
module.exports = function(fn){
	return function(a){
		var args = arguments;
		if (a instanceof Array) {
			var result = new Array(a.length), slice;
			for (var i = 0; i < a.length; i++){
				slice = [];
				for (var j = 0, l = args.length, val; j < l; j++){
					val = args[j] instanceof Array ? args[j][i] : args[j];
					val = val;
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
					val = val;
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
};
},{}],20:[function(require,module,exports){
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
},{}],21:[function(require,module,exports){
var slice = [].slice;

module.exports = function (selector, multiple) {
  var ctx = this === window ? document : this;

  return (typeof selector == 'string')
    ? (multiple) ? slice.call(ctx.querySelectorAll(selector), 0) : ctx.querySelector(selector)
    : (selector instanceof Node || selector === window || !selector.length) ? (multiple ? [selector] : selector) : slice.call(selector, 0);
};
},{}],22:[function(require,module,exports){
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
},{}],23:[function(require,module,exports){
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

},{"../rgb":22,"../xyz":24}],24:[function(require,module,exports){
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
},{"./rgb":22}],"husl":[function(require,module,exports){
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

},{}],"mumath":[function(require,module,exports){
var wrap = require('./wrap');

/**
 * Simple math utils.
 *
 * @module  mumath
 */
module.exports = {
	between: require('./between'),
	isBetween: require('./is-between'),
	round: require('./round'),
	precision: require('./precision'),
	min: wrap(Math.min),
	max: wrap(Math.max),
	add: wrap(function(a,b){return a+b}),
	sub: wrap(function(a,b){return a-b}),
	div: wrap(function(a,b){return a/b}),
	mult: wrap(function(a,b){return a*b}),
	mod: wrap(function(a,b){return a%b}),
	floor: wrap(function(a){return Math.floor(a)}),
	ceil: wrap(function(a){return Math.ceil(a)})
};
},{"./between":15,"./is-between":16,"./precision":17,"./round":18,"./wrap":19}],"query-relative":[function(require,module,exports){
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
},{"matches-selector":20,"tiny-element":21}]},{},[]);
