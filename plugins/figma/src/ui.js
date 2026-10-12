/**
 * color-space Figma plugin: UI iframe. It does the color math, the picker and the clipboard.
 * build.js bundles this file as one IIFE into ui.html, because Figma injects the
 * manifest's `ui` file as a string (__html__), so nothing can be fetched.
 *
 * The main thread (code.js) sends {type:'init'|'selection'|'error'}; the UI sends
 * {type:'ready'|'store'|'set'|'resize'} back through parent.postMessage({pluginMessage}, '*').
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
import { hasPlaneGL, planeGLStatus, paintPlaneGL, paintBarGL, setGLReady, warmGL } from '../../../web/js/gl.js'
import { quantRGB } from '../../../web/js/quant.js'
import { QI } from '../../../web/js/icons.js'
import NAMES from '../../../web/js/names.js'
import * as PALETTES from '../../../web/js/palettes.js'
import CATS from '../../../web/js/categories.js'
import '../../../web/js/tip.js'
import { sampleImage, paletteOf } from '../../../web/js/extract.js'
import { gamutMap, deltaEOK, DEST, JND } from './gamut.js'

const PROFILE = {
	DISPLAY_P3: ['Display P3', 'The file\'s color profile: values are Display P3'],
	SRGB: ['sRGB', 'The file\'s color profile: values are sRGB'],
	LEGACY: ['sRGB, legacy', 'No color profile set (a file from before color management): read as sRGB'],
}
// the site's quantize lenses (web/index.html QGROUPS, QTIP), in its two columns: smooth and stepped | palettes
const QUANT = [
	[[0, 'smooth', 'continuous, unquantized'], [10, '10-step', '10 native-channel cell centers'], [20, '20-step', '20 native-channel cell centers'], ['565', '16-bit', '16-bit RGB565 depth'], ['jnd', 'JND', 'just-noticeable OKLab steps']],
	[['web', 'web-safe', '216 web-safe colors'], ['names', 'CSS names', 'CSS named colors'], ['xkcd', 'xkcd', 'xkcd survey names'], ['tailwind', 'Tailwind', 'Tailwind tokens'], ['pico8', 'PICO-8', 'PICO-8 palette'], ['ansi', 'ANSI', 'terminal 256 palette']],
]
const QKEYS = QUANT.flat().map(q => q[0])
const NAMED = { names: Object.entries(NAMES), xkcd: PALETTES.xkcd, tailwind: PALETTES.tailwind, pico8: PALETTES.pico8, ansi: PALETTES.ansi }
const CHEV = '<svg class="ic chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'

// vals: the coordinates in S.space, the UI's own while it edits and re-read from the paint otherwise.
// own: the colors this UI wrote recently; a re-read that returns one of them keeps vals.
// quant: 0 (smooth), a step count, or a palette lens ('565' | 'jnd' | 'web' | 'names' | 'tailwind' …)
// images: the selection's image paints [{hash, name}]; img: hash → {rgb samples, pal} once decoded; virtual: the
// image's color when no solid or gradient is selected, a paint that moves but writes nothing
const S = { space: 'oklch', quant: 0, pairs: {}, doc: [], editable: true, profile: 'SRGB', paints: [], images: [], img: new Map(), virtual: null, more: 0, mixed: 0, key: null, vals: null, own: [], lossy: false, error: '', live: false }
const $ = id => document.getElementById(id)
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e }
const post = msg => parent.postMessage({ pluginMessage: msg }, '*')
const keyOf = p => p.virtual ? 'virtual' : `${p.id}:${p.kind}:${p.index}:${p.stop}`
const current = () => S.key === 'virtual' ? S.virtual : S.paints.find(p => keyOf(p) === S.key)
const where = p => `${p.kind === 'fills' ? 'fill' : 'stroke'} ${p.index + 1}${p.stop >= 0 ? `, stop ${p.stop + 1}` : ''}${p.visible ? '' : ', hidden'}`
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

const num = (v, dp) => String(+v.toFixed(dp))
const alpha = p => p.opacity < 1 ? ` / ${num(p.opacity, 3)}` : ''
const hex = v => Math.round(v * 255).toString(16).padStart(2, '0')

function cssFor(p) {
	const [L, C, H] = space[doc().id].oklch(...base(p))
	const out = [`oklch(${num(L, 4)} ${num(C, 4)} ${num(H, 2)}${alpha(p)})`]
	if (S.profile === 'DISPLAY_P3') out.push(`color(display-p3 ${num(p.r, 4)} ${num(p.g, 4)} ${num(p.b, 4)}${alpha(p)})`)
	else out.push(`#${hex(p.r)}${hex(p.g)}${hex(p.b)}${p.opacity < 1 ? hex(p.opacity) : ''}`)
	return out
}
const swatch = p => `color(${S.profile === 'DISPLAY_P3' ? 'display-p3' : 'srgb'} ${p.r} ${p.g} ${p.b})`
// the palette entry the paint is, under a named-palette lens
const nameOf = p => { const list = NAMED[S.quant]; if (!list) return ''; const k = srgb8(p).join(); return (list.find(([, rgb]) => rgb.join() === k) || [''])[0] }

/* ---------- the picker's geometry ---------- */

