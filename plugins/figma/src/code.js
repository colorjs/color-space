/**
 * color-space Figma plugin: main thread (Figma's sandbox, no DOM). build.js bundles it,
 * with the library, into plugins/figma/code.js.
 *
 * In Figma Design and Dev Mode's Inspect panel it reads the color slots of the selection
 * (each SOLID paint, each gradient stop) and sends them, with the document's color
 * profile, to ui.html, which does all the color math. It writes a color back where it
 * lives (the paint, its variable or its style) when the UI asks, and only in Figma
 * Design: Dev Mode is read-only. Image paints are sent as bytes for the UI's statistics.
 *
 * In Dev Mode's Code panel (codegen) it prints the selection's colors as CSS in the
 * format chosen in the panel's settings, with no UI.
 */
import space from '../../../index.js'
import { css, hex } from '../../../css.js'
import { gamutMap, DEST } from './gamut.js'

const KINDS = ['fills', 'strokes']
const STYLE = { fills: 'fillStyleId', strokes: 'strokeStyleId' }   // the paint style each list can link to
const MAX = 100   // color slots sent per selection; a huge selection shouldn't flood the UI
const IMAGES = 4   // image paints sampled per selection
const PREFS = ['space', 'quant', 'pairs']   // what the UI may keep in clientStorage
const WIDTH = 264   // near Figma's own picker (240), with room for the value cells
const editable = figma.editorType === 'figma'

// A color slot: a SOLID paint, or one stop of a gradient (stop ≥ 0)
function slots(list) {
	const out = []
	list.forEach((paint, index) => {
		if (paint.type === 'SOLID') out.push({ index, stop: -1, paint, color: paint.color, ref: paint.boundVariables && paint.boundVariables.color })
		else if (/^GRADIENT_/.test(paint.type)) paint.gradientStops.forEach((st, stop) => out.push({ index, stop, paint, color: st.color, ref: st.boundVariables && st.boundVariables.color }))
	})
	return out
}
const where = (kind, slot) => `${kind === 'fills' ? 'fill' : 'stroke'} ${slot.index + 1}${slot.stop >= 0 ? `, stop ${slot.stop + 1}` : ''}`

/*
 * Where a slot's color lives. A raw paint holds its own color. A slot bound to a color
 * variable takes it from that variable in the node's mode, following aliases to the
 * variable that holds the value. A list linked to a paint style takes it from the style.
 * The plugin edits the color where it lives, so an edit to a token changes every layer
 * that uses it. Library (remote) variables and styles can't be edited from this file.
 */
async function sourceOf(node, kind, slot) {
	const sid = node[STYLE[kind]]
	if (sid === figma.mixed) return { type: 'style', name: 'mixed styles', remote: true }
	if (slot.ref) {
		let v = await figma.variables.getVariableByIdAsync(slot.ref.id)
		for (let hop = 0; v && hop < 8; hop++) {
			const mode = (node.resolvedVariableModes || {})[v.variableCollectionId]   // the node's own or inherited mode
			const value = v.valuesByMode[mode]
			if (!value || value.type !== 'VARIABLE_ALIAS') return { type: 'variable', name: v.name, remote: v.remote || !value, variable: v, mode, color: value }
			v = await figma.variables.getVariableByIdAsync(value.id)
		}
		return { type: 'variable', name: 'unresolved variable', remote: true }
	}
	if (sid) {
		const st = await figma.getStyleByIdAsync(sid)
		return st ? { type: 'style', name: st.name, remote: st.remote, style: st } : { type: 'style', name: 'missing style', remote: true }
	}
	return null
}

/* ---------- codegen: Dev Mode's Code panel ---------- */

// a color slot as CSS in the chosen format → [value, note]; formats bound to sRGB map a wider color in (CSS Color 4) and say so
const SRGB_ONLY = new Set(['rgb', 'hsl', 'hwb', 'hex'])
function cssColor(c, a, format) {
	const p3 = figma.root.documentColorProfile === 'DISPLAY_P3'
	const doc = p3 ? space.p3 : space.rgb, vals = p3 ? [c.r, c.g, c.b] : [c.r * 255, c.g * 255, c.b * 255]
	let note = '', from = p3 ? 'p3' : 'rgb', v = vals
	if (SRGB_ONLY.has(format)) {
		const m = gamutMap(doc.oklch(...vals), DEST.rgb)
		if (m.mapped) note = 'mapped into sRGB'
		from = 'rgb'
		v = m.rgb.map(x => x * 255)
	}
	const alpha = a < 1 ? +a.toFixed(3) : 1
	if (format === 'hex') return [hex(v) + (alpha < 1 ? Math.round(alpha * 255).toString(16).padStart(2, '0') : ''), note]
	const out = css(format, from === format ? v : space[from][format](...v))
	return [alpha < 1 ? out.replace(/\)$/, ` / ${alpha})`) : out, note]
}
const slug = name => name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

