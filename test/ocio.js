// Pin the OpenColorIO exporter to the scalar library.
//
// colorspace() promises exactness, so this file runs each snippet the way OCIO does:
// an evaluator of exactly the transforms ocio.js emits, forward and inverse, transcribed
// from OCIO's CPU renderers (ops/log/LogOpCPU.cpp + LogUtils.cpp for LogCamera/LogAffine,
// ops/gamma/GammaOpCPU.cpp + GammaOpUtils.cpp for Exponent/ExponentWithLinear, matrix as is),
// fed from the YAML text itself, against color-space's conversions over codes from below the
// toe to 25% above the range (break regions sampled densely). The bar, both references: within
// 1e-6 of the value, floored at 0.18 mid grey (the metric of test/aces-vendor.js), code→reference
// (forward error) and reference→code (backward error: the library decodes OCIO's code back to the
// same color; a code-unit metric would read a pure gamma's infinite slope at 0, or a 4000× highlight
// bleeding into a small channel, as disagreement).
//   xyz-d65    the library's own XYZ
//   aces2065-1 the library's XYZ carried to AP0 by the Academy recipe (ACESlib.Utilities_Color
//              calculate_rgb_to_rgb_matrix), coded apart from ocio.js
// The composed matrices are pinned to the Academy's numbers, and the near misses (what a native
// transform almost fits) are shown to miss, so every null is earned too.
import test, { is, ok, throws } from 'tst'
import space from '../index.js'
import { colorspace } from '../ocio.js'
import { gamut } from '../gamuts.js'
import data from '../data.json' with { type: 'json' }

const DATA = data.spaces

// --- the evaluator: OCIO's formulas in double precision ----------------------------------

const FLT_MIN = 1.1754943508222875e-38
const inv3 = (m) => {
	const [a, b, c, d, e, f, g, h, i] = m
	const A = e * i - f * h, B = f * g - d * i, C = d * h - e * g, det = a * A + b * B + c * C
	return [A / det, (c * h - b * i) / det, (b * f - c * e) / det, B / det, (a * i - c * g) / det, (c * d - a * f) / det, C / det, (b * g - a * h) / det, (a * e - b * d) / det]
}
const mat3 = (m, [x, y, z]) => [m[0] * x + m[1] * y + m[2] * z, m[3] * x + m[4] * y + m[5] * z, m[6] * x + m[7] * y + m[8] * z]

// LogUtils GetLinearSlope / GetLogSideBreak / GetLinearOffset
const camera = (p) => {
	const lg = (x) => Math.log(x) / Math.log(p.base)
	const k = p.linear_slope ?? p.log_side_slope * p.lin_side_slope / ((p.lin_side_slope * p.lin_side_break + p.lin_side_offset) * Math.log(p.base))
	const logBreak = p.log_side_slope * lg(p.lin_side_slope * p.lin_side_break + p.lin_side_offset) + p.log_side_offset
	return { lg, k, logBreak, off: logBreak - k * p.lin_side_break }
}