const cls = () => classify(S.space)
// the plane pairs: the atlas's orientation (angle across, tone up); a hue paired with a
// channel other than the tone is the space's own wheel – hue around, that channel out
function pairs() {
	const c = cls(), hi = hueIdx(c), ti = c.tone ? c.tone.i : -1
	return pairsOf(c).map(([a, b]) => c.ch.length === 3 && hi >= 0 && (a === hi || b === hi) && a !== ti && b !== ti
		? { a: hi, b: a === hi ? b : a, polar: true } : { a, b, polar: false })
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
	const seen = new Set(), fams = CATS.map(f => ({ name: f.name, ids: f.spaces.filter(id => space[id] && meta[id] && !seen.has(id) && seen.add(id)), feat: new Set(f.spaces.slice(0, 3)) }))
	const rest = Object.keys(space).filter(id => !seen.has(id)).sort()
	return rest.length ? fams.concat({ name: 'More', ids: rest, feat: new Set() }) : fams
})()
const titleOf = id => meta[id]?.title || id
function renderSpaceMenu() {
	const q = typed ? $('spq').value.trim().toLowerCase() : '', cat = $('spcat').value, list = $('splist')
	$('spclr').hidden = !$('spq').value
	const hit = id => !q || id.includes(q) || titleOf(id).toLowerCase().includes(q)
	const rows = []
	for (const f of FAMILIES) {
		if (cat && cat !== f.name) continue
		const ids = f.ids.filter(hit)
		if (!ids.length) continue
		if (!cat) rows.push(el('h6', null, f.name))
		for (const id of ids) {
			const b = el('button', 'sp' + (f.feat.has(id) ? ' feat' : ''))
			b.type = 'button'
			b.dataset.id = id
			b.setAttribute('role', 'option')
			b.setAttribute('aria-selected', String(id === S.space))
			b.append(el('span', 'nm', titleOf(id)), el('span', 'id', id))
			rows.push(b)
		}
	}
	list.replaceChildren(...(rows.length ? rows : [el('p', 'spnone', 'No space by that name')]))
	const on = list.querySelector('[aria-selected="true"]') || list.querySelector('.sp')
	if (on) { on.classList.add('on'); on.scrollIntoView({ block: 'nearest' }) }
}
function renderSpaces() {
	$('spcat').replaceChildren(new Option('All families', ''), ...FAMILIES.map(f => new Option(f.name, f.name)))
}
const showSpace = () => { $('spname').textContent = titleOf(S.space); $('spbtn').dataset.id = S.space }

function renderQuant() {
	const opt = ([v, name, tip]) => {
		const b = el('button', 'opt')
		b.type = 'button'
		b.dataset.q = String(v)
		b.dataset.tip = tip
		b.setAttribute('aria-pressed', String(v === S.quant))
		b.innerHTML = `<span class="oi">${QI[v || 'smooth']}</span>`
		b.append(el('span', null, name))
		return b
	}
	$('qsteps').replaceChildren(...QUANT[0].map(opt))
	$('qpals').replaceChildren(...QUANT[1].map(opt))
	const [, name] = QUANT.flat().find(q => q[0] === S.quant)
	$('quant').innerHTML = QI[S.quant || 'smooth'] + CHEV
	$('quant').insertBefore(el('span', null, name), $('quant').lastChild)
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
	const ps = pairs(), p = pair(), c = cls()
	$('plane').hidden = !p
	$('plane').querySelector('canvas').replaceWith(canvas())
	const seg = $('pairs')
	seg.replaceChildren(...ps.map((q, k) => {
		const b = el('button', null, `${c.ch[q.a].sym} ${q.polar ? '○' : '×'} ${c.ch[q.b].sym}`)
		b.type = 'button'
		b.dataset.k = k
		b.dataset.tip = q.polar ? `${c.ch[q.a].name} around, ${c.ch[q.b].name} out` : `${c.ch[q.a].name} across, ${c.ch[q.b].name} up`
		b.setAttribute('aria-pressed', String(q.a === p.a && q.b === p.b))
		return b
	}))
	seg.hidden = ps.length < 2
	// a row per channel: its bar (the field and a knob, role slider, that the pointer and the keys drive), then
	// its value cell, whose letter scrubs it
	$('channels').replaceChildren(...c.ch.flatMap((ch, i) => {
		const bar = el('div', 'bar2'), knob = el('i', 'nrg'), bg = canvas('bgc')
		bg.height = 1
		Object.assign(knob, { tabIndex: 0 })
		knob.setAttribute('role', 'slider')
		knob.setAttribute('aria-label', `${ch.name} slider`)
		knob.setAttribute('aria-valuemin', String(ch.min))
		knob.setAttribute('aria-valuemax', String(ch.max))
		bar.dataset.i = knob.dataset.i = i
		bar.append(bg, knob)
		const fld = el('label', 'cvp'), cv = el('input', 'cv'), l = el('i', 'cl', ch.sym)
		Object.assign(cv, { type: 'number', step: String(10 ** -decOf(ch)), inputMode: 'decimal', spellcheck: false, autocomplete: 'off' })
		cv.setAttribute('aria-label', ch.name)
		cv.dataset.i = l.dataset.i = i
		l.dataset.tip = `${ch.name}, ${fmtc(ch.min, ch)}–${fmtc(ch.max, ch)}. Drag to scrub.`
		fld.append(l, cv)
		return [bar, fld]
	}))
	invalidate()
}

