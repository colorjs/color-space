// Differential check of camera-log → ACES2065-1 composites against the Academy's
// official vendor transforms (ampas/aces-dev v1.3), transcribed verbatim:
// decode curves and matrix recipes from ACEScsc.Academy.*_to_ACES.ctl, plus the
// Sony-typed numeric matrices from IDT.Sony.SLog3_SGamut3(.Cine).ctl and
// IDT.Sony.Venice_SLog3_SGamut3(Cine).ctl, and the density pipelines of
// ACEScsc.Academy.ADX10/ADX16_to_ACES.ctl.
//
// The official transforms adapt the vendor's D65 white to the ACES white with the
// cone matrix each CTL names (CAT02 for ARRI/Canon/Sony, Bradford default for
// Panasonic/RED). color-space routes through its XYZ D65 hub and adapts with
// Bradford, derived from the two whites exactly as the CTL's calculate_cat_matrix
// does, so the Bradford pairs agree to the 1e-10 floor of the 10-decimal AP1→AP0
// matrix, and the CAT02 pairs differ only by the CAT02-vs-Bradford adaptation
// (< 5e-3 of the point's magnitude at gamut extremes). Swapping Bradford into the
// CAT02 recipes collapses that to the vendor curve constants (≤ 7.1e-6, LogC3's
// 6-decimal curve constants vs the CTL's 10-decimal ones). Tolerances sit just
// above those measured maxima; anything larger would flag a real formula defect.
//
// Sources (ampas/aces-dev @ v1.3):
//   transforms/ctl/csc/<vendor>/ACEScsc.Academy.<pair>_to_ACES.ctl
//   transforms/ctl/idt/vendorSupplied/sony/IDT.Sony.SLog3_SGamut3{,Cine}.ctl
//   transforms/ctl/idt/vendorSupplied/sony/IDT.Sony.Venice_SLog3_SGamut3{,Cine}.ctl
//   transforms/ctl/csc/ADX/ACEScsc.Academy.ADX{10,16}_to_ACES.ctl
//   transforms/ctl/lib/ACESlib.Utilities_Color.ctl (primaries, cone matrices)
// and the CTL Manual (ampas/CTL doc/CtlManual.pdf) for the interpolate1D builtin.
import test, { ok } from 'tst'
import space from '../index.js'

// --- CTL math, column-vector convention ---------------------------------------

const mul3 = (M, v) => [
	M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
	M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
	M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]
]
const matmul = (A, B) => A.map((r, i) => r.map((_, j) => A[i][0] * B[0][j] + A[i][1] * B[1][j] + A[i][2] * B[2][j]))
const inv = (M) => {
	const [[a, b, c], [d, e, f], [g, h, i]] = M
	const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g
	const det = a * A + b * B + c * C
	return [
		[A / det, (c * h - b * i) / det, (b * f - c * e) / det],
		[B / det, (a * i - c * g) / det, (c * d - a * f) / det],
		[C / det, (b * g - a * h) / det, (a * e - b * d) / det]
	]
}

// ACESlib.Utilities_Color: RGBtoXYZ(primaries) — normalized primary matrix
const npm = ({ r, g, b, w }) => {
	const col = ([x, y]) => [x / y, 1, (1 - x - y) / y]
	const P = [col(r), col(g), col(b)], W = col(w)
	const Pt = [[P[0][0], P[1][0], P[2][0]], [P[0][1], P[1][1], P[2][1]], [P[0][2], P[1][2], P[2][2]]]
	const S = mul3(inv(Pt), W)
	return Pt.map(row => row.map((v, j) => v * S[j]))
}

// ACESlib.Utilities_Color: calculate_cat_matrix — von Kries in the given cone space
const cat = (srcW, desW, cone) => {
	const white = ([x, y]) => [x / y, 1, (1 - x - y) / y]
	const s = mul3(cone, white(srcW)), d = mul3(cone, white(desW))
	const D = [[d[0] / s[0], 0, 0], [0, d[1] / s[1], 0], [0, 0, d[2] / s[2]]]
	return matmul(inv(cone), matmul(D, cone))
}

// ACESlib.Utilities_Color: calculate_rgb_to_rgb_matrix(src, dest, coneRespMat)
const rgb2rgb = (src, dest, cone) => matmul(inv(npm(dest)), matmul(cat(src.w, dest.w, cone), npm(src)))