// each op: (params, inverse) → per-pixel function; 'forward' is the op's own forward
const OPS = {
	MatrixTransform: ({ matrix: m }, inv) => {
		const M = [m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]], A = inv ? inv3(M) : M
		return (v) => mat3(A, v)
	},
	// GammaBasic*: pow(x, value); clamp (default), mirror, pass_thru below 0
	ExponentTransform: ({ value, style = 'clamp' }, inv) => {
		const e = inv ? 1 / value : value
		return (v) => v.map((x) => style === 'mirror' ? Math.sign(x) * Math.abs(x) ** e : style === 'pass_thru' && x < 0 ? x : Math.max(0, x) ** e)
	},
	// GammaMoncurve*: break and slope implied by gamma and offset (monCurve*Fwd/Rev), linear or mirror below 0
	ExponentWithLinearTransform: ({ gamma, offset, style = 'linear' }, inv) => {
		const g = Math.max(gamma, 1 + 1e-6), o = Math.max(offset, 1e-6)
		const f = inv
			? ((brk, s) => (y) => y <= brk ? y * s : y ** (1 / g) * (1 + o) - o)((o * g / ((g - 1) * (1 + o))) ** g, ((g - 1) / o) ** (g - 1) * ((1 + o) / g) ** g)
			: ((brk, s) => (x) => x <= brk ? x * s : ((x + o) / (1 + o)) ** g)(o / (g - 1), (g - 1) / o * (o * g / ((g - 1) * (1 + o))) ** g)
		return (v) => v.map((x) => style === 'mirror' ? Math.sign(x) * f(Math.abs(x)) : f(x))
	},
	// Lin2Log / Log2Lin: forward lin→log, the argument floored at FLT_MIN
	LogAffineTransform: (p, inv) => {
		const lg = (x) => Math.log(x) / Math.log(p.base)
		return (v) => v.map(inv
			? (y) => (p.base ** ((y - p.log_side_offset) / p.log_side_slope) - p.lin_side_offset) / p.lin_side_slope
			: (x) => p.log_side_slope * lg(Math.max(FLT_MIN, p.lin_side_slope * x + p.lin_side_offset)) + p.log_side_offset)
	},
	// CameraLin2Log / CameraLog2Lin: the linear segment below the break, joined to the log there
	LogCameraTransform: (p, inv) => {
		const { lg, k, logBreak, off } = camera(p)
		return (v) => v.map(inv
			? (y) => y < logBreak ? (y - off) / k : (p.base ** ((y - p.log_side_offset) / p.log_side_slope) - p.lin_side_offset) / p.lin_side_slope
			: (x) => x < p.lin_side_break ? k * x + off : p.log_side_slope * lg(Math.max(FLT_MIN, p.lin_side_slope * x + p.lin_side_offset)) + p.log_side_offset)
	},
}
// a chain, code→reference (inverse: reference→code, reversed, each op flipped)
const run = (ops, v, inverse = false) => (inverse ? [...ops].reverse() : ops)
	.reduce((x, o) => OPS[o.type](o, (o.direction === 'inverse') !== inverse)(x), v)

// --- the snippet, read back from its YAML --------------------------------------------------

const parse = (text) => {
	const lines = text.trimEnd().split('\n')
	const field = (k) => lines.find((l) => l.startsWith(`    ${k}: `))?.slice(k.length + 6)
	const ops = lines.filter((l) => /^ {4}to_scene_reference: !<(?!GroupTransform)|^ {8}- !</.test(l)).map((l) => {
		const [, type, body] = l.match(/!<(\w+)> \{(.*)\}$/)
		const o = { type }
		for (const kv of body.split(/, (?![^[]*\])/)) {
			const [k, v] = kv.split(': ')
			o[k] = v.startsWith('[') ? JSON.parse(v) : isNaN(+v) ? v : +v
		}
		return o
	})
	return { lines, ops, name: field('name'), family: field('family'), bitdepth: field('bitdepth'), encoding: field('encoding'), description: field('description') }
}

// --- the Academy recipe, column-vector, as test/aces-vendor.js transcribes it ------------

