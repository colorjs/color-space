// The spectral locus is the boundary of colour itself, and the atlas leans on it:
// EVERY lens voids past it (the picking planes, the sliders, the gamut-membership
// predicate) — an off-locus chromaticity is imaginary at any luminance, so no display
// lens can make it real; the xy panel draws the boundary. One law, one source —
// web/js/core.js — so this pins the law rather than any one surface. The one exemption
// is method:'spectral' (wavelength, kelvin): those coordinates ARE lights on the locus,
// so the test is vacuous for them — and numerically unstable exactly on the polygon.
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
import { classify, inVisSolid, lensFor, locus, plane, ramp, space, visibleXYZ } from '../web/js/core.js'
import './quant.js'

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
	// the object-colour solid lives INSIDE the locus: its convex 128-direction outer
	// hull alone once admitted a slightly-imaginary neighbour (HCT 53,106,56 → Z<0
	// read 'surface' while every slider voided it) – off-locus must refuse outright
	is(inVisSolid(38.63, 23.91, -0.94), false, 'an off-locus XYZ is outside the solid, hull slack or not')
	is(inVisSolid(41, 21, 2), true, 'a deep real red stays inside')
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

test('sliders: CSS ramps interpolate float guides and cut only real validity edges', () => {
	const smooth = ramp('rgb', [128, 128, 128], 0, 0, 255, 4)
	is(smooth.some(stop => /63\.75/.test(stop)), true, 'guides retain sub-byte precision rather than 8-bit terraces')
	is(smooth.every(stop => !/%\s+\d/.test(stop)), true, 'ordinary guides are interpolated, never painted as hard cells')
	const lensed = ramp('oklch', [.7, .2, 90], 1, 0, .4, 12, 'vis')
	const positions = lensed.map(stop => stop.match(/ ([\d.]+)%$/)?.[1]).filter(Boolean)
	is(positions.some((p, i) => i && p === positions[i - 1]), true, 'a genuine human-gamut edge has duplicate hard-boundary stops')
	is(classify('oklch'), classify('oklch'), 'immutable channel classification is shared across render frames')
	is(classify('dkl').archetype,'opponent','signed DKL cardinal axes classify as luminance plus two opponents')
})

test('sliders: sparse colour guides cannot hide measured or disjoint validity spans', () => {
	const hard = stops => { const p = stops.map(stop => stop.match(/ ([\d.]+)%$/)?.[1]).filter(Boolean); return p.filter((x, i) => i && x === p[i - 1]).map(Number) }
	// The global C=0…38 box stores the whole 1943 renotation dataset, but its local
	// MacAdam rim depends on H,V. At 50,6.3 it ends at C=25.4 (66.84% of the lane).
	near(space.munsell.maxChroma(50, 6.3), 25.4, 1e-6, 'Munsell scalar rim matches the renotation lattice')
	const mc = hard(ramp('munsell', [50, 6.3, 15.4], 2, 0, 38, 8, 'vis'))
	near(mc.at(-1), 25.4 / 38 * 100, .02, 'Munsell catalog chroma stops at its local measured rim')
	// These hue sweeps contain validity islands narrower than one 8-guide cell. The
	// colour approximation may stay sparse, but its independent validity scan may not.
	is(hard(ramp('munsell', [50, 6.3, 15.4], 0, 0, 100, 8, 'vis')).length >= 4, true, 'Munsell H keeps every narrow prohibited interval')
	is(hard(ramp('tsl', [45, .63, 107], 0, 0, 360, 8, 'vis')).length >= 4, true, 'TSL T keeps both disjoint valid lobes')   // ≥: the surface lens now GHOSTS beyond the solid, adding legitimate vivid↔ghost edges around the void pair
})

