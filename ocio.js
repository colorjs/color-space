/**
 * color-space/ocio – a space as an OpenColorIO colorspace.
 *
 * One `!<ColorSpace>` entry for the `colorspaces:` list of any OpenColorIO 2.x config
 * (Blender, Nuke, Resolve, Houdini, Maya, Unreal), its to_scene_reference built from OCIO's
 * native transforms alone: no LUT file, no BuiltinTransform name, nothing newer than OCIO 2.0.
 *
 *     import space from 'color-space'
 *     import { colorspace } from 'color-space/ocio'
 *
 *     colorspace(space.sgamut3cine)                       // S-Log3 S-Gamut3.Cine to ACES2065-1
 *     colorspace(space.logc4, { reference: 'xyz-d65' })   // to linear CIE XYZ, D65
 *     colorspace(space.applelog)                          // null: a quadratic toe has no native transform
 *
 * Exact or nothing. A space gets a snippet only where OCIO's own formulas reproduce the
 * library's conversion to 1e-6 of the value (floored at 0.18, mid grey), code to reference
 * and back; test/ocio.js measures every one. Otherwise null, never a fit or a LUT. The
 * transforms, each in the direction code to linear:
 *   MatrixTransform               primaries (SMPTE RP 177 from gamuts.js) and white adaptation
 *   ExponentTransform             pure gamma, mirrored below 0 as the library's curves are
 *   ExponentWithLinearTransform   power with a tangent linear toe; OCIO derives break and slope
 *                                 from gamma and offset, so it fits BT.2020 and CIE L* (whose
 *                                 constants are that tangent) but not sRGB or BT.709, whose
 *                                 rounded constants miss it by 2.5e-4 and 3e-3 in toe slope
 *   LogAffineTransform            a pure log
 *   LogCameraTransform            a log with a linear toe; OCIO sets the toe's offset so it meets
 *                                 the log at the break, so a vendor toe that misses its log past
 *                                 that bar (F-Log, L-Log, D-Log) has no snippet
 * The matrix is the normalized primary matrix of the catalogued primaries (gamuts.js), so a
 * space whose library matrix sits off them has none either: D-Gamut by 1.8e-4 (DJI's printed
 * 4-decimal matrix), CIE RGB by 7e-5 (built from 5-decimal primaries, gamuts.js has 4), NTSC
 * RGB by 3e-5.
 *
 * Scene reference: ACES2065-1 by default, the reference of the Academy's OCIO configs and
 * of OCIO's camera builtins. Whites adapt to the ACES white by CAT02, the Academy's IDT
 * convention, except V-Gamut and REDWideGamutRGB: the Academy's own CSCs for V-Log and
 * Log3G10, and OCIO's builtins, adapt those by Bradford, and so do these snippets.
 * 'xyz-d65' is linear CIE XYZ, D65, Y = 1: the library's hub, with its Bradford adaptation.
 * Each description names its adaptation.
 *
 * @see {@link https://opencolorio.readthedocs.io/en/latest/guides/authoring/authoring.html} OCIO config authoring
 * @see {@link https://github.com/AcademySoftwareFoundation/OpenColorIO/blob/main/src/OpenColorIO/ops/log/LogOpCPU.cpp} LogCamera / LogAffine math
 * @see {@link https://github.com/AcademySoftwareFoundation/OpenColorIO/blob/main/src/OpenColorIO/ops/gamma/GammaOpUtils.cpp} ExponentWithLinear (moncurve) math
 */
import { gamut as G, whites, matrix } from './gamuts.js'
import { mat3, mul3, inv3 } from './math.js'
import { M_BRADFORD } from './spaces/xyz.js'

// CAT02 cone response (CIE 159:2004; ACESlib.Utilities_Color CONE_RESP_MAT_CAT02)
const M_CAT02 = [
	0.7328, 0.4296, -0.1624,
	-0.7036, 1.6975, 0.0061,
	0.0030, 0.0136, 0.9834
]
const I = [1, 0, 0, 0, 1, 0, 0, 0, 1]

// von Kries in a cone space, white w1 to white w2 (ACESlib calculate_cat_matrix)
const XYZ = (w) => { const [x, y] = whites[w]; return [x / y, 1, (1 - x - y) / y] }
const adapt = (cone, w1, w2) => {
	if (w1 === w2) return I
	const s = mat3(cone, ...XYZ(w1)), d = mat3(cone, ...XYZ(w2))
	return mul3(inv3(cone), mul3([d[0] / s[0], 0, 0, 0, d[1] / s[1], 0, 0, 0, d[2] / s[2]], cone))
}

