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
 * In Dev Mode's Code panel (codegen) it prints the layer's colors as CSS in the format
 * chosen in the panel's settings, and a group's inner colors as custom properties, with no UI.
 */
import { cssOf } from './notation.js'

const KINDS = ['fills', 'strokes']
const STYLE = { fills: 'fillStyleId', strokes: 'strokeStyleId' }   // the paint style each list can link to
const MAX = 100   // color slots sent per selection; a huge selection shouldn't flood the UI
const IMAGES = 4   // image paints sampled per selection
const PREFS = ['space', 'quant', 'gamuts', 'pairs', 'disc', 'snap', 'width', 'scope']   // what the UI may keep in clientStorage
const PAGE = 1000   // color slots read from a whole page (the palette's On this page): the UI groups them into swatches
let scope = 'selection'   // the palette's: the selection's colors, or the page's
const WIDTH = 288, MIN = 240, MAX_W = 560   // a little wider than Figma's own picker (240); the panel's edge drags it
let width = WIDTH, height = 560
// The room the window may take: the canvas it floats over, on screen (its bounds at its zoom), less Figma's own head on
// the window and a margin. Taller than that, Figma moves the window up to hold its foot in view – its head, with the
// close, past the top, out of reach; the panel scrolls in what it has instead
const HEAD = 48
const room = () => { try { const v = figma.viewport, z = v.zoom || 1; return [Math.max(MIN, Math.floor(v.bounds.width * z) - 16), Math.max(80, Math.floor(v.bounds.height * z) - HEAD)] } catch { return [MAX_W, 800] } }
const editable = figma.editorType === 'figma'
// the about card's links (package.json homepage, repository, funding): the only pages the UI may open
const LINKS = { site: 'https://color-space.io/', github: 'https://github.com/colorjs/color-space', support: 'https://github.com/sponsors/colorjs' }

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
// memo: one read's lookups, shared – a group of 100 paints bound to three tokens asks Figma three times, not 100
async function sourceOf(node, kind, slot, memo = new Map()) {
	const get = (k, f) => memo.has(k) ? memo.get(k) : (memo.set(k, f()), memo.get(k))
	const variable = id => get('v' + id, () => figma.variables.getVariableByIdAsync(id))
	const sid = node[STYLE[kind]]
	if (sid === figma.mixed) return { type: 'style', name: 'mixed styles', remote: true }
	if (slot.ref) {
		let v = await variable(slot.ref.id)
		for (let hop = 0; v && hop < 8; hop++) {
			const mode = (node.resolvedVariableModes || {})[v.variableCollectionId]   // the node's own or inherited mode
			const value = v.valuesByMode[mode]
			if (!value || value.type !== 'VARIABLE_ALIAS') return { type: 'variable', name: v.name, remote: v.remote || !value, variable: v, mode, color: value }
			v = await variable(value.id)
		}
		return { type: 'variable', name: 'unresolved variable', remote: true }
	}
	if (sid) {
		const st = await get('s' + sid, () => figma.getStyleByIdAsync(sid))
		return st ? { type: 'style', name: st.name, remote: st.remote, style: st } : { type: 'style', name: 'missing style', remote: true }
	}
	return null
}

/* ---------- codegen: Dev Mode's Code panel ---------- */

const slug = name => name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'color'
const alphaOf = (slot, c) => slot.stop >= 0 ? (c.a === undefined ? 1 : c.a) : (slot.paint.opacity === undefined ? 1 : slot.paint.opacity)

// every visible color slot of a node, with where it lives and its CSS in the chosen format
async function colorsOf(node, format, memo) {
	const out = []
	for (const kind of KINDS) {
		if (!(kind in node) || node[kind] === figma.mixed) continue
		for (const slot of slots(node[kind])) {
			if (slot.paint.visible === false) continue
			const src = await sourceOf(node, kind, slot, memo)
			const c = src && src.color ? src.color : slot.color
			const [value, note] = cssOf(format, c, alphaOf(slot, c), figma.root.documentColorProfile)
			out.push({ kind, slot, src, value, note })
		}
	}
	return out
}

/*
 * The Code panel, for a developer building what's selected. First the layer's own colors as declarations (a variable
 * as var(--token, its value)); then, for a group, frame or component, the colors of everything inside it once each,
 * as custom properties ready for :root – named by their variable, else by the first layer that uses them, with the
 * layers that use them in a comment. Its palette, in the format the panel's settings name.
 */
