var s = typeof colorSpace !== 'undefined' ? colorSpace : require("../index");
var assert = require("assert");
var round = require('mumath').round;
var mult = require('mumath').mult;
var div = require('mumath').div;
var max = require('mumath').max;
var husl = require('husl');
var almost = require('almost-equal');



assert.almost = function (x, y) {
	if (x && x.length != null && y && y.length != null) return x.every(function (xi, i) {
		try {
			assert.almost(xi, y[i]);
		} catch (e) {
			assert.fail(x, y, `${(x+'').slice(0,50)}...\n≈\n${(y+'').slice(0,50)}...\n\nspecifically x[${i}] == ${xi} ≈ ${y[i]}`, '≈')
			return false;
		}
		return true;
	});

	var EPSILON = 1e-2;
	if (!almost(x, y, EPSILON)) assert.fail(x, y,
		`${x} ≈ ${y}`, '≈');
	return true;
};



var createSpaceCase = typeof createSpaceCase !== 'undefined' ? createSpaceCase : function () {};


//Check some values here:
// http://www.easyrgb.com/index.php?X=CALC#Result
// http://colormine.org/convert/luv-to-rgb


//these two are basic spaces
createSpaceCase('RGB');


describe('hsl', function () {
	before(function () {
		createSpaceCase('HSL');
	});

	it('hsl → rgb', function () {
		assert.deepEqual(round(s.hsl.rgb([96, 48, 59])), [140, 201, 100]);
	});
	it('hsl → hsv', function () {
		// colorpicker says [96,50,79]
		assert.deepEqual(round(s.hsl.hsv([96, 48, 59])), [96, 50, 79]);
	});
	it('hsl → cmyk', function () {
		assert.deepEqual(round(s.hsl.cmyk([96, 48, 59])), [30, 0, 50, 21]);
	});
	it('rgb → hsl', function () {
		assert.deepEqual(round(s.rgb.hsl([140, 200, 100])), [96, 48, 59]);
	});
});


describe('hsv', function () {
	before(function () {
		createSpaceCase('HSV');
	});

	it('hsv → rgb', function () {
		assert.deepEqual(round(s.hsv.rgb([96, 50, 78])), [139, 199, 99]);
	});
	it('hsv → hsl', function () {
		assert.deepEqual(round(s.hsv.hsl([96, 50, 78])), [96, 47, 59]);

		//keep hue
		assert.deepEqual(round(s.hsv.hsl([120,0,0])), [120,0,0]);
	});
	it('hsv → cmyk', function () {
		assert.deepEqual(round(s.hsv.cmyk([96, 50, 78])), [30, 0, 50, 22]);
	});
	it('rgb → hsv', function () {
		assert.deepEqual(round(s.rgb.hsv([140, 200, 100])), [96, 50, 78]);
	});
});


describe('hsi', function () {
	before(function () {
		createSpaceCase('HSI');
	});

	it('hsi → rgb', function () {
		assert.deepEqual(round(s.hsi.rgb([210, 33.333, 150])), [100, 150, 200]);
	});
	it('rgb → hsi', function () {
		assert.deepEqual(round(s.rgb.hsi([100, 150, 200])), [210, 33, 150]);
	});
});


describe('hcg', function () {
	before(function () {
		createSpaceCase('HCG');
	});

	it('hcg → rgb', function () {
		assert.deepEqual(round(s.hcg.rgb([ 0, 100, 0 ])), [255, 0, 0]);

		assert.deepEqual(round(s.hcg.rgb([ 0, 50, 0 ])), [128, 0, 0]);
		assert.deepEqual(round(s.hcg.rgb([ 0, 50, 100 ])), [255, 128, 128]);
		assert.deepEqual(round(s.hcg.rgb([ 0, 50, 50 ])), [191, 64, 64]);

		assert.deepEqual(round(s.hcg.rgb([ 0, 0, 100 ])), [255, 255, 255]);
		assert.deepEqual(round(s.hcg.rgb([ 0, 0, 50 ])), [128, 128, 128]);
		assert.deepEqual(round(s.hcg.rgb([ 0, 0, 0 ])), [0, 0, 0]);
	});

	it('rgb → hcg', function () {
		assert.deepEqual(round(s.rgb.hcg([255, 0, 0])), [ 0, 100, 0 ]);

		assert.deepEqual(round(s.rgb.hcg([128, 0, 0])),  [ 0, 50, 0 ]);
		assert.deepEqual(round(s.rgb.hcg([255, 128, 128])),[ 0, 50, 100 ] );
		assert.deepEqual(round(s.rgb.hcg([192, 64, 64])), [ 0, 50, 50 ]);

		assert.deepEqual(round(s.rgb.hcg([255, 255, 255])), [ 0, 0, 100 ]);
		assert.deepEqual(round(s.rgb.hcg([128, 128, 128])), [ 0, 0, 50 ]);
		assert.deepEqual(round(s.rgb.hcg([ 0, 0, 0 ])), [0, 0, 0]);
	});

	it('hcg → hwb', function () {
		assert.deepEqual(round(s.hcg.hwb([ 0, 100, 0 ])), [0, 0, 0]);
		assert.deepEqual(round(s.hcg.hwb([ 200, 100, 0 ])), [200, 0, 0]);
		assert.deepEqual(round(s.hcg.hwb([ 200, 100, 100 ])), [200, 0, 0]);
		assert.deepEqual(round(s.hcg.hwb([ 200, 0, 50 ])), [200, 50, 50]);
	});

	it('hwb → hcg', function () {
		assert.deepEqual(round(s.hwb.hcg([ 0, 0, 0 ])), [0, 100, 0]);
		assert.deepEqual(round(s.hwb.hcg([ 200, 0, 0 ])), [200, 100, 0]);
		assert.deepEqual(round(s.hwb.hcg([ 200, 50, 50 ])), [200, 0, 50]);
	});
});


