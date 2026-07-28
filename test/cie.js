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

test('dkl: calibrated Cartesian axes surround the adapting background', () => {
	is(space.dkl.range, [[-1, 1], [-1.7, 1.7], [-1.85, 1.85]], 'ranges cover the sRGB cube on signed cardinal axes')
	const bg=space.dkl.rgb(0,0,0), rgp=space.dkl.rgb(0,1,0), rgn=space.dkl.rgb(0,-1,0), byp=space.dkl.rgb(0,0,1), byn=space.dkl.rgb(0,0,-1)
	is(Math.max(...bg)-Math.min(...bg)<1e-3&&Math.abs(bg[0]-187.516)<1e-3,true,'origin is 50%-linear D65, not display white')
	is(rgp[0]>rgp[1]&&rgn[1]>rgn[0],true,'red-green axis has two genuinely opponent directions')
	is(byp[2]>byp[0]&&byn[2]<byn[0],true,'tritan axis has two genuinely opponent directions')
	let err=0
	for(const r of [0,255])for(const g of [0,255])for(const b of [0,255]){ const d=space.rgb.dkl(r,g,b), back=space.dkl.rgb(...d); err=Math.max(err,Math.abs(back[0]-r),Math.abs(back[1]-g),Math.abs(back[2]-b)) }
	is(err<2e-9,true,`the full sRGB cube round-trips through DKL (${err})`)
})

// The atlas's HUMAN gamut is the optimal-colour (Rösch–MacAdam) solid, and it is built
// under D65 — the same white every gamut it is compared against uses. That rests on a
// vendored D65 spectrum, so pin it to an authority the library already ships: integrating
// that spectrum against the CIE 1931 CMFs must reproduce the tabulated D65 white point.
// A typo in the table, or a drift back to equal-energy weighting, fails here.
// @see ISO/CIE 11664-2 (CIE S 014-2) — D65 relative spectral power distribution
test('vis solid: the vendored D65 spectrum reproduces the shipped D65 white point', async () => {
	const { d65, inVisSolid } = await import('../web/js/core.js')
	let X = 0, Y = 0, Z = 0
	for (let nm = 380; nm <= 700; nm++) {
		const c = space.wavelength.xyz(nm), p = d65(nm)
		X += c[0] * p; Y += c[1] * p; Z += c[2] * p
	}
	const k = 100 / Y, got = [X * k, 100, Z * k], wp = whitepoint[2].D65
	// 0.15% covers the 1 nm quadrature vs the tabulated constant; equal-energy weighting
	// lands 5.1% away in X, so this is tight enough to catch that regression
	for (const i of [0, 2])
		is(Math.abs(got[i] - wp[i]) / wp[i] < 0.0015, true,
			`D65 SPD × CMF reproduces white point [${i}]: ${got[i].toFixed(3)} ≈ ${wp[i].toFixed(3)}`)

	// the property the D65 build exists for: every colour a display can show is a colour
	// a surface can show under the same illuminant, so the whole sRGB cube sits inside
	// the solid the human view draws (under equal-energy E, white itself fell outside)
	let out = 0
	for (let r = 0; r <= 8; r++) for (let g = 0; g <= 8; g++) for (let b = 0; b <= 8; b++)
		if (!inVisSolid(...space.rgb.xyz(r * 255 / 8, g * 255 / 8, b * 255 / 8))) out++
	is(out, 0, 'the whole sRGB cube lies inside the D65 object-colour solid')
	is(inVisSolid(...whitepoint[2].D65), true, 'D65 white itself is inside')
	is(inVisSolid(0, 100, 0), false, 'an impossible colour (pure Y, no X or Z) is outside')
})

// inVisSolid is a support-function polytope that OUTER-approximates the zonoid over sampled
// directions. Too few facets and it admits colours past the drawn surface: a 128-facet hull
// overhung OSA-UCS's deep-blue g axis by several units, so the picker's out-of-solid guide
// stayed white well beyond the shape. Pin the shipped hull against the EXACT support
// h(u) = Σ max(0, u·gᵢ) sampled densely, along the very sweep that exposed it (L=-2.3 j=-7.3):
// no coarse facet may admit a point the true convex solid rejects. Fails at 128, passes at 512.
test('vis solid: the membership hull hugs the exact zonoid along the OSA-UCS blue guide', async () => {
	const { d65, inVisSolid } = await import('../web/js/core.js')
	const gen = []   // one XYZ generator per 2 nm band under D65, Y-normalised to 100
	for (let nm = 380; nm <= 700; nm += 2) { const c = space.wavelength.xyz(nm), w = d65(nm); gen.push([c[0] * w, c[1] * w, c[2] * w]) }
	const kk = 100 / gen.reduce((s, v) => s + v[1], 0); for (const v of gen) { v[0] *= kk; v[1] *= kk; v[2] *= kk }
	const exact = (p) => {   // dense support test = the true object-colour solid, same 0.2% slack
		for (let i = 0; i < 4000; i++) {
			const y = 1 - 2 * (i + 0.5) / 4000, r = Math.sqrt(Math.max(0, 1 - y * y)), t = Math.PI * (1 + Math.sqrt(5)) * i
			const u = [r * Math.cos(t), y, r * Math.sin(t)]
			let h = 0; for (const v of gen) { const d = u[0] * v[0] + u[1] * v[1] + u[2] * v[2]; if (d > 0) h += d }
			if (u[0] * p[0] + u[1] * p[1] + u[2] * p[2] > h * 1.002) return false
		}
		return true
	}
	let disagree = 0
	for (let g = -20; g <= 20; g++) { const X = space.osaucs.xyz(-2.3, -7.3, g); if (inVisSolid(...X) !== exact(X)) disagree++ }
	is(disagree, 0, 'inVisSolid matches the exact solid across the OSA-UCS L=-2.3 j=-7.3 sweep')
})