// decode curves, as OCIO parameters; the logs run lin→log forward, so code→linear is inverse
const gamma = (value) => ({ type: 'ExponentTransform', value, style: 'mirror' })
const moncurve = (p) => ({ type: 'ExponentWithLinearTransform', ...p })
const logaffine = (p) => ({ type: 'LogAffineTransform', ...p, direction: 'inverse' })
// y = log_side_slope*log_base(lin_side_slope*x + lin_side_offset) + log_side_offset above
// lin_side_break, a line of linear_slope below that OCIO joins to the log at the break
const logcamera = (p) => ({ type: 'LogCameraTransform', ...p, direction: 'inverse' })

// Sony, Technical Summary for S-Gamut3.Cine/S-Log3 and S-Gamut3/S-Log3:
// y = (420 + 261.5*log10((x + 0.01)/0.19))/1023 from x = 0.01125, (95 + x*(171.2102946929 − 95)/0.01125)/1023 below
const SLOG3 = logcamera({ base: 10, log_side_slope: 261.5 / 1023, log_side_offset: 420 / 1023, lin_side_slope: 1 / 0.19, lin_side_offset: 0.01 / 0.19, lin_side_break: 0.01125, linear_slope: (171.2102946929 - 95) / 0.01125 / 1023 })

// Sony S-Log / S-Log2 (spaces/slog.js, slog2.js; colour-science log_encoding_SLog, _SLog2):
// y = (876*t' + 64)/1023, t' = 0.432699*log10(t + 0.037584) + 0.646596 from t = 0, 5t + 0.0300012… below;
// t = x/0.9 (in-reflection), times 155/219 for S-Log2
const slog = (k) => logcamera({ base: 10, log_side_slope: 0.432699 * 876 / 1023, log_side_offset: (0.646596 * 876 + 64) / 1023, lin_side_slope: k / 0.9, lin_side_offset: 0.037584, lin_side_break: 0, linear_slope: 5 * 876 / 1023 * k / 0.9 })

// ARRI LogC4 Specification (2025-01-23), Eq 2: y = (log2(a*x + 64) − 6)/14*b + c from x = t, (x − t)/s below
const C4 = (() => {
	const a = (2 ** 18 - 16) / 117.45, b = (1023 - 95) / 1023, c = 95 / 1023
	const s = (7 * Math.LN2 * 2 ** (7 - 14 * c / b)) / (a * b), t = (2 ** (14 * (-c / b) + 6) - 64) / a
	return logcamera({ base: 2, log_side_slope: b / 14, log_side_offset: c - 6 * b / 14, lin_side_slope: a, lin_side_offset: 64, lin_side_break: t, linear_slope: 1 / s })
})()

// Fujifilm F-Log2 Data Sheet Ver.1.0 (the F-Log2 C Data Sheet keeps the curve):
// y = 0.245281*log10(5.555556x + 0.064829) + 0.384316 from x = 0.000889, 8.799461x + 0.092864 below
const FLOG2 = logcamera({ base: 10, log_side_slope: 0.245281, log_side_offset: 0.384316, lin_side_slope: 5.555556, lin_side_offset: 0.064829, lin_side_break: 0.000889, linear_slope: 8.799461 })

// FilmLight T-Log (w 128, g 16, o 0.075; spaces/tlog.js, colour-science filmlight_t_log):
// y = B*ln(x + C) + A from x = 0, G*x + o below
const TLOG = (() => {
	const w = 128, g = 16, o = 0.075
	const b = 1 / (0.7107 + 1.2359 * Math.log(w * g)), gs = g / (1 - o), C = b / gs
	const a = 1 - b * Math.log(w + C), y0 = a + b * Math.log(C), s = (1 - o) / (1 - y0)
	return logcamera({ base: Math.E, log_side_slope: b * s, log_side_offset: 1 + (a - 1) * s, lin_side_slope: 1, lin_side_offset: C, lin_side_break: 0, linear_slope: gs * s })
})()

// Kodak ERIMM RGB (ISO 22028-3; Spaulding, Woolfe & Giorgianni 2000):
// y = (ln x − ln 0.001)/(ln 316.2 − ln 0.001) from x = e*0.001, its tangent line through 0 below
const ERIMM = (() => {
	const lmin = Math.log(0.001), span = Math.log(316.2) - lmin, Et = Math.E * 0.001
	return logcamera({ base: Math.E, log_side_slope: 1 / span, log_side_offset: -lmin / span, lin_side_slope: 1, lin_side_offset: 0, lin_side_break: Et, linear_slope: 1 / (span * Et) })
})()

