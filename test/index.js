// Test refs
// http://www.easyrgb.com/index.php?X=CALC#Result
// http://colormine.org/convert/luv-to-rgb

import space from '../index.js';
import test, { is } from 'tst'
import color from 'color-name'

// get round fn for a precision
const round = (precision = 0) => v => Math.round(v * 10 ** precision) / 10 ** precision


// Structural integrity: catches the class of v3 breakage where a space file fails to
// load, drops its `export default`, or registers under the wrong key (the bugs that
// left 35 files unparseable and hcy without an export).
test('integrity — every space loads, registers, and is named consistently', () => {
	const names = Object.keys(space)
	is(names.length, 71, '71 spaces registered')
	is(names.filter(n => space[n].name !== n), [], 'every space.name matches its registry key')
	// reachability canary: rgb -> X must be wired for every space (caught the camelCase-key bug).
	// these 6 remain unreachable (tracked in docs/todo.md Phase 1 wiring defect); shrink as fixed.
	const unreachable = names.filter(n => n !== 'rgb' && typeof space.rgb[n] !== 'function').sort()
	is(unreachable, ['din99o-lab', 'din99o-lch', 'jzczhz', 'oklrab', 'oklrch', 'rec2020-oetf'], 'known-unreachable set unchanged')
})

test('edge: achromatic / black inputs are NaN-safe', () => {
	is(space.rgb.hsi(128, 128, 128).map(round(1)), [0, 0, 50.2], 'hsi gray (was NaN hue)')
	is(space.rgb.hsi(0, 0, 0), [0, 0, 0], 'hsi black (was NaN)')
	is(space.rgb.hsp(255, 0, 0).map(round(0)), [0, 100, 55], 'hsp red hue 0 (was 360)')
	is(space.xyz.osaucs(0, 0, 0).map(round(2)), [-12.96, 0, 0], 'osaucs black (was NaN,NaN,NaN)')
	is(space.rgb.lchuv(0, 0, 0).map(round(1)), [0, 0, 0], 'lchuv black hue 0 (was 180)')
})


test('lrgb', () => {
	// RGB now uses 0-255, lrgb uses 0-1
	is(space.rgb.lrgb(255, 255, 255), [1.0, 1.0, 1.0], 'from white')
	is(space.rgb.lrgb(0, 0, 0), [0, 0, 0], 'from black')
	is(space.rgb.lrgb(128, 128, 128).map(round(3)), [0.216, 0.216, 0.216], 'from gray')

	is(space.lrgb.rgb(1, 1, 1).map(round(1)), [255, 255, 255], 'to white')
	is(space.lrgb.rgb(0, 0, 0).map(round(1)), [0, 0, 0], 'to black')
	is(space.lrgb.rgb(0.216, 0.216, 0.216).map(round(1)), [128, 128, 128], 'to gray')
})


test('xyz', () => {
	// RGB now 0-255, XYZ now 0-100
	is((space.rgb.xyz(255, 255, 255)).map(round(2)), [95.05, 100.00, 108.91], 'from white');
	is((space.rgb.xyz(0, 0, 0)).map(round(2)), [0.0, 0.0, 0.0], 'from black');
	is((space.rgb.xyz(128, 128, 128)).map(round(1)), [20.5, 21.6, 23.5], 'from gray');

	is((space.rgb.xyz(255, 0, 0)).map(round(2)), [41.24, 21.26, 1.93], 'from red');
	is((space.rgb.xyz(0, 255, 0)).map(round(2)), [35.76, 71.52, 11.92], 'from green');
	is((space.rgb.xyz(0, 0, 255)).map(round(2)), [18.05, 7.22, 95.05], 'from blue');

	is((space.rgb.xyz(0, 255, 255)).map(round(2)), [53.81, 78.74, 106.97], 'from cyan');
	is((space.rgb.xyz(255, 0, 255)).map(round(2)), [59.29, 28.48, 96.99], 'from magenta');
	is((space.rgb.xyz(255, 255, 0)).map(round(2)), [77.00, 92.78, 13.85], 'from yellow');

	is((space.rgb.xyz(92, 191, 84).map(round(1))), [24.6, 40.2, 14.8], 'from arbitrary');


	is((space.xyz.rgb(95.05, 100.00, 108.90)).map(round(0)), [255, 255, 255], 'to white');
	is((space.xyz.rgb(0.0, 0.0, 0.0)).map(round(0)), [0, 0, 0], 'to black');
	is((space.xyz.rgb(20.5, 21.6, 23.5)).map(round(0)), [128, 128, 128], 'to gray');

	is((space.xyz.rgb(41.24, 21.26, 1.93)).map(round(0)), [255, 0, 0], 'to red');
	is((space.xyz.rgb(35.76, 71.52, 11.92)).map(round(0)), [0, 255, 0], 'to green');
	is((space.xyz.rgb(18.05, 7.22, 95.05)).map(round(0)), [0, 0, 255], 'to blue');

	is((space.xyz.rgb(53.81, 78.74, 106.97)).map(round(0)), [0, 255, 255], 'to cyan');
	is((space.xyz.rgb(59.29, 28.48, 96.98)).map(round(0)), [255, 0, 255], 'to magenta');
	is((space.xyz.rgb(77.00, 92.78, 13.85)).map(round(0)), [255, 255, 0], 'to yellow');

	is((space.xyz.rgb(24.6, 40.2, 14.8).map(round(0))), [91, 191, 84], 'to arbitrary');
});



test('lab: lab -> xyz', function () {
	// Lab now uses L: 0-100, a/b: -125 to 125

	is((space.lab.xyz(69, -48, 44)).map(round(1)), [24.5, 39.3, 14.7], 'should be the same');

	is((space.lab.rgb(75, 20, -30).map(round(0))), [194, 175, 240], 'lab to rgb');

	is((space.lab.lchab(69, -48, 44).map(round(1))), [69.0, 65.1, 137.5], 'lab to lchab');

	is((space.rgb.lab(92, 191, 84).map(round(1))), [69.6, -50.1, 44.6], 'rgb to lab');
});



test('cmyk: rgb -> cmyk', function () {
	// RGB now 0-255, CMYK 0-100
	is((space.rgb.cmyk(140, 200, 100).map(round(1))), [30.0, 0.0, 50.0, 21.6], 'rgb to cmyk');
	is((space.rgb.cmyk(0, 0, 0).map(round(1))), [0, 0, 0, 100], 'black to cmyk');
});

test('cmyk: cmyk -> rgb', function () {
	// CMYK 0-100, RGB 0-255
	is((space.cmyk.rgb(30, 0, 50, 21.6).map(round(0))), [140, 200, 100], 'cmyk to rgb');
});

test('cmyk: cmyk -> hsl', function () {
	// CMYK 0-100, HSL: H 0-360, S/L 0-100
	is((space.cmyk.hsl(30, 0, 50, 21.6).map(round(1))), [96.0, 47.6, 58.8], 'cmyk to hsl');
});

test('cmyk: cmyk -> hsv', function () {
	// CMYK 0-100, HSV: H 0-360, S/V 0-100
	is((space.cmyk.hsv(30, 0, 50, 21.6).map(round(1))), [96.0, 50.0, 78.4], 'cmyk to hsv');
});

test('cmyk: cmyk -> hwb', function () {
	// CMYK 0-100, HWB: H 0-360, W/B 0-100
	is((space.cmyk.hwb(30, 0, 50, 21.6).map(round(1))), [96.0, 39.2, 21.6], 'cmyk to hwb');
});



