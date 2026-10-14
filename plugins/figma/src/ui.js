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
import { space, meta, classify, hueIdx, pairsOf, plane, ramp, decOf, fmtc } from '../../../web/js/core.js'
import { hasPlaneGL, planeGLStatus, paintPlaneGL, paintBarGL, setGLReady, warmPlaneGL, softGL } from '../../../web/js/gl.js'
import { quantRGB } from '../../../web/js/quant.js'
import GLYPHS from '../../../web/fonts/color-space-icons.json'
import NAMES from '../../../web/js/names.js'
import * as PALETTES from '../../../web/js/palettes.js'
import CATS from '../../../web/js/categories.js'
import { showTip, hideTip } from '../../../web/js/tip.js'
import { sampleImage, paletteOf } from '../../../web/js/extract.js'
import { gamutMap, deltaEOK, DEST, JND } from './gamut.js'
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

// the file's color profile: its badge (short), and what it means
const PROFILE = {
	DISPLAY_P3: ['P3', t('pl.profile.tip', 'The file\'s color profile: values are {name}', { name: 'Display P3' })],
	SRGB: ['sRGB', t('pl.profile.tip', 'The file\'s color profile: values are {name}', { name: 'sRGB' })],
	LEGACY: ['sRGB', t('pl.profile.legacy-tip', 'No color profile set (a file from before color management): read as sRGB')],
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
const CHEV = '<svg class="ic chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'

// vals: the coordinates in S.space, the UI's own while it edits and re-read from the paint otherwise.
// own: the colors this UI wrote recently; a re-read that returns one of them keeps vals.
// quant: 0 (smooth), a step count, or a palette lens ('565' | 'jnd' | 'web' | 'names' | 'tailwind' …)
// images: the selection's image paints [{hash, name}]; img: hash → {rgb samples, mean} once decoded; virtual: the
// image's color when no solid or gradient is selected, a paint that moves but writes nothing.
// mine: the current paint as this UI last wrote it, shown over any re-read that trails a newer write
// cur: the paint the host last marked current (p.current), so the panel follows that mark only when it moves
// mates: the keys of the paints the current one shares its swatch with, an edit writes them all
const S = { space: 'oklch', format: 'oklch', quant: 0, limit: 'file', pairs: {}, disc: {}, editable: true, profile: 'SRGB', paints: [], images: [], img: new Map(), virtual: null, more: 0, mixed: 0, key: null, cur: null, mates: [], vals: null, mine: null, own: [], lossy: false, error: '', live: false }
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
const nameOf = p => { const list = NAMED[S.quant]; if (!list) return ''; const k = srgb8(p).join(); return (list.find(([, rgb]) => rgb.join() === k) || [''])[0] }

/* ---------- the picker's geometry ---------- */

const cls = () => classify(S.space)
// the plane pairs: the atlas's orientation (angle across, tone up); a hue paired with a
// channel other than the tone is the space's own wheel – hue around, that channel out
// (wheel: the pair can be a disc; polar: it is drawn as one – the wheel/square switch, saved per space and pair, wheel by default)
function pairs() {
	const c = cls(), hi = hueIdx(c), ti = c.tone ? c.tone.i : -1
	return pairsOf(c).map(([a, b]) => {
		const wheel = c.ch.length === 3 && hi >= 0 && (a === hi || b === hi) && a !== ti && b !== ti
		const p = wheel ? { a: hi, b: a === hi ? b : a } : { a, b }
		return { ...p, wheel, polar: wheel && S.disc[`${S.space}:${p.a},${p.b}`] !== false }
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

// the lenses: the site's Quantize and Limit as native selects, its two groups (steps | palettes) kept
// the site's words (ui.gamut.*): its tips, and Surface and Light, which it writes in lower case
const LIMITS = [['file', t('pl.limit.file', 'File gamut'), t('pl.limit.file-tip', 'the file\'s own gamut')], ['srgb', 'sRGB', t('ui.gamut.tip.srgb', 'standard web gamut')], ['p3', 'P3', t('ui.gamut.tip.p3', 'wide Apple-display gamut')], ['rec2020', 'Rec.2020', t('ui.gamut.tip.rec2020', 'ultra-wide UHD gamut')], ['vis', cap(t('ui.gamut.vis', 'surface')), t('ui.gamut.tip.vis', 'colors a lit surface can show')], ['locus', cap(t('ui.gamut.locus', 'light')), t('ui.gamut.tip.locus', 'every color a light can have')]]
	.map(([v, name, tip]) => [v, name, tip, v === 'file' ? '' : glyph(`LI.${v}`)])
const gamutOf = () => S.limit === 'file' ? doc().gamut : S.limit
// an option: its icon and its name as spans – a customizable select (appearance: base-select) draws them, icon in the
// icon font; an older one reads the text, the icon's look-alike symbol then the name
const opt = ([v, name, tip, g]) => {
	const o = new Option('', String(v))   // no native tooltip: it would cover the list
	o.append(Object.assign(el('span', 'ico', g || ''), { ariaHidden: 'true' }), el('span', 'nm', g ? `  ${name}` : name))
	return o
}
function renderLenses() {
	const q = $('quant'), l = $('limit'), f = $('fmt')
	if (!f.options.length) f.append(...FORMATS.map(([v, name]) => new Option(name, v)))
	f.value = S.format
	if (!q.options.length) {
		q.append(group(cap(t('ui.quant.steps', 'steps')), QUANT[0].map(opt)), group(t('ui.quant.palettes', 'Palettes'), QUANT[1].map(opt)))
		l.append(...LIMITS.map(opt))
	}
	q.value = String(S.quant)
	l.value = S.limit
	const [, qn, qt, qg] = QUANT.flat().find(x => x[0] === S.quant), [, ln, lt] = LIMITS.find(x => x[0] === S.limit)
	$('quantface').textContent = qg
	$('limitface').textContent = glyph(`LI.${gamutOf()}`)   // the file's gamut wears that gamut's icon
	l.querySelector('option[value="file"] .ico').textContent = glyph(`LI.${doc().gamut}`)
	// the tips sit on the selects themselves: tip.js keeps an ancestor's tip off a select, and hides a select's own while it is open
	$('quant').dataset.tip = t('pl.quant.tip', 'Quantize: {name}, {tip}', { name: qn, tip: qt })
	$('limit').dataset.tip = t('pl.limit.tip', 'Limit: {name}, {tip}', { name: S.limit === 'file' ? t('pl.limit.file-is', '{name} ({gamut})', { name: ln, gamut: doc().name }) : ln, tip: lt })
}

// a field canvas in the file's color space, so a P3 file's plane shows P3 colors, not their sRGB clip
// (only for the GPU kernel: the CPU fallback writes sRGB bytes)
function canvas(cls) {
	const cv = el('canvas', cls)
	cv.getContext('2d', { colorSpace: doc().gamut === 'p3' && hasPlaneGL(S.space) ? 'display-p3' : 'srgb' })
	return cv
}

// the picker's DOM for the current space and file: the plane's canvas, the pair buttons and one row per channel
function renderPicker() {
	const p = pair(), c = cls()
	$('plane').hidden = !p
	$('plane').querySelector('canvas').replaceWith(canvas())
	// a row per channel: its bar (the field and a knob, role slider, that the pointer and the keys drive), then
	// its value cell, whose letter scrubs it
	$('channels').replaceChildren(...c.ch.flatMap((ch, i) => {
		const bar = el('div', 'bar2'), knob = el('i', 'nrg'), bg = canvas('bgc')
		bg.height = 1
		Object.assign(knob, { tabIndex: 0 })
		knob.setAttribute('role', 'slider')
		knob.setAttribute('aria-label', t('pl.ch.slider', '{name} slider', { name: cname(ch) }))
		knob.setAttribute('aria-valuemin', String(ch.min))
		knob.setAttribute('aria-valuemax', String(ch.max))
		bar.dataset.i = knob.dataset.i = i
		bar.append(bg, knob)
		const fld = el('label', 'cvp'), cv = el('input', 'cv'), l = el('i', 'cl', ch.sym)
		Object.assign(cv, { type: 'number', step: String(10 ** -decOf(ch)), inputMode: 'decimal', spellcheck: false, autocomplete: 'off' })
		cv.setAttribute('aria-label', cname(ch))
		cv.dataset.i = l.dataset.i = i
		l.dataset.tip = t('pl.ch.tip', '{name}, {min}–{max}. Drag to scrub.', { name: cap(cname(ch)), min: fmtc(ch.min, ch), max: fmtc(ch.max, ch) })
		fld.append(l, cv)
		return [bar, fld]
	}), ...opacityRow())
	invalidate()
}

// the opacity: Figma's checkered bar under the current color, its value in percent; a solid paint's opacity, a stop's alpha
const A = 'a'
const idx = d => d === A ? A : +d
function opacityRow() {
	const bar = el('div', 'bar2 alpha'), knob = el('i', 'nrg'), fld = el('label', 'cvp'), cv = el('input', 'cv'), l = el('i', 'cl', 'A')
	knob.tabIndex = 0
	for (const [k, v] of [['role', 'slider'], ['aria-label', t('pl.alpha.slider', 'Opacity slider')], ['aria-valuemin', '0'], ['aria-valuemax', '100']]) knob.setAttribute(k, v)
	bar.dataset.i = knob.dataset.i = cv.dataset.i = l.dataset.i = A
	bar.append(knob)
	Object.assign(cv, { type: 'number', step: '1', min: '0', max: '100', inputMode: 'numeric', autocomplete: 'off' })
	cv.setAttribute('aria-label', t('pl.alpha.field', 'Opacity, percent'))
	l.dataset.tip = t('pl.alpha.tip', 'Opacity, 0–100%. Drag to scrub.')
	fld.append(l, cv)
	return [bar, fld]
}

// The palette: the paints grouped by color, as Figma's own Selection colors – one swatch per color, the current paint's
// swatch pressed. One color: the same opacity and a difference under a fifth of the just-noticeable one (ΔEOK < JND/5,
// the rounding of a three-decimal oklch(), notation.js) – so a color written in another notation (#hex beside oklch()) is
// still the one it was written as – and the same source: a paint bound to a variable or a style is its own swatch beside
// a raw paint of the same color. An edit of a swatch writes every paint in it; its uses ride its tooltip and its label
// (and, hidden, its text)
const srcOf = p => p.src ? `${p.src.type}:${p.src.name}` : ''
function swatches() {
	const out = []
	for (const p of S.virtual && S.key === 'virtual' ? [S.virtual] : S.paints) {
		if (p.virtual) { out.push([p]); continue }
		const L = doc().dest.toOklab([p.r, p.g, p.b])
		const g = out.find(g => !g[0].virtual && srcOf(g[0]) === srcOf(p) && Math.abs(g[0].opacity - p.opacity) <= 0.004 && deltaEOK(g.L, L) < JND / 5)
		if (g) g.push(p); else out.push(Object.assign([p], { L }))
	}
	return out
}
// a swatch's colors: opaque (--swo) and with its opacity (--sw); a translucent one shows half each (ui.html .sw)
const paintSw = (e, p) => { e.style.setProperty('--swo', swatch(p)); e.style.setProperty('--sw', swatch(p).replace(/\)$/, ` / ${p.opacity})`)) }
const placeOf = p => p.virtual ? t('pl.row.image', 'image') : p.src ? p.src.name : where(p)
const useOf = p => `${p.name}, ${placeOf(p)}`
// the paints the current one shares its swatch with, itself among them: what an edit writes (read with the paint, kept
// through a gesture, when the colors it writes would otherwise part and join again)
const mates = () => { const p = current(); if (!p || p.virtual) return p ? [p] : []; const ms = S.mates.map(k => S.paints.find(q => keyOf(q) === k)).filter(Boolean); return ms.includes(p) ? ms : [p] }

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
		b.dataset.tip = g.length > 1 ? g.slice(0, 8).map(useOf).join('\n') + (g.length > 8 ? '\n…' : '')
			: `${p.name}\n${p.src ? t('pl.row.src', '{where}, from the {type} {name}', { where: where(p), type: srcType(p.src), name: p.src.name }) : placeOf(p)}`
		b.setAttribute('aria-label', g.map(useOf).join('; '))
		b.append(sw, el('span', 'pn sr', g.map(q => q.name).join(', ')), el('span', 'src sr', g.map(placeOf).join(', ')))
		const li = el('li')
		li.append(b)
		list.append(li)
		if (focused && g.some(q => keyOf(q) === focused)) b.focus()
	}
	list.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest' })   // a long palette (a stylesheet's colors) shows the current one
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

function update() {
	const p = current()
	$('empty').hidden = !!p
	// an image still on its way says so; one that couldn't be read falls back to the plain hint
	$('empty').textContent = S.images.some(i => !S.img.has(i.hash)) ? t('pl.empty.reading', 'Reading the image…') : t('pl.empty.hint', 'Select a layer with a solid fill, a gradient or an image.')
	for (const id of ['paints', 'picker', 'css']) $(id).hidden = !p
	if ($('drop')) $('drop').hidden = !p || !('EyeDropper' in window) || locked(p)
	const mixed = S.mixed ? t('pl.note.mixed', 'Text with mixed fills is skipped. Select text whose fill is the same throughout.') : ''
	if (!p) { renderGamut(null); $('err').textContent = S.error; return renderNotes(mixed ? [mixed] : []) }

	const v = S.vals, lock = locked(p), c = cls()
	// the picker's ink: the current color, outlined in the ink that reads on it
	const pk = $('picker').style
	pk.setProperty('--tkc', swatch(p))
	const pct = Math.round(p.opacity * 100)
	for (const e of $('channels').querySelectorAll(`[data-i="${A}"]`)) e.closest('.bar2, .cvp').hidden = !!p.virtual   // an image's color has no opacity to set
	for (const input of $('channels').querySelectorAll('.cv')) {
		input.readOnly = lock
		input.closest('.cvp').classList.toggle('locked', lock)
		if (input.dataset.dirty && input === document.activeElement) continue
		input.value = input.dataset.i === A ? String(pct) : v ? fmtc(v[input.dataset.i], c.ch[input.dataset.i]) : ''
	}
	for (const k of $('channels').querySelectorAll('.nrg')) {
		const i = idx(k.dataset.i)
		k.setAttribute('aria-disabled', String(lock))
		k.hidden = !v
		if (!v) continue
		if (i === A) { k.style.setProperty('--f', p.opacity); k.setAttribute('aria-valuenow', String(pct)); k.setAttribute('aria-valuetext', `${pct}%`); continue }
		k.style.setProperty('--f', clamp01(frac(i, v[i])))
		k.setAttribute('aria-valuenow', String(v[i]))
		k.setAttribute('aria-valuetext', `${c.ch[i].sym} ${fmtc(v[i], c.ch[i])}`)
	}
	placeMarker()

	const [value, note] = cssOf(S.format, p, p.opacity, S.profile), name = nameOf(p)
	$('css-1').value = value
	// the formats list the value itself in each, not the format's name: the pick is the text it gives
	for (const o of $('fmt').options) { const v = o.value === S.format ? value : cssOf(o.value, p, p.opacity, S.profile)[0]; if (o.textContent !== v) o.textContent = v }
	$('css-1').closest('.fld').dataset.tip = note ? t('pl.fmt.mapped', '{value}: mapped into sRGB', { value }) : ''   // a wider color in an sRGB-only format says it was mapped
	$('css-3').value = name
	$('named').hidden = !name

	// what the badge's tooltip explains beyond the gamut; an error stays in sight, beside it
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
	renderGamut(v, notes)
	draw()
}

// The status: the gamut, read from the coordinate itself, not the last write – steady through a drag, re-reads and lag –
// said on the badge (the file's gamut; outside it, so) and to screen readers (#gamut); the badge's tooltip the breakdown:
// the gamut, the profile, then the notes
function renderGamut(v, notes = []) {
	const { id, scale, name } = doc(), g = $('gamut'), b = $('badge'), [short, ptip] = PROFILE[S.profile] || [S.profile, '']
	let text = '', tip = '', out = false
	if (!v) text = ''
	else if (lens()) tip = text = t('pl.gamut.snapped', 'Snapped to {name}.', { name: QUANT.flat().find(q => q[0] === S.quant)[1] })
	else {
		const rgb = S.space === id ? v : space[S.space][id](...v)
		out = !rgb.every(x => Number.isFinite(x) && x >= -1e-4 * scale && x <= (1 + 1e-4) * scale)
		text = out ? t('pl.gamut.out', 'Outside {gamut}, mapped in.', { gamut: name }) : t('pl.gamut.in', 'In {gamut}.', { gamut: name })
		tip = out ? t('pl.gamut.out-tip', 'Outside {gamut}: written as its nearest {gamut} color (CSS Color 4 gamut mapping: chroma reduced at the same lightness and hue).', { gamut: name }) : text
	}
	if (g.textContent !== text) g.textContent = text
	b.hidden = !current()
	b.classList.toggle('out', out)
	b.textContent = out ? t('pl.badge.out', 'Outside {gamut}', { gamut: short }) : short
	b.dataset.tip = [tip, ptip, ...notes].filter(Boolean).join('\n')
}

// #notes is a live region for screen readers (the badge's tooltip shows the same notes), so it stays in place (empty
// when there is nothing to say) and is only rewritten when the text changes; otherwise every re-read would announce it
// again. The notes run on as one paragraph of sentences
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
	cx.hidden = !(x >= -1e-9 && x <= 1 + 1e-9 && y >= -1e-9 && y <= 1 + 1e-9)   // zoomed past it: no marker at the edge pretending
	cx.style.left = `${x * 100}%`
	cx.style.top = `${(1 - y) * 100}%`
	// the axis letters: a click swaps that axis for the channel held (named in the tip); the wheel/square switch where a wheel exists
	const ax = $('axes'), ps = pairs(), [lx, ly, pm] = ['.labx', '.laby', '.pmode'].map(k => ax.querySelector(k))
	const HOW = { across: t('pl.axis.across', '{name} across'), up: t('pl.axis.up', '{name} up'), around: t('pl.axis.around', '{name} around'), out: t('pl.axis.out', '{name} out') }
	for (const [b, axis, i, how] of [[lx, 'a', q.a, q.polar ? 'around' : 'across'], [ly, 'b', q.b, q.polar ? 'out' : 'up']]) {
		const [to] = swapAxis(axis), other = axis === 'a' ? to.a === q.b ? to.b : to.a : to.b === q.a ? to.a : to.b
		b.textContent = c.ch[i].sym
		const said = cap(HOW[how].replace('{name}', cname(c.ch[i])))
		b.dataset.tip = ps.length > 1 ? t('pl.axis.swap', '{axis}. Click for {other}', { axis: said, other: cname(c.ch[other]) }) : said
		b.setAttribute('aria-label', b.dataset.tip)
		b.disabled = ps.length < 2
	}
	pm.hidden = !q.wheel
	pm.setAttribute('aria-pressed', String(!!q.polar))
	pm.dataset.tip = q.polar ? t('pl.mode.square', 'Show as a square') : t('pl.mode.wheel', 'Show as a wheel')
	pm.setAttribute('aria-label', pm.dataset.tip)
	const ab = { a: cname(c.ch[q.a]), b: cname(c.ch[q.b]) }
	pl.setAttribute('aria-label', q.polar ? t('pl.plane.wheel', '{a} and {b} wheel', ab) : t('pl.plane.plane', '{a} and {b} plane', ab))
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
function labInk(cv, label, pts) {
	const bk = backdrop($('plane'))
	let L = 0, k = 0
	try {
		const ctx = cv.getContext('2d')
		for (const [fx, fy] of pts) {
			const d = ctx.getImageData(Math.round(fx * (cv.width - 1)), Math.round(fy * (cv.height - 1)), 1, 1).data, a = d[3] / 255
			const [r, g, b] = [0, 1, 2].map(c => d[c] * a + bk[c] * (1 - a))
			L += 0.2126 * r + 0.7152 * g + 0.0722 * b; k++
		}
	} catch {}
	label.style.color = !k ? 'var(--ink)' : L / k / 255 < 0.6 ? '#fff' : '#000'
}

let raf = 0
const draw = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; paint() }) }
// a program landing (the kernel links asynchronously) or a new space repaints everything
const invalidate = () => { for (const cv of document.querySelectorAll('canvas')) cv._key = ''; draw() }
setGLReady(invalidate)