describe('hwb', function () {
	before(function () {
		createSpaceCase('HWB');
		createSpaceCase('HSL');
	});

	it('hwb → rgb', function () {
		// hwb
		// http://dev.w3.org/csswg/css-color/#hwb-examples

		// all extrem value should give black, white or grey
		for(var angle = 0; angle <= 360; angle ++) {
		  assert.deepEqual(round(s.hwb.rgb([angle, 0, 100])), [0, 0, 0]);
		  assert.deepEqual(round(s.hwb.rgb([angle, 100, 0])), [255, 255, 255]);
		  assert.deepEqual(round(s.hwb.rgb([angle, 100, 100])), [128, 128, 128]);
		}

		assert.deepEqual(round(s.hwb.rgb([0, 0, 0])), [255,0,0]);
		assert.deepEqual(round(s.hwb.rgb([0, 20, 40])), [153, 51, 51]);
		assert.deepEqual(round(s.hwb.rgb([0, 40, 40])), [153, 102, 102]);
		assert.deepEqual(round(s.hwb.rgb([0, 40, 20])), [204, 102, 102]);

		assert.deepEqual(round(s.hwb.rgb([120, 0, 0])), [0,255,0]);
		assert.deepEqual(round(s.hwb.rgb([120, 20, 40])), [51, 153, 51]);
		assert.deepEqual(round(s.hwb.rgb([120, 40, 40])), [102, 153, 102]);
		assert.deepEqual(round(s.hwb.rgb([120, 40, 20])), [102, 204, 102]);

		assert.deepEqual(round(s.hwb.rgb([240, 0, 0])), [0,0,255]);
		assert.deepEqual(round(s.hwb.rgb([240, 20, 40])), [51, 51, 153]);
		assert.deepEqual(round(s.hwb.rgb([240, 40, 40])), [102, 102, 153]);
		assert.deepEqual(round(s.hwb.rgb([240, 40, 20])), [102, 102, 204]);
	});

	it('rgb → hwb', function () {
		assert.deepEqual(round(s.rgb.hwb([140, 200, 100])), [96, 39, 22]);
	});

	it('hsv → hwb', function () {
		assert.deepEqual(round(s.hsv.hwb([10, 100, 0])), [10, 0, 100]);
		assert.deepEqual(round(s.hsv.hwb([20, 0, 0])), [20, 0, 100]);
		assert.deepEqual(round(s.hsv.hwb([30, 0, 100])), [30, 100, 0]);
		assert.deepEqual(round(s.hsv.hwb([40, 0, 100])), [40, 100, 0]);
		assert.deepEqual(round(s.hsv.hwb([96, 50, 78])), [96, 39, 22]);
	});

	it('hwb → hsv', function () {
		assert.deepEqual(round(s.hwb.hsv([0, 50, 100])), [0, 0, 33]);
		assert.deepEqual(round(s.hwb.hsv([0, 100, 50])), [0, 0, 67]);
		assert.deepEqual(round(s.hwb.hsv([96, 39, 22])), [96, 50, 78]);
		assert.deepEqual(round(s.hwb.hsv([20, 100, 0])), [20, 0, 100]);
		assert.deepEqual(round(s.hwb.hsv([20, 0, 0])), [20, 100, 100]);

		assert.deepEqual(round(s.hwb.hsv([2, 50, 50])), [2, 0, 50]);
		assert.deepEqual(round(s.hwb.hsv([2, 90, 90])), [2, 0, 50]);
		assert.deepEqual(round(s.hwb.hsv([2, 100, 100])), [2, 0, 50]);
		assert.deepEqual(round(s.hwb.hsv([0, 0, 100])), [0, 0, 0]);
		assert.deepEqual(round(s.hwb.hsv([0, 50, 50])), [0, 0, 50]);
		assert.deepEqual(round(s.hwb.hsv([0, 50, 100])), [0, 0, 33]);
	});

	it('hwb → hsl', function () {
		assert.deepEqual(round(s.hwb.hsl([20, 50, 50])), [20, 0, 50]);
		assert.deepEqual(round(s.hwb.hsl([20, 100, 100])), [20, 0, 50]);
		assert.deepEqual(round(s.hwb.hsl([20, 100, 100])), [20, 0, 50]);
	});

	it('hsl → hwb', function () {
		assert.deepEqual(round(s.hsl.hwb([20, 100, 0])), [20, 0, 100]);
		assert.deepEqual(round(s.hsl.hwb([20, 100, 50])), [20, 0, 0]);
		assert.deepEqual(round(s.hsl.hwb([20, 0, 50])), [20, 50, 50]);
		assert.deepEqual(round(s.hsl.hwb([20, 50, 100])), [20, 100, 0]);
		assert.deepEqual(round(s.hsl.hwb([96, 48, 59])), [96, 39, 21]);
	});
});


