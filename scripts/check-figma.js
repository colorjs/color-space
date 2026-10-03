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
import { gamutMap, DEST } from '../plugins/figma/src/gamut.js'

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
ok(JSON.stringify(manifest.editorType) === '["figma","dev"]' && JSON.stringify(manifest.capabilities) === '["inspect"]', 'manifest editorType figma+dev with inspect')
ok(manifest.documentAccess === 'dynamic-page', 'manifest documentAccess dynamic-page')
ok(JSON.stringify(manifest.networkAccess) === '{"allowedDomains":["none"]}', 'manifest networkAccess none')

/* ---------- the mock Figma host (runs in the page) ---------- */

function host(setup) {
	const deepFreeze = o => { if (o && typeof o === 'object') { Object.values(o).forEach(deepFreeze); Object.freeze(o) } return o }
	const clone = v => JSON.parse(JSON.stringify(v))
	const mixed = Symbol('figma.mixed')
	const events = {}, pageEvents = {}, store = new Map(Object.entries(setup.stored || {}))
	const fire = (bag, type, arg) => setTimeout(() => (bag[type] || []).forEach(f => f(arg)))   // Figma's events are async
	const log = window.__log = { toUI: [], fromUI: [], writes: [], showUI: null }
	const nodes = new Map()

	for (const spec of setup.nodes) {
		// Figma reports '' for a fill or stroke list that isn't linked to a paint style
		const node = { id: spec.id, name: spec.name, type: spec.type, fillStyleId: spec.fillStyleId || '', strokeStyleId: spec.strokeStyleId || '' }
		for (const kind of ['fills', 'strokes']) {
			if (!(kind in spec)) continue
			let value = spec[kind] === 'mixed' ? mixed : deepFreeze(clone(spec[kind]))
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

	let iframe = null
	const currentPage = {
		selection: (setup.selection || []).map(id => nodes.get(id)),
		on: (t, f) => { (pageEvents[t] ||= []).push(f) },
		off: (t, f) => { pageEvents[t] = (pageEvents[t] || []).filter(g => g !== f) },
	}
	window.figma = {
		editorType: setup.editorType,
		mixed,
		root: { documentColorProfile: setup.profile },
		currentPage,
		on: (t, f) => { (events[t] ||= []).push(f) },
		getNodeByIdAsync: async id => nodes.get(id) || null,
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
			iframe.width = options.width
			iframe.height = options.height
			iframe.srcdoc = doc
			document.body.append(iframe)
		},
		ui: {
			onmessage: null,
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
	const decimals = ([min, max]) => Math.min(4, Math.max(0, 3 - Math.floor(Math.log10(max - min || 1))))
	const halfStep = id => space[id].range.map(r => 0.5 * 10 ** -decimals(r) + 1e-9)

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
		await ui.locator('#space option').first().waitFor({ state: 'attached' })
		await page.waitForFunction(() => window.__log.toUI.some(m => m.type === 'selection'))
		await page.waitForTimeout(50)
		return { page, ui, errors }
	}
	const inputs = ui => ui.locator('#channels input')
	const shown = async ui => (await inputs(ui).evaluateAll(els => els.map(e => e.value))).map(Number)
	const settle = (page, n) => page.waitForFunction(n => window.__log.toUI.filter(m => m.type === 'selection').length > n, n)
	const selections = page => page.evaluate(() => window.__log.toUI.filter(m => m.type === 'selection').length)
	const lastSet = page => page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'set').at(-1))
	const notes = ui => ui.locator('#notes').innerText().catch(() => '')

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

	/** Expected write for "channel i of `id` set to v", from the values the UI shows at full precision. */
	function expectWrite(profile, id, rgb, i, v) {
		const values = valuesIn(profile, id, rgb)
		values[i] = v
		return gamutMap(space[id].oklch(...values), docOf(profile).dest)
	}

	/* ---------- 1. SRGB document ---------- */
	{
		const profile = 'SRGB'
		const card = { id: '1:1', name: 'Card', type: 'RECTANGLE', fills: [solid(1, 0.5, 0)], strokes: [solid(0, 0, 0, { opacity: 0.5 })] }
		const bound = { id: '1:2', name: 'Bound', type: 'ELLIPSE', fills: [solid(0.2, 0.4, 0.6, { boundVariables: { color: { type: 'VARIABLE_ALIAS', id: 'VariableID:1:9' } } })], strokes: [] }
		const label = { id: '1:3', name: 'Label', type: 'TEXT', fills: 'mixed', strokes: [] }
		const styled = { id: '1:4', name: 'Styled', type: 'RECTANGLE', fills: [solid(0.9, 0.1, 0.3)], strokes: [], fillStyleId: 'S:0123abcd,1:7' }
		const { page, ui, errors } = await open({ profile, editorType: 'figma', nodes: [card, bound, label, styled], selection: ['1:1', '1:2'] })

		const opts = await page.evaluate(() => window.__log.showUI)
		ok(opts.themeColors === true && opts.width === 300, `showUI options ${JSON.stringify(opts)}`)
		const fromUI = await page.evaluate(() => window.__log.fromUI)
		ok(fromUI[0]?.type === 'ready', 'UI says ready first')

		// read → display
		ok(await ui.locator('#profile').textContent() === 'sRGB', 'profile tag reads sRGB')
		ok(await ui.locator('#space').inputValue() === 'oklch', 'default space is oklch')
		ok(await ui.locator('#space option').count() === Object.keys(space).length, `space list has all ${Object.keys(space).length} spaces`)
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
		let exp = expectWrite(profile, 'oklch', rgb, 1, 0.1)
		ok(!exp.mapped, 'test premise: oklch C 0.1 stays in sRGB')
		let set = await edit(page, ui, 1, 0.1)
		ok(set.id === '1:1' && set.kind === 'fills' && set.index === 0 && set.profile === 'SRGB', `set message target ${JSON.stringify(set)}`)
		close(rgbOf({ color: set.color }), exp.rgb, 1e-12, 'sRGB set color')
		let written = await page.evaluate(() => window.__paints('1:1', 'fills'))
		close(rgbOf(written[0]), exp.rgb, 1e-12, 'sRGB fill written')
		ok(written[0].opacity === 1 && written[0].blendMode === 'NORMAL' && written[0].visible === true, 'other paint fields kept')
		close(await shown(ui), valuesIn(profile, 'oklch', exp.rgb), halfStep('oklch'), 'UI shows the written color')
		ok(Math.abs((await shown(ui))[1] - 0.1) < 5e-5, 'C reads back 0.1')
		rgb = exp.rgb

		// out of gamut: CSS Color 4 gamut mapping, then clamp
		exp = expectWrite(profile, 'oklch', rgb, 1, 0.37)
		ok(exp.mapped, 'test premise: oklch C 0.37 is outside sRGB')
		set = await edit(page, ui, 1, 0.37)
		close(rgbOf({ color: set.color }), exp.rgb, 1e-12, 'sRGB gamut-mapped set color')
		ok(set.color.r >= 0 && set.color.r <= 1 && set.color.g >= 0 && set.color.g <= 1 && set.color.b >= 0 && set.color.b <= 1, 'mapped color within [0, 1]')
		ok(/outside sRGB/.test(await notes(ui)), 'out-of-gamut note shown')
		ok((await shown(ui))[1] < 0.37, 'chroma reads back reduced')

		// the note belongs to that write: an edit made in Figma afterwards drops it
		let n = await selections(page)
		await page.evaluate(() => window.__edit('1:1', 'fills', [{ type: 'SOLID', visible: true, opacity: 1, blendMode: 'NORMAL', color: { r: 0.2, g: 0.4, b: 0.6 } }]))
		await settle(page, n)
		await page.waitForTimeout(30)
		ok(!/outside/.test(await notes(ui)), 'gamut note dropped after an edit made in Figma')
		rgb = [0.2, 0.4, 0.6]

		// another space, persisted through clientStorage
		await ui.locator('#space').selectOption('lab')
		await page.waitForFunction(() => window.__stored('space') === 'lab')
		ok(true, 'space saved to clientStorage')
		ok(await inputs(ui).count() === 3, 'lab shows three channels')
		close(await shown(ui), valuesIn(profile, 'lab', rgb), halfStep('lab'), 'lab values of the current fill')
		exp = expectWrite(profile, 'lab', rgb, 2, 10)
		set = await edit(page, ui, 2, 10)
		close(rgbOf({ color: set.color }), exp.rgb, 1e-12, 'lab b edit written')
		rgb = exp.rgb

		// the stroke: a different paint of the same node, opacity kept, fills untouched
		await ui.locator('.paint', { hasText: 'stroke 1' }).click()
		close(await shown(ui), valuesIn(profile, 'lab', [0, 0, 0]), halfStep('lab'), 'stroke read')
		exp = expectWrite(profile, 'lab', [0, 0, 0], 0, 40)
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
		await ui.locator('[data-copy="css-1"]', { hasText: /^(Copied|Selected)$/ }).waitFor({ timeout: 2000 }).catch(() => {})
		const copied = await ui.locator('[data-copy="css-1"]').innerText()
		ok(copied === 'Copied', `copy button feedback: ${copied}`)
		ok(await page.evaluate(() => navigator.clipboard.readText()) === want, 'clipboard holds the oklch() text')

		// a variable-bound paint is read-only
		await ui.locator('.paint', { hasText: 'Bound' }).click()
		ok(await inputs(ui).first().evaluate(e => e.readOnly), 'bound paint inputs are read-only')
		ok(/bound to a variable/.test(await notes(ui)), 'bound paint note')

		// so is a paint linked to a color style
		n = await selections(page)
		await page.evaluate(() => window.__select(['1:4']))
		await settle(page, n)
		ok(await inputs(ui).first().evaluate(e => e.readOnly), 'style-linked paint inputs are read-only')
		ok(/color style/.test(await notes(ui)), 'style-linked paint note')
		// and code.js refuses both even when a 'set' reaches it
		const writes = await page.evaluate(() => window.__log.writes.length)
		await page.evaluate(() => ['1:2', '1:4'].forEach(id => figma.ui.onmessage({ type: 'set', id, kind: 'fills', index: 0, profile: 'SRGB', color: { r: 0, g: 0, b: 0 } })))
		await page.waitForTimeout(50)
		ok(await page.evaluate(() => window.__log.writes.length) === writes, 'code.js ignores set on bound and style-linked paints')
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

		ok(await ui.locator('#space').inputValue() === 'hct', 'stored space (hct) restored')
		ok(await ui.locator('#profile').textContent() === 'Display P3', 'profile tag reads Display P3')
		let rgb = [1, 0, 0]
		close(await shown(ui), valuesIn(profile, 'hct', rgb), halfStep('hct'), 'P3 read: hct values of P3 red')
		ok(await ui.locator('#css-2').inputValue() === 'color(display-p3 1 0 0)', 'css color(display-p3)')
		const [L, C, H] = space.p3.oklch(...rgb)
		ok(await ui.locator('#css-1').inputValue() === `oklch(${+L.toFixed(4)} ${+C.toFixed(4)} ${+H.toFixed(2)})`, 'P3 css oklch()')
		ok(await ui.locator('#notes').isHidden(), 'no notes: P3 red is inside the document gamut')

		await ui.locator('#space').selectOption('oklch')
		close(await shown(ui), valuesIn(profile, 'oklch', rgb), halfStep('oklch'), 'P3 read: oklch values')

		// a color outside sRGB but inside P3 is written as is: the document gamut is P3
		let exp = expectWrite(profile, 'oklch', rgb, 1, 0.27)
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
		exp = expectWrite(profile, 'oklch', rgb, 1, 0.4)
		ok(exp.mapped, 'test premise: C 0.4 is outside P3')
		set = await edit(page, ui, 1, 0.4)
		close(rgbOf({ color: set.color }), exp.rgb, 1e-12, 'P3 gamut-mapped set color')
		ok(/outside Display P3/.test(await notes(ui)), 'P3 out-of-gamut note')
		rgb = exp.rgb

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
		ok(!/outside/.test(await notes(ui)), 'the old gamut note is dropped with the old profile')

		if (process.env.FIGMA_SHOTS) await page.locator('iframe').screenshot({ path: `${process.env.FIGMA_SHOTS}/figma-p3.png` })
		ok(!errors.length, `P3 page errors: ${errors.join(' | ')}`)
		await page.context().close()
	}

	/* ---------- 3. Dev Mode and LEGACY ---------- */
	{
		const node = { id: '3:1', name: 'Swatch', type: 'RECTANGLE', fills: [solid(0.25, 0.5, 0.75)], strokes: [] }
		const { page, ui, errors } = await open({ profile: 'LEGACY', editorType: 'dev', nodes: [node], selection: ['3:1'] })
		ok(await ui.locator('#profile').textContent() === 'sRGB · legacy', 'LEGACY labelled as sRGB')
		close(await shown(ui), valuesIn('SRGB', 'oklch', [0.25, 0.5, 0.75]), halfStep('oklch'), 'LEGACY read as sRGB')
		ok(await inputs(ui).first().evaluate(e => e.readOnly), 'Dev Mode inputs are read-only')
		ok(/Dev Mode is read-only/.test(await notes(ui)), 'Dev Mode note')
		// even a forced change event writes nothing
		await inputs(ui).first().evaluate(e => { e.value = '0.1'; e.dispatchEvent(new Event('change', { bubbles: true })) })
		await page.waitForTimeout(100)
		ok(!(await page.evaluate(() => window.__log.fromUI.some(m => m.type === 'set'))) && !(await page.evaluate(() => window.__log.writes.length)), 'Dev Mode never writes')
		// and a 'set' that reaches the main thread anyway is ignored
		await page.evaluate(() => figma.ui.onmessage({ type: 'set', id: '3:1', kind: 'fills', index: 0, profile: 'LEGACY', color: { r: 0, g: 0, b: 0 } }))
		await page.waitForTimeout(50)
		ok(!(await page.evaluate(() => window.__log.writes.length)), 'code.js ignores set in Dev Mode')
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