const XYZw = ([x, y]) => [x / y, 1, (1 - x - y) / y]
const flat = (M) => M.flat()
const npm = ({ primaries: { r, g, b }, white }) => {
	const P = [XYZw(r), XYZw(g), XYZw(b)], Pt = [0, 1, 2].map((i) => P.map((c) => c[i]))
	const S = mat3(inv3(flat(Pt)), XYZw(W[white]))
	return Pt.map((row) => row.map((v, j) => v * S[j]))
}
const W = { D65: [0.3127, 0.329], D50: [0.3457, 0.3585], D55: [0.3324, 0.3474], C: [0.3101, 0.3162], E: [1 / 3, 1 / 3], DCI: [0.314, 0.351], ACES: [0.32168, 0.33767] }
const matmul = (A, B) => A.map((r, i) => r.map((_, j) => A[i][0] * B[0][j] + A[i][1] * B[1][j] + A[i][2] * B[2][j]))
const unflat = (m) => [m.slice(0, 3), m.slice(3, 6), m.slice(6, 9)]
// calculate_cat_matrix: von Kries in the cone space
const cat = (src, dst, cone) => {
	const s = mat3(flat(cone), XYZw(W[src])), d = mat3(flat(cone), XYZw(W[dst]))
	return matmul(unflat(inv3(flat(cone))), matmul([[d[0] / s[0], 0, 0], [0, d[1] / s[1], 0], [0, 0, d[2] / s[2]]], cone))
}
const CAT02 = [[0.7328, 0.4296, -0.1624], [-0.7036, 1.6975, 0.0061], [0.0030, 0.0136, 0.9834]]
const BRADFORD = [[0.8951, 0.2664, -0.1614], [-0.7502, 1.7135, 0.0367], [0.0389, -0.0685, 1.0296]]
// chromaticities as ACESlib.Utilities_Color prints them (test/aces-vendor.js), not gamuts.js
const P = (r, g, b, white) => ({ primaries: { r, g, b }, white })
const CTL = {
	AP0: P([0.7347, 0.2653], [0, 1], [0.0001, -0.077], 'ACES'),
	AWG3: P([0.684, 0.313], [0.221, 0.848], [0.0861, -0.102], 'D65'),
	VGAMUT: P([0.73, 0.28], [0.165, 0.84], [0.1, -0.03], 'D65'),
	RWG: P([0.780308, 0.304253], [0.121595, 1.493994], [0.095612, -0.084589], 'D65'),
}
const AP0inv = unflat(inv3(flat(npm(CTL.AP0))))
// calculate_rgb_to_rgb_matrix(src, AP0, cone)
const rgb2aces = (g, cone) => matmul(AP0inv, matmul(cat(g.white, 'ACES', cone), npm(g)))

// Sony-typed IDT matrices, IDT.Sony.SLog3_SGamut3{,Cine}.ctl (aces-dev v1.3), as in test/aces-vendor.js
const SONY_SGAMUT3_MAT = [[0.7529825954, 0.1433702162, 0.1036471884], [0.0217076974, 1.0153188355, -0.0370265329], [-0.0094160528, 0.0033704179, 1.0060456349]]
const SONY_SGAMUT3CINE_MAT = [[0.6387886672, 0.2723514337, 0.0888598991], [-0.0039159060, 1.0880732309, -0.0841573249], [-0.0299072021, -0.0264325799, 1.0563397820]]

// --- the library side -----------------------------------------------------------------------

// the white each space's linear RGB is native to, and the cone matrix of its official ACES
// transform (Bradford: the Academy's V-Log and Log3G10 CSCs; CAT02 elsewhere, its IDT convention)
const whiteOf = (id) => ({ xyz: 'D65', 'xyz-d50': 'D50' })[id] ?? gamut[DATA[id].gamut].white
const coneOf = (id) => ['vgamut', 'rwg'].includes(DATA[id]?.gamut) ? BRADFORD : CAT02

// OCIO pixels are the library's channels, but XYZ: Y = 1 in OCIO, 100 here
const UNIT = { xyz: 100, 'xyz-d50': 100 }
const unit = (id) => UNIT[id] ?? 1
const libXYZ = (id, c) => space[id].xyz(...c.map((v) => v * unit(id))).map((v) => v / 100)
const libACES = (id, c) => {
	const w = whiteOf(id)
	if (w === 'ACES') return space[id]['aces2065-1'](...c)
	// the library's D65 hub adapts by Bradford: undo it, then the Academy recipe from the native white
	const M = matmul(AP0inv, matmul(cat(w, 'ACES', coneOf(id)), cat('D65', w, BRADFORD)))
	return mat3(flat(M), libXYZ(id, c))
}