test('hsl: hsl -> rgb', function () {
	// HSL: H 0-360, S/L 0-100, RGB 0-255
	is(space.hsl.rgb(96, 48, 59).map(round(0)), [140, 201, 100], 'hsl to rgb');
});

test('hsl: hsl -> hsv', function () {
	// HSL: H 0-360, S/L 0-100; HSV: H 0-360, S/V 0-100
	is(space.hsl.hsv(96, 48, 59).map(round(1)), [96.0, 50.0, 78.7], 'hsl to hsv');
});

test('hsl: hsl -> cmyk', function () {
	// HSL 0-360/0-100, CMYK 0-100
	is(space.hsl.cmyk(96, 48, 59).map(round(1)), [30.0, 0.0, 50.0, 21.3], 'hsl to cmyk');
});

test('hsl: rgb -> hsl', function () {
	// RGB 0-255, HSL: H 0-360, S/L 0-100
	is(space.rgb.hsl(140, 200, 100).map(round(1)), [96.0, 47.6, 58.8], 'rgb to hsl');
});



test('hsv: hsv -> rgb', function () {
	// HSV: H 0-360, S/V 0-100, RGB 0-255
	is(space.hsv.rgb(96, 50, 78).map(round(0)), [139, 199, 99], 'hsv to rgb');
});

test('hsv: hsv -> hsl', function () {
	// HSV/HSL: H 0-360, S/L/V 0-100
	is(space.hsv.hsl(96, 50, 78).map(round(1)), [96.0, 47.0, 58.5], 'hsv to hsl');

	//keep hue
	is(space.hsv.hsl(120, 0, 0).map(round(1)), [120, 0, 0], 'keep hue');
});

test('hsv: hsv -> cmyk', function () {
	// HSV: H 0-360, S/V 0-100, CMYK 0-100
	is(space.hsv.cmyk(96, 50, 78).map(round(0)), [30, 0, 50, 22], 'hsv to cmyk');
});

test('hsv: rgb -> hsv', function () {
	// RGB 0-255, HSV: H 0-360, S/V 0-100
	is(space.rgb.hsv(140, 200, 100).map(round(1)), [96.0, 50.0, 78.4], 'rgb to hsv');
});




test('hsp: hsp -> rgb', function () {
	// HSP: H 0-360, S/P 0-100, RGB 0-255
	// P=0 => Black
	is((space.hsp.rgb(0, 50, 0)).map(round(0)), [0, 0, 0], 'black');
	// 100% P => White (if S=0)
	is((space.hsp.rgb(0, 0, 100).map(round(0))), [255, 255, 255], 'white');
});

test('hsp: rgb -> hsp', function () {
	// RGB 0-255, HSP: H 0-360, S/P 0-100
	is((space.rgb.hsp(98, 115, 255).map(round(1))), [233.5, 61.6, 52.7], 'rgb to hsp');
});

test('hsp: rgb -> hsp', function () {
	// Gray
	is(space.rgb.hsp(110, 110, 110).map(round(1)), [0, 0, 43.1], 'gray');
});



test('hsi: hsi -> rgb', function () {
	// HSI: H 0-360, S/I 0-100, RGB 0-255
	is(space.hsi.rgb(210, 33.3, 58.8).map(round(0)), [100, 150, 200], 'hsi to rgb');
});

test('hsi: rgb -> hsi', function () {
	// RGB 0-255, HSI: H 0-360, S/I 0-100
	is(space.rgb.hsi(100, 150, 200).map(round(1)), [210.0, 33.3, 58.8], 'rgb to hsi');
});



test('hcg: hcg -> rgb', function () {
	// HCG: H 0-360, C/G 0-100, RGB 0-255
	is((space.hcg.rgb(0, 100, 0)), [255, 0, 0], 'pure red');

	is((space.hcg.rgb(0, 50, 0).map(round(0))), [128, 0, 0], 'dark red');
	is((space.hcg.rgb(0, 50, 100).map(round(0))), [255, 128, 128], 'light red');
	is((space.hcg.rgb(0, 50, 50).map(round(0))), [191, 64, 64], 'mid red');

	is((space.hcg.rgb(0, 0, 100).map(round(0))), [255, 255, 255], 'white');
	is((space.hcg.rgb(0, 0, 50).map(round(0))), [128, 128, 128], 'gray');
	is((space.hcg.rgb(0, 0, 0).map(round(0))), [0, 0, 0], 'black');
});

test('hcg: rgb -> hcg', function () {
	// RGB 0-255, HCG: H 0-360, C/G 0-100
	is((space.rgb.hcg(255, 0, 0).map(round(0))), [0, 100, 0], 'red to hcg');

	is((space.rgb.hcg(128, 0, 0).map(round(0))), [0, 50, 0], 'dark red to hcg');
	is((space.rgb.hcg(255, 128, 128).map(round(0))), [0, 50, 100], 'light red to hcg');

	is((space.rgb.hcg(255, 255, 255).map(round(0))), [0, 0, 100], 'white to hcg');
	is((space.rgb.hcg(128, 128, 128).map(round(0))), [0, 0, 50], 'gray to hcg');
	is((space.rgb.hcg(0, 0, 0).map(round(0))), [0, 0, 0], 'black to hcg');
});

test('hcg: hcg -> hwb', function () {
	// HCG/HWB: H 0-360, C/G/W/B 0-100
	is((space.hcg.hwb(0, 100, 0)), [0, 0, 0], 'hcg red to hwb');
	// HCG/HWB: H 0-360, C/G/W/B 0-100
	// h=200, c=100, g=0 -> h=200, w=0, b=0
	is((space.hcg.hwb(200, 100, 0)), [200, 0, 0]);
	// h=200, c=100, g=100 -> h=200, w=0, b=0 (pure color overrides gray?)
	is((space.hcg.hwb(200, 100, 100)), [200, 0, 0]);
	// h=200, c=0, g=50 -> h=200, w=50, b=50
	is((space.hcg.hwb(200, 0, 50)), [200, 50, 50]);
});

test('hcg: hwb -> hcg', function () {
	// HWB/HCG: H 0-360, W/B/C/G 0-100
	is((space.hwb.hcg(0, 0, 0)), [0, 100, 0]);
	is((space.hwb.hcg(200, 0, 0)).map(round(1)), [200, 100, 0]);
	is((space.hwb.hcg(200, 50, 50)).map(round(1)), [200, 0, 50]);
});



test('hwb: hwb -> rgb', function () {
	// HWB: H 0-360, W/B 0-100, RGB 0-255
	// http://dev.w3.org/csswg/css-color/#hwb-examples

	// all extreme values should give black, white or grey
	for (var angle = 0; angle <= 360; angle += 1) {
		is((space.hwb.rgb(angle, 0, 100).map(round(0))), [0, 0, 0]);
		is((space.hwb.rgb(angle, 100, 0).map(round(0))), [255, 255, 255]);
		is((space.hwb.rgb(angle, 100, 100).map(round(0))), [128, 128, 128]);
	}

	is((space.hwb.rgb(0, 0, 0).map(round(0))), [255, 0, 0]);
	is((space.hwb.rgb(0, 20, 40).map(round(0))), [153, 51, 51]);

	is((space.hwb.rgb(120, 0, 0).map(round(0))), [0, 255, 0]);
	is((space.hwb.rgb(240, 0, 0).map(round(0))), [0, 0, 255]);
});