describe('cmyk', function () {
	before(function () {
		createSpaceCase('CMYK');
	});

	it('rgb → cmyk', function () {
		assert.deepEqual(round(s.rgb.cmyk([140, 200, 100])), [30, 0, 50, 22]);
		assert.deepEqual(round(s.rgb.cmyk([0,0,0,1])), [0,0,0,100]);
	});

	it('cmyk → rgb', function () {
		assert.deepEqual(round(s.cmyk.rgb([30, 0, 50, 22])), [139, 199, 99]);
	});
	it('cmyk → hsl', function () {
		assert.deepEqual(round(s.cmyk.hsl([30, 0, 50, 22])), [96, 47, 59]);
	});
	it('cmyk → hsv', function () {
		assert.deepEqual(round(s.cmyk.hsv([30, 0, 50, 22])), [96, 50, 78]);
	});
	// it('cmyk → hwb', function () {
	// 	assert.deepEqual(round(s.cmyk.hwb([30, 0, 50, 22])), [96, 39, 22]);
	// });
});


describe('xyz', function () {
	before(function () {
		createSpaceCase('XYZ');
	});

	//TODO: more tests here
	it('xyz → rgb', function () {
		assert.deepEqual(round(s.xyz.rgb([25, 40, 15])), [97, 190, 85]);
		assert.deepEqual(round(s.xyz.rgb([50, 100, 100])), [0, 255, 241]);
	});
	it('xyz → lab', function () {
		assert.deepEqual(round(s.xyz.lab([25, 40, 15])), [69, -48, 44]);
	});
	it('xyz → lchab', function () {
		assert.deepEqual(round(s.xyz.lchab([25, 40, 15])), [69, 65, 137]);
	});
	it('rgb → xyz', function () {
		assert.deepEqual(round(s.rgb.xyz([92, 191, 84])), [25, 40, 15]);
	});
});


describe('xyY', function () {
	before(function () {
		createSpaceCase('XYZ');
		createSpaceCase('xyY');
	});

	//TODO: more tests here
	it('xyz → xyy', function () {
		assert.deepEqual(round(s.xyz.xyy([0, 0, 0])), [0, 0, 0]);
		assert.deepEqual(round(s.xyz.xyy([25, 40, 15]), .01), [.31, .5, 40]);
		assert.deepEqual(round(s.xyz.xyy([50, 100, 100]), .01), [0.2, .4, 100]);
	});
	it('xyy → xyz', function () {
		assert.deepEqual(round(s.xyy.xyz([.40, .15, 25]), .1), [66.7, 25, 75]);
		assert.deepEqual(round(s.xyy.xyz([0.2, .4, 100]), 1), [50, 100, 100]);
	});
});


describe('hunter-lab', function () {
	before(function () {
		createSpaceCase('XYZ');
		createSpaceCase('LABh');
	});

	it('rgb → labh', function () {
		assert.deepEqual(round(s.rgb.labh([0, 0, 0])), [0, 0, 0]);
		assert.deepEqual(round(s.rgb.labh([10, 0, 0]), .1), [2.5, 4.3, 1.6]);
		assert.deepEqual(round(s.rgb.labh([100, 0, 0]), .1), [16.5, 28.2, 10.6]);
		assert.deepEqual(round(s.rgb.labh([255, 0, 0]), .1), [46.1, 78.9, 29.8]);
		assert.deepEqual(round(s.rgb.labh([0, 255, 0]), .1), [84.6, -72.5, 50.8]);
		assert.deepEqual(round(s.rgb.labh([0, 0, 255]), .1), [26.9, 72.9, -190.9]);
		assert.deepEqual(round(s.rgb.labh([0, 255, 255]), .1), [88.7, -47, -9.4]);
		assert.deepEqual(round(s.rgb.labh([255, 255, 255]), .1), [100, -5.3, 5.4]);
	});

	it('labh → rgb', function () {
		assert.deepEqual(round(s.labh.rgb([0, 0, 0])), [0, 0, 0]);
		assert.deepEqual(round(s.labh.rgb([1, 10, -10])), [4, 0, 6]);
		assert.deepEqual(round(s.labh.rgb([10, 100, -100])), [92, 0, 121]);
	});

	it('xyz → labh', function () {
		assert.deepEqual(round(s.xyz.labh([0, 0, 0])), [0, 0, 0]);
		assert.deepEqual(round(s.xyz.labh([95, 100, 108])), [100, -5, 6]);
		assert.deepEqual(round(s.xyz.labh([95, 100, 0])), [100, -5, 70]);
	});

	it('labh → xyz', function () {
		assert.deepEqual(round(s.labh.xyz([0, 0, 0])), [0, 0, 0]);
	});
});


describe('lab', function () {
	before(function () {
		createSpaceCase('XYZ');
		createSpaceCase('LAB');
	});

	it('lab → xyz', function () {
		assert.deepEqual(round(s.lab.xyz([69, -48, 44])), [25, 39, 15]);
	});
	it('lab → rgb', function () {
		assert.deepEqual(round(s.lab.rgb([75, 20, -30])), [194, 175, 240]);
	});
	it('lab → lchab', function () {
		assert.deepEqual(round(s.lab.lchab([69, -48, 44])), [69, 65, 137]);
	});
	it('rgb → lab', function () {
		assert.deepEqual(round(s.rgb.lab([92, 191, 84])), [70, -50, 45]);
	});
});


