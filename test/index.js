// Test refs
// http://www.easyrgb.com/index.php?X=CALC#Result
// http://colormine.org/convert/luv-to-rgb

import space from '../index.js';
import test, { is } from 'tst'
import color from 'color-name'

// get round fn for a precision
const round = (precision = 0) => v => Math.round(v * 10 ** precision) / 10 ** precision



test.only('lrgb', () => {
	is(space.rgb.lrgb(1, 1, 1), [1.0, 1.0, 1.0], 'white')
	is(space.rgb.lrgb(0, 0, 0), [0, 0, 0], 'black')
	is(space.rgb.lrgb(0.5, 0.5, 0.5).map(round(3)), [0.214, 0.214, 0.214], 'gray')
})


//TODO: more tests here
test.todo('xyz', function () {
	is((space.xyz.rgb(.1, .156, .059)), [.97, 1.90, .85]);
	is((space.xyz.rgb(50, 100, 100).map(round(0))), [0, 255, 241]);

	// is((space.xyz.lab(25, 40, 15).map(round(0))), [69, -48, 44]);

	// is((space.xyz.lchab(25, 40, 15).map(round(0))), [69, 65, 137]);

	// is((space.rgb.xyz(92, 191, 84).map(round(0))), [25, 40, 15]);
});




test('cmyk: rgb -> cmyk', function () {
	is((space.rgb.cmyk([140, 200, 100]).map(round(0))), [30, 0, 50, 22]);
	is((space.rgb.cmyk([0, 0, 0, 1]).map(round(0))), [0, 0, 0, 100]);
});

test('cmyk: cmyk -> rgb', function () {
	is((space.cmyk.rgb([30, 0, 50, 22]).map(round(0))), [139, 199, 99]);
});

test('cmyk: cmyk -> hsl', function () {
	is((space.cmyk.hsl([30, 0, 50, 22]).map(round(0))), [96, 47, 59]);
});

test('cmyk: cmyk -> hsv', function () {
	is((space.cmyk.hsv([30, 0, 50, 22]).map(round(0))), [96, 50, 78]);
});

test('cmyk: cmyk -> hwb', function () {
	is((space.cmyk.hwb([30, 0, 50, 22]).map(round(0))), [96, 39, 22]);
});



test('hsl: hsl -> rgb', function () {
	is(space.hsl.rgb([96, 48, 59]).map(round(0)), [140, 201, 100]);
});

test('hsl: hsl -> hsv', function () {
	// colorpicker says [96,50,79]
	is(space.hsl.hsv([96, 48, 59]).map(round(0)), [96, 50, 79]);
});

test('hsl: hsl -> cmyk', function () {
	is(space.hsl.cmyk([96, 48, 59]).map(round(0)), [30, 0, 50, 21]);
});

test('hsl: rgb -> hsl', function () {
	is(space.rgb.hsl([140, 200, 100]).map(round(0)), [96, 48, 59]);
});



test('hsv: hsv -> rgb', function () {
	is(space.hsv.rgb([96, 50, 78]).map(round(0)), [139, 199, 99]);
});

test('hsv: hsv -> hsl', function () {
	is(space.hsv.hsl([96, 50, 78]).map(round(0)), [96, 47, 59]);

	//keep hue
	is(space.hsv.hsl([120, 0, 0]).map(round(0)), [120, 0, 0]);
});

test('hsv: hsv -> cmyk', function () {
	is(space.hsv.cmyk([96, 50, 78]).map(round(0)), [30, 0, 50, 22]);
});

test('hsv: rgb -> hsv', function () {
	is(space.rgb.hsv([140, 200, 100]).map(round(0)), [96, 50, 78]);
});



test('hsp: hsp -> rgb', function () {
	is((space.hsp.rgb([0.2, 0.5, 0.3])), [0, 0, 0]);
});

test('hsp: rgb -> hsp', function () {
	is((space.rgb.hsp([98, 115, 255]).map(round(0))), [234, 62, 134]);
});

test('hsp: rgb -> hsp', function () {
	is(space.rgb.hsp([110, 110, 110]).map(round(0)), [0, 0, 110]);
});



test('hsi: hsi -> rgb', function () {
	is(space.hsi.rgb([210, 33.333, 150]).map(round(0)), [100, 150, 200]);
});

test('hsi: rgb -> hsi', function () {
	is(space.rgb.hsi([100, 150, 200]).map(round(0)), [210, 33, 150]);
});



test('hcg: hcg -> rgb', function () {
	is((space.hcg.rgb([0, 100, 0])), [255, 0, 0]);

	is((space.hcg.rgb([0, 50, 0]).map(round(0))), [128, 0, 0]);
	is((space.hcg.rgb([0, 50, 100]).map(round(0))), [255, 128, 128]);
	is((space.hcg.rgb([0, 50, 50]).map(round(0))), [191, 64, 64]);

	is((space.hcg.rgb([0, 0, 100]).map(round(0))), [255, 255, 255]);
	is((space.hcg.rgb([0, 0, 50]).map(round(0))), [128, 128, 128]);
	is((space.hcg.rgb([0, 0, 0]).map(round(0))), [0, 0, 0]);
});