// the list is rebuilt only when its rows change; a re-read of the same rows (every write answers with one) just recolors the swatches
function renderPaints() {
	const list = $('paints'), focused = document.activeElement?.dataset?.key
	const rows = S.virtual && S.key === 'virtual' ? [S.virtual] : S.paints
	const key = rows.map(p => [keyOf(p), p.name, p.visible, p.src && p.src.name + p.src.remote].join()).join('|') + '#' + S.key
	if (list._key === key) {
		rows.forEach((p, k) => { list.children[k].querySelector('.sw').style.background = swatch(p) })
		return
	}
	list._key = key
	list.replaceChildren()
	for (const p of rows) {
		const b = el('button', 'paint')
		b.type = 'button'
		b.dataset.key = keyOf(p)
		b.setAttribute('aria-pressed', String(keyOf(p) === S.key))
		const sw = el('span', 'sw')
		sw.style.background = swatch(p)
		const tail = el('span', 'src', p.virtual ? 'image' : p.src ? p.src.name : where(p))
		if (p.src) tail.dataset.tip = `${where(p)}, from the ${p.src.type} ${p.src.name}`
		b.append(sw, el('span', 'pn', p.name), tail)
		const li = el('li')
		li.append(b)
		list.append(li)
		if (focused && focused === b.dataset.key) b.focus()
	}
}

// a library variable or style can't be edited from this file; a local one is edited where it lives
const locked = p => !p || !S.vals || (!p.virtual && (!S.editable || !!(p.src && p.src.remote)))

// Read the paint into vals unless it holds a color this UI just wrote (its own coordinates stay)
function sync(force) {
	const p = current()
	if (!p) { S.vals = null; S.own = []; return }
	// a gesture owns the coordinates until release; after it, a re-read of a color this UI wrote keeps them too
	if (!force && S.vals && (G || S.own.some(w => near(w, [p.r, p.g, p.b])))) return
	S.own = []
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
	const p = current(), [label, tip] = PROFILE[S.profile] || [S.profile, '']
	$('profile').textContent = label
	$('profile').dataset.tip = tip
	$('empty').hidden = !!p
	// an image still on its way says so; one that couldn't be read falls back to the plain hint
	$('empty').textContent = S.images.some(i => !S.img.has(i.hash)) ? 'Reading the image…' : 'Select a layer with a solid fill, a gradient or an image.'
	for (const id of ['paints', 'picker', 'css']) $(id).hidden = !p
	renderPal()
	if ($('drop')) $('drop').hidden = !p || !('EyeDropper' in window) || locked(p)
	const mixed = S.mixed ? 'Text with mixed fills is skipped. Select text whose fill is the same throughout.' : ''
	if (!p) { renderGamut(null); return renderNotes(mixed ? [mixed] : []) }

	const v = S.vals, lock = locked(p), c = cls()
	// the picker's ink: the current color, outlined in the ink that reads on it
	const pk = $('picker').style
	pk.setProperty('--tkc', swatch(p))
	for (const input of $('channels').querySelectorAll('.cv')) {
		input.readOnly = lock
		input.closest('.cvp').classList.toggle('locked', lock)
		if (input.dataset.dirty && input === document.activeElement) continue
		input.value = v ? fmtc(v[input.dataset.i], c.ch[input.dataset.i]) : ''
	}
	for (const k of $('channels').querySelectorAll('.nrg')) {
		const i = +k.dataset.i
		k.setAttribute('aria-disabled', String(lock))
		k.hidden = !v
		if (!v) continue
		k.style.setProperty('--f', clamp01(frac(i, v[i])))
		k.setAttribute('aria-valuenow', String(v[i]))
		k.setAttribute('aria-valuetext', `${c.ch[i].sym} ${fmtc(v[i], c.ch[i])}`)
	}
	placeMarker()

	const [a, b] = cssFor(p), name = nameOf(p)
	$('css-1').value = a
	$('css-2').value = b
	$('css-3').value = name
	$('named').hidden = !name

	// the gamut note closes the list: it comes and goes as a drag crosses the gamut, so nothing below it jumps
	const notes = []
	if (S.error) notes.push(S.error)
	if (!v) notes.push(`This color has no ${S.space} value.`)
	else if (S.lossy) notes.push(`${S.space} can't hold this color exactly. These values are its nearest ${S.space} equivalent, and editing writes that.`)
	if (p.src) notes.push(p.src.remote
		? `This color comes from the ${p.src.type} ${p.src.name}, which this file can't edit. Edit it where it's defined.`
		: `Editing the ${p.src.type} ${p.src.name}: every layer that uses it changes.`)
	if (p.virtual) notes.push('The dots on the plane are this image\'s pixels, the swatches its prominent colors. Select a fill or stroke to write a color.')
	else if (!S.editable) notes.push('Dev Mode is read-only. Copy the values below.')
	if (S.more) notes.push(`Showing the first ${S.paints.length} paints.`)
	if (mixed) notes.push(mixed)
	renderNotes(notes)
	renderGamut(v)
	draw()
}