// error as a fraction of the color's magnitude, floored at 0.18 mid grey (test/aces-vendor.js)
const rel = (got, exp) => Math.max(...got.map((g, i) => Math.abs(g - exp[i]))) / Math.max(0.18, ...exp.map(Math.abs))
// forward and backward error of a chain against the library's code→reference map
const errors = (id, ops, lib) => {
	let fwd = 0, back = 0
	for (const c of grid(id, ops)) {
		const ref = lib(id, c)
		fwd = Math.max(fwd, rel(run(ops, c), ref))
		back = Math.max(back, rel(lib(id, run(ops, ref, true)), ref))
	}
	return { fwd, back }
}

// codes: a 13-step lattice from 10% below the range to 25% above, the curve's break ± ε on
// every channel, and a 1001-step neutral sweep
const breaks = (ops) => ops.flatMap((o) =>
	o.type === 'LogCameraTransform' ? [camera(o).logBreak]
		: o.type === 'ExponentWithLinearTransform' ? [o.offset / (o.gamma - 1)]
			: o.type === 'MatrixTransform' ? [] : [0])
const grid = (id, ops) => {
	const [lo, hi] = space[id].range[1].map((v) => v / unit(id)), span = hi - lo, a = lo - 0.1 * span, b = hi + 0.25 * span
	const ax = Array.from({ length: 13 }, (_, i) => a + (b - a) * i / 12), out = []
	for (const r of ax) for (const g of ax) for (const bl of ax) out.push([r, g, bl])
	for (const k of breaks(ops)) for (const e of [0, 1e-12, 1e-9, 1e-6, 1e-4, 1e-2]) for (const v of [k - e, k + e])
		out.push([v, v, v], [v, lo + 0.3 * span, lo + 0.6 * span], [lo + 0.6 * span, v, lo + 0.3 * span], [lo + 0.3 * span, lo + 0.6 * span, v])
	for (let i = 0; i <= 1000; i++) { const v = a + (b - a) * i / 1000; out.push([v, v, v]) }
	return out
}

const IDS = Object.keys(space).filter((id) => colorspace(id) !== null)
const KIND = (ops) => ops.find((o) => o.type !== 'MatrixTransform')?.type ?? 'MatrixTransform'

// --- tests ------------------------------------------------------------------------------------

test('ocio: the supported set', () => {
	is(IDS.length, 53, `${IDS.length} of ${Object.keys(space).length} spaces have an exact native snippet`)
	for (const id of ['xyz', 'acescg', 'aces2065-1', 'sgamut3cine', 'slog3', 'logc3', 'logc4', 'vlog', 'log3g10', 'acescct', 'davinci', 'bmdfilm', 'rec2020', 'a98rgb', 'ecirgb', 'olog2'])
		ok(IDS.includes(id), `${id} has a snippet`)
	is(colorspace(space.slog3), colorspace('slog3'), 'space object and id give the same snippet')
	throws(() => colorspace('slog3', { reference: 'acescg' }), /reference/, 'an unknown reference throws')
})

for (const reference of ['xyz-d65', 'aces2065-1']) test(`ocio: every snippet against the library, reference ${reference}`, () => {
	const lib = reference === 'xyz-d65' ? libXYZ : libACES
	const res = IDS.map((id) => { const { ops } = parse(colorspace(id, { reference })); return { id, kind: KIND(ops), ...errors(id, ops, lib) } })
	is(res.filter((r) => !(r.fwd < 1e-6 && r.back < 1e-6)).map((r) => r.id), [], `all ${res.length} within 1e-6 both ways`)
	const worst = {}
	for (const { id, kind, fwd, back } of res) {
		ok(true, `${id}: code→ref ${fwd.toExponential(1)}, ref→code ${back.toExponential(1)}`)
		const w = worst[kind] ??= { fwd: 0, back: 0, n: 0 }
		w.fwd = Math.max(w.fwd, fwd); w.back = Math.max(w.back, back); w.n++
	}
	for (const [k, w] of Object.entries(worst)) ok(true, `${k} (${w.n}): max code→ref ${w.fwd.toExponential(2)}, ref→code ${w.back.toExponential(2)}`)
})

