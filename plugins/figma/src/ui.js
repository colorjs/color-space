/**
 * color-space Figma plugin: UI iframe. It does the color math, the picker and the clipboard.
 * build.js bundles this file as one IIFE into ui.html, because Figma injects the
 * manifest's `ui` file as a string (__html__), so nothing can be fetched.
 *
 * The main thread (code.js) sends {type:'init'|'selection'|'error'}; the UI sends
 * {type:'ready'|'store'|'set'|'resize'} back through parent.postMessage({pluginMessage}, '*'). In a VS Code webview
 * (plugins/vscode) the same messages go through acquireVsCodeApi().postMessage.
 *
 * Figma SolidPaint {r,g,b} are 0..1 in the document's color profile, so a DISPLAY_P3
 * file reads as the library's `p3` and an SRGB or LEGACY file as `rgb` (×255).
 * Writes go: chosen space → OkLCh → CSS Color 4 gamut map into the file's gamut →
 * clamp → {r,g,b}; under a palette lens, the coordinate's color snaps to the palette.
 *
 * The picker is the atlas's own: the plane and bar fields come from web/js/gl.js, the
 * GPU kernel the dossier paints with (the space's verified shader chunks, per pixel),
 * with core.js's CPU plane and ramps as the no-WebGL2 fallback; the quantize lenses,
 * their icons and the tooltips are the site's too. The UI keeps its own coordinates
 * while it edits, so a hue survives zero chroma and a coordinate past the gamut stays
 * under the pointer while the mapped color is written.
 */
import { space, meta, classify, geoOf, hueIdx, pairsOf, plane, ramp, decOf, fmtc, tightGamut } from '../../../web/js/core.js'
import { hasPlaneGL, planeGLStatus, paintPlaneGL, paintBarGL, setGLReady, warmPlaneGL, softGL } from '../../../web/js/gl.js'
import { quantRGB } from '../../../web/js/quant.js'
import GLYPHS from '../../../web/fonts/color-space-icons.json'
import { OI } from '../../../web/js/icons.js'
import NAMES from '../../../web/js/names.js'
import * as PALETTES from '../../../web/js/palettes.js'
import CATS from '../../../web/js/categories.js'
import { hideTip, tipIcons, tipAt } from '../../../web/js/tip.js'
import { contrast, contrastText, stepText } from '../../../web/js/measure.js'
import { ruler, unruler } from '../../../web/js/ruler.js'
import { sampleImage, paletteOf } from '../../../web/js/extract.js'
import { gamutMap, deltaEOK, DEST, JND } from './gamut.js'
import { parse as parseCss } from '../../../css.js'
import { cssOf, FORMATS } from './notation.js'
import { mixer } from './mix.js'
import { chEn, chKey } from '../../../web/js/vocab.js'
import TABLES from 'virtual:i18n'

/* ---------- the panel's language ---------- */

// Figma doesn't tell a plugin the language of its own interface, so the panel goes by the browser's first language
// (Figma desktop's is the system's): only that one, never a later preference – a second language a person reads is no
// sign the panel should speak it – where build.js compiled a table for it (the site's words for what both say, the
// plugin's own for the rest, fresh translations only); anything else is English. Every call site carries its English,
// as on the site (web/js/i18n.js)
const pickLang = () => {
	const l = String((navigator.languages || [])[0] || navigator.language || 'en'), [base, region] = l.split('-')
	if (base === 'zh') return /^(TW|HK|MO|Hant)$/.test(region || '') || !TABLES['zh-Hans'] ? 'en' : 'zh-Hans'   // Simplified only
	return TABLES[l] ? l : TABLES[base] ? base : 'en'
}
const LANG = pickLang(), DICT = TABLES[LANG] || {}
const t = (k, en, v) => { const s = DICT[k] ?? en
	return v ? s.replace(/\{(\w+)\}/g, (m, n) => n in v ? v[n] : m) : s }
const cap = s => s && s[0].toLocaleUpperCase(LANG) + s.slice(1)
// a channel's name, the site's vocabulary (channel.<slug>)
const cname = c => { const k = chKey(c), en = chEn(c); return k ? t(k, en) : en }
// the markup's words: data-i18n="key attr:key …", a bare key the element's text (scripts/i18n.js units() reads the English)
function localize() {
	document.documentElement.lang = LANG
	for (const e of document.querySelectorAll('[data-i18n]')) for (const spec of e.dataset.i18n.split(/\s+/)) {
		const [attr, key] = spec.includes(':') ? spec.split(':') : [null, spec]
		if (attr) e.setAttribute(attr, t(key, e.getAttribute(attr)))
		else e.textContent = t(key, e.textContent.trim())
	}
}

// the site's quantize lenses (web/index.html QGROUPS, QTIP), in its two columns: smooth and stepped | palettes
// The lenses' icons are glyphs of the atlas's icon font (scripts/icon-font.js), so the closed control and the native
// list show the same mark; their codepoints are Unicode symbols that look alike, for a list the OS draws in its own font
const glyph = key => String.fromCodePoint(parseInt(GLYPHS[key], 16))
// names and tips are the site's (ui.quant.*); proper names (xkcd, Tailwind, PICO-8, ANSI, JND) stay as they are
const qn = (v, en) => t(`ui.quant.${v}`, en), qt = (v, en) => t(`ui.quant.tip.${v}`, en)
const QUANT = [
	[[0, qn('smooth', 'smooth'), qt('smooth', 'continuous, unquantized')], [10, qn(10, '10-step'), qt(10, '10 native-channel cell centers')], [20, qn(20, '20-step'), qt(20, '20 native-channel cell centers')], ['565', t('pl.quant.565', '16-bit'), qt('565', '16-bit RGB565 depth')], ['jnd', 'JND', qt('jnd', 'just-noticeable OKLab steps')]],
	[['web', qn('web', 'web-safe'), qt('web', '216 web-safe colors')], ['names', qn('names', 'CSS names'), qt('names', 'CSS named colors')], ['xkcd', 'xkcd', qt('xkcd', 'xkcd survey names')], ['tailwind', 'Tailwind', qt('tailwind', 'Tailwind tokens')], ['pico8', 'PICO-8', qt('pico8', 'PICO-8 palette')], ['ansi', 'ANSI', qt('ansi', 'terminal 256 palette')]],
].map(g => g.map(([v, name, tip]) => [v, name, tip, glyph(`QI.${v || 'smooth'}`)]))
const QKEYS = QUANT.flat().map(q => q[0])
const NAMED = { names: Object.entries(NAMES), xkcd: PALETTES.xkcd, tailwind: PALETTES.tailwind, pico8: PALETTES.pico8, ansi: PALETTES.ansi }
const NAME = 'name'   // the copy list's palette-name option

// vals: the coordinates in S.space, the UI's own while it edits and re-read from the paint otherwise.
// own: the colors this UI wrote recently; a re-read that returns one of them keeps vals.
// quant: 0 (smooth), a step count, or a palette lens ('565' | 'jnd' | 'web' | 'names' | 'tailwind' …)
// images: the selection's image paints [{hash, name}]; img: hash → {rgb samples, mean} once decoded; virtual: the
// image's color when no solid or gradient is selected, a paint that moves but writes nothing.
// mine: the current paint as this UI last wrote it, shown over any re-read that trails a newer write
// cur: the paint the host last marked current (p.current), so the panel follows that mark only when it moves
// mates: the keys of the paints the current one shares its swatch with, an edit writes them all
const S = { pv: 0, space: 'oklch', quant: 0, gamuts: {}, pairs: {}, disc: {}, snap: true, editable: true, profile: 'SRGB', paints: [], images: [], img: new Map(), virtual: null, more: 0, mixed: 0, key: null, cur: null, mates: [], vals: null, mine: null, own: [], lossy: false, error: '', live: false }
const $ = id => document.getElementById(id)
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e }
// the host: Figma's frame, or a VS Code webview (plugins/vscode), whose only way out is its API; both speak {pluginMessage}
const vscode = globalThis.acquireVsCodeApi?.()
const post = msg => vscode ? vscode.postMessage({ pluginMessage: msg }) : parent.postMessage({ pluginMessage: msg }, '*')
const keyOf = p => p.virtual ? 'virtual' : `${p.id}:${p.kind}:${p.index}:${p.stop}`
const current = () => S.key === 'virtual' ? S.virtual : S.paints.find(p => keyOf(p) === S.key)
const where = p => (p.where || (p.kind === 'fills' ? t('pl.where.fill', 'fill {n}', { n: p.index + 1 }) : t('pl.where.stroke', 'stroke {n}', { n: p.index + 1 })))   // a host may say its own place (VS Code: an .ase swatch)
	+ (p.stop >= 0 ? t('pl.where.stop', ', stop {n}', { n: p.stop + 1 }) : '') + (p.visible ? '' : t('pl.where.hidden', ', hidden'))
// where a color lives: a variable or a style, named
const srcType = s => s.type === 'variable' ? t('pl.src.variable', 'variable') : t('pl.src.style', 'style')
const near = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-6)   // the paint may come back at float32 precision
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v
const byte = v => Number.isFinite(v) ? Math.round(Math.min(255, Math.max(0, v))) : 0
const lens = () => typeof S.quant === 'string'   // a palette lens snaps the whole color; a number steps the coordinates
const steps = () => typeof S.quant === 'number' ? S.quant : 0

// The file's RGB: library space, scale of its channels, gamut name, CSS form
const doc = () => S.profile === 'DISPLAY_P3'
	? { id: 'p3', scale: 1, name: 'Display P3', dest: DEST.p3, gamut: 'p3' }
	: { id: 'rgb', scale: 255, name: 'sRGB', dest: DEST.rgb, gamut: 'srgb' }
const base = p => { const { scale } = doc(); return [p.r * scale, p.g * scale, p.b * scale] }
const srgb8 = p => (doc().id === 'rgb' ? base(p) : space.p3.rgb(...base(p))).map(byte)
// an sRGB byte triple as the file's 0..1 channels
const fromSrgb8 = rgb => doc().id === 'rgb' ? rgb.map(v => v / 255) : space.rgb.p3(...rgb).map(clamp01)

const swatch = p => `color(${S.profile === 'DISPLAY_P3' ? 'display-p3' : 'srgb'} ${p.r} ${p.g} ${p.b})`
// the palette entry the paint is, under a named-palette lens
const named = rgb => (NAMED[S.quant] || []).find(([, c]) => c.join() === rgb.join())?.[0] || ''   // an 8-bit sRGB color's name in the lens's palette
const nameOf = p => tightGamut(doc().id, base(p)) === 'srgb' ? named(srgb8(p)) : ''   // past sRGB, its 8 bits are its clip's: no token

/* ---------- the picker's geometry ---------- */

const cls = () => classify(S.space)
// the plane pairs: the atlas's orientation (angle across, tone up); a hue pair is the space's own wheel – hue around, the
// other channel out (wheel: the pair can be a disc; polar: it is drawn as one – the wheel/square switch, saved per space
// and pair)
function pairs() {
	const c = cls(), hi = hueIdx(c), ti = c.tone ? c.tone.i : -1
	return pairsOf(c).map(([a, b]) => {
		// any hue pair may be a disc, as on the site (web/index.html polarPl, polarOn): by default a hue with a radius (C, S)
		// is one, a hue with the tone (L: black at the centre) a square until switched
		const wheel = c.ch.length === 3 && hi >= 0 && (a === hi || b === hi)
		const p = wheel ? { a: hi, b: a === hi ? b : a } : { a, b }
		return { ...p, wheel, polar: wheel && (S.disc[`${S.space}:${p.a},${p.b}`] ?? p.b !== ti) }
	})
}
// a click on an axis swaps it for the channel held: the next pair that keeps the other axis
function swapAxis(axis) {
	const ps = pairs(), q = pair(), keep = axis === 'a' ? q.b : q.a, k0 = ps.findIndex(p => p.a === q.a && p.b === q.b)
	const cand = ps.map((p, k) => [p, k]).filter(([p, k]) => k !== k0 && (p.a === keep || p.b === keep))
	return (cand.find(([, k]) => k > k0) || cand[0] || [ps[(k0 + 1) % ps.length], (k0 + 1) % ps.length])
}
// the default plane holds the hue (lightness × chroma at one hue), else the tone (a × b at one lightness)
function defaultPair(ps) {
	const c = cls(), hi = hueIdx(c), ti = c.tone ? c.tone.i : -1
	const holds = k => ps.findIndex(p => k >= 0 && p.a !== k && p.b !== k)
	return Math.max(0, hi >= 0 ? holds(hi) : holds(ti))
}
const pair = () => { const ps = pairs(); return ps[S.pairs[S.space] ?? defaultPair(ps)] || ps[0] || null }
const range = i => { const c = cls().ch[i]; return [c.min, c.max] }
// N steps snap a channel to its N cell centres – the lattice the kernel paints (uQ)
const snap = f => steps() ? (Math.min(steps() - 1, Math.floor(clamp01(f) * steps())) + 0.5) / steps() : clamp01(f)
const at = (i, f) => { const [lo, hi] = range(i); return lo + (hi - lo) * f }
const frac = (i, v) => { const [lo, hi] = range(i); return (v - lo) / (hi - lo || 1) }
const cell = () => steps() ? 1 / steps() : 0.01   // one key press: a cell when stepped, else 1%

/* ---------- render ---------- */

// the space picker: Figma's font menu. A search over names and ids, a family filter, the list in the
// families' own order with each family's three featured spaces (web/js/categories.js) set bold.
const FAMILIES = (() => {
	const seen = new Set(), fams = CATS.map(f => ({ name: f.name, label: t(`cat.${f.id}.name`, f.name), ids: f.spaces.filter(id => space[id] && meta[id] && !seen.has(id) && seen.add(id)), feat: new Set(f.spaces.slice(0, 3)) }))
	const rest = Object.keys(space).filter(id => !seen.has(id)).sort()
	return rest.length ? fams.concat({ name: 'More', label: t('pl.menu.more', 'More'), ids: rest, feat: new Set() }) : fams
})()
const titleOf = id => meta[id]?.title || id
// a group's label is also a legend, which a customizable select draws (and the CSS spaces) like any other row
const group = (label, options) => { const g = document.createElement('optgroup'); g.label = label; g.append(el('legend', null, label), ...options); return g }
const showSpace = () => { $('spq').value = titleOf(S.space); $('spbtn').dataset.id = S.space }   // the field shows the space's name, until it is searched

// the lens: the site's Quantize as a native select, its two groups (steps | palettes) kept. The fields' limit is the
// file's own gamut, drawn as a line – no other limit to choose: an edit is written into that one
// an option: its icon and its name as spans – a customizable select (appearance: base-select) draws them, icon in the
// icon font; an older one reads the text, the icon's look-alike symbol then the name
const opt = ([v, name, tip, g]) => {
	const o = new Option('', String(v))   // no native tooltip: it would cover the list
	o.append(Object.assign(el('span', 'ico', g || ''), { ariaHidden: 'true' }), el('span', 'nm', g ? `  ${name}` : name))
	return o
}
function renderLenses() {
	const q = $('quant')
	if (!q.options.length) q.append(group(cap(t('ui.quant.steps', 'steps')), QUANT[0].map(opt)), group(t('ui.quant.palettes', 'Palettes'), QUANT[1].map(opt)))
	q.value = String(S.quant)
	const [, qn, qt, qg] = QUANT.flat().find(x => x[0] === S.quant)
	$('quantface').textContent = qg
	// the tip sits on the select itself: tip.js keeps an ancestor's tip off a select, and hides a select's own while it is open
	$('quant').dataset.tip = t('pl.quant.tip', 'Quantize: {name}, {tip}', { name: qn, tip: qt })
}

// a field canvas in the file's color space, so a P3 file's plane shows P3 colors, not their sRGB clip
// (only for the GPU kernel: the CPU fallback writes sRGB bytes)
function canvas(cls) {
	const cv = el('canvas', cls)
	cv.getContext('2d', { colorSpace: doc().gamut === 'p3' && hasPlaneGL(S.space) ? 'display-p3' : 'srgb' })
	return cv
}