const INSIDE = 64
async function generate(node) {
	const settings = (figma.codegen.preferences && figma.codegen.preferences.customSettings) || {}
	const format = settings.format || 'oklch', memo = new Map()
	const prop = kind => kind === 'strokes' ? 'border-color' : node.type === 'TEXT' ? 'color' : 'background'
	const own = (await colorsOf(node, format, memo)).map(({ kind, slot, src, value, note }) => {
		if (src && src.type === 'variable' && src.color) value = `var(--${slug(src.name)}, ${value})`
		const notes = [src && `${src.type} ${src.name}`, note].filter(Boolean).join(', ')
		return (slot.stop >= 0 ? `/* ${where(kind, slot)} */ ${value}` : `${prop(kind)}: ${value};`) + (notes ? ` /* ${notes} */` : '')
	})
	const out = [{ language: 'CSS', title: 'Color Space', code: own.join('\n') || '/* no solid or gradient colors */' }]
	if (!('children' in node)) return out
	const found = new Map(), names = new Set()
	for (const n of layers([node]).slice(1)) {
		for (const { src, value, note } of await colorsOf(n, format, memo)) {
			const token = src && src.type === 'variable' && src.color ? src.name : ''
			const key = token + '|' + value
			if (!found.has(key)) {
				if (found.size >= INSIDE) continue
				let name = slug(token || n.name), k = 2
				while (names.has(name)) name = `${slug(token || n.name)}-${k++}`
				names.add(name)
				found.set(key, { name, value, notes: [token && `variable ${token}`, src && src.type === 'style' && `style ${src.name}`, note].filter(Boolean), users: [] })
			}
			const f = found.get(key)
			if (f.users.indexOf(n.name) < 0) f.users.push(n.name)
		}
	}
	if (!found.size) return out
	const lines = [...found.values()].map(f => {
		const users = f.users.length > 3 ? `${f.users.slice(0, 3).join(', ')} +${f.users.length - 3}` : f.users.join(', ')
		return `--${f.name}: ${f.value}; /* ${f.notes.concat(users).join('; ')} */`
	})
	out.push({ language: 'CSS', title: 'Colors inside', code: lines.join('\n') })
	return out
}

/* ---------- the panel ---------- */

// The selection's layers and everything inside them, depth-first in layer order: a selected group or frame shows the
// colors of what it holds. Hidden descendants are skipped (a hidden layer selected itself is read); a huge tree stops
// at WALK layers – the color slots stop at MAX anyway.
const WALK = 2000
function* walk(selection, max = WALK) {
	const seen = new Set(), stack = selection.slice().reverse()
	let n = 0
	while (stack.length && n < max) {
		const node = stack.pop()
		if (seen.has(node.id)) continue   // a group selected with one of its own layers: that layer once
		seen.add(node.id)
		n++
		yield node
		if ('children' in node) for (let k = node.children.length - 1; k >= 0; k--) if (node.children[k].visible !== false) stack.push(node.children[k])
	}
}
const layers = (selection, max) => [...walk(selection, max)]
// a hidden layer inside an instance is never read (a hidden one is skipped anyway): Figma then leaves it out of the walk
// at its source, much the faster on a page of components
figma.skipInvisibleInstanceChildren = true

// a vector layer's outline, for its icon (Figma's layer list draws a vector as its own shape): its paths in its own box –
// none when it is longer than a 16 px icon is worth
const SHAPE = 1200
function shapeOf(n) {
	if (n.type !== 'VECTOR') return null
	try {
		const d = n.vectorPaths.map(p => p.data).join(' ')
		return d && d.length <= SHAPE ? { d, w: Math.max(n.width, 1), h: Math.max(n.height, 1) } : null
	} catch (e) { return null }
}