// The limits are a property of the COORDINATE, not the render mode: a palette cell is a
// real display colour, but the coordinate under it can still be out of gamut or imaginary.
// The cluster lenses used to skip the voids and the ghost ("their cells are real display
// colors"), so 16-bit/JND/palette planes filled edge to edge while smooth showed the
// limits. Pin the law on the JS plane (the GPU kernel mirrors it line for line): the
// alpha map must be IDENTICAL across smooth, web-safe and a function quantizer.
test('planes: voids and ghosts are render-mode-independent', () => {
	const alphas = (quant) => {
		let img
		const ctx = { createImageData: (w, h) => (img = { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }), putImageData: () => {} }
		// the reported case: CIELAB L=78, a×b swept past the declared box under the sRGB
		// lens (±160 reaches the off-locus corner) — the field carries all three states:
		// in-gamut (255), out-of-sRGB ghost (128), imaginary void (0)
		plane(ctx, 24, 'lab', [78, 0, 0], 1, 2, [-160, 160], [-160, 160], true, 'srgb', quant)
		return Array.from({ length: 24 * 24 }, (_, i) => img.data[i * 4 + 3])
	}
	const q565 = rgb => rgb.map((v, k) => Math.round(Math.round(v / 255 * (k === 1 ? 63 : 31)) / (k === 1 ? 63 : 31) * 255))
	const smooth = alphas(null), web = alphas('web'), pal = alphas(q565)
	is(new Set(smooth).size >= 3, true, 'the slice carries full, ghost and void pixels')
	is(web.join(), smooth.join(), 'web-safe voids and ghosts exactly like smooth')
	is(pal.join(), smooth.join(), 'a cluster quantizer voids and ghosts exactly like smooth')
})

// A SPECTRAL space's coordinate is a light — a monochromatic line (wavelength), a
// Planckian radiator (kelvin) — real by definition, so the human lens shows all of it.
// The locus test is vacuous for these (their samples sit ON the locus polygon, where
// even-odd flips at random) and the object-colour solid is the wrong body (a laser is
// no reflectance, yet perfectly visible): the bar used to void most of its own range.
test('sliders: a spectral space is fully visible under the human lens', () => {
	for (const [s, lo, hi] of [['wavelength', 380, 700], ['kelvin', 1000, 40000]]) {
		const visL = lensFor(s, 'vis'), srgbL = lensFor(s, 'srgb')
		let full = 0, voided = 0, n = 0
		for (let i = 0; i <= 64; i++) { const v = [lo + (hi - lo) * i / 64]; n++
			if (visL(v) === 1) full++
			if (srgbL(v) === 0) voided++ }
		is(full, n, `${s}: every coordinate is a colour under the human lens (${full}/${n})`)
		is(voided, 0, `${s}: the display lens ghosts, never voids, a real light`)
	}
	// no spectral line fits inside a display triangle — the sRGB lens ghosts all of it
	is(lensFor('wavelength', 'srgb')([550]), 0.5, 'a monochromatic 550 nm line ghosts under sRGB')
})

test('visible: a chromaticity space carrying luminance is cut at the luminance it holds', () => {
	// xyY, u′v′Y, Yrg, DSH, MacLeod–Boynton hold Y in a channel: an sRGB color is inside sRGB at its own luminance, and the
	// same chromaticity past the luminance its peak channel allows is not (sRGB, IEC 61966-2-1: #009A6B's linear G is
	// 0.3231 at Y = 24.17, so G reaches 1 at Y ≈ 74.8). The direction law (any luminance) is the 2-channel spaces' alone
	for (const s of ['xyy', 'uv', 'yrg', 'dsh', 'macboyn']) for (const c of [[0, 154, 107], [128, 128, 128], [51, 102, 204]])
		is(lensFor(s, 'srgb')(space.rgb[s](...c)), 1, `${s}: rgb(${c}) is in sRGB at its own luminance`)
	const [x, y] = space.rgb.xyy(0, 154, 107)
	is(lensFor('xyy', 'srgb')([x, y, 50]), 1, 'xyY: #009A6B\'s chromaticity at Y 50 – within sRGB')
	is(lensFor('xyy', 'srgb')([x, y, 90]), 0.5, 'xyY: at Y 90 – past sRGB\'s peak for that chromaticity, ghosted')
	is(lensFor('rg', 'srgb')(space.rgb.rg(0, 154, 107)), 1, 'rg (no luminance): the direction law still')
})