// the gamut status reads the coordinate itself, not the last write: steady through a drag, re-reads and lag
function renderGamut(v) {
	const { id, scale, name } = doc(), g = $('gamut')
	let text = '', out = false
	if (!v) text = ''
	else if (lens()) text = `Snapped to ${QUANT.flat().find(q => q[0] === S.quant)[1]}`
	else {
		const rgb = S.space === id ? v : space[S.space][id](...v)
		out = !rgb.every(x => Number.isFinite(x) && x >= -1e-4 * scale && x <= (1 + 1e-4) * scale)
		text = out ? `Outside ${name}: written as the nearest ${name} color (CSS Color 4 gamut mapping)` : `In ${name}`
	}
	g.classList.toggle('out', out)
	if (g.textContent !== text) g.textContent = text
	g.title = text
}

// #notes is a live region, so it stays in place (empty when there is nothing to say) and is
// only rewritten when the text changes; otherwise every re-read would announce it again
function renderNotes(notes) {
	const box = $('notes')
	if (box.textContent === notes.join('')) return
	box.replaceChildren(...notes.map(t => el('p', null, t)))
}

/* ---------- the fields: plane and bars, painted once per frame ---------- */

function placeMarker() {
	const pl = $('plane'), q = pair(), v = S.vals, cx = pl.querySelector('.cx'), c = cls()
	pl.classList.toggle('locked', locked(current()))
	if (!q || !v) { cx.hidden = true; return }
	cx.hidden = false
	const fa = clamp01(frac(q.a, v[q.a])), fb = clamp01(frac(q.b, v[q.b]))
	let x = fa, y = fb
	if (pl._polar) {   // the kernel's disc: angle clockwise from +x, radius out (gl.js uPolar)
		const t = -fa * 2 * Math.PI
		x = 0.5 + 0.5 * fb * Math.cos(t)
		y = 0.5 + 0.5 * fb * Math.sin(t)
	}
	cx.style.left = `${x * 100}%`
	cx.style.top = `${(1 - y) * 100}%`
	pl.querySelector('.laby').textContent = c.ch[q.b].sym
	pl.querySelector('.labx').textContent = c.ch[q.a].sym
	pl.setAttribute('aria-label', q.polar ? `${c.ch[q.a].name} and ${c.ch[q.b].name} wheel` : `${c.ch[q.a].name} and ${c.ch[q.b].name} plane`)
	pl.setAttribute('aria-valuenow', String(+v[q.a].toFixed(4)))
	pl.setAttribute('aria-valuetext', `${c.ch[q.a].sym} ${fmtc(v[q.a], c.ch[q.a])}, ${c.ch[q.b].sym} ${fmtc(v[q.b], c.ch[q.b])}`)
	placeMarks()
}

// the axis letters take the ink of the field under them, as on the dossier (labInk): sampled at the
// corner, black or white by luminance, the theme ink where the corner is void
function labInk(cv, label, pts) {
	let r = 0, g = 0, b = 0, k = 0
	try {
		const ctx = cv.getContext('2d')
		for (const [fx, fy] of pts) {
			const d = ctx.getImageData(Math.round(fx * (cv.width - 1)), Math.round(fy * (cv.height - 1)), 1, 1).data
			if (d[3] < 40) continue
			r += d[0]; g += d[1]; b += d[2]; k++
		}
	} catch {}
	label.style.color = !k ? 'var(--ink)' : (0.2126 * r + 0.7152 * g + 0.0722 * b) / k / 255 < 0.6 ? '#fff' : '#000'
}

let raf = 0
const draw = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; paint() }) }
// a program landing (the kernel links asynchronously) or a new space repaints everything
const invalidate = () => { for (const cv of document.querySelectorAll('canvas')) cv._key = ''; draw() }
setGLReady(invalidate)