// the channels the plane doesn't hold: the sliders (all of them where there is no plane)
const held = () => { const q = pair(); return cls().ch.map((_, i) => i).filter(i => !q || (i !== q.a && i !== q.b)) }
// The picker's DOM for the current space and file and plane: the plane's canvas; a slider per held channel (its field
// and a knob, role slider, that the pointer and the keys drive) and the opacity's
function renderPicker() {
	const p = pair(), c = cls()
	$('plane').hidden = !p
	$('plane').querySelector('canvas').replaceWith(canvas())
	$('bars').replaceChildren(...held().map(i => {
		const ch = c.ch[i], bar = el('div', 'bar2'), knob = el('i', 'nrg'), bg = canvas('bgc')
		bg.height = 1
		Object.assign(knob, { tabIndex: 0 })
		knob.setAttribute('role', 'slider')
		knob.setAttribute('aria-label', t('pl.ch.slider', '{name} slider', { name: cname(ch) }))
		knob.setAttribute('aria-valuemin', String(ch.min))
		knob.setAttribute('aria-valuemax', String(ch.max))
		bar.dataset.i = knob.dataset.i = i
		bar.dataset.tip = cname(ch)   // its channel, named under the pointer
		bar.append(bg, knob)
		return bar
	}), opacityBar())
	sized = null
	$('channels')._hk = null   // new bars: their histogram lanes drawn again
	invalidate()
}

// the opacity: Figma's checkered bar under the current color, its value in percent; a solid paint's opacity, a stop's alpha
const A = 'a'
const idx = d => d === A ? A : +d
function opacityBar() {
	const bar = el('div', 'bar2 alpha'), knob = el('i', 'nrg')
	knob.tabIndex = 0
	for (const [k, v] of [['role', 'slider'], ['aria-label', t('pl.alpha.slider', 'Opacity slider')], ['aria-valuemin', '0'], ['aria-valuemax', '100']]) knob.setAttribute(k, v)
	bar.dataset.i = knob.dataset.i = A
	bar.dataset.tip = t('pl.alpha', 'Opacity')
	bar.append(knob)
	return bar
}

// The palette: the paints grouped by color, as Figma's own Selection colors – one swatch per color, the current paint's
// swatch pressed. One color: the same opacity and a difference under a fifth of the just-noticeable one (ΔEOK < JND/5,
// the rounding of a three-decimal oklch(), notation.js) – so a color written in another notation (#hex beside oklch()) is
// still the one it was written as – and the same source: a paint bound to a variable or a style is its own swatch beside
// a raw paint of the same color. An edit of a swatch writes every paint in it; its uses ride its tooltip and its label
// (and, hidden, its text)
// (and, hidden, its text). A page's thousand paints are grouped in one pass: each swatch filed under its Oklab cell, a
// cell as wide as the difference, so a paint is only weighed against the swatches of its own cell and the ones around it –
// the first that takes it, as a search of every swatch in order would find
const srcOf = p => p.src ? `${p.src.type}:${p.src.name}` : ''
let grouped = null   // the last grouping, and the paints it was of: a frame asks for it several times (the palette, the dots)
function swatches() {
	const of = [S.paints, S.pv, S.virtual && S.key === 'virtual' && S.virtual, S.profile]
	if (grouped && of.every((x, k) => x === grouped.of[k])) return grouped.out
	const out = [], cells = new Map(), W = JND / 5, dest = doc().dest
	const cell = (i, j, k) => ((i + 512) * 1024 + j + 512) * 1024 + k + 512
	for (const p of S.virtual && S.key === 'virtual' ? [S.virtual] : S.paints) {
		if (p.virtual) { out.push([p]); continue }
		const L = dest.toOklab([p.r, p.g, p.b]), [i, j, k] = L.map(x => Math.floor(x / W)), src = srcOf(p)
		let g = null
		for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) for (let dk = -1; dk <= 1; dk++)
			for (const h of cells.get(cell(i + di, j + dj, k + dk)) || []) if ((!g || h.n < g.n) && srcOf(h[0]) === src && Math.abs(h[0].opacity - p.opacity) <= 0.004 && deltaEOK(h.L, L) < W) g = h
		if (g) { g.push(p); continue }
		const n = Object.assign([p], { L, n: out.length }), c = cell(i, j, k)
		out.push(n)
		const there = cells.get(c)
		there ? there.push(n) : cells.set(c, [n])
	}
	grouped = { of, out }
	return out
}
// a swatch's colors: opaque (--swo) and with its opacity (--sw); a translucent one shows half each (ui.html .sw)
const paintSw = (e, p) => { const c = swatch(p), k = `${c}${p.opacity}`; if (e._c === k) return; e._c = k; e.style.setProperty('--swo', c); e.style.setProperty('--sw', c.replace(/\)$/, ` / ${p.opacity})`)) }   // untouched when unchanged: a drag's every re-read recolors only the swatch it moves
const placeOf = p => p.virtual ? t('pl.row.image', 'image') : p.src ? p.src.name : where(p)
const useOf = p => `${p.name}, ${placeOf(p)}`
// A swatch's tooltip lists the layers its color is on as Figma's own layer menus do (Select layer): a row each – the
// layer's icon, its name cut to one line, where on it at the right – three, then how many more; the variable or style it
// comes from over them. It is live: the pointer may cross into it, and a row pressed takes the host to that layer (Figma:
// selected, brought into view; VS Code: the literal). The icons are Figma's layer kinds (code.js sends p.layer), drawn on
// its 16 px grid at a 1 px stroke – a vector its own outline (p.shape), as Figma's layer list draws it; a host without
// layers (VS Code) sends none and its rows have no icon. The plane's dots have no tooltip: it covered the plane
const ic = d => `<svg viewBox="0 0 16 16" aria-hidden="true">${d}</svg>`
Object.assign(tipIcons, {
	FRAME: ic('<path d="M5.5 2.5v11M10.5 2.5v11M2.5 5.5h11M2.5 10.5h11"/>'),
	SECTION: ic('<rect x="2.5" y="4.5" width="11" height="9" rx="1"/><path d="M2.5 2.5h5"/>'),
	GROUP: ic('<rect x="3.5" y="3.5" width="9" height="9" stroke-dasharray="1.5 1.5"/>'),
	TEXT: ic('<path d="M3.5 5V3.5h9V5M8 3.5v9M6.5 12.5h3"/>'),   // Figma's T: its bar's ends turned down, a foot under its stem
	RECTANGLE: ic('<rect x="3.5" y="3.5" width="9" height="9" rx="1"/>'),
	IMAGE: ic('<rect x="2.5" y="3.5" width="11" height="9" rx="1"/><path d="m2.5 11 3-3 3 3 2-2 3 3"/><circle cx="10.5" cy="6.5" r="1"/>'),
	ELLIPSE: ic('<circle cx="8" cy="8" r="4.5"/>'),
	POLYGON: ic('<path d="M8 3.5 12.5 12h-9z"/>'),
	STAR: ic('<path d="m8 3 1.5 3.2 3.5.4-2.6 2.4.7 3.5L8 10.8l-3.1 1.7.7-3.5L3 6.6l3.5-.4z"/>'),
	LINE: ic('<path d="m3.5 12.5 9-9"/>'),
	VECTOR: ic('<path d="M3.5 12.5C4.5 7 8 4.5 12.5 3.5"/><rect x="2.5" y="11.5" width="2" height="2"/><rect x="11.5" y="2.5" width="2" height="2"/>'),
	BOOLEAN_OPERATION: ic('<path d="M3.5 3.5h6v3h3v6h-6v-3h-3z"/>'),
	COMPONENT: ic('<path d="M8 2.5 9.75 4.25 8 6 6.25 4.25zM8 10l1.75 1.75L8 13.5l-1.75-1.75zM4.25 6.25 6 8 4.25 9.75 2.5 8zM11.75 6.25 13.5 8l-1.75 1.75L10 8z"/>'),
	INSTANCE: ic('<path d="M8 2.5 13.5 8 8 13.5 2.5 8z"/>'),
})
tipIcons.COMPONENT_SET = tipIcons.COMPONENT
const USES = 3
function usesTip(b, g) {
	const p = g[0], rows = g.slice(0, USES).map(q => [q.virtual ? 'IMAGE' : q.shape || q.layer || '', q.name, q.virtual ? placeOf(q) : where(q)])
	if (g.length > USES) rows.push(['', t('pl.tip.more', '+{n} more', { n: g.length - USES }), ''])
	b.dataset.tipRows = JSON.stringify(rows)
	b.toggleAttribute('data-tip-live', !g[0].virtual)
	if (p.src) b.dataset.tipHead = `${srcType(p.src)} ${p.src.name}`
	else delete b.dataset.tipHead
}
// a color as the plane's tooltip names it: the variable or style it comes from, else the CSS name it has (tomato), else
// the named palette's under its lens, else its value in the space's channels
const cssName = rgb => Object.keys(NAMES).find(n => NAMES[n].join() === rgb.join()) || ''
const colorName = (rgb8, v, g = 'srgb') => (g === 'srgb' && (cssName(rgb8) || named(rgb8))) || valueOf(SPACE, { opacity: 1 }, v)[0]   // named only in sRGB: past it, its 8 bits are its clip's
const paintName = p => p.src ? `${srcType(p.src)} ${p.src.name}` : colorName(srgb8(p), into(doc().id, S.space, base(p)), tightGamut(doc().id, base(p)))
// the paints the current one shares its swatch with, itself among them: what an edit writes (read with the paint, kept
// through a gesture, when the colors it writes would otherwise part and join again)
const mates = () => { const p = current(); if (!p || p.virtual) return p ? [p] : []; const ms = S.mates.map(k => S.paints.find(q => keyOf(q) === k)).filter(Boolean); return ms.includes(p) ? ms : [p] }

// An element brought into view in its own list: that list scrolled, never the panel. scrollIntoView scrolls every scrolling
// ancestor, the panel's document too, which then sat shifted in a window sized to its content (a long page palette).
// 'center' centres it; 'top' brings one not wholly shown to the list's top (past its scroll-padding), so a grid's rows stay
// whole there (the palette's); else the least scroll shows it
function reveal(box, e, at) {
	const b = box.getBoundingClientRect(), r = e.getBoundingClientRect(), pad = parseFloat(getComputedStyle(box).scrollPaddingTop) || 0
	if (at === 'center') box.scrollTop += r.top - b.top - (b.height - r.height) / 2
	else if (r.top < b.top + pad || (at === 'top' && r.bottom > b.bottom)) box.scrollTop += r.top - b.top - pad
	else if (r.bottom > b.bottom) box.scrollTop += r.bottom - b.bottom
}
// the palette is rebuilt only when its swatches change; a re-read of the same ones (every write answers with one) just
// recolors them
function renderPaints() {
	const list = $('paints'), focused = document.activeElement?.dataset?.key, groups = swatches()
	const key = groups.map(g => g.map(p => [keyOf(p), p.name, p.visible, p.src && p.src.name + p.src.remote].join()).join('+')).join('|') + '#' + S.key
	if (list._key === key) {
		groups.forEach((g, k) => paintSw(list.children[k].querySelector('.sw'), g[0]))
		return
	}
	list._key = key
	list.replaceChildren()
	for (const g of groups) {
		const p = g[0], b = el('button', 'paint')
		b.type = 'button'
		b.dataset.key = keyOf(p)
		b.dataset.keys = g.map(keyOf).join(' ')
		b.setAttribute('aria-pressed', String(g.some(q => keyOf(q) === S.key)))
		const sw = el('span', 'sw')
		paintSw(sw, p)
		usesTip(b, g)
		b.setAttribute('aria-label', g.map(useOf).join('; '))
		b.append(sw, el('span', 'pn sr', g.map(q => q.name).join(', ')), el('span', 'src sr', g.map(placeOf).join(', ')))
		const li = el('li')
		li.append(b)
		list.append(li)
		if (focused && g.some(q => keyOf(q) === focused)) b.focus()
	}
}

// a library variable or style can't be edited from this file; a local one is edited where it lives
const locked = p => !p || !S.vals || (!p.virtual && (!S.editable || !!(p.src && p.src.remote)))

// Read the paint into vals unless it holds a color this UI just wrote (its own coordinates stay)
function sync(force) {
	const p = current()
	if (!p) { S.vals = null; S.own = []; S.mates = []; return }
	// a gesture owns the coordinates until release; after it, a re-read of a color this UI wrote keeps them too
	if (!force && S.vals && (G || S.own.some(w => near(w, [p.r, p.g, p.b])))) return
	S.own = []
	S.mates = p.virtual ? [] : (swatches().find(g => g.includes(p)) || [p]).map(keyOf)
	const v = space[doc().id][S.space](...base(p))
	S.vals = v.every(Number.isFinite) ? v : null
	S.lossy = false
	if (!S.vals) return
	// projections (kelvin, wavelength, gray…) and sRGB-bound models can't hold every color
	const back = space[S.space][doc().id](...S.vals)
	const { scale, dest } = doc()
	S.lossy = !back.every(Number.isFinite) || deltaEOK(dest.toOklab(back.map(x => x / scale)), dest.toOklab([p.r, p.g, p.b])) >= JND
}

// a write only where the DOM differs: a write of the same value is still a mutation – a style recalc each, every frame of a
// drag – and an attribute :has() rules read (hidden) widens it to everything they cover
const setHidden = (e, h) => { if (e.hidden !== h) e.hidden = h }
const setText = (e, s) => { if (e.textContent !== s) e.textContent = s }
const setAttr = (e, k, v) => { if (e.getAttribute(k) !== v) e.setAttribute(k, v) }
function update() {
	const p = current()
	setHidden($('empty'), !!p)
	// an image still on its way says so; one that couldn't be read falls back to the plain hint
	setText($('empty'), S.images.some(i => !S.img.has(i.hash)) ? t('pl.empty.reading', 'Reading the image…') : t('pl.empty.hint', 'Select a layer with a solid fill, a gradient or an image.'))
	for (const id of ['paints', 'picker', 'spbtn']) setHidden($(id), !p)
	// a long palette (a page's colors, a stylesheet's) shows the current one, once it is laid out and each time it moves
	const pl = $('paints'), on = pl.querySelector('[aria-pressed="true"]')
	if (on && pl._shown !== S.key) { pl._shown = S.key; reveal(pl, on, 'top') }   // (and when its width re-flows the rows: see wiring)
	// the eyedropper, before the sliders as Figma's – only where it can pick: none without the browser's EyeDropper (Figma in
	// Firefox or Safari) or where nothing is ever written (Dev Mode), the sliders then the panel's full width; a color that
	// can't be edited greys it (a host may leave it out, VS Code)
	setHidden($('drop'), !('EyeDropper' in window) || !S.editable)
	if ($('drop').disabled !== (!p || locked(p))) $('drop').disabled = !p || locked(p)
	const mixed = S.mixed ? t('pl.note.mixed', 'Text with mixed fills is skipped. Select text whose fill is the same throughout.') : ''
	if (!p) { renderGamut(null); $('err').textContent = S.error; return renderNotes(mixed ? [mixed] : []) }

	const v = S.vals, lock = locked(p), c = cls()
	// the picker's ink: the current color, outlined in the ink that reads on it
	const pk = $('picker').style
	pk.setProperty('--tkc', swatch(p))
	const pct = Math.round(p.opacity * 100)
	setHidden($('channels').querySelector(`.bar2[data-i="${A}"]`), !!p.virtual)   // an image's color has no opacity to set
	for (const k of $('channels').querySelectorAll('.nrg')) {
		const i = idx(k.dataset.i)
		setAttr(k, 'aria-disabled', String(lock))
		setHidden(k, !v)
		if (!v) continue
		if (i === A) { k.style.setProperty('--f', p.opacity); setAttr(k, 'aria-valuenow', String(pct)); setAttr(k, 'aria-valuetext', `${pct}%`); continue }
		k.style.setProperty('--f', clamp01(frac(i, v[i])))
		setAttr(k, 'aria-valuenow', String(v[i]))
		setAttr(k, 'aria-valuetext', `${c.ch[i].sym} ${fmtc(v[i], c.ch[i])}`)
	}
	placeMarker()

	// the value: the space's channels in cells, read, typed and stepped; its copy list every notation as the value it
	// gives – and, under a named palette's lens, the palette's name for the color first
	const vf = $('valf')
	renderCells(p, lock)
	vf.dataset.v = v ? JSON.stringify(v) : ''   // the coordinates unrounded, and the opacity: what the cells were written from
	vf.dataset.a = String(p.opacity)
	renderFormats(p, nameOf(p))

	// what screen readers hear besides the gamut; an error stays in sight, under the picker
	const notes = []
	if ($('err').textContent !== S.error) $('err').textContent = S.error
	if (!v) notes.push(t('pl.note.novalue', 'This color has no {space} value.', { space: S.space }))
	else if (S.lossy) notes.push(t('pl.note.lossy', '{space} can\'t hold this color exactly. These values are its nearest {space} equivalent, and editing writes that.', { space: S.space }))
	if (p.src) notes.push(p.src.remote
		? t('pl.note.remote', 'This color comes from the {type} {name}, which this file can\'t edit. Edit it where it\'s defined.', { type: srcType(p.src), name: p.src.name })
		: t('pl.note.editing', 'Editing the {type} {name}: every layer that uses it changes.', { type: srcType(p.src), name: p.src.name }))
	// what the faint dots are: the other colors the selection holds, an image's pixels
	const dots = [S.paints.length > 1 && t('pl.dots.others', 'other selected colors'), decoded().length && t('pl.dots.pixels', 'image pixels')].filter(Boolean)
	if (dots.length) notes.push(t('pl.note.dots', 'Dots are {list}.', { list: new Intl.ListFormat(LANG, { type: 'conjunction' }).format(dots) }))
	if (p.virtual) notes.push(t('pl.note.virtual', 'Select a fill or stroke to edit a color.'))
	else if (!S.editable) notes.push(t('pl.note.dev', 'Dev Mode is read-only. Copy the values below.'))
	if (S.more) notes.push(t('pl.note.more', 'Showing the first {n} paints.', { n: S.paints.length }))
	if (mixed) notes.push(mixed)
	renderNotes(notes)
	renderGamut(v)
	draw()
}

