// CPU fallback uses the same palette sources and distance metrics as the GPU (gl.js siteDist; OKLab by default).
import { clamp, space } from './core.js'
import { siteDist } from './gl.js'
import NAMES from './names.js'
import * as palettes from './palettes.js'
const sites = new Map(), cache = new Map()
export function quantRGB(rgb, q, metric = 'oklab') {
	if (!q || typeof q === 'number') return rgb
	const src = rgb.map(v => clamp(Math.round(v), 0, 255))
	if (q === '565') return src.map((v,i) => { const n = i === 1 ? 63 : 31; return Math.round(Math.round(v / 255 * n) / n * 255) })
	if (q === 'jnd') { const [l,a,b] = space.rgb.oklab(...src), step = .023
		return space.oklab.rgb((Math.floor(Math.min(l,.9999)/step)+.5)*step,Math.round(a/step)*step,Math.round(b/step)*step).map(v => clamp(Math.round(v),0,255)) }
	if (q === 'web') return src.map(v => Math.round(v / 51) * 51)
	if (!sites.has(q)) {
		const entries = q === 'names' ? Object.entries(NAMES) : palettes[q]
		if (!entries) return rgb
		sites.set(q, entries.map(([, rgb]) => ({ rgb, ok: space.rgb.oklab(...rgb), lab: space.rgb.lab(...rgb) })))
	}
	// Key and distance must use the SAME byte triple; otherwise first paint wins.
	const key = q + ':' + metric + ':' + src.join(',')
	if (cache.has(key)) return cache.get(key)
	const ok = space.rgb.oklab(...src), p = metric === 'oklab' ? null : { rgb: src, ok, lab: space.rgb.lab(...src) }
	let best = rgb, distance = Infinity
	for (const site of sites.get(q)) {
		const d = p ? siteDist(metric, p, site) : site.ok.reduce((sum, x, i) => sum + (x - ok[i]) ** 2, 0)
		if (d < distance) { best = site.rgb; distance = d }
	}
	if (cache.size > 8192) cache.clear()
	cache.set(key, best)
	return best
}
