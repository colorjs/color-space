/**
 * A mock Figma host for the plugin, run inside a Chromium page: `(${host})(setup)` installs a `figma` global
 * that the real plugins/figma/code.js runs against. scripts/check-figma.js checks the plugin on it, and
 * plugins/figma/promo/promo.js films and photographs the plugin on it.
 *
 * Its showUI puts __html__ (the built ui.html) in an iframe (in setup.mount, else the body) and bridges
 * messages the way Figma does: figma.ui.postMessage(msg) arrives in the UI as {pluginMessage: msg}, and the
 * UI's parent.postMessage({pluginMessage}, '*') reaches figma.ui.onmessage. Paints are frozen, like Figma's.
 *
 * setup: { profile, editorType, mode, nodes, variables, styles, selection, stored, codegen, images, mount, theme, languages, css }
 * images: hash → [rgbA, rgbB] (a 16 px PNG, its halves in those colors), 'corrupt', or a URL whose bytes are fetched
 */
export function host(setup) {
	const deepFreeze = o => { if (o && typeof o === 'object') { Object.values(o).forEach(deepFreeze); Object.freeze(o) } return o }
	const clone = v => JSON.parse(JSON.stringify(v))
	const mixed = Symbol('figma.mixed')
	const events = {}, pageEvents = {}, store = new Map(Object.entries(setup.stored || {}))
	const fire = (bag, type, arg) => setTimeout(() => (bag[type] || []).forEach(f => f(arg)))   // Figma's events are async
	const log = window.__log = { toUI: [], fromUI: [], writes: [], varWrites: [], styleWrites: [], relaunch: [], opened: [], varLookups: 0, showUI: null, undo: 0, resize: [] }
	const nodes = new Map()

	for (const spec of setup.nodes) {
		// Figma reports '' for a fill or stroke list that isn't linked to a paint style
		const node = { id: spec.id, name: spec.name, type: spec.type, visible: spec.visible !== false, parent: null, fillStyleId: spec.fillStyleId || '', strokeStyleId: spec.strokeStyleId || '', resolvedVariableModes: spec.modes || {}, _put: {}, setRelaunchData: d => log.relaunch.push({ id: spec.id, d }) }
		for (const kind of ['fills', 'strokes']) {
			if (!(kind in spec)) continue
			let value = spec[kind] === 'mixed' ? mixed : deepFreeze(clone(spec[kind]))
			// a linked style's edit reaches the node through the style, not through this setter
			node._put[kind] = next => { value = deepFreeze(clone(next)); fire(pageEvents, 'nodechange', { nodeChanges: [{ type: 'PROPERTY_CHANGE', id: node.id, node, origin: 'LOCAL', properties: [kind] }] }) }
			Object.defineProperty(node, kind, {
				enumerable: true,
				get: () => value,
				set: next => {
					if (!Array.isArray(next)) throw new Error(`${kind} must be an array`)
					for (const p of next) if (p.type === 'SOLID' && !['r', 'g', 'b'].every(c => p.color[c] >= 0 && p.color[c] <= 1)) throw new Error('color channel out of [0, 1]')
					value = deepFreeze(clone(next))
					log.writes.push({ id: node.id, kind, paints: clone(next) })
					fire(pageEvents, 'nodechange', { nodeChanges: [{ type: 'PROPERTY_CHANGE', id: node.id, node, origin: 'LOCAL', properties: [kind] }] })
				},
			})
		}
		nodes.set(node.id, node)
	}
	// a group or frame holds its children (spec.children: ids), each knowing its parent
	for (const spec of setup.nodes) if (spec.children) { const g = nodes.get(spec.id); g.children = spec.children.map(id => nodes.get(id)); for (const ch of g.children) ch.parent = g }
	// color variables (aliases included) and paint styles; remote ones throw on edit, as Figma's library tokens do
	const vars = new Map(Object.entries(setup.variables || {}).map(([id, v]) => [id, {
		id, name: v.name, remote: !!v.remote, variableCollectionId: v.collection, valuesByMode: clone(v.values),
		setValueForMode(mode, value) {
			if (this.remote) throw new Error('cannot edit a remote variable')
			this.valuesByMode[mode] = clone(value)
			log.varWrites.push({ id, mode, value: clone(value) })
		},
	}]))
	const styles = new Map(Object.entries(setup.styles || {}).map(([id, st]) => {
		let paints = deepFreeze(clone(st.paints))
		const style = { id, name: st.name, remote: !!st.remote }
		Object.defineProperty(style, 'paints', {
			get: () => paints,
			set: next => {
				if (style.remote) throw new Error('cannot edit a remote style')
				paints = deepFreeze(clone(next))
				log.styleWrites.push({ id, paints: clone(next) })
				for (const n of nodes.values()) for (const [kind, key] of [['fills', 'fillStyleId'], ['strokes', 'strokeStyleId']]) if (n[key] === id) n._put[kind](next)
			},
		})
		return [id, style]
	}))

	let iframe = null
	const currentPage = {
		selection: (setup.selection || []).map(id => nodes.get(id)),
		on: (t, f) => { (pageEvents[t] ||= []).push(f) },
		off: (t, f) => { pageEvents[t] = (pageEvents[t] || []).filter(g => g !== f) },
	}
	window.figma = {
		editorType: setup.editorType,
		mode: setup.mode || 'default',
		// Dev Mode's Code panel: the plugin registers a generator; the check calls it as Figma would
		codegen: { preferences: { customSettings: setup.codegen || {} }, on: (t, f) => { if (t === 'generate') window.__generate = f } },
		// an image's bytes, painted from the setup's colors (left half, right half) and encoded as PNG
		getImageByHash: hash => setup.images && setup.images[hash] ? { getBytesAsync: async () => {
			if (setup.images[hash] === 'corrupt') return new Uint8Array([1, 2, 3])
			if (typeof setup.images[hash] === 'string') return new Uint8Array(await (await fetch(setup.images[hash])).arrayBuffer())
			const cv = new OffscreenCanvas(16, 16), cx = cv.getContext('2d'), [a, b] = setup.images[hash]
			cx.fillStyle = `rgb(${a.join(' ')})`; cx.fillRect(0, 0, 8, 16)
			cx.fillStyle = `rgb(${b.join(' ')})`; cx.fillRect(8, 0, 8, 16)
			return new Uint8Array(await (await cv.convertToBlob({ type: 'image/png' })).arrayBuffer())
		} } : null,
		mixed,
		root: { documentColorProfile: setup.profile },
		currentPage,
		on: (t, f) => { (events[t] ||= []).push(f) },
		getNodeByIdAsync: async id => nodes.get(id) || null,
		getStyleByIdAsync: async id => styles.get(id) || null,
		variables: { getVariableByIdAsync: async id => { log.varLookups++; return vars.get(id) || null }, getLocalVariablesAsync: async () => [...vars.values()].filter(v => !v.remote) },
		commitUndo: () => { log.undo++ },
		openExternal: url => { log.opened.push(url) },
		clientStorage: {
			getAsync: async k => store.get(k),
			setAsync: async (k, v) => { store.set(k, v) },
		},
		showUI(doc, options) {
			log.showUI = options
			// themeColors: Figma adds its --figma-color-* variables to the iframe. These dark
			// values are stand-ins (not Figma's), so the check can see that the panel uses them.
			// setup.theme: other values for them (name → value, without the --figma-color- prefix)
			const theme = setup.theme || { bg: '#2c2c2c', 'bg-secondary': '#383838', text: '#ffffff', 'text-secondary': '#b3b3b3', border: '#4d4d4d' }
			// setup.css: a host stylesheet laid over the panel's own (a frame's injected rules)
			if (setup.css) doc = doc.replace('<head>', `<head><style>${setup.css}</style>`)
			// setup.languages: the browser's languages as the panel's first script sees them (navigator.languages)
			if (setup.languages) doc = doc.replace('<head>', `<head><script>Object.defineProperty(navigator, 'languages', { get: () => ${JSON.stringify(setup.languages)} })</script>`)
			if (options.themeColors) doc = doc.replace('<head>', `<head><style>:root{${Object.entries(theme).map(([k, v]) => `--figma-color-${k}:${v}`).join(';')}}</style>`)
			iframe = document.createElement('iframe')
			iframe.sandbox = 'allow-scripts'   // an opaque origin: the UI may not rely on storage or same-origin access
			iframe.title = 'color-space plugin'
			iframe.style.border = '0'   // Figma's panel frame has none, and pointer math in the checks reads the bare box
			iframe.width = options.width
			iframe.height = options.height
			iframe.srcdoc = doc
			;(setup.mount ? document.querySelector(setup.mount) : document.body).append(iframe)
		},
		ui: {
			onmessage: null,
			resize(w, h) { log.resize.push([w, h]); iframe.width = w; iframe.height = h },
			postMessage(msg) { log.toUI.push(clone(msg)); iframe.contentWindow.postMessage({ pluginMessage: msg }, '*') },
		},
	}
	window.addEventListener('message', e => {
		if (!iframe || e.source !== iframe.contentWindow || !e.data || !('pluginMessage' in e.data)) return
		log.fromUI.push(clone(e.data.pluginMessage))
		if (figma.ui.onmessage) figma.ui.onmessage(e.data.pluginMessage, { origin: e.origin })
	})
	// test controls
	window.__select = ids => { currentPage.selection = ids.map(id => nodes.get(id)); fire(events, 'selectionchange') }
	window.__edit = (id, kind, paints) => { nodes.get(id)[kind] = paints }   // as if the user edited in Figma
	window.__profile = p => { figma.root.documentColorProfile = p }
	window.__paints = (id, kind) => clone(nodes.get(id)[kind])
	window.__stored = k => store.get(k)
	window.__var = id => clone(vars.get(id).valuesByMode)
	window.__style = id => clone(styles.get(id).paints)
	window.__node = id => nodes.get(id)
}