test('hcg: rgb -> hcg', function () {
	is((space.rgb.hcg([255, 0, 0]).map(round(0))), [0, 100, 0]);

	is((space.rgb.hcg([128, 0, 0]).map(round(0))), [0, 50, 0]);
	is((space.rgb.hcg([255, 128, 128]).map(round(0))), [0, 50, 100]);
	is((space.rgb.hcg([192, 64, 64]).map(round(0))), [0, 50, 50]);

	is((space.rgb.hcg([255, 255, 255]).map(round(0))), [0, 0, 100]);
	is((space.rgb.hcg([128, 128, 128]).map(round(0))), [0, 0, 50]);
	is((space.rgb.hcg([0, 0, 0]).map(round(0))), [0, 0, 0]);
});

test('hcg: hcg -> hwb', function () {
	is((space.hcg.hwb([0, 100, 0])), [0, 0, 0]);
	is((space.hcg.hwb([200, 100, 0])), [200, 0, 0]);
	is((space.hcg.hwb([200, 100, 100])), [200, 0, 0]);
	is((space.hcg.hwb([200, 0, 50])), [200, 50, 50]);
});

test('hcg: hwb -> hcg', function () {
	is((space.hwb.hcg([0, 0, 0])), [0, 100, 0]);
	is((space.hwb.hcg([200, 0, 0])), [200, 100, 0]);
	is((space.hwb.hcg([200, 50, 50])), [200, 0, 50]);
});



test('hwb: hwb -> rgb', function () {
	// hwb
	// http://dev.w3.org/csswg/css-color/#hwb-examples

	// all extrem value should give black, white or grey
	for (var angle = 0; angle <= 360; angle++) {
		is((space.hwb.rgb([angle, 0, 100]).map(round(0))), [0, 0, 0]);
		is((space.hwb.rgb([angle, 100, 0]).map(round(0))), [255, 255, 255]);
		is((space.hwb.rgb([angle, 100, 100]).map(round(0))), [128, 128, 128]);
	}

	is((space.hwb.rgb([0, 0, 0]).map(round(0))), [255, 0, 0]);
	is((space.hwb.rgb([0, 20, 40]).map(round(0))), [153, 51, 51]);
	is((space.hwb.rgb([0, 40, 40]).map(round(0))), [153, 102, 102]);
	is((space.hwb.rgb([0, 40, 20]).map(round(0))), [204, 102, 102]);

	is((space.hwb.rgb([120, 0, 0]).map(round(0))), [0, 255, 0]);
	is((space.hwb.rgb([120, 20, 40]).map(round(0))), [51, 153, 51]);
	is((space.hwb.rgb([120, 40, 40]).map(round(0))), [102, 153, 102]);
	is((space.hwb.rgb([120, 40, 20]).map(round(0))), [102, 204, 102]);

	is((space.hwb.rgb([240, 0, 0]).map(round(0))), [0, 0, 255]);
	is((space.hwb.rgb([240, 20, 40]).map(round(0))), [51, 51, 153]);
	is((space.hwb.rgb([240, 40, 40]).map(round(0))), [102, 102, 153]);
	is((space.hwb.rgb([240, 40, 20]).map(round(0))), [102, 102, 204]);
});

test('hwb: rgb -> hwb', function () {
	is((space.rgb.hwb([140, 200, 100]).map(round(0))), [96, 39, 22]);
});

test('hwb: hsv -> hwb', function () {
	is((space.hsv.hwb([10, 100, 0]).map(round(0))), [10, 0, 100]);
	is((space.hsv.hwb([20, 0, 0]).map(round(0))), [20, 0, 100]);
	is((space.hsv.hwb([30, 0, 100]).map(round(0))), [30, 100, 0]);
	is((space.hsv.hwb([40, 0, 100]).map(round(0))), [40, 100, 0]);
	is((space.hsv.hwb([96, 50, 78]).map(round(0))), [96, 39, 22]);
});

test('hwb: hwb -> hsv', function () {
	is((space.hwb.hsv([0, 50, 100]).map(round(0))), [0, 0, 33]);
	is((space.hwb.hsv([0, 100, 50]).map(round(0))), [0, 0, 67]);
	is((space.hwb.hsv([96, 39, 22]).map(round(0))), [96, 50, 78]);
	is((space.hwb.hsv([20, 100, 0]).map(round(0))), [20, 0, 100]);
	is((space.hwb.hsv([20, 0, 0]).map(round(0))), [20, 100, 100]);

	is((space.hwb.hsv([2, 50, 50]).map(round(0))), [2, 0, 50]);
	is((space.hwb.hsv([2, 90, 90]).map(round(0))), [2, 0, 50]);
	is((space.hwb.hsv([2, 100, 100]).map(round(0))), [2, 0, 50]);
	is((space.hwb.hsv([0, 0, 100]).map(round(0))), [0, 0, 0]);
	is((space.hwb.hsv([0, 50, 50]).map(round(0))), [0, 0, 50]);
	is((space.hwb.hsv([0, 50, 100]).map(round(0))), [0, 0, 33]);
});

