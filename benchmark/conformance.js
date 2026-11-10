#!/usr/bin/env node
/**
 * conformance.json run against other color libraries: for each, the rows it can run (both spaces
 * implemented), how many pass at the row's tolerance, and every failure with the row's source.
 *
 * A failure is the row's, the library's, or the adapter's (a range, white-point or transfer
 * convention): read the source before saying which. Not a ranking. Rows that cite the library in
 * their src are counted apart: for that library they are not independent evidence.
 *
 * Run: node benchmark/conformance.js [library]
 */
import { readFileSync } from 'node:fs'

const suite = JSON.parse(readFileSync(new URL('../conformance.json', import.meta.url)))

// channel k of row r passes within the row's tol, else tolerance × the span of t's range;
// a 0–360 channel is a hue, compared on the circle
const pass = (r, k, v) => {
	const [lo, hi] = suite.spaces[r.t].range[k], d = Math.abs(v - r.out[k])
	const tol = (Array.isArray(r.tol) ? r.tol[k] : r.tol) ?? suite.tolerance * (hi - lo)
	return (lo === 0 && hi === 360 ? Math.min(d % 360, 360 - d % 360) : d) <= tol
}

// An adapter maps a conformance space id to the library's own: [its id, the unit of each channel in
// conformance units] (255 where it keeps RGB in 0–1, 100 for XYZ with Y = 1, [1, 100, 100] for 0–1
// saturation and lightness). Ids follow what a library computes, not its names: color-convert's lab is
// D65-referred, so it stands for lab-d65; CSS's color(rec2020) is BT.1886 gamma 2.4, rec2020-display here.
// convert(from, to, coords) takes and returns the library's own ids and units; a missing hue reads 0.
const named = (names, make) => ({ to: (id, c) => make(id, Object.fromEntries(names[id].map((n, i) => [n, c[i]]))), from: (id, o) => names[id].map(n => +o[n] || 0) })