function paint() {
	const v = S.vals, s = S.space, q = pair(), gm = gamutOf(), n = S.quant
	if (!v || !current()) return
	const st = hasPlaneGL(s) ? planeGLStatus(s) : 'no'
	if (q) {
		const pl = $('plane'), cv = pl.querySelector('canvas')
		const full = Math.min(1024, Math.round((cv.clientWidth || 256) * (devicePixelRatio || 1)))   // a widened panel keeps its pixels: the field and the image's dots stay sharp
		// the field depends on the held channels, never on the swept two: a drag across the plane never repaints it.
		// A held channel dragged on a bar repaints at half resolution (the dossier's live law); release settles full.
		// the GPU paints full resolution even mid-gesture; only the CPU fallback drops to half while a held channel moves
		const top = st === 'no' ? Math.min(full, 160) : full, w = S.live && st === 'no' ? top >> 1 : top
		const polar = q.polar && st !== 'no'
		pl._polar = polar
		const [rx, ry] = shown(q), key = [s, q.a, q.b, v.map((x, k) => k === q.a || k === q.b ? '' : x), n, gm, st, polar, rx, ry].join()
		if (cv._key !== key || (cv.width !== top && !S.live)) {
			if (cv.width !== w || cv.height !== w) { cv.width = w; cv.height = w }
			pl.classList.toggle('polar', polar)
			cv._paints = (cv._paints || 0) + 1   // repaints, counted: a drag across the plane must not repaint it (checks read this)
			if (st === 'ready') paintPlaneGL(cv, s, v, q.a, q.b, rx, ry, gm, n, polar, 0, 'oklab', false)
			else if (st === 'no') plane(cv.getContext('2d'), w, s, v, q.a, q.b, rx, ry, true, gm, lens() ? rgb => quantRGB(rgb, n) : n || null)
			else cv.getContext('2d').clearRect(0, 0, w, w)   // linking: blank until the program lands, never a low-res preview that then sharpens
			cv._key = st === 'pending' ? '' : key
			labInk(cv, $('axes').querySelector('.laby'), [[0.03, 0.06], [0.08, 0.06], [0.13, 0.06]])
			labInk(cv, $('axes').querySelector('.labx'), [[0.96, 0.96], [0.84, 0.96], [0.72, 0.96]])
			labInk(cv, $('axes').querySelector('.pmode'), [[0.04, 0.96], [0.09, 0.96], [0.04, 0.91]])   // the switch inks like the letters
			pl._dark = fieldDark(cv)
			placeMarker()
		}
		// the dots depend on the pair and the samples, never on the held channel
		// the image's dots: their own layer at full resolution, never touched by a gesture's repaints
		const dc = pl.querySelector('.density'), ck = cloudReady(), dkey = [ck && ck.key, q.a, q.b, polar, full, pl._dark, rx, ry].join()
		if (dc._key !== dkey) { dc._key = dkey; paintDensity(dc, ck, q, full, polar, pl._dark, polar ? [range(q.a), range(q.b)] : [rx, ry]) }
	}
	// a bar keeps its knob inside the pill, as Figma's do, so the channel's range spans the knob's travel: the field is
	// painted into that inset span and its end columns stretch over the caps, so the knob always sits on its own color
	// an image's pixels along each bar: a histogram of the channel, a lane over the bar's field
	const ck = cloudReady(), hk = [ck && ck.key, $('channels').clientWidth].join()
	if ($('channels')._hk !== hk) { $('channels')._hk = hk; histograms(ck) }
	for (const bar of $('channels').querySelectorAll('.bar2:not(.alpha)')) {   // the opacity bar is CSS: the color over the checker
		const i = +bar.dataset.i, cv = bar.querySelector('canvas'), kn = bar.querySelector('.nrg')
		const css = cv.clientWidth || 200, w = Math.min(512, Math.round(css * (devicePixelRatio || 1)))
		const cap = Math.round((kn.offsetWidth || 18) / 2 / css * w), span = Math.max(1, w - 2 * cap)
		const key = [s, i, v.map((x, k) => k === i ? '' : x), n, gm, st, w].join()
		if (cv._key === key) continue
		cv._key = st === 'pending' ? '' : key
		if (cv.width !== w) cv.width = w
		const src = bar._src ??= canvas()
		src.height = 1
		if (src.width !== span) src.width = span
		if (st === 'ready' && paintBarGL(src, s, v, i, range(i), gm, n, 'oklab', false)) {
			const ctx = cv.getContext('2d')
			ctx.clearRect(0, 0, w, 1)
			ctx.drawImage(src, cap, 0)
			ctx.drawImage(src, 0, 0, 1, 1, 0, 0, cap, 1)
			ctx.drawImage(src, span - 1, 0, 1, 1, cap + span, 0, cap, 1)
			cv.hidden = false; bar.style.background = ''; continue
		}
		cv.hidden = true
		bar.style.background = st === 'pending' ? '' : `linear-gradient(90deg, ${ramp(s, v, i, ...range(i), 48, gm).join(',')}) center / calc(100% - var(--knob)) 100% no-repeat, var(--checker)`
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
	S.own.push(rgb)
	if (S.own.length > 64) S.own.shift()
	for (const q of ms) Object.assign(q, { r: rgb[0], g: rgb[1], b: rgb[2], opacity: p.opacity })   // shown now; the re-read confirms it
	if (!p.virtual) {
		S.mine = { keys: ms.map(keyOf), r: rgb[0], g: rgb[1], b: rgb[2], opacity: p.opacity }
		send({ type: 'set', ...target(p), targets: ms.map(target), profile: S.profile, color: { r: rgb[0], g: rgb[1], b: rgb[2] }, opacity: p.opacity, commit: !!commit })
	}
	renderPaints()
	update()
}

// A swatch dropped onto another folds into it: its paints take that swatch's color and opacity, in one undo step, and so
// become one swatch with it, the current one. Paints that only look alike (an off-by-one #3b82f6) join this way
function foldInto(fromKey, toKey) {
	const all = swatches(), from = all.find(g => g.some(q => keyOf(q) === fromKey)), to = all.find(g => g.some(q => keyOf(q) === toKey))
	if (!from || !to || from === to || !S.editable || from[0].virtual || to[0].virtual) return
	const c = to[0]
	for (const q of from) Object.assign(q, { r: c.r, g: c.g, b: c.b, opacity: c.opacity })
	S.mine = { keys: from.map(keyOf), r: c.r, g: c.g, b: c.b, opacity: c.opacity }
	send({ type: 'set', ...target(from[0]), targets: from.map(target), profile: S.profile, color: { r: c.r, g: c.g, b: c.b }, opacity: c.opacity, commit: true })
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
const setFrac = (i, f, commit) => i === A ? setAlpha(f, commit) : set(i, at(i, snap(f)), commit)
// the live gesture: the plane repaints at half resolution and the window only grows until release
const live = on => { S.live = on; if (!on) { draw(); fit() } }

/*
 * One gesture at a time: a plane drag, a bar drag, a letter scrub. It holds the pointer past its
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
	el.classList.add('live')
	if (!still) move(e)
}
function drop() {
	if (!G) return
	const { el, id, end, moved } = G
	G = null
	try { if (el.hasPointerCapture(id)) el.releasePointerCapture(id) } catch {}
	document.documentElement.classList.remove('drag')
	el.classList.remove('live')
	end(moved)
}
// a gesture on the current paint: live writes while it runs, then one commit – none when it never moved
function grabPaint(el, e, move, still) {
	if (G || e.button || locked(current())) return
	live(true)
	grab(el, e, move, moved => { if (moved && S.vals && !locked(current())) edit(S.vals.slice(), true); live(false) }, still)
}
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
function pick(e) {
	const pl = $('plane'), q = pair(), r = pl.getBoundingClientRect()
	if (!q || !S.vals) return
	const [fx, fy] = finer(e, [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height])
	let fa = offScreen(fx, 'x'), fb = offScreen(fy, 'y')
	if (pl._polar) {
		const dx = fx * 2 - 1, dy = fy * 2 - 1
		fa = ((-Math.atan2(dy, dx) / (2 * Math.PI)) % 1 + 1) % 1
		fb = Math.min(1, Math.hypot(dx, dy))
	}
	const next = S.vals.slice()
	next[q.a] = at(q.a, snap(fa))
	next[q.b] = at(q.b, snap(fb))
	edit(next)
}
const plane$ = $('plane')
plane$.addEventListener('pointerdown', e => { fine = null; grabPaint(plane$, e, pick) })
// the view: a pinch (⌃ wheel) zooms about the pointer, the wheel pans once zoomed, a double click shows the whole again
plane$.addEventListener('wheel', e => {
	if (plane$._polar) { if (e.ctrlKey) e.preventDefault(); return }   // no window on a wheel – and a pinch must not zoom the page
	const w = win(), zoomed = w.x1 - w.x0 < 0.999 || w.y1 - w.y0 < 0.999
	if (!e.ctrlKey && !zoomed) return
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
	edit(next, true)
})

// the bars: the pointer's place along the knob's travel is the value; stepped, it lands on a cell centre
$('channels').addEventListener('pointerdown', e => {
	const bar = e.target.closest('.bar2')
	if (!bar) return
	const i = idx(bar.dataset.i), kn = bar.querySelector('.nrg')
	fine = null
	grabPaint(bar, e, ev => {
		const r = bar.getBoundingClientRect(), k = kn.offsetWidth
		setFrac(i, clamp01(finer(ev, [(ev.clientX - r.left - k / 2) / Math.max(1, r.width - k)])[0]))   // ⌘ held: a tenth as far
	})
	kn.focus({ preventScroll: true })
})
$('channels').addEventListener('keydown', e => {
	const t = e.target
	if (!t.classList.contains('nrg') || !S.vals || locked(current())) return
	const i = idx(t.dataset.i)
	const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 }[e.key]
	const to = e.key === 'Home' ? 0 : e.key === 'End' ? 1 : d == null ? null : fracAt(i) + d * (i === A ? 0.01 : cell())
	if (to == null) return
	e.preventDefault()
	setFrac(i, clamp01(to), true)
})

// the values: type and commit; drag a cell's letter sideways to scrub, as on Figma's own fields — the span
// across 300 px (Shift: 10× finer); a hue wraps, every other channel stops at its range
const vals$ = $('channels')
vals$.addEventListener('input', e => { if (e.target.classList.contains('cv')) e.target.dataset.dirty = '1' })
vals$.addEventListener('change', e => {
	const t = e.target
	if (!t.classList.contains('cv')) return
	delete t.dataset.dirty
	if (t.readOnly) return
	const v = t.valueAsNumber
	if (!Number.isFinite(v)) return update()
	if (t.dataset.i === A) setAlpha(v / 100, true)
	else set(+t.dataset.i, v, true)
})
vals$.addEventListener('pointerdown', e => {
	const l = e.target.closest('.cl')
	if (!l || !S.vals) return
	const i = idx(l.dataset.i)
	let f = i === A ? current().opacity : frac(i, S.vals[i]), x = e.clientX
	grabPaint(l, e, ev => {
		f += (ev.clientX - x) / 300 * (ev.shiftKey ? 0.1 : 1)   // the step since the last event (movementX is unreliable across frames)
		x = ev.clientX
		f = hueIdx(cls()) === i ? ((f % 1) + 1) % 1 : clamp01(f)   // past an end the scrub holds there, and turns back at once
		setFrac(i, f)
	}, true)   // a press alone changes nothing
})

/* ---------- the eyedropper: any pixel on screen, in Chromium's EyeDropper ---------- */

$('drop').addEventListener('click', async () => {
	let hexc
	try { hexc = (await new window.EyeDropper().open()).sRGBHex }
	catch (err) {
		if (err && err.name === 'AbortError') return   // Escape
		$('drop').remove()   // not allowed in this frame: the button goes for good
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
const hex6 = c => '#' + [c.r, c.g, c.b].map(u => Math.round(u * 255).toString(16).padStart(2, '0')).join('')
function placeMarks() {
	const box = $('marks'), q = pair(), cur = current(), v = S.vals
	const key = [S.space, q && q.a, q && q.b, $('plane')._polar, JSON.stringify(win()), S.profile, S.key, S.paints.map(p => keyOf(p) + p.r + p.g + p.b).join()].join('|')
	if (box._key === key) return
	box._key = key
	box.replaceChildren()
	if (!q) return
	// a dot: a color of the selection, taken up by a press – it becomes the current paint, and the press drags it on.
	// Only the selection's own: nothing it doesn't hold is marked (a file's variables once were, unasked-for dots beside
	// a single button's fill)
	const dot = (c, tip, take) => {
		const p = at2(c); if (!p) return
		const b = el('button', 'dm')
		b.type = 'button'
		b.style.left = `${p[0] * 100}%`
		b.style.top = `${p[1] * 100}%`
		b.style.background = swatch(c)
		b.dataset.tip = `${tip}\n${hex6(c)}`
		b.dataset.key = take
		b.setAttribute('aria-label', t('pl.dot.edit', 'Edit {what}', { what: tip }))
		b.onpointerdown = e => { if (e.button) return; choose(take); fine = null; grabPaint(plane$, e, pick, true) }
		b.onclick = () => choose(take)   // the keyboard's press
		box.append(b)
	}
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
	if (lines.length) {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
		svg.setAttribute('class', 'links')
		svg.setAttribute('viewBox', '0 0 100 100')
		svg.setAttribute('preserveAspectRatio', 'none')
		svg.innerHTML = lines.map(l => `<polyline points="${l}"/>`).join('')
		box.append(svg)
	}
	// a dot per swatch – a color used in many places is one dot, naming them all
	const named = p => t('pl.dot.paint', '{layer}, {where}', { layer: p.name, where: where(p) }) + (p.src ? t('pl.dot.src', ', {type} {name}', { type: srcType(p.src), name: p.src.name }) : '')
	for (const g of swatches()) if (!g[0].virtual && !g.some(q => keyOf(q) === S.key)) dot(g[0], g.slice(0, 8).map(named).join('\n'), keyOf(g[0]))
}

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
function paintDensity(cv, c, q, w, polar, dark, [[a0, a1], [b0, b1]]) {
	const ctx = cv.getContext('2d')
	if (cv.width !== w || cv.height !== w) { cv.width = w; cv.height = w }
	ctx.clearRect(0, 0, w, w)
	if (!c) return
	const r = Math.max(2, w / 190)
	ctx.fillStyle = dark ? '#fff' : '#16161a'
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
// the field's mean luminance decides the dots' ink
function fieldDark(cv) {
	try {
		const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data
		let L = 0, n = 0
		for (let i = 0; i < d.length; i += 64) if (d[i + 3] > 128) { L += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; n++ }
		return !n || L / n < 128
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

// the tooltip stays secondary: any press dismisses it, and focus brings it only from the keyboard — a clicked button
// takes focus, and tip.js would show its tip again. A quiet explainer (the status line, the profile) shows it on a click too
addEventListener('pointerdown', hideTip, true)
addEventListener('click', e => { const el = e.target.closest?.('[data-tip]'); if (el && !el.closest('button, input, select, label, a, [tabindex]')) showTip(el) })
addEventListener('focusin', e => { if (!e.target.matches?.(':focus-visible')) e.stopPropagation() }, true)

/* ---------- copy ---------- */

// a field's text to the clipboard, its button saying how it went
async function copy(field, button) {
	let ok = false
	try { await navigator.clipboard.writeText(field.value); ok = true }
	catch {
		// fallback when the iframe has no async clipboard (unverified in Figma; see README)
		field.select()
		try { ok = document.execCommand('copy') } catch { ok = false }
	}
	button.setAttribute('aria-label', ok ? t('pl.copy.done', 'Copied') : t('pl.copy.selected', 'Selected'))   // Selected: press ⌘C / Ctrl+C
	setTimeout(() => button.setAttribute('aria-label', t('pl.copy', 'Copy')), 1200)
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
 * that follows is swallowed too: preventing a press doesn't cancel it) – unless it opens another control, a lens or the
 * format select: one menu at a time. The window grows to hold it (fit)
 */
const OK = '<svg class="ic ok" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
let swallow = false
addEventListener('pointerdown', e => {
	if (spmenu.hidden || e.target.closest('#spmenu, #spbtn')) return
	if (e.target.closest('.lens, .fmt, #aboutb')) return closeSpaces()
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
		b.append(el('span', 'nm', titleOf(id)), el('span', 'id', id))
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
	$('splist').querySelector('.spo.on')?.scrollIntoView({ block: 'center' })
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
	next.scrollIntoView({ block: 'nearest' })
	warmPlaneGL(next.dataset.id, true)
})
// focus leaving the field and its menu closes the menu
for (const x of [$('spbtn'), spmenu]) x.addEventListener('focusout', e => { if (!e.relatedTarget?.closest?.('#spbtn, #spmenu')) closeSpaces() })
$('spgroup').addEventListener('change', e => { spGroup = e.target.value; renderSpaceMenu(); spq.focus() })
// a row pressed keeps the field's focus (a blur would close the menu before the click lands)
$('splist').addEventListener('pointerdown', e => { if (e.target.closest('.spo')) e.preventDefault() })
// a space pointed at in the menu starts compiling ahead of the rest: by the click it is often ready
$('splist').addEventListener('pointerover', e => { const b = e.target.closest('.spo'); if (b) warmPlaneGL(b.dataset.id, true) })
$('splist').addEventListener('click', e => { const b = e.target.closest('.spo'); if (b) takeSpace(b.dataset.id) })

$('fmt').addEventListener('change', e => {
	S.format = e.target.value
	post({ type: 'store', key: 'format', value: S.format })
	update()
})
$('quant').addEventListener('change', e => {
	S.quant = QKEYS.find(k => String(k) === e.target.value)
	post({ type: 'store', key: 'quant', value: S.quant })
	renderLenses()
	update()
})
$('limit').addEventListener('change', e => {
	S.limit = e.target.value
	post({ type: 'store', key: 'limit', value: S.limit })
	renderLenses()
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
	invalidate()
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
// a swatch dragged onto another: past a few pixels the drag lifts it, the swatch under the pointer is marked, the release folds
let lift = null, folded = false
$('paints').addEventListener('pointerdown', e => {
	const b = e.target.closest('.paint')
	if (!b || e.button || !S.editable) return
	lift = { b, x: e.clientX, y: e.clientY, id: e.pointerId, on: false, to: null }
	try { b.setPointerCapture(e.pointerId) } catch {}
})
$('paints').addEventListener('pointermove', e => {
	if (!lift || e.pointerId !== lift.id) return
	const ghost = $('ghost')
	if (!lift.on && Math.hypot(e.clientX - lift.x, e.clientY - lift.y) > 4) {
		lift.on = true
		lift.b.classList.add('lift')
		hideTip()
		const from = lift.b.querySelector('.sw').style, g = ghost.querySelector('.sw').style
		for (const k of ['--sw', '--swo']) g.setProperty(k, from.getPropertyValue(k))
		ghost.hidden = false
	}
	if (!lift.on) return
	ghost.style.transform = `translate(${e.clientX + 6}px, ${e.clientY + 6}px)`   // the swatch's ghost under the pointer
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
	to?.classList.remove('drop')
	$('ghost').hidden = true
	$('ghost').classList.remove('over')
	if (!on) return
	folded = true   // the click that ends a drag isn't a choice
	if (to && e.type === 'pointerup') foldInto(b.dataset.key, to.dataset.key)
}
$('paints').addEventListener('pointerup', land)
$('paints').addEventListener('pointercancel', land)
$('css').addEventListener('click', e => { const b = e.target.closest('[data-copy]'); if (b) copy($(b.dataset.copy), b) })
// the about card's links open in the browser, through the main thread (the frame can't navigate); it opens only its own three
$('about').addEventListener('click', e => { const a = e.target.closest('[data-open]'); if (!a) return; e.preventDefault(); post({ type: 'open', to: a.dataset.open }) })

window.addEventListener('message', e => {
	const m = e.data && e.data.pluginMessage
	if (!m || typeof m !== 'object') return
	if (m.type === 'init') {
		S.editable = !!m.editable
		if (QKEYS.includes(m.quant)) S.quant = m.quant
		if (LIMITS.some(l => l[0] === m.limit)) S.limit = m.limit
		if (FORMATS.some(f => f[0] === m.format)) S.format = m.format
		if (m.pairs && typeof m.pairs === 'object') S.pairs = m.pairs
		if (m.disc && typeof m.disc === 'object') S.disc = m.disc
		if (m.width > 0) post({ type: 'resize', width: m.width })   // the width this person dragged it to
		renderLenses()
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
		if (profile) { renderPicker(); renderLenses() }   // the fields' canvases take the new color space; nothing else needs a repaint: their keys say what changed
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
	const pad = parseFloat(getComputedStyle(document.body).paddingBottom) || 0
	const bottom = Math.max(spmenu.hidden ? 0 : spmenu.getBoundingClientRect().bottom, ...flow().map(e => e.getBoundingClientRect().bottom))
	const h = Math.ceil(bottom + scrollY + pad)
	if (h === height || (S.live && h < height)) return
	height = h
	post({ type: 'resize', height: h })
}
{ const ro = new ResizeObserver(fit); for (const e of document.body.children) ro.observe(e) }   // each part, not the body: the body may be held tall
addEventListener('resize', () => grip.setAttribute('aria-valuenow', String(innerWidth)))

localize()
renderLenses()
showSpace()
renderPicker()
update()
post({ type: 'ready' })