test('hwb: hwb -> hsl', function () {
	is((space.hwb.hsl([20, 50, 50]).map(round(0))), [20, 0, 50]);
	is((space.hwb.hsl([20, 100, 100]).map(round(0))), [20, 0, 50]);
	is((space.hwb.hsl([20, 100, 100]).map(round(0))), [20, 0, 50]);
});

test('hwb: hsl -> hwb', function () {
	is((space.hsl.hwb([20, 100, 0]).map(round(0))), [20, 0, 100]);
	is((space.hsl.hwb([20, 100, 50]).map(round(0))), [20, 0, 0]);
	is((space.hsl.hwb([20, 0, 50]).map(round(0))), [20, 50, 50]);
	is((space.hsl.hwb([20, 50, 100]).map(round(0))), [20, 100, 0]);
	is((space.hsl.hwb([96, 48, 59]).map(round(0))), [96, 39, 21]);
});




//TODO: more tests here
test('xyY: xyz -> xyy', function () {
	is((space.xyz.xyy([0, 0, 0])), [0, 0, 0]);
	is((space.xyz.xyy([25, 40, 15])), [.3125, .5, 40]);
	is((space.xyz.xyy([50, 100, 100])), [0.2, .4, 100]);
});

test('xyY: xyy -> xyz', function () {
	is((space.xyy.xyz([.40, .15, 25]).map(round(0))), [67, 25, 75]);
	is((space.xyy.xyz([0.2, .4, 100]).map(round(0))), [50, 100, 100]);
});



test('labh: rgb -> labh', function () {
	is((space.rgb.labh([0, 0, 0]).map(round(1))), [0, 0, 0]);
	is((space.rgb.labh([10, 0, 0]).map(round(1))), [2.5, 4.3, 1.6], .05);
	is((space.rgb.labh([100, 0, 0]).map(round(1))), [16.5, 28.2, 10.6]);
	is((space.rgb.labh([255, 0, 0]).map(round(1))), [46.1, 78.9, 29.8]);
	is((space.rgb.labh([0, 255, 0]).map(round(1))), [84.6, -72.5, 50.8]);
	is((space.rgb.labh([0, 0, 255]).map(round(1))), [26.9, 72.9, -190.9]);
	is((space.rgb.labh([0, 255, 255]).map(round(1))), [88.7, -47, -9.4]);
	is((space.rgb.labh([255, 255, 255]).map(round(1))), [100, -5.3, 5.4]);
});

test('labh: labh -> rgb', function () {
	is((space.labh.rgb([0, 0, 0]).map(round(0))), [0, 0, 0]);
	is((space.labh.rgb([1, 10, -10]).map(round(0))), [4, 0, 6]);
	is((space.labh.rgb([10, 100, -100]).map(round(0))), [92, 0, 121]);
});

test('labh: xyz -> labh', function () {
	is((space.xyz.labh([0, 0, 0])).map(round(0)), [0, 0, 0]);
	is((space.xyz.labh([95, 100, 108])).map(round(0)), [100, -5, 6]);
	is((space.xyz.labh([95, 100, 0])).map(round(0)), [100, -5, 70]);
});

test('labh: labh -> xyz', function () {
	is((space.labh.xyz([0, 0, 0])), [0, 0, 0]);
});



test('lab: lab -> xyz', function () {
	is((space.lab.xyz([69, -48, 44])).map(round(0)), [25, 39, 15]);
});

test('lab: lab -> rgb', function () {
	is((space.lab.rgb([75, 20, -30]).map(round(0))), [194, 175, 240]);
});

test('lab: lab -> lchab', function () {
	is((space.lab.lchab([69, -48, 44]).map(round(0))), [69, 65, 137]);
});

test('lab: rgb -> lab', function () {
	is((space.rgb.lab([92, 191, 84]).map(round(0))), [70, -50, 45]);
});



test('lms: lms <-> xyz', function () {
	is(space.lms.xyz([0, 0, 0]), [0, 0, 0]);
	is(space.xyz.lms([0, 0, 0]), [0, 0, 0]);

	is((space.lms.xyz(space.xyz.lms([10, 20, 30]))).map(round(0)), [10, 20, 30]);
});



test('lchab: lchab -> lab', function () {
	is((space.lchab.lab([69, 65, 137]).map(round(0))), [69, -48, 44]);
});

test('lchab: lchab -> xyz', function () {
	is((space.lchab.xyz([69, 65, 137]).map(round(0))), [25, 39, 15]);
});

test('lchab: lchab -> rgb', function () {
	is((space.lchab.rgb([69, 65, 137]).map(round(0))), [98, 188, 83]);
});

test('lchab: rgb -> lchab', function () {
	is((space.rgb.lchab([92, 191, 84]).map(round(0))), [70, 67, 138]);
});



test('luv: rgb -> luv', function () {
	is((space.rgb.luv([0, 0, 0]).map(round(0))), [0, 0, 0]);
	is((space.rgb.luv([10, 0, 0]).map(round(0))), [1, 2, 0]);
	is((space.rgb.luv([100, 0, 0]).map(round(0))), [19, 62, 13]);
	is((space.rgb.luv([255, 0, 0]).map(round(0))), [53, 175, 38]);
	is((space.rgb.luv([0, 255, 0]).map(round(0))), [88, -83, 107]);
	is((space.rgb.luv([0, 0, 255]).map(round(0))), [32, -9, -130]);
	is((space.rgb.luv([0, 255, 255]).map(round(0))), [91, -70, -15]);
	is((space.rgb.luv([255, 255, 255]).map(round(0))), [100, 0, 0]);
});