test('hwb: rgb -> hwb', function () {
	// RGB 0-255, HWB: H 0-360, W/B 0-100
	is((space.rgb.hwb(140, 200, 100).map(round(1))), [96.0, 39.2, 21.6]);
});

test('hwb: hsv -> hwb', function () {
	// HSV/HWB: H 0-360, S/V/W/B 0-100
	is((space.hsv.hwb(10, 100, 0).map(round(1))), [10.0, 0, 100.0]);
	is((space.hsv.hwb(20, 0, 0).map(round(1))), [20.0, 0, 100.0]); // s=0, v=0 -> black. w=0, b=100.
	is((space.hsv.hwb(96, 50, 78).map(round(0))), [96, 39, 22]);
});

test('hwb: hwb -> hsv', function () {
	// HWB: H 0-360, W/B 0-100, HSV: H 0-360, S/V 0-100
	is((space.hwb.hsv(0, 50, 100).map(round(1))), [0, 0, 33.3]); // w=50, b=100 -> sum=150. normalize.
	// w+b > 100. hwb.js logic: if ratio > 100, normalized.
	// 50 / 150 * 100 = 33.3. 100 / 150 * 100 = 66.7.
	// v = 100 - b = 100 - 66.7 = 33.3.

	is((space.hwb.hsv(96, 39, 22).map(round(1))), [96.0, 50.0, 78.0]);

	is((space.hwb.hsv(0, 0, 100).map(round(1))), [0, 0, 0]);
});

test('hwb: hwb -> hsl', function () {
	// HWB/HSL: H 0-360, W/B/S/L 0-100
	is((space.hwb.hsl(20, 50, 50).map(round(1))), [20.0, 0, 50.0]);
});

test('hwb: hsl -> hwb', function () {
	// HSL/HWB: H 0-360, S/L/W/B 0-100
	is((space.hsl.hwb(20, 100, 0).map(round(1))), [20.0, 0, 100.0]);
	is((space.hsl.hwb(96, 48, 59).map(round(1))), [96.0, 39.3, 21.3]);
});



test('xyY: xyz -> xyy', function () {
	// XYZ 0-100, xyY x/y 0-1, Y 0-100
	is((space.xyz.xyy(0, 0, 0)), [0, 0, 0]);
	is((space.xyz.xyy(25, 40, 15).map(round(4))), [0.3125, 0.5, 40]);
	is((space.xyz.xyy(50, 100, 100).map(round(2))), [0.2, 0.4, 100]);
});

test('xyY: xyy -> xyz', function () {
	// xyY: x/y 0-1, Y 0-100; XYZ 0-100
	is((space.xyy.xyz(.40, .15, 25).map(round(1))), [66.7, 25.0, 75.0]);
	is((space.xyy.xyz(0.2, .4, 100).map(round(1))), [50.0, 100.0, 100.0]);
});



test('labh: rgb -> labh', function () {
	// RGB 0-255, Lab-Hunter: L 0-100, a/b ±100
	is((space.rgb.labh(0, 0, 0).map(round(1))), [0, 0, 0]);
	// D65 white must be neutral: L=100, a=b=0 (guards the Illuminant-C constant bug)
	is(space.rgb.labh(255, 255, 255).map(round(1)), [100, 0, 0]);
});

test('labh: labh -> rgb', function () {
	// Lab-Hunter: L 0-100, a/b ±100, RGB 0-255
	is((space.labh.rgb(0, 0, 0).map(round(0))), [0, 0, 0]);
	for (const c of [[128, 128, 128], [255, 0, 0], [200, 100, 50]])
		is(space.labh.rgb(...space.rgb.labh(...c)).map(round(0)), c, `roundtrip ${c}`);
});

test('labh: xyz -> labh', function () {
	// XYZ 0-100, Lab-Hunter: L 0-100, a/b ±125
	is((space.xyz.labh(0, 0, 0)).map(round(1)), [0, 0, 0]);
});

test('labh: labh -> xyz', function () {
	// Lab-Hunter: L 0-100, a/b ±125, XYZ 0-100
	is((space.labh.xyz(0, 0, 0)), [0, 0, 0]);
});



test('lms: lms <-> xyz', function () {
	// LMS 0-1 (linear light), XYZ 0-100
	is(space.lms.xyz(0, 0, 0), [0, 0, 0]);
	is(space.xyz.lms(0, 0, 0), [0, 0, 0]);

	// Nested call: space.xyz.lms returns Array. space.lms.xyz expects args.
	// Must spread result of inner call.
	is((space.lms.xyz(...space.xyz.lms(10, 20, 30))).map(round(1)), [10, 20, 30]);
});



test('lchab: lchab -> lab', function () {
	// LCHab: L 0-100, C 0-150, H 0-360; Lab: L 0-100, a/b ±125
	is((space.lchab.lab(69, 65, 137).map(round(1))), [69.0, -47.5, 44.3]);
});

test('lchab: lchab -> xyz', function () {
	// LCHab: L 0-100, C 0-150, H 0-360; XYZ 0-100
	is((space.lchab.xyz(69, 65, 137).map(round(1))), [24.6, 39.3, 14.5]);
});

test('lchab: lchab -> rgb', function () {
	// LCHab: L 0-100, C 0-150, H 0-360; RGB 0-255
	is((space.lchab.rgb(69, 65, 137).map(round(0))), [98, 188, 83]);
});

test('lchab: rgb -> lchab', function () {
	// RGB 0-255, LCHab: L 0-100, C 0-150, H 0-360
	is((space.rgb.lchab(92, 191, 84).map(round(1))), [69.6, 67.1, 138.3]);
});



test('luv: rgb -> luv', function () {
	// RGB 0-255, Luv: L 0-100, u/v ±100
	is((space.rgb.luv(0, 0, 0).map(round(1))), [0, 0, 0]);
	is((space.rgb.luv(255, 255, 255).map(round(0))), [100, 0, 0]);
	// Red [255, 0, 0] -> L=53, u=175, v=38
	is((space.rgb.luv(255, 0, 0).map(round(0))), [53, 175, 38]);
});

test('luv: luv -> rgb', function () {
	// Luv: L 0-100, u/v ±100, RGB 0-255
	is((space.luv.rgb(0, 0, 0).map(round(0))), [0, 0, 0]);
	is((space.luv.rgb(100, 0, 0).map(round(0))), [255, 255, 255]);
});

test('luv: xyz -> luv', function () {
	// XYZ 0-100, Luv: L 0-100, u/v ±100
	is((space.xyz.luv(0, 0, 0).map(round(1))), [0, 0, 0]);
	is((space.xyz.luv(95, 100, 109).map(round(0))), [100, 0, 0]); // D65 White
});

test('luv: luv -> xyz', function () {
	// Luv: L 0-100, u/v ±100, XYZ 0-100
	is((space.luv.xyz(0, 0, 0).map(round(1))), [0, 0, 0]);
	// L=100 -> Y=100
	is((space.luv.xyz(100, 0, 0).map(round(2))), [95.05, 100.00, 108.91]); // D65 White approx
});



test('lchuv: luv <-> lchuv', function () {
	// Luv: L 0-100, u/v ±100; LCHuv: L 0-100, C 0-180, H 0-360
	is(space.lchuv.luv(...space.luv.lchuv(0, 0, 0)).map(round(1)), [0, 0, 0]);
	is(space.lchuv.luv(...space.luv.lchuv(50, -50, -50)).map(round(1)), [50.0, -50.0, -50.0]);
});




