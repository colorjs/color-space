var s = require("../index");
var assert = require("assert");
var round = require('mumath').round;


var createSpaceCase = typeof createSpaceCase !== 'undefined' ? createSpaceCase : function(){};


//Check values here:
// http://www.easyrgb.com/index.php?X=CALC#Result
// http://colormine.org/convert/luv-to-rgb


createSpaceCase('rgb');


//TODO: save hue on zero-saturation
describe('hsl', function(){
	before(function(){
		createSpaceCase('hsl');
	});

	it('hsl → rgb', function(){
		assert.deepEqual(round(s.hsl.rgb([96, 48, 59])), [140, 201, 100]);
	});
	it('hsl → hsv', function(){
		// colorpicker says [96,50,79]
		assert.deepEqual(round(s.hsl.hsv([96, 48, 59])), [96, 50, 79]);
	});
	it('hsl → hwb', function(){
		// computer round to 21, should be 22
		assert.deepEqual(round(s.hsl.hwb([96, 48, 59])), [96, 39, 21]);
	});
	it('hsl → cmyk', function(){
		assert.deepEqual(round(s.hsl.cmyk([96, 48, 59])), [30, 0, 50, 21]);
	});
	it('rgb → hsl', function(){
		assert.deepEqual(round(s.rgb.hsl([140, 200, 100])), [96, 48, 59]);
	});
});


describe('hsv', function(){
	before(function(){
		createSpaceCase('hsv');
	});

	it('hsv → rgb', function(){
		assert.deepEqual(round(s.hsv.rgb([96, 50, 78])), [139, 199, 99]);
	});
	it('hsv → hsl', function(){
		assert.deepEqual(round(s.hsv.hsl([96, 50, 78])), [96, 47, 59]);
		assert.deepEqual(round(s.hsv.hsl([0,0,0])), [0,0,0]);
	});
	it('hsv → hwb', function(){
		assert.deepEqual(round(s.hsv.hwb([96, 50, 78])), [96, 39, 22]);
	});
	it('hsv → cmyk', function(){
		assert.deepEqual(round(s.hsv.cmyk([96, 50, 78])), [30, 0, 50, 22]);
	});
	it('rgb → hsv', function(){
		assert.deepEqual(round(s.rgb.hsv([140, 200, 100])), [96, 50, 78]);
	});
});


