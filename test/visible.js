// The spectral locus is the boundary of colour itself, and the atlas leans on it:
// EVERY lens voids past it (the picking planes, the sliders, the gamut-membership
// predicate) — an off-locus chromaticity is imaginary at any luminance, so no display
// lens can make it real; the xy panel draws the boundary. One law, one source —
// web/js/core.js — so this pins the law rather than any one surface.
//
// The locus is NOT the Rösch–MacAdam optimal-colour solid the 3D shape is built from.
// That body is a bounded REFLECTIVE gamut under illuminant E; a colour above its
// ceiling (a bright emissive white — sRGB white is one) is still perfectly visible.
// Cutting the plots at that ceiling would ghost display white, which is why the lens
// cuts at the locus and the solid keeps its own shape.
//
// @see {@link https://cie.co.at/publications/colorimetry-4th-edition} CIE 15:2004 — 1931 2° observer, D65 chromaticity
// @see {@link https://www.iec.ch/publication/6169} IEC 61966-2-1 (sRGB) — primary chromaticities
import test, { is } from 'tst'
import { locus, visibleXYZ } from '../web/js/core.js'

// a chromaticity, carried at some luminance — the locus law is scale-invariant
const at = (x, y, Y = 50) => [x * Y / y, Y, (1 - x - y) * Y / y]
const near = (got, exp, tol, msg) => is(Math.abs(got - exp) <= tol, true, `${msg}: ${got.toFixed(4)} ≈ ${exp} (±${tol})`)

test('visible: the locus IS the CIE 1931 2° spectral curve', () => {
	const P = locus()
	is(P.length > 40, true, `sampled locus has ${P.length} vertices`)
	// published CIE 1931 2° monochromatic chromaticities
	const mx = P.reduce((a, b) => (b[0] > a[0] ? b : a))
	const my = P.reduce((a, b) => (b[1] > a[1] ? b : a))
	near(mx[0], 0.7347, 5e-4, '700 nm red extreme x')
	near(mx[1], 0.2653, 5e-4, '700 nm red extreme y')
	near(my[0], 0.0743, 5e-4, '~520 nm green extreme x')
	near(my[1], 0.8338, 5e-4, '~520 nm green extreme y')
	near(P[0][0], 0.1741, 5e-4, '380 nm violet end x')
	near(P[0][1], 0.0050, 5e-4, '380 nm violet end y')
})

test('visible: real colours pass, imaginary chromaticities do not', () => {
	// every one of these is a colour something can emit
	is(visibleXYZ(...at(0.31272, 0.32903)), true, 'D65 white (CIE 15:2004) is a colour')
	is(visibleXYZ(...at(1 / 3, 1 / 3)), true, 'equal-energy E white is a colour')
	is(visibleXYZ(...at(0.64, 0.33)), true, 'sRGB red primary (IEC 61966-2-1)')
	is(visibleXYZ(...at(0.30, 0.60)), true, 'sRGB green primary')
	is(visibleXYZ(...at(0.15, 0.06)), true, 'sRGB blue primary')
	// …and none of these is: no spectral power distribution lands here, at any luminance
	is(visibleXYZ(...at(0.80, 0.10)), false, 'past the 0.7347 red extreme — imaginary')
	is(visibleXYZ(...at(0.10, 0.90)), false, 'above the 0.8338 green extreme — imaginary')
	is(visibleXYZ(...at(0.45, 0.05)), false, 'under the line of purples — imaginary')
})

test('visible: degenerate coordinates — black counts, negatives and NaN do not', () => {
	is(visibleXYZ(0, 0, 0), true, 'black is a colour')
	is(visibleXYZ(-10, 20, 0), false, 'a negative coordinate is not')
	is(visibleXYZ(0, -1e-3, 0), false, 'negative luminance is not')
	is(visibleXYZ(NaN, 1, 1), false, 'NaN is not')
	is(visibleXYZ(50, 50, Infinity), false, 'non-finite is not')
	// scale invariance: the law reads chromaticity, so luminance never flips it
	const dim = visibleXYZ(...at(0.31272, 0.32903, 0.01)), bright = visibleXYZ(...at(0.31272, 0.32903, 1e4))
	is(dim && bright, true, 'D65 chromaticity is a colour at any luminance (0.01 … 10000)')
})

test('visible: the boundary sits exactly on the locus', () => {
	// nudge each vertex toward / away from equal-energy white: in is a colour, out is not
	const P = locus(), E = [1 / 3, 1 / 3]
	let inOk = 0, outOk = 0
	for (const [x, y] of P) {
		const nudge = (t) => at(x + (E[0] - x) * t, y + (E[1] - y) * t)
		if (visibleXYZ(...nudge(0.04))) inOk++
		if (!visibleXYZ(...nudge(-0.04))) outOk++
	}
	is(inOk, P.length, `every vertex nudged 4% inward is a colour (${inOk}/${P.length})`)
	is(outOk, P.length, `every vertex nudged 4% outward is not (${outOk}/${P.length})`)
})
