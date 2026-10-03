/**
 * color-space Figma plugin: UI iframe. It does the color math, the DOM and the clipboard.
 * build.js bundles this file as one IIFE into ui.html, because Figma injects the
 * manifest's `ui` file as a string (__html__), so nothing can be fetched.
 *
 * The main thread (code.js) sends {type:'init'|'selection'|'error'}; the UI sends
 * {type:'ready'|'space'|'set'} back through parent.postMessage({pluginMessage}, '*').
 *
 * Figma SolidPaint {r,g,b} are 0..1 in the document's color profile, so a DISPLAY_P3
 * file reads as the library's `p3` and an SRGB or LEGACY file as `rgb` (×255).
 * Writes go: chosen space → OkLCh → CSS Color 4 gamut map into the file's gamut →
 * clamp → {r,g,b}.
 */
import space from '../../../index.js'
import { gamutMap, deltaEOK, DEST, JND } from './gamut.js'

/* global __CHANNELS__ */
const CHANNELS = __CHANNELS__   // {space: [[symbol, name], …]} from data.json, injected by build.js
const NAMES = Object.keys(space).sort()
const PROFILE = { DISPLAY_P3: 'Display P3', SRGB: 'sRGB', LEGACY: 'sRGB · legacy' }

// mapped: {key, rgb} of the last write that gamut mapping changed, so its note stays only while the paint holds that value
const state = { space: 'oklch', editable: true, profile: 'SRGB', paints: [], more: 0, mixed: 0, key: null, values: null, mapped: null, error: '' }
const $ = id => document.getElementById(id)
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e }
const post = msg => parent.postMessage({ pluginMessage: msg }, '*')
const keyOf = p => `${p.id}:${p.kind}:${p.index}`
const current = () => state.paints.find(p => keyOf(p) === state.key)

// The file's RGB: library space, scale of its channels, gamut name, CSS form
const doc = () => state.profile === 'DISPLAY_P3'
	? { id: 'p3', scale: 1, name: 'Display P3', dest: DEST.p3 }
	: { id: 'rgb', scale: 255, name: 'sRGB', dest: DEST.rgb }
const base = p => { const { scale } = doc(); return [p.r * scale, p.g * scale, p.b * scale] }

// display precision from the channel's span: 0..1 → 3 dp, 0..0.4 → 4, 0..360 → 1, 1000..40000 → 0
const decimals = ([min, max]) => Math.min(4, Math.max(0, 3 - Math.floor(Math.log10(max - min || 1))))
const num = (v, dp) => String(+v.toFixed(dp))
const alpha = p => p.opacity < 1 ? ` / ${num(p.opacity, 3)}` : ''
const hex = v => Math.round(v * 255).toString(16).padStart(2, '0')

function cssFor(p) {
	const [L, C, H] = space[doc().id].oklch(...base(p))
	const out = [`oklch(${num(L, 4)} ${num(C, 4)} ${num(H, 2)}${alpha(p)})`]
	if (state.profile === 'DISPLAY_P3') out.push(`color(display-p3 ${num(p.r, 4)} ${num(p.g, 4)} ${num(p.b, 4)}${alpha(p)})`)
	else out.push(`#${hex(p.r)}${hex(p.g)}${hex(p.b)}${p.opacity < 1 ? hex(p.opacity) : ''}`)
	return out
}
const swatch = p => `color(${state.profile === 'DISPLAY_P3' ? 'display-p3' : 'srgb'} ${p.r} ${p.g} ${p.b})`

/* ---------- render ---------- */

function renderSpaces() {
	const sel = $('space')
	for (const n of NAMES) sel.append(new Option(n, n))
}

function renderChannels() {
	const box = $('channels')
	box.replaceChildren()
	const range = space[state.space].range
	CHANNELS[state.space].forEach(([sym, name], i) => {
		const dp = decimals(range[i])
		const row = el('label', 'ch')
		const input = el('input')
		Object.assign(input, { type: 'number', step: String(10 ** -dp), inputMode: 'decimal', title: `${name}, ${num(range[i][0], dp)}–${num(range[i][1], dp)}` })
		input.dataset.i = i
		input.dataset.dp = dp
		row.append(el('span', 'sym', sym), input, el('span', 'nm', name))
		box.append(row)
	})
}

function renderPaints() {
	const list = $('paints'), focused = document.activeElement?.dataset?.key
	list.replaceChildren()
	for (const p of state.paints) {
		const b = el('button', 'paint')
		b.type = 'button'
		b.dataset.key = keyOf(p)
		b.setAttribute('aria-pressed', String(keyOf(p) === state.key))
		const sw = el('span', 'sw')
		sw.style.background = swatch(p)
		b.append(sw, el('span', 'pn', p.name), el('span', null, `${p.kind === 'fills' ? 'fill' : 'stroke'} ${p.index + 1}${p.visible ? '' : ' · hidden'}`))
		const li = el('li')
		li.append(b)
		list.append(li)
		if (focused && focused === b.dataset.key) b.focus()
	}
}