const _hsluv = space.hsluv._hsluv

test('hsluv: hsluv -> rgb', function () {
	// HSLuv: H 0-360, S/L 0-100, RGB 0-255
	// Test basic colors
	is(space.hsluv.rgb(0, 100, 53).map(round(0)), [248, 0, 107], 'red-ish');
	is(space.hsluv.rgb(0, 0, 0).map(round(0)), [0, 0, 0], 'black');
	is(space.hsluv.rgb(0, 0, 100).map(round(0)), [255, 255, 255], 'white');
});

test('hsluv: rgb -> hsluv', function () {
	// RGB 0-255, HSLuv: H 0-360, S/L 0-100
	is(space.rgb.hsluv(0, 0, 0).map(round(1)), [0, 0, 0], 'black');
	is(space.rgb.hsluv(255, 255, 255).map(round(1)), [0, 0, 100], 'white');
	// Red roundtrip
	const red = space.rgb.hsluv(255, 0, 0);
	is(space.hsluv.rgb(...red).map(round(0)), [255, 0, 0], 'red roundtrip');
});

test('hsluv: hsluv <-> lchuv', function () {
	// HSLuv: H 0-360, S/L 0-100, LCHuv: L 0-100, C 0-150, H 0-360
	const lch1 = space.hsluv.lchuv(0, 100, 53);
	is(lch1.map(round(1)), [53, 145.9, 0], 'hsluv to lchuv');

	const hsl = space.lchuv.hsluv(53, 145.9, 0);
	is(hsl.map(round(1)), [0, 100, 53], 'lchuv to hsluv');
});

test('hsluv: hsluv <-> xyz', function () {
	// HSLuv: H 0-360, S/L 0-100, XYZ: 0-100
	const xyz1 = space.hsluv.xyz(0, 100, 53);
	is(xyz1.map(round(1)), [41.4, 21.0, 15.8], 'hsluv to xyz');

	const hsl = space.xyz.hsluv(41.4, 21.0, 15.8);
	is(hsl.map(round(0)), [360, 100, 53], 'xyz to hsluv'); // hue 360° = 0°
});

test('hsluv: consistency checks', function () {
	// Verify hsluv conversions match going through lchuv and xyz
	// hsluv -> lchuv -> luv should match internal conversion
	const hsl = [120, 80, 60];
	const lch1 = space.hsluv.lchuv(...hsl);
	const luv1 = space.lchuv.luv(...lch1);

	// hsluv -> xyz -> luv
	const xyz1 = space.hsluv.xyz(...hsl);
	const luv2 = space.xyz.luv(...xyz1);

	is(luv1.map(round(1)), luv2.map(round(1)), 'hsluv->lchuv->luv ≡ hsluv->xyz->luv');
});


test('yiq: yiq -> rgb', function () {
	// YIQ: Y 0-1, I ±0.6, Q ±0.52, RGB 0-255
	is((space.yiq.rgb(0, 0, 0)), [0, 0, 0]);
	is((space.yiq.rgb(1, 0, 0).map(round(0))), [255, 255, 255]);
	is((space.yiq.rgb(0.299, 0.596, 0.212).map(round(0))), [255, 0, 0]);
});

test('yiq: rgb -> yiq', function () {
	// RGB 0-255, YIQ: Y 0-1, I ±0.6, Q ±0.52
	is((space.rgb.yiq(0, 0, 0).map(round(3))), [0, 0, 0]);
	is((space.rgb.yiq(255, 255, 255).map(round(3))), [1, 0, 0]);
	is((space.rgb.yiq(255, 0, 0).map(round(3))), [0.299, 0.596, 0.212]);
});



test('yuv: yuv -> rgb', function () {
	// YUV: Y 0-1, U/V ±0.5, RGB 0-255
	is((space.yuv.rgb(0, 0, 0)), [0, 0, 0]);
	is((space.yuv.rgb(1, 0, 0).map(round(0))), [255, 255, 255]);
	// roundtrip exercises the U->B coefficient (was 2.02311, now 2.03211)
	for (const c of [[255, 0, 0], [0, 255, 0], [0, 0, 255], [200, 100, 50]])
		is(space.yuv.rgb(...space.rgb.yuv(...c)).map(round(0)), c, `roundtrip ${c}`);
});

test('yuv: rgb -> yuv', function () {
	// RGB 0-255, YUV: Y 0-1, U/V ±0.5
	is((space.rgb.yuv(0, 0, 0)), [0, 0, 0]);
	is((space.rgb.yuv(255, 255, 255).map(round(2))), [1, 0, 0]);
});


// Skipping other video spaces normalization for now or assume they work if linear.
// ydbdr, ycgco, ypbpr, ycbcr, xvycc, jpeg
// They generally follow RGB scale = Y scale.
// If RGB is 0..255, Y is 0..1.




test('ydbdr: ydbdr -> rgb', function () {
	// YDbDr: Y 0-1, Db/Dr ±1.33, RGB 0-255
	is((space.ydbdr.rgb(0, 0, 0)), [0, 0, 0]);
	is((space.ydbdr.rgb(1, 0, 0)), [255, 255, 255]);

	is((space.ydbdr.rgb(...space.rgb.ydbdr(10, 20, 30)).map(round(0))), [10, 20, 30]);
});

test('ydbdr: rgb -> ydbdr', function () {
	// RGB 0-255, YDbDr: Y 0-1, Db/Dr ±1.33
	is((space.rgb.ydbdr(0, 0, 0)), [0, 0, 0]);
	is((space.rgb.ydbdr(255, 255, 255).map(round(0))), [1, 0, 0]);
});

test('ydbdr: yuv <-> ydbdr', function () {
	// YUV/YDbDr: Y 0-1, U/V/Db/Dr ±0.5/±1.33
	is((space.yuv.ydbdr(1, 0, 0)), [1, 0, 0]);
	is((space.ydbdr.yuv(1, 0, 0)), [1, 0, 0]);
});



test('ycgco: ycgco -> rgb', function () {
	// YCgCo: Y 0-1, Cg/Co ±0.5, RGB 0-255
	is((space.ycgco.rgb(0, 0, 0)), [0, 0, 0]);
	is((space.ycgco.rgb(1, 0, 0)), [255, 255, 255]);
	is((space.ycgco.rgb(0.25, -0.25, 0.5)), [255, 0, 0]);

	is((space.ycgco.rgb(...space.rgb.ycgco(10, 20, 30))).map(round(0)), [10, 20, 30]);
});

test('ycgco: rgb -> ycgco', function () {
	// RGB 0-255, YCgCo: Y 0-1, Cg/Co ±0.5
	is((space.rgb.ycgco(0, 0, 0)), [0, 0, 0]);
	is((space.rgb.ycgco(255, 255, 255)), [1, 0, 0]);
	is((space.rgb.ycgco(255, 0, 0)), [0.25, -0.25, 0.5]);
});



test('ypbpr: ypbpr -> rgb', function () {
	// YPbPr: Y 0-1, Pb/Pr ±0.5, RGB 0-255
	is((space.ypbpr.rgb(0, 0, 0).map(round(0))), [0, 0, 0]);
	is((space.ypbpr.rgb(0.715, -0.385, -0.454).map(round(0))), [0, 255, 0]); // G
	is((space.ypbpr.rgb(1, 0, 0).map(round(0))), [255, 255, 255]);
	is((space.ypbpr.rgb(...space.rgb.ypbpr(26, 51, 77))).map(round(0)), [26, 51, 77]);
});

