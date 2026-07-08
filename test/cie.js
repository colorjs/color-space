// Exact regression pins for the shared CIE 1976 companding (cie.js).
//
// The differential suite validates luv/lab/etc. against colorjs, but at a
// tolerance (1.0/255) far too loose to catch the two luv.js bugs the
// consolidation fixed — both are last-bit:
//   1. κ was the literal 903.2962962962961, 2 ULP below 24389/27.
//   2. L* used Math.pow(yr, 1/3), which diverges from Math.cbrt on ~15% of doubles.
// These tests fail if either regresses.
//
// @see http://www.brucelindbloom.com/index.html?LContinuity.html
import test, { is } from 'tst'
import { ε, κ, labF } from '../cie.js'
import space from '../index.js'
import whitepoint from '../whitepoints.js'

// a tristimulus ratio above the toe where Math.cbrt and Math.pow(·,1/3) disagree
// in the last bit — the discriminator between the correct and the old code path
let tSplit = 0
for (let i = 1000; i < 200000 && !tSplit; i++) {
	const x = i / 200000
	if (x > ε && Math.cbrt(x) !== Math.pow(x, 1 / 3)) tSplit = x
}

test('cie: CIE constants are the exact rationals (luv κ regression)', () => {
	is(κ, 24389 / 27, 'κ = (29/3)³ exactly')
	is(ε, 216 / 24389, 'ε = (6/29)³ exactly')
	is(κ === 903.2962962962961, false, 'κ is NOT the prior 2-ULP-low literal from luv.js')
})

test('cie: labF uses Math.cbrt, not Math.pow(·,1/3) (companding regression)', () => {
	is(tSplit > 0, true, 'found a sample above the toe where cbrt ≠ pow(·,1/3)')
	is(labF(tSplit), Math.cbrt(tSplit), 'labF returns the exact Math.cbrt value')
	is(labF(tSplit) === Math.pow(tSplit, 1 / 3), false, 'labF is not Math.pow(·,1/3)')
})

test('cie: luv L* routes through the shared companding', () => {
	// drive Y so Y/Yn lands on the cbrt≠pow split point; the old luv.js
	// (Math.pow + 2-ULP κ) would return a different last bit for L* here.
	const Yn = whitepoint[2].D65[1]
	const [L] = space.xyz.luv(40, tSplit * Yn, 20)
	is(L, 116 * Math.cbrt(tSplit) - 16, 'luv L* equals the exact-cbrt CIELAB lightness')
})