// cone response matrices (standard column-vector orientation; the CTL stores transposes)
const CAT02 = [[0.7328, 0.4296, -0.1624], [-0.7036, 1.6975, 0.0061], [0.0030, 0.0136, 0.9834]]
const BRADFORD = [[0.8951, 0.2664, -0.1614], [-0.7502, 1.7135, 0.0367], [0.0389, -0.0685, 1.0296]]

// chromaticities (ACESlib.Utilities_Color)
const AP0 = { r: [0.7347, 0.2653], g: [0, 1], b: [0.0001, -0.077], w: [0.32168, 0.33767] }
const AWG3 = { r: [0.684, 0.313], g: [0.221, 0.848], b: [0.0861, -0.102], w: [0.3127, 0.329] }
const CGAMUT = { r: [0.74, 0.27], g: [0.17, 1.14], b: [0.08, -0.1], w: [0.3127, 0.329] }
const VGAMUT = { r: [0.73, 0.28], g: [0.165, 0.84], b: [0.1, -0.03], w: [0.3127, 0.329] }
const RWG = { r: [0.780308, 0.304253], g: [0.121595, 1.493994], b: [0.095612, -0.084589], w: [0.3127, 0.329] }
const SGAMUT3 = { r: [0.73, 0.28], g: [0.14, 0.855], b: [0.1, -0.05], w: [0.3127, 0.329] }
const SGAMUT3CINE = { r: [0.766, 0.275], g: [0.225, 0.8], b: [0.089, -0.087], w: [0.3127, 0.329] }
// Sony prints only the Venice matrices (IDT.Sony.Venice_*.ctl); these primaries, at D65, are
// colour-science 0.4.7's derivation from them (PRIMARIES_VENICE_S_GAMUT3{,_CINE})
const VENICE_SGAMUT3 = { r: [0.740464264304292, 0.279364374750660], g: [0.089241145423286, 0.893809528608105], b: [0.110488236673827, -0.052579333080476], w: [0.3127, 0.329] }
const VENICE_SGAMUT3CINE = { r: [0.775901871567345, 0.274502392854799], g: [0.188682902773355, 0.828684937020288], b: [0.101337382499301, -0.089187517306263], w: [0.3127, 0.329] }

// --- official decode curves, verbatim ------------------------------------------

// ACEScsc.Academy.SLog3_SGamut3(Cine)_to_ACES.ctl
const slog3ToLin = (v) => v >= 171.2102946929 / 1023
	? Math.pow(10, (v * 1023 - 420) / 261.5) * (0.18 + 0.01) - 0.01
	: (v * 1023 - 95) * 0.01125 / (171.2102946929 - 95)

// ACEScsc.Academy.LogC_EI800_AWG_to_ACES.ctl
const logcToLin = (v) => {
	const out = (v - 0.3855369987) / 0.2471896383
	let ns = (out - -1.3885369913) / 3.9086503371
	if (ns > 1 / 9) ns = Math.pow(10, out)
	ns = (ns - 0.052272275) * 0.005
	return ns * (0.18 * (800 / 400) / 0.01)
}

// ACEScsc.Academy.CLog2_CGamut_to_ACES.ctl. The Academy CSC is IRE-referred;
// Canon's own convention (the Canon Log v1.2 paper, Canon's vendor IDTs,
// colour-science's default out_reflection) is scene reflectance = IRE-linear
// × 0.9, which is what color-space implements — bridge with that documented
// factor so the comparison isolates curve + matrix + adaptation.
const clog2ToLin = (v) => 0.9 * (v < 0.092864125
	? -(Math.pow(10, (0.092864125 - v) / 0.24136077) - 1) / 87.099375
	: (Math.pow(10, (v - 0.092864125) / 0.24136077) - 1) / 87.099375)

// ACEScsc.Academy.CLog3_CGamut_to_ACES.ctl (same reflection bridge as CLog2)
const clog3ToLin = (v) => 0.9 * (v < 0.097465473
	? -(Math.pow(10, (0.12783901 - v) / 0.36726845) - 1) / 14.98325
	: v <= 0.15277891
		? (v - 0.12512219) / 1.9754798
		: (Math.pow(10, (v - 0.12240537) / 0.36726845) - 1) / 14.98325)