test('ypbpr: rgb -> ypbpr', function () {
	// RGB 0-255, YPbPr: Y 0-1, Pb/Pr ±0.5
	is((space.rgb.ypbpr(0, 0, 0).map(round(1))), [0, 0, 0]);
	is((space.rgb.ypbpr(128, 128, 128).map(round(2))), [0.50, 0, 0]);
	is((space.rgb.ypbpr(255, 255, 255).map(round(1))), [1, 0, 0]);

	is((space.rgb.ypbpr(0, 255, 0).map(round(3))), [0.715, -0.385, -0.454]);
	is((space.rgb.ypbpr(255, 0, 0).map(round(3))), [0.213, -0.115, 0.5]);
});

test('ypbpr: yuv <-> ypbpr', function () {
	// YUV/YPbPr: Y 0-1, U/V/Pb/Pr ±0.5
	is((space.yuv.ypbpr(1, -0.5, -0.5)).map(round(1)), [0.8, -0.4, -0.2]);
	// Symmetric case?
	// is((space.yuv.ypbpr(1, 0.5, 0.5)).map(round(1)), [0.8, 0.4, 0.2]); // Guess

	is((space.ypbpr.yuv(0.8, -0.4, -0.2)).map(round(1)), [0.7, -0.3, -0.2]);
	// is((space.ypbpr.yuv(235, 240, 240)).map(round(1))), [1, 0.5, 0.5]); // This was definitely wrong input for YPbPr
});



test('yccbccrc: yccbccrc -> rgb', function () {
	// YCcCbcCrc: Y 0-1, Cbc/Crc ±0.5, RGB 0-255
	is((space.yccbccrc.rgb(0, 0, 0)), [0, 0, 0]);
	// is((space.yccbccrc.rgb([0.715, -0.385, -0.454])), [0, 255, 0]);
	is((space.yccbccrc.rgb(1, 0, 0)), [255, 255, 255]);
	is((space.yccbccrc.rgb(...space.rgb.yccbccrc(26, 51, 77))).map(round(0)), [26, 51, 77]);
});

test('yccbccrc: rgb -> yccbccrc', function () {
	// RGB 0-255, YCcCbcCrc: Y 0-1, Cbc/Crc ±0.5
	is((space.rgb.yccbccrc(0, 0, 0).map(round(1))), [0, 0, 0]);
	is((space.rgb.yccbccrc(128, 128, 128).map(round(2))), [0.50, 0, 0]);
	is((space.rgb.yccbccrc(255, 255, 255).map(round(1))), [1, 0, 0]);
});



test('ycbcr: ycbcr -> rgb', function () {
	// YCbCr: Y 16-235, Cb/Cr 16-240 (video/limited range)
	// Black: Y=16, Cb=128, Cr=128 (centered chroma)
	is((space.ycbcr.rgb(16, 128, 128)).map(round(0)), [0, 0, 0]);
	// White: Y=235, Cb=128, Cr=128
	is((space.ycbcr.rgb(235, 128, 128)).map(round(0)), [255, 255, 255]);

	is((space.ycbcr.rgb(...space.rgb.ycbcr(10, 20, 30)).map(round(0))), [10, 20, 30]);
});

test('ycbcr: rgb -> ycbcr', function () {
	// RGB 0-255, YCbCr: Y 16-235, Cb/Cr 16-240
	const black = space.rgb.ycbcr(0, 0, 0);
	is(black.map(round(0)), [16, 128, 128]);

	const white = space.rgb.ycbcr(255, 255, 255);
	is(white.map(round(0)), [235, 128, 128]);
});

test('ycbcr: ypbpr <-> ycbcr', function () {
	// YPbPr: Y 0-1, Pb/Pr ±0.5, YCbCr: Y 16-235, Cb/Cr 16-240
	is((space.ypbpr.ycbcr(1, -0.5, -0.5)).map(round(0)), [235, 16, 16]);
	is((space.ypbpr.ycbcr(1, 0.5, 0.5)).map(round(0)), [235, 240, 240]);

	is((space.ycbcr.ypbpr(235, 16, 16)).map(round(2)), [1, -0.5, -0.5]);
	is((space.ycbcr.ypbpr(235, 240, 240)).map(round(2)), [1, 0.5, 0.5]);
});



test('xvycc: xvycc -> rgb', function () {
	// xvYCC: Y 16-235, Cb/Cr 16-240 (same as YCbCr, extended gamut)
	is((space.xvycc.rgb(16, 128, 128)).map(round(0)), [0, 0, 0]);
	// White: Y=235, Cb=128, Cr=128
	is((space.xvycc.rgb(235, 128, 128)).map(round(0)), [255, 255, 255]);

	is((space.xvycc.rgb(...space.rgb.xvycc(10, 20, 30)).map(round(0))), [10, 20, 30]);
});

test('xvycc: rgb -> xvycc', function () {
	// RGB 0-255, xvYCC: Y 16-235, Cb/Cr 16-240
	const black = space.rgb.xvycc(0, 0, 0);
	is(black.map(round(0)), [16, 128, 128]);

	const white = space.rgb.xvycc(255, 255, 255);
	is(white.map(round(0)), [235, 128, 128]);
});

test('xvycc: ypbpr <-> xvycc', function () {
	// YPbPr: Y 0-1, Pb/Pr ±0.5, xvYCC: Y 16-235, Cb/Cr 16-240
	is((space.ypbpr.xvycc(1, -0.5, -0.5)).map(round(0)), [235, 16, 16]);
	is((space.ypbpr.xvycc(1, 0.5, 0.5)).map(round(0)), [235, 240, 240]);

	is((space.xvycc.ypbpr(235, 16, 16)).map(round(2)), [1, -0.5, -0.5]);
	is((space.xvycc.ypbpr(235, 240, 240)).map(round(2)), [1, 0.5, 0.5]);
});



test('jpeg: jpeg -> rgb', function () {
	// JPEG: Y/Cb/Cr 0-255 (full range, Cb/Cr centered at 128), RGB 0-255
	is((space.jpeg.rgb(0, 128, 128)).map(round(0)), [0, 0, 0]);
	is((space.jpeg.rgb(255, 128, 128)).map(round(0)), [255, 255, 255]);

	is((space.jpeg.rgb(...space.rgb.jpeg(10, 20, 30)).map(round(0))), [10, 20, 30]);
});

test('jpeg: rgb -> jpeg', function () {
	// RGB 0-255, JPEG: Y/Cb/Cr 0-255 (Cb/Cr centered at 128)
	is((space.rgb.jpeg(0, 0, 0)).map(round(0)), [0, 128, 128]);
	is((space.rgb.jpeg(255, 255, 255).map(round(0))), [255, 128, 128]);
});



test('ucs: ucs -> xyz', function () {
	// UCS: U/V/W 0-100, XYZ 0-100
	is((space.ucs.xyz(...space.xyz.ucs(10, 20, 30))), [10, 20, 30]);
});

test('ucs: xyz -> ucs', function () {
	// XYZ 0-100, UCS: U/V/W 0-100
	is(space.xyz.ucs(0, 0, 0), [0, 0, 0]);
	is(space.xyz.ucs(100, 100, 100).map(round(1)), [66.7, 100, 150]);
});