// The status, said to screen readers (#gamut): the gamut, read from the coordinate itself, not the last write – steady
// through a drag, re-reads and lag. The plane shows the file's colors alone, so the eye needs no mark; a coordinate typed
// past them is written mapped in, and said so
function renderGamut(v) {
	const { id, scale, name } = doc(), g = $('gamut')
	let text = ''
	if (lens()) text = v ? t('pl.gamut.snapped', 'Snapped to {name}.', { name: QUANT.flat().find(q => q[0] === S.quant)[1] }) : ''
	else if (v) {
		const rgb = S.space === id ? v : space[S.space][id](...v)
		const out = !rgb.every(x => Number.isFinite(x) && x >= -1e-4 * scale && x <= (1 + 1e-4) * scale)
		text = out ? t('pl.gamut.out', 'Outside {gamut}, mapped in.', { gamut: name }) : t('pl.gamut.in', 'In {gamut}.', { gamut: name })
	}
	if (g.textContent !== text) g.textContent = text
}

// #notes is a live region for screen readers, so it stays in place (empty when there is nothing to say) and is only
// rewritten when the text changes; otherwise every re-read would announce it again. The notes run on as one paragraph
function renderNotes(notes) {
	const box = $('notes'), text = notes.join(' ')
	if (box.textContent === text) return
	box.replaceChildren(...(text ? [el('p', null, text)] : []))
}

/* ---------- the fields: plane and bars, painted once per frame ---------- */

// The plane's view: the part of each swept channel's range it shows, as fractions – zoomed about the pointer by a pinch
// or ⌃ wheel, panned by the wheel once zoomed, reset by a double click, as on the site's planes. A wheel shows the
// full ranges (no window on a circle); a new pair or space starts whole
const WHOLE = { x0: 0, x1: 1, y0: 0, y1: 1 }
let view = WHOLE, viewOf = ''
function win() {
	const q = pair(), k = q ? `${S.space}:${q.a},${q.b}` : ''
	if (k !== viewOf) { viewOf = k; view = WHOLE }
	return $('plane')._polar ? WHOLE : view
}
const whole = (w = win()) => w.x1 - w.x0 >= 0.999 && w.y1 - w.y0 >= 0.999   // the plane shows each channel's whole range
// a channel's fraction of its range → its fraction across the plane's screen (x) or up it (y), and back
const onScreen = (f, ax) => { const w = win(); return ax === 'x' ? (f - w.x0) / (w.x1 - w.x0) : (f - w.y0) / (w.y1 - w.y0) }
const offScreen = (f, ax) => { const w = win(); return ax === 'x' ? w.x0 + (w.x1 - w.x0) * f : w.y0 + (w.y1 - w.y0) * f }
// the swept channels' ranges the plane paints: the window's part of each
const shown = q => { const w = win(); return [[at(q.a, w.x0), at(q.a, w.x1)], [at(q.b, w.y0), at(q.b, w.y1)]] }

function placeMarker() {
	const pl = $('plane'), q = pair(), v = S.vals, cx = pl.querySelector('.cx'), c = cls()
	pl.classList.toggle('locked', locked(current()))
	if (!q || !v) { cx.hidden = true; return }
	const fa = clamp01(frac(q.a, v[q.a])), fb = clamp01(frac(q.b, v[q.b]))
	let x = onScreen(fa, 'x'), y = onScreen(fb, 'y')
	if (pl._polar) {   // the kernel's disc: angle clockwise from +x, radius out (gl.js uPolar)
		const t = -fa * 2 * Math.PI
		x = 0.5 + 0.5 * fb * Math.cos(t)
		y = 0.5 + 0.5 * fb * Math.sin(t)
	}
	setHidden(cx, !(x >= -1e-9 && x <= 1 + 1e-9 && y >= -1e-9 && y <= 1 + 1e-9))   // zoomed past it: no marker at the edge pretending
	// zoomed in, where the view stands in the whole: a bar along the bottom and one along the right edge, as Figma's canvas
	// shows its own scrollbars; gone when the whole shows
	const w = win(), [zx, zy] = pl.querySelectorAll('.zoom')
	setHidden(zx, pl._polar || w.x1 - w.x0 > 0.999)
	setHidden(zy, pl._polar || w.y1 - w.y0 > 0.999)
	zx.style.left = `${w.x0 * 100}%`; zx.style.width = `${(w.x1 - w.x0) * 100}%`
	zy.style.top = `${(1 - w.y1) * 100}%`; zy.style.height = `${(w.y1 - w.y0) * 100}%`
	cx.style.left = `${x * 100}%`
	cx.style.top = `${(1 - y) * 100}%`
	// the axis letters: a click swaps that axis for the channel held (named in the tip); the wheel/square switch where a wheel
	// exists – rewritten only when the pair or the space changes (a drag moves the marker alone)
	const ax = $('axes'), ps = pairs(), [lx, ly, pm] = ['.labx', '.laby', '.pmode'].map(k => ax.querySelector(k)), axKey = [S.space, q.a, q.b, q.polar, q.wheel, ps.length, LANG].join()
	if (ax._key !== axKey) {
	ax._key = axKey
	const HOW = { across: t('pl.axis.across', '{name} across'), up: t('pl.axis.up', '{name} up'), around: t('pl.axis.around', '{name} around'), out: t('pl.axis.out', '{name} out') }
	for (const [b, axis, i, how] of [[lx, 'a', q.a, q.polar ? 'around' : 'across'], [ly, 'b', q.b, q.polar ? 'out' : 'up']]) {
		const [to] = swapAxis(axis), other = axis === 'a' ? to.a === q.b ? to.b : to.a : to.b === q.a ? to.a : to.b
		b.textContent = c.ch[i].sym
		const said = cap(HOW[how].replace('{name}', cname(c.ch[i])))
		b.dataset.tip = cname(c.ch[i])   // the tip names the channel; the label says what a click does too
		b.setAttribute('aria-label', ps.length > 1 ? t('pl.axis.swap', '{axis}. Click for {other}', { axis: said, other: cname(c.ch[other]) }) : said)
		b.disabled = ps.length < 2
	}
	pm.hidden = !q.wheel
	pm.setAttribute('aria-pressed', String(!!q.polar))
	pm.setAttribute('aria-label', q.polar ? t('pl.mode.square', 'Show as a square') : t('pl.mode.wheel', 'Show as a wheel'))
	pm.dataset.tip = q.polar ? t('pl.mode.tip.square', 'Square') : t('pl.mode.tip.wheel', 'Wheel')   // its tip a word: what a click shows
	const ab = { a: cname(c.ch[q.a]), b: cname(c.ch[q.b]) }
	pl.setAttribute('aria-label', q.polar ? t('pl.plane.wheel', '{a} and {b} wheel', ab) : t('pl.plane.plane', '{a} and {b} plane', ab))
	}
	pl.setAttribute('aria-valuenow', String(+v[q.a].toFixed(4)))
	pl.setAttribute('aria-valuetext', `${c.ch[q.a].sym} ${fmtc(v[q.a], c.ch[q.a])}, ${c.ch[q.b].sym} ${fmtc(v[q.b], c.ch[q.b])}`)
	placeMarks()
}

// the axis letters and the switch take the ink of the field under them, as on the dossier (plateInk): sampled at
// their corner, black or white by luminance
// A sampled pixel is composited over what shows through it – the first opaque backdrop behind the plane (a wheel's
// corners are the panel itself) – before its lightness is read: a translucent field, a gamut's ghost, a void, reads
// as what is seen, not as its color alone. A computed color may be any CSS notation (the tokens are oklch()): a 1×1
// canvas resolves it to sRGB bytes
const bdCtx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
function backdrop(el) {
	for (; el; el = el.parentElement) {
		bdCtx.clearRect(0, 0, 1, 1)
		bdCtx.fillStyle = getComputedStyle(el).backgroundColor
		bdCtx.fillRect(0, 0, 1, 1)
		const d = bdCtx.getImageData(0, 0, 1, 1).data
		if (d[3] === 255) return [d[0], d[1], d[2]]
	}
	return [128, 128, 128]
}
// The plane's pixels, read once per paint – through a copy on a canvas kept for reading, so the plane's own stays on the
// GPU: a canvas read often is moved off it, and every frame the kernel then draws into it waits on a copy back
const readCtx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
function pixelsOf(cv) {
	if (cv._px && cv._px.key === cv._key && cv._px.w === cv.width) return cv._px.d
	const c = readCtx.canvas
	c.width = cv.width; c.height = cv.height
	readCtx.drawImage(cv, 0, 0)
	cv._px = { key: cv._key, w: cv.width, d: readCtx.getImageData(0, 0, c.width, c.height).data }
	return cv._px.d
}
// over the field a letter is white, as every mark over it (the image's dots, the histograms); over what shows past it –
// a wheel's void corners, the panel – the ink that reads there, black or white
function labInk(cv, label, pts) {
	const bk = backdrop($('plane'))
	let L = 0, A = 0, k = 0
	try {
		const px = pixelsOf(cv)
		for (const [fx, fy] of pts) {
			const i = (Math.round(fy * (cv.height - 1)) * cv.width + Math.round(fx * (cv.width - 1))) * 4, d = px.subarray(i, i + 4), a = d[3] / 255
			const [r, g, b] = [0, 1, 2].map(c => d[c] * a + bk[c] * (1 - a))
			L += 0.2126 * r + 0.7152 * g + 0.0722 * b; A += a; k++
		}
	} catch {}
	label.style.color = !k ? 'var(--ink)' : A / k > 0.5 || L / k / 255 < 0.6 ? '#fff' : '#000'
}

let raf = 0
const draw = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; paint() }) }
// a program landing (the kernel links asynchronously) or a new space repaints everything
const invalidate = () => { for (const cv of document.querySelectorAll('canvas')) cv._key = ''; draw() }
setGLReady(invalidate)

// The gamut the fields show: the file's by default, or another chosen in the settings (kept per profile) – its colors
// painted, nothing past them, every smaller standard gamut a line on them (sRGB's in a P3 file, as Figma draws it). A
// color picked past the file's own gamut is written mapped into it
const GAMS = ['srgb', 'p3', 'rec2020']
const shownG = () => GAMS.includes(S.gamuts[S.profile]) ? S.gamuts[S.profile] : doc().gamut
const GID = { srgb: ['rgb', 255], p3: ['p3', 1], rec2020: ['rec2020', 1] }
// a coordinate inside the shown gamut, with the kernel's own pad (gl.js: ±0.002 encoded)
function inShown(v) {
	const [id, k] = GID[shownG()]
	try { const c = S.space === id ? v : space[S.space][id](...v); return c.every(u => u >= -0.002 * k && u <= 1.002 * k) } catch { return false }
}
// a step a key would take out of the shown gamut isn't taken; one from outside it (a value typed past it) is
const keeps = next => inShown(next) || !inShown(S.vals)
// The field as painted, for a pointer past it: each pixel's nearest opaque one – a breadth-first pass from every opaque
// pixel, once per paint, on the first press that needs it; a field with none (not yet painted) holds nothing back
function nearOf(cv) {
	const w = cv.width, h = cv.height
	if (cv._near && cv._near.key === cv._key && cv._near.w === w) return cv._near.n
	let n = null
	try {
		const a = pixelsOf(cv), q = new Int32Array(w * h)
		n = new Int32Array(w * h).fill(-1)
		let head = 0, tail = 0
		for (let i = 0; i < w * h; i++) if (a[i * 4 + 3] === 255) { n[i] = i; q[tail++] = i }
		if (!tail) n = null
		while (head < tail) {
			const i = q[head++], x = i % w, y = (i - x) / w
			for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
				const X = x + dx, Y = y + dy, j = Y * w + X
				if (X >= 0 && Y >= 0 && X < w && Y < h && n[j] < 0) { n[j] = n[i]; q[tail++] = j }
			}
		}
	} catch { n = null }
	cv._near = { key: cv._key, w, n }
	return n
}
// a pointer's place on the plane (fractions across and up) held to the field: past it, its nearest pixel's centre
function inPlane(fx, fy) {
	const cv = $('plane').querySelector('canvas'), w = cv.width, h = cv.height, n = w && cv._key ? nearOf(cv) : null
	if (!n) return [fx, fy]
	const i = Math.min(h - 1, Math.max(0, Math.floor((1 - fy) * h))) * w + Math.min(w - 1, Math.max(0, Math.floor(fx * w))), j = n[i]
	return j === i ? [fx, fy] : [(j % w + 0.5) / w, 1 - (Math.floor(j / w) + 0.5) / h]
}
// a bar's place (a fraction of the knob's travel) held to its field: past it, its nearest painted column
function inBar(bar, f) {
	const cv = bar.querySelector('canvas')
	if (!cv || cv.hidden || !cv.width || !cv._key) return f
	const w = cv.width, cap = bar._cap || 0, span = Math.max(1, w - 2 * cap)
	if (cv._row?.key !== cv._key) { try { cv._row = { key: cv._key, a: cv.getContext('2d').getImageData(0, 0, w, 1).data } } catch { return f } }
	const a = cv._row.a, x0 = cap + Math.min(span - 1, Math.max(0, Math.floor(f * span))), on = x => x >= cap && x < cap + span && a[x * 4 + 3] === 255
	if (on(x0)) return f
	for (let d = 1; d < span; d++) for (const x of [x0 - d, x0 + d]) if (on(x)) return (x - cap + 0.5) / span
	return f
}

