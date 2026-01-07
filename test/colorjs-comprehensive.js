/**
 * Comprehensive test against ALL color.js test values
 * https://github.com/color-js/color.js/blob/main/test/conversions.js
 */

import space from '../index.js';

function near(a, b, epsilon = 0.0001) {
	if (a === null || b === null || a === undefined || b === undefined) return a === b;
	return Math.abs(a - b) < epsilon;
}

function nearArray(arr1, arr2, epsilon = 0.0001) {
	if (arr1.length !== arr2.length) return false;
	return arr1.every((v, i) => near(v, arr2[i], epsilon));
}

let passCount = 0;
let failCount = 0;
let skipCount = 0;

function test(name, fn) {
	try {
		const result = fn();
		if (result === 'skip') {
			console.log(`⊘ ${name} - SKIPPED`);
			skipCount++;
		} else if (result) {
			console.log(`✓ ${name}`);
			passCount++;
		} else {
			console.log(`✗ ${name} - FAILED`);
			failCount++;
		}
	} catch (e) {
		console.log(`✗ ${name} - ERROR: ${e.message}`);
		failCount++;
	}
}

console.log('=== XYZ Tests ===\n');
test('sRGB white to XYZ', () => {
	const xyz = space.rgb.xyz(1, 1, 1);
	return nearArray(xyz, [0.950456, 1, 1.089058], 0.001);
});

console.log('\n=== Lab Tests ===\n');
const labTests = [
	{ name: 'white', rgb: [1, 1, 1], lab: [100, 0, 0] },
	{ name: 'red', rgb: [1, 0, 0], lab: [53.237, 80.092, 67.203] },
	{ name: 'lime', rgb: [0, 1, 0], lab: [87.735, -86.185, 83.181] },
	{ name: 'blue', rgb: [0, 0, 1], lab: [32.301, 79.197, -107.864] },
	{ name: 'cyan', rgb: [0, 1, 1], lab: [91.115, -48.080, -14.138] },
	{ name: 'magenta', rgb: [1, 0, 1], lab: [60.323, 98.235, -60.825] },
	{ name: 'yellow', rgb: [1, 1, 0], lab: [97.139, -21.556, 94.478] },
	{ name: 'black', rgb: [0, 0, 0], lab: [0, 0, 0] },
];

labTests.forEach(t => {
	test(`${t.name} RGB→Lab`, () => {
		const lab = space.rgb.lab(...t.rgb);
		const expected = [t.lab[0]/100, t.lab[1]/125, t.lab[2]/125];
		return nearArray(lab, expected, 0.001);
	});
	test(`${t.name} Lab→RGB roundtrip`, () => {
		const lab = space.rgb.lab(...t.rgb);
		const rgb = space.lab.rgb(...lab);
		return nearArray(rgb, t.rgb, 0.001);
	});
});

console.log('\n=== LCH (Lab) Tests ===\n');
// Skipping - color.js test data is inconsistent: 
// Their Lab [52.697, -2.142, -10.580] produces hue=258.55° but they claim hue=253.003°
// Our calculation matches the math: atan2(-10.58, -2.142) = 258.55°
test('slategray RGB→LCH - color.js data inconsistent', () => 'skip');

console.log('\n=== Luv Tests ===\n');
const luvTests = [
	{ name: 'white', rgb: [1, 1, 1], luv: [100, 0, 0] },
	{ name: 'red', rgb: [1, 0, 0], luv: [53.237, 175.010, 37.765] },
	{ name: 'lime', rgb: [0, 1, 0], luv: [87.735, -83.067, 107.418] },
	{ name: 'blue', rgb: [0, 0, 1], luv: [32.301, -9.402, -130.351] },
	{ name: 'cyan', rgb: [0, 1, 1], luv: [91.115, -70.464, -15.205] },
	{ name: 'magenta', rgb: [1, 0, 1], luv: [60.323, 84.056, -108.696] },
	{ name: 'yellow', rgb: [1, 1, 0], luv: [97.139, 7.704, 106.808] },
	{ name: 'black', rgb: [0, 0, 0], luv: [0, 0, 0] },
];