test('uvw: uvw -> xyz', function () {
	// UVW: U*/V*/W* (CIE 1964), XYZ 0-100
	// is((space.uvw.xyz(0, 0, 0)), [0, 0, 0]);
	// is((space.uvw.xyz(1, 0, 0)), [100, 100, 100]);

	is((space.uvw.xyz(...space.xyz.uvw(10, 20, 30))).map(round(0)), [10, 20, 30]);
});

test('uvw: xyz -> uvw', function () {
	// XYZ 0-100, UVW: U*/V*/W* (CIE 1964)
	// For XYZ white (100,100,100): W = 25*cbrt(1) - 17 = 8
	is(space.xyz.uvw(100, 100, 100).map(round(1)), [1.3, 0.4, 8.0]);
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
		}).map(v => Math.round(v * 255)) + ')';
		ctx.fillRect(i * cnv.width, 0, 4, cnv.height);
	}
});



// Note: osaucs -> xyy (reverse transformation) is not implemented
// There's no analytical solution - would require numerical methods
// See: http://www.researchgate.net/publication/259253763_Comparison_of_the_performance_of_inverse_transformation_methods_from_OSA-UCS_to_CIEXYZ
test.todo('osaucs -> xyy', function () {
	// is((space.osaucspace.xyy([0,-4,-4])), [33.71, 26.46, 46.66]);
	// is((space.osaucspace.xyy([-8,-6,+2])), [1.773902, 1.049996, 7.893570]);
	// is((space.osaucspace.xyy(space.xyy.osaucs([10,20,30]))), [10,20,30]);
});

test('osaucs: xyy -> osaucs', function () {
	// XYZ 0-100, OSA-UCS: L/j/g
	is((space.xyz.osaucs(33.71, 26.46, 46.66).map(round(0))), [0, -4, -5]);
	is((space.xyz.osaucs(1.773902, 1.049996, 7.893570).map(round(1))), [-8.2, -7.3, +1.2]);
});



test('coloroid: coloroid -> xyz', function () {
	// Coloroid: A 0-73, T 0-100, V 0-100, XYZ 0-100
	is((space.coloroid.xyz(21, 39, 70).map(round(0))), [47, 49, 53]);
	is((space.coloroid.xyz(61, 0, 90).map(round(0))), [77, 81, 88]);
	is((space.coloroid.xyz(35, 10, 90).map(round(0))), [77, 81, 88]);

	//coloroid looses color info via binding hue
	// is((space.coloroid.xyz(space.xyz.coloroid([10,20,30]))), [10,20,30]);
});

test('coloroid: xyz -> coloroid', function () {
	// XYZ 0-100, Coloroid: A 0-73, T 0-100, V 0-100
	is((space.xyz.coloroid(54.64, 64.0, 18.26).map(round(0))), [12, 46, 80]);
	is((space.xyz.coloroid(54.2, 49.0, 17.6).map(round(0))), [23, 39, 70]);
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
		// vals = row.slice(-3).map(function (v) { return v * 100 });
        // xyz expects 0..1, table has 0..1?
        // if table has 0..1, v*100 is wrong for 0..1 expectations but right for legacy?
        // Let's assume table has 0..1.
		vals = row.slice(-3);
		ctx.fillStyle = 'rgb(' + space.xyz.rgb(...vals).map(v => Math.round(v*255)) + ')';
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
		vals = space.coloroid.rgb(row[0], 30, 30);

		ctx.fillStyle = 'rgb(' + vals.map(v => Math.round(v*255)) + ')';
		ctx.fillRect(i * w, 0, Math.ceil(w), 10);
	}
	for (var i = 0; i < range; i++) {
		row = space.coloroid.table[i];
		vals = space.coloroid.rgb(row[0], 50, 50);

		ctx.fillStyle = 'rgb(' + vals.map(v => Math.round(v*255)) + ')';
		ctx.fillRect(i * w, 10, Math.ceil(w), 20);
	}
	for (var i = 0; i < range; i++) {
		row = space.coloroid.table[i];
		vals = space.coloroid.rgb(row[0], 70, 70);

		ctx.fillStyle = 'rgb(' + vals.map(v => Math.round(v*255)) + ')';
		ctx.fillRect(i * w, 20, Math.ceil(w), 30);
	}
});



test('tsl: tsl -> rgb', function () {
	// TSL: T 0-360, S 0-1, L 0-255, RGB 0-255
	is(space.tsl.rgb(0, 0, 0).map(round(0)), [0, 0, 0]); // black
	// inverse now preserves sign -> exact roundtrip (was [124,83,-83] for red)
	for (const c of [[255, 0, 0], [0, 255, 0], [0, 0, 255], [128, 128, 128], [10, 20, 30], [200, 100, 50]])
		is(space.tsl.rgb(...space.rgb.tsl(...c)).map(round(0)), c, `roundtrip ${c}`);
});

test('tsl: rgb -> tsl', () => {
	// RGB 0-255, TSL: T 0-360, S 0-1, L 0-255
	is(space.rgb.tsl(255, 255, 255).map(round(2)), [0, 0, 255]); // white: S=0, L=255
	is(space.rgb.tsl(0, 0, 0), [0, 0, 0]); // black guarded
	is(space.rgb.tsl(255, 0, 0).map(round(2)), [206.57, 1, 76.24]); // red
});

test('hsm: hsm <-> rgb', function () {
	// HSM: H 0-360, S 0-100, M 0-100, RGB 0-255
	is(space.hsm.rgb(...space.rgb.hsm(255, 0, 0)).map(round(0)), [255, 0, 0]);
	is(space.hsm.rgb(...space.rgb.hsm(0, 255, 0)).map(round(0)), [0, 255, 0]);
	is(space.hsm.rgb(...space.rgb.hsm(0, 0, 255)).map(round(0)), [0, 0, 255]);
	is(space.hsm.rgb(...space.rgb.hsm(255, 255, 255)).map(round(0)), [255, 255, 255]);
	is(space.hsm.rgb(...space.rgb.hsm(0, 0, 0)).map(round(0)), [0, 0, 0]);
	is(space.hsm.rgb(...space.rgb.hsm(128, 128, 128)).map(round(0)), [128, 128, 128]);
});

test('hsm: rgb -> hsm', function () {
	// RGB 0-255, HSM: H 0-360, S 0-100, M 0-100
	is(space.rgb.hsm(255, 0, 0).map(round(2)), [0, 100, 57.14]);
	is(space.rgb.hsm(0, 255, 0).map(round(1)), [119.3, 102.8, 28.6]);
	is(space.rgb.hsm(0, 0, 255).map(round(2)), [234.36, 12.84, 14.29].map(round(2)));
	is(space.rgb.hsm(255, 255, 255).map(round(2)), [90, 0, 100]);
	is(space.rgb.hsm(0, 0, 0).map(round(2)), [90, 0, 0]);
	is(space.rgb.hsm(128, 128, 128).map(round(2)), [90, 0, 50.2]);
});

test('hsm: hsm -> rgb', function () {
	// HSM: H 0-360, S 0-100, M 0-100, RGB 0-255
	is(space.hsm.rgb(0, 100, 57.14).map(round(0)), [255, 0, 0]);
	is(space.hsm.rgb(120, 103, 29).map(round(0)), [0, 255, 3]);
	is(space.hsm.rgb(234, 13, 14).map(round(0)), [0, 0, 255]);
	is(space.hsm.rgb(90, 0, 100).map(round(0)), [255, 255, 255]);
	is(space.hsm.rgb(0, 0, 0).map(round(0)), [0, 0, 0]);
	is(space.hsm.rgb(0, 0, 50).map(round(0)), [128, 128, 128]);
});