// the fields' sizes, read once a layout changes them (a ResizeObserver), never inside a frame: read after a re-read changed
// the DOM, each would lay the whole panel out again, every frame of a drag
let sized = null
const sizes = () => sized ??= { plane: $('plane').querySelector('canvas').clientWidth, channels: $('channels').clientWidth, bar: $('bars').querySelector('.bar2')?.clientWidth || 0, knob: $('bars').querySelector('.nrg')?.offsetWidth || 0 }
new ResizeObserver(() => { sized = null; draw(); fitCells() }).observe($('channels'))
function paint() {
	// The fields paint the shown gamut's colors, and nothing past them (gl.js uCut); every smaller standard gamut is a line
	// on them – one device pixel, at the letters' half strength and in their ink (gl.js uEdge) – but under a lens: its
	// cells are whole colors, in a gamut or out, the boundary on their edges where the color jumps, and a line read off a
	// pixel's rate there came out as broken white seams between cells. Without WebGL2 the CPU fields ghost past the gamut
	// instead
	const v = S.vals, s = S.space, q = pair(), fg = shownG(), n = S.quant, look = { edges: n ? [] : GAMS.slice(0, GAMS.indexOf(fg)), width: 1, alpha: 0.5, cut: true }
	if (!v || !current()) return
	const st = hasPlaneGL(s) ? planeGLStatus(s) : 'no'
	if (q) {
		const pl = $('plane'), cv = pl.querySelector('canvas')
		const full = Math.min(1024, Math.round((sizes().plane || 256) * (devicePixelRatio || 1)))   // a widened panel keeps its pixels: the field and the image's dots stay sharp
		// the field depends on the held channels, never on the swept two: a drag across the plane never repaints it.
		// A held channel dragged on a bar repaints at half resolution (the dossier's live law); release settles full.
		// the GPU paints full resolution even mid-gesture; only the CPU fallback drops to half while a held channel moves
		const top = st === 'no' ? Math.min(full, 160) : full, w = S.live && st === 'no' ? top >> 1 : top
		const polar = q.polar && st !== 'no'
		pl._polar = polar
		// the gamut lines in one ink over the whole field, as the image's dots take theirs – white over a dark field, black
		// over a light one (its mean, read after a paint): an ink by each pixel switched halfway along a line, noise
		const ink = pl._dark === false ? 0 : 1
		const [rx, ry] = shown(q), key = [s, q.a, q.b, v.map((x, k) => k === q.a || k === q.b ? '' : x), n, fg, st, polar, rx, ry, ink].join()
		if (cv._key !== key || (cv.width !== top && !S.live)) {
			if (cv.width !== w || cv.height !== w) { cv.width = w; cv.height = w }
			pl.classList.toggle('polar', polar)
			cv._paints = (cv._paints || 0) + 1   // repaints, counted: a drag across the plane must not repaint it (checks read this)
			if (st === 'ready') paintPlaneGL(cv, s, v, q.a, q.b, rx, ry, fg, n, polar, 0, 'oklab', false, { ...look, ink })
			else if (st === 'no') plane(cv.getContext('2d'), w, s, v, q.a, q.b, rx, ry, true, fg, lens() ? rgb => quantRGB(rgb, n) : n || null)
			else cv.getContext('2d').clearRect(0, 0, w, w)   // linking: blank until the program lands, never a low-res preview that then sharpens
			cv._key = st === 'pending' ? '' : key
			placeMarker()
		}
		// the letters' and the switch's ink read off the field – once a gesture lets go of it (a held channel's drag repaints
		// it every frame; reading each frame would stall the GPU)
		if (!S.live && cv._key && cv._inked !== cv._key) {
			cv._inked = cv._key
			labInk(cv, $('axes').querySelector('.laby'), [[0.03, 0.06], [0.08, 0.06], [0.13, 0.06]])
			labInk(cv, $('axes').querySelector('.labx'), [[0.96, 0.96], [0.84, 0.96], [0.72, 0.96]])
			labInk(cv, $('axes').querySelector('.pmode'), [[0.04, 0.96], [0.09, 0.96], [0.04, 0.91]])   // the switch inks like the letters
			// the lines' ink read off the whole field only: zoomed in, the part in view would turn it at every pan, so it keeps
			// the ink it had
			if (whole() || pl._dark == null) pl._dark = fieldDark(cv, pl._dark)
			if ((pl._dark === false ? 0 : 1) !== ink) { cv._key = ''; draw() }   // the field read the other way: its lines again, in its ink
		}
		// the dots depend on the pair and the samples, never on the held channel
		// the image's dots: their own layer at full resolution, never touched by a gesture's repaints
		const dc = pl.querySelector('.density'), ck = cloudReady(), dkey = [ck && ck.key, q.a, q.b, polar, full, rx, ry].join()
		if (dc._key !== dkey) { dc._key = dkey; paintDensity(dc, ck, q, full, polar, polar ? [range(q.a), range(q.b)] : [rx, ry]) }
	}
	// a bar keeps its knob inside the pill, as Figma's do, so the channel's range spans the knob's travel: the field is
	// painted into that inset span and its end columns stretch over the caps, so the knob always sits on its own color
	// an image's pixels along each bar: a histogram of the channel, a lane over the bar's field
	const ck = cloudReady(), sz = sizes(), hk = [ck && ck.key, sz.channels].join()
	if ($('channels')._hk !== hk) { $('channels')._hk = hk; histograms(ck) }
	for (const bar of $('channels').querySelectorAll('.bar2:not(.alpha)')) {   // the opacity bar is CSS: the color over the checker
		const i = +bar.dataset.i, cv = bar.querySelector('canvas'), kn = bar.querySelector('.nrg')
		const css = sz.bar || 200, w = Math.min(512, Math.round(css * (devicePixelRatio || 1)))
		const cap = bar._cap = Math.round((sz.knob || 18) / 2 / css * w), span = Math.max(1, w - 2 * cap)
		const key = [s, i, v.map((x, k) => k === i ? '' : x), n, fg, st, w].join()
		if (cv._key === key) continue
		cv._key = st === 'pending' ? '' : key
		if (cv.width !== w) cv.width = w
		const src = bar._src ??= canvas()
		src.height = 1
		if (src.width !== span) src.width = span
		if (st === 'ready' && paintBarGL(src, s, v, i, range(i), fg, n, 'oklab', false, look)) {
			const ctx = cv.getContext('2d')
			ctx.clearRect(0, 0, w, 1)
			ctx.drawImage(src, cap, 0)
			ctx.drawImage(src, 0, 0, 1, 1, 0, 0, cap, 1)
			ctx.drawImage(src, span - 1, 0, 1, 1, cap + span, 0, cap, 1)
			cv.hidden = false; bar.style.background = ''; continue
		}
		cv.hidden = true
		bar.style.background = st === 'pending' ? '' : `linear-gradient(90deg, ${ramp(s, v, i, ...range(i), 48, fg).join(',')}) center / calc(100% - var(--knob)) 100% no-repeat, var(--void)`
	}
}

/* ---------- edit → write ---------- */

// The newest write waits for the next frame; a gesture's end (commit) goes at once and
// closes one undo step in Figma
// Each write is numbered; a re-read says the last number it saw (ack), so one that trails a newer write is known
let queued = null, qraf = 0, sent = 0
function flush() { cancelAnimationFrame(qraf); qraf = 0; if (queued) post({ ...queued, seq: ++sent }); queued = null }
function send(msg) { queued = msg; if (msg.commit) flush(); else if (!qraf) qraf = requestAnimationFrame(flush) }

// write a color (the file's 0..1 channels) to the current paint; the coordinates it came from stay the UI's
// write a color (the file's 0..1 channels) to the current swatch – the current paint and its mates, in one message and
// one undo step; the coordinates it came from stay the UI's
const target = q => ({ id: q.id, kind: q.kind, index: q.index, stop: q.stop })
function write(rgb, commit) {
	const p = current(), ms = mates()
	rgb = inFile(rgb)
	S.own.push(rgb)
	if (S.own.length > 64) S.own.shift()
	for (const q of ms) Object.assign(q, { r: rgb[0], g: rgb[1], b: rgb[2], opacity: p.opacity })   // shown now; the re-read confirms it
	S.pv++   // the paints changed where they are: their grouping is asked again
	if (!p.virtual) {
		S.mine = { keys: ms.map(keyOf), r: rgb[0], g: rgb[1], b: rgb[2], opacity: p.opacity }
		send({ type: 'set', ...target(p), targets: ms.map(target), profile: S.profile, color: { r: rgb[0], g: rgb[1], b: rgb[2] }, opacity: p.opacity, commit: !!commit })
	}
	renderPaints()
	update()
}

// What a write sends is inside the file's gamut: a color read past it – a host whose colors may lie outside (VS Code: an
// oklch() read in an sRGB document) – is mapped in as an edit would be (CSS Color 4), whatever writes it (an opacity, a merge)
const inFile = rgb => rgb.every(u => u >= 0 && u <= 1) ? rgb : gamutMap(space[doc().id].oklch(...rgb.map(u => u * doc().scale)), doc().dest).rgb

// A swatch dropped onto another merges them into the one carried: the swatch under it takes its color and opacity, in one
// undo step, and the two become one swatch, the current one. Paints that only look alike (an off-by-one #3b82f6) join this way.
// Both are written: a carried color the file can't hold is mapped into it, and then the carried paints take it too
function foldInto(fromKey, toKey) {
	const all = swatches(), from = all.find(g => g.some(q => keyOf(q) === fromKey)), to = all.find(g => g.some(q => keyOf(q) === toKey))
	if (!from || !to || from === to || !S.editable || from[0].virtual || to[0].virtual) return
	const c = from[0], [r, g, b] = inFile([c.r, c.g, c.b])
	const both = [...to, ...from]
	for (const q of both) Object.assign(q, { r, g, b, opacity: c.opacity })
	S.mine = { keys: both.map(keyOf), r, g, b, opacity: c.opacity }
	send({ type: 'set', ...target(to[0]), targets: both.map(target), profile: S.profile, color: { r, g, b }, opacity: c.opacity, commit: true })
	choose(keyOf(c))
}

function edit(next, commit) {
	if (locked(current())) return
	S.vals = next
	S.error = ''
	if (lens()) {   // a palette lens: the coordinate's color snaps to the palette, which is in gamut by construction
		const rgb = (S.space === 'rgb' ? next : space[S.space].rgb(...next)).map(byte)
		return write(fromSrgb8(quantRGB(rgb, S.quant)), commit)
	}
	// stepped (10, 20 cells a channel): the color is its cell's centre's, the coordinates as the hand put them until a
	// release lands them there too (grabPaint), as a palette lens does
	if (steps()) next = next.map((x, i) => at(i, snap(frac(i, x))))
	const lch = space[S.space].oklch(...next)
	if (!lch.every(Number.isFinite)) { S.error = t('pl.err.nocolor', 'Those {space} values have no color.', { space: S.space }); return update() }
	const { rgb } = gamutMap(lch, doc().dest)
	write(rgb, commit)
}
const set = (i, v, commit) => { if (!S.vals) return; const next = S.vals.slice(); next[i] = v; edit(next, commit) }
// the opacity, in whole percent as Figma keeps it; the color stays
function setAlpha(f, commit) {
	const p = current()
	if (locked(p) || p.virtual) return
	p.opacity = Math.round(clamp01(f) * 100) / 100
	write([p.r, p.g, p.b], commit)
}
// a channel's place along its bar, 0..1, and back: the opacity's is itself
const fracAt = i => i === A ? current().opacity : clamp01(frac(i, S.vals[i]))
const setFrac = (i, f, commit) => i === A ? setAlpha(f, commit) : set(i, at(i, clamp01(f)), commit)
// the live gesture: the plane repaints at half resolution and the window only grows until release
const live = on => { S.live = on; if (!on) { draw(); fit() } }

/*
 * One gesture at a time: a plane drag, a bar drag. It holds the pointer past its
 * element and past the panel's edge (pointer capture: a drag that leaves the plane keeps picking,
 * clamped to its edge), hides the cursor as Figma's picker does, writes live once per frame,
 * and ends exactly once however it ends — a release anywhere, a cancel, lost capture, the
 * window losing focus — with one commit, one undo step.
 */
let G = null
// still: the press itself moves nothing (a dot taken up stays put until the pointer moves); end(moved) closes it
function grab(el, e, move, end, still) {
	if (G || e.button) return
	e.preventDefault()
	G = { el, id: e.pointerId, move, end, moved: !still }
	try { el.setPointerCapture(e.pointerId) } catch {}
	document.documentElement.classList.add('drag')
	document.documentElement.classList.toggle('sizing', el.id === 'grip')
	document.documentElement.classList.toggle('scrub', !!el.closest('.cells'))
	el.classList.add('live')
	if (!still) move(e)
	G.v0 = S.vals?.slice()   // the drag's origin, the color the press left (a dot taken up: its own): ⇧ holds a channel to it, ⌥ measures from it
}
// a gesture's element stays put while it runs: its box is measured once, not on every move – a read there would lay out the
// whole panel the last re-read changed
const rectOf = el => G?.el === el ? (G.r ??= el.getBoundingClientRect()) : el.getBoundingClientRect()
function drop() {
	if (!G) return
	const { el, id, end, moved } = G
	G = null
	try { if (el.hasPointerCapture(id)) el.releasePointerCapture(id) } catch {}
	document.documentElement.classList.remove('drag', 'sizing', 'scrub')
	el.classList.remove('live')
	end(moved)
}
// a gesture on the current paint: live writes while it runs, then one commit – none when it never moved
// – under a lens, the channels it moved (chs) landing first: stepped, on their cell's centre; under a palette, mid-run
// (runMid) – the coordinates under the color picked, not anywhere inside its cell
function grabPaint(el, e, move, still, chs) {
	if (G || e.button || locked(current())) return
	live(true)
	grab(el, e, move, moved => {
		if (moved && S.vals && !locked(current())) {
			if (chs && steps()) for (const i of chs()) S.vals[i] = at(i, snap(frac(i, S.vals[i])))   // a cell's centre
			else if (chs && lens()) for (const i of chs()) S.vals[i] = runMid(i)
			edit(S.vals.slice(), true)
		}
		live(false)
	}, still)
}
// a coordinate's 8-bit sRGB, as a palette lens reads it (edit)
const rgb8Of = v => (S.space === 'rgb' ? v : space[S.space].rgb(...v)).map(byte)
// A palette lens's release, the site's: the channel let go lands on the middle of the run it was let go in – the stretch
// along it where the lens gives the same color, the other channels held (a palette's runs are uneven: its entry's own
// coordinates would land anywhere in the cell, or past the plane). The color stays the one picked; its coordinates stop
// drifting inside it
function runMid(i) {
	const N = 256, c = cls().ch[i], v = S.vals.slice(), f0 = clamp01(frac(i, S.vals[i])), k0 = Math.min(N - 1, Math.floor(f0 * N)), shown = GAMS.indexOf(shownG())
	// a run ends where the field does: past the shown gamut the field is void, and a landing there would sit on nothing
	const at = k => { v[i] = c.min + (c.max - c.min) * (k + 0.5) / N; const g = tightGamut(S.space, v); return g && g !== 'out' && GAMS.indexOf(g) <= shown ? quantRGB(rgb8Of(v), S.quant).join() : '' }, want = at(k0)
	let lo = k0, hi = k0
	while (lo > 0 && at(lo - 1) === want) lo--
	while (hi < N - 1 && at(hi + 1) === want) hi++
	return c.min + (c.max - c.min) * (lo + hi + 1) / 2 / N
}
const planeChs = () => { const q = pair(); return q ? [q.a, q.b] : [] }
// A release the frame never saw (the button let go outside a frame that doesn't keep capture): the next
// pointer event without a button ends the gesture there, and a new press never finds an old one alive
addEventListener('pointermove', e => { if (!G || e.pointerId !== G.id) return; if (!e.buttons) return drop(); G.moved = true; G.move(e) })
addEventListener('pointerdown', () => drop(), true)
addEventListener('pointerup', e => { if (G && e.pointerId === G.id) { if (G.moved) G.move(e); drop() } })
addEventListener('pointercancel', e => { if (G && e.pointerId === G.id) drop() })
addEventListener('lostpointercapture', e => { if (G && e.pointerId === G.id) drop() }, true)
addEventListener('blur', drop)