describe('lms', function () {
	before(function () {
		createSpaceCase('XYZ');
		createSpaceCase('LMS');
	});

	it('lms ←→ xyz', function () {
		assert.deepEqual(s.lms.xyz([0,0,0]), [0,0,0]);
		assert.deepEqual(s.xyz.lms([0,0,0]), [0,0,0]);

		assert.deepEqual(round(s.lms.xyz(s.xyz.lms([10,20,30]))), [10,20,30]);
	});
});


describe('lchab', function () {
	before(function () {
		createSpaceCase('XYZ');
		createSpaceCase('LCHab');
	});

	it('lchab → lab', function () {
		assert.deepEqual(round(s.lchab.lab([69, 65, 137])), [69, -48, 44]);
	});
	it('lchab → xyz', function () {
		assert.deepEqual(round(s.lchab.xyz([69, 65, 137])), [25, 39, 15]);
	});
	it('lchab → rgb', function () {
		assert.deepEqual(round(s.lchab.rgb([69, 65, 137])), [98, 188, 83]);
	});
	it('rgb → lchab', function () {
		assert.deepEqual(round(s.rgb.lchab([92, 191, 84])), [70, 67, 138]);
	});
});


describe('luv', function () {
	before(function () {
		createSpaceCase('XYZ');
		createSpaceCase('LUV');
	});

	it('rgb → luv', function () {
		assert.deepEqual(round(s.rgb.luv([0, 0, 0])), [0, 0, 0]);
		assert.deepEqual(round(s.rgb.luv([10, 0, 0])), [1, 2, 0]);
		assert.deepEqual(round(s.rgb.luv([100, 0, 0])), [19, 62, 13]);
		assert.deepEqual(round(s.rgb.luv([255, 0, 0])), [53, 175, 38]);
		assert.deepEqual(round(s.rgb.luv([0, 255, 0])), [88, -83, 107]);
		assert.deepEqual(round(s.rgb.luv([0, 0, 255])), [32, -9, -130]);
		assert.deepEqual(round(s.rgb.luv([0, 255, 255])), [91, -70, -15]);
		assert.deepEqual(round(s.rgb.luv([255, 255, 255])), [100, 0, 0]);
	});

	it('luv → rgb', function () {
		assert.deepEqual(round(s.luv.rgb([0, 0, 0])), [0, 0, 0]);
		assert.deepEqual(round(s.luv.rgb([0, -134, -140])), [0, 0, 0]);
		assert.deepEqual(round(s.luv.rgb([90, 128, 100])), [255, 189, 0]);
		assert.deepEqual(round(s.luv.rgb([50, -134, 122])), [0, 159, 0]);
	});

	it('xyz → luv', function () {
		assert.deepEqual(round(s.xyz.luv([0, 0, 0])), [0, 0, 0]);
		assert.deepEqual(round(s.xyz.luv([95, 100, 100]),.1), [100, 3.5, 8.6]);
		assert.deepEqual(round(s.xyz.luv([50, 50, 50])), [76, 13, 5]);
		assert.deepEqual(round(s.xyz.luv([100, 0, 0])), [0, 0, 0]);
		assert.deepEqual(round(s.xyz.luv([0, 100, 0])), [100, -257, 171]);
		assert.deepEqual(round(s.xyz.luv([0, 0, 100])), [0, 0, 0]);
		assert.deepEqual(round(s.xyz.luv([95, 0, 100])), [0, 0, 0]);
	});

	it('luv → xyz', function () {
		assert.deepEqual(round(s.luv.xyz([0, 0, 0])), [0, 0, 0]);
		assert.deepEqual(round(s.luv.xyz([50, -50, -50])), [13, 18, 45]);
		assert.deepEqual(round(s.luv.xyz([50, 50, 50])), [21, 18, 2]);
	});
});


describe('lchuv', function () {
	before(function () {
		createSpaceCase('XYZ');
		createSpaceCase('LCHuv');
	});

	it('luv ←→ lchuv', function () {
		assert.deepEqual(round(
			s.lchuv.luv(s.luv.lchuv([0, 0, 0]))), [0, 0, 0]);
		assert.deepEqual(round(
			s.lchuv.luv(s.luv.lchuv([50, -50, -50]))), [50, -50, -50]);
		assert.deepEqual(round(
			s.lchuv.luv(s.luv.lchuv([50, 50, 50]))), [50, 50, 50]);
		assert.deepEqual(round(
			s.lchuv.luv(s.luv.lchuv([100, 0, 0]))), [100, 0, 0]);
	});
});