// ACEScsc.Academy.VLog_VGamut_to_ACES.ctl
const vlogToLin = (v) => v < 0.181
	? (v - 0.125) / 5.6
	: Math.pow(10, (v - 0.598206) / 0.241514) - 0.00873

// ACEScsc.Academy.Log3G10_RWG_to_ACES.ctl
const log3g10ToLin = (v) => (v < 0 ? v / 15.1927 : (Math.pow(10, v / 0.224282) - 1) / 155.975327) - 0.01

// Sony-typed numeric matrices (IDT.Sony.SLog3_SGamut3{,Cine}.ctl, column-vector form)
const SONY_SGAMUT3_MAT = [
	[0.7529825954, 0.1433702162, 0.1036471884],
	[0.0217076974, 1.0153188355, -0.0370265329],
	[-0.0094160528, 0.0033704179, 1.0060456349]
]
const SONY_SGAMUT3CINE_MAT = [
	[0.6387886672, 0.2723514337, 0.0888598991],
	[-0.0039159060, 1.0880732309, -0.0841573249],
	[-0.0299072021, -0.0264325799, 1.0563397820]
]
// IDT.Sony.Venice_SLog3_SGamut3{,Cine}.ctl ("VENICE S-Gamut3(.Cine) to AP0 matrix coeffs"), column-vector form
const SONY_VENICE_SGAMUT3_MAT = [
	[0.7933297411, 0.0890786256, 0.1175916333],
	[0.0155810585, 1.0327123069, -0.0482933654],
	[-0.0188647478, 0.0127694121, 1.0060953358]
]
const SONY_VENICE_SGAMUT3CINE_MAT = [
	[0.6742570921, 0.2205717359, 0.1051711720],
	[-0.0093136061, 1.1059588614, -0.0966452553],
	[-0.0382090673, -0.0179383766, 1.0561474439]
]

// --- the pairs ------------------------------------------------------------------

const PAIRS = [
	{ id: 'slog3', ctl: 'ACEScsc.Academy.SLog3_SGamut3_to_ACES', decode: slog3ToLin, M: rgb2rgb(SGAMUT3, AP0, CAT02), tol: 5e-3 },
	{ id: 'sgamut3cine', ctl: 'ACEScsc.Academy.SLog3_SGamut3Cine_to_ACES', decode: slog3ToLin, M: rgb2rgb(SGAMUT3CINE, AP0, CAT02), tol: 5e-3 },
	{ id: 'sgamut3-venice', ctl: 'IDT.Sony.Venice_SLog3_SGamut3', decode: slog3ToLin, M: SONY_VENICE_SGAMUT3_MAT, tol: 5e-3 },
	{ id: 'sgamut3cine-venice', ctl: 'IDT.Sony.Venice_SLog3_SGamut3Cine', decode: slog3ToLin, M: SONY_VENICE_SGAMUT3CINE_MAT, tol: 5e-3 },
	{ id: 'logc3', ctl: 'ACEScsc.Academy.LogC_EI800_AWG_to_ACES', decode: logcToLin, M: rgb2rgb(AWG3, AP0, CAT02), tol: 5e-3 },
	{ id: 'clog2', ctl: 'ACEScsc.Academy.CLog2_CGamut_to_ACES', decode: clog2ToLin, M: rgb2rgb(CGAMUT, AP0, CAT02), tol: 5e-3 },
	{ id: 'clog3', ctl: 'ACEScsc.Academy.CLog3_CGamut_to_ACES', decode: clog3ToLin, M: rgb2rgb(CGAMUT, AP0, CAT02), tol: 5e-3 },
	{ id: 'vlog', ctl: 'ACEScsc.Academy.VLog_VGamut_to_ACES', decode: vlogToLin, M: rgb2rgb(VGAMUT, AP0, BRADFORD), tol: 1e-9 },
	{ id: 'log3g10', ctl: 'ACEScsc.Academy.Log3G10_RWG_to_ACES', decode: log3g10ToLin, M: rgb2rgb(RWG, AP0, BRADFORD), tol: 1e-9 }
]
// camera gamut each pair's recipe adapts from (for the CAT-swap check below)
const GAMUT = { slog3: SGAMUT3, sgamut3cine: SGAMUT3CINE, 'sgamut3-venice': VENICE_SGAMUT3, 'sgamut3cine-venice': VENICE_SGAMUT3CINE, logc3: AWG3, clog2: CGAMUT, clog3: CGAMUT }

