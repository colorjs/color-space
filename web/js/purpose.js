// The purpose facet — what each space is FOR, as a task vocabulary (the catalog
// families say what a space IS; this says what you reach for it to do). Curated
// from meta.use, one or two tags per space; the vocabulary stays small enough to
// read as chips. ORDER is the display order: maker tasks first, science last.
export const ORDER = ['picking', 'palettes', 'editing', 'compositing', 'grading', 'delivery', 'print', 'difference', 'measurement', 'research']

// one line per tag — the filter chips' tooltips AND the purpose-grouped shelf tooltips
export const TIPS = {
	picking: 'color pickers and UI controls – hue-led handles humans can steer',
	palettes: 'design palettes, ramps and gradients – spaces where equal steps look equal',
	editing: 'wide working spaces – headroom for image adjustments before output',
	compositing: 'linear-light math – blending, CG rendering and resampling done physically right',
	grading: 'camera capture and color grading – log curves and scene-referred working spaces',
	delivery: 'publishing to screens, files and streams – the encodings content ships in',
	print: 'inks, paints and surface-color specification – subtractive and atlas systems',
	difference: 'quantifying how far apart two colors look – ΔE metrics and their spaces',
	measurement: 'colorimetry – specifying and measuring color itself, the reference layer',
	research: 'vision science and imaging research – physiological and experimental coordinates',
}

// the 3–4 word answer to "used for?" — the catalog card tip's second breath
export const USE = {
	picking: 'color picker controls', palettes: 'palettes and gradients', editing: 'image-editing headroom',
	compositing: 'linear-light compositing', grading: 'capture and grading', delivery: 'screen and stream delivery',
	print: 'print and surface color', difference: 'color-difference metrics', measurement: 'colorimetric reference',
	research: 'vision research',
}

export default {
	// ── display & web ──
	rgb: ['delivery'], p3: ['delivery'], rec2020: ['delivery'], rec709: ['delivery'],
	'dci-p3': ['delivery'], ntsc: ['delivery'], pal: ['delivery'], 'smpte-240m': ['delivery'],
	lrgb: ['compositing'], 'p3-linear': ['compositing'], 'a98rgb-linear': ['compositing'],
	'prophoto-linear': ['compositing'], 'rec2020-linear': ['compositing', 'grading'], scrgb: ['compositing'],
	prophoto: ['editing'], a98rgb: ['editing', 'print'], 'apple-rgb': ['editing'], rimm: ['editing'],
	'cie-rgb': ['measurement'],
	// ── cylindrical ──
	hsl: ['picking'], hsv: ['picking'], hwb: ['picking'], hcg: ['picking'], hcl: ['picking'],
	hsp: ['picking'], hcy: ['picking'], hsi: ['research'], hsm: ['research'],
	// ── perceptual — modern ──
	oklch: ['palettes'], oklab: ['palettes'], hct: ['palettes'], oklrab: ['palettes'], oklrch: ['palettes'],
	okhsl: ['picking'], okhsv: ['picking'], okhwb: ['picking'],
	srlab2: ['difference'], sucs: ['difference'], igpgtg: ['difference'], prolab: ['research'],
	// ── perceptual — CIE classic ──
	lab: ['measurement', 'difference'], luv: ['measurement', 'difference'],
	lchab: ['palettes'], lchuv: ['palettes'], 'lab-d65': ['difference'], 'lch-d65': ['palettes'],
	hsluv: ['picking', 'palettes'], hpluv: ['picking', 'palettes'],
	'din99o-lab': ['difference'], 'din99o-lch': ['difference'], din99d: ['difference'],
	labh: ['difference'], anlab: ['difference'], ucs: ['measurement'], uvw: ['measurement'],
	// ── HDR & wide gamut ──
	ictcp: ['grading', 'difference'], jzazbz: ['difference'], jzczhz: ['palettes'],
	'rec2100-pq': ['delivery'], 'rec2100-hlg': ['delivery'], 'rec2100-linear': ['compositing', 'grading'],
	ipt: ['research'], izazbz: ['research'], 'hdr-ipt': ['research'], 'hdr-cie-lab': ['research'], icacb: ['research'],
	// ── colorimetry & vision ──
	xyz: ['measurement'], xyy: ['measurement'], 'xyz-d50': ['measurement', 'print'], 'xyz-abs-d65': ['measurement'],
	uv: ['measurement'], 'cct-duv': ['measurement'], kelvin: ['measurement'], wavelength: ['measurement'],
	dsh: ['measurement'], gray: ['measurement'],
	lms: ['research', 'measurement'], maxwell: ['research'], macboyn: ['research'], dkl: ['research'],
	rg: ['research'], yrg: ['grading'],
	// ── video & broadcast ──
	'ycbcr-bt709': ['delivery'], 'ycbcr-bt2020': ['delivery'], 'ycbcr-bt601-525': ['delivery'],
	'ycbcr-bt601-625': ['delivery'], ycbcr: ['delivery'], yuv: ['delivery'], yiq: ['delivery'],
	ypbpr: ['delivery'], ycgco: ['delivery'], jpeg: ['delivery'], ydbdr: ['delivery'],
	yccbccrc: ['delivery'], xvycc: ['delivery'], 'smpte-c': ['delivery'], photoycc: ['delivery'],
	// ── film & camera ──
	acescg: ['compositing', 'grading'], 'aces2065-1': ['grading'], acescc: ['grading'], acescct: ['grading'],
	acesproxy: ['grading'], logc3: ['grading'], logc4: ['grading'], slog: ['grading'], slog2: ['grading'],
	slog3: ['grading'], sgamut3cine: ['grading'], vlog: ['grading'], log3g10: ['grading'], log3g12: ['grading'],
	clog: ['grading'], clog2: ['grading'], clog3: ['grading'], flog: ['grading'], flog2: ['grading'],
	nlog: ['grading'], applelog: ['grading'], bmdfilm: ['grading'], dlog: ['grading'], tlog: ['grading'],
	davinci: ['grading'], cineon: ['grading'], llog: ['grading'], protune: ['grading'], milog: ['grading'],
	olog: ['grading'], redlog: ['grading'], redlogfilm: ['grading'], panalog: ['grading'], viperlog: ['grading'],
	filmicpro: ['grading'], dcdm: ['delivery'], erimm: ['editing'],
	// ── appearance models ──
	cam16: ['research'], ciecam02: ['research'], zcam: ['research'], hellwig2022: ['research'],
	rlab: ['research'], llab: ['research'], nayatani95: ['research'], hunt: ['research'], atd95: ['research'],
	'cam16-ucs': ['difference'], 'cam02-ucs': ['difference'], 'cam16-lcd': ['difference'],
	'cam16-scd': ['difference'], 'cam02-lcd': ['difference'], 'cam02-scd': ['difference'],
	// ── print & physical ──
	cmyk: ['print'], cmy: ['print'], munsell: ['print', 'measurement'], ryb: ['print'],
	'ral-design': ['print'], coloroid: ['print'], ostwald: ['print'],
	// ── specialty & research ──
	xyb: ['delivery'], osaucs: ['difference'], tsl: ['research'], yes: ['research'],
	ohta: ['research'], lalphabeta: ['research'],
}