test('ocio: ACES2065-1 matrices against the Academy', () => {
	const mat = (id) => unflat(((m) => [m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]])(parse(colorspace(id)).ops.find((o) => o.type === 'MatrixTransform').matrix))
	const diff = (A, B) => Math.max(...A.flat().map((v, i) => Math.abs(v - B.flat()[i])))
	const pins = [
		// Sony prints 10 decimals
		['sgamut3cine', SONY_SGAMUT3CINE_MAT, 'IDT.Sony.SLog3_SGamut3Cine.ctl', 1e-10],
		['slog3', SONY_SGAMUT3_MAT, 'IDT.Sony.SLog3_SGamut3.ctl', 1e-10],
		['logc3', rgb2aces(CTL.AWG3, CAT02), 'ACEScsc.Academy.LogC_EI800_AWG_to_ACES (CAT02)', 1e-14],
		['vlog', rgb2aces(CTL.VGAMUT, BRADFORD), 'ACEScsc.Academy.VLog_VGamut_to_ACES (Bradford)', 1e-14],
		['log3g10', rgb2aces(CTL.RWG, BRADFORD), 'ACEScsc.Academy.Log3G10_RWG_to_ACES (Bradford)', 1e-14],
	]
	for (const [id, M, src, tol] of pins) {
		const d = diff(mat(id), M)
		ok(d < tol, `${id} vs ${src}: max |Δ| ${d.toExponential(2)} < ${tol}`)
	}
	// same-white spaces adapt nothing: AP1 → AP0 from the primaries
	ok(diff(mat('acescg'), matmul(AP0inv, npm(gamut.ap1))) < 1e-15, 'ACEScg: AP1 → AP0 from the primaries, no adaptation')
})

test('ocio: the YAML entry', () => {
	const t = colorspace(space.sgamut3cine), p = parse(t)
	is(p.lines[0], '  - !<ColorSpace>', 'a list item to paste under colorspaces:')
	ok(p.lines.slice(1).every((l) => /^ {4}\S|^ {6,}\S/.test(l)), 'its fields indented under it')
	is(p.name, 'S-Log3 S-Gamut3.Cine', 'name')
	is(p.family, 'color-space', 'family')
	is(p.bitdepth, '32f', 'bitdepth')
	is(p.encoding, 'log', 'encoding')
	is(JSON.parse(p.description), 'S-Log3 S-Gamut3.Cine to ACES2065-1, D65 to the ACES white by CAT02. From color-space, https://color-space.io/sgamut3cine', 'description names the reference, the adaptation, the page')
	is(p.ops.map((o) => o.type), ['LogCameraTransform', 'MatrixTransform'], 'decode, then the matrix')
	is(p.ops[0].direction, 'inverse', 'LogCamera runs log→lin')
	ok(t.endsWith('\n') && !/[\u2014\u00b7]/.test(t), 'newline-terminated, plain punctuation')
	ok(JSON.parse(parse(colorspace(space.vlog)).description).includes('by Bradford'), 'V-Log names its Bradford adaptation')
	ok(!parse(colorspace(space.acescg)).description.includes(' by '), 'ACES-white spaces adapt nothing')
	is(parse(colorspace('aces2065-1')).ops.length, 0, 'the reference itself has no transform')
	is(parse(colorspace('xyz', { reference: 'xyz-d65' })).ops.length, 0, 'so does XYZ D65 under xyz-d65')
	for (const id of IDS) {
		const q = parse(colorspace(id))
		ok(/^[\w .()+/-]+$/.test(q.name) && q.description.includes(`https://color-space.io/${id}`), `${id}: plain-scalar name "${q.name}", page linked`)
		is(q.encoding, { MatrixTransform: 'scene-linear', ExponentTransform: 'sdr-video', ExponentWithLinearTransform: 'sdr-video', LogAffineTransform: 'log', LogCameraTransform: 'log' }[KIND(q.ops)], `${id}: encoding ${q.encoding}`)
	}
	is(new Set(IDS.map((id) => parse(colorspace(id)).name)).size, IDS.length, 'names are unique')
})

