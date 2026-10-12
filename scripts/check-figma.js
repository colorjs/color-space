#!/usr/bin/env node
/**
 * Check the Figma plugin (plugins/figma) without Figma.
 *
 * It rebuilds ui.html, then runs the real code.js against a mock `figma` global in a
 * Chromium page. The mock's showUI puts __html__ (the built ui.html) in an iframe and
 * bridges messages the way Figma does: the main thread's figma.ui.postMessage(msg)
 * arrives in the UI as {pluginMessage: msg}, and the UI's
 * parent.postMessage({pluginMessage}, '*') reaches figma.ui.onmessage.
 *
 * Mock paints are frozen, like Figma's, so code.js must copy the array to write. Every
 * expected number comes from the library and plugins/figma/src/gamut.js in Node.
 *
 *   node scripts/check-figma.js      (npm run test:figma)
 *
 * It covers read → display → edit → 'set' → write → re-read, in an SRGB document and a
 * DISPLAY_P3 document, plus LEGACY, Dev Mode, variable-bound and style-linked paints, mixed text fills,
 * edits made outside the plugin, a profile change under the UI, and clientStorage.
 * It does not cover Figma itself: the real sandbox, iframe and clipboard are untested here.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import space from '../index.js'
import { classify, decOf } from '../web/js/core.js'
import * as PALETTES from '../web/js/palettes.js'
import { gamutMap, DEST } from '../plugins/figma/src/gamut.js'
import { CSS, css } from '../css.js'

const dir = fileURLToPath(new URL('../plugins/figma/', import.meta.url))
execFileSync(process.execPath, [dir + 'build.js'], { stdio: 'inherit' })
const html = readFileSync(dir + 'ui.html', 'utf8')
const code = readFileSync(dir + 'code.js', 'utf8')
const manifest = JSON.parse(readFileSync(dir + 'manifest.json', 'utf8'))

const failures = []
let passed = 0
const ok = (cond, msg) => { if (cond) passed++; else failures.push(msg) }
const close = (a, b, tol, msg) => ok(a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) <= (Array.isArray(tol) ? tol[i] : tol)), `${msg}: got [${a}] expected [${b}] (±${tol})`)

// manifest: the fields the research settled on
ok(manifest.api === '1.0.0' && manifest.main === 'code.js' && manifest.ui === 'ui.html', 'manifest api/main/ui')
ok(JSON.stringify(manifest.editorType) === '["figma","dev"]' && JSON.stringify(manifest.capabilities) === '["inspect","codegen","vscode"]', 'manifest editorType figma+dev with inspect, codegen and vscode')
ok(manifest.codegenLanguages?.[0]?.value === 'css' && manifest.codegenPreferences?.[0]?.options.every(o => o.value === 'hex' || o.value in CSS), 'manifest codegen: CSS, every format a css.js notation or hex')
ok(manifest.relaunchButtons?.[0]?.command === 'open', 'manifest relaunch button')
ok(manifest.documentAccess === 'dynamic-page', 'manifest documentAccess dynamic-page')
ok(JSON.stringify(manifest.networkAccess) === '{"allowedDomains":["none"]}', 'manifest networkAccess none')

/* ---------- the mock Figma host (runs in the page) ---------- */