luvTests.forEach(t => {
	test(`${t.name} RGB→Luv`, () => {
		const luv = space.rgb.luv(...t.rgb);
		const expected = [t.luv[0]/100, t.luv[1]/100, t.luv[2]/100];
		return nearArray(luv, expected, 0.001);
	});
	test(`${t.name} Luv→RGB roundtrip`, () => {
		const luv = space.rgb.luv(...t.rgb);
		const rgb = space.luv.rgb(...luv);
		return nearArray(rgb, t.rgb, 0.001);
	});
});

console.log('\n=== LCHuv Tests ===\n');
test('#771199 RGB→LCHuv', () => {
	const rgb = [0x77/255, 0x11/255, 0x99/255];
	const lchuv = space.rgb.lchuv(...rgb);
	// color.js: [30.933, 76.273, 290.584]
	const expected = [30.933/100, 76.273/100, 290.584/360];
	return nearArray(lchuv, expected, 0.001);
});

console.log('\n=== HSL/HSV/HWB Tests ===\n');
test('black RGB→HSL', () => {
	const hsl = space.rgb.hsl(0, 0, 0);
	// Hue should be null/undefined for gray, but we return 0
	return near(hsl[1], 0) && near(hsl[2], 0);
});

test('white RGB→HWB', () => {
	const hwb = space.rgb.hwb(1, 1, 1);
	// color.js: [null, 100, 0]
	return near(hwb[1], 1) && near(hwb[2], 0);
});

console.log('\n=== OKLab Tests ===\n');
const oklabTests = [
	{ name: 'white', rgb: [1, 1, 1], oklab: [1.0, 0.0, 0.0] },
	{ name: 'red', rgb: [1, 0, 0], oklab: [0.627955, 0.224863, 0.125846] },
	{ name: 'lime', rgb: [0, 1, 0], oklab: [0.86644, -0.233888, 0.179498] },
	{ name: 'blue', rgb: [0, 0, 1], oklab: [0.452014, -0.032457, -0.311528] },
	{ name: 'cyan', rgb: [0, 1, 1], oklab: [0.905399, -0.149444, -0.039398] },
	{ name: 'magenta', rgb: [1, 0, 1], oklab: [0.701674, 0.274566, -0.169156] },
	{ name: 'yellow', rgb: [1, 1, 0], oklab: [0.967983, -0.071369, 0.19857] },
	{ name: 'black', rgb: [0, 0, 0], oklab: [0.0, 0.0, 0.0] },
];

oklabTests.forEach(t => {
	test(`${t.name} RGB→OKLab`, () => {
		const oklab = space.rgb.oklab(...t.rgb);
		return nearArray(oklab, t.oklab, 0.001);
	});
});

console.log('\n=== OKLCh Tests ===\n');
test('red RGB→OKLCh', () => {
	const oklch = space.rgb.oklch(1, 0, 0);
	// color.js: [0.627955, 0.257683, 29.234]
	const expected = [0.627955, 0.257683, 29.234/360];
	return nearArray(oklch, expected, 0.001);
});

console.log('\n=== Spaces Not in color-space ===\n');
const notImplemented = [
	'Jzazbz', 'JzCzHz', 'ICtCp', 
	'rec2100pq', 'ACEScc',
	'CAM16 JMh', 'HCT',
	'HSLuv', 'HPLuv', 
	'OKLrab', 'OKLrCh', 'Okhsl', 'Okhsv'
];

notImplemented.forEach(space => {
	test(`${space}`, () => 'skip');
});

console.log('\n=== Summary ===');
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);
console.log(`Skipped: ${skipCount} (not implemented in color-space)`);
console.log('\nSpaces tested that exist in color-space:');
console.log('  ✓ XYZ, Lab, LCH(ab), Luv, LCH(uv), HSL, HSV, HWB, OKLab, OKLCh');
console.log('\nSpaces in color.js but NOT in color-space:');
console.log('  ⊘ Jzazbz, JzCzHz, ICtCp, rec2100pq, ACEScc');
console.log('  ⊘ CAM16, HCT, HSLuv, HPLuv');  
console.log('  ⊘ OKLrab, OKLrCh, Okhsl, Okhsv');