// 5³ grid of encoded triplets
const STEPS = [0.1, 0.3, 0.5, 0.7, 0.9]
const grid = []
for (const r of STEPS) for (const g of STEPS) for (const b of STEPS) grid.push([r, g, b])

// max channel error relative to the point's largest official component (floored
// at 0.18 mid grey): adaptation residual scales with the point's vector
// magnitude, so per-channel ratios would misread cross-channel bleed next to a
// dominant channel as large error
const relErr = (got, ref) => {
	const scale = Math.max(0.18, ...ref.map(Math.abs))
	return Math.max(...got.map((v, i) => Math.abs(v - ref[i]))) / scale
}

test('official ACES vendor transforms — camera log → ACES2065-1', () => {
	for (const { id, ctl, decode, M, tol } of PAIRS) {
		let max = 0
		for (const enc of grid) {
			const official = mul3(M, enc.map(decode))
			const got = space[id]['aces2065-1'](...enc)
			max = Math.max(max, relErr(got, official))
		}
		ok(max < tol, `${id} vs ${ctl}: max rel err ${max.toExponential(2)} < ${tol.toExponential(0)}`)
	}
})

test('CAT02 pairs: the residual is the adaptation alone', () => {
	// same CTL recipe with its CAT02 cone matrix swapped for Bradford: what remains is
	// the vendor curve constants (LogC3 6- vs 10-decimal, 7.1e-6 measured)
	for (const { id, ctl, decode } of PAIRS.filter(p => p.id in GAMUT)) {
		const M = rgb2rgb(GAMUT[id], AP0, BRADFORD)
		let max = 0
		for (const enc of grid) max = Math.max(max, relErr(space[id]['aces2065-1'](...enc), mul3(M, enc.map(decode))))
		ok(max < 1e-5, `${id} vs ${ctl} with Bradford: max rel err ${max.toExponential(2)} < 1e-5`)
	}
})

test('Sony-typed IDT matrices match the CSC recipe', () => {
	// the Academy recipe (primaries + CAT02) must reproduce Sony's own typed digits
	const recipe3 = rgb2rgb(SGAMUT3, AP0, CAT02), recipeC = rgb2rgb(SGAMUT3CINE, AP0, CAT02)
	const maxDiff = (A, B) => Math.max(...A.flat().map((v, i) => Math.abs(v - B.flat()[i])))
	ok(maxDiff(recipe3, SONY_SGAMUT3_MAT) < 1e-7, `S-Gamut3 recipe vs Sony digits: ${maxDiff(recipe3, SONY_SGAMUT3_MAT).toExponential(2)}`)
	ok(maxDiff(recipeC, SONY_SGAMUT3CINE_MAT) < 1e-7, `S-Gamut3.Cine recipe vs Sony digits: ${maxDiff(recipeC, SONY_SGAMUT3CINE_MAT).toExponential(2)}`)
	// Venice: no printed primaries; the derived ones must rebuild Sony's digits by the same recipe
	const recipeV3 = rgb2rgb(VENICE_SGAMUT3, AP0, CAT02), recipeVC = rgb2rgb(VENICE_SGAMUT3CINE, AP0, CAT02)
	ok(maxDiff(recipeV3, SONY_VENICE_SGAMUT3_MAT) < 1e-9, `Venice S-Gamut3 recipe vs Sony digits: ${maxDiff(recipeV3, SONY_VENICE_SGAMUT3_MAT).toExponential(2)}`)
	ok(maxDiff(recipeVC, SONY_VENICE_SGAMUT3CINE_MAT) < 1e-9, `Venice S-Gamut3.Cine recipe vs Sony digits: ${maxDiff(recipeVC, SONY_VENICE_SGAMUT3CINE_MAT).toExponential(2)}`)
})

// --- ADX: ACEScsc.Academy.ADX10/ADX16_to_ACES.ctl, verbatim ---------------------------
// Row-vector matrices as printed (mult_f3_f33(v, M) = v·M); interpolate1D as the CTL Manual
// defines it: linear between knots, held at the end values outside them.
const CDD_TO_CID = [[0.75573, 0.05901, 0.16134], [0.22197, 0.96928, 0.07406], [0.02230, -0.02829, 0.76460]]
const EXP_TO_ACES = [[0.72286, 0.11923, 0.01427], [0.12630, 0.76418, 0.08213], [0.15084, 0.11659, 0.90359]]
const LUT_1D = [[-0.190000000000000, -6.000000000000000], [0.010000000000000, -2.721718645000000],
	[0.028000000000000, -2.521718645000000], [0.054000000000000, -2.321718645000000], [0.095000000000000, -2.121718645000000],
	[0.145000000000000, -1.921718645000000], [0.220000000000000, -1.721718645000000], [0.300000000000000, -1.521718645000000],
	[0.400000000000000, -1.321718645000000], [0.500000000000000, -1.121718645000000], [0.600000000000000, -0.926545676714876]]