// the plane: a pointer position → the two swept channels, through the painted geometry; past the edge, the edge
// ⌘ (Ctrl elsewhere) held mid-drag: the pick moves a tenth as far as the pointer – fine placement. The pick follows the
// pointer's moves, not its place, so letting go of ⌘ keeps the offset it built instead of jumping back under the pointer;
// the cursor is hidden, so the knob is the only pointer there is
let fine = null
const finer = (e, raw) => {
	const fx = fine ? fine.f.map((f, k) => f + (raw[k] - fine.raw[k]) * (e.metaKey || e.ctrlKey ? 0.1 : 1)) : raw
	fine = { f: fx, raw }
	return fx
}
// a place on the plane (fractions of its box, y up) → the coordinates there, the held channels kept
function planeVals(fx, fy) {
	const q = pair()
	if (!q || !S.vals) return null
	let fa = offScreen(fx, 'x'), fb = offScreen(fy, 'y')
	if ($('plane')._polar) {
		const dx = fx * 2 - 1, dy = fy * 2 - 1
		fa = ((-Math.atan2(dy, dx) / (2 * Math.PI)) % 1 + 1) % 1
		fb = Math.min(1, Math.hypot(dx, dy))
	}
	const next = S.vals.slice()
	next[q.a] = at(q.a, clamp01(fa))   // past an edge, the edge
	next[q.b] = at(q.b, clamp01(fb))
	return next
}
// ⇧ held through a drag holds it to one channel, as Figma's and the site's planes do: the one travelled farther from where
// the press put the color moves, the other stays (a hue the shorter way round). Else the color snaps to another color's
// dot within a few pixels of it – the plane's two channels its, as the site's planes snap – unless ⌘ places it finely;
// only the colors' dots: an image's pixels are no target
const SNAP_PX = 3
function pick(e) {
	const r = rectOf($('plane')), q = pair()
	if (!q || !S.vals) return
	const next = planeVals(...inPlane(...finer(e, [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height])))   // held to the field: nothing past it is picked
	const v0 = G?.v0
	if (e.shiftKey && v0) {
		const d = i => { const t = Math.abs(frac(i, next[i]) - frac(i, v0[i])); return i === hueIdx(cls()) ? Math.min(t, 1 - t) : t }
		const keep = d(q.a) * r.width >= d(q.b) * r.height ? q.b : q.a
		next[keep] = v0[keep]
	} else if (S.snap && !(e.metaKey || e.ctrlKey)) {
		const p = place(next)
		let best = null, bd = SNAP_PX
		if (p) for (const d of $('marks')._snap || []) { const dd = Math.hypot((d.x / 100 - p[0]) * r.width, (d.y / 100 - p[1]) * r.height); if (dd < bd) { bd = dd; best = d } }
		if (best) { next[q.a] = best.v[q.a]; next[q.b] = best.v[q.b] }
	}
	edit(next)
}
const plane$ = $('plane')
plane$.addEventListener('pointerdown', e => { fine = null; grabPaint(plane$, e, pick, false, planeChs) })
// The plane names what lies under a resting pointer, as a tooltip does – after the tooltips' wait, and gone as the
// pointer moves on, to come again where it rests, ⌥ held or not (it names the color ⌥ weighs): another color's dot, its
// color (paintName); on the field, the color a press there takes – under a named palette its name (a Tailwind token),
// else its value in the space's channels, stepped its cell's; past the field, the color the point is (a press takes
// the field's nearest) – or, past the spectral locus, that it is no color. Past sRGB, the tightest display gamut
// holding it (P3, Rec.2020, > Rec.2020). None off the plane, nor mid-gesture
const GNAME = { srgb: '', p3: 'P3', rec2020: 'Rec.2020', out: '> Rec.2020' }   // where a color stands, as the tooltip says it: the settings' names (#gamseg); in sRGB nothing
let hoverT = 0, hovering = false   // hovering: the plane's tooltip is up
const unhover = () => { clearTimeout(hoverT); tipAt(null); hovering = false }
function planeTip(e) {
	const dot = e.target.closest?.('.dm'), dp = dot && S.paints.find(q => keyOf(q) === dot.dataset.key)
	let text = '', g = 'srgb'
	if (dp) { text = paintName(dp); g = tightGamut(doc().id, base(dp)) }
	else if (!dot) {
		const r = plane$.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width, fy = 1 - (e.clientY - r.top) / r.height
		if (fx >= 0 && fx <= 1 && fy >= 0 && fy <= 1) {
			const [ix, iy] = inPlane(fx, fy), on = Math.hypot(ix - fx, iy - fy) <= 1.5 / r.width
			let v = planeVals(fx, fy)
			if (on && steps()) v = v.map((x, i) => at(i, snap(frac(i, x))))
			if (on && lens()) { const rgb = quantRGB(rgb8Of(v), S.quant); text = named(rgb) || colorName(rgb, into('rgb', S.space, rgb)) }   // a token: 8-bit sRGB
			else { g = tightGamut(S.space, v); text = colorName(rgb8Of(v), v, g) }
		}
	}
	if (text && g === null) text = t('pl.void', 'Not a color')
	else if (text && GNAME[g]) text += `, ${GNAME[g]}`
	hovering = !!text
	tipAt(text ? { left: e.clientX, right: e.clientX, top: e.clientY, bottom: e.clientY + ARROW } : null, text && { text })
}
{
	const wrap = plane$.parentElement, wait = () => parseFloat(getComputedStyle($('tip')).getPropertyValue('--tip-delay')) || 500
	wrap.addEventListener('pointermove', e => {
		unhover()
		if (G || e.buttons || !S.vals || e.target.closest?.('#axes')) return   // the axes' letters and switch have their own
		const ev = { clientX: e.clientX, clientY: e.clientY, target: e.target }
		hoverT = setTimeout(() => planeTip(ev), wait())
	}, { passive: true })
	wrap.addEventListener('pointerleave', unhover)
	wrap.addEventListener('pointerdown', unhover)
}
const ARROW = 16   // the system's arrow cursor below its point, px: a tip at the pointer stands clear of it
plane$.addEventListener('pointerleave', unhover)
// the view: a pinch (⌃ wheel) zooms about the pointer, the wheel pans once zoomed, a double click shows the whole again
plane$.addEventListener('wheel', e => {
	if (plane$._polar) { if (e.ctrlKey) e.preventDefault(); return }   // no window on a wheel – and a pinch must not zoom the page
	const w = win()
	if (!e.ctrlKey && whole(w)) return
	e.preventDefault()
	const r = plane$.getBoundingClientRect(), px = clamp01((e.clientX - r.left) / r.width), py = clamp01(1 - (e.clientY - r.top) / r.height)
	if (e.ctrlKey) {
		const z = Math.exp(e.deltaY * 0.0024)
		const zm = (a0, a1, p) => { const c = a0 + (a1 - a0) * p, n = Math.min(1, Math.max(0.02, (a1 - a0) * z)), s0 = Math.min(1 - n, Math.max(0, c - n * p)); return [s0, s0 + n] }
		const [x0, x1] = zm(w.x0, w.x1, px), [y0, y1] = zm(w.y0, w.y1, py)
		view = { x0, x1, y0, y1 }
	} else {
		const wx = w.x1 - w.x0, wy = w.y1 - w.y0, x0 = Math.min(1 - wx, Math.max(0, w.x0 + e.deltaX / 600 * wx)), y0 = Math.min(1 - wy, Math.max(0, w.y0 - e.deltaY / 600 * wy))
		view = { x0, x1: x0 + wx, y0, y1: y0 + wy }
	}
	draw(); placeMarker()
}, { passive: false })
plane$.addEventListener('dblclick', () => { view = WHOLE; draw(); placeMarker() })
// keys: ←→ the across channel, ↑↓ the up one; 1% a press (Shift: 10%), or one cell when stepped
plane$.addEventListener('keydown', e => {
	const q = pair(), d = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key]
	if (!d || !q || !S.vals || locked(current())) return
	e.preventDefault()
	const step = e.shiftKey && !steps() ? 0.1 : cell()
	const next = S.vals.slice()
	for (const [k, dk] of [[q.a, d[0]], [q.b, d[1]]]) if (dk) next[k] = at(k, snap(clamp01(frac(k, next[k])) + dk * step))
	if (keeps(next)) edit(next, true)
})

// the bars: the pointer's place along the knob's travel is the value; stepped, it lands on a cell centre
const barFrac = (bar, e) => { const r = rectOf(bar), k = sizes().knob; return (e.clientX - r.left - k / 2) / Math.max(1, r.width - k) }
$('channels').addEventListener('pointerdown', e => {
	const bar = e.target.closest('.bar2')
	if (!bar) return
	const i = idx(bar.dataset.i), kn = bar.querySelector('.nrg')
	fine = null
	grabPaint(bar, e, ev => {
		const f = clamp01(finer(ev, [barFrac(bar, ev)])[0])   // ⌘ held: a tenth as far
		setFrac(i, i === A ? f : inBar(bar, f))   // held to the field: nothing past it is picked
	}, false, () => i === A ? [] : [i])
	kn.focus({ preventScroll: true })
})
// the focus ring is the keyboard's: shown from a Tab (or ⇧Tab) on, until the next press – a press that puts the focus on a
// knob, the plane or a field, and arrow keys after it, show none (Chrome's :focus-visible would ring them), as Figma's
addEventListener('keydown', e => { if (e.key === 'Tab') document.documentElement.classList.add('tabbed') }, true)
addEventListener('pointerdown', () => document.documentElement.classList.remove('tabbed'), true)
$('channels').addEventListener('keydown', e => {
	const t = e.target
	if (!t.classList.contains('nrg') || !S.vals || locked(current())) return
	const i = idx(t.dataset.i)
	const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 }[e.key]
	const to = e.key === 'Home' ? 0 : e.key === 'End' ? 1 : d == null ? null : fracAt(i) + d * (i === A ? 0.01 : cell())
	if (to == null) return
	e.preventDefault()
	if (i !== A) { const next = S.vals.slice(); next[i] = at(i, snap(clamp01(to))); if (!keeps(next)) return }
	setFrac(i, clamp01(to), true)
})

/* ---------- the eyedropper: any pixel on screen, in Chromium's EyeDropper ---------- */

$('drop').addEventListener('click', async () => {
	let hexc
	try { hexc = (await new window.EyeDropper().open()).sRGBHex }   // no EyeDropper at all throws too: said, not hidden
	catch (err) {
		if (err && err.name === 'AbortError') return   // Escape
		S.error = t('pl.err.dropper', 'The eyedropper isn\'t available here.')
		return update()
	}
	adopt(fromSrgb8([1, 3, 5].map(k => parseInt(hexc.slice(k, k + 2), 16))))
})

// a color from outside the picker (a screen pixel, a dot on the plane), in the file's 0..1
// channels: written through the active palette lens, and the coordinates are read from it
function adopt(rgb) {
	if (locked(current())) return
	S.error = ''
	write(lens() ? fromSrgb8(quantRGB(srgb8({ r: rgb[0], g: rgb[1], b: rgb[2] }), S.quant)) : rgb, true)
	sync(true)
	update()
}

/* ---------- the other colors: the selection's own, faint dots on the plane; a gradient's stops joined by a soft
   line, in order. A dot names where its color lives; a press takes it up ---------- */

// coordinates → their place on the plane ([x, y] from the top-left, 0..1), or null where they fall outside it;
// a color (the file's 0..1 channels) goes through its coordinates
function place(v) {
	const q = pair()
	if (!q || !v || !v.every(Number.isFinite)) return null
	const fa = frac(q.a, v[q.a]), fb = frac(q.b, v[q.b])
	let x = onScreen(fa, 'x'), y = onScreen(fb, 'y')
	if ($('plane')._polar) { const t = -fa * 2 * Math.PI, rr = Math.min(1, fb); x = 0.5 + 0.5 * rr * Math.cos(t); y = 0.5 + 0.5 * rr * Math.sin(t) }
	return x >= 0 && x <= 1 && y >= 0 && y <= 1 ? [x, 1 - y] : null
}
const at2 = c => place(space[doc().id][S.space](...base(c)))
function placeMarks() {
	const box = $('marks'), q = pair()
	if (!q) { if (box._key !== '') { box._key = ''; box.replaceChildren() } return }
	// nothing it draws can have moved – the view, the space, the other paints (a gradient's stops all count: its line runs
	// through the current one): no work at all, as on every frame of a drag of a lone color
	const groups = swatches(), others = groups.filter(g => !g[0].virtual && !g.some(p => keyOf(p) === S.key)), id = p => [keyOf(p), p.r, p.g, p.b, p.opacity, p.name].join()
	const inputs = [S.space, q.a, q.b, $('plane')._polar, JSON.stringify(win()), S.profile, S.key, ...others.map(g => g.map(id).join('+')), ...S.paints.filter(p => p.stop >= 0).map(id)].join('|')
	if (box._in === inputs) return
	box._in = inputs
	// what shows – a dot per other swatch (its place, its color, its label) and each gradient's line – is worked out first,
	// and drawn only when it differs from what is drawn: a drag moves the current color alone, which has no dot
	const named = p => t('pl.dot.paint', '{layer}, {where}', { layer: p.name, where: where(p) }) + (p.src ? t('pl.dot.src', ', {type} {name}', { type: srcType(p.src), name: p.src.name }) : '')
	const dots = others.flatMap(g => { const v = into(doc().id, S.space, base(g[0])), at = place(v); return at ? [{ key: keyOf(g[0]), x: at[0] * 100, y: at[1] * 100, v, bg: swatch(g[0]), label: t('pl.dot.edit', 'Edit {what}', { what: g.slice(0, 8).map(named).join('; ') }) }] : [] })
	box._snap = dots   // what a drag snaps to (pick)
	// a gradient as it paints: its colors between each pair of stops mixed – in the file's RGB (encoded, as Figma
	// blends them), or in the space the host names (mixer) – each step placed on this plane, a soft line that bends
	// wherever the space does. It breaks where it leaves the plane or wraps around a hue axis
	const lines = [], grads = new Map(), STEPS = 24
	for (const p of S.paints) if (p.stop >= 0) { const g = `${p.id}:${p.kind}:${p.index}`; grads.set(g, [...(grads.get(g) || []), p]) }
	for (const stops of grads.values()) {
		const s = stops.sort((a, b) => a.stop - b.stop), pts = [], mix = mixer(s[0].mix, doc().id, doc().scale)
		if (!mix) continue
		for (let k = 0; k + 1 < s.length; k++) for (let t = k ? 1 : 0; t <= STEPS; t++) pts.push(at2(mix(s[k], s[k + 1], t / STEPS)))
		let run = []
		const end = () => { if (run.length > 1) lines.push(run.map(p => `${(p[0] * 100).toFixed(2)},${(p[1] * 100).toFixed(2)}`).join(' ')); run = [] }
		for (const p of pts) { if (!p || (run.length && !$('plane')._polar && Math.abs(p[0] - run.at(-1)[0]) > 0.5)) end(); if (p) run.push(p) }
		end()
	}
	const key = JSON.stringify([dots, lines])
	if (box._key === key) return
	box._key = key
	box.replaceChildren()
	if (lines.length) {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
		svg.setAttribute('class', 'links')
		svg.setAttribute('viewBox', '0 0 100 100')
		svg.setAttribute('preserveAspectRatio', 'none')
		svg.innerHTML = lines.map(l => `<polyline points="${l}"/>`).join('')
		box.append(svg)
	}
	// a dot: a color of the selection, taken up by a press – it becomes the current paint, and the press drags it on.
	// Only the selection's own: nothing it doesn't hold is marked (a file's variables once were, unasked-for dots beside
	// a single button's fill). A color used in many places is one dot, its label naming them all
	for (const d of dots) {
		const b = el('button', 'dm')
		b.type = 'button'
		b.style.left = `${d.x}%`
		b.style.top = `${d.y}%`
		b.style.background = d.bg
		b.dataset.key = d.key
		b.setAttribute('aria-label', d.label)
		b.onpointerdown = e => { if (e.button) return; choose(d.key); fine = null; grabPaint(plane$, e, pick, true, planeChs) }
		b.onclick = () => choose(d.key)   // the keyboard's press
		box.append(b)
	}
}

/* ---------- ⌥: another color weighed against the current one ---------- */