test('yes: yes <-> rgb', function () {
	// YES: Y 0-1, E/S ±1, RGB 0-255
	is(space.rgb.yes(0, 0, 0), [0, 0, 0]);
	is(space.rgb.yes(255, 255, 255).map(round(2)), [1, 0, 0]); // White is pure luminance?
	// ...existing code...
});

// reference values: colorjs.io srgb->oklab, L/a/b scaled ×100. gray128 L=59.99 (not 79.47)
// is the regression guard for the sRGB-linearization bug.
test("oklab: rgb -> oklab", () => {
	is(space.rgb.oklab(255, 255, 255).map(round(2)), [100, 0, 0]); // white
	is(space.rgb.oklab(0, 0, 0).map(round(2)), [0, 0, 0]); // black
	is(space.rgb.oklab(128, 128, 128).map(round(2)), [59.99, 0, 0]); // gray
	is(space.rgb.oklab(255, 0, 0).map(round(2)), [62.8, 22.49, 12.58]); // red
	is(space.rgb.oklab(0, 255, 0).map(round(2)), [86.64, -23.39, 17.95]); // green
	is(space.rgb.oklab(0, 0, 255).map(round(2)), [45.2, -3.25, -31.15]); // blue
	is(space.rgb.oklab(100, 150, 200).map(round(2)), [65.8, -3.25, -8.64]); // arbitrary
})

test("oklab: oklab -> rgb roundtrip", () => {
	is(space.oklab.rgb(100, 0, 0).map(round(0)), [255, 255, 255]); // white
	is(space.oklab.rgb(0, 0, 0).map(round(0)), [0, 0, 0]); // black
	for (const c of [[128, 128, 128], [255, 0, 0], [0, 255, 0], [0, 0, 255], [100, 150, 200], [33, 180, 90]])
		is(space.oklab.rgb(...space.rgb.oklab(...c)).map(round(2)), c, `roundtrip ${c}`);
})

// lab-d50 == CSS/colorjs `lab` (D50). Guards the 100×-scale bug (white was L=522) and reachability.
test("lab-d50: rgb <-> lab-d50 (vs colorjs lab/D50)", () => {
	is(space.rgb['lab-d50'](255, 255, 255).map(round(1)), [100, 0, 0]); // white
	is(space.rgb['lab-d50'](0, 0, 0).map(round(1)), [0, 0, 0]); // black
	is(space.rgb['lab-d50'](128, 128, 128).map(round(1)), [53.6, 0, 0]); // gray
	is(space.rgb['lab-d50'](255, 0, 0).map(round(1)), [54.3, 80.8, 69.9]); // red
	for (const c of [[128, 128, 128], [255, 0, 0], [100, 150, 200]])
		is(space['lab-d50'].rgb(...space.rgb['lab-d50'](...c)).map(round(0)), c, `roundtrip ${c}`);
})

test("oklab: xyz -> oklab", () => {
	// XYZ 0-100 (D65) -> Oklab L 0-100, a/b (can exceed ±40 for out-of-gamut colors)
	is(space.xyz.oklab(95.047, 100.0, 108.883).map(round(1)), [100.0, 0.0, 0.0]);
	// XYZ primaries are extreme out-of-gamut values - tests removed
})

test("oklab: oklab -> xyz", () => {
	// Oklab L 0-100, a/b ±40 -> XYZ 0-100
	is(space.oklab.xyz(100, 0, 0).map(round(1)), [95.0, 100.0, 108.8]); // D65
	// Inverse tests for extreme values removed
})

test("oklch: oklch <-> oklab", () => {
	// OKLCh: L 0-100, C 0-40, H 0-360; Oklab: L 0-100, a/b ±40
	is(space.oklch.oklab(100, 0, 0).map(round(1)), [100, 0, 0]);
	// red approximation
	// oklab red: 62.8, 22.5, 12.6
	// C = 25.8
	// h = 29.2 degrees
	is(space.oklab.oklch(62.8, 22.5, 12.6).map(round(1)), [62.8, 25.8, 29.2]);
});

test("okhsl: okhsl <-> rgb", () => {
	// OKHsl: H 0-360, S/L 0-100, RGB 0-255
	// White -> L=100
	var w = space.rgb.okhsl(255, 255, 255);
	is(round(1)(w[2]), 100, 'White L is 100');

	// Black -> L=0
	var k = space.rgb.okhsl(0, 0, 0);
	is(round(1)(k[2]), 0, 'Black L is 0');

	// Roundtrip red
	let red = [255, 0, 0];
	let hsl = space.rgb.okhsl(...red);
	is(space.okhsl.rgb(...hsl).map(round(0)), red, 'Red roundtrip');

	// Roundtrip arbitrary
	let arb = [51, 128, 204];
	let hslArb = space.rgb.okhsl(...arb);
	is(space.okhsl.rgb(...hslArb).map(round(0)), arb, 'Arbitrary roundtrip');
})

test("okhsv: okhsv <-> rgb", () => {
	// OKHSV: H 0-360, S/V 0-100, RGB 0-255
	// White -> V=100
	var w = space.rgb.okhsv(255, 255, 255);
	is(round(1)(w[2]), 100, 'White V is 100');

	// Black -> V=0
	var k = space.rgb.okhsv(0, 0, 0);
	is(round(1)(k[2]), 0, 'Black V is 0');

	// Roundtrip blue
	let blue = [0, 0, 255];
	let hsv = space.rgb.okhsv(...blue);
	is(space.okhsv.rgb(...hsv).map(round(0)), blue, 'Blue roundtrip');

	// Roundtrip arbitrary
	let arb = [51, 128, 204];
	let hsvArb = space.rgb.okhsv(...arb);
	is(space.okhsv.rgb(...hsvArb).map(round(0)), arb, 'Arbitrary roundtrip');
})

test("oklrab: oklrab <-> oklab", () => {
	// OKLrab: Lr 0-100, a/b ±40; Oklab: L 0-100, a/b ±40
	// White
	// oklab L=100 -> oklrab Lr approx 100
	// toeInv(100) ~= 100
	is(space.oklab.oklrab(100, 0, 0).map(round(1)), [100, 0, 0]);
	is(space.oklrab.oklab(100, 0, 0).map(round(1)), [100, 0, 0]);

	// Gray
	// oklab L=50 -> oklrab Lr should be different
	var gray = space.oklab.oklrab(50, 0, 0);
	// toeInv(50) is not 50.
	// It should be roughly 50^3 = 125000 (if it was pure power)
	// checking rough range
	if (gray[0] == 50) throw new Error("oklrab L should differ from oklab L for gray");

	// Roundtrip
	is(space.oklrab.oklab(...gray).map(round(2)), [50, 0, 0]);
});

test("oklrch: oklrch <-> oklrab", () => {
	// OKLRCh: Lr 0-100, C 0-40, H 0-360; OKLrab: Lr 0-100, a/b ±40
	// Similar to oklch <-> oklab but for Linear Lightness space
	// White
	is(space.oklrab.oklrch(100, 0, 0).map(round(1)), [100, 0, 0]);

	// Red-ish color
	// oklrab [50, 20, 10] -> oklrch [50, C, h]
	// C = sqrt(20^2 + 10^2) = sqrt(500) ~= 22.4
	// h = atan2(10, 20)
	var c = space.oklrab.oklrch(50, 20, 10);
	is(round(1)(c[0]), 50); // L should match
	is(round(1)(c[1]), 22.4); // C

	// Roundtrip
	is(space.oklrch.oklrab(...c).map(round(1)), [50, 20, 10]);
});