test('luv: luv -> rgb', function () {
	is((space.luv.rgb([0, 0, 0]).map(round(0))), [0, 0, 0]);
	is((space.luv.rgb([0, -134, -140]).map(round(0))), [0, 0, 0]);
	is((space.luv.rgb([90, 128, 100]).map(round(0))), [255, 189, 0]);
	is((space.luv.rgb([50, -134, 122]).map(round(0))), [0, 159, 0]);
});

test('luv: xyz -> luv', function () {
	is((space.xyz.luv([0, 0, 0]).map(round(0))), [0, 0, 0]);
	is((space.xyz.luv([95, 100, 100]).map(round(0))), [100, 4, 9]);
	is((space.xyz.luv([50, 50, 50]).map(round(0))), [76, 13, 5]);
	is((space.xyz.luv([100, 0, 0]).map(round(0))), [0, 0, 0]);
	is((space.xyz.luv([0, 100, 0]).map(round(0))), [100, -257, 171]);
	is((space.xyz.luv([0, 0, 100]).map(round(0))), [0, 0, 0]);
	is((space.xyz.luv([95, 0, 100]).map(round(0))), [0, 0, 0]);
});

test('luv: luv -> xyz', function () {
	is((space.luv.xyz([0, 0, 0]).map(round(0))), [0, 0, 0]);
	is((space.luv.xyz([50, -50, -50]).map(round(0))), [13, 18, 45]);
	is((space.luv.xyz([50, 50, 50]).map(round(0))), [21, 18, 2]);
});



test('lchuv: luv <-> lchuv', function () {
	is(space.lchuv.luv(space.luv.lchuv([0, 0, 0])).map(round(0)), [0, 0, 0]);
	is(space.lchuv.luv(space.luv.lchuv([50, -50, -50])).map(round(0)), [50, -50, -50]);
	is(space.lchuv.luv(space.luv.lchuv([50, 50, 50])).map(round(0)), [50, 50, 50]);
	is(space.lchuv.luv(space.luv.lchuv([100, 0, 0])).map(round(0)), [100, 0, 0]);
});



const _hsluv = space.hsluv._hsluv
test('hsluv: lch -> luv ≡ lchuv -> luv', function () {
	is((_hsluv.lchToLuv([1, 20, 40])), (space.lchuv.luv([1, 20, 40])));
	is((_hsluv.lchToLuv([21, 50, 40])), (space.lchuv.luv([21, 50, 40])));
	is((_hsluv.lchToLuv([25, 30, 43])), (space.lchuv.luv([25, 30, 43])));
});

test('hsluv: luv -> xyz ≡ luv -> xyz ', function () {
	is((_hsluv.luvToXyz([21, 50, 40]).map(v => v * 100).map(round(1))), (space.luv.xyz([21, 50, 40])).map(round(1)) );
	is((_hsluv.luvToXyz([1, 20, 40]).map(v => v * 100).map(round(1))), (space.luv.xyz([1, 20, 40])).map(round(1)) );
	is((_hsluv.luvToXyz([25, 30, 43]).map(v => v * 100).map(round(1))), (space.luv.xyz([25, 30, 43])).map(round(1)) );
});

test('hsluv: xyz -> rgb ≡ xyz -> rgb', function () {
	is(_hsluv.xyzToRgb([33, 40, 50].map(v => v / 100)).map(v => v * 255).map(v => Math.max(v,0)), space.xyz.rgb([33, 40, 50]));
	is(_hsluv.xyzToRgb([1, 20, 40].map(v => v / 100)).map(v => v * 255).map(v => Math.max(v,0)), space.xyz.rgb([1, 20, 40]));
	is(_hsluv.xyzToRgb([25, 30, 43].map(v => v / 100)).map(v => v * 255).map(v => Math.max(v,0)), space.xyz.rgb([25, 30, 43]));
});

test('hsluv: lch -> rgb ≡ lchuv -> rgb', function () {
	is(
		((_hsluv.lchToRgb([1, 20, 40]).map(v => v * 255)), 0),
		((space.lchuv.rgb([1, 20, 40])), 0)
	);
	is(
		((_hsluv.lchToRgb([25, 30, 43]).map(v => v * 255)), 0),
		((space.lchuv.rgb([25, 30, 43])), 0)
	);
	is(
		((_hsluv.lchToRgb([33, 40, 50]).map(v => v * 255)), 0),
		((space.lchuv.rgb([33, 40, 50])), 0)
	);
});

test('hsluv: _hsluv -> rgb ≡ hsluv -> rgb', function () {
	is((_hsluv.hsluvToRgb([25, 30, 43]).map(v => v * 255)).map(round(2)), (space.hsluv.rgb([25, 30, 43])).map(round(2)));
});


test.todo('hpluv', function () {
// 	test('x: hpluv -> rgb', function () {
	});
	test('x: hpluv -> xyz', function () {
	});


