// Authoritative differential test against colorjs.io — the implementation by the
// CSS Color 4/5 spec editors (Lea Verou, Chris Lilley). For every overlapping
// space, colorjs is the oracle.
//
// We cross-validate BOTH directions through colorjs, comparing in sRGB (so hue
// wrap / achromatic ambiguity never matters):
//   A) color-space rgb->S, reinterpreted by colorjs as S, back to sRGB == original
//   B) colorjs srgb->S, reinterpreted by color-space as S, back to rgb     == original
// Each direction is checked against the CORRECT colorjs counterpart, so a
// self-cancelling forward/inverse bug (e.g. the oklab linearization bug) is caught
// where a plain roundtrip would hide it.
import space from '../index.js'
import Color from 'colorjs.io'
import test, { is } from 'tst'

const SAMPLES = [
	[255, 0, 0], [0, 255, 0], [0, 0, 255],
	[255, 255, 0], [0, 255, 255], [255, 0, 255],
	[255, 255, 255], [0, 0, 0], [128, 128, 128],
	[200, 100, 50], [33, 180, 90], [100, 150, 200], [240, 24, 120], [17, 17, 17],
]

// color-space name -> [colorjs id, per-channel scale]  (cs_value * scale = colorjs_value)
export const MAP = {   // exported: test/index.js pins differential ∪ bonafide = all spaces
	lrgb:              ['srgb-linear',     [1, 1, 1]],
	p3:                ['p3',              [1, 1, 1]],
	'p3-linear':       ['p3-linear',       [1, 1, 1]],
	rec2020:           ['rec2020',         [1, 1, 1]],
	'rec2020-linear':  ['rec2020-linear',  [1, 1, 1]],
	a98rgb:            ['a98rgb',          [1, 1, 1]],
	'a98rgb-linear':   ['a98rgb-linear',   [1, 1, 1]],
	prophoto:          ['prophoto',        [1, 1, 1]],
	'prophoto-linear': ['prophoto-linear', [1, 1, 1]],
	xyz:               ['xyz-d65',         [1 / 100, 1 / 100, 1 / 100]],
	'xyz-d50':         ['xyz-d50',         [1 / 100, 1 / 100, 1 / 100]],
	lab:               ['lab',             [1, 1, 1]],         // cs lab is now D50 (ICC/CSS)
	'lab-d65':         ['lab-d65',         [1, 1, 1]],
	lchab:             ['lch',             [1, 1, 1]],         // cs lchab is D50 polar -> colorjs lch
	luv:               ['luv',             [1, 1, 1]],         // CIE Luv — both D65
	lchuv:             ['lchuv',           [1, 1, 1]],
	oklab:             ['oklab',           [1, 1, 1]],
	oklch:             ['oklch',           [1, 1, 1]],
	hsl:               ['hsl',             [1, 1, 1]],
	hsv:               ['hsv',             [1, 1, 1]],
	hwb:               ['hwb',             [1, 1, 1]],
	jzazbz:            ['jzazbz',           [1, 1, 1]],
	jzczhz:            ['jzczhz',           [1, 1, 1]],
	ictcp:             ['ictcp',            [1, 1, 1]],
	acescg:            ['acescg',           [1, 1, 1]],
	acescc:            ['acescc',           [1, 1, 1]],
	cam16:             ['cam16-jmh',        [1, 1, 1]],         // J, M, h
	'rec2100-pq':      ['rec2100pq',        [1, 1, 1]],         // colorjs id is unhyphenated
	'rec2100-hlg':     ['rec2100hlg',       [1, 1, 1]],
}

const SKIP = new Set([])

// Tolerance in sRGB code values (0-255). 1.0 is sub-perceptual (< 0.4%) yet catches
// real bugs with huge margin (every bug found was 20-1330). The headroom over the
// ~0.1 precision floor absorbs cross-library float noise at achromatic points (e.g.
// colorjs reports Cz≈2e-4 for white, which a faithful inverse turns into ~0.5).
const TOL = 1.0

for (const [name, [id, scale]] of Object.entries(MAP)) {
	if (SKIP.has(name)) continue
	test(`ref: ${name} <-> colorjs ${id}`, () => {
		let maxA = 0, maxB = 0
		for (const rgb of SAMPLES) {
			const srgb = rgb.map(x => x / 255)
			// A) color-space forward, colorjs inverse
			const csFwd = space.rgb[name](...rgb).map((v, i) => v * scale[i])
			const aBack = new Color(id, csFwd).to('srgb').coords.map(x => x * 255)
			maxA = Math.max(maxA, ...aBack.map((v, i) => Math.abs(v - rgb[i])))
			// B) colorjs forward, color-space inverse (NaN = colorjs powerless hue on achromatic -> 0)
			const cjFwd = new Color('srgb', srgb).to(id).coords.map((v, i) => (Number.isNaN(v) ? 0 : v) / scale[i])
			const bBack = space[name].rgb(...cjFwd)
			maxB = Math.max(maxB, ...bBack.map((v, i) => Math.abs(v - rgb[i])))
		}
		is(maxA < TOL && maxB < TOL, true, `${name}: fwd err ${maxA.toFixed(3)}, inv err ${maxB.toFixed(3)} (tol ${TOL})`)
	})
}

// Declared ranges are pinned to colorjs.io's reference ranges — the convention this
// library promises. Regression: luv/lchuv shipped ±100 / 0-150 vs the authority's
// ±215 / 0-220 and nothing caught the drift.
const RANGE_SKIP = {
	acescg: 'scene-referred: we declare the 0-1 SDR working slice (0.18 = 18% grey, 1 = diffuse white); ACES half-float headroom reaches 65504 (colorjs refRange)',
	jzczhz: 'Cz 0-0.5, the radial bound of the az/bz ±0.5 box (the oklch convention: C = the Cartesian axis) — Rec.2020 at the 10 000-nit PQ ceiling measures Cz 0.436, so colorjs\'s 1.0 refRange leaves the upper half of the axis unreachable by any light; Jz and Hz still match colorjs',
}
test('ref: declared ranges match colorjs.io refRange', () => {
	for (const [name, [id, scale]] of Object.entries(MAP)) {
		if (name in RANGE_SKIP) continue
		Object.values(Color.Space.get(id).coords).forEach((c, i) => {
			const ref = c.refRange || c.range
			if (!ref) return // colorjs declares no range for this coord
			is(space[name].range[i].map(v => v * scale[i]), ref, `${name}[${i}] == colorjs ${id} refRange`)
		})
	}
})