function host(setup) {
	const deepFreeze = o => { if (o && typeof o === 'object') { Object.values(o).forEach(deepFreeze); Object.freeze(o) } return o }
	const clone = v => JSON.parse(JSON.stringify(v))
	const mixed = Symbol('figma.mixed')
	const events = {}, pageEvents = {}, store = new Map(Object.entries(setup.stored || {}))
	const fire = (bag, type, arg) => setTimeout(() => (bag[type] || []).forEach(f => f(arg)))   // Figma's events are async
	const log = window.__log = { toUI: [], fromUI: [], writes: [], varWrites: [], styleWrites: [], relaunch: [], showUI: null, undo: 0, resize: [] }
	const nodes = new Map()

	for (const spec of setup.nodes) {
		// Figma reports '' for a fill or stroke list that isn't linked to a paint style
		const node = { id: spec.id, name: spec.name, type: spec.type, fillStyleId: spec.fillStyleId || '', strokeStyleId: spec.strokeStyleId || '', resolvedVariableModes: spec.modes || {}, _put: {}, setRelaunchData: d => log.relaunch.push({ id: spec.id, d }) }
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
		findAll: test => [...nodes.values()].filter(test),
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
		variables: { getVariableByIdAsync: async id => vars.get(id) || null, getLocalVariablesAsync: async () => [...vars.values()].filter(v => !v.remote) },
		getLocalPaintStylesAsync: async () => [...styles.values()].filter(st => !st.remote),
		commitUndo: () => { log.undo++ },
		clientStorage: {
			getAsync: async k => store.get(k),
			setAsync: async (k, v) => { store.set(k, v) },
		},
		showUI(doc, options) {
			log.showUI = options
			// themeColors: Figma adds its --figma-color-* variables to the iframe. These dark
			// values are stand-ins (not Figma's), so the check can see that the panel uses them.
			if (options.themeColors) doc = doc.replace('<head>', '<head><style>:root{--figma-color-bg:#2c2c2c;--figma-color-bg-secondary:#383838;--figma-color-text:#ffffff;--figma-color-text-secondary:#b3b3b3;--figma-color-border:#4d4d4d}</style>')
			iframe = document.createElement('iframe')
			iframe.sandbox = 'allow-scripts'   // an opaque origin: the UI may not rely on storage or same-origin access
			iframe.title = 'color-space plugin'
			iframe.style.border = '0'   // Figma's panel frame has none, and pointer math in the checks reads the bare box
			iframe.width = options.width
			iframe.height = options.height
			iframe.srcdoc = doc
			document.body.append(iframe)
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

/* ---------- helpers ---------- */

const executablePath = [process.env.CHROME_PATH, chromium.executablePath(), '/usr/bin/google-chrome'].find(p => p && existsSync(p))
if (!executablePath) throw new Error('Chromium is not installed; run `npx playwright install chromium` or set CHROME_PATH')
const browser = await chromium.launch({ headless: true, executablePath })
const ORIGIN = 'http://localhost:9'
try {

	const solid = (r, g, b, extra = {}) => ({ type: 'SOLID', visible: true, opacity: 1, blendMode: 'NORMAL', color: { r, g, b }, ...extra })
	const rgbOf = p => [p.color.r, p.color.g, p.color.b]
	const docOf = profile => profile === 'DISPLAY_P3' ? { id: 'p3', scale: 1, dest: DEST.p3 } : { id: 'rgb', scale: 255, dest: DEST.rgb }
	const valuesIn = (profile, id, rgb) => { const d = docOf(profile); return space[d.id][id](...rgb.map(v => v * d.scale)) }
	// the fields print the atlas's fixed decimals (web/js/core.js decOf), so a shown value is within half a step
	const halfStep = id => classify(id).ch.map(c => 0.5 * 10 ** -decOf(c) + 1e-9)

	async function open(setup) {
		const context = await browser.newContext({ viewport: { width: 360, height: 520 } })
		await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: ORIGIN })
		const page = await context.newPage()
		const errors = []
		page.on('pageerror', e => errors.push(e.message))
		// Chromium logs the async clipboard's permissions-policy refusal; the UI catches it and falls back
		page.on('console', m => { if (m.type() === 'error' && !/Permissions policy violation: The Clipboard API/.test(m.text())) errors.push(m.text()) })
		// a fulfilled loopback URL: a secure context (as Figma's own page is) with no network
		await page.route(ORIGIN + '/**', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><meta charset="utf-8"><title>mock figma</title><body></body>' }))
		await page.goto(`${ORIGIN}/?cb=${Date.now()}`)
		await page.evaluate(`(${host})(${JSON.stringify(setup)}); window.__html__ = ${JSON.stringify(html).replace(/<\//g, '<\\/')};`)
		await page.addScriptTag({ content: code })
		const ui = page.frameLocator('iframe')
		await ui.locator('#spname').filter({ hasText: /\S/ }).waitFor({ state: 'attached' })
		await page.waitForFunction(() => window.__log.toUI.some(m => m.type === 'selection'))
		await page.waitForTimeout(50)
		return { page, ui, errors }
	}
	const inputs = ui => ui.locator('#channels .cv')
	// the space menu, as a person uses it: open, click the space
	const pickSpace = async (ui, id) => { await ui.locator('#spbtn').click(); await ui.locator(`#splist .sp[data-id="${id}"]`).click() }
	const spaceOf = ui => ui.locator('#spbtn').getAttribute('data-id')
	const shown = async ui => (await inputs(ui).evaluateAll(els => els.map(e => e.value))).map(Number)
	// the coordinates the UI holds at full precision: each bar's range input carries its channel unrounded
	const held = async ui => (await ui.locator('#channels .nrg').evaluateAll(els => els.map(e => e.getAttribute('aria-valuenow')))).map(Number)
	const settle = (page, n) => page.waitForFunction(n => window.__log.toUI.filter(m => m.type === 'selection').length > n, n)
	const selections = page => page.evaluate(() => window.__log.toUI.filter(m => m.type === 'selection').length)
	const lastSet = page => page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'set').at(-1))
	// what the panel says: the gamut status line, then the notes
	const notes = async ui => (await ui.locator('#gamut').innerText().catch(() => '')) + '\n' + (await ui.locator('#notes').innerText().catch(() => ''))

	/** Type a value into channel i and commit it, then wait for the write and the re-read. */
	async function edit(page, ui, i, value) {
		const before = await selections(page)
		const writes = await page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'set').length)
		await inputs(ui).nth(i).fill(String(value))
		await inputs(ui).nth(i).press('Tab')
		await page.waitForFunction(n => window.__log.fromUI.filter(m => m.type === 'set').length > n, writes)
		await settle(page, before)
		await page.waitForTimeout(30)
		return lastSet(page)
	}

	/**
	 * Expected write for "channel i of `id` set to v". `held` is the coordinates the UI holds:
	 * read from the paint at full precision, or, after its own edit, the ones it wrote from
	 * (the UI keeps them, so a gamut-mapped coordinate stays where it was picked).
	 */
	function expectWrite(profile, id, held, i, v) {
		const values = held.slice()
		values[i] = v
		return { ...gamutMap(space[id].oklch(...values), docOf(profile).dest), values }
	}

	// the field under the marker, read back from the plane's canvas (in that canvas's color space):
	// the kernel's color and the marker's geometry must agree
	// dx nudges the sample a pixel inward, for a marker that sits on the field's very edge
	const pixelUnderMarker = (frame, dx = 0) => frame.evaluate(dx => {
		const pl = document.getElementById('plane'), cv = pl.querySelector('canvas'), r = cv.getBoundingClientRect(), m = pl.querySelector('.cx').getBoundingClientRect()
		const x = Math.min(cv.width - 1, Math.floor((m.left + m.width / 2 - r.left) / r.width * cv.width)), y = Math.min(cv.height - 1, Math.floor((m.top + m.height / 2 - r.top) / r.height * cv.height))
		const ctx = cv.getContext('2d')
		return { rgb: [...ctx.getImageData(Math.max(0, x + dx), y, 1, 1).data], space: ctx.getContextAttributes().colorSpace }
	}, dx)
	// the GPU program links asynchronously: wait until the plane's pixels land
	const planePainted = frame => frame.waitForFunction(() => { const cv = document.querySelector('#plane canvas'); return cv.width > 0 && cv._key && cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data.some((v, i) => i % 4 === 3 && v > 0) }, null, { timeout: 30000 })

	/* ---------- 1. SRGB document ---------- */
	{
		const profile = 'SRGB'
		const card = { id: '1:1', name: 'Card', type: 'RECTANGLE', fills: [solid(1, 0.5, 0)], strokes: [solid(0, 0, 0, { opacity: 0.5 })] }
		const bind = id => ({ boundVariables: { color: { type: 'VARIABLE_ALIAS', id } } })
		// Bound uses an alias (Accent → Brand/500) in mode m1; Library is bound to a remote token
		const bound = { id: '1:2', name: 'Bound', type: 'ELLIPSE', fills: [solid(0.2, 0.4, 0.6, bind('VariableID:1:9'))], strokes: [], modes: { C1: 'm1' } }
		const library = { id: '1:5', name: 'Library', type: 'ELLIPSE', fills: [solid(0.1, 0.1, 0.1, bind('VariableID:lib'))], strokes: [], modes: { CL: 'l1' } }
		const libStyled = { id: '1:6', name: 'LibStyled', type: 'RECTANGLE', fills: [solid(0.5, 0.5, 0.5)], strokes: [], fillStyleId: 'S:lib' }
		const variables = {
			'VariableID:1:9': { name: 'Accent', collection: 'C1', values: { m1: { type: 'VARIABLE_ALIAS', id: 'VariableID:1:8' }, m2: { r: 1, g: 1, b: 1, a: 1 } } },
			'VariableID:1:8': { name: 'Brand/500', collection: 'C1', values: { m1: { r: 0.2, g: 0.4, b: 0.6, a: 0.8 }, m2: { r: 0, g: 0, b: 0, a: 1 } } },
			'VariableID:lib': { name: 'Gray/900', collection: 'CL', remote: true, values: { l1: { r: 0.1, g: 0.1, b: 0.1, a: 1 } } },
		}
		const styles = { 'S:0123abcd,1:7': { name: 'Accent fill', paints: [solid(0.9, 0.1, 0.3)] }, 'S:lib': { name: 'Library gray', remote: true, paints: [solid(0.5, 0.5, 0.5)] } }
		const label = { id: '1:3', name: 'Label', type: 'TEXT', fills: 'mixed', strokes: [] }
		const styled = { id: '1:4', name: 'Styled', type: 'RECTANGLE', fills: [solid(0.9, 0.1, 0.3)], strokes: [], fillStyleId: 'S:0123abcd,1:7' }
		const { page, ui, errors } = await open({ profile, editorType: 'figma', nodes: [card, bound, label, styled, library, libStyled], variables, styles, selection: ['1:1', '1:2'] })

		const opts = await page.evaluate(() => window.__log.showUI)
		ok(opts.themeColors === true && opts.width === 264, `showUI options ${JSON.stringify(opts)}`)
		const fromUI = await page.evaluate(() => window.__log.fromUI)
		ok(fromUI[0]?.type === 'ready', 'UI says ready first')

		// read → display
		ok(await ui.locator('#profile').textContent() === 'sRGB', 'profile tag reads sRGB')
		ok(await spaceOf(ui) === 'oklch' && await ui.locator('#spname').innerText() === 'OKLCH', 'default space is oklch, by its title')
		await page.waitForTimeout(100)
		const hClosed = await page.evaluate(() => window.__log.resize.at(-1)[1])
		await ui.locator('#spbtn').click()
		ok(await ui.locator('#splist .sp').count() === Object.keys(space).length, `space menu lists all ${Object.keys(space).length} spaces`)
		ok(await ui.locator('#splist .sp[data-id="oklch"]').evaluate(e => { const r = e.getBoundingClientRect(), l = e.parentElement.getBoundingClientRect(); return e.classList.contains('on') && r.top >= l.top && r.bottom <= l.bottom }), 'the menu opens on the current space, in view and highlighted')
		ok(await ui.locator('#spq').inputValue() === 'OKLCH' && await ui.locator('#spq').evaluate(i => i.selectionStart === 0 && i.selectionEnd === i.value.length), 'the search opens holding the current space\'s name, selected, as Figma\'s font menu does')
		// a plugin frame can't paint outside itself: the window grows to hold the open menu, and shrinks back when it closes
		await page.waitForTimeout(100)
		const menuBottom = await ui.locator('#spmenu').evaluate(m => m.getBoundingClientRect().bottom)
		ok((await page.evaluate(() => window.__log.resize.at(-1)[1])) >= menuBottom, `the window holds the open menu (${menuBottom})`)
		// keys: ↓ then ↑ return to the same row (A → B → A), Enter on the current space closes without a change
		await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowUp')
		ok(await ui.locator('#splist .sp.on').getAttribute('data-id') === 'oklch', '↓↑ return to the current space')
		const storedBefore = await page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'store').length)
		await page.keyboard.press('Enter')
		ok(await ui.locator('#spmenu').isHidden() && await page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'store').length) === storedBefore, 'Enter on the current space closes the menu and changes nothing')
		await ui.locator('#spbtn').click()
		await page.keyboard.press('Escape')
		ok(await ui.locator('#spmenu').isHidden(), 'Escape closes the menu')
		// a press outside only closes it: the control under the press (here another paint's row) doesn't act
		await ui.locator('#spbtn').click()
		const cur = await ui.locator('.paint[aria-pressed="true"]').getAttribute('data-key')
		await ui.locator('.paint').nth(1).click()
		await page.waitForTimeout(100)
		ok(await ui.locator('#spmenu').isHidden() && await ui.locator('.paint[aria-pressed="true"]').getAttribute('data-key') === cur, 'a press outside closes the menu and nothing else')
		await page.waitForTimeout(100)
		ok((await page.evaluate(() => window.__log.resize.at(-1)[1])) === hClosed, 'and the window returns to the content\'s height')
		// the tooltip stays secondary: any press dismisses it
		await ui.locator('#profile').hover()
		await ui.locator('#tip.on').waitFor({ state: 'attached', timeout: 3000 })
		await page.mouse.down(); await page.mouse.up()
		ok(!(await ui.locator('#tip').evaluate(t => t.classList.contains('on'))), 'a press dismisses the tooltip')
		// focus after a press (not from the keyboard) brings no tooltip; focus from the keyboard does
		const tipOn = () => ui.locator('#tip').evaluate(t => t.classList.contains('on'))
		await ui.locator('#pairs button').nth(0).click()   // the press focuses the button; its hover tip would wait 300 ms
		ok(!(await tipOn()), 'focus that follows a press shows no tooltip')
		await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab')
		ok(await tipOn(), 'focus from the keyboard shows the tooltip')
		await page.mouse.down(); await page.mouse.up()
		ok(await ui.locator('.paint').count() === 3, 'three solid paints listed (Card fill, Card stroke, Bound fill)')
		let rgb = [1, 0.5, 0]
		close(await shown(ui), valuesIn(profile, 'oklch', rgb), halfStep('oklch'), 'sRGB read: oklch values')
		const [L, C, H] = valuesIn(profile, 'oklch', rgb)
		ok(await ui.locator('#css-1').inputValue() === `oklch(${+L.toFixed(4)} ${+C.toFixed(4)} ${+H.toFixed(2)})`, 'css oklch()')
		ok(await ui.locator('#css-2').inputValue() === '#ff8000', `css hex: ${await ui.locator('#css-2').inputValue()}`)
		ok(await ui.locator('#notes').isHidden(), 'no notes for an in-gamut sRGB paint')

		// theme: the panel takes Figma's colors
		const theme = await ui.locator('body').evaluate(b => [getComputedStyle(b).backgroundColor, getComputedStyle(b).color])
		ok(theme[0] === 'rgb(44, 44, 44)' && theme[1] === 'rgb(255, 255, 255)', `themeColors applied: ${theme}`)

		// edit → set → write → re-read (in gamut)
		let exp = expectWrite(profile, 'oklch', valuesIn(profile, 'oklch', rgb), 1, 0.1)
		ok(!exp.mapped, 'test premise: oklch C 0.1 stays in sRGB')
		let set = await edit(page, ui, 1, 0.1)
		ok(set.id === '1:1' && set.kind === 'fills' && set.index === 0 && set.profile === 'SRGB', `set message target ${JSON.stringify(set)}`)
		close(rgbOf({ color: set.color }), exp.rgb, 1e-12, 'sRGB set color')
		let written = await page.evaluate(() => window.__paints('1:1', 'fills'))
		close(rgbOf(written[0]), exp.rgb, 1e-12, 'sRGB fill written')
		ok(written[0].opacity === 1 && written[0].blendMode === 'NORMAL' && written[0].visible === true, 'other paint fields kept')
		close(await shown(ui), exp.values, halfStep('oklch'), 'UI shows the written coordinates')
		ok(Math.abs((await shown(ui))[1] - 0.1) < 5e-5, 'C reads back 0.1')
		rgb = exp.rgb

		// out of gamut: CSS Color 4 gamut mapping, then clamp
		exp = expectWrite(profile, 'oklch', exp.values, 1, 0.37)
		ok(exp.mapped, 'test premise: oklch C 0.37 is outside sRGB')
		set = await edit(page, ui, 1, 0.37)
		close(rgbOf({ color: set.color }), exp.rgb, 1e-12, 'sRGB gamut-mapped set color')
		ok(set.color.r >= 0 && set.color.r <= 1 && set.color.g >= 0 && set.color.g <= 1 && set.color.b >= 0 && set.color.b <= 1, 'mapped color within [0, 1]')
		ok(/^Outside sRGB/.test(await ui.locator('#gamut').innerText()), 'the status line says the coordinate is outside sRGB')
		ok(Math.abs((await shown(ui))[1] - 0.37) < 5e-5, 'the picked chroma stays: the coordinate, not the mapped color')
		ok(valuesIn(profile, 'oklch', rgbOf({ color: set.color }))[1] < 0.37, 'the written color carries the reduced chroma')

		// the note belongs to that write: an edit made in Figma afterwards drops it
		let n = await selections(page)
		await page.evaluate(() => window.__edit('1:1', 'fills', [{ type: 'SOLID', visible: true, opacity: 1, blendMode: 'NORMAL', color: { r: 0.2, g: 0.4, b: 0.6 } }]))
		await settle(page, n)
		await page.waitForTimeout(30)
		ok(await ui.locator('#gamut').innerText() === 'In sRGB', 'after an edit made in Figma, the status reads its color: in sRGB')
		rgb = [0.2, 0.4, 0.6]

		// another space, persisted through clientStorage
		await pickSpace(ui, 'lab')
		await page.waitForFunction(() => window.__stored('space') === 'lab')
		ok(true, 'space saved to clientStorage')
		ok(await inputs(ui).count() === 3, 'lab shows three channels')
		close(await shown(ui), valuesIn(profile, 'lab', rgb), halfStep('lab'), 'lab values of the current fill')
		exp = expectWrite(profile, 'lab', valuesIn(profile, 'lab', rgb), 2, 10)
		set = await edit(page, ui, 2, 10)
		close(rgbOf({ color: set.color }), exp.rgb, 1e-12, 'lab b edit written')
		rgb = exp.rgb

		// the stroke: a different paint of the same node, opacity kept, fills untouched
		await ui.locator('.paint', { hasText: 'stroke 1' }).click()
		close(await shown(ui), valuesIn(profile, 'lab', [0, 0, 0]), halfStep('lab'), 'stroke read')
		exp = expectWrite(profile, 'lab', valuesIn(profile, 'lab', [0, 0, 0]), 0, 40)
		set = await edit(page, ui, 0, 40)
		ok(set.kind === 'strokes' && set.index === 0, 'stroke set targets strokes[0]')
		const strokes = await page.evaluate(() => window.__paints('1:1', 'strokes'))
		close(rgbOf(strokes[0]), exp.rgb, 1e-12, 'stroke written')
		ok(strokes[0].opacity === 0.5, 'stroke opacity kept')
		close(rgbOf((await page.evaluate(() => window.__paints('1:1', 'fills')))[0]), rgb, 1e-12, 'fill untouched by the stroke edit')
		ok(/ \/ 0\.5\)$/.test(await ui.locator('#css-1').inputValue()) && (await ui.locator('#css-2').inputValue()).endsWith('80'), 'opacity appears in the CSS')

		// copy: the iframe has no clipboard-write permission policy (whether Figma's does is
		// unverified), so this exercises the select + execCommand('copy') fallback
		const want = await ui.locator('#css-1').inputValue()
		await ui.locator('[data-copy="css-1"]').click()
		await ui.locator('[data-copy="css-1"][aria-label="Copied"], [data-copy="css-1"][aria-label="Selected"]').waitFor({ timeout: 10000 }).catch(() => {})   // the label holds 1.2 s; a loaded machine can be slower than 2 s to show it
		const copied = await ui.locator('[data-copy="css-1"]').getAttribute('aria-label')
		ok(copied === 'Copied', `copy button feedback: ${copied}`)
		ok(await page.evaluate(() => navigator.clipboard.readText()) === want, 'clipboard holds the oklch() text')

		// a variable-bound paint is edited where its color lives: through the alias, the token's value in the node's mode
		await ui.locator('.paint', { hasText: 'Bound' }).click()
		ok(await ui.locator('.paint', { hasText: 'Bound' }).locator('.src').innerText() === 'Brand/500', 'a bound paint names the token its alias resolves to')
		ok(/Editing the variable Brand\/500/.test(await notes(ui)), 'bound paint note names the token')
		ok(!(await inputs(ui).first().evaluate(e => e.readOnly)), 'a local token is editable')
		let nodeWrites = await page.evaluate(() => window.__log.writes.length)
		exp = expectWrite(profile, 'lab', valuesIn(profile, 'lab', [0.2, 0.4, 0.6]), 0, 60)
		await edit(page, ui, 0, 60)
		const tok = await page.evaluate(() => window.__var('VariableID:1:8'))
		close([tok.m1.r, tok.m1.g, tok.m1.b], exp.rgb, 1e-12, 'the token\'s value in mode m1 is the edit')
		ok(tok.m1.a === 0.8 && tok.m2.r === 0, 'the token keeps its alpha and its other modes')
		ok((await page.evaluate(() => window.__var('VariableID:1:9'))).m1.type === 'VARIABLE_ALIAS', 'the alias stays an alias')
		ok(await page.evaluate(() => window.__log.writes.length) === nodeWrites, 'the layer keeps its binding: no raw paint written')

		// a paint style: the style's paint is edited, and every layer linked to it follows
		n = await selections(page)
		await page.evaluate(() => window.__select(['1:4']))
		await settle(page, n)
		ok(/Editing the style Accent fill/.test(await notes(ui)), 'style-linked paint note names the style')
		exp = expectWrite(profile, 'lab', valuesIn(profile, 'lab', [0.9, 0.1, 0.3]), 0, 40)
		await edit(page, ui, 0, 40)
		close(rgbOf((await page.evaluate(() => window.__style('S:0123abcd,1:7')))[0]), exp.rgb, 1e-12, 'the style\'s paint is the edit')
		close(rgbOf((await page.evaluate(() => window.__paints('1:4', 'fills')))[0]), exp.rgb, 1e-12, 'the linked layer follows its style')
		ok(await page.evaluate(() => window.__log.writes.length) === nodeWrites, 'the layer keeps its style link: no raw paint written')

		// library tokens and styles can't be edited from this file: shown, locked, and refused by code.js
		for (const [id, what] of [['1:5', 'variable Gray/900'], ['1:6', 'style Library gray']]) {
			n = await selections(page)
			await page.evaluate(id => window.__select([id]), id)
			await settle(page, n)
			ok(await inputs(ui).first().evaluate(e => e.readOnly) && await ui.locator('#channels .nrg').first().getAttribute('aria-disabled') === 'true', `remote ${what}: locked`)
			ok(new RegExp(`${what.replace('/', '\\/')}, which this file can't edit`).test(await notes(ui)), `remote ${what}: note`)
		}
		const counts = () => page.evaluate(() => [window.__log.writes.length, window.__log.varWrites.length, window.__log.styleWrites.length].join())
		const before = await counts()
		await page.evaluate(() => ['1:5', '1:6'].forEach(id => figma.ui.onmessage({ type: 'set', id, kind: 'fills', index: 0, profile: 'SRGB', color: { r: 0, g: 0, b: 0 } })))
		await page.waitForTimeout(100)
		ok(await counts() === before, 'code.js refuses set on remote variables and styles')
		n = await selections(page)
		await page.evaluate(() => window.__select(['1:1', '1:2']))
		await settle(page, n)

		// an edit made in Figma while the plugin is open (nodechange)
		await ui.locator('.paint', { hasText: 'fill 1' }).first().click()
		n = await selections(page)
		await page.evaluate(() => window.__edit('1:1', 'fills', [{ type: 'SOLID', visible: true, opacity: 1, blendMode: 'NORMAL', color: { r: 0, g: 0.5, b: 1 } }]))
		await settle(page, n)
		await page.waitForTimeout(30)
		close(await shown(ui), valuesIn(profile, 'lab', [0, 0.5, 1]), halfStep('lab'), 'external fill edit shows up')

		// text with mixed fills
		n = await selections(page)
		await page.evaluate(() => window.__select(['1:3']))
		await settle(page, n)
		ok(await ui.locator('#empty').isVisible() && /mixed fills/.test(await notes(ui)), 'mixed text fills: empty state with a note')
		n = await selections(page)
		await page.evaluate(() => window.__select(['1:1', '1:3']))
		await settle(page, n)
		ok(await ui.locator('.paint').count() === 2 && /mixed fills/.test(await notes(ui)), 'mixed text next to other layers: their paints, plus the note')

		// an error from the main thread belongs to its paint: selecting another layer drops it
		await page.evaluate(() => figma.ui.postMessage({ type: 'error', text: 'Write failed (mock).' }))
		await ui.locator('#notes', { hasText: 'Write failed' }).waitFor()
		n = await selections(page)
		await page.evaluate(() => window.__select(['1:4']))
		await settle(page, n)
		ok(!/Write failed/.test(await notes(ui)), 'main-thread error dropped when the selection moves to another paint')

		// empty selection
		n = await selections(page)
		await page.evaluate(() => window.__select([]))
		await settle(page, n)
		ok(await ui.locator('#empty').isVisible() && await ui.locator('#channels').isHidden(), 'empty selection')

		// structure (labels, names, roles): axe without color-contrast, since the theme colors here are stand-ins
		await page.evaluate(() => window.__select(['1:1']))
		await ui.locator('#channels').waitFor()
		const axe = await new AxeBuilder({ page }).include('iframe').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).disableRules(['color-contrast']).analyze()
		ok(!axe.violations.length, `axe: ${axe.violations.map(v => `${v.id}: ${v.nodes.map(x => x.target.join(' ')).join(', ')}`).join('; ')}`)

		if (process.env.FIGMA_SHOTS) await page.locator('iframe').screenshot({ path: `${process.env.FIGMA_SHOTS}/figma-srgb.png` })
		ok(!errors.length, `sRGB page errors: ${errors.join(' | ')}`)
		await page.context().close()
	}

	/* ---------- 2. DISPLAY_P3 document ---------- */
	{
		const profile = 'DISPLAY_P3'
		const red = { id: '2:1', name: 'P3 red', type: 'RECTANGLE', fills: [solid(1, 0, 0)], strokes: [] }
		const { page, ui, errors } = await open({ profile, editorType: 'figma', nodes: [red], selection: ['2:1'], stored: { space: 'hct' } })

		ok(await spaceOf(ui) === 'hct', 'stored space (hct) restored')
		ok(await ui.locator('#profile').textContent() === 'Display P3', 'profile tag reads Display P3')
		let rgb = [1, 0, 0]
		close(await shown(ui), valuesIn(profile, 'hct', rgb), halfStep('hct'), 'P3 read: hct values of P3 red')
		ok(await ui.locator('#css-2').inputValue() === 'color(display-p3 1 0 0)', 'css color(display-p3)')
		const [L, C, H] = space.p3.oklch(...rgb)
		ok(await ui.locator('#css-1').inputValue() === `oklch(${+L.toFixed(4)} ${+C.toFixed(4)} ${+H.toFixed(2)})`, 'P3 css oklch()')
		ok(await ui.locator('#notes').isHidden(), 'no notes: P3 red is inside the document gamut')

		await pickSpace(ui, 'oklch')
		close(await shown(ui), valuesIn(profile, 'oklch', rgb), halfStep('oklch'), 'P3 read: oklch values')
		// the plane paints in the file's space: P3 red is 255,0,0 on a display-p3 canvas, not its sRGB clip
		const frame = page.frames().find(f => f !== page.mainFrame())
		await planePainted(frame)
		const px = await pixelUnderMarker(frame, -1)   // P3 red sits on the field's edge: past it, at this lightness and hue, no light exists (void)
		ok(px.space === 'display-p3', `P3 file: the plane canvas is display-p3 (${px.space})`)
		close(px.rgb.slice(0, 3), [255, 0, 0], 8, 'P3 file: the pixel beside the marker is P3 red within one pixel\'s step (its sRGB clip would read about 234, 51, 35)')

		// a color outside sRGB but inside P3 is written as is: the document gamut is P3
		let exp = expectWrite(profile, 'oklch', valuesIn(profile, 'oklch', rgb), 1, 0.27)
		ok(!exp.mapped, 'test premise: C 0.27 at P3 red\'s L and H is inside P3')
		ok(gamutMap([L, 0.27, H], DEST.rgb).mapped, 'test premise: the same color is outside sRGB')
		let set = await edit(page, ui, 1, 0.27)
		ok(set.profile === 'DISPLAY_P3', 'set carries the P3 profile')
		close(rgbOf({ color: set.color }), exp.rgb, 1e-12, 'P3 set color (unmapped)')
		close(rgbOf((await page.evaluate(() => window.__paints('2:1', 'fills')))[0]), exp.rgb, 1e-12, 'P3 fill written')
		ok(await ui.locator('#notes').isHidden(), 'no gamut note for a P3-inside color')
		ok(Math.abs((await shown(ui))[1] - 0.27) < 5e-5, 'C reads back 0.27')
		rgb = exp.rgb

		// outside P3: mapped into P3
		exp = expectWrite(profile, 'oklch', exp.values, 1, 0.4)
		ok(exp.mapped, 'test premise: C 0.4 is outside P3')
		set = await edit(page, ui, 1, 0.4)
		close(rgbOf({ color: set.color }), exp.rgb, 1e-12, 'P3 gamut-mapped set color')
		ok(/^Outside Display P3/.test(await ui.locator('#gamut').innerText()), 'P3 out-of-gamut status')
		rgb = exp.rgb

		// a palette lens on a P3 canvas: the cells are sRGB palette colors, re-encoded as P3 (uEnc), so the cell under the marker reads as the written fill
		await ui.locator('#quant').click()
		await ui.locator('#qmenu .opt', { hasText: /^Tailwind$/ }).click()
		const nq = await selections(page)
		const pb = await ui.locator('#plane').boundingBox()
		await page.mouse.click(pb.x + pb.width * 0.3, pb.y + pb.height * 0.4)
		await settle(page, nq)
		await planePainted(frame)
		const tw = rgbOf((await page.evaluate(() => window.__paints('2:1', 'fills')))[0])
		ok(PALETTES.tailwind.some(([, c]) => c.join() === space.p3.rgb(...tw).map(Math.round).join()), 'P3 file, Tailwind: the fill is a Tailwind color in P3')
		// the cell itself is a Tailwind color re-encoded as P3 (uEnc), not its sRGB bytes shown on a P3 canvas; which
		// cell lies under a marker on a cell's border is the kernel's fast-candidate law, pinned by the site's checks
		const cell = (await pixelUnderMarker(frame)).rgb.slice(0, 3)
		ok(PALETTES.tailwind.some(([, c]) => space.rgb.p3(...c).every((v, k) => Math.abs(Math.round(v * 255) - cell[k]) <= 2)), `P3 file, Tailwind: the cell under the marker is a Tailwind color in P3 (${cell})`)
		await ui.locator('#quant').click()
		await ui.locator('#qmenu .opt', { hasText: /^smooth$/ }).click()
		// the file's profile changes under the UI: the main thread refuses the stale write and re-reads
		await page.evaluate(() => window.__profile('SRGB'))
		const before = await page.evaluate(() => window.__paints('2:1', 'fills'))
		const n = await selections(page)
		await inputs(ui).nth(0).fill('0.5')
		await inputs(ui).nth(0).press('Tab')
		await settle(page, n)
		await page.waitForTimeout(30)
		ok(JSON.stringify(await page.evaluate(() => window.__paints('2:1', 'fills'))) === JSON.stringify(before), 'stale-profile write refused')
		ok(await ui.locator('#profile').textContent() === 'sRGB', 'UI follows the new profile')
		ok(!/Display P3/.test(await ui.locator('#gamut').innerText()), 'the status follows the new profile')

		if (process.env.FIGMA_SHOTS) await page.locator('iframe').screenshot({ path: `${process.env.FIGMA_SHOTS}/figma-p3.png` })
		ok(!errors.length, `P3 page errors: ${errors.join(' | ')}`)
		await page.context().close()
	}

	/* ---------- 3. the picker: plane, wheel, bars, steps ---------- */
	{
		const profile = 'SRGB'
		const swatch = { id: '4:1', name: 'Swatch', type: 'RECTANGLE', fills: [solid(0.2, 0.5, 0.8)], strokes: [] }
		const { page, ui, errors } = await open({ profile, editorType: 'figma', nodes: [swatch], selection: ['4:1'] })
		const frame = page.frames().find(f => f !== page.mainFrame())
		const writesOf = () => page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'set'))
		const fill = async () => rgbOf((await page.evaluate(() => window.__paints('4:1', 'fills')))[0])
		const underMarker = () => pixelUnderMarker(frame)
		const painted = () => planePainted(frame)
		// expected: the coordinate's own color (a marker past the gamut sits on the ghost, not on the mapped fill)
		const own = async id => space[id].rgb(...await held(ui)).map(v => Math.min(255, Math.max(0, v)))
		const near8 = (got, rgb, tol, msg) => close(got.rgb.slice(0, 3), rgb.map(Math.round), tol, msg)

		await painted()
		ok(await ui.locator('#pairs [aria-pressed="true"]').innerText() === 'C × L', 'oklch opens on its C × L plane (the hue held)')
		near8(await underMarker(), await own('oklch'), 3, 'oklch plane: the pixel under the marker is the coordinate\'s color')
		const bar = await frame.evaluate(() => { const cv = document.querySelector('#channels .bar2 canvas'); return !cv.hidden && cv.getContext('2d').getImageData(0, 0, cv.width, 1).data.some((v, i) => i % 4 === 3 && v > 0) })
		ok(bar, 'the L bar is painted by the GPU kernel')

		// a drag across the plane: live writes, then one commit closes one undo step
		let box = await ui.locator('#plane').boundingBox()
		const undo0 = await page.evaluate(() => window.__log.undo), sets0 = (await writesOf()).length
		await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5)
		await page.mouse.down()
		for (let k = 1; k <= 6; k++) { await page.mouse.move(box.x + box.width * (0.2 + k * 0.03), box.y + box.height * (0.5 - k * 0.02)); await page.waitForTimeout(20) }
		await page.mouse.up()
		await page.waitForTimeout(150)
		const drag = (await writesOf()).slice(sets0)
		ok(drag.length >= 2 && drag.slice(0, -1).every(m => !m.commit) && drag.at(-1).commit, `drag: live writes then one commit (${drag.map(m => m.commit ? 'C' : 'l').join('')})`)
		ok(await page.evaluate(() => window.__log.undo) === undo0 + 1, 'drag: one undo step')
		const H0 = valuesIn(profile, 'oklch', [0.2, 0.5, 0.8])[2]
		const shownDrag = await held(ui)
		ok(Math.abs(shownDrag[2] - H0) < 0.1, `drag holds the hue: ${shownDrag[2]} vs ${H0}`)
		close(shownDrag.slice(0, 2), [0.62, 0.38 * 0.4], [0.01, 0.005], 'drag lands where the pointer let go (L 0.62, C 0.152)')
		const exp = gamutMap(space.oklch.oklch(...shownDrag), DEST.rgb)
		close(await fill(), exp.rgb, 0.003, 'drag: the fill is the picked color')

		// the status line is one line in and out of the gamut, so a drag across the gamut moves nothing below it
		const gh = () => ui.locator('#gamut').evaluate(g => [g.textContent, g.getBoundingClientRect().height])
		box = await ui.locator('#plane').boundingBox()
		const r0 = await page.evaluate(() => window.__log.resize.length)
		await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5)
		await page.mouse.down()
		const g1 = await gh()
		await page.mouse.move(box.x + box.width * 0.98, box.y + box.height * 0.5, { steps: 6 })
		const g2 = await gh()
		await page.mouse.up()
		await page.waitForTimeout(150)
		ok(/^In sRGB$/.test(g1[0]) && /^Outside sRGB/.test(g2[0]) && g1[1] === g2[1], `the status crosses the gamut on one line (${g1[1]} → ${g2[1]} px)`)
		ok((await page.evaluate(n => window.__log.resize.slice(n), r0)).length === 0, 'a drag across the gamut doesn\'t resize the window')

		// gestures: the plane never repaints for a drag across it; the cursor hides while dragging and comes back on release
		const planePaints = () => frame.evaluate(() => document.querySelector('#plane canvas')._paints || 0)
		const dragging = () => frame.evaluate(() => document.documentElement.classList.contains('drag'))
		const undos = () => page.evaluate(() => window.__log.undo)
		let p0 = await planePaints(), u0 = await undos()
		box = await ui.locator('#plane').boundingBox()
		await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.6)
		await page.mouse.down()
		await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.4, { steps: 4 })
		ok(await dragging(), 'the cursor hides during a drag')
		await page.mouse.up()
		await page.waitForTimeout(150)
		ok(!(await dragging()), 'the cursor comes back on release')
		ok(await planePaints() === p0, `a drag across the plane repaints nothing (${p0} → ${await planePaints()})`)
		ok(await undos() === u0 + 1, 'and closes one undo step')

		// past the plane's edge the pick holds at the edge (here past its left, still inside the frame)
		box = await ui.locator('#plane').boundingBox()
		await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5)
		await page.mouse.down()
		await page.mouse.move(box.x - 6, box.y + box.height * 0.5, { steps: 3 })
		await page.mouse.up()
		await page.waitForTimeout(150)
		ok((await held(ui))[1] === 0, `a drag past the left edge holds chroma at 0 (${(await held(ui))[1]})`)

		// a release the frame never sees (let go outside it): the next move without a button ends the gesture, once,
		// and the next press starts a fresh one
		u0 = await undos()
		box = await ui.locator('#plane').boundingBox()
		await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5)
		await page.mouse.down()
		await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.5, { steps: 2 })
		await page.mouse.move(500, box.y + box.height * 0.5)   // out of the 300 px frame, which keeps no capture here
		await page.mouse.up()
		ok(await dragging(), 'test premise: the frame missed the release')
		await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.2)
		await page.waitForTimeout(150)
		ok(!(await dragging()) && await undos() === u0 + 1, 'the next buttonless move ends the gesture with one commit')
		const before = await held(ui)
		await page.mouse.click(box.x + box.width * 0.25, box.y + box.height * 0.75)
		await page.waitForTimeout(150)
		ok((await held(ui))[0] !== before[0] && await undos() === u0 + 2, 'the next press picks and commits again')

		// a re-read that lands mid-drag (an edit made in Figma, here) never moves the coordinates under the pointer
		await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.4)
		await page.mouse.down()
		await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.4, { steps: 2 })
		const mid = await held(ui)
		const nre = await selections(page)
		await page.evaluate(() => window.__edit('4:1', 'fills', [{ type: 'SOLID', visible: true, opacity: 1, blendMode: 'NORMAL', color: { r: 0, g: 1, b: 0 } }]))
		await settle(page, nre)
		await page.waitForTimeout(50)
		ok(JSON.stringify(await held(ui)) === JSON.stringify(mid), 'a re-read mid-drag leaves the coordinates where the pointer put them')
		await page.mouse.up()
		await page.waitForTimeout(150)

		// the window losing focus mid-drag ends it too
		u0 = await undos()
		await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5)
		await page.mouse.down()
		await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5, { steps: 2 })
		await frame.evaluate(() => dispatchEvent(new Event('blur')))
		await page.waitForTimeout(100)
		ok(!(await dragging()) && await undos() === u0 + 1, 'blur mid-drag: the gesture ends with one commit')
		await page.mouse.up()
		await page.waitForTimeout(100)
		ok(await undos() === u0 + 1, 'the late release adds nothing')

		// a bar: the pointer's place along the knob's travel is the value; past its end, the end
		const bar0 = await ui.locator('#channels .bar2').first().boundingBox(), kw = await ui.locator('#channels .nrg').first().evaluate(k => k.offsetWidth)
		u0 = await undos()
		await page.mouse.move(bar0.x + kw / 2 + (bar0.width - kw) * 0.25, bar0.y + bar0.height / 2)
		await page.mouse.down()
		ok(Math.abs((await held(ui))[0] - 0.25) < 0.01, `bar press at a quarter of the travel: L 0.25 (${(await held(ui))[0]})`)
		await page.mouse.move(bar0.x - 4, bar0.y + bar0.height / 2, { steps: 3 })
		await page.mouse.up()
		await page.waitForTimeout(150)
		ok((await held(ui))[0] === 0 && await undos() === u0 + 1, 'bar drag past its start holds at 0, one undo step')
		// the knob sits on its own color: the C bar's pixel under its knob's centre is the coordinate's color
		await inputs(ui).nth(0).fill('0.5')
		await inputs(ui).nth(0).press('Tab')
		await page.waitForTimeout(150)
		await painted()
		const knobMid = await frame.evaluate(() => {
			const bar = document.querySelectorAll('#channels .bar2')[1], cv = bar.querySelector('canvas'), k = bar.querySelector('.nrg').getBoundingClientRect(), r = cv.getBoundingClientRect()
			return [...cv.getContext('2d').getImageData(Math.min(cv.width - 1, Math.floor((k.left + k.width / 2 - r.left) / r.width * cv.width)), 0, 1, 1).data]
		})
		near8({ rgb: knobMid }, await own('oklch'), 4, 'the C bar\'s pixel under its knob is the coordinate\'s color')

		// zero chroma keeps the hue: the UI's own coordinates outlive the achromatic paint
		await inputs(ui).nth(1).fill('0')
		await inputs(ui).nth(1).press('Tab')
		await page.waitForTimeout(100)
		await inputs(ui).nth(1).fill('0.1')
		await inputs(ui).nth(1).press('Tab')
		await page.waitForTimeout(100)
		ok(Math.abs((await held(ui))[2] - H0) < 1e-9, `hue survives zero chroma: ${(await held(ui))[2]}`)
		close(valuesIn(profile, 'oklch', await fill()).slice(1), [0.1, H0], [5e-4, 0.5], 'the fill carries that hue again')

		// scrub: dragging a field's letter moves its channel by the span over 300 px, one undo step; a hue wraps
		const scrubBy = async (i, dx) => {
			const l = await ui.locator('#channels .cl').nth(i).boundingBox()
			await page.mouse.move(l.x + l.width / 2, l.y + l.height / 2)
			await page.mouse.down()
			for (let k = 1; k <= 5; k++) await page.mouse.move(l.x + l.width / 2 + dx * k / 5, l.y + l.height / 2)
			await page.mouse.up()
			await page.waitForTimeout(150)
		}
		const sc0 = await held(ui), undoS = await page.evaluate(() => window.__log.undo)
		await scrubBy(0, -30)
		const sc1 = await held(ui)
		ok(Math.abs(sc1[0] - (sc0[0] - 0.1)) < 1e-9 && sc1[1] === sc0[1] && sc1[2] === sc0[2], `scrub L by −30 px: −0.1, the rest held (${sc0[0]} → ${sc1[0]})`)
		ok(await page.evaluate(() => window.__log.undo) === undoS + 1, 'scrub: one undo step')
		await inputs(ui).nth(2).fill('10')
		await inputs(ui).nth(2).press('Tab')
		await page.waitForTimeout(100)
		await scrubBy(2, -60)   // −72°: below 0, the hue wraps to 298
		ok(Math.abs((await held(ui))[2] - 298) < 1e-6, `scrub H below 0 wraps (${(await held(ui))[2]})`)
		await scrubBy(2, 30)
		await scrubBy(2, 30)   // two strokes: one 60 px stroke would leave the 300 px frame, which keeps no capture here
		ok(Math.abs((await held(ui))[2] - 10) < 1e-6, `scrub H back in two strokes: the same hue (${(await held(ui))[2]})`)

		// steps: every pick lands on a cell centre, on the plane and on the bars
		const quant = async label => { await ui.locator('#quant').click(); await ui.locator('#qmenu .opt', { hasText: new RegExp(`^${label}$`) }).click() }
		await quant('10-step')
		await page.waitForFunction(() => window.__stored('quant') === 10)
		await painted()
		box = await ui.locator('#plane').boundingBox()
		await page.mouse.click(box.x + box.width * 0.33, box.y + box.height * 0.27)
		await page.waitForTimeout(150)
		close((await shown(ui)).slice(0, 2), [0.75, 0.14], [5e-4, 5e-5], 'stepped plane pick: L and C at cell centres (0.75, 0.14)')
		await ui.locator('#channels .nrg').nth(0).focus()
		await page.keyboard.press('ArrowRight')
		await page.waitForTimeout(100)
		ok(Math.abs((await shown(ui))[0] - 0.85) < 5e-4, `stepped bar key: L to the next cell centre (${(await shown(ui))[0]})`)
		// a palette lens: the pick snaps to the nearest Tailwind token, and the field names it
		await quant('Tailwind')
		await page.waitForFunction(() => window.__stored('quant') === 'tailwind')
		ok(await ui.locator('#gamut').innerText() === 'Snapped to Tailwind', 'the status names the palette lens')
		await painted()
		box = await ui.locator('#plane').boundingBox()
		await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.4)
		await page.waitForTimeout(150)
		const tw = (await fill()).map(v => Math.round(v * 255)), token = PALETTES.tailwind.find(([, c]) => c.join() === tw.join())
		ok(!!token, `Tailwind pick is a Tailwind color (${tw})`)
		ok(token && await ui.locator('#css-3').inputValue() === token[0], `the name field reads the token (${token && token[0]})`)
		const px = await underMarker()
		close(px.rgb.slice(0, 3), tw, 0, 'the plane cell under the marker is that token')
		await quant('smooth')
		ok(await ui.locator('#named').isHidden(), 'smooth: no name field')

		// the wheel: hue around, chroma out; the marker sits on the fill's own pixel
		await ui.locator('#pairs button', { hasText: 'H ○ C' }).click()
		await page.waitForFunction(() => window.__stored('pairs')?.oklch === 2)
		await painted()
		ok(await ui.locator('#plane').evaluate(e => e.classList.contains('polar')), 'H ○ C paints as a disc')
		near8(await underMarker(), await own('oklch'), 3, 'wheel: the pixel under the marker is the coordinate\'s color')
		// a click straight right of centre is hue 0 (clockwise from +x, as the kernel paints), half way out C 0.2
		box = await ui.locator('#plane').boundingBox()
		await page.mouse.click(box.x + box.width * 0.75, box.y + box.height * 0.5)
		await page.waitForTimeout(150)
		const w = await shown(ui)
		ok(Math.min(w[2], 360 - w[2]) < 1 && Math.abs(w[1] - 0.2) < 0.004, `wheel pick: hue 0, C 0.2 (${w})`)

		// OSA-UCS: no closed-form inverse, its plane still paints per pixel on the GPU, and agrees with the fill
		await pickSpace(ui, 'osaucs')
		await painted()
		near8(await underMarker(), await own('osaucs'), 4, 'OSA-UCS plane: the pixel under the marker is the coordinate\'s color')

		// the eyedropper: a screen pixel becomes the paint and its coordinates; Escape changes nothing; a refusal removes the button
		const dropper = hexOrError => frame.evaluate(h => { window.EyeDropper = class { async open() { if (h.startsWith('#')) return { sRGBHex: h }; throw new DOMException('no', h) } } }, hexOrError)
		await dropper('#ff8000')
		const undo1 = await page.evaluate(() => window.__log.undo)
		await ui.locator('#drop').click()
		await page.waitForTimeout(150)
		close(await fill(), [1, 128 / 255, 0], 1e-9, 'eyedropper: the fill is the picked pixel')
		close(await held(ui), space.rgb.osaucs(255, 128, 0), 1e-6, 'eyedropper: the coordinates are read from it')
		ok(await page.evaluate(() => window.__log.undo) === undo1 + 1, 'eyedropper: one undo step')
		const sets2 = (await writesOf()).length
		await dropper('AbortError')
		await ui.locator('#drop').click()
		await page.waitForTimeout(100)
		ok((await writesOf()).length === sets2 && await ui.locator('#drop').isVisible(), 'eyedropper Escape: no write, the button stays')
		await dropper('NotAllowedError')
		await ui.locator('#drop').click()
		await page.waitForTimeout(100)
		ok(await ui.locator('#drop').count() === 0 && /eyedropper isn't available/.test(await notes(ui)), 'eyedropper refused: the button goes, a note says why')

		// two channels: one plane, no pair buttons; one channel: no plane, the bar alone still writes
		await pickSpace(ui, 'rg')
		ok(await ui.locator('#plane').isVisible() && await ui.locator('#pairs').isHidden(), 'rg (two channels): the plane, no pair buttons')
		await pickSpace(ui, 'gray')
		ok(await ui.locator('#plane').isHidden() && await ui.locator('#channels .bar2').count() === 1, 'gray (one channel): no plane, one bar')
		const sets1 = (await writesOf()).length
		await ui.locator('#channels .nrg').focus()
		await page.keyboard.press('End')
		await page.waitForTimeout(150)
		ok((await writesOf()).length === sets1 + 1 && (await fill()).every(v => Math.abs(v - 1) < 1e-6), 'gray bar End: one write, white')
		// a short panel (gray has no plane): the open space menu reaches past the content, so the window grows to hold it
		await page.waitForTimeout(100)
		const hShort = await page.evaluate(() => window.__log.resize.at(-1)[1])
		await ui.locator('#spbtn').click()
		await page.waitForTimeout(100)
		const mb = await ui.locator('#spmenu').evaluate(m => m.getBoundingClientRect().bottom)
		const hOpen = await page.evaluate(() => window.__log.resize.at(-1)[1])
		ok(mb > hShort && hOpen >= mb, `the window grows to hold the menu (${hShort} → ${hOpen}, menu ends at ${mb})`)
		await page.keyboard.press('Escape')
		await page.waitForTimeout(100)
		ok(await page.evaluate(() => window.__log.resize.at(-1)[1]) === hShort, 'and returns when it closes')

		// the window follows the content
		const sizes = await page.evaluate(() => window.__log.resize)
		const docH = await frame.evaluate(() => Math.ceil(document.documentElement.getBoundingClientRect().height))
		ok(sizes.length && sizes.at(-1)[0] === 264 && Math.abs(sizes.at(-1)[1] - docH) <= 1, `resize to content: ${JSON.stringify(sizes.at(-1))} vs ${docH}`)

		if (process.env.FIGMA_SHOTS) await page.locator('iframe').screenshot({ path: `${process.env.FIGMA_SHOTS}/figma-picker.png` })
		ok(!errors.length, `picker page errors: ${errors.join(' | ')}`)
		await page.context().close()
	}

	/* ---------- 5. gradients, images, relaunch, the space list ---------- */
	{
		const profile = 'SRGB'
		const stops = [{ position: 0, color: { r: 1, g: 0, b: 0, a: 1 } }, { position: 1, color: { r: 0, g: 0, b: 1, a: 0.5 } }]
		const sky = { id: '5:1', name: 'Sky', type: 'RECTANGLE', fills: [{ type: 'GRADIENT_LINEAR', visible: true, opacity: 1, blendMode: 'NORMAL', gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: stops }], strokes: [] }
		const photo = { id: '5:2', name: 'Photo', type: 'RECTANGLE', fills: [{ type: 'IMAGE', visible: true, opacity: 1, blendMode: 'NORMAL', imageHash: 'h1', scaleMode: 'FILL' }], strokes: [] }
		const image = hash => ({ type: 'IMAGE', visible: true, opacity: 1, blendMode: 'NORMAL', imageHash: hash, scaleMode: 'FILL' })
		const broken = { id: '5:3', name: 'Broken', type: 'RECTANGLE', fills: [image('bad')], strokes: [] }
		const gone = { id: '5:4', name: 'Gone', type: 'RECTANGLE', fills: [image('missing')], strokes: [] }
		const red = [230, 40, 40], blue = [40, 90, 220]
		const tokens = { 'V:t': { name: 'Brand/500', collection: 'C', values: { m: { r: 0.1, g: 0.6, b: 0.3, a: 1 } } } }
		const pstyles = { 'S:t': { name: 'Accent', paints: [solid(0.9, 0.7, 0.1)] } }
		const { page, ui, errors } = await open({ profile, editorType: 'figma', nodes: [sky, photo, broken, gone], variables: tokens, styles: pstyles, selection: ['5:1'], images: { h1: [red, blue], bad: 'corrupt' } })
		const frame = page.frames().find(f => f !== page.mainFrame())

		// the space list: each family's three featured spaces starred, a rule before the rest
		await ui.locator('#spbtn').click()
		const fams = await frame.evaluate(() => [...document.querySelectorAll('#splist > *')].reduce((a, e) => { if (e.tagName === 'H6') a.push([]); else a.at(-1).push(e.classList.contains('feat')); return a }, []))
		ok(fams.length >= 7 && fams.slice(0, 7).every(f => f.slice(0, 3).every(Boolean) && !f.slice(3).some(Boolean)), 'each family heads its list with its three featured spaces, set bold')
		// search: by name or id, case-insensitive; the family filter narrows; nothing found says so; Enter takes the highlighted one
		await page.keyboard.type('OSA')
		ok((await ui.locator('#splist .sp').evaluateAll(els => els.map(e => e.dataset.id))).join() === 'osaucs', 'search "OSA" finds OSA-UCS alone')
		await page.keyboard.press('Control+a'); await page.keyboard.type('zzz')
		ok(await ui.locator('#splist .spnone').isVisible(), 'a search with no match says so')
		await ui.locator('#spclr').click()
		await ui.locator('#spcat').selectOption('Film & camera')
		ok(await ui.locator('#splist h6').count() === 0 && await ui.locator('#splist .sp').count() > 10 && await ui.locator('#splist .sp[data-id="oklch"]').count() === 0, 'the family filter shows that family alone')
		await ui.locator('#spcat').selectOption('')
		await ui.locator('#spq').fill('cam16-u')
		await page.keyboard.press('Enter')
		ok(await spaceOf(ui) === 'cam16-ucs' && await ui.locator('#spmenu').isHidden(), 'Enter takes the highlighted space and closes the menu')
		await pickSpace(ui, 'oklch')

		// a gradient: each stop is a color slot; an edit changes that stop's color only, its alpha and position stay
		ok((await ui.locator('.paint .src').allInnerTexts()).join('|') === 'fill 1, stop 1|fill 1, stop 2', `gradient stops listed: ${await ui.locator('.paint .src').allInnerTexts()}`)
		await ui.locator('.paint', { hasText: 'stop 2' }).click()
		ok(/ \/ 0\.5\)$/.test(await ui.locator('#css-1').inputValue()), 'the stop\'s alpha appears in the CSS')
		const exp = expectWrite(profile, 'oklch', valuesIn(profile, 'oklch', [0, 0, 1]), 0, 0.5)
		const set = await edit(page, ui, 0, 0.5)
		ok(set.stop === 1, 'set targets stop 2')
		const g = (await page.evaluate(() => window.__paints('5:1', 'fills')))[0]
		close(rgbOf(g.gradientStops[1]), exp.rgb, 1e-12, 'stop 2 written')
		ok(g.gradientStops[1].color.a === 0.5 && g.gradientStops[1].position === 1, 'stop 2 keeps its alpha and position')
		ok(JSON.stringify(g.gradientStops[0]) === JSON.stringify(stops[0]) && g.type === 'GRADIENT_LINEAR', 'stop 1 and the gradient untouched')
		ok(await page.evaluate(() => window.__log.relaunch.some(r => r.id === '5:1' && r.d.open)), 'an edited layer gets the relaunch button')
		ok(await frame.evaluate(() => !!document.querySelector('#css ~ #notes')), 'the notes sit under the copy fields')

		// the document's colors: its tokens and styles (named) and the page's solid colors, as rings on the plane; a click takes one
		await ui.locator('#marks .dm').first().waitFor()
		const marks = await ui.locator('#marks .dm').evaluateAll(els => els.map(e => e.dataset.tip))
		ok(marks.includes('Brand/500, #1a994d') && marks.includes('Accent, #e6b31a'), `the token and the style are marked by name: ${marks}`)
		await ui.locator('#marks .dm[data-tip^="Brand/500"]').click()
		await page.waitForTimeout(150)
		const st2 = (await page.evaluate(() => window.__paints('5:1', 'fills')))[0].gradientStops[1]
		close(rgbOf(st2), [0.1, 0.6, 0.3], 1e-9, 'a document color clicked writes into the current stop')
		ok(st2.color.a === 0.5, 'the stop keeps its alpha')

		// an image alone: its pixels as dots, its prominent colors as swatches, its color as a paint that moves but writes nothing
		let n = await selections(page)
		await page.evaluate(() => window.__select(['5:2']))
		await settle(page, n)
		await ui.locator('#pal .sw').first().waitFor({ timeout: 10000 })
		const pal = await ui.locator('#pal .sw').evaluateAll(els => els.map(e => e.dataset.tip))
		const hx = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('')
		ok(pal.length === 2 && pal.includes(hx(red)) && pal.includes(hx(blue)), `the image's two colors as swatches: ${pal}`)
		await planePainted(frame)
		const dots = await frame.evaluate(() => { const cv = document.querySelector('#plane .density'); return cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data.some((v, i) => i % 4 === 3 && v > 0) })
		ok(dots, 'the image\'s pixels are dots on the plane')
		ok(/this image's pixels/.test(await notes(ui)), 'image-only note')
		ok(await ui.locator('.paint').first().getAttribute('aria-pressed') === 'true', 'the image\'s row is the current row, shaded like any other')
		const sets0 = (await page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'set'))).length
		const pb = await ui.locator('#plane').boundingBox()
		await page.mouse.click(pb.x + pb.width * 0.5, pb.y + pb.height * 0.5)
		await ui.locator('#pal .sw').nth(1).click()
		await page.waitForTimeout(100)
		ok((await page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'set'))).length === sets0, 'the image\'s color explores without writing')

		// an image that can't be decoded, or whose bytes Figma no longer has: no swatches, no dots, and the plain hint, not a wait
		for (const id of ['5:3', '5:4']) {
			n = await selections(page)
			await page.evaluate(id => window.__select([id]), id)
			await settle(page, n)
			await ui.locator('#empty', { hasText: 'Select a layer' }).waitFor({ timeout: 10000 })
			ok(await ui.locator('#picker').isHidden() && await ui.locator('#pal').isHidden(), `${id === '5:3' ? 'undecodable' : 'missing'} image: the empty state, no picker`)
		}

		// an image beside a gradient: a swatch writes the image's color into the current stop
		n = await selections(page)
		await page.evaluate(() => window.__select(['5:1', '5:2']))
		await settle(page, n)
		await ui.locator('#pal .sw').first().waitFor()
		const pick = await ui.locator('#pal .sw').first().getAttribute('data-tip')
		await ui.locator('#pal .sw').first().click()
		await page.waitForTimeout(150)
		const s0 = (await page.evaluate(() => window.__paints('5:1', 'fills')))[0].gradientStops[0].color
		ok(hx([s0.r, s0.g, s0.b].map(v => Math.round(v * 255))) === pick, `a swatch writes its color into stop 1 (${pick})`)

		if (process.env.FIGMA_SHOTS) await page.locator('iframe').screenshot({ path: `${process.env.FIGMA_SHOTS}/figma-image.png` })
		ok(!errors.length, `integration page errors: ${errors.join(' | ')}`)
		await page.context().close()
	}

	/* ---------- 6. codegen: Dev Mode's Code panel ---------- */
	{
		async function generate(setup, id) {
			const page = await (await browser.newContext()).newPage()
			await page.route(ORIGIN + '/**', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><meta charset="utf-8"><title>mock figma</title><body></body>' }))
			await page.goto(`${ORIGIN}/?cb=${Date.now()}`)
			await page.evaluate(`(${host})(${JSON.stringify({ ...setup, mode: 'codegen', editorType: 'dev' })}); window.__html__ = ''`)
			await page.addScriptTag({ content: code })
			const out = await page.evaluate(async id => { const r = await window.__generate({ node: window.__node(id), language: 'css' }); return { r, ui: !!window.__log.showUI } }, id)
			await page.context().close()
			return out
		}
		const card = { id: '6:1', name: 'Card', type: 'RECTANGLE', fills: [solid(1, 0.5, 0)], strokes: [solid(0, 0, 0, { opacity: 0.5 })] }
		const tok = { id: '6:2', name: 'Tok', type: 'TEXT', fills: [solid(0.2, 0.4, 0.6, { boundVariables: { color: { type: 'VARIABLE_ALIAS', id: 'V:1' } } })], strokes: [], modes: { C: 'm' } }
		const variables = { 'V:1': { name: 'Brand/500', collection: 'C', values: { m: { r: 0.2, g: 0.4, b: 0.6, a: 1 } } } }
		let { r, ui } = await generate({ profile: 'SRGB', nodes: [card], codegen: {} }, '6:1')
		ok(!ui, 'codegen opens no UI')
		const want = `background: ${css('oklch', space.rgb.oklch(255, 127.5, 0))};\nborder-color: ${css('oklch', space.rgb.oklch(0, 0, 0)).replace(/\)$/, ' / 0.5)')};`
		ok(r[0].language === 'CSS' && r[0].code === want, `codegen oklch (default):\n${r[0].code}\nwant\n${want}`)
		;({ r } = await generate({ profile: 'SRGB', nodes: [tok], variables, codegen: { format: 'lab' } }, '6:2'))
		const wantTok = `color: var(--brand-500, ${css('lab', space.rgb.lab(0.2 * 255, 0.4 * 255, 0.6 * 255))}); /* variable Brand/500 */`
		ok(r[0].code === wantTok, `codegen lab, a text color from a variable:\n${r[0].code}\nwant\n${wantTok}`)
		;({ r } = await generate({ profile: 'DISPLAY_P3', nodes: [{ id: '6:3', name: 'Red', type: 'RECTANGLE', fills: [solid(1, 0, 0)], strokes: [] }], codegen: { format: 'hex' } }, '6:3'))
		const m = gamutMap(space.p3.oklch(1, 0, 0), DEST.rgb).rgb.map(v => v * 255)
		ok(r[0].code === `background: #${m.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')}; /* mapped into sRGB */`, `codegen hex of P3 red maps into sRGB: ${r[0].code}`)
		;({ r } = await generate({ profile: 'DISPLAY_P3', nodes: [{ id: '6:4', name: 'Red', type: 'RECTANGLE', fills: [solid(1, 0, 0)], strokes: [] }], codegen: { format: 'p3' } }, '6:4'))
		ok(r[0].code === 'background: color(display-p3 1 0 0);', `codegen display-p3 in a P3 file: ${r[0].code}`)
	}

	/* ---------- 4. Dev Mode and LEGACY ---------- */
	{
		const node = { id: '3:1', name: 'Swatch', type: 'RECTANGLE', fills: [solid(0.25, 0.5, 0.75)], strokes: [] }
		const { page, ui, errors } = await open({ profile: 'LEGACY', editorType: 'dev', nodes: [node], selection: ['3:1'] })
		ok(await ui.locator('#profile').textContent() === 'sRGB, legacy', 'LEGACY labelled as sRGB')
		close(await shown(ui), valuesIn('SRGB', 'oklch', [0.25, 0.5, 0.75]), halfStep('oklch'), 'LEGACY read as sRGB')
		ok(await inputs(ui).first().evaluate(e => e.readOnly), 'Dev Mode inputs are read-only')
		ok(/Dev Mode is read-only/.test(await notes(ui)), 'Dev Mode note')
		// even a forced change event writes nothing
		await inputs(ui).first().evaluate(e => { e.value = '0.1'; e.dispatchEvent(new Event('change', { bubbles: true })) })
		await page.waitForTimeout(100)
		ok(!(await page.evaluate(() => window.__log.fromUI.some(m => m.type === 'set'))) && !(await page.evaluate(() => window.__log.writes.length)), 'Dev Mode never writes')
		// the plane and the bars are inert too: a drag and a key write nothing
		const pbox = await ui.locator('#plane').boundingBox()
		await page.mouse.move(pbox.x + pbox.width * 0.3, pbox.y + pbox.height * 0.3)
		await page.mouse.down()
		await page.mouse.move(pbox.x + pbox.width * 0.6, pbox.y + pbox.height * 0.6)
		await page.mouse.up()
		await ui.locator('#plane').focus()
		await page.keyboard.press('ArrowRight')
		ok(await ui.locator('#channels .nrg').first().getAttribute('aria-disabled') === 'true', 'Dev Mode bars are disabled')
		await page.waitForTimeout(100)
		ok(!(await page.evaluate(() => window.__log.fromUI.some(m => m.type === 'set'))), 'Dev Mode: a plane drag and a plane key write nothing')
		// and a 'set' that reaches the main thread anyway is ignored
		await page.evaluate(() => figma.ui.onmessage({ type: 'set', id: '3:1', kind: 'fills', index: 0, profile: 'LEGACY', color: { r: 0, g: 0, b: 0 } }))
		await page.waitForTimeout(50)
		ok(!(await page.evaluate(() => window.__log.writes.length)), 'code.js ignores set in Dev Mode')
		// layout: the longest channel symbols (lalphabeta's "alpha", "beta") stay clear of their inputs
		await pickSpace(ui, 'lalphabeta')
		const clear = await ui.locator('#channels .cl').evaluateAll(els => els.map(s => {
			const r = document.createRange()
			r.selectNodeContents(s)
			return r.getBoundingClientRect().right <= s.nextElementSibling.getBoundingClientRect().left
		}))
		ok(clear.length === 3 && clear.every(Boolean), `channel symbols clear of their inputs: ${clear}`)
		ok(!errors.length, `Dev Mode page errors: ${errors.join(' | ')}`)
		await page.context().close()
	}

} finally {
	await browser.close()
}
if (failures.length) {
	console.error(`figma: ${failures.length} failed, ${passed} passed\n  ${failures.join('\n  ')}`)
	process.exit(1)
}
console.log(`figma: ${passed} checks pass (SRGB, DISPLAY_P3, LEGACY + Dev Mode; read → display → edit → set → write)`)