test.todo('ciecam', function () {
// 	test('x: to rgb', function () {
	});
	test('x: to xyz', function () {
	});
	test('x: to ', function () {
	});


test.todo('cmy', function () {
// 	test('x: to rgb', function () {
	});
	test('x: to xyz', function () {
	});
	test('x: to ', function () {
	});


test('yiq: yiq -> rgb', function () {
	is((space.yiq.rgb([0, 0, 0])), [0, 0, 0]);
	is((space.yiq.rgb([1, 0, 0]).map(round(3))), [255, 255, 255]);
	is((space.yiq.rgb([0.299, 0.596, 0.212]).map(round(3))), [255, 0, 0.023]);
});

test('yiq: rgb -> yiq', function () {
	is((space.rgb.yiq([0, 0, 0]).map(round(3))), [0, 0, 0]);
	is((space.rgb.yiq([255, 255, 255]).map(round(3))), [1, 0, 0]);
	is((space.rgb.yiq([255, 0, 0]).map(round(3))), [0.299, 0.596, 0.212]);
});



test('yuv: yuv -> rgb', function () {
	is((space.yuv.rgb([0, 0, 0])), [0, 0, 0]);
	is((space.yuv.rgb([1, 0, 0]).map(round(0))), [255, 255, 255]);
	is((space.yuv.rgb([0.299, -0.147, 0.615]).map(round(1))), [255, 0, 0.4]);
});

test('yuv: rgb -> yuv', function () {
	is((space.rgb.yuv([0, 0, 0])), [0, 0, 0]);
	is((space.rgb.yuv([255, 255, 255]).map(round(3))), [1, 0, 0]);
	is((space.rgb.yuv([255, 0, 0]).map(round(3))), [0.299, -0.147, 0.615]);
});



test('ydbdr: ydbdr -> rgb', function () {
	is((space.ydbdr.rgb([0, 0, 0])), [0, 0, 0]);
	is((space.ydbdr.rgb([1, 0, 0])), [255, 255, 255]);

	is((space.ydbdr.rgb(space.rgb.ydbdr([10, 20, 30])).map(round(0))), [10, 20, 30]);
});

test('ydbdr: rgb -> ydbdr', function () {
	is((space.rgb.ydbdr([0, 0, 0])), [0, 0, 0]);
	is((space.rgb.ydbdr([255, 255, 255]).map(round(0))), [1, 0, 0]);
});

test('ydbdr: yuv <-> ydbdr', function () {
	is((space.yuv.ydbdr([1, 0, 0])), [1, 0, 0]);
	is((space.ydbdr.yuv([1, 0, 0])), [1, 0, 0]);
});



test('ycgco: ycgco -> rgb', function () {
	is((space.ycgco.rgb([0, 0, 0])), [0, 0, 0]);
	is((space.ycgco.rgb([1, 0, 0])), [255, 255, 255]);
	is((space.ycgco.rgb([0.25, -0.25, 0.5])), [255, 0, 0]);

	is((space.ycgco.rgb(space.rgb.ycgco([10, 20, 30]))), [10, 20, 30]);
});

test('ycgco: rgb -> ycgco', function () {
	is((space.rgb.ycgco([0, 0, 0])), [0, 0, 0]);
	is((space.rgb.ycgco([255, 255, 255])), [1, 0, 0]);
	is((space.rgb.ycgco([255, 0, 0])), [0.25, -0.25, 0.5]);
});



test('ypbpr: ypbpr -> rgb', function () {
	is((space.ypbpr.rgb([0, 0, 0]).map(round(0))), [0, 0, 0]);
	is((space.ypbpr.rgb([0.715, -0.385, -0.454]).map(round(1))), [0, 254.9, 0.2]);
	is((space.ypbpr.rgb([1, 0, 0]).map(round(0))), [255, 255, 255]);
	is((space.ypbpr.rgb(space.rgb.ypbpr([0.10, 0.20, 0.30]))).map(round(1)), [0.10, 0.20, 0.30]);
});

test('ypbpr: rgb -> ypbpr', function () {
	is((space.rgb.ypbpr([0, 0, 0]).map(round(1))), [0, 0, 0]);
	is((space.rgb.ypbpr([127, 127, 127]).map(round(1))), [0.5, 0, 0]);
	is((space.rgb.ypbpr([255, 255, 255]).map(round(1))), [1, 0, 0]);

	is((space.rgb.ypbpr([0, 255, 0]).map(round(3))), [0.715, -0.385, -0.454]);
	is((space.rgb.ypbpr([255, 0, 0]).map(round(3))), [0.213, -0.115, 0.5]);
});

test('ypbpr: yuv <-> ypbpr', function () {
	is((space.yuv.ypbpr([1, 0, 0]).map(round(1))), [1, 0, 0]);
	is((space.ypbpr.yuv([1, 0, 0]).map(round(1))), [1, 0, 0]);
});