// reads overlap (a selection change during a write's re-read); only the newest one answers. Each answer carries the
// last write it has seen (ack: the UI's 'set' seq), so the UI can tell a read that trails its newer writes
// The plugin runs on Figma's own thread: a read of a whole page (thousands of layers) held Figma and the panel still till
// it was done. It reads in slices of SLICE ms instead, handing the thread back between them, and a newer read stops an
// older one at the next slice; the panel is told a read began ('reading'), so a long one shows it is under way
const SLICE = 12
let reading = 0, acked = 0
async function read() {
	const seq = ++reading, ack = acked, memo = new Map()
	const paints = [], images = []
	let more = 0, mixed = 0, t = Date.now()
	figma.ui.postMessage({ type: 'reading' })
	// the palette's scope: the selection's layers, or the page's (Figma's own On this page); there the selection's first
	// color is marked current, so the panel opens on it
	const page = scope === 'page', max = page ? PAGE : MAX, picked = new Set(page ? layers(figma.currentPage.selection).map(n => n.id) : [])
	let marked = false
	for (const node of walk(page ? figma.currentPage.children : figma.currentPage.selection, page ? WALK * 5 : WALK)) {
		if (Date.now() - t > SLICE) {
			await new Promise(r => setTimeout(r))
			if (seq !== reading) return
			t = Date.now()
		}
		// the layer's kind, as Figma's layer list draws it (the UI's icon for it): its type, a rectangle filled with an image an
		// IMAGE – and a vector its own outline
		const layer = node.type === 'RECTANGLE' && Array.isArray(node.fills) && node.fills.some(f => f.type === 'IMAGE' && f.visible !== false) ? 'IMAGE' : node.type, shape = shapeOf(node)
		for (const kind of KINDS) {
			if (!(kind in node)) continue
			const list = node[kind]
			if (list === figma.mixed) { mixed++; continue }   // text with per-range fills
			for (const paint of list) if (paint.type === 'IMAGE' && paint.imageHash && images.length < IMAGES && !images.some(i => i.hash === paint.imageHash)) images.push({ hash: paint.imageHash, name: node.name })
			for (const slot of slots(list)) {
				if (paints.length >= max) { more++; continue }
				const src = await sourceOf(node, kind, slot, memo)
				const c = src && src.color ? src.color : slot.color   // a variable's own value, not a stale resolved copy
				paints.push({
					id: node.id, name: node.name, layer, shape, kind, index: slot.index, stop: slot.stop,
					r: c.r, g: c.g, b: c.b,
					opacity: alphaOf(slot, c),
					visible: slot.paint.visible !== false,
					src: src && { type: src.type, name: src.name, remote: !!src.remote },
				})
				if (page && !marked && picked.has(node.id)) { paints[paints.length - 1].current = true; marked = true }
			}
		}
	}
	if (seq !== reading) return
	figma.ui.postMessage({ type: 'selection', profile: figma.root.documentColorProfile, paints, images, more, mixed, ack })
}

// a layer on screen: the view's box (v) meets its own (a layer with none, written as one)
const onScreen = (n, v) => { const b = n.absoluteBoundingBox; return !b || (b.x < v.x + v.width && b.x + b.width > v.x && b.y < v.y + v.height && b.y + b.height > v.y) }
// One slot written, as part of one message (apply): its lookups (memo), the variables and styles it wrote (done – a
// swatch of 200 layers on one token sets it once) and the view's box. A drag's live write (msg.commit and msg.all unset)
// leaves a raw paint off screen – 'later': it waits for the drag to rest or end
async function write(msg, { memo, done, view }) {
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
	const src = await sourceOf(node, msg.kind, slot, memo)
	if (src && src.remote) return
	if (!src && !msg.commit && !msg.all && !onScreen(node, view)) return 'later'
	const color = { r: c.r, g: c.g, b: c.b }
	// the opacity: a solid paint's own, a gradient stop's alpha; absent, it stays
	const a = typeof msg.opacity === 'number' && msg.opacity >= 0 && msg.opacity <= 1 ? msg.opacity : null
	// Paints are readonly: copy the array, replace this paint with a copy that has the new
	// color (or the new stop), and reassign. Figma's invert-image sample does the same.
	const swap = paints => {
		const next = paints.slice(), p = paints[msg.index]
		if (stop < 0) next[msg.index] = Object.assign({}, p, { color }, a === null ? {} : { opacity: a })
		else {
			const stops = p.gradientStops.slice()
			stops[stop] = Object.assign({}, stops[stop], { color: Object.assign({}, color, { a: a === null ? stops[stop].color.a : a }) })
			next[msg.index] = Object.assign({}, p, { gradientStops: stops })
		}
		return next
	}
	const once = k => !done.has(k) && !!done.add(k)
	if (!src) node[msg.kind] = swap(list)
	else if (src.type === 'variable') {
		// the token holds the color, and a stop's alpha; a solid paint's opacity is the layer's own, beside the token
		const keep = src.color.a === undefined ? 1 : src.color.a
		if (once(`v${src.variable.id} ${src.mode} ${stop >= 0}`)) src.variable.setValueForMode(src.mode, Object.assign({ a: stop >= 0 && a !== null ? a : keep }, color))
		if (stop < 0 && a !== null && a !== alphaOf(slot, c)) node[msg.kind] = swap(list)
	}
	else {
		const sp = src.style.paints[msg.index]
		if (!sp || sp.type !== slot.paint.type) return
		if (once(`s${src.style.id} ${msg.index} ${stop}`)) src.style.paints = swap(src.style.paints)
	}
	// the layer offers the plugin again from its properties panel (manifest relaunchButtons) – once, at the release
	if (msg.commit && node.setRelaunchData) node.setRelaunchData({ open: 'Pick its colors in any color space' })
	return true   // written (a refused write returns nothing)
}

