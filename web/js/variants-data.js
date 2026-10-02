// UI-variants workshop – the vocabulary every variant speaks: our starred spaces, the facets
// with their one-line explainers, the rendering modes and gamut limits, and the icons.
// Values come from the catalog (meta, purpose, lore); the white-point chromaticities are the
// published ones cited beside them.
import { space, meta, classify, LUTOK } from './core.js'
import { SPACES, HISTORICAL } from './render.js'
import PURPOSE, { ORDER, TIPS } from './purpose.js'
import FAMILIES from './study-families.js'
import { spaces as wasmSpaces } from './study-runtime.js'

export { FAMILIES, ORDER, TIPS, PURPOSE }

// our stars: the one to three spaces each family opens with – the ones worth meeting first
export const PICKS = new Set(['rgb', 'p3', 'rec2020', 'hsl', 'hsv', 'oklch', 'lab', 'cam16', 'xyz', 'xyy',
	'ycbcr-bt709', 'ictcp', 'acescg', 'logc3', 'cmyk', 'munsell'])

export const plabel = t => ({ print: 'Print & surface' })[t] || t[0].toUpperCase() + t.slice(1)

// ── where a space runs beyond JS ──
const CSSN = ['rgb', 'lrgb', 'hsl', 'hwb', 'lab', 'lchab', 'oklab', 'oklch', 'p3', 'a98rgb', 'prophoto', 'rec2020', 'xyz', 'xyz-d50']
export const CAP = {
	css: new Set(CSSN), lut: new Set(LUTOK), glsl: new Set(),
	wasm: new Set((wasmSpaces || []).filter(s => SPACES.includes(s))),
}
const geo = s => ({ polar: 'polar', opponent: 'opponent' })[classify(s).archetype] || 'component'
const old = s => HISTORICAL.has(s) || meta[s].year < 1960

// ── facets: key, the plain label, the unset answer, options [value, name, explainer], test ──
export const FACETS = [
	{ k: 'for', label: 'For', q: 'What are you working on?', any: 'any task', icon: 'task',
		opts: ORDER.map(t => [t, plabel(t), TIPS[t]]), test: (s, v) => PURPOSE[s]?.includes(v) },
	{ k: 'runs', label: 'Runs in', q: 'Where must it run?', any: 'anywhere', icon: 'runs',
		opts: [['css', 'CSS', 'native CSS color functions – lab(), oklch(), color(display-p3 …)'],
			['glsl', 'GLSL', 'GPU shader code – planes and bars painted on the graphics card'],
			['wasm', 'WASM', 'compiled WebAssembly converters for bulk pixels'],
			['lut', 'LUT', 'a .cube lookup table for grading and video tools']],   // no ICC option: every space exports a profile, so it would narrow nothing
		test: (s, v) => CAP[v].has(s) },
	{ k: 'light', label: 'Range', q: 'How bright?', any: 'SDR & HDR', icon: 'sun',
		opts: [['sdr', 'SDR', 'standard range – encodes light up to display white'],
			['hdr', 'HDR', 'high range – encodes light brighter than display white']],
		test: (s, v) => (meta[s].dynamic || 'sdr') === v },
	{ k: 'shape', label: 'Shape', q: 'What shape are its numbers?', any: 'any shape', icon: 'shape',
		opts: [['component', 'Component', 'independent axes, like red, green and blue'],
			['opponent', 'Opponent', 'a lightness plus two color-difference axes'],
			['polar', 'Polar', 'lightness, chroma and a hue angle around the wheel']],
		test: (s, v) => geo(s) === v },
	{ k: 'signal', label: 'Signal', q: 'Screen or scene?', any: 'screen or scene', icon: 'signal',
		opts: [['display', 'Display-referred', 'encodes what a screen shows'],
			['scene', 'Scene-referred', 'encodes the light a camera saw']],
		test: (s, v) => meta[s].referred === v },
	{ k: 'curve', label: 'Tone curve', q: 'How do numbers map to light?', any: 'any curve', icon: 'curve',
		opts: [['gamma', 'Gamma', 'a display curve – equal code steps look roughly even'],
			['linear', 'Linear', 'numbers proportional to light – blending is physically right'],
			['perceptual', 'Perceptual', 'fitted to vision – equal steps aim to look equal'],
			['log', 'Log', 'a camera curve – packs a sensor’s wide range into code values'],
			['pq', 'PQ', 'SMPTE ST 2084 – absolute luminance, up to 10,000 nits'],
			['hlg', 'HLG', 'Hybrid Log-Gamma (BT.2100) – HDR that SDR screens can still show'],
			['chromaticity', 'Chromaticity', 'where a color sits, apart from how bright it is']],
		test: (s, v) => meta[s].encoding === v },
	{ k: 'white', label: 'White', q: 'Which white?', any: 'any white', icon: 'white',
		opts: [['D65', 'D65', 'noon daylight, ≈6504 K – the white of sRGB and Rec. 709'],
			['D50', 'D50', 'horizon daylight, ≈5003 K – the white of print and ICC'],
			['D60', 'D60', '≈6000 K – the white ACES is built on'],
			['DCI', 'DCI', 'the cinema projector white of DCI-P3'],
			['C', 'C', 'average daylight in the older CIE standard, ≈6774 K'],
			['A', 'A', 'a tungsten bulb, ≈2856 K'],
			['E', 'E', 'equal energy – a perfectly flat spectrum']],
		test: (s, v) => meta[s].illuminant === v },
	{ k: 'age', label: 'Age', q: 'In use today?', any: 'any age', icon: 'age',
		opts: [['current', 'In use', 'in use today'], ['historical', 'Historical', 'kept to read older material']],
		test: (s, v) => v === 'historical' ? old(s) : !old(s) },
]
export const FK = Object.fromEntries(FACETS.map(f => [f.k, f]))