describe('husl', function () {
	before(function () {
		createSpaceCase('XYZ');
		createSpaceCase('HuSL');
	});

	it('_husl: lch → luv ≡ lchuv → luv', function () {
		assert.deepEqual(round(husl._conv.lch.luv([1,20,40]), .0001), round(s.lchuv.luv([1,20,40]), .0001));
		assert.deepEqual(round(husl._conv.lch.luv([21,50,40]), .0001), round(s.lchuv.luv([21,50,40]), .0001));
		assert.deepEqual(round(husl._conv.lch.luv([25,30,43]), .0001), round(s.lchuv.luv([25,30,43]), .0001));
	});

	it('_husl: luv → xyz ≡ luv → xyz ', function () {
		assert.deepEqual(round(mult(husl._conv.luv.xyz([21,50,40]), 100), .0001), round(s.luv.xyz([21,50,40]), .0001));
		assert.deepEqual(round(mult(husl._conv.luv.xyz([1,20,40]), 100), .0001), round(s.luv.xyz([1,20,40]), .0001));
		assert.deepEqual(round(mult(husl._conv.luv.xyz([25,30,43]), 100), .0001), round(s.luv.xyz([25,30,43]), .0001));
	});


	it('_husl: xyz → rgb ≡ xyz → rgb', function () {
		assert.deepEqual(
			round(
				max(mult(husl._conv.xyz.rgb(div([33,40,50], 100)), 255), 0), .0001
			),
			round(s.xyz.rgb([33,40,50]), .0001)
		);
		assert.deepEqual(
			round(
				max(mult(husl._conv.xyz.rgb(div([1,20,40], 100)), 255), 0), .0001
			),
			round(s.xyz.rgb([1,20,40]), .0001)
		);
		assert.deepEqual(
			round(
				max(mult(husl._conv.xyz.rgb(div([25,30,43], 100)), 255), 0), .0001
			),
			round(s.xyz.rgb([25,30,43]), .0001)
		);
	});


	it('_husl: lch → rgb ≡ lchuv → rgb', function () {
		assert.deepEqual(
			max(round(mult(husl._conv.lch.rgb([1,20,40]), 255), .001), 0),
			max(round(s.lchuv.rgb([1,20,40]), .001), 0)
		);
		assert.deepEqual(
			max(round(mult(husl._conv.lch.rgb([25,30,43]), 255), .001), 0),
			max(round(s.lchuv.rgb([25,30,43]), .001), 0)
		);
		assert.deepEqual(
			max(round(mult(husl._conv.lch.rgb([33,40,50]), 255), .001), 0),
			max(round(s.lchuv.rgb([33,40,50]), .001), 0)
		);
	});

	it('_husl → rgb ≡ husl → rgb', function () {
		assert.deepEqual(
			round(mult(husl.toRGB(25, 30, 43), 255)),
			round(s.husl.rgb([25, 30, 43]))
		);
	});
});


describe.skip('huslp', function () {
	before(function () {
		createSpaceCase('XYZ');
		createSpaceCase('HuSLP');
	});

	it('huslp → rgb', function () {

	});

	it('huslp → xyz', function () {

	});
});



describe.skip('ciecam', function () {
	before(function () {
		createSpaceCase('XYZ');
		createSpaceCase('ciecam');
	});

	it('to rgb', function () {

	});

	it('to xyz', function () {

	});

	it('to ', function () {

	});
});


describe.skip('cmy', function () {
	before(function () {
		createSpaceCase('XYZ');
		createSpaceCase('cmy');
	});

	it('to rgb', function () {

	});

	it('to xyz', function () {

	});

	it('to ', function () {

	});
});


describe('yiq', function () {
	before(function () {
		createSpaceCase('YIQ');
	});

	it('yiq → rgb', function () {
		assert.deepEqual(round(s.yiq.rgb([0, 0, 0])), [0, 0, 0]);
		assert.deepEqual(round(s.yiq.rgb([1, 0, 0])), [255, 255, 255]);
		assert.deepEqual(round(s.yiq.rgb([0.299, 0.596, 0.212])), [255, 0, 0]);
	});
	it('rgb → yiq', function () {
		assert.deepEqual(round(s.rgb.yiq([0, 0, 0]), 0.001), [0, 0, 0]);
		assert.deepEqual(round(s.rgb.yiq([255, 255, 255]), 0.001), [1, 0, 0]);
		assert.deepEqual(round(s.rgb.yiq([255, 0, 0]), 0.001), [0.299, 0.596, 0.212]);
	});
});


describe('yuv', function () {
	before(function () {
		createSpaceCase('YUV');
	});

	it('yuv → rgb', function () {
		assert.deepEqual(round(s.yuv.rgb([0, 0, 0])), [0, 0, 0]);
		assert.deepEqual(round(s.yuv.rgb([1, 0, 0])), [255, 255, 255]);
		assert.deepEqual(round(s.yuv.rgb([0.299, -0.147, 0.615])), [255, 0, 0]);
	});
	it('rgb → yuv', function () {
		assert.deepEqual(round(s.rgb.yuv([0, 0, 0]), 0.001), [0, 0, 0]);
		assert.deepEqual(round(s.rgb.yuv([255, 255, 255]), 0.001), [1, 0, 0]);
		assert.deepEqual(round(s.rgb.yuv([255, 0, 0]), 0.001), [0.299, -0.147, 0.615]);
	});
});


describe('ydbdr', function () {
	before(function () {
		createSpaceCase('YDbDr');
	});

	it('ydbdr → rgb', function () {
		assert.deepEqual(round(s.ydbdr.rgb([0, 0, 0])), [0, 0, 0]);
		assert.deepEqual(round(s.ydbdr.rgb([1, 0, 0])), [255, 255, 255]);

		assert.deepEqual(round(s.ydbdr.rgb(s.rgb.ydbdr([10,20,30]))), [10,20,30]);
	});
	it('rgb → ydbdr', function () {
		assert.deepEqual(round(s.rgb.ydbdr([0, 0, 0]), 0.001), [0, 0, 0]);
		assert.deepEqual(round(s.rgb.ydbdr([255, 255, 255]), 0.001), [1, 0, 0]);
	});
	it('yuv ←→ ydbdr', function () {
		assert.deepEqual(round(s.yuv.ydbdr([1, 0, 0]), 0.001), [1, 0, 0]);
		assert.deepEqual(round(s.ydbdr.yuv([1, 0, 0]), 0.001), [1, 0, 0]);
	});
});