// The spaces: [OCIO name, gamut (gamuts.js key, data.json spaces[id].gamut), decode]
const XYZ65 = { white: 'D65' }, XYZ50 = { white: 'D50' }
const S = {
	// linear: the matrix alone
	xyz: ['CIE-XYZ-D65', XYZ65],
	'xyz-d50': ['CIE-XYZ-D50', XYZ50],
	lrgb: ['Linear Rec.709 (sRGB)', 'srgb'],
	scrgb: ['scRGB', 'srgb'],
	'p3-linear': ['Linear P3-D65', 'display-p3'],
	'rec2020-linear': ['Linear Rec.2020', 'rec2020'],
	'rec2100-linear': ['Linear Rec.2100', 'rec2020'],
	'a98rgb-linear': ['Linear Adobe RGB (1998)', 'adobe-rgb'],
	'prophoto-linear': ['Linear ProPhoto RGB', 'prophoto'],
	acescg: ['ACEScg', 'ap1'],
	'aces2065-1': ['ACES2065-1', 'ap0'],
	awg3: ['Linear ARRI Wide Gamut 3', 'awg3'],
	awg4: ['Linear ARRI Wide Gamut 4', 'awg4'],
	sgamut3: ['Linear S-Gamut3', 'sgamut3'],
	vgamut: ['Linear V-Gamut', 'vgamut'],
	rwg: ['Linear REDWideGamutRGB', 'rwg'],
	bmdwg: ['Linear BMD WideGamut Gen5', 'bmdwg'],
	dwg: ['Linear DaVinci WideGamut', 'dwg'],
	egamut: ['Linear E-Gamut', 'egamut'],

	// pure gamma (the space files' exponents: Adobe RGB (1998) 563/256, SMPTE RP 431-2 2.6, …)
	a98rgb: ['Adobe RGB (1998)', 'adobe-rgb', gamma(563 / 256)],
	widegamut: ['Adobe Wide Gamut RGB', 'widegamut', gamma(563 / 256)],
	'dci-p3': ['DCI-P3', 'dci-p3', gamma(2.6)],
	'dci-p3-plus': ['DCI-P3+', 'dci-p3-plus', gamma(2.6)],
	pal: ['PAL/SECAM RGB', 'pal', gamma(2.8)],
	brucergb: ['Bruce RGB', 'brucergb', gamma(2.2)],
	betargb: ['Beta RGB', 'betargb', gamma(2.2)],
	bestrgb: ['Best RGB', 'bestrgb', gamma(2.2)],
	donrgb4: ['Don RGB 4', 'donrgb4', gamma(2.2)],
	ektaspace: ['Ekta Space PS 5', 'ektaspace', gamma(2.2)],
	russellrgb: ['Russell RGB', 'russellrgb', gamma(2.2)],
	'apple-rgb': ['Apple RGB', 'apple-rgb', gamma(1.8)],
	colormatch: ['ColorMatch RGB', 'colormatch', gamma(1.8)],

	// ITU-R BT.2020 Table 4: α = 1.09929682680944, β = 0.018053968510807, 4.5 below β (the exact tangent)
	rec2020: ['Camera Rec.2020', 'rec2020', moncurve({ gamma: 1 / 0.45, offset: 0.09929682680944, style: 'mirror' })],
	// CIE 1976 L*/100 with ε = 216/24389, κ = 24389/27 (ISO 22028-4): the tangent of ((v + 0.16)/1.16)³
	ecirgb: ['ECI RGB v2', 'ecirgb', moncurve({ gamma: 3, offset: 0.16 })],

	// camera logs
	slog3: ['S-Log3 S-Gamut3', 'sgamut3', SLOG3],
	sgamut3cine: ['S-Log3 S-Gamut3.Cine', 'sgamut3cine', SLOG3],
	'sgamut3-venice': ['S-Log3 Venice S-Gamut3', 'sgamut3-venice', SLOG3],
	'sgamut3cine-venice': ['S-Log3 Venice S-Gamut3.Cine', 'sgamut3cine-venice', SLOG3],
	slog2: ['S-Log2 S-Gamut', 'sgamut3', slog(155 / 219)],
	slog: ['S-Log S-Gamut', 'sgamut3', slog(1)],
	// ARRI, ALEXA LogC Curve – Usage in VFX (2017-03), EI 800:
	// y = 0.247190*log10(5.555556x + 0.052272) + 0.385537 from x = 0.010591, 5.367655x + 0.092809 below
	logc3: ['ARRI LogC3 (EI800)', 'awg3', logcamera({ base: 10, log_side_slope: 0.247190, log_side_offset: 0.385537, lin_side_slope: 5.555556, lin_side_offset: 0.052272, lin_side_break: 0.010591, linear_slope: 5.367655 })],
	logc4: ['ARRI LogC4', 'awg4', C4],
	// Panasonic, V-Log/V-Gamut Reference Manual (2014): y = 0.241514*log10(x + 0.00873) + 0.598206 from x = 0.01, 5.6x + 0.125 below
	vlog: ['V-Log V-Gamut', 'vgamut', logcamera({ base: 10, log_side_slope: 0.241514, log_side_offset: 0.598206, lin_side_slope: 1, lin_side_offset: 0.00873, lin_side_break: 0.01, linear_slope: 5.6 })],
	// RED, White Paper on REDWideGamutRGB and Log3G10 (915-0187 Rev-C):
	// y = 0.224282*log10(155.975327*(x + 0.01) + 1) from x = −0.01, 15.1927*(x + 0.01) below
	log3g10: ['Log3G10 REDWideGamutRGB', 'rwg', logcamera({ base: 10, log_side_slope: 0.224282, log_side_offset: 0, lin_side_slope: 155.975327, lin_side_offset: 0.01 * 155.975327 + 1, lin_side_break: -0.01, linear_slope: 15.1927 })],
	flog2: ['F-Log2 F-Gamut', 'rec2020', FLOG2],
	flog2c: ['F-Log2 C F-Gamut C', 'fgamut-c', FLOG2],
	// Blackmagic Film Gen 5 (BRAW SDK, colour-science blackmagic_design.py): y = A*ln(x + B) + C from x = 0.005, D*x + E below
	bmdfilm: ['BMDFilm WideGamut Gen5', 'bmdwg', logcamera({ base: Math.E, log_side_slope: 0.08692876065491224, log_side_offset: 0.5300133392291939, lin_side_slope: 1, lin_side_offset: 0.005494072432257808, lin_side_break: 0.005, linear_slope: 8.283605932402494 })],
	// Blackmagic, DaVinci Resolve 17 Wide Gamut Intermediate: y = 0.07329248*(log2(x + 0.0075) + 7) from x = 0.00262409, 10.44426855x below
	davinci: ['DaVinci Intermediate WideGamut', 'dwg', logcamera({ base: 2, log_side_slope: 0.07329248, log_side_offset: 0.07329248 * 7, lin_side_slope: 1, lin_side_offset: 0.0075, lin_side_break: 0.00262409, linear_slope: 10.44426855 })],
	// Academy S-2016-001: y = (log2(x) + 9.72)/17.52 from x = 2⁻⁷, 10.5402377416545x + 0.0729055341958355 below
	acescct: ['ACEScct', 'ap1', logcamera({ base: 2, log_side_slope: 1 / 17.52, log_side_offset: 9.72 / 17.52, lin_side_slope: 1, lin_side_offset: 0, lin_side_break: 0.0078125, linear_slope: 10.5402377416545 })],
	tlog: ['T-Log E-Gamut', 'egamut', TLOG],
	// Insta360, I-Log White Paper (2026-05-20 curve): y = 0.280055*log10(x + 0.01) + 0.623992 from x = 0.01104854, 5.77837328x + 0.09055934 below
	ilog: ['I-Log Rec.2020', 'rec2020', logcamera({ base: 10, log_side_slope: 0.280055, log_side_offset: 0.623992, lin_side_slope: 1, lin_side_offset: 0.01, lin_side_break: 0.01104854, linear_slope: 5.77837328 })],
	// Kinefinity, KineLog3 Technical Specifications (2025-09-24): y = 0.296*0.907136*log10(66.64x + 1) + 0.092864
	// from x = −0.008239, (x + 0.008239)/0.017178 below
	kinelog3: ['KineLog3 Kinefinity Wide Gamut', 'kwg', logcamera({ base: 10, log_side_slope: 0.296 * 0.907136, log_side_offset: 0.092864, lin_side_slope: 66.64, lin_side_offset: 1, lin_side_break: -0.008239, linear_slope: 1 / 0.017178 })],
	erimm: ['ERIMM RGB', 'prophoto', ERIMM],
	// OPPO O-Log (colour-science log_encoding_OPPOOLog): y = 0.139*ln(x + 0.019) + 0.614
	olog: ['O-Log Rec.2020', 'rec2020', logaffine({ base: Math.E, log_side_slope: 0.139, log_side_offset: 0.614, lin_side_slope: 1, lin_side_offset: 0.019 })],
	// OPPO, O-Log2 ACES Workflow V2, O-Log2_to_ACES_AP0_V2.ctl: y = 0.0855*log2(x + 0.0096) + 0.693
	olog2: ['O-Log2 Rec.2020', 'rec2020', logaffine({ base: 2, log_side_slope: 0.0855, log_side_offset: 0.693, lin_side_slope: 1, lin_side_offset: 0.0096 })],
}

