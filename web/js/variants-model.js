// UI-variants workshop – the model every variant shares: one current color, the catalog's
// filters, search and arrangement, and the shelves they produce. No DOM here.
import { space, meta, clamp, classify, toSpace, hex, visibleXYZ, inVisSolid } from './core.js'
import { SPACES, disp, rgbF } from './render.js'
import GROUPS from './groups.js'
import LORE from './lore.js'
import NAMES from './names.js'
import { FAMILIES, FACETS, FK, PICKS, PURPOSE } from './variants-data.js'

export { SPACES, LORE }
const P0 = new URLSearchParams(location.search)
export const store = { get: k => { try { return localStorage.getItem('vw.' + k) } catch { return null } },
	set: (k, v) => { try { localStorage.setItem('vw.' + k, v) } catch {} } }
const pick = (v, list, d) => list.includes(v) ? v : d

export const BARS = ['sentence', 'drawer', 'guide', 'studio'], STYLES = ['bench', 'paper', 'soft', 'tinted']
export const S = {
	bar: pick(P0.get('bar') || store.get('bar'), BARS, 'drawer'),
	style: pick(P0.get('style') || store.get('style'), STYLES, 'bench'),
	space: 'oklch', vals: [0.72, 0.16, 41],   // the authored color: the space that last spoke, and its numbers
	F: Object.fromEntries(FACETS.map(f => [f.k, new Set()])),
	q: '', arrange: 'family', view: 'grid', preview: 'sliders', quant: 'smooth', limit: 'locus',
	sel: null, open: null, tsort: null, tdir: 1, shut: new Set(),
}

// ── the current color: authored in any space, read in every other ──
export let RGBX = [0, 0, 0], RGB = [0, 0, 0]   // unclamped float sRGB (wide colors keep their reading) · what a screen shows
const cache = new Map()
export function setColor(s, vals) { S.space = s; S.vals = vals.slice(); cache.clear()
	try { RGBX = s === 'rgb' ? vals.slice() : space[s].rgb(...vals) } catch { RGBX = [128, 128, 128] }
	if (!RGBX.every(isFinite)) RGBX = [128, 128, 128]
	RGB = RGBX.map(v => clamp(v, 0, 255)) }
setColor(S.space, S.vals)
export const hexNow = () => hex(RGB)
// the sRGB remixes are formulas over the sRGB cube: outside it their numbers mean nothing, so they
// read the color you SEE; every colorimetric space keeps its exact reading, clamped to its box
const REMIX = new Set(['hsl', 'hsv', 'hwb', 'hsi', 'hcg', 'hcl', 'hsp', 'hcy', 'hsm', 'okhsl', 'okhsv', 'okhwb', 'hsluv', 'hpluv', 'cmyk', 'cmy', 'ryb'])
const inRange = (s, v) => v.every((x, i) => { const c = meta[s].channels[i]; return c.max === 360 || (x >= c.min - 1e-6 && x <= c.max + 1e-6) })
export function valsOf(s) { if (s === S.space) return S.vals
	if (cache.has(s)) return cache.get(s)
	let v; try { v = toSpace(s, RGBX) } catch {}
	if (!v || !v.every(isFinite) || (REMIX.has(s) && !inRange(s, v))) { try { const w = toSpace(s, RGB); if (w.every(isFinite)) v = w } catch {} }
	if (!v || !v.every(isFinite)) v = (v || meta[s].channels.map(c => c.min)).map((x, i) => isFinite(x) ? x : meta[s].channels[i].min)
	v = v.map((x, i) => { const c = meta[s].channels[i]; return c.max === 360 ? ((x % 360) + 360) % 360 : clamp(x, c.min, c.max) })
	cache.set(s, v); return v }

// the smallest standard set that holds the color – the main page's gamut pill, one vocabulary
export const GAMLABEL = { srgb: 'sRGB', p3: 'P3', rec2020: 'Rec. 2020', vis: 'surface', locus: 'light', clip: 'not a color' }
export const GAMTIP = { srgb: 'inside sRGB – every screen shows it', p3: 'beyond sRGB, inside Display P3 – wide-gamut screens show it',
	rec2020: 'beyond P3, inside Rec. 2020 – few screens reach it', vis: 'beyond every screen, yet a lit surface can have it',
	locus: 'no surface has it, but it is a real light', clip: 'outside the spectral locus – no light has it; the preview clips' }
export function gamutOf() { const eps = 1e-4, inR = (v, hi) => v.every(x => x >= -eps && x <= hi + eps)
	try { if (inR(RGBX, 255)) return 'srgb'; if (inR(space.rgb.p3(...RGBX), 1)) return 'p3'; if (inR(space.rgb.rec2020(...RGBX), 1)) return 'rec2020' } catch {}
	try { const X = space.rgb.xyz(...RGBX); if (X.every(isFinite) && visibleXYZ(...X)) return inVisSolid(...X) ? 'vis' : 'locus' } catch {}
	return 'clip' }