function paint() {
	const v = S.vals, s = S.space, q = pair(), gm = doc().gamut, n = S.quant
	if (!v || !current()) return
	const st = hasPlaneGL(s) ? planeGLStatus(s) : 'no'
	if (q) {
		const pl = $('plane'), cv = pl.querySelector('canvas')
		const full = Math.min(512, Math.round((cv.clientWidth || 256) * (devicePixelRatio || 1)))
		// the field depends on the held channels, never on the swept two: a drag across the plane never repaints it.
		// A held channel dragged on a bar repaints at half resolution (the dossier's live law); release settles full.
		const top = st === 'no' ? Math.min(full, 160) : full, w = S.live ? top >> 1 : top
		const polar = q.polar && st !== 'no'
		const key = [s, q.a, q.b, v.map((x, k) => k === q.a || k === q.b ? '' : x), n, gm, st, polar].join()
		if (cv._key !== key || (cv.width !== top && !S.live)) {
			if (cv.width !== w || cv.height !== w) { cv.width = w; cv.height = w }
			pl._polar = polar
			pl.classList.toggle('polar', polar)
			cv._paints = (cv._paints || 0) + 1   // repaints, counted: a drag across the plane must not repaint it (checks read this)
			if (st === 'ready') paintPlaneGL(cv, s, v, q.a, q.b, range(q.a), range(q.b), gm, n, polar, 0, 'oklab', false)
			else if (st === 'no') plane(cv.getContext('2d'), w, s, v, q.a, q.b, range(q.a), range(q.b), true, gm, lens() ? rgb => quantRGB(rgb, n) : n || null)
			else cv.getContext('2d').clearRect(0, 0, w, w)   // linking: blank until the program lands, never a low-res preview that then sharpens
			cv._key = st === 'pending' ? '' : key
			labInk(cv, pl.querySelector('.laby'), [[0.03, 0.06], [0.08, 0.06], [0.13, 0.06]])
			labInk(cv, pl.querySelector('.labx'), [[0.96, 0.96], [0.84, 0.96], [0.72, 0.96]])
			pl._dark = fieldDark(cv)
			placeMarker()
		}
		// the dots depend on the pair and the samples, never on the held channel
		const dc = pl.querySelector('.density'), ck = coords(), dkey = [ck && ck.key, q.a, q.b, polar, w, pl._dark].join()
		if (dc._key !== dkey) { dc._key = dkey; paintDensity(dc, q, w, polar, pl._dark) }
	}
	// a bar keeps its knob inside the pill, as Figma's do, so the channel's range spans the knob's travel: the field is
	// painted into that inset span and its end columns stretch over the caps, so the knob always sits on its own color
	for (const bar of $('channels').querySelectorAll('.bar2')) {
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
let queued = null, qraf = 0
function flush() { cancelAnimationFrame(qraf); qraf = 0; if (queued) post(queued); queued = null }
function send(msg) { queued = msg; if (msg.commit) flush(); else if (!qraf) qraf = requestAnimationFrame(flush) }

// write a color (the file's 0..1 channels) to the current paint; the coordinates it came from stay the UI's
function write(rgb, commit) {
	const p = current()
	S.own.push(rgb)
	if (S.own.length > 64) S.own.shift()
	p.r = rgb[0]; p.g = rgb[1]; p.b = rgb[2]   // shown now; the re-read confirms it
	if (!p.virtual) send({ type: 'set', id: p.id, kind: p.kind, index: p.index, stop: p.stop, profile: S.profile, color: { r: rgb[0], g: rgb[1], b: rgb[2] }, commit: !!commit })
	const sw = $('paints').querySelector(`[data-key="${CSS.escape(S.key)}"] .sw`)
	if (sw) sw.style.background = swatch(p)
	update()
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
	if (!lch.every(Number.isFinite)) { S.error = `Those ${S.space} values have no color.`; return update() }
	const { rgb } = gamutMap(lch, doc().dest)
	write(rgb, commit)
}
const set = (i, v, commit) => { if (!S.vals) return; const next = S.vals.slice(); next[i] = v; edit(next, commit) }
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
function grab(el, e, move) {
	if (G || e.button || locked(current())) return
	e.preventDefault()
	G = { el, id: e.pointerId, move }
	try { el.setPointerCapture(e.pointerId) } catch {}
	document.documentElement.classList.add('drag')
	el.classList.add('live')
	live(true)
	move(e)
}
function drop() {
	if (!G) return
	const { el, id } = G
	G = null
	try { if (el.hasPointerCapture(id)) el.releasePointerCapture(id) } catch {}
	document.documentElement.classList.remove('drag')
	el.classList.remove('live')
	if (S.vals && !locked(current())) edit(S.vals.slice(), true)
	live(false)
}
// A release the frame never saw (the button let go outside a frame that doesn't keep capture): the next
// pointer event without a button ends the gesture there, and a new press never finds an old one alive
addEventListener('pointermove', e => { if (!G || e.pointerId !== G.id) return; if (!e.buttons) return drop(); G.move(e) })
addEventListener('pointerdown', () => drop(), true)
addEventListener('pointerup', e => { if (G && e.pointerId === G.id) { G.move(e); drop() } })
addEventListener('pointercancel', e => { if (G && e.pointerId === G.id) drop() })
addEventListener('lostpointercapture', e => { if (G && e.pointerId === G.id) drop() }, true)
addEventListener('blur', drop)

// the plane: a pointer position → the two swept channels, through the painted geometry; past the edge, the edge
function pick(e) {
	const pl = $('plane'), q = pair(), r = pl.getBoundingClientRect()
	if (!q || !S.vals) return
	const fx = (e.clientX - r.left) / r.width, fy = 1 - (e.clientY - r.top) / r.height
	let fa = fx, fb = fy
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
plane$.addEventListener('pointerdown', e => { if (!e.target.closest('.dm')) grab(plane$, e, pick) })
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
	const i = +bar.dataset.i, kn = bar.querySelector('.nrg')
	grab(bar, e, ev => {
		const r = bar.getBoundingClientRect(), k = kn.offsetWidth
		set(i, at(i, snap((ev.clientX - r.left - k / 2) / Math.max(1, r.width - k))))
	})
	kn.focus({ preventScroll: true })
})
$('channels').addEventListener('keydown', e => {
	const t = e.target
	if (!t.classList.contains('nrg') || !S.vals || locked(current())) return
	const i = +t.dataset.i
	const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 }[e.key]
	const to = e.key === 'Home' ? 0 : e.key === 'End' ? 1 : d == null ? null : clamp01(frac(i, S.vals[i])) + d * cell()
	if (to == null) return
	e.preventDefault()
	set(i, at(i, snap(to)), true)
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
	set(+t.dataset.i, v, true)
})
vals$.addEventListener('pointerdown', e => {
	const l = e.target.closest('.cl')
	if (!l || !S.vals) return
	const i = +l.dataset.i
	let f = frac(i, S.vals[i]), x = e.clientX
	grab(l, e, ev => {
		f += (ev.clientX - x) / 300 * (ev.shiftKey ? 0.1 : 1)   // the step since the last event (movementX is unreliable across frames)
		x = ev.clientX
		f = hueIdx(cls()) === i ? ((f % 1) + 1) % 1 : clamp01(f)   // past an end the scrub holds there, and turns back at once
		set(i, at(i, snap(f)))
	})
})

