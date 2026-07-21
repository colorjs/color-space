// Differential check of camera-log → ACES2065-1 composites against the Academy's
// official vendor transforms (ampas/aces-dev v1.3), transcribed verbatim:
// decode curves and matrix recipes from ACEScsc.Academy.*_to_ACES.ctl, plus the
// Sony-typed numeric matrices from IDT.Sony.SLog3_SGamut3(.Cine).ctl.
//
// The official transforms adapt the vendor's D65 white to the ACES white with the
// cone matrix each CTL names (CAT02 for ARRI/Canon/Sony, Bradford default for
// Panasonic/RED). color-space routes through its XYZ D65 hub and adapts with the
// colorjs-matched Bradford ACES matrices, so two known conventions bound the
// agreement: CAT02-vs-Bradford adaptation (≤ ~4e-3 of the point's magnitude at
// gamut extremes — swapping Bradford into the official recipe collapses it) and
// the CSS-convention D65 white digits (~3e-4). Tolerances sit just above the
// measured maxima of those conventions; anything larger would flag a real
// formula defect.
//
// Sources (ampas/aces-dev @ v1.3):
//   transforms/ctl/csc/<vendor>/ACEScsc.Academy.<pair>_to_ACES.ctl
//   transforms/ctl/idt/vendorSupplied/sony/IDT.Sony.SLog3_SGamut3{,Cine}.ctl
//   transforms/ctl/lib/ACESlib.Utilities_Color.ctl (primaries, cone matrices)
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

// --- the pairs ------------------------------------------------------------------

const PAIRS = [
	{ id: 'slog3', ctl: 'ACEScsc.Academy.SLog3_SGamut3_to_ACES', decode: slog3ToLin, M: rgb2rgb(SGAMUT3, AP0, CAT02), tol: 5e-3 },
	{ id: 'sgamut3cine', ctl: 'ACEScsc.Academy.SLog3_SGamut3Cine_to_ACES', decode: slog3ToLin, M: rgb2rgb(SGAMUT3CINE, AP0, CAT02), tol: 5e-3 },
	{ id: 'logc3', ctl: 'ACEScsc.Academy.LogC_EI800_AWG_to_ACES', decode: logcToLin, M: rgb2rgb(AWG3, AP0, CAT02), tol: 5e-3 },
	{ id: 'clog2', ctl: 'ACEScsc.Academy.CLog2_CGamut_to_ACES', decode: clog2ToLin, M: rgb2rgb(CGAMUT, AP0, CAT02), tol: 5e-3 },
	{ id: 'clog3', ctl: 'ACEScsc.Academy.CLog3_CGamut_to_ACES', decode: clog3ToLin, M: rgb2rgb(CGAMUT, AP0, CAT02), tol: 5e-3 },
	{ id: 'vlog', ctl: 'ACEScsc.Academy.VLog_VGamut_to_ACES', decode: vlogToLin, M: rgb2rgb(VGAMUT, AP0, BRADFORD), tol: 5e-4 },
	{ id: 'log3g10', ctl: 'ACEScsc.Academy.Log3G10_RWG_to_ACES', decode: log3g10ToLin, M: rgb2rgb(RWG, AP0, BRADFORD), tol: 5e-4 }
]

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

test('Sony-typed IDT matrices match the CSC recipe', () => {
	// the Academy recipe (primaries + CAT02) must reproduce Sony's own typed digits
	const recipe3 = rgb2rgb(SGAMUT3, AP0, CAT02), recipeC = rgb2rgb(SGAMUT3CINE, AP0, CAT02)
	const maxDiff = (A, B) => Math.max(...A.flat().map((v, i) => Math.abs(v - B.flat()[i])))
	ok(maxDiff(recipe3, SONY_SGAMUT3_MAT) < 1e-7, `S-Gamut3 recipe vs Sony digits: ${maxDiff(recipe3, SONY_SGAMUT3_MAT).toExponential(2)}`)
	ok(maxDiff(recipeC, SONY_SGAMUT3CINE_MAT) < 1e-7, `S-Gamut3.Cine recipe vs Sony digits: ${maxDiff(recipeC, SONY_SGAMUT3CINE_MAT).toExponential(2)}`)
})