describe('hwb', function(){
	before(function(){
		createSpaceCase('hwb');
	});

	it('hwb → rgb', function(){
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
	it('rgb → hwb', function(){
		assert.deepEqual(round(s.rgb.hwb([140, 200, 100])), [96, 39, 22]);
	});
});


describe('cmyk', function(){
	before(function(){
		createSpaceCase('cmyk');
	});

	it('rgb → cmyk', function(){
		assert.deepEqual(round(s.rgb.cmyk([140, 200, 100])), [30, 0, 50, 22]);
		assert.deepEqual(round(s.rgb.cmyk([0,0,0,1])), [0,0,0,100]);
	});

	it('cmyk → rgb', function(){
		assert.deepEqual(round(s.cmyk.rgb([30, 0, 50, 22])), [139, 199, 99]);
	});
	it('cmyk → hsl', function(){
		assert.deepEqual(round(s.cmyk.hsl([30, 0, 50, 22])), [96, 47, 59]);
	});
	it('cmyk → hsv', function(){
		assert.deepEqual(round(s.cmyk.hsv([30, 0, 50, 22])), [96, 50, 78]);
	});
	it('cmyk → hwb', function(){
		assert.deepEqual(round(s.cmyk.hwb([30, 0, 50, 22])), [96, 39, 22]);
	});
});


describe('xyz', function(){
	before(function(){
		createSpaceCase('xyz');
	});

	//TODO: more tests here
	it('xyz → rgb', function(){
		assert.deepEqual(round(s.xyz.rgb([25, 40, 15])), [97, 190, 85]);
		assert.deepEqual(round(s.xyz.rgb([50, 100, 100])), [0, 255, 241]);
	});
	it('xyz → lab', function(){
		assert.deepEqual(round(s.xyz.lab([25, 40, 15])), [69, -48, 44]);
	});
	it('xyz → lch', function(){
		assert.deepEqual(round(s.xyz.lch([25, 40, 15])), [69, 65, 137]);
	});
	it('rgb → xyz', function(){
		assert.deepEqual(round(s.rgb.xyz([92, 191, 84])), [25, 40, 15]);
	});
});


describe('lab', function(){
	before(function(){
		createSpaceCase('lab');
	});

	it('lab → xyz', function(){
		assert.deepEqual(round(s.lab.xyz([69, -48, 44])), [25, 39, 15]);
	});
	it('lab → rgb', function(){
		assert.deepEqual(round(s.lab.rgb([75, 20, -30])), [194, 175, 240]);
	});
	it('lab → lch', function(){
		assert.deepEqual(round(s.lab.lch([69, -48, 44])), [69, 65, 137]);
	});
	it('rgb → lab', function(){
		assert.deepEqual(round(s.rgb.lab([92, 191, 84])), [70, -50, 45]);
	});
});


describe('lch', function(){
	before(function(){
		createSpaceCase('lch');
	});

	it('lch → lab', function(){
		assert.deepEqual(round(s.lch.lab([69, 65, 137])), [69, -48, 44]);
	});
	it('lch → xyz', function(){
		assert.deepEqual(round(s.lch.xyz([69, 65, 137])), [25, 39, 15]);
	});
	it('lch → rgb', function(){
		assert.deepEqual(round(s.lch.rgb([69, 65, 137])), [98, 188, 83]);
	});
	it('rgb → lch', function(){
		assert.deepEqual(round(s.rgb.lch([92, 191, 84])), [70, 67, 138]);
	});
});


describe('luv', function(){
	before(function(){
		createSpaceCase('luv');
	});

	it('rgb → luv', function(){
		assert.deepEqual(round(s.rgb.luv([0, 0, 0])), [0, 0, 0]);
		assert.deepEqual(round(s.rgb.luv([10, 0, 0])), [1, 2, 0]);
		assert.deepEqual(round(s.rgb.luv([100, 0, 0])), [19, 62, 13]);
		assert.deepEqual(round(s.rgb.luv([255, 0, 0])), [53, 175, 38]);
		assert.deepEqual(round(s.rgb.luv([0, 255, 0])), [88, -83, 107]);
		assert.deepEqual(round(s.rgb.luv([0, 0, 255])), [32, -9, -130]);
		assert.deepEqual(round(s.rgb.luv([0, 255, 255])), [91, -70, -15]);
		assert.deepEqual(round(s.rgb.luv([255, 255, 255])), [100, 0, 0]);
	});

	it('luv → rgb', function(){
		assert.deepEqual(round(s.luv.rgb([0, 0, 0])), [0, 0, 0]);
		assert.deepEqual(round(s.luv.rgb([0, -134, -140])), [0, 0, 0]);
		assert.deepEqual(round(s.luv.rgb([90, 128, 100])), [255, 189, 0]);
		assert.deepEqual(round(s.luv.rgb([50, -134, 122])), [0, 159, 0]);
	});

	it('xyz → luv', function(){
		assert.deepEqual(round(s.xyz.luv([0, 0, 0])), [0, 0, 0]);
		assert.deepEqual(round(s.xyz.luv([95, 100, 100])), [100, 3, 9]);
		assert.deepEqual(round(s.xyz.luv([50, 50, 50])), [76, 13, 5]);
		assert.deepEqual(round(s.xyz.luv([100, 0, 0])), [0, 0, 0]);
		assert.deepEqual(round(s.xyz.luv([0, 100, 0])), [100, -257, 171]);
		assert.deepEqual(round(s.xyz.luv([0, 0, 100])), [0, 0, 0]);
		assert.deepEqual(round(s.xyz.luv([95, 0, 100])), [0, 0, 0]);
	});

	it('luv → xyz', function(){
		assert.deepEqual(round(s.luv.xyz([0, 0, 0])), [0, 0, 0]);
		assert.deepEqual(round(s.luv.xyz([50, -50, -50])), [13, 18, 45]);
		assert.deepEqual(round(s.luv.xyz([50, 50, 50])), [21, 18, 2]);
		assert.deepEqual(round(s.luv.xyz([100, 0, 0])), [95, 100, 109]);
	});
});


describe('lchuv', function(){
	before(function(){
		createSpaceCase('lchuv');
	});

	it('luv ←→ lchuv', function(){
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


describe.skip('husl', function(){
	before(function(){
		createSpaceCase('husl');
	});

	it('to rgb', function(){

	});

	it('to xyz', function(){

	});

	it('to ', function(){

	});
});


describe.skip('huslp', function(){
	before(function(){
		createSpaceCase('huslp');
	});

	it('to rgb', function(){

	});

	it('to xyz', function(){

	});

	it('to ', function(){

	});
});


describe.skip('ciecam', function(){
	before(function(){
		createSpaceCase('ciecam');
	});

	it('to rgb', function(){

	});

	it('to xyz', function(){

	});

	it('to ', function(){

	});
});