/* ---------- the eyedropper: any pixel on screen, in Chromium's EyeDropper ---------- */

$('drop').addEventListener('click', async () => {
	let hexc
	try { hexc = (await new window.EyeDropper().open()).sRGBHex }
	catch (err) {
		if (err && err.name === 'AbortError') return   // Escape
		$('drop').remove()   // not allowed in this frame: the button goes for good
		S.error = 'The eyedropper isn\'t available here.'
		return update()
	}
	adopt(fromSrgb8([1, 3, 5].map(k => parseInt(hexc.slice(k, k + 2), 16))))
})

// a color from outside the picker (a screen pixel, an image swatch, a document color), in the file's 0..1
// channels: written through the active palette lens, and the coordinates are read from it
function adopt(rgb) {
	if (locked(current())) return
	S.error = ''
	write(lens() ? fromSrgb8(quantRGB(srgb8({ r: rgb[0], g: rgb[1], b: rgb[2] }), S.quant)) : rgb, true)
	sync(true)
	update()
}

/* ---------- the document's colors: rings on the plane where each sits; a click takes it ---------- */

function placeMarks() {
	const box = $('marks'), q = pair(), pl = $('plane')
	const key = [S.space, q && q.a, q && q.b, pl._polar, S.profile, S.doc.map(c => c.r + ',' + c.g + ',' + c.b).join(';')].join('|')
	if (box._key === key) return
	box._key = key
	box.replaceChildren()
	if (!q) return
	for (const c of S.doc) {
		const v = space[doc().id][S.space](...base(c))
		if (!v.every(Number.isFinite)) continue
		const fa = frac(q.a, v[q.a]), fb = frac(q.b, v[q.b])
		let x = fa, y = fb
		if (pl._polar) { const t = -fa * 2 * Math.PI, rr = Math.min(1, fb); x = 0.5 + 0.5 * rr * Math.cos(t); y = 0.5 + 0.5 * rr * Math.sin(t) }
		if (!(x >= 0 && x <= 1 && y >= 0 && y <= 1)) continue
		const b = el('button', 'dm'), h = '#' + [c.r, c.g, c.b].map(u => Math.round(u * 255).toString(16).padStart(2, '0')).join('')
		b.type = 'button'
		b.style.left = `${x * 100}%`
		b.style.top = `${(1 - y) * 100}%`
		b.style.background = swatch(c)
		b.dataset.tip = c.name ? `${c.name}, ${h}` : h
		b.setAttribute('aria-label', `Use ${c.name || h}`)
		b.onclick = () => adopt([c.r, c.g, c.b])
		box.append(b)
	}
}

/* ---------- an image's pixels: dots on the plane, its prominent colors as swatches ---------- */