// Held ⌥ (Alt), the pointer on another color – a point of the plane, a dot, a point of a bar, a swatch – the panel weighs
// it against the current color, as Figma's ⌥ measures between two points (web/js/ruler.js): on the plane, from the
// current color's mark a solid line along each of its two channels to the point, each with its step, and from the point
// dashed ones back to their ends, in Figma's measuring red; in the plane's top corner away from it, the WCAG contrast
// (none where no color is: a point past the field is weighed too – the plane's tooltip says where a color stands) and
// the steps of the channels off the plane; in the value field, its value. Held through a drag, the same
// between the drag's origin (G.v0: the color the press left, the one ⇧ holds a channel to) and the color as it is. ⌥ let go, the pointer gone, a press: it ends. The pointer's
// own ⌥ is read on each move (Figma's frame hears no key while its canvas has the focus), and the key itself where the
// panel has it
const into = (s, to, v) => s === to ? v.slice() : space[s][to](...v)
const spot = v => place(v)?.map(f => f * 100)   // a color's place on the plane, % from its top-left; none off it
// what the pointer is on, as a color: { s, v } (a space and its values) and its place on the plane (or none); nothing on
// the current color's own swatch
function weighed(e) {
	const el = e.target.closest?.('.dm, .paint, .bar2, #plane')
	if (!el || !S.vals) return null
	if (!el.matches('.bar2, #plane')) {
		const p = S.paints.find(q => keyOf(q) === el.dataset.key)
		if (!p || (el.dataset.keys || '').split(' ').includes(S.key)) return null
		return { s: doc().id, v: base(p), at: spot(into(doc().id, S.space, base(p))) }
	}
	if (el.matches('.bar2')) {
		const i = idx(el.dataset.i)
		if (i === A) return null
		const v = S.vals.slice(); v[i] = at(i, snap(clamp01(barFrac(el, e))))
		return { s: S.space, v }
	}
	const r = el.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width, fy = 1 - (e.clientY - r.top) / r.height
	return { s: S.space, v: planeVals(fx, fy), at: [fx * 100, (1 - fy) * 100] }
}
let hovered = null, measuring = false   // the last move over the panel: where ⌥ reads from when the key itself comes
function measureAt(e) {
	const u = G ? G.v0 && S.vals && { s: S.space, v: S.vals, at: spot(S.vals) } : weighed(e)
	if (!u || !S.vals) return unmeasure()
	const v0 = G ? G.v0 : S.vals, own = into(u.s, S.space, u.v), c = cls(), q = pair(), h = hueIdx(c), on = q ? [q.a, q.b] : []
	const st = i => stepText(c.ch[i], v0[i], own[i], i === h ? c.ch[i].max - c.ch[i].min : 0, fmtc)
	const Y = (s, v) => into(s, 'xyz', v)[1] / 100
	const readout = [tightGamut(u.s, u.v) !== null && contrastText(contrast(Y(S.space, v0), Y(u.s, u.v)), t('pl.measure.large', 'AA large')), ...c.ch.map((_, i) => i).filter(i => !on.includes(i)).map(st)].filter(Boolean)
	measuring = true
	if (!hovering) hideTip()   // the readout is its tip while it lasts: no element's own comes over it, nor stays once ⌥ is let go – the plane's own, naming the color weighed, stays
	ruler($('plane').parentElement, { from: spot(v0), to: u.at || null, polar: !!$('plane')._polar, steps: u.at ? on.map(st) : [], readout })
	if (!G) { const d = into(u.s, doc().id, u.v).map(x => x / doc().scale); showValue({ ...current(), r: d[0], g: d[1], b: d[2] }, own) }   // its value where the current one's stands, as Figma's field follows its picker
}
function unmeasure() {
	if (!measuring) return
	measuring = false
	unruler($('plane').parentElement)
	const p = current()
	if (p) showValue(p)
}
addEventListener('pointermove', e => { hovered = e; if (e.altKey) measureAt(e); else unmeasure() }, { passive: true })
addEventListener('keydown', e => { if (e.key === 'Alt' && hovered) measureAt(hovered) })
addEventListener('keyup', e => { if (e.key === 'Alt') unmeasure() })
addEventListener('pointerdown', unmeasure, true)
addEventListener('blur', unmeasure)
document.documentElement.addEventListener('pointerleave', () => { hovered = null; unmeasure() })

/* ---------- an image's pixels: dots on the plane ---------- */

const pending = new Set()
const decoded = () => S.images.map(i => S.img.get(i.hash)).filter(d => d && d.rgb)
// the selection's images as one set of unique colors (each with its pixel count), their coordinates in the current
// space computed in slices across frames – the picker draws first and never waits on them
let cloud = null, job = null
function cloudReady() {
	const parts = decoded()
	if (!parts.length) return null
	const key = S.space + '|' + S.images.map(i => i.hash).join()
	if (cloud && cloud.key === key) return cloud
	if (job !== key) { job = key; buildCloud(key, parts) }
	return null
}
async function buildCloud(key, parts) {
	const seen = new Map()
	for (const { rgb } of parts) for (let i = 0; i < rgb.length; i += 3) { const k = (rgb[i] << 16) | (rgb[i + 1] << 8) | rgb[i + 2]; seen.set(k, (seen.get(k) || 0) + 1) }
	const keys = [...seen.keys()], n = keys.length, dim = cls().ch.length, v = new Float32Array(n * dim), w = new Float32Array(n)
	for (let k = 0; k < n; k++) {
		if (k && !(k % 1500)) { await new Promise(r => requestAnimationFrame(r)); if (job !== key) return }   // a newer space or selection took over
		const c = keys[k], r = c >> 16, g = (c >> 8) & 255, b = c & 255
		const x = S.space === 'rgb' ? [r, g, b] : space.rgb[S.space](r, g, b)
		for (let d = 0; d < dim; d++) v[k * dim + d] = x[d]
		w[k] = seen.get(c)
	}
	if (job !== key) return
	cloud = { key, v, w, dim, n }
	job = null
	draw()
}
// the dots, as on the dossier's image density: a fifth-opaque square per sample, light on a dark field, dark on a light one
// the image's pixels on the plane: white dots, as every mark over the field (the site's), with no outline – over a light
// field they fade, and the held channel moved darker shows them
function paintDensity(cv, c, q, w, polar, [[a0, a1], [b0, b1]]) {
	const ctx = cv.getContext('2d')
	if (cv.width !== w || cv.height !== w) { cv.width = w; cv.height = w }
	ctx.clearRect(0, 0, w, w)
	if (!c) return
	const r = Math.max(2, w / 190)
	ctx.fillStyle = '#fff'
	for (let k = 0; k < c.n; k++) {
		const fa = (c.v[k * c.dim + q.a] - a0) / (a1 - a0), fb = (c.v[k * c.dim + q.b] - b0) / (b1 - b0)
		let x = fa, y = fb
		if (polar) { if (!(fa >= 0 && fa <= 1 && fb >= 0)) continue; const t = -fa * 2 * Math.PI, rr = Math.min(1, fb); x = 0.5 + 0.5 * rr * Math.cos(t); y = 0.5 + 0.5 * rr * Math.sin(t) }
		if (!(x >= 0 && x <= 1 && y >= 0 && y <= 1)) continue
		ctx.globalAlpha = 1 - 0.8 ** c.w[k]   // a color seen n times reads as n fifth-opaque dots stacked
		ctx.fillRect(x * w - r / 2, (1 - y) * w - r / 2, r, r)
	}
	ctx.globalAlpha = 1
}
// The histogram of each channel over the image's distinct colors (each weighted by its pixel count), the site's lane
// recipe (web/index.html histMask): a bin per device pixel of the lane, a sample split between the two bins it falls
// between, the height scaled to the 97th percentile, not the peak (one dominant color would flatten the rest), drawn
// as an alpha mask – a fade from .9 to .74 down the columns and a crest at full ink – that the lane wears over the ink
function histograms(c) {
	for (const bar of $('channels').querySelectorAll('.bar2:not(.alpha)')) {
		const i = +bar.dataset.i, h = bar._hist ??= bar.insertBefore(Object.assign(el('i', 'hist'), { ariaHidden: 'true' }), bar.querySelector('.nrg'))
		const W = Math.max(32, Math.min(1024, Math.round((h.clientWidth || 160) * (devicePixelRatio || 1)))), H = 64
		if (!c || !(i < c.dim)) { h.hidden = true; continue }
		const bins = new Float32Array(W)
		for (let k = 0; k < c.n; k++) {
			const t = frac(i, c.v[k * c.dim + i]); if (!(t >= 0 && t <= 1)) continue
			const x = t * (W - 1), j = x | 0, f = x - j
			bins[j] += c.w[k] * (1 - f); if (j + 1 < W) bins[j + 1] += c.w[k] * f
		}
		const m = Float32Array.from(bins).sort()[Math.floor(W * 0.97)] || Math.max(...bins)
		if (!m) { h.hidden = true; continue }
		const cv = Object.assign(document.createElement('canvas'), { width: W, height: H }), g = cv.getContext('2d'), fade = g.createLinearGradient(0, 0, 0, H)
		fade.addColorStop(0, 'rgba(0,0,0,.9)'); fade.addColorStop(0.8, 'rgba(0,0,0,.82)'); fade.addColorStop(1, 'rgba(0,0,0,.74)')
		g.fillStyle = fade
		for (let j = 0; j < W; j++) { const hh = Math.min(1, bins[j] / m) * H; if (hh > 0) g.fillRect(j, H - hh, 1, hh) }
		g.fillStyle = '#000'   // the crest, a pixel of full ink
		for (let j = 0; j < W; j++) { const hh = Math.min(1, bins[j] / m) * H; if (hh > 0) g.fillRect(j, Math.max(0, H - hh - 1.2), 1, 1.2) }
		h.style.webkitMaskImage = h.style.maskImage = `url(${cv.toDataURL()})`
		h.hidden = false
	}
}
// the field's mean luminance decides its gamut lines' ink (the marks over it are white whatever it is). was: the field's
// last reading. A margin either side of the middle: the field's lines are drawn in the ink read off
// it, so they move its mean a little – a field right at the middle once flipped its ink at every paint, and repainted
// without end (a green held at L 0.59 in a P3 file, Rec.2020 shown)
function fieldDark(cv, was) {
	try {
		const d = pixelsOf(cv)
		let L = 0, n = 0
		for (let i = 0; i < d.length; i += 64) if (d[i + 3] > 128) { L += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; n++ }
		return !n || L / n < (was == null ? 128 : was ? 136 : 120)
	} catch { return true }
}

// the image's color stands in for a paint when the selection has no solid or gradient: it moves, it writes nothing
function refreshVirtual() {
	if (S.paints.length) { S.virtual = null; return }
	const first = S.images.find(i => S.img.get(i.hash)?.mean)
	if (!first) { S.virtual = null; if (S.key === 'virtual') S.key = null; return }
	if (S.virtual && S.virtual.hash === first.hash && S.key === 'virtual') return
	const [r, g, b] = fromSrgb8(S.img.get(first.hash).mean)
	S.virtual = { virtual: true, hash: first.hash, id: '', name: first.name, kind: 'fills', index: 0, stop: -1, r, g, b, opacity: 1, visible: true, src: null }
	S.key = 'virtual'
	sync(true)
	renderPaints()
}
async function receiveImage(m) {
	pending.delete(m.hash)
	await new Promise(r => requestAnimationFrame(() => setTimeout(r)))   // the picker's frame first; the image after it
	let rgb = null
	try { if (m.bytes) rgb = await sampleImage(new Blob([m.bytes]), 160) } catch {}   // ≤ 160 px a side: dots, and samples enough for a smooth histogram; missing or undecodable: none
	S.img.set(m.hash, { rgb, mean: rgb && rgb.length ? paletteOf(rgb, 1)[0] : null })   // the pixel nearest the mean (OkLab), standing in as its color
	refreshVirtual()
	update()
}

// the panel losing the focus – a press on Figma's own chrome, its canvas, another app – closes what floats over it: the
// space menu, the settings, an open list (its select let go); the tooltip goes too (tip.js)
addEventListener('blur', () => {
	closeSpaces()
	try { $('prm').hidePopover() } catch {}
	// an open list (a customizable select's) has no call that closes it, and keeps open when the focus leaves: its select
	// is taken out of the page and put back, which closes it (the element the same, its listeners kept)
	for (const sel of document.querySelectorAll('select')) { try { if (sel.matches(':open')) { const at = sel.parentNode, next = sel.nextSibling; sel.remove(); at.insertBefore(sel, next) } } catch {} }
})
// the tooltip stays secondary: any press dismisses it (but one on a live tip's row: that is its use), and focus brings it
// only from the keyboard — a clicked button takes focus, and tip.js would show its tip again
addEventListener('pointerdown', e => { if (!e.target.closest?.('#tip')) hideTip() }, true)
addEventListener('focusin', e => { if (!e.target.matches?.(':focus-visible')) e.stopPropagation() }, true)

/* ---------- undo ---------- */

// ⌘Z (Ctrl+Z) in the panel undoes the host's last step – Figma's history, or the document's – which the frame's keys never
// reach on their own; not in a field being typed in (its text has its own undo), not with Shift (plugins get no redo).
// The colors this UI wrote are forgotten, so the re-read that follows shows the color undone to, not the one it kept
addEventListener('keydown', e => {
	if (!(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey || e.key.toLowerCase() !== 'z') return
	const f = e.target.closest?.('input')
	if (f && !f.readOnly && (f.dataset.dirty || f.id === 'spq')) return
	e.preventDefault()
	S.own = []; S.mine = null
	post({ type: 'undo' })
})

/* ---------- copy ---------- */

// a text to the clipboard – a row of the copy list – and the host saying so (Figma's toast, VS Code's status bar); where
// the frame has no clipboard at all, the text stays in sight in the error line, to be selected by hand
async function copy(text) {
	let ok = false
	try { await navigator.clipboard.writeText(text); ok = true }
	catch {
		// fallback when the iframe has no async clipboard (unverified in Figma; see README): a field selected, copied
		const ta = Object.assign(document.createElement('textarea'), { value: text })
		ta.style.cssText = 'position:fixed;opacity:0'
		document.body.append(ta)
		ta.select()
		try { ok = document.execCommand('copy') } catch { ok = false }
		ta.remove()
	}
	if (!ok) { S.error = t('pl.err.copy', 'The clipboard isn\'t available here. The value: {value}', { value: text }); update() }
	else post({ type: 'notify', text: t('pl.copied', 'Copied {value}', { value: text }) })
}

/* ---------- the menus: over their control ---------- */

// Figma's menus open over their control, the chosen row over the control's own text (a macOS popup menu). The select draws
// its list where it anchors it; once open, the list is moved (a translate: the anchoring kept) by the distance from the
// chosen row to the control – vertically centred on it, its text over the control's text – and held inside the window.
// It shows only once moved
function overControl(sel, ctrl, textLeft) {
	const st = sel.style
	st.setProperty('--pk-o', '0'); st.setProperty('--pk-dx', '0px'); st.setProperty('--pk-dy', '0px')
	let k = 0
	const place = () => {
		const on = sel.selectedOptions[0] || sel.options[0], o = on?.getBoundingClientRect()
		if (!sel.matches(':open') || !o?.height) return ++k < 12 ? requestAnimationFrame(place) : st.removeProperty('--pk-o')
		const rows = [...sel.options].map(x => x.getBoundingClientRect()), c = ctrl.getBoundingClientRect(), edge = 8   // the list's padding and border round its rows, its rows' margin
		const top = rows[0].top - edge, bottom = rows.at(-1).bottom + edge, left = rows[0].left - edge, right = rows[0].right + edge
		const dy = Math.min(Math.max(c.top + (c.height - o.height) / 2 - o.top, 4 - top), innerHeight - 4 - bottom)
		const range = document.createRange()
		range.selectNodeContents(on)
		const dx = Math.min(Math.max(textLeft() - range.getBoundingClientRect().left, 4 - left), innerWidth - 4 - right)
		st.setProperty('--pk-dx', `${Math.round(dx)}px`)
		st.setProperty('--pk-dy', `${Math.round(dy)}px`)
		st.setProperty('--pk-o', '1')
	}
	requestAnimationFrame(place)
}
// a select drawn by the page (customizable): its control the outlined box it sits in, its text the shown option's. (The
// format's list is not one: it opens above the value field, ui.html .fmt ::picker)
function overSelects() {
	if (!CSS.supports('appearance', 'base-select')) return
	const textOf = sel => () => { const r = document.createRange(), sc = sel.querySelector('selectedcontent'); r.selectNodeContents(sc); return r.getBoundingClientRect().left }
	for (const [sel, ctrl, text] of [[$('scope'), $('scope').closest('.sel'), textOf($('scope'))], [$('spgroup'), $('spgroup').closest('.sel'), textOf($('spgroup'))], [$('quant'), $('quantf'), textOf($('quant'))]]) {
		sel.addEventListener('pointerdown', e => { if (!e.target.closest('option') && !sel.matches(':open')) overControl(sel, ctrl, text) })   // a press on a row is a pick, not an opening
		sel.addEventListener('keydown', e => { if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key) && !sel.matches(':open')) overControl(sel, ctrl, text) })
	}
}

/* ---------- wiring ---------- */