async function sendImage(hash) {
	const img = figma.getImageByHash(hash)
	figma.ui.postMessage({ type: 'image', hash, bytes: img ? await img.getBytesAsync() : null })   // always answer: the UI waits on it
}

/*
 * The writes. A drag sends one a frame, and Figma may take longer than a frame to apply one (a swatch on 200 layers; the
 * plugin runs on Figma's own thread, so a backlog there held Figma's picker back too). They are taken one at a time,
 * and a live one still waiting gives way to the next for the same paints – no backlog builds behind the pointer; a
 * release is always kept. A live write paints the layers on screen; those off it follow once the drag rests (LATER ms
 * without a move) or at the release, which writes every one and closes the undo step
 */
const LATER = 300
const sets = []
let setting = false, later = 0
const targetsOf = msg => Array.isArray(msg.targets) ? msg.targets : [msg]
const keysOf = msg => targetsOf(msg).map(t => `${t.id} ${t.kind} ${t.index} ${t.stop}`).join()
function queueSet(msg) {
	const last = sets[sets.length - 1]
	if (last && !last.commit && keysOf(last) === keysOf(msg)) sets[sets.length - 1] = msg
	else sets.push(msg)
	if (!setting) drain()
}
async function drain() {
	setting = true
	try { while (sets.length) { try { await apply(sets.shift()) } catch (err) { figma.ui.postMessage({ type: 'error', text: String(err && err.message || err) }) } } }
	finally { setting = false }
}
async function apply(msg) {
	clearTimeout(later)
	const one = { memo: new Map(), done: new Set(), view: figma.viewport.bounds }
	let wrote = false, rest = false
	try {
		for (const t of targetsOf(msg)) {
			const r = await write(Object.assign({}, msg, t), one)
			wrote = r === true || wrote
			rest = r === 'later' || rest
		}
	} finally { if (typeof msg.seq === 'number') acked = msg.seq; liveAt = msg.commit ? 0 : wrote || rest ? Date.now() : liveAt }
	if (rest) later = setTimeout(() => queueSet(Object.assign({}, msg, { all: true })), LATER)
	// a gesture's live writes and its release are one step in Figma's undo history. The release is answered with a read
	// (the UI settles on it, even when nothing changed); a live write is not – the panel holds its own color through a
	// drag, and a page's thousand colors read and sent every frame are what made a drag lag
	if (msg.commit) { figma.commitUndo(); read() }
}

// Follow edits made while the plugin is open. Under documentAccess "dynamic-page",
// listen for nodechange on the current page instead of documentchange.
let page = null
// a drag's live writes: the nodechange each echoes is no news – the release's read settles all. A drag left open (no
// release came) stops counting a second after its last write
let liveAt = 0
function onNodeChange(event) {
	if (liveAt && Date.now() - liveAt < 1000) return
	// nodechange fires for every move and resize on the page, so look at the properties first
	const paintChanges = event.nodeChanges.filter(ch => ch.type === 'PROPERTY_CHANGE'
		&& ch.properties.some(p => KINDS.indexOf(p) >= 0 || p === STYLE.fills || p === STYLE.strokes))
	if (!paintChanges.length) return
	if (scope === 'page') return readSoon()   // the page's colors: any paint on it
	const ids = new Set(figma.currentPage.selection.map(n => n.id))
	// a change in the selection or anywhere inside it; ch.id first: a node removed since the event is a RemovedNode
	const inside = ch => { if (ids.has(ch.id)) return true; for (let n = !ch.node.removed && ch.node.parent; n; n = n.parent) if (ids.has(n.id)) return true; return false }
	if (paintChanges.some(inside)) readSoon()
}
// Figma's own picker dragged changes a paint every frame, each a nodechange; the panel follows them a read at a time,
// READ_MS apart – a read per change (200 layers' colors, every frame) held Figma's picker back, the plugin running on
// its thread. The first change is read at once, the last always
const READ_MS = 150
let readT = 0, again = false
function readSoon() {
	if (readT) { again = true; return }
	readT = setTimeout(async () => {
		try { await read() } finally { setTimeout(() => { readT = 0; if (again) { again = false; readSoon() } }, READ_MS) }
	})
}
function watchPage() {
	if (page) page.off('nodechange', onNodeChange)
	page = figma.currentPage
	page.on('nodechange', onNodeChange)
}