test('visible: the display lens is the kernel\'s – its encoded pad, its round trip', () => {
	// half a code value in ENCODED units (gl.js uGam): a linear light of −0.001 is −13 code values below black, not in sRGB –
	// a ±0.005 linear pad let it in. A fold (HWB's w + b > 100: a gray whose numbers read back as another address) ghosts
	is(lensFor('lrgb', 'srgb')([-0.001, 0.5, 0.5]), 0.5, 'a slightly negative linear channel: past sRGB')
	is(lensFor('lrgb', 'srgb')([0.5, 0.5, 0.5]), 1, 'a linear gray: in')
	is(lensFor('hwb', 'srgb')([0, 70, 60]), 0.5, 'hwb w + b > 100: a fold, ghosted')
	is(lensFor('hwb', 'srgb')([0, 20, 20]), 1, 'hwb inside: a color')
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

// core.js answers the locus and the solid from lazily classified grids – a strip asks them hundreds of times, the catalog
// thousands a frame. Exactness is the contract: the fast answers must be the law's, bit for bit, everywhere – and hardest
// where the grids hand over, along the curve and the solid's surface. The references: the law itself (visible.js, the one
// color-space/util asks) and the solid's 512-plane support test as written, sRGB's own fast accept included
test('visible: the grids answer exactly as the law', async () => {
	const { default: visibility } = await import('../web/js/visible.js')
	const { visSolid } = await import('../web/js/core.js')
	const law = visibility(space).visibleXYZ, B = [space.xyz.lrgb(1, 0, 0), space.xyz.lrgb(0, 1, 0), space.xyz.lrgb(0, 0, 1)]
	const inSRGB = (X, Y, Z) => [0, 1, 2].every(i => { const u = B[0][i] * X + B[1][i] * Y + B[2][i] * Z; return u >= 0 && u <= 1 })
	const solid = (X, Y, Z) => isFinite(X) && isFinite(Y) && isFinite(Z) && (inSRGB(X, Y, Z) || law(X, Y, Z) && visSolid().every(([ux, uy, uz, h]) => !(ux * X + uy * Y + uz * Z > h * 1.002)))
	let seed = 7; const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647
	const T = c => Math.min(...visSolid().map(([ux, uy, uz, h]) => { const d = ux * c[0] + uy * c[1] + uz * c[2]; return d > 0 ? h * 1.002 / d : Infinity }))
	const P = locus(), pts = []
	for (let k = 0; k < 60000; k++) { const x = rnd() * .8, y = rnd() * .9 + 1e-3, Y = rnd() ** .5 * 110; pts.push(at(x, y, Y)) }   // everywhere
	for (let k = 0; k < 30000; k++) { const a = P[k % P.length], b = P[(k + 1) % P.length], t = rnd(), e = (rnd() - .5) * 4e-3   // along the curve and the line of purples, within ±2·EPS
		pts.push(at(a[0] + (b[0] - a[0]) * t + e, a[1] + (b[1] - a[1]) * t + (rnd() - .5) * 4e-3, rnd() * 100 + 1)) }
	for (let k = 0; k < 30000; k++) { const x = .15 + rnd() * .5, y = .05 + rnd() * .65, c = [x, y, 1 - x - y], s = T(c) * (1 + (rnd() - .5) * (k % 3 ? 2e-2 : 2e-8))   // at the solid's surface, to a hair
		pts.push([s * c[0], s * c[1], s * c[2]]) }
	pts.push([0, 0, 0], [1e-12, 1e-12, 1e-12], [-1e-7, 0, 0], [NaN, 1, 1], [Infinity, 1, 1], [-5, 50, 20])
	let locusOff = 0, solidOff = 0
	for (let pass = 0; pass < 3; pass++)   // a solid cell is bounded on its third ask: the last pass answers from the bounds
		for (const p of pts) { if (visibleXYZ(...p) !== law(...p)) locusOff++; if (inVisSolid(...p) !== solid(...p)) solidOff++ }
	is(locusOff, 0, `the locus grid: ${pts.length} points, three times over, none answered otherwise`)
	is(solidOff, 0, `the solid's bounds: ${pts.length} points, three times over, none answered otherwise`)
	// the human lens takes a color sRGB holds as inside without asking the locus: sRGB's triangle lies inside it
	let out = 0
	for (let k = 0; k < 20000; k++) { const X = space.lrgb.xyz(rnd(), rnd(), rnd()); if (inSRGB(...X) && !law(...X)) out++ }
	is(out, 0, 'every color sRGB holds is inside the locus')
})