test('ocio: null where no native transform is exact', () => {
	// structurally out of reach: a cube root, a quadratic toe, a log below 0, a mirrored log,
	// quantized codes, PQ, HLG, no catalogued primaries, not RGB
	for (const id of ['nlog', 'applelog', 'applelog2', 'milog', 'clog', 'clog2', 'clog3', 'samsunglog', 'log3g12', 'gplog2',
		'acescc', 'acesproxy', 'rec2100-pq', 'rec2100-hlg', 'cineon', 'redlogfilm', 'protune', 'oklab', 'lab', 'hsl', 'ycbcr'])
		is(colorspace(id), null, `${id}: null`)
	// near misses: the best native candidate, from the vendor constants, misses the 1e-6 bar
	const cam = (p) => ({ type: 'LogCameraTransform', ...p, direction: 'inverse' })
	const MISS = {
		// sRGB / Display P3: IEC 61966-2-1 0.04045, 12.92 vs the moncurve tangent 0.0392857, 12.9232
		p3: [{ type: 'ExponentWithLinearTransform', gamma: 2.4, offset: 0.055, style: 'mirror' }],
		// BT.709: 0.081, 4.5 vs the tangent's slope 4.5137
		rec709: [{ type: 'ExponentWithLinearTransform', gamma: 1 / 0.45, offset: 0.099, style: 'mirror' }],
		'smpte-240m': [{ type: 'ExponentWithLinearTransform', gamma: 1 / 0.45, offset: 0.1115, style: 'mirror' }],
		// ROMM RGB: a 16x toe below 1/512 that no power reaches
		prophoto: [{ type: 'ExponentTransform', value: 1.8, style: 'mirror' }],
		// toes that miss the log at the cut: F-Log 1e-4, L-Log 9e-4, D-Log 2e-6 in code (on D-Gamut's matrix, below)
		flog: [cam({ base: 10, log_side_slope: 0.344676, log_side_offset: 0.790453, lin_side_slope: 0.555556, lin_side_offset: 0.009468, lin_side_break: 0.00089, linear_slope: 8.735631 })],
		llog: [cam({ base: 10, log_side_slope: 0.27, log_side_offset: 0.6, lin_side_slope: 1.3, lin_side_offset: 0.0115, lin_side_break: 0.006, linear_slope: 8 })],
		dlog: [cam({ base: 10, log_side_slope: 0.256663, log_side_offset: 0.584555, lin_side_slope: 0.9892, lin_side_offset: 0.0108, lin_side_break: 0.0078, linear_slope: 6.025 })],
		// library matrices off their catalogued primaries: DJI's printed 4 decimals, 5-decimal CIE RGB, NTSC's 8 decimals
		dgamut: [], 'cie-rgb': [], ntsc: [{ type: 'ExponentTransform', value: 2.2, style: 'mirror' }],
	}
	for (const [id, curve] of Object.entries(MISS)) {
		is(colorspace(id), null, `${id}: null`)
		const g = gamut[DATA[id].gamut], P = flat(matmul(cat(g.white, 'D65', BRADFORD), npm(g)))
		const ops = [...curve, { type: 'MatrixTransform', matrix: [P[0], P[1], P[2], 0, P[3], P[4], P[5], 0, P[6], P[7], P[8], 0, 0, 0, 0, 1] }]
		const { fwd, back } = errors(id, ops, libXYZ)
		ok(fwd > 1e-6 || back > 1e-6, `${id}: best native candidate misses, code→ref ${fwd.toExponential(1)}, ref→code ${back.toExponential(1)}`)
	}
})