function update() {
	const p = current()
	$('profile').textContent = PROFILE[state.profile] || state.profile
	$('empty').hidden = !!p
	for (const id of ['paints', 'channels', 'css']) $(id).hidden = !p
	const notes = []
	const mixed = state.mixed ? 'Text with mixed fills is skipped. Select text whose fill is the same throughout.' : ''
	if (!p) return renderNotes(mixed ? [mixed] : [])

	const values = space[doc().id][state.space](...base(p))
	const valid = values.every(Number.isFinite)
	state.values = valid ? values : null
	const locked = !state.editable || p.bound || p.style || !valid
	for (const input of $('channels').querySelectorAll('input')) {
		input.readOnly = locked
		if (input.dataset.dirty && input === document.activeElement) continue
		input.value = valid ? num(values[input.dataset.i], +input.dataset.dp) : ''
	}

	const [a, b] = cssFor(p)
	$('css-1').value = a
	$('css-2').value = b

	if (state.error) notes.push(state.error)
	if (!valid) notes.push(`This color has no ${state.space} value.`)
	else {
		// projections (kelvin, wavelength, gray…) and sRGB-bound models can't hold every color
		const back = space[state.space][doc().id](...values)
		const { scale, dest } = doc()
		const e = back.every(Number.isFinite) ? deltaEOK(dest.toOklab(back.map(v => v / scale)), dest.toOklab([p.r, p.g, p.b])) : Infinity
		if (e >= JND) notes.push(`${state.space} can't hold this color exactly. These values are its nearest ${state.space} equivalent, and editing writes that.`)
	}
	const m = state.mapped, rgb = [p.r, p.g, p.b]
	// 1e-6: the paint may come back at float32 precision; an edit made in Figma since then drops the note
	if (m && m.key === state.key && m.rgb.every((v, i) => Math.abs(v - rgb[i]) < 1e-6)) notes.push(`That value is outside ${doc().name}. Chroma was reduced to fit (CSS Color 4 gamut mapping).`)
	if (p.bound) notes.push('This paint is bound to a variable. Edit the variable instead.')
	if (p.style) notes.push('This paint comes from a color style. Edit the style instead.')
	if (!state.editable) notes.push('Dev Mode is read-only. Copy the values below.')
	if (state.more) notes.push(`Showing the first ${state.paints.length} paints.`)
	if (mixed) notes.push(mixed)
	renderNotes(notes)
}

// #notes is a live region, so it stays in place (empty when there is nothing to say) and is
// only rewritten when the text changes; otherwise every re-read would announce it again
function renderNotes(notes) {
	const box = $('notes')
	if (box.textContent === notes.join('')) return
	box.replaceChildren(...notes.map(t => el('p', null, t)))
}

/* ---------- edit → write ---------- */

function commit(input) {
	delete input.dataset.dirty
	const p = current()
	if (!p || !state.values || input.readOnly) return
	const v = input.valueAsNumber
	if (!Number.isFinite(v)) return update()
	const values = state.values.slice()
	values[input.dataset.i] = v
	const lch = space[state.space].oklch(...values)
	if (!lch.every(Number.isFinite)) { state.error = `Those ${state.space} values have no color.`; return update() }
	const { rgb, mapped } = gamutMap(lch, doc().dest)
	state.error = ''
	state.mapped = mapped ? { key: state.key, rgb } : null
	post({ type: 'set', id: p.id, kind: p.kind, index: p.index, profile: state.profile, color: { r: rgb[0], g: rgb[1], b: rgb[2] } })
}

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
	button.textContent = ok ? 'Copied' : 'Selected'
	setTimeout(() => { button.textContent = 'Copy' }, 1200)
}

/* ---------- wiring ---------- */

$('space').addEventListener('change', e => {
	state.space = e.target.value
	state.mapped = null
	state.error = ''
	post({ type: 'space', space: state.space })
	renderChannels()
	update()
})
$('channels').addEventListener('input', e => { e.target.dataset.dirty = '1' })
$('channels').addEventListener('change', e => commit(e.target))
$('paints').addEventListener('click', e => {
	const b = e.target.closest('.paint')
	if (!b) return
	state.key = b.dataset.key
	state.mapped = null
	state.error = ''
	for (const x of $('paints').querySelectorAll('.paint')) x.setAttribute('aria-pressed', String(x === b))
	update()
})
$('css').addEventListener('click', e => { const b = e.target.closest('[data-copy]'); if (b) copy(b) })

window.addEventListener('message', e => {
	const m = e.data && e.data.pluginMessage
	if (!m || typeof m !== 'object') return
	if (m.type === 'init') {
		state.editable = !!m.editable
		if (CHANNELS[m.space] && space[m.space]) state.space = m.space
		$('space').value = state.space
		renderChannels()
		update()
	}
	else if (m.type === 'selection') {
		if (m.profile !== state.profile) state.mapped = null   // the note named the old gamut
		state.profile = m.profile
		state.paints = m.paints || []
		state.more = m.more || 0
		state.mixed = m.mixed || 0
		if (!state.paints.some(p => keyOf(p) === state.key)) {
			state.key = state.paints.length ? keyOf(state.paints[0]) : null
			state.mapped = null
			state.error = ''   // an error belongs to the paint it came from, as on a paint click
		}
		renderPaints()
		update()
	}
	else if (m.type === 'error') { state.error = m.text; update() }
})

renderSpaces()
$('space').value = state.space
renderChannels()
update()
post({ type: 'ready' })