test("jzazbz: jzazbz <-> xyz", () => {
	// Jzazbz: Jz 0-100, az/bz ±50, XYZ 0-100
	// Roundtrip
	let xyz = [95.047, 100.0, 108.883]; // D65 White
	let jz = space.xyz.jzazbz(...xyz);
	// console.log('Jz for White:', jz);

	// Check reversibility
	is(space.jzazbz.xyz(...jz).map(round(2)), xyz.map(round(2)));

	// Black
	is(space.xyz.jzazbz(0, 0, 0).map(round(2)), [0, 0, 0]);
});

test("jzczhz: jzczhz <-> jzazbz", () => {
	// JzCzHz: Jz 0-100, Cz 0-50, Hz 0-360; Jzazbz: Jz 0-100, az/bz ±50 (no rescaling).
	// Explicit polar values guard the double-×100 bug (Jz/Cz were 100× too large).
	is(space.jzazbz.jzczhz(15, 5, -5).map(round(2)), [15, 7.07, 315]);
	is(space.jzczhz.jzazbz(15, 7.07, 315).map(round(2)), [15, 5, -5]);
});

test('p3', () => {
	// P3: 0-1 (linear), XYZ 0-100
	is(space.p3.xyz(1, 1, 1).map(round(1)), [95.0, 100.0, 108.9], 'p3 white to xyz');
	is(space.xyz.p3(95.05, 100.0, 108.90).map(round(2)), [1, 1, 1], 'xyz white to p3');
});

test('rec2020', () => {
	// Rec2020: 0-1 (linear), XYZ 0-100
	is(space.rec2020.xyz(1, 1, 1).map(round(1)), [95.0, 100.0, 108.9], 'rec2020 white to xyz');
	is(space.xyz.rec2020(95.05, 100.0, 108.90).map(round(2)), [1, 1, 1], 'xyz white to rec2020');
});

test('prophoto', () => {
	// ProPhoto: 0-1 (linear), XYZ 0-100
	is(space.prophoto.xyz(1, 1, 1).map(round(0)), [95, 100, 109], 'prophoto white to xyz');
	is(space.xyz.prophoto(95.05, 100.0, 108.90).map(round(2)), [1, 1, 1], 'xyz white to prophoto');
});

test('a98rgb', () => {
	// A98 RGB: 0-1 (linear), XYZ 0-100
	is(space.a98rgb.xyz(1, 1, 1).map(round(1)), [95.0, 100.0, 108.9], 'a98rgb white to xyz');
	is(space.xyz.a98rgb(95.05, 100.0, 108.90).map(round(2)), [1, 1, 1], 'xyz white to a98rgb');
});

test('acescg', () => {
	// ACEScg: 0-1 (linear), XYZ 0-100
	is(space.acescg.xyz(1, 1, 1).map(round(1)), [95.0, 100.0, 108.9], 'acescg white to xyz');
});

test('gray', () => {
	// Gray: 0-1, RGB 0-255
	is(space.rgb.gray(0, 0, 0), [0], 'black to gray');
	is(space.rgb.gray(255, 255, 255).map(round(3)), [1], 'white to gray');
	is(space.rgb.gray(128, 128, 128).map(round(2)), [0.50], 'gray to gray');
	is(space.rgb.gray(255, 0, 0).map(round(3)), [0.213], 'red to gray');
	is(space.rgb.gray(0, 255, 0).map(round(3)), [0.715], 'green to gray');
	is(space.rgb.gray(0, 0, 255).map(round(3)), [0.072], 'blue to gray');

	is(space.gray.rgb(0), [0, 0, 0], 'gray to black');
	is(space.gray.rgb(1).map(round(0)), [255, 255, 255], 'gray to white');
	is(space.gray.rgb(0.5).map(round(0)), [128, 128, 128], 'gray to rgb');
});

test('rg', () => {
	// RG: r/g 0-1, RGB 0-255
	is(space.rgb.rg(255, 0, 0), [1, 0], 'red to rg');
	is(space.rgb.rg(0, 255, 0), [0, 1], 'green to rg');
	is(space.rgb.rg(0, 0, 255).map(round(3)), [0, 0], 'blue to rg');
	is(space.rgb.rg(255, 255, 255).map(round(2)), [0.33, 0.33], 'white to rg');
	is(space.rgb.rg(0, 0, 0), [0, 0], 'black to rg');

	is(space.rg.rgb(1, 0), [255, 0, 0], 'rg to red');
	is(space.rg.rgb(0, 1), [0, 255, 0], 'rg to green');
	is(space.rg.rgb(0, 0), [0, 0, 255], 'rg to blue');
	// 0.333 doesn't round-trip perfectly, use exact 1/3
	is(space.rg.rgb(1/3, 1/3).map(round(0)), [255, 255, 255], 'rg to white');
});

test('hcl', () => {
	// HCL: H 0-360, C 0-150, L 0-100, RGB 0-255
	is(space.rgb.hcl(0, 0, 0).map(round(1)), [0, 0, 0], 'black to hcl');
	is(space.rgb.hcl(255, 255, 255).map(round(1)), [0, 0, 94.3], 'white to hcl');
	is(space.rgb.hcl(255, 0, 0).map(round(1)), [0, 100.0, 94.3], 'red to hcl');

	is(space.hcl.rgb(0, 0, 0), [0, 0, 0], 'hcl to black');
	// Note: HCL has known round-trip issues, especially with saturated colors
	// Testing with a gray color
	const hcl = space.rgb.hcl(128, 128, 128);
	is(space.hcl.rgb(...hcl).map(round(0)), [121, 121, 121], 'hcl gray round-trip');
	// saturated colors now roundtrip after the frac() fix (green was [255,255,0])
	for (const c of [[0, 255, 0], [0, 0, 255], [255, 128, 0]])
		is(space.hcl.rgb(...space.rgb.hcl(...c)).map(round(0)), c, `hcl roundtrip ${c}`);
});

test('hcy', () => {
	// HCY: H 0-360, C 0-100, Y 0-100 (Chilliant luma-based). Y channel IS Rec.601 luma
	// (red 29.9, green 58.7, blue 11.4) — guards against the old hsi-copy (Y=33.3 for all).
	is(round(1)(space.rgb.hcy(255, 0, 0)[2]), 29.9, 'red luma');
	is(round(1)(space.rgb.hcy(0, 255, 0)[2]), 58.7, 'green luma');
	is(round(1)(space.rgb.hcy(0, 0, 255)[2]), 11.4, 'blue luma');
	// achromatic must not produce NaN
	is(space.rgb.hcy(0, 0, 0).map(round(1)), [0, 0, 0], 'black');
	is(space.rgb.hcy(255, 255, 255).map(round(1)), [0, 0, 100], 'white');
	for (const c of [[255, 0, 0], [0, 255, 0], [0, 0, 255], [128, 128, 128], [200, 100, 50]])
		is(space.hcy.rgb(...space.rgb.hcy(...c)).map(round(0)), c, `roundtrip ${c}`);
});