function panel() {
	figma.showUI(__html__, { width: Math.min(width, room()[0]), height: Math.min(height, room()[1]), themeColors: true })   // the UI then reports its own height
	figma.on('selectionchange', read)
	figma.on('currentpagechange', watchPage)   // a selectionchange always follows, and that re-reads
	watchPage()
	figma.ui.onmessage = async msg => {
		if (!msg || typeof msg !== 'object') return
		try {
			if (msg.type === 'ready') {
				const init = { type: 'init', editable }
				for (const k of PREFS) init[k] = await figma.clientStorage.getAsync(k)
				scope = init.scope === 'page' ? 'page' : 'selection'
				figma.ui.postMessage(init)
				read()
			}
			else if (msg.type === 'store' && PREFS.indexOf(msg.key) >= 0) {
				await figma.clientStorage.setAsync(msg.key, msg.value)
				if (msg.key === 'scope') { scope = msg.value === 'page' ? 'page' : 'selection'; read() }   // the palette's colors, read anew
			}
			else if (msg.type === 'resize') {   // the UI reports its height; the grip, a width
				if (msg.width > 0) width = Math.min(MAX_W, Math.max(MIN, Math.round(msg.width)))
				if (msg.height > 0) height = Math.min(800, Math.max(80, Math.round(msg.height)))   // the content's own height (an empty panel is about 116 px), held to a sane range
				const [w, h] = room()
				figma.ui.resize(Math.min(width, w), Math.min(height, h))
			}
			else if (msg.type === 'image' && typeof msg.hash === 'string') await sendImage(msg.hash)
			else if (msg.type === 'open' && Object.prototype.hasOwnProperty.call(LINKS, msg.to)) figma.openExternal(LINKS[msg.to])
			else if (msg.type === 'set') queueSet(msg)   // a swatch's paints, every one written (the panel groups the paints that share a color), one undo step
			// ⌘Z in the panel: Figma's undo, which the frame's keys never reach (figma.triggerUndo, plugin API Update 21)
			else if (msg.type === 'undo') { figma.triggerUndo(); read() }
			else if (msg.type === 'notify' && typeof msg.text === 'string') figma.notify(msg.text.slice(0, 160), { timeout: 2000 })   // a copy made: Figma's own toast says so
			// a layer pressed in a swatch's tip (or its "+N more"): selected, and brought into sight – its zoom kept – when it is
			// out of the view
			else if (msg.type === 'goto' && Array.isArray(msg.targets)) {
				const ids = msg.targets.map(t => t && t.id).filter((id, k, a) => typeof id === 'string' && a.indexOf(id) === k)
				const ns = (await Promise.all(ids.map(id => figma.getNodeByIdAsync(id)))).filter(n => n && n.absoluteBoundingBox)
				if (!ns.length) return
				figma.currentPage.selection = ns
				const bs = ns.map(n => n.absoluteBoundingBox), x0 = Math.min(...bs.map(b => b.x)), y0 = Math.min(...bs.map(b => b.y)), x1 = Math.max(...bs.map(b => b.x + b.width)), y1 = Math.max(...bs.map(b => b.y + b.height)), v = figma.viewport.bounds
				if (x0 < v.x || y0 < v.y || x1 > v.x + v.width || y1 > v.y + v.height) figma.viewport.center = { x: (x0 + x1) / 2, y: (y0 + y1) / 2 }
			}
		}
		catch (err) {
			figma.ui.postMessage({ type: 'error', text: String(err && err.message || err) })
		}
	}
}

if (figma.mode === 'codegen') figma.codegen.on('generate', ({ node }) => generate(node))
else panel()