const adapters = {
	'colorjs.io': async () => {
		const { default: Color } = await import('colorjs.io')
		return {
			ids: {
				rgb: ['srgb', 255], lrgb: ['srgb-linear', 1], p3: ['p3', 1], 'p3-linear': ['p3-linear', 1], a98rgb: ['a98rgb', 1], 'a98rgb-linear': ['a98rgb-linear', 1],
				prophoto: ['prophoto', 1], 'prophoto-linear': ['prophoto-linear', 1], rec2020: ['rec2020', 1], 'rec2020-linear': ['rec2020-linear', 1],
				xyz: ['xyz-d65', 100], 'xyz-d50': ['xyz-d50', 100], lab: ['lab', 1], 'lab-d65': ['lab-d65', 1], lchab: ['lch', 1], luv: ['luv', 1], lchuv: ['lchuv', 1],
				oklab: ['oklab', 1], oklch: ['oklch', 1], hsl: ['hsl', 1], hsv: ['hsv', 1], hwb: ['hwb', 1], hsluv: ['hsluv', 1], hpluv: ['hpluv', 1],
				jzazbz: ['jzazbz', 1], jzczhz: ['jzczhz', 1], ictcp: ['ictcp', 1], 'rec2100-pq': ['rec2100pq', 1], acescg: ['acescg', 1], cam16: ['cam16-jmh', 1], hct: ['hct', 1],
			},
			convert: (f, t, c) => new Color(f, c).to(t).coords.map(v => v || 0),
		}
	},
	culori: async () => {
		const { converter } = await import('culori')
		const rgb = ['r', 'g', 'b'], lab = ['l', 'a', 'b'], lch = ['l', 'c', 'h'], hsl = ['h', 's', 'l'], hsv = ['h', 's', 'v'], xyz = ['x', 'y', 'z']
		const { to, from } = named({ rgb, lrgb: rgb, p3: rgb, a98: rgb, prophoto: rgb, rec2020: rgb, xyz65: xyz, xyz50: xyz, lab, lab65: lab, lch, lch65: lch,
			oklab: lab, oklch: lch, hsl, hsv, hwb: ['h', 'w', 'b'], hsi: ['h', 's', 'i'], okhsl: hsl, okhsv: hsv, jab: ['j', 'a', 'b'], jch: ['j', 'c', 'h'], itp: ['i', 't', 'p'],
			dlab: lab, dlch: lch, xyb: ['x', 'y', 'b'], cubehelix: hsl }, (mode, o) => ({ mode, ...o }))
		return {
			// not mapped: its luv and lchuv are D50-referred (the suite's are D65), its yiq is Kotsarenko & Ramos's matrix, not the FCC's
			ids: {
				rgb: ['rgb', 255], lrgb: ['lrgb', 1], p3: ['p3', 1], a98rgb: ['a98', 1], prophoto: ['prophoto', 1], rec2020: ['rec2020', 1], xyz: ['xyz65', 100], 'xyz-d50': ['xyz50', 100],
				lab: ['lab', 1], 'lab-d65': ['lab65', 1], lchab: ['lch', 1], 'lch-d65': ['lch65', 1], oklab: ['oklab', 1], oklch: ['oklch', 1],
				hsl: ['hsl', [1, 100, 100]], hsv: ['hsv', [1, 100, 100]], hwb: ['hwb', [1, 100, 100]], hsi: ['hsi', [1, 100, 100]], okhsl: ['okhsl', [1, 100, 100]], okhsv: ['okhsv', [1, 100, 100]],
				// its itp keeps Ct and Cp whole (t is 6610/4096 L' …, BT.2100's Ct); BT.2124's ITP halves T for ΔE only
				jzazbz: ['jab', 1], jzczhz: ['jch', 1], ictcp: ['itp', 1], 'din99o-lab': ['dlab', 1], 'din99o-lch': ['dlch', 1], xyb: ['xyb', 1], cubehelix: ['cubehelix', 1],
			},
			convert: (f, t, c) => from(t, converter(t)(to(f, c))),
		}
	},
	'@texel/color': async () => {
		const T = await import('@texel/color')
		return {
			ids: {
				rgb: [T.sRGB, 255], lrgb: [T.sRGBLinear, 1], p3: [T.DisplayP3, 1], 'p3-linear': [T.DisplayP3Linear, 1], a98rgb: [T.A98RGB, 1], 'a98rgb-linear': [T.A98RGBLinear, 1],
				prophoto: [T.ProPhotoRGB, 1], 'prophoto-linear': [T.ProPhotoRGBLinear, 1], rec2020: [T.Rec2020, 1], 'rec2020-linear': [T.Rec2020Linear, 1],
				xyz: [T.XYZ, 100], 'xyz-d50': [T.XYZD50, 100], oklab: [T.OKLab, 1], oklch: [T.OKLCH, 1], okhsl: [T.OKHSL, [1, 100, 100]], okhsv: [T.OKHSV, [1, 100, 100]],
			},
			convert: (f, t, c) => [...T.convert(c, f, t, [0, 0, 0])].map(v => v || 0),
		}
	},
	'chroma-js': async () => {
		const { default: chroma } = await import('chroma-js')
		return {
			ids: { rgb: ['rgb', 1], lab: ['lab', 1], lchab: ['lch', 1], oklab: ['oklab', 1], oklch: ['oklch', 1], hsl: ['hsl', [1, 100, 100]], hsv: ['hsv', [1, 100, 100]], hsi: ['hsi', [1, 100, 100]], hcg: ['hcg', [1, 100, 100]], cmyk: ['cmyk', 100] },
			convert: (f, t, c) => {
				// its lab is D65 unless told D50, as the suite's lab is; the switch also moves its oklab (rgb2oklab reads
				// lab's rgb2xyz), so it is set for each side: a color is held as sRGB in between
				const white = id => chroma.setLabWhitePoint(id === 'lab' || id === 'lch' ? 'd50' : 'd65')
				white(f); const o = chroma[f](...c)
				white(t); const v = (t === 'rgb' ? o.rgb(false) : o[t]()).map(v => v || 0)
				return t === 'hcg' ? [v[0], v[1] / 100, v[2] / 100] : v   // .hcg() gives C and G in 0–100, chroma.hcg() takes 0–1
			},
		}
	},
	'd3-color': async () => {
		const d3 = await import('d3-color')
		const { to, from } = named({ rgb: ['r', 'g', 'b'], lab: ['l', 'a', 'b'], hcl: ['l', 'c', 'h'], hsl: ['h', 's', 'l'], cubehelix: ['h', 's', 'l'] }, (id, o) => d3[id](...{ rgb: [o.r, o.g, o.b], lab: [o.l, o.a, o.b], hcl: [o.h, o.c, o.l], hsl: [o.h, o.s, o.l], cubehelix: [o.h, o.s, o.l] }[id]))
		return {
			ids: { rgb: ['rgb', 1], lab: ['lab', 1], lchab: ['hcl', 1], hsl: ['hsl', [1, 100, 100]], cubehelix: ['cubehelix', 1] },
			convert: (f, t, c) => from(t, d3[t](to(f, c))),
		}
	},
	'color-convert': async () => {
		const { default: cc } = await import('color-convert')
		// its gray is the mean of R, G, B; the suite's gray is luminance: not mapped
		return {
			ids: { rgb: ['rgb', 1], hsl: ['hsl', 1], hsv: ['hsv', 1], hwb: ['hwb', 1], cmyk: ['cmyk', 1], hcg: ['hcg', 1], xyz: ['xyz', 1], 'lab-d65': ['lab', 1], 'lch-d65': ['lch', 1] },
			convert: (f, t, c) => cc[f][t].raw(...c),
		}
	},
}

const only = process.argv[2]
for (const [name, load] of Object.entries(adapters)) {
	if (only && name !== only) continue
	const { version } = JSON.parse(readFileSync(new URL(`../node_modules/${name}/package.json`, import.meta.url)))
	const lib = await load(), unit = (id, k) => (u => Array.isArray(u) ? u[k] : u)(lib.ids[id][1])
	const tag = name.replace('@texel/color', 'texel').replace('.io', ''), self = r => r.src.toLowerCase().includes(tag)
	const rows = suite.rows.filter(r => lib.ids[r.f] && lib.ids[r.t])
	const fails = []
	for (const r of rows) {
		let got
		try { got = lib.convert(lib.ids[r.f][0], lib.ids[r.t][0], r.in.map((v, k) => v / unit(r.f, k))).slice(0, r.out.length).map((v, k) => v * unit(r.t, k)) }
		catch (e) { got = e.message }
		if (typeof got === 'string' || !r.out.every((_, k) => pass(r, k, got[k]))) fails.push([r, got])
	}
	const own = rows.filter(self)
	console.log(`\n${name} ${version}: ${rows.length} of ${suite.rows.length} rows runnable (${own.length} cite ${name}), ${rows.length - fails.length} pass, ${fails.length} fail`)
	for (const [r, got] of fails) console.log(`  ✗ ${r.f} → ${r.t} [${r.in}]: expected [${r.out}], got [${typeof got === 'string' ? got : got.map(v => +v.toPrecision(7))}]${self(r) ? ' (cites it)' : ''}\n    ${r.kind}: ${r.src.slice(0, 160)}${r.src.length > 160 ? '…' : ''}\n    ${r.url}`)
}