// white points as chromaticities, so each option can show its own tint –
// CIE 15:2004 Table T.3 (D65, D50, C, A, E), SMPTE ST 2065-1 (ACES ≈ D60), SMPTE RP 431-2 (DCI)
export const WHITE_XY = { D65: [0.31271, 0.32902], D50: [0.34567, 0.35850], D60: [0.32168, 0.33767],
	DCI: [0.314, 0.351], C: [0.31006, 0.31616], A: [0.44757, 0.40745], E: [1 / 3, 1 / 3] }
export const whiteCSS = k => { const [x, y] = WHITE_XY[k], X = [x / y, 1, (1 - x - y) / y]
	const l = space.xyz.lrgb(...X.map(v => v * 100)), m = Math.max(...l)
	return `rgb(${space.lrgb.rgb(...l.map(v => v / m)).map(v => Math.round(Math.min(255, Math.max(0, v)))).join(' ')})` }

// ── how strips and planes are drawn: continuous, native steps, or snapped to a palette ──
export const QUANT = [
	['Continuous', [['smooth', 'Smooth', 'every value, no steps']]],
	['Steps', [['10', '10 steps', 'ten cells per channel'], ['20', '20 steps', 'twenty cells per channel'],
		['565', '16-bit', 'RGB565 – the depth of early phones and game consoles'], ['jnd', 'JND', 'one just-noticeable OKLab step per cell']]],
	['Palettes', [['web', 'Web-safe', 'the 216 web-safe colors'], ['names', 'CSS names', 'the 148 CSS named colors'],
		['xkcd', 'xkcd', 'the 949 names from the xkcd color survey'], ['tailwind', 'Tailwind', 'Tailwind CSS color tokens'],
		['pico8', 'PICO-8', 'the 16-color fantasy-console palette'], ['ansi', 'ANSI', 'the 256-color terminal palette']]],
]
export const QFLAT = QUANT.flatMap(([, o]) => o)
export const qArg = k => k === 'smooth' ? 0 : k === '10' || k === '20' ? +k : k   // what the painters take: 0 · 10 · 20 · '565' · 'jnd' · a palette name

// ── how far a color may reach before it is dimmed or cut ──
export const LIMITS = [['srgb', 'sRGB', 'what every standard screen shows'], ['p3', 'P3', 'wide-gamut phones and laptops'],
	['rec2020', 'Rec. 2020', 'the UHD container – few screens reach it'], ['vis', 'Surface', 'every color a lit surface can have'],
	['locus', 'Light', 'every real light – no limit']]

export const ARRANGE = [['family', 'Family'], ['purpose', 'Purpose'], ['era', 'Era'], ['name', 'A–Z']]
export const VIEWS = [['grid', 'Grid', 'starred spaces large, the rest as tiles'], ['list', 'List', 'one line per space, sliders at full width'], ['table', 'Table', 'the spec sheet, sortable']]
export const PREVIEWS = [['sliders', 'Sliders', 'one strip per channel'], ['planes', 'Planes', 'channel pairs as squares']]