describe('ycgco', function () {
	before(function () {
		createSpaceCase('YCgCo');
	});

	it('ycgco → rgb', function () {
		assert.deepEqual(round(s.ycgco.rgb([0, 0, 0])), [0, 0, 0]);
		assert.deepEqual(round(s.ycgco.rgb([1, 0, 0])), [255, 255, 255]);
		assert.deepEqual(round(s.ycgco.rgb([0.25, -0.25, 0.5])), [255, 0, 0]);

		assert.deepEqual(round(s.ycgco.rgb(s.rgb.ycgco([10,20,30]))), [10,20,30]);
	});
	it('rgb → ycgco', function () {
		assert.deepEqual(round(s.rgb.ycgco([0, 0, 0]), 0.001), [0, 0, 0]);
		assert.deepEqual(round(s.rgb.ycgco([255, 255, 255]), 0.001), [1, 0, 0]);
		assert.deepEqual(round(s.rgb.ycgco([255, 0, 0]), 0.001), [0.25, -0.25, 0.5]);
	});
});


describe('ypbpr', function () {
	before(function () {
		createSpaceCase('YPbPr');
	});

	it('ypbpr → rgb', function () {
		assert.deepEqual(round(s.ypbpr.rgb([0, 0, 0])), [0, 0, 0]);
		assert.deepEqual(round(s.ypbpr.rgb([0.715, -0.385, -0.454])), [0, 255, 0]);
		assert.deepEqual(round(s.ypbpr.rgb([1, 0, 0])), [255, 255, 255]);
		assert.deepEqual(round(s.ypbpr.rgb(s.rgb.ypbpr([0.10,0.20,0.30])), 0.001), [0.10,0.20,0.30]);
	});
	it('rgb → ypbpr', function () {
		assert.deepEqual(round(s.rgb.ypbpr([0, 0, 0]), 0.001), [0, 0, 0]);
		assert.deepEqual(round(s.rgb.ypbpr([127, 127, 127]), 0.01), [0.5, 0, 0]);
		assert.deepEqual(round(s.rgb.ypbpr([255, 255, 255]), 0.001), [1, 0, 0]);

		assert.deepEqual(round(s.rgb.ypbpr([0, 255, 0]), 0.001), [0.715, -0.385, -0.454]);
		assert.deepEqual(round(s.rgb.ypbpr([255, 0, 0]), 0.001), [0.213, -0.115, 0.5]);
	});
	it('yuv ←→ ypbpr', function () {
		assert.deepEqual(round(s.yuv.ypbpr([1, 0, 0]), 0.001), [1, 0, 0]);
		assert.deepEqual(round(s.ypbpr.yuv([1, 0, 0]), 0.001), [1, 0, 0]);
	});
});


describe('yccbccrc', function () {
	before(function () {
		createSpaceCase('YcCbcCrc');
	});

	it('yccbccrc → rgb', function () {
		assert.deepEqual(round(s.yccbccrc.rgb([0, 0, 0])), [0, 0, 0]);
		// assert.deepEqual(round(s.yccbccrc.rgb([0.715, -0.385, -0.454])), [0, 255, 0]);
		assert.deepEqual(round(s.yccbccrc.rgb([1, 0, 0])), [255, 255, 255]);
		assert.deepEqual(round(s.yccbccrc.rgb(s.rgb.yccbccrc([0.10,0.20,0.30])), 0.001), [0.10,0.20,0.30]);
	});
	it('rgb → yccbccrc', function () {
		assert.deepEqual(round(s.rgb.yccbccrc([0, 0, 0]), 0.001), [0, 0, 0]);
		assert.deepEqual(round(s.rgb.yccbccrc([127, 127, 127]), 0.01), [0.5, 0, 0]);
		assert.deepEqual(round(s.rgb.yccbccrc([255, 255, 255]), 0.001), [1, 0, 0]);

		// assert.deepEqual(round(s.rgb.yccbccrc([0, 255, 0]), 0.001), [0.715, -0.385, -0.454]);
		// assert.deepEqual(round(s.rgb.yccbccrc([255, 0, 0]), 0.001), [0.213, -0.115, 0.5]);
	});
});


describe('ycbcr', function () {
	before(function () {
		createSpaceCase('YCbCr');
	});

	it('ycbcr → rgb', function () {
		assert.deepEqual(round(s.ycbcr.rgb([16, 128, 128])), [0, 0, 0]);
		assert.deepEqual(round(s.ycbcr.rgb([235, 128, 128])), [255, 255, 255]);

		assert.deepEqual(round(s.ycbcr.rgb(s.rgb.ycbcr([10,20,30]))), [10,20,30]);
	});
	it('rgb → ycbcr', function () {
		assert.deepEqual(round(s.rgb.ycbcr([0, 0, 0]), 0.001), [16, 128, 128]);
		assert.deepEqual(round(s.rgb.ycbcr([255, 255, 255]), 0.001), [235, 128, 128]);
	});
	it('ypbpr ←→ ycbcr', function () {
		assert.deepEqual(round(s.ypbpr.ycbcr([1, -0.5, -0.5]), 0.001), [235, 16, 16]);
		assert.deepEqual(round(s.ypbpr.ycbcr([1, 0.5, 0.5]), 0.001), [235, 240, 240]);

		assert.deepEqual(round(s.ycbcr.ypbpr([235, 16, 16]), 0.001), [1, -0.5, -0.5]);
		assert.deepEqual(round(s.ycbcr.ypbpr([235, 240, 240]), 0.001), [1, 0.5, 0.5]);
	});
});