async function generate(node) {
	const settings = (figma.codegen.preferences && figma.codegen.preferences.customSettings) || {}
	const format = settings.format || 'oklch'
	const lines = []
	for (const kind of KINDS) {
		if (!(kind in node) || node[kind] === figma.mixed) continue
		const prop = kind === 'strokes' ? 'border-color' : node.type === 'TEXT' ? 'color' : 'background'
		for (const slot of slots(node[kind])) {
			if (slot.paint.visible === false) continue
			const src = await sourceOf(node, kind, slot)
			const c = src && src.color ? src.color : slot.color
			let [value, note] = cssColor(c, slot.stop >= 0 ? (c.a === undefined ? 1 : c.a) : (slot.paint.opacity === undefined ? 1 : slot.paint.opacity), format)
			if (src && src.type === 'variable' && src.color) value = `var(--${slug(src.name)}, ${value})`
			const notes = [src && `${src.type} ${src.name}`, note].filter(Boolean).join(', ')
			lines.push((slot.stop >= 0 ? `/* ${where(kind, slot)} */ ${value}` : `${prop}: ${value};`) + (notes ? ` /* ${notes} */` : ''))
		}
	}
	return [{ language: 'CSS', title: 'color-space', code: lines.join('\n') || '/* no solid or gradient colors */' }]
}

/* ---------- the panel ---------- */

// reads overlap (a selection change during a write's re-read); only the newest one answers
let reading = 0
async function read() {
	const seq = ++reading
	const paints = [], images = []
	let more = 0, mixed = 0
	for (const node of figma.currentPage.selection) {
		for (const kind of KINDS) {
			if (!(kind in node)) continue
			const list = node[kind]
			if (list === figma.mixed) { mixed++; continue }   // text with per-range fills
			for (const paint of list) if (paint.type === 'IMAGE' && paint.imageHash && images.length < IMAGES && !images.some(i => i.hash === paint.imageHash)) images.push({ hash: paint.imageHash, name: node.name })
			for (const slot of slots(list)) {
				if (paints.length >= MAX) { more++; continue }
				const src = await sourceOf(node, kind, slot)
				const c = src && src.color ? src.color : slot.color   // a variable's own value, not a stale resolved copy
				paints.push({
					id: node.id, name: node.name, kind, index: slot.index, stop: slot.stop,
					r: c.r, g: c.g, b: c.b,
					opacity: slot.stop >= 0 ? (c.a === undefined ? 1 : c.a) : slot.paint.opacity === undefined ? 1 : slot.paint.opacity,
					visible: slot.paint.visible !== false,
					src: src && { type: src.type, name: src.name, remote: !!src.remote },
				})
			}
		}
	}
	if (seq !== reading) return
	figma.ui.postMessage({ type: 'selection', profile: figma.root.documentColorProfile, paints, images, more, mixed })
}

async function write(msg) {
	if (!editable) return
	if (msg.profile !== figma.root.documentColorProfile) return   // the profile changed under the UI; the caller re-reads
	const c = msg.color
	if (!c || ![c.r, c.g, c.b].every(v => typeof v === 'number' && v >= 0 && v <= 1)) return
	if (KINDS.indexOf(msg.kind) < 0) return
	const node = await figma.getNodeByIdAsync(msg.id)
	if (!node || !(msg.kind in node)) return
	const list = node[msg.kind]
	if (list === figma.mixed) return
	const stop = typeof msg.stop === 'number' ? msg.stop : -1
	const slot = slots(list).find(s => s.index === msg.index && s.stop === stop)
	if (!slot) return
	const src = await sourceOf(node, msg.kind, slot)
	if (src && src.remote) return
	const color = { r: c.r, g: c.g, b: c.b }
	// Paints are readonly: copy the array, replace this paint with a copy that has the new
	// color (or the new stop), and reassign. Figma's invert-image sample does the same.
	const swap = paints => {
		const next = paints.slice(), p = paints[msg.index]
		if (stop < 0) next[msg.index] = Object.assign({}, p, { color })
		else {
			const stops = p.gradientStops.slice()
			stops[stop] = Object.assign({}, stops[stop], { color: Object.assign({}, color, { a: stops[stop].color.a }) })   // the stop's alpha stays
			next[msg.index] = Object.assign({}, p, { gradientStops: stops })
		}
		return next
	}
	if (!src) node[msg.kind] = swap(list)
	else if (src.type === 'variable') src.variable.setValueForMode(src.mode, Object.assign({ a: src.color.a === undefined ? 1 : src.color.a }, color))   // the token's alpha stays
	else {
		const sp = src.style.paints[msg.index]
		if (!sp || sp.type !== slot.paint.type) return
		src.style.paints = swap(src.style.paints)
	}
	// the layer offers the plugin again from its properties panel (manifest relaunchButtons)
	if (node.setRelaunchData) node.setRelaunchData({ open: 'Pick its colors in any color space' })
}

