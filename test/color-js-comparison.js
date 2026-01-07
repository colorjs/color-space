/**
 * Test our conversions against color.js values
 * https://github.com/color-js/color.js/blob/main/test/conversions.js
 */

import space from '../index.js';

// Helper to compare values with epsilon
function near(a, b, epsilon = 0.0001) {
	if (a === null || b === null || a === undefined || b === undefined) return a === b;
	return Math.abs(a - b) < epsilon;
}

function nearArray(arr1, arr2, epsilon = 0.0001) {
	if (arr1.length !== arr2.length) return false;
	return arr1.every((v, i) => near(v, arr2[i], epsilon));
}

console.log('=== Testing Lab conversions against color.js ===\n');

// Test cases from color.js
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

let passCount = 0;
let failCount = 0;

labTests.forEach(test => {
	// Our encoding: L/100, a/125, b/125
	const ourLab = space.rgb.lab(...test.rgb);
	const expected = [test.lab[0]/100, test.lab[1]/125, test.lab[2]/125];
	
	const match = nearArray(ourLab, expected, 0.001);
	if (match) {
		console.log(`✓ ${test.name.padEnd(10)} Lab matches`);
		passCount++;
	} else {
		console.log(`✗ ${test.name.padEnd(10)} Lab MISMATCH`);
		console.log(`  Expected: [${expected.map(v => v.toFixed(4)).join(', ')}]`);
		console.log(`  Got:      [${ourLab.map(v => v.toFixed(4)).join(', ')}]`);
		failCount++;
	}
	
	// Test round-trip
	const rgbBack = space.lab.rgb(...ourLab);
	const roundTripMatch = nearArray(rgbBack, test.rgb, 0.001);
	if (roundTripMatch) {
		console.log(`  ✓ Round-trip matches`);
		passCount++;
	} else {
		console.log(`  ✗ Round-trip MISMATCH`);
		console.log(`    Expected: [${test.rgb.map(v => v.toFixed(4)).join(', ')}]`);
		console.log(`    Got:      [${rgbBack.map(v => v.toFixed(4)).join(', ')}]`);
		failCount++;
	}
});

console.log('\n=== Testing Luv conversions against color.js ===\n');

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

luvTests.forEach(test => {
	// Our encoding: L/100, u/100, v/100
	const ourLuv = space.rgb.luv(...test.rgb);
	const expected = [test.luv[0]/100, test.luv[1]/100, test.luv[2]/100];
	
	const match = nearArray(ourLuv, expected, 0.001);
	if (match) {
		console.log(`✓ ${test.name.padEnd(10)} Luv matches`);
		passCount++;
	} else {
		console.log(`✗ ${test.name.padEnd(10)} Luv MISMATCH`);
		console.log(`  Expected: [${expected.map(v => v.toFixed(4)).join(', ')}]`);
		console.log(`  Got:      [${ourLuv.map(v => v.toFixed(4)).join(', ')}]`);
		failCount++;
	}
	
	// Test round-trip
	const rgbBack = space.luv.rgb(...ourLuv);
	const roundTripMatch = nearArray(rgbBack, test.rgb, 0.001);
	if (roundTripMatch) {
		console.log(`  ✓ Round-trip matches`);
		passCount++;
	} else {
		console.log(`  ✗ Round-trip MISMATCH`);
		console.log(`    Expected: [${test.rgb.map(v => v.toFixed(4)).join(', ')}]`);
		console.log(`    Got:      [${rgbBack.map(v => v.toFixed(4)).join(', ')}]`);
		failCount++;
	}
});

console.log('\n=== Summary ===');
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);
console.log(`\nOur encoding scheme:`);
console.log(`  Lab: [L/100, a/125, b/125] where L∈[0,1], a,b are signed`);
console.log(`  Luv: [L/100, u/100, v/100] where L∈[0,1], u,v are signed`);
console.log(`  All values computed efficiently without separate denormalization steps`);