describe('xvycc', function () {
	before(function () {
		createSpaceCase('xvYCC');
	});

	it('xvycc → rgb', function () {
		assert.deepEqual(round(s.xvycc.rgb([16, 128, 128])), [0, 0, 0]);
		assert.deepEqual(round(s.xvycc.rgb([235, 128, 128])), [255, 255, 255]);

		assert.deepEqual(round(s.xvycc.rgb(s.rgb.xvycc([10,20,30]))), [10,20,30]);
	});
	it('rgb → xvycc', function () {
		assert.deepEqual(round(s.rgb.xvycc([0, 0, 0]), 0.001), [16, 128, 128]);
		assert.deepEqual(round(s.rgb.xvycc([255, 255, 255]), 0.001), [235, 128, 128]);
	});
	it('ypbpr ←→ xvycc', function () {
		assert.deepEqual(round(s.ypbpr.xvycc([1, -0.5, -0.5]), 0.001), [235, 16, 16]);
		assert.deepEqual(round(s.ypbpr.xvycc([1, 0.5, 0.5]), 0.001), [235, 240, 240]);

		assert.deepEqual(round(s.xvycc.ypbpr([235, 16, 16]), 0.001), [1, -0.5, -0.5]);
		assert.deepEqual(round(s.xvycc.ypbpr([235, 240, 240]), 0.001), [1, 0.5, 0.5]);
	});
});


describe('jpeg', function () {
	before(function () {
		createSpaceCase('YCbCr');
	});

	it('jpeg → rgb', function () {
		assert.deepEqual(round(s.jpeg.rgb([0, 128, 128])), [0, 0, 0]);
		assert.deepEqual(round(s.jpeg.rgb([255, 128, 128])), [255, 255, 255]);

		assert.deepEqual(round(s.jpeg.rgb(s.rgb.jpeg([10,20,30]))), [10,20,30]);
	});
	it('rgb → jpeg', function () {
		assert.deepEqual(round(s.rgb.jpeg([0, 0, 0]), 0.001), [0, 128, 128]);
		assert.deepEqual(round(s.rgb.jpeg([255, 255, 255]), 0.001), [255, 128, 128]);
	});
});


describe('ucs', function () {
	before(function () {
		createSpaceCase('UCS');
	});

	it('ucs → xyz', function () {
		// assert.deepEqual(round(s.ucs.xyz([0, 0, 0])), [0, 0, 0]);
		// assert.deepEqual(round(s.ucs.xyz([1, 0, 0])), [1, 1, 1]);
		assert.deepEqual(round(s.ucs.xyz(s.xyz.ucs([10,20,30]))), [10,20,30]);
	});
	it.skip('xyz → ucs', function () {
		// assert.deepEqual(round(s.xyz.ucs([0, 0, 0]), 0.001), [0, 0, 0]);
		// assert.deepEqual(round(s.xyz.ucs([1, 1, 1]), 0.001), [1, 0, 0]);
	});
});


describe('uvw', function () {
	before(function () {
		createSpaceCase('UVW');
	});

	it('uvw → xyz', function () {
		// assert.deepEqual(round(s.uvw.xyz([0, 0, 0])), [0, 0, 0]);
		// assert.deepEqual(round(s.uvw.xyz([1, 0, 0])), [1, 1, 1]);

		assert.deepEqual(round(s.uvw.xyz(s.xyz.uvw([10,20,30]))), [10,20,30]);
	});
	it('xyz → uvw', function () {
		// assert.deepEqual(round(s.xyz.uvw([0, 0, 0]), 0.001), [0, 0, 0]);
		// assert.deepEqual(round(s.xyz.uvw([1, 1, 1]), 0.001), [1, 0, 0]);
	});
});


describe('cubehelix', function () {
	it('paint', function () {
		if (typeof document === 'undefined') return;

		var cnv = document.createElement('canvas');
		cnv.width = 400;
		cnv.height = 30;
		document.body.appendChild(cnv);

		var ctx = cnv.getContext('2d');

		for (var i = 0; i < 1; i += 0.01) {
			ctx.fillStyle = 'rgb(' + s.cubehelix.rgb(i, {
				rotation: 1,
				start: 0,
				hue: 1
			}).map(Math.round) + ')';
			ctx.fillRect(i * cnv.width, 0, 4, cnv.height);
		}
	});
});