const REF_PT = (7120.0 - 1520.0) / 8000.0 * (100.0 / 55.0) - Math.log10(0.18)
const mult_f3_f33 = (v, M) => [0, 1, 2].map((j) => v[0] * M[0][j] + v[1] * M[1][j] + v[2] * M[2][j])
const interpolate1D = (t, p) => {
	const n = t.length - 1
	if (p < t[0][0]) return t[0][1]
	if (p >= t[n][0]) return t[n][1]
	const i = t.findIndex((e, k) => e[0] <= p && p < t[k + 1][0])
	const s = (p - t[i][0]) / (t[i + 1][0] - t[i][0])
	return t[i][1] * (1 - s) + t[i + 1][1] * s
}
const cid = (scale, black, per) => (code) => mult_f3_f33(code.map((v) => (v * scale - black) / per), CDD_TO_CID)
const adxToAces = (toCid) => (code) => mult_f3_f33(toCid(code)
	.map((c) => c <= 0.6 ? interpolate1D(LUT_1D, c) : (100.0 / 55.0) * c - REF_PT).map((l) => Math.pow(10, l)), EXP_TO_ACES)
const ADX = [
	{ id: 'adx10', ctl: 'ACEScsc.Academy.ADX10_to_ACES', cid: cid(1023.0, 95.0, 500.0) },
	{ id: 'adx16', ctl: 'ACEScsc.Academy.ADX16_to_ACES', cid: cid(65535.0, 1520.0, 8000.0) },
].map((a) => ({ ...a, toAces: adxToAces(a.cid) }))
// codes 0..1 in tenths (11³): every table segment, the line above density 0.6, and the cube's
// corners where CDD_TO_CID's negative term takes a density below the table's −0.19 (the hold)
const CODES = []
for (let r = 0; r <= 10; r++) for (let g = 0; g <= 10; g++) for (let b = 0; b <= 10; b++) CODES.push([r / 10, g / 10, b / 10])

test('official ACES transforms – ADX10 / ADX16 → ACES2065-1', () => {
	for (const { id, ctl, toAces } of ADX) {
		let max = 0
		for (const c of CODES) max = Math.max(max, relErr(space[id]['aces2065-1'](...c), toAces(c)))
		ok(max < 1e-12, `${id} vs ${ctl}: max rel err ${max.toExponential(2)} < 1e-12`)
	}
})

// The inverse is a right inverse everywhere: what it returns decodes to the color it was given.
// It gives the code itself back wherever the CTL is one to one, over the densities ADX10 holds
// (ADX16 = 16·ADX10, ST 2065-3 Eq. 3); past them float64 runs out where one channel sits at the
// table's foot under another 16 decades brighter (ADX16 [0.5, 0, 1]: 6.8e-4 of the code span).
const TO16 = 16 * 1023 / 65535
test('ADX inverse: decodes back to the same color; the code itself wherever the CTL is one to one', () => {
	for (const { id, ctl, cid, toAces } of ADX) {
		let same = 0, exact = 0, n = 0
		for (const c of CODES) {
			const aces = toAces(c)
			same = Math.max(same, relErr(toAces(space['aces2065-1'][id](...aces)), aces))
			const d = id === 'adx16' ? c.map((v) => v * TO16) : c
			if (!cid(d).every((x) => x >= -0.19)) { n++; continue }
			exact = Math.max(exact, ...space['aces2065-1'][id](...toAces(d)).map((v, k) => Math.abs(v - d[k])))
		}
		ok(same < 1e-12, `${id}: ${ctl} decodes the inverse's code to the same color, ${same.toExponential(2)}`)
		ok(n > 0 && exact < 1e-10, `${id}: the code itself back, ${exact.toExponential(2)} < 1e-10 (${n} codes in the hold, where no inverse can)`)
	}
})