// the scene references: linear RGB→reference matrix inverse, white, and the cone matrix per source gamut
const REF = {
	'aces2065-1': {
		name: 'ACES2065-1', white: 'ACES', inv: inv3(matrix(G.ap0)),
		// ACEScsc.Academy.VLog_VGamut_to_ACES / Log3G10_RWG_to_ACES (aces-dev 1.3), OCIO PanasonicCameras.cpp, RedCameras.cpp
		cat: (g) => g === 'vgamut' || g === 'rwg' ? ['Bradford', M_BRADFORD] : ['CAT02', M_CAT02],
	},
	'xyz-d65': { name: 'CIE XYZ D65', white: 'D65', inv: I, cat: () => ['Bradford', M_BRADFORD] },
}

const num = (v) => String(Object.is(v, -0) ? 0 : v)
const yaml = ({ type, ...p }) => `!<${type}> {${Object.entries(p).map(([k, v]) =>
	`${k}: ${Array.isArray(v) ? `[${v.map(num).join(', ')}]` : typeof v === 'number' ? num(v) : v}`).join(', ')}}`

/**
 * Render a space as an OpenColorIO 2.x colorspace: one `- !<ColorSpace>` list entry, indented
 * to paste under a config's `colorspaces:` key.
 * @param {object|string} s space object (e.g. `space.slog3`) or its id
 * @param {object} [opts]
 * @param {'aces2065-1'|'xyz-d65'} [opts.reference='aces2065-1'] the config's scene reference
 * @returns {string|null} the YAML entry, or null where OCIO's native transforms can't express the space exactly
 */