// ── reading a typed color: every CSS color, plus any space's own coordinates – cam16(60 40 50) ──
const CSSFN = { rgb: 'rgb', rgba: 'rgb', hsl: 'hsl', hsla: 'hsl', hwb: 'hwb', lab: 'lab', lch: 'lchab', oklab: 'oklab', oklch: 'oklch' }
const COLORID = { srgb: ['rgb', 255], 'srgb-linear': ['lrgb', 1], 'display-p3': ['p3', 1], 'a98-rgb': ['a98rgb', 1], 'prophoto-rgb': ['prophoto', 1], rec2020: ['rec2020', 1], xyz: ['xyz', 100], 'xyz-d65': ['xyz', 100], 'xyz-d50': ['xyz-d50', 100] }
export function parseColor(str) {
	const t = String(str || '').trim().toLowerCase(); if (!t) return null
	let m = t.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/)
	if (m && (t[0] === '#' || m[1].length === 6)) { let h = m[1]; if (h.length === 3) h = [...h].map(c => c + c).join(''); return { s: 'rgb', vals: [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)) } }
	if (NAMES[t]) return { s: 'rgb', vals: NAMES[t].slice() }
	m = t.match(/^([a-z][a-z0-9-]*)\s*\(([^)]*)\)$/); if (!m) return null
	const fn = m[1], parts = m[2].replace(/\/.*$/, '').split(/[\s,]+/).filter(Boolean)
	if (fn === 'color') { const c = COLORID[parts.shift()]; if (!c) return null
		const v = parts.map(p => p.endsWith('%') ? parseFloat(p) / 100 : parseFloat(p))
		return v.length === 3 && v.every(isFinite) ? { s: c[0], vals: v.map(x => x * c[1]) } : null }
	const s = CSSFN[fn] || (SPACES.includes(fn) ? fn : null); if (!s) return null
	const ch = meta[s].channels
	const v = parts.map((p, i) => { const x = parseFloat(p); if (!p.endsWith('%')) return x
		if (s === 'hsl' || s === 'hwb') return x
		if (s === 'rgb') return x / 100 * 255
		if ((s === 'oklab' || s === 'oklch') && i === 0) return x / 100
		return ch[i].min + (ch[i].max - ch[i].min) * x / 100 })
	return v.length === ch.length && v.every(isFinite) ? { s, vals: v } : null }

// ── search: the fields a person remembers a space by ──
export const famOf = {}; for (const f of FAMILIES) for (const s of f.spaces) famOf[s] ??= f.name
const IDX = new Map(SPACES.map(s => { const m = meta[s], L = LORE[s] || {}
	return [s, [disp(s), s, m.by, m.year, famOf[s], (PURPOSE[s] || []).join(' '), m.channels.map(c => c.name).join(' '), L.for, m.description].filter(Boolean).join(' · ').toLowerCase()] }))
const hit = (s, q) => q.split(/\s+/).every(w => IDX.get(s).includes(w))

// ── filtering: OR inside a facet, AND across facets ──
export const passes = (s, skip) => (!S.q || hit(s, S.q.toLowerCase())) &&
	FACETS.every(f => f.k === skip || !S.F[f.k].size || [...S.F[f.k]].some(v => f.test(s, v)))
export const countIf = (k, v) => SPACES.filter(s => passes(s, k) && FK[k].test(s, v)).length
export const nOn = () => FACETS.reduce((n, f) => n + S.F[f.k].size, 0)
export const toggle = (k, v) => { const set = S.F[k]; set.has(v) ? set.delete(v) : set.add(v) }
export const clearAll = () => { for (const f of FACETS) S.F[f.k].clear(); S.q = '' }

// ── shelves: the arrangement's sections, each opening with its stars ──
const byName = (a, b) => disp(a).localeCompare(disp(b), 'en', { sensitivity: 'base' })
export function shelves() {
	const cut = S.arrange === 'family' ? FAMILIES
		: S.arrange === 'name' ? [...SPACES].sort(byName).reduce((out, s) => { const L = disp(s)[0].toUpperCase().replace(/[^A-Z]/, '#')
			const last = out.at(-1); if (last?.name === L) last.spaces.push(s); else out.push({ name: L, spaces: [s] }); return out }, [])
		: GROUPS[S.arrange]()
	return cut.map(c => { const spaces = c.spaces.filter(s => passes(s))
		const stars = S.arrange === 'name' ? [] : spaces.filter(s => PICKS.has(s)).slice(0, 3)
		const lead = stars.length || S.arrange === 'name' ? stars : spaces.slice(0, 1)
		return { name: c.name, tip: c.tip, total: c.spaces.length, lead, rest: spaces.filter(s => !lead.includes(s)), spaces } })
		.filter(c => c.spaces.length) }
export const shown = () => shelves().flatMap(c => [...c.lead, ...c.rest])

// the pair planes a space shows: hue across, tone up – as the solid stands
export const pairsOf = cls => { const n = cls.ch.length; if (n < 2) return []
	const ps = n > 3 ? [[0, 1], [1, 2], [2, 0]] : n === 2 ? [[0, 1]] : [[0, 1], [0, 2], [1, 2]]
	const ai = cls.angle ? cls.angle.i : -1, ti = cls.tone ? cls.tone.i : (ai < 0 && n === 3 ? 0 : undefined)
	return ps.map(([a, b]) => (ai === b || ti === a) ? [b, a] : [a, b]) }
export const sent = t => { t = String(t || '').trim(); if (!t) return ''; t = t[0].toUpperCase() + t.slice(1); return /[.!?…]$/.test(t) ? t : t + '.' }
export { classify, meta, space, rgbF, disp }