function useSpace(id) {
	S.space = id
	showSpace()
	S.error = ''
	renderPicker()
	sync(true)
	update()
}
// A space's plane is a shader compiled on its first draw: 0.5–1 s for a space the GPU has never built (measured on an
// Apple M4 Max under ANGLE Metal; the OS caches it after), tens of ms once built. Once the current one is up, the
// featured spaces compile and draw a pixel in the background, so the usual picks open at once. Not on a software GL
function warmFeatured() {
	if (softGL()) return
	if (planeGLStatus(S.space) === 'pending') return setTimeout(warmFeatured, 100)
	for (const f of FAMILIES) for (const id of f.feat) warmPlaneGL(id)
}
/*
 * The space menu, Figma's white one, under the space's field. A press outside closes it and does nothing else (the click
 * that follows is swallowed too: preventing a press doesn't cancel it) – unless it opens another control, a lens, the
 * copy list or the settings (one menu at a time), or takes the grip: the window resized at once. The window grows to
 * hold it (fit)
 */
const OK = '<svg class="ic ok" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
let swallow = false
addEventListener('pointerdown', e => {
	if (spmenu.hidden || e.target.closest('#spmenu, #spbtn')) return
	if (e.target.closest('.lens, .fmt, #prmb, #grip')) return closeSpaces()
	e.preventDefault(); e.stopPropagation(); swallow = true; closeSpaces()
}, true)
addEventListener('click', e => { if (!swallow) return; swallow = false; e.preventDefault(); e.stopPropagation() }, true)
addEventListener('pointerup', () => setTimeout(() => { swallow = false }), true)

/*
 * The space: its field shows its name and is the search. Focused, it lists the spaces under it – the featured ones, or a
 * family's, or every one (the menu's select, as Figma's font list does its sources) – and typing searches every space by
 * name or id; ↑↓ move, Enter
 * takes, Escape or a press outside closes and the field shows the space's name again
 */
const spmenu = $('spmenu'), spq = $('spq')
let spGroup = 'featured', typed = false   // the usual picks first; the family select opens the rest
const GROUPS = () => [['all', t('pl.menu.all', 'All spaces'), FAMILIES.flatMap(f => f.ids)], ['featured', t('pl.menu.featured', 'Featured'), FAMILIES.flatMap(f => f.ids.filter(id => f.feat.has(id)))], ...FAMILIES.map(f => [f.name, f.label, f.ids])]
const featured = id => FAMILIES.some(f => f.feat.has(id))
// a space in the menu: its name and its shape's mark, the site's (core.js geoOf): a disc for a hue around, a rhombus
// parted at its neutral for opponent spaces, a cube for the rest
const kindOf = id => Object.assign(el('span', 'kind'), { innerHTML: OI[geoOf(id)] })
function renderSpaceMenu() {
	const g = $('spgroup')
	// All spaces, then Featured, then the families: each of the first two parted from what follows, as Figma's font sources
	if (!g.options.length) GROUPS().forEach(([v, label], k) => { g.append(new Option(label, v)); if (k < 2) g.append(document.createElement('hr')) })
	g.value = spGroup
	const q = typed ? spq.value.trim().toLowerCase() : '', list = $('splist')
	// a search spans every space (from Featured it would find only those); without one, the chosen family's
	const ids = (q ? GROUPS()[0] : GROUPS().find(x => x[0] === spGroup) || GROUPS()[0])[2].filter(id => !q || id.includes(q) || titleOf(id).toLowerCase().includes(q))
	list.replaceChildren(...(ids.length ? ids.map(id => {
		const b = el('button', 'mi spo' + (featured(id) ? ' feat' : ''))
		b.type = 'button'
		b.tabIndex = -1   // the field keeps the focus; the rows are reached with the arrows
		b.dataset.id = id
		b.setAttribute('role', 'option')
		b.setAttribute('aria-selected', String(id === S.space))
		b.innerHTML = OK
		b.append(el('span', 'nm', titleOf(id)), kindOf(id))
		return b
	}) : [el('p', 'spnone', t('pl.menu.none', 'No space by that name'))]))
	const on = (!q && list.querySelector('[aria-selected="true"]')) || list.querySelector('.spo')
	if (on) on.classList.add('on')
	fit()
}
function openSpaces() {
	if (!spmenu.hidden) return
	typed = false
	renderSpaceMenu()
	spmenu.hidden = false
	fit()
	spq.setAttribute('aria-expanded', 'true')
	const on = $('splist').querySelector('.spo.on')
	if (on) reveal($('splist'), on, 'center')
}
function closeSpaces() {
	if (!spmenu.hidden) { spmenu.hidden = true; fit() }
	spq.setAttribute('aria-expanded', 'false')
	typed = false
	showSpace()
}
const takeSpace = id => {
	closeSpaces()
	if (id === S.space) return
	post({ type: 'store', key: 'space', value: id })
	useSpace(id)
}
spq.addEventListener('focus', () => { openSpaces(); spq.select() })   // the name selected: typing replaces it
// the field's chevron opens the menu and shuts it, as a select's does – a press there once only ever opened it again
{
	const chev = $('spbtn').querySelector('.chev')
	chev.addEventListener('pointerdown', e => { e.preventDefault(); if (spmenu.hidden) { openSpaces(); spq.focus() } else { closeSpaces(); spq.blur() } })
	chev.addEventListener('click', e => e.preventDefault())   // the label's own click would focus the field, and open it again
}
spq.addEventListener('click', openSpaces)
spq.addEventListener('input', () => { typed = true; openSpaces(); renderSpaceMenu() })
spq.addEventListener('keydown', e => {
	if (e.key === 'Escape' && !spmenu.hidden) { e.preventDefault(); return closeSpaces() }
	if (e.key === 'Enter') { const b = $('splist').querySelector('.spo.on'); if (b && !spmenu.hidden) { e.preventDefault(); takeSpace(b.dataset.id) } return }
	const d = { ArrowDown: 1, ArrowUp: -1 }[e.key]
	if (!d) return
	e.preventDefault()
	if (spmenu.hidden) return openSpaces()
	const rows = [...$('splist').querySelectorAll('.spo')], k = rows.findIndex(b => b.classList.contains('on')), next = rows[Math.max(0, Math.min(rows.length - 1, k + d))]
	if (!next) return
	rows.forEach(b => b.classList.toggle('on', b === next))
	reveal($('splist'), next)
	warmSoon(next)
})
// focus leaving the field and its menu closes the menu
for (const x of [$('spbtn'), spmenu]) x.addEventListener('focusout', e => { if (!e.relatedTarget?.closest?.('#spbtn, #spmenu')) closeSpaces() })
$('spgroup').addEventListener('change', e => { spGroup = e.target.value; renderSpaceMenu(); spq.focus() })
// a row pressed keeps the field's focus (a blur would close the menu before the click lands)
$('splist').addEventListener('pointerdown', e => { if (e.target.closest('.spo')) e.preventDefault() })
// a space rested on in the menu – pointed at or stepped to, and still there a moment later – starts compiling ahead of the
// rest, so by the click it is often ready: compiled, not drawn (its first draw, where a driver may build its pipeline,
// waits for the pick). Rows passing under a still pointer as the list scrolls, or under a held arrow key, warm nothing –
// each once compiled there and then, and the scroll stalled: the wait starts again on every move and every scroll. Not on
// a software GL, where a compile holds the page for seconds
let warmT = 0, rest = null
const warmSoon = b => {
	rest = b || rest
	clearTimeout(warmT)
	if (rest && !softGL()) warmT = setTimeout(() => (rest.classList.contains('on') || rest.matches(':hover')) && warmPlaneGL(rest.dataset.id, true, false), 150)
}
$('splist').addEventListener('pointerover', e => { const b = e.target.closest('.spo'); if (b) warmSoon(b) })
$('splist').addEventListener('scroll', () => warmSoon(), { passive: true })
$('splist').addEventListener('click', e => { const b = e.target.closest('.spo'); if (b) takeSpace(b.dataset.id) })

// the palette's scope, Figma's own pair: the selection's colors, or the page's; the host reads them anew
$('scope').addEventListener('change', e => post({ type: 'store', key: 'scope', value: e.target.value }))
// a row picked from the copy list is copied, and the list keeps no row picked – any row, again, copies again. The button
// is pressed, never focused: the list, once shut, leaves no focus on it
$('fmt').addEventListener('change', e => {
	const o = e.target.selectedOptions[0]
	e.target.selectedIndex = -1
	requestAnimationFrame(() => e.target.blur())   // after the select takes its focus back from the list
	if (o && current()) copy(o.dataset.copy)
})
$('quant').addEventListener('change', e => {
	S.quant = QKEYS.find(k => String(k) === e.target.value)
	post({ type: 'store', key: 'quant', value: S.quant })
	renderLenses()
	update()
})
/* ---------- the value: the space's channels, and a copy in any notation ---------- */