test('yccbccrc: yccbccrc -> rgb', function () {
	is((space.yccbccrc.rgb([0, 0, 0])), [0, 0, 0]);
	// is((space.yccbccrc.rgb([0.715, -0.385, -0.454])), [0, 255, 0]);
	is((space.yccbccrc.rgb([1, 0, 0])), [255, 255, 255]);
	is((space.yccbccrc.rgb(space.rgb.yccbccrc([0.10, 0.20, 0.30]))), [0.10, 0.20, 0.30]);
});

test('yccbccrc: rgb -> yccbccrc', function () {
	is((space.rgb.yccbccrc([0, 0, 0]).map(round(1))), [0, 0, 0]);
	is((space.rgb.yccbccrc([127, 127, 127]).map(round(1))), [0.5, 0, 0]);
	is((space.rgb.yccbccrc([255, 255, 255]).map(round(1))), [1, 0, 0]);

	// is((space.rgb.yccbccrc([0, 255, 0])), [0.715, -0.385, -0.454]);
	// is((space.rgb.yccbccrc([255, 0, 0])), [0.213, -0.115, 0.5]);
});



test('ycbcr: ycbcr -> rgb', function () {
	is((space.ycbcr.rgb([16, 128, 128])), [0, 0, 0]);
	is((space.ycbcr.rgb([235, 128, 128])), [255, 255, 255]);

	is((space.ycbcr.rgb(space.rgb.ycbcr([10, 20, 30])).map(round(0))), [10, 20, 30]);
});

test('ycbcr: rgb -> ycbcr', function () {
	is((space.rgb.ycbcr([0, 0, 0])), [16, 128, 128]);
	is((space.rgb.ycbcr([255, 255, 255])), [235, 128, 128]);
});

test('ycbcr: ypbpr <-> ycbcr', function () {
	is((space.ypbpr.ycbcr([1, -0.5, -0.5])), [235, 16, 16]);
	is((space.ypbpr.ycbcr([1, 0.5, 0.5])), [235, 240, 240]);

	is((space.ycbcr.ypbpr([235, 16, 16])), [1, -0.5, -0.5]);
	is((space.ycbcr.ypbpr([235, 240, 240])), [1, 0.5, 0.5]);
});



test('xvycc: xvycc -> rgb', function () {
	is((space.xvycc.rgb([16, 128, 128])), [0, 0, 0]);
	is((space.xvycc.rgb([235, 128, 128])), [255, 255, 255]);

	is((space.xvycc.rgb(space.rgb.xvycc([10, 20, 30])).map(round(0))), [10, 20, 30]);
});

test('xvycc: rgb -> xvycc', function () {
	is((space.rgb.xvycc([0, 0, 0])), [16, 128, 128]);
	is((space.rgb.xvycc([255, 255, 255])), [235, 128, 128]);
});

test('xvycc: ypbpr <-> xvycc', function () {
	is((space.ypbpr.xvycc([1, -0.5, -0.5])), [235, 16, 16]);
	is((space.ypbpr.xvycc([1, 0.5, 0.5])), [235, 240, 240]);

	is((space.xvycc.ypbpr([235, 16, 16])), [1, -0.5, -0.5]);
	is((space.xvycc.ypbpr([235, 240, 240])), [1, 0.5, 0.5]);
});



test('jpeg: jpeg -> rgb', function () {
	is((space.jpeg.rgb([0, 128, 128])), [0, 0, 0]);
	is((space.jpeg.rgb([255, 128, 128])), [255, 255, 255]);

	is((space.jpeg.rgb(space.rgb.jpeg([10, 20, 30])).map(round(0))), [10, 20, 30]);
});

test('jpeg: rgb -> jpeg', function () {
	is((space.rgb.jpeg([0, 0, 0])), [0, 128, 128]);
	is((space.rgb.jpeg([255, 255, 255]).map(round(0))), [255, 128, 128]);
});



test('ucs: ucs -> xyz', function () {
	// is((space.xyz([0, 0, 0])), [0, 0, 0]);
	// is((space.xyz([1, 0, 0])), [1, 1, 1]);
	is((space.ucs.xyz(space.xyz.ucs([10, 20, 30]))), [10, 20, 30]);
});

test.skip('ucs: xyz -> ucs', function () {
	// is((space.xyz.ucs([0, 0, 0])), [0, 0, 0]);
	// is((space.xyz.ucs([1, 1, 1])), [1, 0, 0]);
});



test('uvw: uvw -> xyz', function () {
	// is((space.uvw.xyz([0, 0, 0])), [0, 0, 0]);
	// is((space.uvw.xyz([1, 0, 0])), [1, 1, 1]);

	is((space.uvw.xyz(space.xyz.uvw([10, 20, 30]))).map(round(0)), [10, 20, 30]);
});

test.todo('uvw: xyz -> uvw', function () {
	// is((space.xyz.uvw([0, 0, 0])), [0, 0, 0]);
	// is((space.xyz.uvw([1, 1, 1])), [1, 0, 0]);
});



test('cubehelix: paint', function () {
	if (typeof document === 'undefined') return;

	var cnv = document.createElement('canvas');
	cnv.width = 400;
	cnv.height = 30;
	document.body.appendChild(cnv);

	var ctx = cnv.getContext('2d');

	for (var i = 0; i < 1; i += 0.01) {
		ctx.fillStyle = 'rgb(' + space.cubehelix.rgb(i, {
			rotation: 1,
			start: 0,
			hue: 1
		}).map(round(0)) + ')';
		ctx.fillRect(i * cnv.width, 0, 4, cnv.height);
	}
});



