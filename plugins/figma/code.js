/**
 * color-space Figma plugin: main thread (Figma's sandbox, no DOM).
 *
 * It reads the SOLID fills and strokes of the selection and sends them, with the
 * document's color profile, to ui.html, which does all the color math. It writes a
 * color back when the UI asks, and only in Figma Design: Dev Mode is read-only.
 *
 * The syntax stays within what Figma's own plain-JS samples use (async/await, arrow
 * functions, destructuring), with no optional chaining, nullish coalescing or object
 * spread, since this file runs unbundled.
 */
const KINDS = ['fills', 'strokes']
const STYLE = { fills: 'fillStyleId', strokes: 'strokeStyleId' }   // the paint style each list can link to
const MAX = 100   // paints sent per selection; a huge selection shouldn't flood the UI
const editable = figma.editorType === 'figma'

// A paint that comes from a color style or a variable is shown but never written: whether a
// raw write detaches it is unverified, so the plugin leaves it alone.
const styled = (node, kind) => !!node[STYLE[kind]]   // '' when unlinked; an id, or figma.mixed, when linked
const bound = paint => !!(paint.boundVariables && paint.boundVariables.color)

figma.showUI(__html__, { width: 300, height: 440, themeColors: true })

function read() {
	const paints = []
	let more = 0, mixed = 0
	for (const node of figma.currentPage.selection) {
		for (const kind of KINDS) {
			if (!(kind in node)) continue
			const list = node[kind]
			if (list === figma.mixed) { mixed++; continue }   // text with per-range fills
			const style = styled(node, kind)
			list.forEach((paint, index) => {
				if (paint.type !== 'SOLID') return
				if (paints.length >= MAX) { more++; return }
				paints.push({
					id: node.id, name: node.name, kind, index,
					r: paint.color.r, g: paint.color.g, b: paint.color.b,
					opacity: paint.opacity === undefined ? 1 : paint.opacity,
					visible: paint.visible !== false,
					bound: bound(paint), style,
				})
			})
		}
	}
	figma.ui.postMessage({ type: 'selection', profile: figma.root.documentColorProfile, paints, more, mixed })
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
	if (list === figma.mixed || styled(node, msg.kind)) return
	const paint = list[msg.index]
	if (!paint || paint.type !== 'SOLID' || bound(paint)) return
	// Paints are readonly: copy the array, replace this paint with a copy that has the new
	// color, and reassign. Figma's invert-image sample does the same.
	const next = list.slice()
	next[msg.index] = Object.assign({}, paint, { color: { r: c.r, g: c.g, b: c.b } })
	node[msg.kind] = next
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

figma.on('selectionchange', read)
figma.on('currentpagechange', watchPage)   // a selectionchange always follows, and that re-reads
watchPage()

figma.ui.onmessage = async msg => {
	if (!msg || typeof msg !== 'object') return
	try {
		if (msg.type === 'ready') {
			const saved = await figma.clientStorage.getAsync('space')
			figma.ui.postMessage({ type: 'init', space: typeof saved === 'string' ? saved : 'oklch', editable })
			read()
		}
		else if (msg.type === 'space' && typeof msg.space === 'string') await figma.clientStorage.setAsync('space', msg.space)
		else if (msg.type === 'set') { await write(msg); read() }   // always answer, so the UI settles even when nothing changed
	}
	catch (err) {
		figma.ui.postMessage({ type: 'error', text: String(err && err.message || err) })
	}
}