// The value is the space's own channels and nothing else – a space's view is its channels: cells, Figma's split field for
// RGB, a cell a channel, its letter dim before its number (as Figma's X and W), the opacity last in %. The copy button
// beside them lists the color in every notation it is copied in, each row the value it gives: the channels as text,
// each letter and number at the atlas's decimals, the opacity after a slash in % – C12 M24 Y36 K0, the print shops' way
// of writing a CMYK build (a letter ending in a digit spaced off its number: I1 0.32) – then CSS's (notation.js)
const SPACE = 'space'
function valueOf(format, p, v = S.vals) {   // v: the coordinates the channels' text writes (another color's, ⌥'s)
	if (format !== SPACE) return cssOf(format, p, p.opacity, S.profile)
	const c = cls()
	if (!v) return ['', '']
	return [v.map((x, i) => `${c.ch[i].sym}${/\d$/.test(c.ch[i].sym) ? ' ' : ''}${fmtc(x, c.ch[i])}`).join(' ') + (p.opacity < 1 ? ` / ${Math.round(p.opacity * 100)}%` : ''), '']
}
// a cell's number: a channel at the atlas's decimals less those its cell sheds to fit (x._shed, fitCells), the opacity
// in whole %
const cellText = (x, p, v, shed = x._shed || 0) => { const i = idx(x.dataset.i); return i === A ? String(Math.round(p.opacity * 100)) : v ? fmtc(v[i], cls().ch[i], decOf(cls().ch[i]) - shed) : '' }
// the cells' numbers – the current color's, or another's (⌥) – save in a cell being typed in
function showValue(p, v = S.vals) {
	for (const x of $('cells').querySelectorAll('input')) {
		const text = cellText(x, p, v)
		if (!(x.dataset.dirty && x === document.activeElement) && x.value !== text) x.value = text
	}
}
// The cells, a hairline apart; the group answers as one (a grey hairline under the pointer, the selection color round it
// while a cell has the focus). Rebuilt for another space, rewritten otherwise
function renderCells(p, lock) {
	const box = $('cells'), c = cls(), key = [S.space, !!p.virtual].join()
	if (box._key !== key) {
		box._key = key
		const cell = (i, ch) => {
			const l = el('label', i === A ? 'cell op' : 'cell'), x = el('input')
			Object.assign(x, { spellcheck: false, autocomplete: 'off', inputMode: 'decimal' })
			x.dataset.i = String(i)
			x.setAttribute('aria-label', l.dataset.tip = i === A ? t('pl.alpha', 'Opacity') : cname(ch))
			l.append(...(i === A ? [x, el('i', null, '%')] : [el('i', null, ch.sym), x]))
			return l
		}
		box.replaceChildren(...c.ch.map((ch, i) => cell(i, ch)), ...(p.virtual ? [] : [cell(A)]))
	}
	for (const x of box.querySelectorAll('input')) x.readOnly = lock
	showValue(p)
	fitCells()
}
// every number with its letter, where they fit; else the numbers alone – and a number that still doesn't fit sheds a
// decimal, up to two (C 0.088 at 240 px: 0.09), never cut – read again once the panel's width, the face (Inter, once it
// loads) or the numbers' lengths change, never mid-gesture (a read there would lay the panel out every frame)
function fitCells() {
	const box = $('cells'), xs = [...box.querySelectorAll('input')], p = current()
	if (S.live || measuring || !p) return   // ⌥'s numbers are another color's: read once they go
	const fit = [box._key, sizes().channels, document.fonts.status, ...xs.map(x => cellText(x, p, S.vals, 0).length)].join()
	if (box._fit === fit) return
	box.classList.remove('tight')
	if (!box.clientWidth) return   // not laid out yet (the panel still hidden): read once it shows
	box._fit = fit
	for (const x of xs) x._shed = 0
	showValue(p)
	const over = x => x.scrollWidth > x.clientWidth + 1
	if (!xs.some(over)) return
	box.classList.add('tight')
	for (const x of xs) {
		const i = idx(x.dataset.i), most = i === A ? 0 : Math.min(2, decOf(cls().ch[i]))
		while (over(x) && x._shed < most) { x._shed++; if (!(x.dataset.dirty && x === document.activeElement)) x.value = cellText(x, p, S.vals) }
	}
}
// the copy list: the channels' text, then the CSS notations, each as the value it gives (a wider color mapped into an
// sRGB-only one says so beside it, the value alone copied); under a named palette's lens, the name first. Rebuilt when
// its set of rows changes, rewritten otherwise; no row stays picked
function renderFormats(p, name) {
	const f = $('fmt'), rows = [...(name ? [NAME] : []), SPACE, ...FORMATS.map(x => x[0])]
	if (f._rows !== rows.join()) {
		f._rows = rows.join()
		f.replaceChildren(...rows.flatMap((r, k) => [new Option('', r), ...(r === NAME || (r === SPACE && k < rows.length - 1) ? [document.createElement('hr')] : [])]))
	}
	if (!S.live || f.matches(':open')) for (const o of f.options) {   // a drag rewrites them on release (unless the list is open)
		const [v, note] = o.value === NAME ? [name, ''] : valueOf(o.value, p), text = note ? t('pl.fmt.mapped', '{value}: mapped into sRGB', { value: v }) : v
		o.dataset.copy = v
		if (o.textContent !== text) o.textContent = text
	}
	if (f.selectedIndex !== -1) f.selectedIndex = -1
}
// a token of the value: a number (a sign, decimals, an exponent, a %) or a hex color, past the notation's name
const TOKEN = /#[0-9a-f]{3,8}\b|-?\d*\.?\d+(?:e-?\d+)?%?/gi
// a value's numbers past its notation's name, the channels' letters before them dropped (C12 M24 – I1 0.32 too)
const numsOf = text => {
	const syms = cls().ch.map(c => c.sym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length)
	const t = text.slice(text.indexOf('(') + 1).replace(new RegExp(`(?<![\\w.])(?:${syms.join('|')})(?=\\s*[-+.\\d])`, 'g'), ' ')
	return [...t.matchAll(TOKEN)].map(m => m[0])
}
// A whole value pasted into a cell, taken: in the space's own notation (its name, or none, then its numbers – the
// channels in order, the opacity after them, a % read as a fraction) the coordinates go through the picker as an edit
// would; any other text is read as CSS (a pasted #hex, rgb(), oklch(), a named color) and written mapped into the
// file's gamut
function commitValue(text) {
	const p = current()
	if (!p || locked(p)) return update()
	const head = (text.match(/^\s*([a-z][\w-]*)\s*\(/i) || [])[1]?.toLowerCase(), n = cls().ch.length
	if (S.vals && (!head ? !/^\s*#/.test(text) : head === S.space)) {
		const toks = numsOf(text), shown = numsOf(valueOf(SPACE, p)[0])
		// a channel's number as shown (or as held, unrounded) is that channel untouched: its coordinate kept whole
		const nums = toks.map((x, i) => i < n && (x === shown[i] || +x === S.vals[i]) ? S.vals[i] : i === n && x.endsWith('%') ? parseFloat(x) / 100 : parseFloat(x))   // a channel's % is its own unit (lch()'s L, hsl()'s S)
		if (nums.length >= n && nums.slice(0, n).every(Number.isFinite)) {
			const op = nums.length > n && Number.isFinite(nums[n]) && !p.virtual ? Math.round(clamp01(nums[n]) * 100) / 100 : p.opacity
			S.error = ''
			if (nums.slice(0, n).every((x, i) => x === S.vals[i])) {   // no channel moved: the opacity alone, the color as it is – or nothing at all
				if (op !== p.opacity) { p.opacity = op; write([p.r, p.g, p.b], true) }
				return update()
			}
			p.opacity = op
			return edit(nums.slice(0, n), true)
		}
	}
	const c = parseCss(text, NAMES)
	if (!c || !space[c.space]?.oklch) { S.error = t('pl.err.value', 'Not a color: {text}', { text: text.trim() }); return update() }
	if (!p.virtual) p.opacity = Math.round(c.alpha * 100) / 100
	S.error = ''
	write(gamutMap(space[c.space].oklch(...c.values), doc().dest).rgb, true)
	sync(true)
	update()
}

document.fonts.addEventListener('loadingdone', () => update())   // the cells' fit read again in the face that shows
// ↑↓'s step: a channel's power of ten under a hundredth of its range – L 0.01, C 0.001, a hue 1, a byte 1
const unitOf = ch => 10 ** Math.floor(Math.log10((ch.max - ch.min) / 100))
// The cells take a number each, as Figma's do: typed (Enter or leaving the cell takes it; Escape puts it back), stepped
// with ↑↓ (Shift: ten steps) and committed at once; the whole value pasted into any of them – its letters and numbers,
// CSS, a hex – is taken whole. Focused, a cell's number is selected; a number as shown is its coordinate kept whole
{
	const box = $('cells')
	function take(x) {
		delete x.dataset.dirty
		const p = current(), i = idx(x.dataset.i), text = x.value.trim(), toks = numsOf(text)
		if (!p || locked(p) || !S.vals || !text) return update()   // a cell emptied: its number back
		if (toks.length !== 1 || toks[0][0] === '#') return commitValue(text)
		const n = parseFloat(toks[0])
		S.error = ''
		if (i === A) return setAlpha(n / 100, true)
		if (toks[0] === cellText(x, p, S.vals)) return update()   // the number as shown, retyped: nothing to write
		set(i, n, true)
	}
	box.addEventListener('focusin', e => { if (e.target.matches('input')) e.target.select() })
	// a cell's letter, or the opacity's %, scrubs its number, as Figma's: a drag across moves it a step a pixel (the cell's
	// ↑↓ step; Shift held, ten – for the moves made while it is), live, one write at the release – held to its range as a
	// slider is, a hue around
	box.addEventListener('pointerdown', e => {
		const g = e.target.closest('.cell > i'), x = g?.parentElement.querySelector('input')
		if (!x || x.readOnly || !S.vals || e.button) return
		const i = idx(x.dataset.i), unit = i === A ? 1 : unitOf(cls().ch[i]), hue = i === hueIdx(cls())
		let px = e.clientX, steps = 0   // the pixels moved, each counted at the rate it was moved at
		const v0 = i === A ? current().opacity * 100 : S.vals[i], [lo, hi] = i === A ? [0, 100] : range(i)
		grabPaint(g, e, ev => {
			steps += (ev.clientX - px) * (ev.shiftKey ? 10 : 1)
			px = ev.clientX
			let v = v0 + Math.round(steps) * unit
			if (!hue && (v < lo || v > hi)) { v = v < lo ? lo : hi; steps = (v - v0) / unit }   // held at an end, a move back moves it at once
			if (i === A) return setAlpha(v / 100)
			const f = frac(i, v)
			setFrac(i, hue ? (f % 1 + 1) % 1 : clamp01(f))
		}, true, () => i === A ? [] : [i])
	})
	box.addEventListener('input', e => { e.target.dataset.dirty = '1' })
	box.addEventListener('change', e => { if (e.target.dataset.dirty) take(e.target) })
	box.addEventListener('keydown', e => {
		const x = e.target
		if (!x.matches('input')) return
		if (e.key === 'Enter') { e.preventDefault(); if (x.dataset.dirty) take(x); return x.select() }
		if (e.key === 'Escape') { delete x.dataset.dirty; update(); x.blur(); return }
		const d = { ArrowUp: 1, ArrowDown: -1 }[e.key]
		if (!d) return
		e.preventDefault()
		if (x.readOnly || !S.vals) return
		// from the number as shown, at its decimals, as the field's ↑↓ steps its tokens
		const i = idx(x.dataset.i), unit = i === A ? 1 : unitOf(cls().ch[i]) * 10 ** (x._shed || 0), shown = cellText(x, current(), S.vals)
		const n = +(parseFloat(shown) + d * (e.shiftKey ? 10 : 1) * unit).toFixed(Math.max((shown.split('.')[1] || '').length, Math.max(0, -Math.round(Math.log10(unit)))))
		delete x.dataset.dirty
		if (i === A) setAlpha(n / 100, true); else set(i, n, true)
		x.select()
	})
}

// the settings' gamut: the one the fields show, kept per profile
function renderShown() { for (const b of $('gamseg').children) b.setAttribute('aria-checked', String(b.dataset.g === shownG())) }
$('gamseg').addEventListener('click', e => {
	const b = e.target.closest('[data-g]')
	if (!b) return
	S.gamuts = { ...S.gamuts, [S.profile]: b.dataset.g }
	post({ type: 'store', key: 'gamuts', value: S.gamuts })
	renderShown()
	invalidate()
	update()
})
$('axes').addEventListener('click', e => {
	const b = e.target.closest('button')
	if (!b) return
	if (b.classList.contains('pmode')) {
		const q = pair()
		S.disc[`${S.space}:${q.a},${q.b}`] = !q.polar
		post({ type: 'store', key: 'disc', value: S.disc })
	} else {
		S.pairs[S.space] = swapAxis(b.classList.contains('labx') ? 'a' : 'b')[1]
		post({ type: 'store', key: 'pairs', value: S.pairs })
	}
	renderPicker()   // the channel held changes, and with it the slider
	update()
})
// a paint becomes the current one: from its row, or from its dot on the plane
function choose(key) {
	S.key = key
	const p = current()
	if (p && !p.virtual) post({ type: 'choose', id: p.id, kind: p.kind, index: p.index, stop: p.stop })   // a host may bring its own view to it (VS Code: the editor)
	S.error = ''
	for (const x of $('paints').querySelectorAll('.paint')) x.setAttribute('aria-pressed', String(x.dataset.keys.split(' ').includes(key)))
	sync(true)
	update()
}
$('paints').addEventListener('click', e => { const b = e.target.closest('.paint'); if (b && !folded) choose(b.dataset.key); folded = false })
// a layer pressed in a swatch's tip: the host goes to it (Figma: selects it and brings it into view; VS Code: its
// literal); its "+N more", to the rest of them
$('paints').addEventListener('tiprow', e => {
	const keys = e.target.dataset.keys.split(' '), i = e.detail.i, ps = (i < USES ? [keys[i]] : keys.slice(USES)).map(k => S.paints.find(q => keyOf(q) === k)).filter(Boolean)
	if (!ps.length) return
	choose(keyOf(ps[0]))   // that layer's color the current one, kept as the selection becomes that layer
	post({ type: 'goto', targets: ps.map(p => ({ id: p.id, kind: p.kind, index: p.index, stop: p.stop })) })
})
// a swatch dragged onto another: past a few pixels the drag lifts it, the swatch under the pointer is marked, the release folds
let lift = null, folded = false
$('paints').addEventListener('pointerdown', e => {
	const b = e.target.closest('.paint')
	if (!b || e.button || !S.editable) return
	const r = b.getBoundingClientRect()
	lift = { b, x: e.clientX, y: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, w: r.width, id: e.pointerId, on: false, to: null }   // where on it the pointer took it
	try { b.setPointerCapture(e.pointerId) } catch {}
})
$('paints').addEventListener('pointermove', e => {
	if (!lift || e.pointerId !== lift.id) return
	const ghost = $('ghost')
	if (!lift.on && Math.hypot(e.clientX - lift.x, e.clientY - lift.y) > 4) {
		lift.on = true
		lift.b.classList.add('lift')
		document.documentElement.classList.add('lifting')
		hideTip()
		const from = lift.b.querySelector('.sw').style, g = ghost.querySelector('.sw').style
		for (const k of ['--sw', '--swo']) g.setProperty(k, from.getPropertyValue(k))
		g.width = g.height = `${lift.w}px`
		ghost.hidden = false
	}
	if (!lift.on) return
	ghost.style.transform = `translate(${e.clientX - lift.dx}px, ${e.clientY - lift.dy}px)`   // the swatch itself under the pointer, held where it was taken
	const to = document.elementFromPoint(e.clientX, e.clientY)?.closest('.paint')
	if (lift.to && lift.to !== to) lift.to.classList.remove('drop')
	lift.to = to && to !== lift.b ? to : null
	if (lift.to) lift.to.classList.add('drop')
	ghost.classList.toggle('over', !!lift.to)   // over another swatch, the ghost says what the release does
})
const land = e => {
	if (!lift || e.pointerId !== lift.id) return
	const { b, on, to } = lift
	lift = null
	b.classList.remove('lift')
	document.documentElement.classList.remove('lifting')
	to?.classList.remove('drop')
	$('ghost').hidden = true
	$('ghost').classList.remove('over')
	if (!on) return
	folded = true   // the click that ends a drag isn't a choice
	if (to && e.type === 'pointerup') foldInto(b.dataset.key, to.dataset.key)
}
$('paints').addEventListener('pointerup', land)
$('paints').addEventListener('pointercancel', land)
// the about card's links open in the browser, through the main thread (the frame can't navigate); it opens only its own three
$('prm').addEventListener('click', e => { const a = e.target.closest('[data-open]'); if (!a) return; e.preventDefault(); post({ type: 'open', to: a.dataset.open }) })
$('prm').addEventListener('toggle', e => { if (e.newState === 'open') hideTip() })   // the settings open over the panel: no tip left behind them
// the hints' keys as the keyboard names them: a Mac's glyphs, else their names, Ctrl for ⌘ (the panel reads either:
// e.metaKey || e.ctrlKey) – a glyph before more, joined to it with +
if (!/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) {
	const K = { '⌘': 'Ctrl', '⌥': 'Alt', '⇧': 'Shift', '⌃': 'Ctrl' }
	for (const k of $('hints').querySelectorAll('kbd')) for (const n of k.childNodes) if (n.nodeType === 3) n.data = n.data.replace(/([⌘⌥⇧⌃])( ?)/g, (_, c, more) => K[c] + (more && '+'))
}
// the settings' snap, as Figma's own: a drag on the plane meets another color's dot (pick) – or, off, passes it; kept
$('snap').addEventListener('change', e => { S.snap = e.target.checked; post({ type: 'store', key: 'snap', value: S.snap }) })

window.addEventListener('message', e => {
	const m = e.data && e.data.pluginMessage
	if (!m || typeof m !== 'object') return
	if (m.type === 'init') {
		S.editable = !!m.editable
		if (QKEYS.includes(m.quant)) S.quant = m.quant
		if (m.gamuts && typeof m.gamuts === 'object') S.gamuts = m.gamuts
		if (m.scope === 'selection' || m.scope === 'page') $('scope').value = m.scope   // which colors the palette holds (the host reads them)
		if (m.pairs && typeof m.pairs === 'object') S.pairs = m.pairs
		if (m.disc && typeof m.disc === 'object') S.disc = m.disc
		if (typeof m.snap === 'boolean') S.snap = m.snap
		$('snap').checked = S.snap
		if (m.width > 0) post({ type: 'resize', width: m.width })   // the width this person dragged it to
		renderLenses()
		renderShown()
		const id = space[m.space] && meta[m.space] ? m.space : S.space
		useSpace(id)
		warmFeatured()
	}
	else if (m.type === 'selection') {
		const profile = m.profile !== S.profile
		S.profile = m.profile
		if (typeof m.editable === 'boolean') S.editable = m.editable   // a host whose documents differ (VS Code: a read-only one) says it per read
		S.paints = m.paints || []
		S.images = m.images || []
		// a re-read that trails a newer write (live writes outrun Figma's answers, and the last one may still be on its
		// way after release) shows the paint as written, not as it was a moment ago
		if ((m.ack || 0) < sent && S.mine) for (const p of S.paints) if (S.mine.keys.includes(keyOf(p))) Object.assign(p, { r: S.mine.r, g: S.mine.g, b: S.mine.b, opacity: S.mine.opacity })
		for (const { hash } of S.images) if (!S.img.has(hash) && !pending.has(hash)) { pending.add(hash); post({ type: 'image', hash }) }
		S.more = m.more || 0
		S.mixed = m.mixed || 0
		let force = profile
		// a host that knows where its person is (VS Code: the literal under the cursor) marks that paint current; when the
		// mark moves, the panel follows it, and in between keeps whatever was chosen in it
		const cur = S.paints.find(p => p.current), ck = cur ? keyOf(cur) : null
		if (ck !== S.cur) { S.cur = ck; if (ck && ck !== S.key) { S.key = ck; S.error = ''; force = true } }
		if (!S.paints.some(p => keyOf(p) === S.key)) {
			S.key = S.paints.length ? keyOf(S.paints[0]) : null
			S.error = ''   // an error belongs to the paint it came from, as on a paint click
			force = true
		}
		if (S.key === 'virtual' && S.paints.length) S.key = keyOf(S.paints[0])
		if (!S.paints.length) refreshVirtual()
		renderPaints()
		sync(force)
		if (profile) { renderPicker(); renderLenses(); renderShown() }   // the fields' canvases take the new color space; nothing else needs a repaint: their keys say what changed
		update()
	}
	else if (m.type === 'image') receiveImage(m)
	else if (m.type === 'error') { S.error = m.text; update() }
})

// the width: the grip on the panel's right edge, dragged; the height follows the content (the plane is square)
// the size: a gesture like any other (grab): a release outside the panel that the frame never sees ends it at the next move
const grip = $('grip')
grip.addEventListener('pointerdown', e => {
	const x0 = e.screenX, w0 = innerWidth
	let w = w0
	grip._w = 0
	grab(grip, e, ev => {
		w = Math.min(560, Math.max(240, Math.round(w0 + ev.screenX - x0)))   // the main thread's own bounds
		post({ type: 'resize', width: w })
	}, () => post({ type: 'store', key: 'width', value: w }))
})
grip.addEventListener('keydown', e => {
	const d = { ArrowRight: 16, ArrowLeft: -16 }[e.key]
	if (!d) return
	e.preventDefault()
	// from the width last asked for: presses faster than Figma resizes would otherwise step from a stale innerWidth
	const w = Math.min(560, Math.max(240, (grip._w || innerWidth) + d))
	grip._w = w
	post({ type: 'resize', width: w })
	post({ type: 'store', key: 'width', value: w })
})

// the window follows the content: Figma sizes the iframe, so the UI reports its height.
// While a gesture is live it only grows — a note that comes and goes mid-drag must not
// bounce the window — and settles on release.
let height = 0
// The measure is the content itself, the lowest of the body's laid-out children: the document or the body may be held at
// least as tall as the window (a host stylesheet's min-height or height), and then a shorter panel would never shrink
// the window back. Fixed and hidden elements (the grip, the tooltip) and popovers don't count
const flow = () => [...document.body.children].filter(e => e.offsetParent !== null && !e.matches('[popover]'))
function fit() {
	// each part's bottom and the body's padding under it – less what its own margin takes back (the palette runs into the
	// padding, to the window's edge, where it is cropped as Figma's own)
	const pad = parseFloat(getComputedStyle(document.body).paddingBottom) || 0, under = e => Math.max(0, pad + Math.min(0, parseFloat(getComputedStyle(e).marginBottom) || 0))
	const bottom = Math.max(spmenu.hidden ? 0 : spmenu.getBoundingClientRect().bottom + pad, ...flow().map(e => e.getBoundingClientRect().bottom + under(e)))
	const h = Math.ceil(bottom + scrollY)
	if (h === height || (S.live && h < height)) return
	height = h
	post({ type: 'resize', height: h })
}
{ const ro = new ResizeObserver(fit); for (const e of document.body.children) ro.observe(e) }   // each part, not the body: the body may be held tall
// a new width re-flows the palette's rows (the stored width comes after the first read, and the grip drags it): the current
// swatch brought back into sight
{ let w = 0; new ResizeObserver(([e]) => { const pl = $('paints'), on = pl.querySelector('[aria-pressed="true"]'); if (e.contentRect.width !== w && (w = e.contentRect.width) && on) reveal(pl, on, 'top') }).observe($('paints')) }
addEventListener('resize', () => grip.setAttribute('aria-valuenow', String(innerWidth)))

localize()
overSelects()
renderLenses()
renderShown()
showSpace()
renderPicker()
update()
post({ type: 'ready' })