test.todo('osaucs -> xyy', function () {
	// is((space.osaucspace.xyy([0,-4,-4])), [33.71, 26.46, 46.66]);
	// is((space.osaucspace.xyy([-8,-6,+2])), [1.773902, 1.049996, 7.893570]);
	// is((space.osaucspace.xyy(space.xyy.osaucs([10,20,30]))), [10,20,30]);
});

test('osaucs: xyy -> osaucs', function () {
	is((space.xyz.osaucs([33.71, 26.46, 46.66]).map(round(0))), [0, -4, -5]);
	is((space.xyz.osaucs([1.773902, 1.049996, 7.893570]).map(round(1))), [-8.2, -7.3, +1.2]);
});



test('coloroid: coloroid -> xyz', function () {
	is((space.coloroid.xyz([21, 39, 70]).map(round(0))), [56, 49.0, 19]);
	is((space.coloroid.xyz([61, 0, 90]).map(round(0))), [81, 81, 84]);
	is((space.coloroid.xyz([35, 10, 90]).map(round(0))), [85, 81, 86]);

	//coloroid looses color info via binding hue
	// is((space.coloroid.xyz(space.xyz.coloroid([10,20,30]))), [10,20,30]);
});

test('coloroid: xyz -> coloroid', function () {
	is((space.xyz.coloroid([54.64, 64.0, 18.26]).map(round(0))), [10, 48, 80]);
	is((space.xyz.coloroid([54.2, 49.0, 17.6]).map(round(0))), [21, 39, 70]);
});

test('coloroid: paint side colors', function () {
	if (typeof document === 'undefined') return;

	var cnv = document.createElement('canvas');
	cnv.width = 400;
	cnv.height = 30;
	document.body.appendChild(cnv);
	var ctx = cnv.getContext('2d');

	//paint coloroid side colors
	var range = space.coloroid.table.length, w = cnv.width / range;
	var row, vals;
	for (var i = 0; i < range; i++) {
		row = space.coloroid.table[i];
		vals = row.slice(-3).map(function (v) {
			return v * 100
		});
		ctx.fillStyle = 'rgb(' + space.xyz.rgb(vals).map(round(0)) + ')';
		ctx.fillRect(i * w, 0, Math.ceil(w), cnv.height);
	}
});

test('coloroid: paint conversion from hue', function () {
	if (typeof document === 'undefined') return;

	var cnv = document.createElement('canvas');
	cnv.width = 400;
	cnv.height = 30;
	document.body.appendChild(cnv);
	var ctx = cnv.getContext('2d');

	var range = space.coloroid.table.length, w = cnv.width / range;
	var row, vals;
	for (var i = 0; i < range; i++) {
		row = space.coloroid.table[i];
		vals = space.coloroid.rgb([row[0], 30, 30]);

		ctx.fillStyle = 'rgb(' + vals.map(round(0)) + ')';
		ctx.fillRect(i * w, 0, Math.ceil(w), 10);
	}
	for (var i = 0; i < range; i++) {
		row = space.coloroid.table[i];
		vals = space.coloroid.rgb([row[0], 50, 50]);

		ctx.fillStyle = 'rgb(' + vals.map(round(0)) + ')';
		ctx.fillRect(i * w, 10, Math.ceil(w), 20);
	}
	for (var i = 0; i < range; i++) {
		row = space.coloroid.table[i];
		vals = space.coloroid.rgb([row[0], 70, 70]);

		ctx.fillStyle = 'rgb(' + vals.map(round(0)) + ')';
		ctx.fillRect(i * w, 20, Math.ceil(w), 30);
	}
});



test('tsl: tsl -> rgb', function () {
	is(space.rgb.tsl([0, 0, 0]).map(round(3)), [0.875, 0.632, 0]);
	is(space.rgb.tsl([255, 255, 255]).map(round(3)), [0, 0, 1]);
	is(space.rgb.tsl([10, 20, 30]).map(round(3)), [0, 0.224, 0.071]);
});

test.todo('tsl: rgb -> tsl', function () {
	// is((space.rgb.tsl([0, 0, 0])), [0, 0, 0]);
	// is((space.rgb.tsl([1, 1, 1])), [1, 0, 0]);
});



test('hsm: hsm <-> rgb', function () {
	is(space.hsm.rgb(space.rgb.hsm([255, 0, 0])).map(round(0)), [255, 0, 0]);
	is(space.hsm.rgb(space.rgb.hsm([0, 255, 0])).map(round(0)), [0, 255, 0]);
	is(space.hsm.rgb(space.rgb.hsm([0, 0, 255])).map(round(0)), [0, 0, 255]);
	is(space.hsm.rgb(space.rgb.hsm([255, 255, 255])).map(round(0)), [255, 255, 255]);
	is(space.hsm.rgb(space.rgb.hsm([0, 0, 0])).map(round(0)), [0, 0, 0]);
	is(space.hsm.rgb(space.rgb.hsm([128, 128, 128])).map(round(0)), [128, 128, 128]);
});