export function colorspace(s, { reference = 'aces2065-1' } = {}) {
	const ref = REF[reference]
	if (!ref) throw new Error(`color-space/ocio: reference '${reference}' is not one of ${Object.keys(REF).join(', ')}`)
	const id = typeof s === 'string' ? s : s?.name
	const e = Object.hasOwn(S, id) ? S[id] : null
	if (!e) return null
	const [name, g, curve] = e
	const gm = typeof g === 'string' ? G[g] : g
	const [catName, cone] = ref.cat(g)
	// round-off zeros (a primary's z = 0) written as 0
	const m = mul3(ref.inv, mul3(adapt(cone, gm.white, ref.white), gm.primaries ? matrix(gm) : I)).map((v) => Math.abs(v) < 1e-15 ? 0 : v)
	const ops = [curve, !m.every((v, i) => Math.abs(v - I[i]) < 1e-14) &&
		{ type: 'MatrixTransform', matrix: [m[0], m[1], m[2], 0, m[3], m[4], m[5], 0, m[6], m[7], m[8], 0, 0, 0, 0, 1] }].filter(Boolean)
	const encoding = !curve ? 'scene-linear' : curve.type.startsWith('Log') ? 'log' : 'sdr-video'
	const what = !ops.length ? `${name}, the scene reference`
		: `${name} to ${ref.name}${gm.white === ref.white ? '' : `, ${gm.white} to the ${ref.white} white by ${catName}`}`
	const lines = [
		'  - !<ColorSpace>',
		`    name: ${name}`,
		'    family: color-space',
		'    bitdepth: 32f',
		`    description: ${JSON.stringify(`${what}. From color-space, https://color-space.io/${id}`)}`,
		`    encoding: ${encoding}`,
	]
	if (ops.length === 1) lines.push(`    to_scene_reference: ${yaml(ops[0])}`)
	else if (ops.length) lines.push('    to_scene_reference: !<GroupTransform>', '      children:', ...ops.map((o) => `        - ${yaml(o)}`))
	return lines.join('\n') + '\n'
}