const pending = new Set()
const decoded = () => S.images.map(i => S.img.get(i.hash)).filter(d => d && d.rgb)
// the selection's images as one sample set, each sample's coordinates in the current space, computed once per space
let cloud = null
function coords() {
	const parts = decoded()
	if (!parts.length) return null
	const key = S.space + '|' + S.images.map(i => i.hash).join()
	if (cloud && cloud.key === key) return cloud
	const n = parts.reduce((t, d) => t + d.rgb.length / 3, 0), dim = cls().ch.length, out = new Float32Array(n * dim)
	let k = 0
	for (const { rgb } of parts) for (let i = 0; i < rgb.length; i += 3, k++) {
		const v = S.space === 'rgb' ? [rgb[i], rgb[i + 1], rgb[i + 2]] : space.rgb[S.space](rgb[i], rgb[i + 1], rgb[i + 2])
		for (let d = 0; d < dim; d++) out[k * dim + d] = v[d]
	}
	return cloud = { key, v: out, dim, n }
}
// the dots, as on the dossier's image density: a fifth-opaque square per sample, light on a dark field, dark on a light one
function paintDensity(cv, q, w, polar, dark) {
	const c = coords(), ctx = cv.getContext('2d')
	if (cv.width !== w || cv.height !== w) { cv.width = w; cv.height = w }
	ctx.clearRect(0, 0, w, w)
	if (!c) return
	const [a0, a1] = range(q.a), [b0, b1] = range(q.b), r = Math.max(2, w / 190)
	ctx.fillStyle = dark ? '#fff' : '#16161a'
	ctx.globalAlpha = 0.2
	for (let k = 0; k < c.n; k++) {
		const fa = (c.v[k * c.dim + q.a] - a0) / (a1 - a0), fb = (c.v[k * c.dim + q.b] - b0) / (b1 - b0)
		let x = fa, y = fb
		if (polar) { if (!(fa >= 0 && fa <= 1 && fb >= 0)) continue; const t = -fa * 2 * Math.PI, rr = Math.min(1, fb); x = 0.5 + 0.5 * rr * Math.cos(t); y = 0.5 + 0.5 * rr * Math.sin(t) }
		if (!(x >= 0 && x <= 1 && y >= 0 && y <= 1)) continue
		ctx.fillRect(x * w - r / 2, (1 - y) * w - r / 2, r, r)
	}
	ctx.globalAlpha = 1
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

function renderPal() {
	const pal = decoded().flatMap(d => d.pal).slice(0, 8), box = $('pal'), key = pal.join('|')
	box.hidden = !pal.length || !current()
	if (box._key === key) return
	box._key = key
	box.replaceChildren(...pal.map(rgb => {
		const b = el('button', 'sw'), h = '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('')
		b.type = 'button'
		b.style.background = `rgb(${rgb.join(' ')})`
		b.dataset.tip = h
		b.setAttribute('aria-label', `Use ${h}`)
		b.onclick = () => adopt(fromSrgb8(rgb))
		return b
	}))
}

// the image's color stands in for a paint when the selection has no solid or gradient: it moves, it writes nothing
function refreshVirtual() {
	if (S.paints.length) { S.virtual = null; return }
	const first = S.images.find(i => S.img.get(i.hash)?.pal?.length)
	if (!first) { S.virtual = null; if (S.key === 'virtual') S.key = null; return }
	if (S.virtual && S.virtual.hash === first.hash && S.key === 'virtual') return
	const [r, g, b] = fromSrgb8(S.img.get(first.hash).pal[0])
	S.virtual = { virtual: true, hash: first.hash, id: '', name: first.name, kind: 'fills', index: 0, stop: -1, r, g, b, opacity: 1, visible: true, src: null }
	S.key = 'virtual'
	sync(true)
	renderPaints()
}
async function receiveImage(m) {
	pending.delete(m.hash)
	let rgb = null
	try { if (m.bytes) rgb = await sampleImage(new Blob([m.bytes]), 128) } catch {}   // missing or undecodable: no dots, no swatches
	S.img.set(m.hash, { rgb, pal: rgb && rgb.length ? paletteOf(rgb, 5) : [] })
	cloud = null
	refreshVirtual()
	update()
}

// the tooltip stays secondary: any press dismisses it (it also fades on its own, in CSS), and focus brings
// it only from the keyboard — a clicked button takes focus, and tip.js would show its tip again
addEventListener('pointerdown', () => document.getElementById('tip')?.classList.remove('on'), true)
addEventListener('focusin', e => { if (!e.target.matches?.(':focus-visible')) e.stopPropagation() }, true)

/* ---------- copy ---------- */

async function copy(button) {
	const field = $(button.dataset.copy)
	let ok = false
	try { await navigator.clipboard.writeText(field.value); ok = true }
	catch {
		// fallback when the iframe has no async clipboard (unverified in Figma; see README)
		field.select()
		try { ok = document.execCommand('copy') } catch { ok = false }
	}
	button.setAttribute('aria-label', ok ? 'Copied' : 'Selected')   // Selected: press ⌘C / Ctrl+C
	setTimeout(() => button.setAttribute('aria-label', 'Copy'), 1200)
}

/* ---------- wiring ---------- */

function useSpace(id) {
	S.space = id
	showSpace()
	S.error = ''
	warmGL(id)
	renderPicker()
	sync(true)
	update()
}
// the space menu: opens with the current space's name in the search, selected (as Figma's font menu does), the
// list on the current space; typing filters, ↑↓ move, Enter takes, Escape or a press outside closes
const spmenu = $('spmenu')
let typed = false
function openSpaces() {
	spmenu.hidden = false
	$('spbtn').setAttribute('aria-expanded', 'true')
	typed = false
	$('spq').value = titleOf(S.space)
	renderSpaceMenu()
	$('splist').querySelector('.on')?.scrollIntoView({ block: 'center' })
	$('spq').focus()
	$('spq').select()
	fit()
}
function closeSpaces() {
	if (spmenu.hidden) return
	spmenu.hidden = true
	$('spbtn').setAttribute('aria-expanded', 'false')
	fit()
}
$('spbtn').addEventListener('click', () => spmenu.hidden ? openSpaces() : closeSpaces())
// a press outside only closes the menu, as a dropdown does: it doesn't also pick on the plane beneath
// (the click that follows the press is swallowed too: preventing a press doesn't cancel its click)
let swallow = false
addEventListener('pointerdown', e => { if (spmenu.hidden || e.target.closest('.top')) return; e.preventDefault(); e.stopPropagation(); swallow = true; closeSpaces() }, true)
addEventListener('click', e => { if (!swallow) return; swallow = false; e.preventDefault(); e.stopPropagation() }, true)
addEventListener('pointerup', () => setTimeout(() => { swallow = false }), true)   // a press that never clicks (a drag) leaves nothing armed
$('spq').addEventListener('input', () => { typed = true; renderSpaceMenu() })
$('spcat').addEventListener('change', () => { renderSpaceMenu(); $('spq').focus() })
$('spclr').addEventListener('click', () => { $('spq').value = ''; typed = true; renderSpaceMenu(); $('spq').focus() })
const takeSpace = id => {
	closeSpaces()
	$('spbtn').focus()
	if (id === S.space) return
	post({ type: 'store', key: 'space', value: id })
	useSpace(id)
}
$('splist').addEventListener('click', e => { const b = e.target.closest('.sp'); if (b) takeSpace(b.dataset.id) })
spmenu.addEventListener('keydown', e => {
	if (e.key === 'Escape') { e.preventDefault(); closeSpaces(); return $('spbtn').focus() }
	const items = [...$('splist').querySelectorAll('.sp')], k = items.findIndex(b => b.classList.contains('on'))
	if (e.key === 'Enter' && items[k]) { e.preventDefault(); return takeSpace(items[k].dataset.id) }
	const d = { ArrowDown: 1, ArrowUp: -1 }[e.key]
	if (!d || !items.length) return
	e.preventDefault()
	const next = items[Math.max(0, Math.min(items.length - 1, k + d))]
	items.forEach(b => b.classList.toggle('on', b === next))
	next.scrollIntoView({ block: 'nearest' })
})
// the quantize menu: below its button, right-aligned with the panel
$('qmenu').addEventListener('beforetoggle', e => { if (e.newState === 'open') $('qmenu').style.top = `${$('quant').getBoundingClientRect().bottom + 4}px` })
$('qmenu').addEventListener('click', e => {
	const b = e.target.closest('.opt')
	if (!b) return
	const q = QKEYS.find(k => String(k) === b.dataset.q)
	S.quant = q
	post({ type: 'store', key: 'quant', value: q })
	$('qmenu').hidePopover()
	renderQuant()
	update()
})
$('pairs').addEventListener('click', e => {
	const b = e.target.closest('button')
	if (!b) return
	S.pairs[S.space] = +b.dataset.k
	post({ type: 'store', key: 'pairs', value: S.pairs })
	for (const x of $('pairs').children) x.setAttribute('aria-pressed', String(x === b))
	invalidate()
	update()
})
$('paints').addEventListener('click', e => {
	const b = e.target.closest('.paint')
	if (!b) return
	S.key = b.dataset.key
	S.error = ''
	for (const x of $('paints').querySelectorAll('.paint')) x.setAttribute('aria-pressed', String(x === b))
	sync(true)
	update()
})
$('css').addEventListener('click', e => { const b = e.target.closest('[data-copy]'); if (b) copy(b) })

window.addEventListener('message', e => {
	const m = e.data && e.data.pluginMessage
	if (!m || typeof m !== 'object') return
	if (m.type === 'init') {
		S.editable = !!m.editable
		if (QKEYS.includes(m.quant)) S.quant = m.quant
		if (m.pairs && typeof m.pairs === 'object') S.pairs = m.pairs
		renderQuant()
		const id = space[m.space] && meta[m.space] ? m.space : S.space
		useSpace(id)
	}
	else if (m.type === 'selection') {
		const profile = m.profile !== S.profile
		S.profile = m.profile
		S.paints = m.paints || []
		S.images = m.images || []
		for (const { hash } of S.images) if (!S.img.has(hash) && !pending.has(hash)) { pending.add(hash); post({ type: 'image', hash }) }
		S.more = m.more || 0
		S.mixed = m.mixed || 0
		let force = profile
		if (!S.paints.some(p => keyOf(p) === S.key)) {
			S.key = S.paints.length ? keyOf(S.paints[0]) : null
			S.error = ''   // an error belongs to the paint it came from, as on a paint click
			force = true
		}
		if (S.key === 'virtual' && S.paints.length) S.key = keyOf(S.paints[0])
		if (!S.paints.length) refreshVirtual()
		renderPaints()
		sync(force)
		if (profile) renderPicker()   // the fields' canvases take the new color space; nothing else needs a repaint: their keys say what changed
		update()
	}
	else if (m.type === 'image') receiveImage(m)
	else if (m.type === 'doc') { S.doc = Array.isArray(m.colors) ? m.colors : []; placeMarks() }
	else if (m.type === 'error') { S.error = m.text; update() }
})

// the window follows the content: Figma sizes the iframe, so the UI reports its height.
// While a gesture is live it only grows — a note that comes and goes mid-drag must not
// bounce the window — and settles on release.
let height = 0
function fit() {
	const pad = parseFloat(getComputedStyle(document.body).paddingBottom) || 0
	const h = Math.ceil(Math.max(document.documentElement.getBoundingClientRect().height, spmenu.hidden ? 0 : spmenu.getBoundingClientRect().bottom + pad))
	if (h === height || (S.live && h < height)) return
	height = h
	post({ type: 'resize', height: h })
}
new ResizeObserver(fit).observe(document.documentElement)

renderSpaces()
renderQuant()
showSpace()
renderPicker()
update()
post({ type: 'ready' })