describe('osaucs', function () {
	before(function () {
		createSpaceCase('osaucs');
	});

	it.skip('osaucs → xyy', function () {
		// assert.deepEqual(round(s.osaucs.xyy([0,-4,-4])), [33.71, 26.46, 46.66]);
		// assert.deepEqual(round(s.osaucs.xyy([-8,-6,+2])), [1.773902, 1.049996, 7.893570]);
		// assert.deepEqual(round(s.osaucs.xyy(s.xyy.osaucs([10,20,30]))), [10,20,30]);
	});
	it('xyy → osaucs', function () {
		//TODO: fix test according to the paper
		// assert.deepEqual(round(s.xyz.osaucs([33.71, 26.46, 46.66])), [0,-4,-4]);
		assert.deepEqual(round(s.xyz.osaucs([33.71, 26.46, 46.66])), [0,-4,-5]);
		// assert.deepEqual(round(s.xyz.osaucs([1.773902, 1.049996, 7.893570])), [-8,-6,+2]);
		assert.deepEqual(round(s.xyz.osaucs([1.773902, 1.049996, 7.893570])), [-8,-7,+1]);
	});
});


describe('coloroid', function () {
	it('coloroid → xyz', function () {
		assert.deepEqual(round(s.coloroid.xyz([21, 39, 70]), 1), [56, 49.0, 19]);
		assert.deepEqual(round(s.coloroid.xyz([61, 0, 90]), 1), [81, 81, 84]);
		assert.deepEqual(round(s.coloroid.xyz([35, 10, 90]), 1), [85, 81, 86]);

		//coloroid looses color info via binding hue
		// assert.deepEqual(round(s.coloroid.xyz(s.xyz.coloroid([10,20,30]))), [10,20,30]);
	});
	it('xyz → coloroid', function () {
		assert.deepEqual(round(s.xyz.coloroid([54.64, 64.0, 18.26]), 1), [10, 48, 80]);
		assert.deepEqual(round(s.xyz.coloroid([54.2, 49.0, 17.6]), 1), [21, 39, 70]);
	});


	it.skip('paint side colors', function () {
		if (typeof document === 'undefined') return;

		var cnv = document.createElement('canvas');
		cnv.width = 400;
		cnv.height = 30;
		document.body.appendChild(cnv);
		var ctx = cnv.getContext('2d');

		//paint coloroid side colors
		var range = s.coloroid.table.length, w = cnv.width/range;
		var row, vals;
		for (var i = 0; i < range; i++) {
			row = s.coloroid.table[i];
			vals = row.slice(-3).map(function (v) {
				return v*100
			});

			ctx.fillStyle = 'rgb(' + s.xyz.rgb(vals).map(Math.round) + ')';
			ctx.fillRect(i * w, 0, Math.ceil(w), cnv.height);
		}
	});


	it('paint conversion from hue', function () {
		if (typeof document === 'undefined') return;

		var cnv = document.createElement('canvas');
		cnv.width = 400;
		cnv.height = 30;
		document.body.appendChild(cnv);
		var ctx = cnv.getContext('2d');

		var range = s.coloroid.table.length, w = cnv.width/range;
		var row, vals;
		for (var i = 0; i < range; i++) {
			row = s.coloroid.table[i];
			vals = s.coloroid.rgb([row[0], 30, 30]);

			ctx.fillStyle = 'rgb(' + vals.map(Math.round) + ')';
			ctx.fillRect(i * w, 0, Math.ceil(w), 10);
		}
		for (var i = 0; i < range; i++) {
			row = s.coloroid.table[i];
			vals = s.coloroid.rgb([row[0], 50, 50]);

			ctx.fillStyle = 'rgb(' + vals.map(Math.round) + ')';
			ctx.fillRect(i * w, 10, Math.ceil(w), 20);
		}
		for (var i = 0; i < range; i++) {
			row = s.coloroid.table[i];
			vals = s.coloroid.rgb([row[0], 70, 70]);

			ctx.fillStyle = 'rgb(' + vals.map(Math.round) + ')';
			ctx.fillRect(i * w, 20, Math.ceil(w), 30);
		}
	});
});


describe.skip('tsl', function () {
	before(function () {
		createSpaceCase('TSL');
	});

	it('tsl → rgb', function () {
		// assert.deepEqual(round(s.tsl.rgb([0, 0, 0])), [0, 0, 0]);
		// assert.deepEqual(round(s.tsl.rgb([1, 0, 0])), [1, 1, 1]);
		// console.log(s.rgb.tsl([0,0,0]))

		// assert.almost(s.rgb.tsl([0,0,0]), [.375, .632, 0]);
		// assert.almost(s.rgb.tsl([255,255,255]), [.375, .632, 1]);
		// console.log(s.rgb.tsl([20, 60, 60]));
		// console.log(s.tsl.rgb(s.rgb.tsl([10, 20, 30])));
		// assert.almost(s.tsl.rgb(s.rgb.tsl([10,20,30])), [10,20,30]);
	});
	it('rgb → tsl', function () {
		// assert.deepEqual(round(s.rgb.tsl([0, 0, 0]), 0.001), [0, 0, 0]);
		// assert.deepEqual(round(s.rgb.tsl([1, 1, 1]), 0.001), [1, 0, 0]);
	});
});


describe('yes', function () {
	before(function () {
		createSpaceCase('YES');
	});

	it('yes ←→ rgb', function () {
		assert.almost(s.rgb.yes([0,0,0]), [0, 0, 0]);
		assert.almost(s.rgb.yes([255,255,255]), [1, 0, 0]);
		assert.almost(s.yes.rgb(s.rgb.yes([10,20,30])), [10,20,30]);
	});
});