// The document's colors: its local color variables and paint styles (named, first), then the solid colors
// on the current page, deduplicated by 8-bit value. The UI marks them on the plane.
const DOC = 48, SCAN = 4000
async function docColors() {
	const seen = new Map()
	const add = (c, name) => {
		if (!c || typeof c.r !== 'number') return
		const k = [c.r, c.g, c.b].map(v => Math.round(v * 255)).join(), e = seen.get(k)
		if (!e) seen.set(k, { r: c.r, g: c.g, b: c.b, name: name || '' })
		else if (name && !e.name) e.name = name
	}
	for (const v of await figma.variables.getLocalVariablesAsync('COLOR'))
		for (const m in v.valuesByMode) { const val = v.valuesByMode[m]; if (val && val.type !== 'VARIABLE_ALIAS') add(val, v.name) }
	for (const st of await figma.getLocalPaintStylesAsync()) for (const p of st.paints) if (p.type === 'SOLID') add(p.color, st.name)
	figma.skipInvisibleInstanceChildren = true
	let n = 0
	for (const node of figma.currentPage.findAll(nd => 'fills' in nd || 'strokes' in nd)) {
		if (++n > SCAN) break   // a huge page: the first few thousand layers are enough to place its colors
		for (const kind of KINDS) if (Array.isArray(node[kind])) for (const p of node[kind]) if (p.type === 'SOLID' && p.visible !== false) add(p.color)
	}
	const all = [...seen.values()]
	return all.filter(c => c.name).concat(all.filter(c => !c.name)).slice(0, DOC)
}
async function sendDoc() { figma.ui.postMessage({ type: 'doc', colors: await docColors() }) }

async function sendImage(hash) {
	const img = figma.getImageByHash(hash)
	figma.ui.postMessage({ type: 'image', hash, bytes: img ? await img.getBytesAsync() : null })   // always answer: the UI waits on it
}

// Follow edits made while the plugin is open. Under documentAccess "dynamic-page",
// listen for nodechange on the current page instead of documentchange.
let page = null
function onNodeChange(event) {
	// nodechange fires for every move and resize on the page, so look at the properties first
	const paintChanges = event.nodeChanges.filter(ch => ch.type === 'PROPERTY_CHANGE'
		&& ch.properties.some(p => KINDS.indexOf(p) >= 0 || p === STYLE.fills || p === STYLE.strokes))
	if (!paintChanges.length) return
	const ids = new Set(figma.currentPage.selection.map(n => n.id))
	// ch.id rather than ch.node.id: a node removed since the event is a RemovedNode
	if (paintChanges.some(ch => ids.has(ch.id))) read()
}
function watchPage() {
	if (page) page.off('nodechange', onNodeChange)
	page = figma.currentPage
	page.on('nodechange', onNodeChange)
}

function panel() {
	figma.showUI(__html__, { width: WIDTH, height: 560, themeColors: true })   // the UI then reports its own height
	figma.on('selectionchange', read)
	figma.on('currentpagechange', () => { watchPage(); sendDoc() })   // a selectionchange always follows, and that re-reads
	watchPage()
	figma.ui.onmessage = async msg => {
		if (!msg || typeof msg !== 'object') return
		try {
			if (msg.type === 'ready') {
				const init = { type: 'init', editable }
				for (const k of PREFS) init[k] = await figma.clientStorage.getAsync(k)
				figma.ui.postMessage(init)
				read()
				sendDoc()
			}
			else if (msg.type === 'store' && PREFS.indexOf(msg.key) >= 0) await figma.clientStorage.setAsync(msg.key, msg.value)
			else if (msg.type === 'resize' && msg.height > 0) figma.ui.resize(WIDTH, Math.min(800, Math.max(120, Math.round(msg.height))))
			else if (msg.type === 'image' && typeof msg.hash === 'string') await sendImage(msg.hash)
			else if (msg.type === 'set') {
				await write(msg)
				// a gesture's live writes and its release are one step in Figma's undo history
				if (msg.commit) figma.commitUndo()
				read()   // always answer, so the UI settles even when nothing changed
			}
		}
		catch (err) {
			figma.ui.postMessage({ type: 'error', text: String(err && err.message || err) })
		}
	}
}

if (figma.mode === 'codegen') figma.codegen.on('generate', ({ node }) => generate(node))
else panel()