test('hsm: rgb -> hsm', function () {
	is(space.rgb.hsm([255, 0, 0]).map(round(2)), [0, 1, 0.57]);
	is(space.rgb.hsm([0, 255, 0]).map(round(2)), [0.33, 1.03, .29]);
	is(space.rgb.hsm([0, 0, 255]).map(round(2)), [0.65, .13, 0.14]);
	is(space.rgb.hsm([255, 255, 255]).map(round(2)), [0.25, 0, 1]);
	is(space.rgb.hsm([0, 0, 0]).map(round(2)), [0.25, 0, 0]);
	is(space.rgb.hsm([128, 128, 128]).map(round(2)), [0.25, 0, 0.5]);
});

test('hsm: rgb -> hsm', function () {
	is(space.hsm.rgb([0, 1, 0.57]).map(round(0)), [254, 0, 0]);
	is(space.hsm.rgb([1/3, 1, 2/7]).map(round(0)), [1, 251, 4]);
	is(space.hsm.rgb([0.65, .13, 0.14]).map(round(0)), [0, 0, 255]);
	is(space.hsm.rgb([0.25, 0, 1]).map(round(0)), [255, 255, 255]);
	is(space.hsm.rgb([0.25, 0, 0]).map(round(0)), [0, 0, 0]);
	is(space.hsm.rgb([0.25, 0, 0.5]).map(round(0)), [128, 128, 128]);
});



test.todo('yes: yes <-> rgb', function () {
	is(space.rgb.yes([0, 0, 0]), [0, 0, 0]);
	is(space.rgb.yes([255, 255, 255]), [1, 0, 0]);
	// is(space.yes.rgb(space.rgb.yes([10, 20, 30]).map(round(1))), [10, 20, 30]);
});


test("oklab: oklab -> rgb", () => {
	is(space.rgb.oklab(color.white).map(round(6)), [1.0, 0.0, 0.0]),
	is(space.rgb.oklab(color.red).map(round(6)), [0.627955, 0.224863, 0.125846]),
	is(space.rgb.oklab(color.lime).map(round(6)), [0.86644, -0.233888, 0.179498]),
	is(space.rgb.oklab(color.blue).map(round(6)), [0.452014, -0.032457, -0.311528]),
	is(space.rgb.oklab(color.cyan).map(round(6)), [0.905399, -0.149444, -0.039398]),
	is(space.rgb.oklab(color.magenta).map(round(6)), [0.701674, 0.274566, -0.169156]),
	is(space.rgb.oklab(color.yellow).map(round(6)), [0.967983, -0.071369, 0.19857]),
	is(space.rgb.oklab(color.black).map(round(6)), [0.0, 0.0, 0.0])
})

test("oklab: rgb -> oklab", () => {
	is(space.oklab.rgb([1.0, 0.0, 0.0]).map(round(0)), color.white),
	is(space.oklab.rgb([0.627955, 0.224863, 0.125846]).map(round(0)), color.red),
	is(space.oklab.rgb([0.86644, -0.233888, 0.179498]).map(round(0)), color.lime),
	is(space.oklab.rgb([0.452014, -0.032457, -0.311528]).map(round(0)), color.blue),
	is(space.oklab.rgb([0.905399, -0.149444, -0.039398]).map(round(0)), color.cyan),
	is(space.oklab.rgb([0.701674, 0.274566, -0.169156]).map(round(0)), color.magenta),
	is(space.oklab.rgb([0.967983, -0.071369, 0.19857]).map(round(0)), color.yellow),
	is(space.oklab.rgb([0.0, 0.0, 0.0]).map(round(0)), color.black)
})

test.todo("oklab: oklab -> xyz", () => {
	is(space.xyz.oklab([0.950,	1.000,	1.089]).map(round(6)), [1.000,	0.000,	0.000])
	is(space.xyz.oklab([1.000,	0.000,	0.000]).map(round(6)), [0.450,	1.236,	-0.019])
	is(space.xyz.oklab([0.000,	1.000,	0.000]).map(round(6)), [0.922,	-0.671,	0.263])
	is(space.xyz.oklab([0.000,	0.000,	1.000]).map(round(6)), [0.153,	-1.415,	-0.449])
})

test.todo("oklab: xyz -> oklab", () => {
	is(space.oklab.xyz([1.0, 0.0, 0.0]).map(round(0)), color.white),
	is(space.oklab.xyz([0.627955, 0.224863, 0.125846]).map(round(0)), color.red),
	is(space.oklab.xyz([0.86644, -0.233888, 0.179498]).map(round(0)), color.lime),
	is(space.oklab.xyz([0.452014, -0.032457, -0.311528]).map(round(0)), color.blue),
	is(space.oklab.xyz([0.905399, -0.149444, -0.039398]).map(round(0)), color.cyan),
	is(space.oklab.xyz([0.701674, 0.274566, -0.169156]).map(round(0)), color.magenta),
	is(space.oklab.xyz([0.967983, -0.071369, 0.19857]).map(round(0)), color.yellow),
	is(space.oklab.xyz([0.0, 0.0, 0.0]).map(round(0)), color.black)
})
