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
import { gamutMap, deltaEOK, DEST, JND } from '../plugins/figma/src/gamut.js'
import { cssShort, cssOf } from '../plugins/figma/src/notation.js'
import { CSS, css } from '../css.js'
import { host } from './figma-mock.js'

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
ok(manifest.name === 'Color Space', 'the plugin is named Color Space')
ok(manifest.documentAccess === 'dynamic-page', 'manifest documentAccess dynamic-page')
ok(JSON.stringify(manifest.networkAccess) === '{"allowedDomains":["none"]}', 'manifest networkAccess none')

// the short oklch()/oklab(): parsed back, every color stays within a fifth of a just-noticeable difference (ΔEOK, the
// 0.02 JND of gamut.js) of the unrounded one, over sRGB and Display P3 colors, achromatic ones included
{
	let worst = 0, bad = ''
	const parse = str => str.match(/-?[\d.]+(e-?\d+)?/g).map(Number)
	for (let k = 0; k < 4000; k++) {
		const rgb = k < 6 ? [[0, 0, 0], [1, 1, 1], [0.5, 0.5, 0.5], [1, 0, 0], [0, 1, 0], [0, 0, 1]][k] : [Math.random(), Math.random(), Math.random()]
		const lab = k % 2 ? space.p3.oklab(...rgb) : space.rgb.oklab(...rgb.map(v => v * 255))
		const lch = space.oklab.oklch(...lab)
		for (const [f, v, back] of [['oklch', lch, x => space.oklch.oklab(...x)], ['oklab', lab, x => x]]) {
			const str = cssShort(f, v), d = deltaEOK(back(parse(str)), lab)
			if (d > worst) { worst = d; bad = `${str} for [${lab.map(x => x.toFixed(5))}]` }
		}
	}
	ok(worst <= JND / 5, `oklch()/oklab() at three digits stay within JND/5 of the color: worst ΔEOK ${worst.toFixed(5)} (${bad})`)
}

// a P3 file's color that sRGB holds converts exactly into the sRGB-only formats (no mapping round trip): #ff8000 stays #ff8000
{
	const [r, g, b] = space.rgb.p3(255, 128, 0)
	const [hx, note] = cssOf('hex', { r, g, b }, 1, 'DISPLAY_P3'), [rg] = cssOf('rgb', { r, g, b }, 0.5, 'DISPLAY_P3')
	ok(hx === '#ff8000' && !note && rg === 'rgb(255 128 0 / 0.5)', `P3 inside sRGB, as hex and rgb(): ${hx} ${rg} ${note}`)
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
	// oklch() as the panel and the Code panel print it (plugins/figma/src/notation.js): three decimals on L and C, three
	// significant digits on the hue
	const oklch3 = ([L, C, H]) => `oklch(${+L.toFixed(3)} ${+C.toFixed(3)} ${+(+H || 0).toPrecision(3)})`
	// the fields print the atlas's fixed decimals (web/js/core.js decOf), so a shown value is within half a step
	const halfStep = id => classify(id).ch.map(c => 0.5 * 10 ** -decOf(c) + 1e-9)

	async function open(setup) {
		const context = await browser.newContext({ viewport: { width: 360, height: 800 } })
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
		await page.waitForFunction(() => window.__log.toUI.some(m => m.type === 'init'))
		await page.waitForFunction(() => window.__log.toUI.some(m => m.type === 'selection'))
		await page.waitForTimeout(50)
		return { page, ui, errors }
	}
	// the channels' cells and knobs; the opacity row (data-i="a") has its own checks
	const inputs = ui => ui.locator('#channels .cv:not([data-i="a"])')
	// the space menu, as a person uses it: open, click the space
	// the space field, as a person uses it: type a name (or an id) the list offers
	const frame1Fonts = page => page.frames().find(f => f !== page.mainFrame()).evaluate(async () => { await document.fonts.load('16px "color-space icons"', '▥'); return document.fonts.check('16px "color-space icons"', '▥') })
	// the space menu, as a person uses it: open, search, click the space
	const pickSpace = async (ui, id) => {
		if (await ui.locator('#spmenu').isHidden()) await ui.locator('#spbtn').click()
		await ui.locator('#spq').fill(id)
		await ui.locator(`#splist .spo[data-id="${id}"]`).first().click()   // a featured space shows twice: in Featured and its family
	}
	const spaceOf = ui => ui.locator('#spbtn').getAttribute('data-id')
	const near3 = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-3)
	// the copy field in a format, as a person picks it from the format select
	const asFmt = async (ui, f) => { await ui.locator('#fmt').selectOption(f); return ui.locator('#css-1').inputValue() }
	const QV = { smooth: '0', '10-step': '10', Tailwind: 'tailwind' }
	const quant = (ui, label) => ui.locator('#quant').selectOption(QV[label])
	const shown = async ui => (await inputs(ui).evaluateAll(els => els.map(e => e.value))).map(Number)
	// the coordinates the UI holds at full precision: each bar's range input carries its channel unrounded
	const held = async ui => (await ui.locator('#channels .nrg:not([data-i="a"])').evaluateAll(els => els.map(e => e.getAttribute('aria-valuenow')))).map(Number)
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

	/* ---------- 0. the icon font: every glyph against its SVG ---------- */
	{
		const ICONS = await import('../web/js/icons.js')
		const font = readFileSync(new URL('../web/fonts/color-space-icons.ttf', import.meta.url)).toString('base64')
		const map = JSON.parse(readFileSync(new URL('../web/fonts/color-space-icons.json', import.meta.url), 'utf8'))
		const items = Object.entries(map).map(([k, cp]) => { const [set, name] = k.split('.'); return [k, cp, name ? ICONS[set][name] : ICONS[set]] })
		const page = await (await browser.newContext()).newPage()
		const ots = []
		page.on('console', m => /OTS/.test(m.text()) && ots.push(m.text()))
		await page.setContent('<body></body>')
		// coverage IoU at 64 px: the glyph filled, the SVG drawn as the page draws it (line icons stroked at 2, round)
		const iou = await page.evaluate(async ({ font, items }) => {
			const f = new FontFace('csi', Uint8Array.from(atob(font), c => c.charCodeAt(0)))
			document.fonts.add(await f.load())
			const S = 64, cov = async draw => { const cv = document.createElement('canvas'); cv.width = cv.height = S; const x = cv.getContext('2d'); await draw(x); const d = x.getImageData(0, 0, S, S).data; return Array.from({ length: S * S }, (_, i) => d[i * 4 + 3] > 100) }
			const out = {}
			for (const [k, cp, svg] of items) {
				const a = await cov(x => { x.font = S + 'px csi'; x.fillText(String.fromCodePoint(parseInt(cp, 16)), 0, S * 896 / 1024) })
				const src = svg.replace('<svg', `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" color="black"`).replace('class="ic"', 'fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"').replace(/url\(#vq-smooth\)/, 'black').replace('style="fill:var(--paper)"', 'fill="white"')
				const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src); await img.decode()
				const b = await cov(x => x.drawImage(img, 0, 0))
				let i = 0, u = 0; for (let n = 0; n < a.length; n++) { if (a[n] && b[n]) i++; if (a[n] || b[n]) u++ }
				out[k] = i / u
			}
			return out
		}, { font, items }).catch(e => ({ error: String(e) }))
		ok(!iou.error && !ots.length, `the browser's font sanitizer accepts the icon font ${iou.error || ''} ${ots.join(' ')}`)
		// a font is one color: where an icon speaks through opacity (cells fading in, a faint backdrop) the glyph keeps the
		// shapes at full ink, so those overlap less; every other glyph must trace its SVG closely
		const LOSSY = { 'QI.10': .55, 'QI.20': .55, 'QI.smooth': .55, 'QI.tailwind': .6, 'QI.pico8': .6, 'QI.ansi': .2 }
		const off = Object.entries(iou).filter(([k, v]) => v < (LOSSY[k] ?? (k.startsWith('LI.') ? .72 : .78)))   // LI: the locus is a faint hairline in SVG, full ink in the glyph.map(([k, v]) => `${k} ${v.toFixed(2)}`)
		ok(!iou.error && Object.keys(iou).length === Object.keys(map).length && !off.length, `every glyph traces its SVG (IoU at 64 px): ${off.join(', ') || Object.keys(iou).length + ' glyphs'}`)
		await page.context().close()
	}

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
		const twins = ['1:15', '1:16'].map((id, k) => ({ ...bound, id, name: `Bound ${k + 2}` }))   // two more layers on the same alias
		const { page, ui, errors } = await open({ profile, editorType: 'figma', nodes: [card, bound, label, styled, library, libStyled, ...twins], variables, styles, selection: ['1:1', '1:2'] })

		const opts = await page.evaluate(() => window.__log.showUI)
		ok(opts.themeColors === true && opts.width === 288, `showUI options ${JSON.stringify(opts)}`)
		const fromUI = await page.evaluate(() => window.__log.fromUI)
		ok(fromUI[0]?.type === 'ready', 'UI says ready first')

		// read → display
		ok(await ui.locator('#profile').textContent() === 'sRGB', 'profile tag reads sRGB')
		ok(await spaceOf(ui) === 'oklch', 'default space is oklch')
		ok(await frame1Fonts(page), 'the lens selects\' icon font is loaded in the panel')
		// the space menu: a search over folding sections – Featured (each family's three, open), then every family, only the
		// current space's open; a section's header folds it; a search opens every section to its matches
		await ui.locator('#spbtn').click()
		const secs = await ui.locator('#splist .fam').evaluateAll(hs => hs.map(h => [h.dataset.fam, h.getAttribute('aria-expanded'), +h.querySelector('.n').textContent]))
		ok(secs[0][0] === 'Featured' && secs[0][1] === 'true' && secs[0][2] === 21, `Featured first, open, each family's three (${secs[0]})`)
		ok(secs.slice(1).reduce((t, x) => t + x[2], 0) === Object.keys(space).length, 'the families hold every space once')
		ok(secs.slice(1).filter(x => x[1] === 'true').map(x => x[0]).join() === 'Perceptual', 'only the current space\'s family is open')
		ok(await ui.locator('#splist .spo').count() === 21 + secs.find(x => x[0] === 'Perceptual')[2], 'folded families show no rows')
		await ui.locator('#splist .fam[data-fam="Film & camera"]').click()
		ok(await ui.locator('#splist .fam[data-fam="Film & camera"]').getAttribute('aria-expanded') === 'true' && await ui.locator('#splist .spo[data-id="slog3"]').count() === 1, 'a header unfolds its family')
		await ui.locator('#splist .fam[data-fam="Film & camera"]').click()
		ok(await ui.locator('#splist .spo[data-id="slog3"]').count() === 0, 'and folds it back')
		await ui.locator('#spq').fill('osa')
		ok((await ui.locator('#splist .spo').evaluateAll(es => es.map(e => e.dataset.id))).join() === 'osaucs' && await ui.locator('#splist .fam').count() === 1, 'a search opens the sections holding matches, and only those')
		await ui.locator('#spq').fill('zzz')
		ok(await ui.locator('#splist .spnone').isVisible(), 'a search with no match says so')
		await ui.locator('#spq').fill('cam16-u')
		await page.keyboard.press('Enter')
		ok(await spaceOf(ui) === 'cam16-ucs' && await ui.locator('#spmenu').isHidden(), 'Enter takes the highlighted space and closes the menu')
		await ui.locator('#spbtn').click()
		await page.keyboard.press('Escape')
		ok(await ui.locator('#spmenu').isHidden(), 'Escape closes the menu')
		// a press outside only closes it: the control under the press (another paint's row) doesn't act
		await ui.locator('#spbtn').click()
		const cur = await ui.locator('.paint[aria-pressed="true"]').getAttribute('data-key')
		await ui.locator('.paint').nth(1).click()
		await page.waitForTimeout(100)
		ok(await ui.locator('#spmenu').isHidden() && await ui.locator('.paint[aria-pressed="true"]').getAttribute('data-key') === cur, 'a press outside closes the menu and nothing else')
		const storedN = await page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'store').length)
		await pickSpace(ui, 'samsunglog')
		ok(await spaceOf(ui) === 'samsunglog' && await page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'store').length) === storedN + 1, 'a pick takes that space and saves it')
		await pickSpace(ui, 'oklch')
		// the tooltip stays while its element is hovered, goes when the pointer leaves the panel, and comes back on the next
		// hover of the same element; any press elsewhere dismisses it; a quiet explainer (the profile) shows it on a click
		const tipOn = () => ui.locator('#tip').evaluate(t => t.classList.contains('on'))
		const frame1 = page.frames().find(f => f !== page.mainFrame())
		await ui.locator('#profile').hover()
		await ui.locator('#tip.on').waitFor({ state: 'attached', timeout: 3000 })
		await page.waitForTimeout(3000)
		ok(await tipOn() && await ui.locator('#tip').evaluate(t => getComputedStyle(t).opacity) > 0.5, 'a hovered tooltip stays (no fade on its own)')
		// leaving the panel: the browser sends the frame's document a pointerleave. A synthetic mouse move out of this
		// scrolled frame doesn't reliably produce one (it depends on timing and load), so the event itself is dispatched
		await frame1.evaluate(() => document.documentElement.dispatchEvent(new PointerEvent('pointerleave')))
		ok(!(await tipOn()), 'the pointer leaving the panel hides the tooltip')
		await ui.locator('#profile').hover()
		await ui.locator('#tip.on').waitFor({ state: 'attached', timeout: 3000 }).catch(() => {})
		await ui.locator('#gamut').hover()   // onto the next element: the first one's tip goes, the next one's comes
		await frame1.waitForFunction(() => /^In /.test(document.getElementById('tip').textContent), null, { timeout: 3000 }).catch(() => {})
		ok(await tipOn() && /^In sRGB\.$/.test(await ui.locator('#tip').innerText()), `moving to another element swaps the tip (${await ui.locator('#tip').innerText()})`)
		await ui.locator('#profile').hover()
		await ui.locator('#tip.on').waitFor({ state: 'attached', timeout: 3000 }).catch(() => {})
		ok(await tipOn(), 'the same element hovered again shows it again')
		const pad = async () => { const b = await ui.locator('#picker').boundingBox(); await page.mouse.click(b.x - 6, Math.max(5, b.y + 20)) }   // the panel's padding beside the picker: nothing there
		await pad()
		ok(!(await tipOn()), 'a press dismisses the tooltip')
		await ui.locator('#profile').click()
		ok(await tipOn() && /color profile/.test(await ui.locator('#tip').innerText()), 'a click on the profile shows its tooltip')
		await pad()
		// focus after a press (not from the keyboard) brings no tooltip; focus from the keyboard does
		// read the tooltip in the tick right after the focus (the hover tip waits 300 ms; a focus tip would be there at once)
		await frame1.evaluate(() => addEventListener('focusin', () => setTimeout(() => { window.__tipAtFocus = document.getElementById('tip').classList.contains('on') }), { once: true, capture: true }))
		await ui.locator('#axes .labx').click()   // a button with a tip (it swaps the axis; swapped back below)
		await frame1.waitForFunction(() => window.__tipAtFocus !== undefined, null, { timeout: 2000 }).catch(() => {})
		ok(await frame1.evaluate(() => window.__tipAtFocus) === false, `focus that follows a press shows no tooltip (${await frame1.evaluate(() => String(window.__tipAtFocus))})`)
		await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab')
		ok(await tipOn(), 'focus from the keyboard shows the tooltip')
		await page.mouse.down(); await page.mouse.up()
		await ui.locator('#axes .labx').click()
		ok(await ui.locator('.paint').count() === 3, 'three solid paints listed (Card fill, Card stroke, Bound fill)')
		let rgb = [1, 0.5, 0]
		close(await shown(ui), valuesIn(profile, 'oklch', rgb), halfStep('oklch'), 'sRGB read: oklch values')
		const [L, C, H] = valuesIn(profile, 'oklch', rgb)
		ok(await ui.locator('#css-1').inputValue() === oklch3([L, C, H]), `css oklch(): ${await ui.locator('#css-1').inputValue()}`)
		const hexv = await asFmt(ui, 'hex')
		ok(hexv === '#ff8000' && await page.evaluate(() => window.__log.fromUI.some(m => m.type === 'store' && m.key === 'format' && m.value === 'hex')), `css hex, the format saved: ${hexv}`)
		ok(await asFmt(ui, 'lab') === css('lab', space.rgb.lab(255, 127.5, 0)) && await asFmt(ui, 'oklch') === oklch3([L, C, H]), 'the format select: lab(), then back to oklch()')
		ok(await ui.locator('#notes').innerText() === 'Dots are other selected colors.', `an in-gamut sRGB paint: only the dots' legend (${await ui.locator('#notes').innerText()})`)

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
		ok(await ui.locator('#gamut').innerText() === 'In sRGB.', 'after an edit made in Figma, the status reads its color: in sRGB')
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
		ok(/ \/ 0\.5\)$/.test(await ui.locator('#css-1').inputValue()) && (await asFmt(ui, 'hex')).endsWith('80') && await asFmt(ui, 'oklch'), 'opacity appears in the CSS')

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

		// one read asks Figma for each token once, however many layers share it: three layers on one alias, two lookups
		const lk0 = await page.evaluate(() => window.__log.varLookups)
		n = await selections(page)
		await page.evaluate(() => window.__select(['1:2', '1:15', '1:16']))
		await settle(page, n)
		ok(await page.evaluate(n => window.__log.varLookups - n, lk0) === 2, `three layers on one alias: the alias and its token looked up once each (${await page.evaluate(n => window.__log.varLookups - n, lk0)})`)
		n = await selections(page)
		await page.evaluate(() => window.__select(['1:2']))
		await settle(page, n)

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

		// about: the info mark opens a card (a popover) whose links open in the browser through the main thread – only its
		// three pages, whatever the UI sends; Escape closes it
		await ui.locator('#aboutb').click()
		ok(await ui.locator('#about').evaluate(e => e.matches(':popover-open')), 'the info mark opens the about card')
		await ui.locator('#about [data-open="support"]').click()
		await ui.locator('#about [data-open="github"]').click()
		await page.waitForFunction(() => window.__log.opened.length >= 2, null, { timeout: 3000 }).catch(() => {})
		for (const to of ['evil', '__proto__', 'toString']) await page.evaluate(to => figma.ui.onmessage({ type: 'open', to }), to)
		await page.evaluate(() => figma.ui.onmessage({ type: 'open', url: 'https://example.com' }))
		await page.waitForTimeout(50)
		ok(JSON.stringify(await page.evaluate(() => window.__log.opened)) === '["https://github.com/sponsors/dy","https://github.com/colorjs/color-space"]', `the card opens its own pages only: ${JSON.stringify(await page.evaluate(() => window.__log.opened))}`)
		await page.keyboard.press('Escape')
		ok(!(await ui.locator('#about').evaluate(e => e.matches(':popover-open'))), 'Escape closes the about card')

		if (process.env.FIGMA_SHOTS) await page.locator('iframe').screenshot({ path: `${process.env.FIGMA_SHOTS}/figma-srgb.png` })
		ok(!errors.length, `sRGB page errors: ${errors.join(' | ')}`)
		await page.context().close()
	}

	/* ---------- 2. DISPLAY_P3 document ---------- */
	{
		const profile = 'DISPLAY_P3'
		const red = { id: '2:1', name: 'P3 red', type: 'RECTANGLE', fills: [solid(1, 0, 0)], strokes: [] }
		const { page, ui, errors } = await open({ profile, editorType: 'figma', nodes: [red], selection: ['2:1'], stored: { space: 'hct', limit: 'file', width: 320 } })

		ok(await spaceOf(ui) === 'hct', 'stored space (hct) restored')
		ok(await page.evaluate(() => window.__log.resize.some(r => r[0] === 320)), 'the stored width (320) restored')
		ok(await ui.locator('#limit').inputValue() === 'file' && /File gamut \(Display P3\)/.test(await ui.locator('#limit').getAttribute('data-tip')), 'the stored limit (the file\'s gamut) restored, naming Display P3 in a P3 file')
		ok(await ui.locator('#limit option[value="file"] .ico').textContent() === '\u25B3', 'the File gamut option wears the P3 icon in a P3 file')
		ok(await ui.locator('#profile').textContent() === 'Display P3', 'profile tag reads Display P3')
		let rgb = [1, 0, 0]
		close(await shown(ui), valuesIn(profile, 'hct', rgb), halfStep('hct'), 'P3 read: hct values of P3 red')
		ok(await asFmt(ui, 'p3') === 'color(display-p3 1 0 0)', 'css color(display-p3)')
		const hexP3 = await asFmt(ui, 'hex')
		ok(hexP3 === '#' + gamutMap(space.p3.oklch(1, 0, 0), DEST.rgb).rgb.map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('') && /mapped into sRGB/.test(await ui.locator('#css-1').evaluate(e => e.closest('.fld').dataset.tip)), `hex of P3 red: mapped into sRGB, and it says so (${hexP3})`)
		await asFmt(ui, 'oklch')
		const [L, C, H] = space.p3.oklch(...rgb)
		ok(await ui.locator('#css-1').inputValue() === oklch3([L, C, H]), `P3 css oklch(): ${await ui.locator('#css-1').inputValue()}`)
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
		await quant(ui, 'Tailwind')
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
		await quant(ui, 'smooth')
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
		ok(await ui.locator('#limit option[value="file"] .ico').textContent() === '\u25B5', 'and the File gamut option turns to the sRGB icon')
		ok(!/Display P3/.test(await ui.locator('#gamut').innerText()), 'the status follows the new profile')

		if (process.env.FIGMA_SHOTS) await page.locator('iframe').screenshot({ path: `${process.env.FIGMA_SHOTS}/figma-p3.png` })
		ok(!errors.length, `P3 page errors: ${errors.join(' | ')}`)
		await page.context().close()
	}

	/* ---------- 3. the picker: plane, wheel, bars, steps ---------- */
	{
		const profile = 'SRGB'
		const swatch = { id: '4:1', name: 'Swatch', type: 'RECTANGLE', fills: [solid(0.2, 0.5, 0.8)], strokes: [] }
		// a host stylesheet holding the document at least the window's height, as a frame's injected rules may: the window must
		// still shrink back to its content
		const { page, ui, errors } = await open({ profile, editorType: 'figma', nodes: [swatch], selection: ['4:1'], css: 'html,body{min-height:100vh}' })
		const frame = page.frames().find(f => f !== page.mainFrame())
		const writesOf = () => page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'set'))
		const fill = async () => rgbOf((await page.evaluate(() => window.__paints('4:1', 'fills')))[0])
		const underMarker = () => pixelUnderMarker(frame)
		const painted = () => planePainted(frame)
		// expected: the coordinate's own color (a marker past the gamut sits on the ghost, not on the mapped fill)
		const own = async id => space[id].rgb(...await held(ui)).map(v => Math.min(255, Math.max(0, v)))
		const near8 = (got, rgb, tol, msg) => close(got.rgb.slice(0, 3), rgb.map(Math.round), tol, msg)

		await painted()
		ok(await ui.locator('#axes .labx').innerText() === 'C' && await ui.locator('#axes .laby').innerText() === 'L', 'oklch opens on its C×L plane (the hue held)')
		// an axis letter swaps that axis for the channel held, and says so; again swaps back
		ok(/Click for Hue/.test(await ui.locator('#axes .labx').getAttribute('data-tip')), 'the C letter names what a click brings: the hue')
		await ui.locator('#axes .labx').click()
		ok(await ui.locator('#axes .labx').innerText() === 'H' && await ui.locator('#axes .laby').innerText() === 'L', 'a click on C makes it H×L')
		await ui.locator('#axes .labx').click()
		ok(await ui.locator('#axes .labx').innerText() === 'C', 'and again, C×L')
		// the lens controls: clickable over their whole face, the chevron too; their width never moves
		const lf = await ui.locator('#quantf').boundingBox(), w0 = lf.width
		await page.mouse.move(lf.x + lf.width - 5, lf.y + lf.height / 2)
		ok((await ui.locator('#quantf').boundingBox()).width === w0, 'hover keeps the lens control\'s width')
		// the lens's tooltip: on hover of the control itself; gone once its list opens, and none over the open list
		const tipText = () => frame.evaluate(() => { const t = document.getElementById('tip'); return t.classList.contains('on') ? t.textContent : '' })
		await frame.waitForFunction(() => document.getElementById('tip').classList.contains('on'), null, { timeout: 2000 }).catch(() => {})
		ok(/^Quantize: /.test(await tipText()), `hovering a lens shows its tooltip (${await tipText()})`)
		await page.mouse.down(); await page.mouse.up()
		ok(await frame.evaluate(() => document.getElementById('quant').matches(':open')), 'a click on the chevron opens the list')
		const optW = () => frame.evaluate(() => document.querySelector('#quant option').getBoundingClientRect().width)
		const ow0 = await optW()
		await ui.locator('#quant option[value="20"]').hover()
		ok(await optW() === ow0, `the open list keeps its width on hover (${ow0})`)
		await page.waitForTimeout(500)
		ok(!(await tipText()), `no tooltip over the open list (${await tipText()})`)
		await page.keyboard.press('Escape')
		// one menu at a time: a lens opened over the space menu closes it, and the space menu closes an open lens
		await ui.locator('#spbtn').click()
		await ui.locator('#quant').click()
		ok(await ui.locator('#spmenu').isHidden() && await frame.evaluate(() => document.getElementById('quant').matches(':open')), 'opening a lens closes the space menu')
		await ui.locator('#spbtn').click()
		ok(await ui.locator('#spmenu').isVisible() && !(await frame.evaluate(() => document.getElementById('quant').matches(':open'))), 'opening the space menu closes the lens')
		await page.keyboard.press('Escape')
		// the size: the grip by the panel's corner drags its width (the height follows), saved; the resize cursor shows
		// throughout (a picker drag hides it); here narrower, as a drag out of this mock's frame loses the pointer
		const gb = await ui.locator('#grip').boundingBox(), gx = gb.x + gb.width * 0.75, gy = gb.y + gb.height * 0.75   // in the corner's triangle, where the grip takes presses
		await page.mouse.move(gx, gy)
		await page.mouse.down()
		await page.mouse.move(gx - 8, gy, { steps: 2 })
		ok(await frame.evaluate(() => getComputedStyle(document.body).cursor) === 'nwse-resize', 'resizing keeps the resize cursor')
		await page.mouse.move(gx - 16, gy - 10, { steps: 2 })
		await page.mouse.up()
		await page.waitForFunction(() => window.__stored('width') === 272, null, { timeout: 3000 }).catch(() => {})
		ok(await page.evaluate(() => window.__stored('width')) === 272 && (await page.evaluate(() => window.__log.resize.at(-1)))[0] === 272, `the grip sets the panel's width by its drag (${await page.evaluate(() => window.__stored('width'))})`)
		await ui.locator('#grip').focus()
		await page.keyboard.press('ArrowRight')
		await page.waitForFunction(() => window.__stored('width') === 288, null, { timeout: 3000 }).catch(() => {})
		ok(await page.evaluate(() => window.__stored('width')) === 288, 'the arrow key widens it by 16')
		// a release the frame never sees (let go outside the panel): the next move without a button ends the resize, saved,
		// and later moves resize nothing
		const gr = await ui.locator('#grip').boundingBox()
		await page.mouse.move(gr.x + gr.width * 0.75, gr.y + gr.height * 0.75)
		await page.mouse.down()
		await page.mouse.move(gr.x + gr.width * 0.75 - 16, gr.y + gr.height * 0.75, { steps: 2 })
		await frame.evaluate(([x, y]) => dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, buttons: 0, clientX: x, clientY: y, bubbles: true })), [gr.x - 40, gr.y - 40])
		const nResize = await page.evaluate(() => window.__log.resize.length), wAfter = await page.evaluate(() => window.__stored('width'))
		ok(!(await ui.locator('#grip').evaluate(g => g.classList.contains('live'))) && wAfter === 272, `a lost release ends the resize, saved (${wAfter})`)
		await frame.evaluate(([x, y]) => dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, buttons: 1, clientX: x, clientY: y, bubbles: true })), [gr.x - 60, gr.y])
		ok(await page.evaluate(n => window.__log.resize.length === n || window.__log.resize.slice(n).every(r => r[0] === 272), nResize), 'and the next moves resize nothing')
		await page.mouse.up()
		await ui.locator('#grip').focus()
		await page.keyboard.press('ArrowRight')
		await page.waitForFunction(() => window.__stored('width') === 288, null, { timeout: 3000 }).catch(() => {})
		// widen, then narrow back: the height follows both ways
		const hNow = () => page.evaluate(() => window.__log.resize.at(-1)[1])
		// the height once it has settled: the last arrow's resize may still be on its way
		const settled = async () => { let n = -1; for (let t = 0; t < 40; t++) { const m = await page.evaluate(() => window.__log.resize.length); if (m === n) break; n = m; await page.waitForTimeout(250) } return hNow() }
		const h0 = await settled()
		for (let k = 0; k < 4; k++) await page.keyboard.press('ArrowRight')
		await page.waitForFunction(h => window.__log.resize.at(-1)[1] > h, h0, { timeout: 10000 }).catch(() => {})
		const h1 = await hNow()
		for (let k = 0; k < 4; k++) await page.keyboard.press('ArrowLeft')
		await page.waitForFunction(h => window.__log.resize.at(-1)[1] === h, h0, { timeout: 10000 }).catch(() => {})   // a loaded machine resizes slowly
		ok(h1 > h0 && await hNow() === h0 && await page.evaluate(() => window.__stored('width')) === 288, `wider then narrower: the height grows and comes back (${h0} → ${h1} → ${await hNow()})`)
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
		ok(/^In sRGB\.$/.test(g1[0]) && /^Outside sRGB/.test(g2[0]) && g1[1] === g2[1], `the status crosses the gamut on one line (${g1[1]} → ${g2[1]} px)`)
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
		await quant(ui, '10-step')
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
		await quant(ui, 'Tailwind')
		await page.waitForFunction(() => window.__stored('quant') === 'tailwind')
		ok(await ui.locator('#gamut').innerText() === 'Snapped to Tailwind.', 'the status names the palette lens')
		await painted()
		box = await ui.locator('#plane').boundingBox()
		await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.4)
		await page.waitForTimeout(150)
		const tw = (await fill()).map(v => Math.round(v * 255)), token = PALETTES.tailwind.find(([, c]) => c.join() === tw.join())
		ok(!!token, `Tailwind pick is a Tailwind color (${tw})`)
		ok(token && await ui.locator('#css-3').inputValue() === token[0], `the name field reads the token (${token && token[0]})`)
		const px = await underMarker()
		close(px.rgb.slice(0, 3), tw, 0, 'the plane cell under the marker is that token')
		await quant(ui, 'smooth')
		ok(await ui.locator('#named').isHidden(), 'smooth: no name field')

		// the lens lists, where the select is customizable (this Chromium): drawn by the page, each option's icon in the
		// icon font beside its name, the closed control showing the icon alone; a click on an option takes it
		const rich = await frame.evaluate(() => CSS.supports('appearance', 'base-select'))
		ok(rich, 'test premise: this Chromium has customizable selects')
		await ui.locator('#limit').click()
		const lst = await frame.evaluate(() => {
			const s = document.getElementById('limit'), o = s.querySelector('option[value="p3"]'), ico = o.querySelector('.ico')
			return { open: s.matches(':open'), font: getComputedStyle(ico).fontFamily, glyph: ico.textContent, w: ico.getBoundingClientRect().width, closedName: getComputedStyle(s.querySelector('selectedcontent .nm') || document.body).display }
		})
		ok(lst.open && /color-space icons/.test(lst.font) && lst.glyph === '\u25B3' && lst.w > 0, `the open list shows the P3 icon in the icon font (${JSON.stringify(lst)})`)
		ok(lst.closedName === 'none', 'the closed control shows the icon alone')
		await ui.locator('#limit option[value="p3"]').click()
		await page.waitForFunction(() => window.__stored('limit') === 'p3')
		ok(await ui.locator('#limit').inputValue() === 'p3' && !(await frame.evaluate(() => document.getElementById('limit').matches(':open'))), 'a click on an option takes it and closes the list')
		await ui.locator('#limit').selectOption('file')

		// the Limit lens: the file's gamut by default; another limit repaints the plane through that body, is saved, and
		// leaves the writes and the status in the file's gamut
		const lim0 = await planePaints()
		await ui.locator('#limit').selectOption('vis')
		await page.waitForFunction(() => window.__stored('limit') === 'vis')
		// the repaint lands on the next frame: wait for the count to move (the old pixels would satisfy a pixel wait)
		await frame.waitForFunction(n => (document.querySelector('#plane canvas')._paints || 0) > n, lim0, { timeout: 5000 }).catch(() => {})
		ok(await planePaints() > lim0 && /Surface/.test(await ui.locator('#limit').getAttribute('data-tip')), 'Surface repaints the plane and names itself')
		ok(/^(In|Outside) sRGB/.test(await ui.locator('#gamut').innerText()), 'the status stays in the file\'s gamut')
		await ui.locator('#limit').selectOption('file')

		// the wheel: hue around, chroma out; the marker sits on the fill's own pixel
		await ui.locator('#axes .laby').click()   // L swapped for the hue held: H around, C out
		await page.waitForFunction(() => window.__stored('pairs')?.oklch === 2)
		await painted()
		ok(await ui.locator('#plane').evaluate(e => e.classList.contains('polar')), 'H×C paints as a disc')
		// on screen, not just in the canvas: the disc shows its colors (a layer over it once hid them behind a checker)
		const shot = async (x, y) => page.evaluate(async b64 => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const c = document.createElement('canvas'); c.width = c.height = 1; const x = c.getContext('2d'); x.drawImage(img, 0, 0); return [...x.getImageData(0, 0, 1, 1).data] }, (await page.screenshot({ clip: { x, y, width: 1, height: 1 } })).toString('base64'))
		const pb2 = await ui.locator('#plane').boundingBox()
		const centre = await shot(pb2.x + pb2.width * 0.5 + 6, pb2.y + pb2.height * 0.5)
		const gray = space.oklch.rgb((await held(ui))[0], 0.005, 0).map(Math.round)
		close(centre.slice(0, 3), gray, 12, `the disc's centre shows its near-gray on screen (${centre})`)
		// the wheel/square switch: back to the square plane and to the wheel again, saved per space and pair
		const inks = () => ui.locator('#axes').evaluate(a => ['.laby', '.labx', '.pmode'].map(k => a.querySelector(k).style.color).join())
		const ink0 = await inks()
		// a wheel's corners are void: the letters and the switch ink against the panel showing through (its token color
		// resolved by a canvas – the paper may be any notation), the bare transparent pixel once read as black
		const paperInk = await frame.evaluate(() => { const g = document.createElement('canvas').getContext('2d'); g.fillStyle = getComputedStyle(document.body).backgroundColor; g.fillRect(0, 0, 1, 1)
			const [r, gr, b] = g.getImageData(0, 0, 1, 1).data; return (0.2126 * r + 0.7152 * gr + 0.0722 * b) / 255 < 0.6 ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)' })
		ok(ink0 === [paperInk, paperInk, paperInk].join(), `the wheel's letters and switch ink against the panel behind the void corners (${ink0}, panel → ${paperInk})`)
		await ui.locator('#axes .pmode').click()
		await page.waitForFunction(() => window.__stored('disc')?.['oklch:2,1'] === false)
		ok(!(await ui.locator('#plane').evaluate(e => e.classList.contains('polar'))), 'the switch shows H×C as a square plane')
		await ui.locator('#axes .pmode').click()
		await page.waitForFunction(() => window.__stored('disc')?.['oklch:2,1'] === true)
		ok(await ui.locator('#plane').evaluate(e => e.classList.contains('polar')), 'and back as a wheel')
		await painted()
		ok(await inks() === ink0, `the letters and the switch ink as they did on this wheel before the round trip (${await inks()} vs ${ink0})`)
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

		// a held channel dragged on its bar repaints the plane at full resolution, mid-drag
		const fullW = await frame.evaluate(() => document.querySelector('#plane canvas').width), pp0 = await planePaints()
		const hb = await ui.locator('#channels .bar2').nth(0).boundingBox()   // OSA-UCS's L: the channel its j×g plane holds
		await page.mouse.move(hb.x + hb.width * 0.3, hb.y + hb.height / 2)
		await page.mouse.down()
		await page.mouse.move(hb.x + hb.width * 0.5, hb.y + hb.height / 2, { steps: 3 })
		await page.waitForTimeout(60)
		const midW = await frame.evaluate(() => [document.querySelector('#plane canvas').width, document.querySelector('#plane .density').width])
		await page.mouse.up()
		ok(await planePaints() > pp0 && midW[0] === fullW && midW[1] === fullW, `mid-drag the plane repaints, and it and its dots keep full resolution (${midW} of ${fullW})`)
		// the view: a pinch (⌃ wheel) zooms about the pointer, so a click then picks inside the window; a double click shows
		// the whole again. OkLCh's C × L square, smooth: the plane's middle is C 0.2, L 0.5
		await pickSpace(ui, 'oklch'); await quant(ui, 'smooth')
		for (let k = 0; k < 6 && !(await ui.locator('#axes .labx').innerText() === 'C' && await ui.locator('#axes .laby').innerText() === 'L'); k++) await ui.locator(k % 2 ? '#axes .laby' : '#axes .labx').click()   // the C × L square
		await planePainted(frame)
		const pz = await ui.locator('#plane').boundingBox(), pmid = [pz.x + pz.width / 2, pz.y + pz.height / 2]
		const clickMid = async () => { await page.mouse.click(...pmid); await page.waitForTimeout(150); return held(ui) }
		const whole = await clickMid()
		await page.mouse.move(pz.x + pz.width * 0.25, pz.y + pz.height * 0.75)
		await page.keyboard.down('Control'); await page.mouse.wheel(0, -400); await page.keyboard.up('Control')
		await page.waitForTimeout(250)
		// zoomed about (¼, ¼ up) by e^(−400·0.0024): each axis shows [¼ − ¼·k, ¼ + ¾·k] of its range, its middle at ¼ + k/4
		const k = Math.exp(-400 * 0.0024), zoomed = await clickMid(), wantF = 0.25 - 0.25 * k + 0.5 * k
		close(whole.slice(0, 2), [0.5, 0.2], [1e-3, 1e-3], 'the whole plane: its middle picks L 0.5, C 0.2')
		close(zoomed.slice(0, 2), [wantF, wantF * 0.4], [2e-3, 1e-3], 'zoomed in about the pointer: the middle picks the window\'s middle')
		// zoomed into a corner away from the color: no marker pinned to the edge
		await page.mouse.move(pz.x + pz.width * 0.95, pz.y + pz.height * 0.05)
		await page.keyboard.down('Control'); await page.mouse.wheel(0, -600); await page.keyboard.up('Control'); await page.waitForTimeout(200)
		ok(await ui.locator('#plane .cx').isHidden(), 'zoomed away from the color: the marker hides')
		await page.mouse.dblclick(...pmid); await page.waitForTimeout(200)
		close((await clickMid()).slice(0, 2), [0.5, 0.2], [1e-3, 1e-3], 'a double click shows the whole again')
		// a new pair starts whole: zoom, swap an axis and back, and the middle picks the full range's middle
		await page.mouse.move(pz.x + pz.width * 0.25, pz.y + pz.height * 0.75)
		await page.keyboard.down('Control'); await page.mouse.wheel(0, -400); await page.keyboard.up('Control'); await page.waitForTimeout(200)
		for (let k = 0; k < 6 && !(await ui.locator('#axes .labx').innerText() !== 'C'); k++) await ui.locator('#axes .labx').click()
		for (let k = 0; k < 6 && !(await ui.locator('#axes .labx').innerText() === 'C' && await ui.locator('#axes .laby').innerText() === 'L'); k++) await ui.locator(k % 2 ? '#axes .laby' : '#axes .labx').click()
		close((await clickMid()).slice(0, 2), [0.5, 0.2], [1e-3, 1e-3], 'another pair, then back: the plane is whole again')
		// ⌘ held mid-drag: the pick moves a tenth as far as the pointer
		await page.mouse.move(...pmid); await page.mouse.down()
		await page.keyboard.down('Meta'); await page.mouse.move(pmid[0] + 100, pmid[1], { steps: 5 }); await page.mouse.up(); await page.keyboard.up('Meta')
		await page.waitForTimeout(150)
		close((await held(ui)).slice(0, 2), [0.5, 0.2 + 0.1 * 100 / pz.width * 0.4], [2e-3, 1e-3], '⌘-drag: a tenth of the pointer\'s move')
		// letting go of ⌘ mid-drag keeps the offset: the next moves add at full rate, no jump back under the pointer
		const f0 = (await held(ui))[1]
		await page.mouse.move(...pmid); await page.mouse.down()
		await page.keyboard.down('Meta'); await page.mouse.move(pmid[0] + 100, pmid[1], { steps: 5 }); await page.keyboard.up('Meta')
		await page.mouse.move(pmid[0] + 120, pmid[1], { steps: 2 }); await page.mouse.up(); await page.waitForTimeout(150)
		close([(await held(ui))[1]], [0.2 + (0.1 * 100 + 20) / pz.width * 0.4], [1e-3], `⌘ let go mid-drag: the offset stays (from C ${f0.toFixed(3)})`)

		// two channels: one plane, no pair buttons; one channel: no plane, the bar alone still writes
		await pickSpace(ui, 'rg')
		ok(await ui.locator('#plane').isVisible() && await ui.locator('#axes .labx').isDisabled(), 'rg (two channels): the plane, its axes fixed')
		await pickSpace(ui, 'gray')
		ok(await ui.locator('#plane').isHidden() && await ui.locator('#channels .bar2:not(.alpha)').count() === 1, 'gray (one channel): no plane, one bar')
		const sets1 = (await writesOf()).length
		await ui.locator('#channels .nrg').first().focus()
		await page.keyboard.press('End')
		await page.waitForTimeout(150)
		ok((await writesOf()).length === sets1 + 1 && (await fill()).every(v => Math.abs(v - 1) < 1e-6), 'gray bar End: one write, white')

		// the window follows the content
		const sizes = await page.evaluate(() => window.__log.resize)
		// the content's own height (this page's host stylesheet holds the document at the window's height): its lowest
		// laid-out part, and the body's padding under it
		const docH = await frame.evaluate(() => Math.ceil(Math.max(...[...document.body.children].filter(e => e.offsetParent !== null && !e.matches('[popover]')).map(e => e.getBoundingClientRect().bottom)) + parseFloat(getComputedStyle(document.body).paddingBottom)))
		ok(sizes.length && sizes.at(-1)[0] === 288 && Math.abs(sizes.at(-1)[1] - docH) <= 1, `resize to content: ${JSON.stringify(sizes.at(-1))} vs ${docH}`)

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
		// a group: two shapes, a hidden one, and a frame holding one more
		const kid = (id, name, k, c, extra = {}) => ({ id, name, type: 'RECTANGLE', fills: [], strokes: [], ...extra, [k]: [solid(...c)] })
		const grp = [{ id: '5:9', name: 'Group', type: 'GROUP', children: ['5:10', '5:11', '5:14', '5:12'] }, kid('5:10', 'Dot', 'fills', [1, 0, 0]), kid('5:11', 'Ring', 'strokes', [0, 0, 1]),
			kid('5:14', 'Ghost', 'fills', [0.5, 0.5, 0.5], { visible: false }), { id: '5:12', name: 'Frame', type: 'FRAME', fills: [], strokes: [], children: ['5:13'] }, kid('5:13', 'Inner', 'fills', [1, 1, 0])]
		const { page, ui, errors } = await open({ profile, editorType: 'figma', nodes: [sky, photo, broken, gone, ...grp], variables: tokens, styles: pstyles, selection: ['5:1'], images: { h1: [red, blue], bad: 'corrupt' } })
		const frame = page.frames().find(f => f !== page.mainFrame())

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
		ok(await frame.evaluate(() => !!document.querySelector('#css ~ .foot #notes')), 'the notes sit under the copy fields')

		// the other colors: the selection's own (the gradient's other stop) – nothing else in the file, its variables and
		// styles included – as faint dots; the gradient's stops joined by a line through the knob; a dot names where its color lives
		await ui.locator('#marks .dm').first().waitFor()
		const marks = await ui.locator('#marks .dm').evaluateAll(els => els.map(e => e.dataset.tip))
		ok(marks.includes('Sky, fill 1, stop 1\n#ff0000'), 'the selection\'s other stop names its layer and place')
		ok(marks.length === 1, `nothing outside the selection is marked, the file's variables and styles included (${JSON.stringify(marks)})`)
		// the gradient's line: its colors as Figma mixes them (each channel of the file's RGB, linearly between stops), each
		// placed on the plane – checked against the library at the stops and halfway
		const line = (await ui.locator('#marks .links polyline').getAttribute('points') || '').split(' ').map(p => p.split(',').map(Number))
		const plane0 = await ui.locator('#plane').evaluate(pl => pl._polar)
		const g0 = (await page.evaluate(() => window.__paints('5:1', 'fills')))[0].gradientStops.map(s => [s.color.r, s.color.g, s.color.b])
		const posOf = rgb => { const v = valuesIn(profile, 'oklch', rgb); return [100 * v[1] / 0.4, 100 * (1 - v[0])] }   // the default OkLCh plane: C across (0–0.4), L up
		const mid = posOf(g0[0].map((x, k) => (x + g0[1][k]) / 2))
		ok(!plane0 && line.length === 25 && [[0, posOf(g0[0])], [12, mid], [24, posOf(g0[1])]].every(([k, p]) => Math.hypot(line[k][0] - p[0], line[k][1] - p[1]) < 0.05), `the gradient's line runs through its mixed colors: ${JSON.stringify([line[0], line[12], line[24]])} vs ${JSON.stringify([posOf(g0[0]), mid, posOf(g0[1])])}`)
		// on a square plane with the hue across, the line breaks where the mix wraps round the hue's ends (red → purple →
		// blue crosses 0/360) rather than striking across the plane
		await ui.locator('#axes .labx').click()   // C × L → H × L
		const runs = (await ui.locator('#marks .links polyline').evaluateAll(ls => ls.map(l => l.getAttribute('points').split(' ').map(p => p.split(',').map(Number)))))
		const jump = Math.max(...runs.flatMap(r => r.slice(1).map((p, k) => Math.abs(p[0] - r[k][0]))))
		ok(await ui.locator('#axes .labx').innerText() === 'H' && runs.length === 2 && jump < 50, `H × L: the gradient's line breaks at the hue wrap (${runs.length} runs, largest step ${jump.toFixed(1)}%)`)
		for (let k = 0; k < 6 && !(await ui.locator('#axes .labx').innerText() === 'C' && await ui.locator('#axes .laby').innerText() === 'L'); k++) await ui.locator(k % 2 ? '#axes .laby' : '#axes .labx').click()   // back to C × L
		ok(await ui.locator('#axes .labx').innerText() === 'C' && await ui.locator('#axes .laby').innerText() === 'L', 'and back to C × L')
		// the selection follows the edit at once: the stop just written is the other stop's dot when the first is current
		const written = (await page.evaluate(() => window.__paints('5:1', 'fills')))[0].gradientStops[1].color
		await ui.locator('.paint', { hasText: 'stop 1' }).click()
		ok((await ui.locator('#marks .dm').evaluateAll(els => els.map(e => e.dataset.tip))).includes(`Sky, fill 1, stop 2\n${'#' + [written.r, written.g, written.b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('')}`), 'the color just written is a dot on the next paint\'s plane')
		await ui.locator('.paint', { hasText: 'stop 2' }).click()
		const st2 = (await page.evaluate(() => window.__paints('5:1', 'fills')))[0].gradientStops[1]
		// a dot of the selection is taken up: a press makes its paint the current one and writes nothing; a press that drags
		// moves that paint, in one undo step
		const setsBefore = (await page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'set'))).length
		const dot1 = await ui.locator('#marks .dm[data-key*=":fills:0:0"]').boundingBox()
		await page.mouse.click(dot1.x + dot1.width / 2, dot1.y + dot1.height / 2)
		await page.waitForTimeout(100)
		ok(await ui.locator('.paint[aria-pressed="true"] .src').innerText() === 'fill 1, stop 1' && (await page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'set'))).length === setsBefore, 'a press on stop 1\'s dot makes it current and writes nothing')
		const dot2 = await ui.locator('#marks .dm[data-key*=":fills:0:1"]').boundingBox(), undoD = await page.evaluate(() => window.__log.undo)
		const stop1 = JSON.stringify((await page.evaluate(() => window.__paints('5:1', 'fills')))[0].gradientStops[0])
		await page.mouse.move(dot2.x + dot2.width / 2, dot2.y + dot2.height / 2)
		await page.mouse.down()
		await page.mouse.move(dot2.x + dot2.width / 2 - 30, dot2.y + dot2.height / 2 + 20, { steps: 4 })
		await page.mouse.up()
		await page.waitForTimeout(150)
		const gd = (await page.evaluate(() => window.__paints('5:1', 'fills')))[0].gradientStops
		ok(await ui.locator('.paint[aria-pressed="true"] .src').innerText() === 'fill 1, stop 2' && JSON.stringify(gd[0]) === stop1 && !near3(rgbOf(gd[1]), rgbOf(st2)) && gd[1].color.a === st2.color.a && await page.evaluate(n => window.__log.undo - n, undoD) === 1, 'a drag from stop 2\'s dot moves stop 2, its alpha kept, in one undo step')

		// a selected group shows the colors of what it holds, in layer order (hidden layers skipped); an edit writes the child,
		// and a change inside the group re-reads it
		let ng = await selections(page)
		await page.evaluate(() => window.__select(['5:9']))
		await settle(page, ng)
		const rows = await ui.locator('.paint').evaluateAll(els => els.map(e => e.querySelector('.pn').textContent + ' ' + e.querySelector('.src').textContent))
		ok(rows.join('|') === 'Dot fill 1|Ring stroke 1|Inner fill 1', `the group's colors, in layer order, the hidden one skipped: ${rows.join(' | ')}`)
		ng = await selections(page)
		await page.evaluate(() => window.__select(['5:11', '5:9']))
		await settle(page, ng)
		const rows2 = await ui.locator('.paint').evaluateAll(els => els.map(e => e.querySelector('.pn').textContent))
		ok(rows2.join('|') === 'Ring|Dot|Inner', `a group selected with one of its own layers lists that layer once: ${rows2.join(' | ')}`)
		await ui.locator('.paint', { hasText: 'Ring' }).click()
		const gw = expectWrite(profile, 'oklch', valuesIn(profile, 'oklch', [0, 0, 1]), 0, 0.5)
		await edit(page, ui, 0, 0.5)
		close(rgbOf((await page.evaluate(() => window.__paints('5:11', 'strokes')))[0]), gw.rgb, 1e-12, 'the edit writes the child inside the group')
		ng = await selections(page)
		await page.evaluate(() => window.__edit('5:13', 'fills', [{ type: 'SOLID', visible: true, opacity: 1, blendMode: 'NORMAL', color: { r: 0, g: 1, b: 0 } }]))
		await settle(page, ng)
		ok(await ui.locator('.paint', { hasText: 'Inner' }).locator('.sw').evaluate(e => e.style.background.includes(' 0 1 0')), 'a change two levels inside the group re-reads it')

		// an image alone: its pixels as dots, and the pixel nearest its mean as a paint that moves but writes nothing
		let n = await selections(page)
		await page.evaluate(() => window.__select(['5:2']))
		await settle(page, n)
		await ui.locator('#picker').waitFor({ timeout: 10000 })
		const hx = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('')
		const stand = await asFmt(ui, 'hex')
		const sb = [1, 3, 5].map(k => parseInt(stand.slice(k, k + 2), 16))   // a pixel of the image: red, blue, or a blend where the halves meet
		ok(/^#[0-9a-f]{6}$/.test(stand) && sb.every((v, k) => v >= Math.min(red[k], blue[k]) && v <= Math.max(red[k], blue[k])), `the image's color is one of its own pixels: ${stand}`)
		ok(await ui.locator('#channels .bar2.alpha').isHidden(), 'an image\'s color has no opacity row')
		// each bar carries the image's histogram of its channel, over the bar's own field
		await frame.waitForFunction(() => [...document.querySelectorAll('#channels .bar2:not(.alpha) .hist')].some(h => !h.hidden), null, { timeout: 10000 }).catch(() => {})
		const lanes = await frame.evaluate(() => [...document.querySelectorAll('#channels .bar2:not(.alpha)')].map(b => { const h = b.querySelector('.hist'); return [!!h && !h.hidden && /^url\(/.test(h.style.maskImage || h.style.webkitMaskImage), !b.querySelector('canvas').hidden || /gradient/.test(b.style.background)] }))
		ok(lanes.length === 3 && lanes.every(([h, field]) => h && field), `an image's histogram on every bar, the bars keeping their fields: ${JSON.stringify(lanes)}`)
		await planePainted(frame)
		const dots = await frame.evaluate(() => { const cv = document.querySelector('#plane .density'); return cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data.some((v, i) => i % 4 === 3 && v > 0) })
		ok(dots, 'the image\'s pixels are dots on the plane')
		ok(/Dots are image pixels\. Select a fill or stroke to edit a color\./.test(await notes(ui)), `image-only notes: ${await notes(ui)}`)
		ok(await ui.locator('.paint').first().getAttribute('aria-pressed') === 'true', 'the image\'s row is the current row, shaded like any other')
		const sets0 = (await page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'set'))).length
		const pb = await ui.locator('#plane').boundingBox()
		await page.mouse.click(pb.x + pb.width * 0.5, pb.y + pb.height * 0.5)
		await page.waitForTimeout(100)
		ok((await page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'set'))).length === sets0, 'the image\'s color explores without writing')

		// a selection without an image: no histogram lanes
		{ const n2 = await selections(page); await page.evaluate(() => window.__select(['5:1'])); await settle(page, n2); await page.waitForTimeout(200)
			ok(await frame.evaluate(() => [...document.querySelectorAll('#channels .bar2 .hist')].every(h => h.hidden)), 'no image: no histogram') }
		// an image that can't be decoded, or whose bytes Figma no longer has: no dots, and the plain hint, not a wait
		for (const id of ['5:3', '5:4']) {
			n = await selections(page)
			await page.evaluate(id => window.__select([id]), id)
			await settle(page, n)
			await ui.locator('#empty', { hasText: 'Select a layer' }).waitFor({ timeout: 10000 })
			ok(await ui.locator('#picker').isHidden(), `${id === '5:3' ? 'undecodable' : 'missing'} image: the empty state, no picker`)
		}

		// an image beside a gradient: the legend names both kinds of dots
		n = await selections(page)
		await page.evaluate(() => window.__select(['5:1', '5:2']))
		await settle(page, n)
		await frame.waitForFunction(() => /image pixels/.test(document.getElementById('notes').textContent), null, { timeout: 10000 })
		ok(/Dots are other selected colors and image pixels\./.test(await notes(ui)), `gradient and image: the dots' legend (${await notes(ui)})`)

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
		let r2, { r, ui } = await generate({ profile: 'SRGB', nodes: [card], codegen: {} }, '6:1')
		ok(!ui, 'codegen opens no UI')
		const want = `background: ${oklch3(space.rgb.oklch(255, 127.5, 0))};\nborder-color: ${oklch3(space.rgb.oklch(0, 0, 0)).replace(/\)$/, ' / 0.5)')};`
		ok(r[0].language === 'CSS' && r[0].code === want, `codegen oklch (default):\n${r[0].code}\nwant\n${want}`)
		;({ r } = await generate({ profile: 'SRGB', nodes: [tok], variables, codegen: { format: 'lab' } }, '6:2'))
		const wantTok = `color: var(--brand-500, ${css('lab', space.rgb.lab(0.2 * 255, 0.4 * 255, 0.6 * 255))}); /* variable Brand/500 */`
		ok(r[0].code === wantTok, `codegen lab, a text color from a variable:\n${r[0].code}\nwant\n${wantTok}`)
		;({ r } = await generate({ profile: 'DISPLAY_P3', nodes: [{ id: '6:3', name: 'Red', type: 'RECTANGLE', fills: [solid(1, 0, 0)], strokes: [] }], codegen: { format: 'hex' } }, '6:3'))
		const m = gamutMap(space.p3.oklch(1, 0, 0), DEST.rgb).rgb.map(v => v * 255)
		ok(r[0].code === `background: #${m.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')}; /* mapped into sRGB */`, `codegen hex of P3 red maps into sRGB: ${r[0].code}`)
		;({ r } = await generate({ profile: 'DISPLAY_P3', nodes: [{ id: '6:4', name: 'Red', type: 'RECTANGLE', fills: [solid(1, 0, 0)], strokes: [] }], codegen: { format: 'p3' } }, '6:4'))
		ok(r[0].code === 'background: color(display-p3 1 0 0);', `codegen display-p3 in a P3 file: ${r[0].code}`)
		// a frame: its inner colors once each, as custom properties – a token by its name, a raw color by its first layer's,
		// a second layer of the same name numbered; the layers that use each in its comment
		const brand = [0.2, 0.4, 0.6]
		const inner = [
			{ id: '6:5', name: 'Card', type: 'FRAME', fills: [], strokes: [], children: ['6:6', '6:7', '6:8', '6:9', '6:10'] },
			{ ...tok, id: '6:6', name: 'Title' }, { ...tok, id: '6:9', name: 'Subtitle' },
			{ id: '6:7', name: 'Icon', type: 'VECTOR', fills: [solid(...brand)], strokes: [] },
			{ id: '6:8', name: 'Divider', type: 'LINE', fills: [], strokes: [solid(0, 0, 0, { opacity: 0.5 })] },
			{ id: '6:10', name: 'Icon', type: 'VECTOR', fills: [solid(1, 0, 0)], strokes: [] },
		]
		;({ r } = await generate({ profile: 'SRGB', nodes: inner, variables, codegen: {} }, '6:5'))
		const c3 = rgb => oklch3(space.rgb.oklch(...rgb.map(v => v * 255)))
		const wantInside = [
			`--brand-500: ${c3(brand)}; /* variable Brand/500; Title, Subtitle */`,
			`--icon: ${c3(brand)}; /* Icon */`,
			`--divider: ${c3([0, 0, 0]).replace(/\)$/, ' / 0.5)')}; /* Divider */`,
			`--icon-2: ${c3([1, 0, 0])}; /* Icon */`,
		].join('\n')
		;({ r: r2 } = await generate({ profile: 'SRGB', nodes: [{ id: '6:11', name: 'Empty', type: 'FRAME', fills: [solid(1, 1, 1)], strokes: [], children: ['6:12'] }, { id: '6:12', name: 'Blank', type: 'GROUP', fills: [], strokes: [], children: [] }], codegen: {} }, '6:11'))
		ok(r2.length === 1 && r2[0].code === `background: ${oklch3(space.rgb.oklch(255, 255, 255))};`, `codegen of a frame with no colors inside: its own only (${JSON.stringify(r2)})`)
		ok(r.length === 2 && r[0].code === '/* no solid or gradient colors */' && r[1].title === 'Colors inside' && r[1].code === wantInside, `codegen of a frame, its colors inside:\n${r[1]?.code}\nwant\n${wantInside}`)
	}

	/* ---------- 7. opacity: a solid paint's own, a gradient stop's alpha; written where it lives ---------- */
	{
		const profile = 'SRGB'
		const alias = id => ({ type: 'VARIABLE_ALIAS', id })
		const nodes = [
			{ id: '7:1', name: 'Veil', type: 'RECTANGLE', fills: [solid(0.2, 0.3, 0.4, { opacity: 0.6 })], strokes: [] },
			{ id: '7:2', name: 'Fade', type: 'RECTANGLE', strokes: [], fills: [{ type: 'GRADIENT_LINEAR', visible: true, opacity: 1, blendMode: 'NORMAL', gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: [{ position: 0, color: { r: 1, g: 0, b: 0, a: 1 } }, { position: 1, color: { r: 0, g: 0, b: 1, a: 0.5 } }] }] },
			{ id: '7:3', name: 'Token', type: 'RECTANGLE', fills: [solid(0.1, 0.6, 0.3, { opacity: 0.8, boundVariables: { color: alias('V:o') } })], strokes: [], modes: { C: 'm' } },
			{ id: '7:4', name: 'Styled', type: 'RECTANGLE', fills: [solid(0.9, 0.7, 0.1)], strokes: [], fillStyleId: 'S:o' },
			{ id: '7:5', name: 'TokenStop', type: 'RECTANGLE', strokes: [], modes: { C: 'm' }, fills: [{ type: 'GRADIENT_LINEAR', visible: true, opacity: 1, blendMode: 'NORMAL', gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: [{ position: 0, color: { r: 0, g: 0, b: 0, a: 0.4 }, boundVariables: { color: alias('V:s') } }, { position: 1, color: { r: 1, g: 1, b: 1, a: 1 } }] }] },
		]
		const variables = { 'V:o': { name: 'Green', collection: 'C', values: { m: { r: 0.1, g: 0.6, b: 0.3, a: 1 } } }, 'V:s': { name: 'Shadow', collection: 'C', values: { m: { r: 0, g: 0, b: 0, a: 0.4 } } } }
		const styles = { 'S:o': { name: 'Amber', paints: [solid(0.9, 0.7, 0.1)] } }
		const { page, ui, errors } = await open({ profile, editorType: 'figma', nodes, variables, styles, selection: ['7:1'] })
		const field = ui.locator('#channels .cv[data-i="a"]'), knob = ui.locator('#channels .nrg[data-i="a"]')
		const fills = id => page.evaluate(id => window.__paints(id, 'fills'), id)
		const pick = async ids => { const n = await selections(page); await page.evaluate(ids => window.__select(ids), ids); await settle(page, n) }
		async function typeAlpha(pct) {
			const n = await selections(page), w = await page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'set').length)
			await field.fill(String(pct))
			await field.press('Tab')
			await page.waitForFunction(w => window.__log.fromUI.filter(m => m.type === 'set').length > w, w)
			await settle(page, n)
			await page.waitForTimeout(30)
		}

		ok(await field.inputValue() === '60' && await knob.getAttribute('aria-valuenow') === '60', `a solid paint's opacity reads 60%: ${await field.inputValue()}`)
		ok(/ \/ 0\.6\)$/.test(await ui.locator('#css-1').inputValue()), 'the opacity rides the CSS')
		await typeAlpha(25)
		let f = (await fills('7:1'))[0]
		ok(f.opacity === 0.25, `typed 25%: the paint's opacity is 0.25 (${f.opacity})`)
		close(rgbOf(f), [0.2, 0.3, 0.4], 1e-12, 'the opacity edit leaves the color alone')
		const undo0 = await page.evaluate(() => window.__log.undo)
		await knob.focus()
		await page.keyboard.press('ArrowRight')
		await page.waitForFunction(() => window.__paints('7:1', 'fills')[0].opacity === 0.26, null, { timeout: 3000 }).catch(() => {})
		ok((await fills('7:1'))[0].opacity === 0.26, `→ on the opacity knob: one percent up (${(await fills('7:1'))[0].opacity})`)
		// a drag along the bar: live writes, one commit (one undo step), and it lands where it was let go
		const bb = await ui.locator('#channels .bar2.alpha').boundingBox(), kw = await knob.evaluate(k => k.offsetWidth)
		const xAt = fr => bb.x + kw / 2 + fr * (bb.width - kw)
		const undo1 = await page.evaluate(() => window.__log.undo)
		await page.mouse.move(xAt(0.3), bb.y + bb.height / 2)
		await page.mouse.down()
		for (const fr of [0.4, 0.55]) await page.mouse.move(xAt(fr), bb.y + bb.height / 2)
		// mid-drag, a re-read that trails the live writes (here: one still holding 55%) doesn't pull the knob back
		await page.mouse.move(xAt(0.7), bb.y + bb.height / 2)
		await page.waitForTimeout(100)
		const stale = () => page.evaluate(() => { const m = window.__log.toUI.filter(m => m.type === 'selection').at(-1); figma.ui.postMessage({ ...m, ack: m.ack - 1, paints: m.paints.map(p => ({ ...p, opacity: 0.55 })) }) })
		await stale()
		await page.waitForTimeout(50)
		ok(await knob.getAttribute('aria-valuenow') === '70', `mid-drag the knob holds where the pointer is, through the re-reads (${await knob.getAttribute('aria-valuenow')})`)
		await page.mouse.move(xAt(0.75), bb.y + bb.height / 2)
		await page.mouse.up()
		await page.waitForTimeout(200)
		const fd = (await fills('7:1'))[0].opacity
		ok(Math.abs(fd - 0.75) <= 0.011 && await page.evaluate(n => window.__log.undo - n, undo1) === 1, `an opacity drag lands at 75% in one undo step (${fd}, ${await page.evaluate(n => window.__log.undo - n, undo1)} steps; keys made ${await page.evaluate(n => window.__log.undo - n, undo0) - 1})`)
		ok(await field.inputValue() === String(Math.round(fd * 100)), `the field follows the drag (${await field.inputValue()})`)
		// after the release too: a re-read that answers an earlier write (Figma's may land after the commit is sent) changes nothing
		await stale()
		await page.waitForTimeout(50)
		ok(await knob.getAttribute('aria-valuenow') === String(Math.round(fd * 100)), `a re-read trailing the release keeps the knob (${await knob.getAttribute('aria-valuenow')})`)
		// and its color: a trailing re-read of an older color leaves the swatch and the CSS as written
		const hex0 = await asFmt(ui, 'hex'), sw0 = await ui.locator('.paint .sw').first().evaluate(e => e.style.background)
		await page.evaluate(() => { const m = window.__log.toUI.filter(m => m.type === 'selection').at(-1); figma.ui.postMessage({ ...m, ack: m.ack - 1, paints: m.paints.map(p => ({ ...p, r: 0, g: 0, b: 0 })) }) })
		await page.waitForTimeout(50)
		ok(await ui.locator('#css-1').inputValue() === hex0 && await ui.locator('.paint .sw').first().evaluate(e => e.style.background) === sw0, `a re-read trailing a write keeps the color as written (${await ui.locator('#css-1').inputValue()} vs ${hex0})`)
		// a re-read that has seen every write is the truth, even when it differs (an edit made in Figma)
		await page.evaluate(() => { const all = window.__log.toUI.filter(m => m.type === 'selection'), m = all.at(-1); figma.ui.postMessage({ ...m, ack: Math.max(...all.map(m => m.ack)), paints: m.paints.map(p => ({ ...p, r: 0, g: 0, b: 0 })) }) })
		await page.waitForTimeout(50)
		ok(/^#000000/.test(await ui.locator('#css-1').inputValue()), `a current re-read is taken (${await ui.locator('#css-1').inputValue()})`)
		await pick(['7:1'])   // a real re-read: back to the paint as it is
		// typed past either end: clamped to 100% and 0%
		await typeAlpha(150)
		ok((await fills('7:1'))[0].opacity === 1 && await field.inputValue() === '100', `typed 150%: 100% (${(await fills('7:1'))[0].opacity})`)
		await typeAlpha(-5)
		ok((await fills('7:1'))[0].opacity === 0 && await field.inputValue() === '0', `typed -5%: 0% (${(await fills('7:1'))[0].opacity})`)

		// a gradient stop: its alpha; the color, the position and the other stop stay
		await pick(['7:2'])
		await ui.locator('.paint', { hasText: 'stop 2' }).click()
		ok(await field.inputValue() === '50', `a stop's alpha reads 50% (${await field.inputValue()})`)
		await typeAlpha(80)
		const gs = (await fills('7:2'))[0].gradientStops
		ok(gs[1].color.a === 0.8 && gs[1].position === 1 && JSON.stringify(gs[0].color) === '{"r":1,"g":0,"b":0,"a":1}', `typed 80%: stop 2's alpha is 0.8, stop 1 untouched (${JSON.stringify(gs)})`)
		close(rgbOf(gs[1]), [0, 0, 1], 1e-12, 'the stop keeps its color')

		// a solid bound to a token: the token keeps its own alpha; the opacity is the layer's paint's
		await pick(['7:3'])
		ok(await field.inputValue() === '80', `a token-bound solid reads its paint's opacity, 80% (${await field.inputValue()})`)
		await typeAlpha(40)
		f = (await fills('7:3'))[0]
		ok(f.opacity === 0.4 && f.boundVariables?.color?.id === 'V:o', `typed 40%: the paint's opacity, still bound to the token (${f.opacity})`)
		ok((await page.evaluate(() => window.__var('V:o'))).m.a === 1, 'the token\'s alpha stays 1')

		// a style-linked solid: the style's paint changes, the layer stays linked
		await pick(['7:4'])
		await typeAlpha(30)
		ok((await page.evaluate(() => window.__style('S:o')))[0].opacity === 0.3 && !(await page.evaluate(() => window.__log.writes.some(w => w.id === '7:4'))), 'typed 30%: written into the style, not onto the layer')
		ok(await page.evaluate(() => window.__node('7:4').fillStyleId) === 'S:o', 'the layer keeps its style')

		// a stop bound to a token: the alpha is the token's
		await pick(['7:5'])
		await ui.locator('.paint', { hasText: 'Shadow' }).click()
		ok(await field.inputValue() === '40', `a token-bound stop reads the token's alpha, 40% (${await field.inputValue()})`)
		await typeAlpha(20)
		ok((await page.evaluate(() => window.__var('V:s'))).m.a === 0.2, `typed 20%: the token's alpha (${(await page.evaluate(() => window.__var('V:s'))).m.a})`)

		ok(!errors.length, `opacity page errors: ${errors.join(' | ')}`)
		await page.context().close()
	}

	/* ---------- 8. languages: the browser's, where the plugin has a table for it, else English ---------- */
	{
		const tr = l => Object.fromEntries(Object.entries(JSON.parse(readFileSync(dir + `src/i18n/${l}.json`, 'utf8'))).filter(([k]) => k !== '@meta').map(([k, v]) => [k, v.t]))
		const site = l => Object.fromEntries(Object.entries(JSON.parse(readFileSync(new URL(`../web/i18n/${l}.json`, import.meta.url), 'utf8'))).filter(([k]) => k !== '@meta').map(([k, v]) => [k, v.t]))
		const node = { id: '8:1', name: 'Swatch', type: 'RECTANGLE', fills: [solid(0.25, 0.5, 0.75)], strokes: [] }
		// the browser's languages as the panel's first script reads them (the mock sets navigator.languages: an emulated
		// locale reaches a sandboxed frame only after its first script has run)
		const said = async (locale, want) => {
			const { page, ui, errors } = await open({ profile: 'SRGB', editorType: 'figma', nodes: [node], selection: ['8:1'], languages: [locale].flat() })
			const got = { lang: await ui.locator('html').getAttribute('lang'), gamut: await ui.locator('#gamut').innerText(), smooth: await ui.locator('#quant option[value="0"] .nm').textContent(), search: await ui.locator('#spq').getAttribute('placeholder') }
			ok(Object.entries(want).every(([k, v]) => got[k].trim() === v) && !errors.length, `${locale}: ${JSON.stringify(got)} vs ${JSON.stringify(want)} ${errors.join(' | ')}`)
			await page.context().close()
		}
		const de = tr('de'), sde = site('de')
		await said('de-DE', { lang: 'de', gamut: de['pl.gamut.in'].replace('{gamut}', 'sRGB'), smooth: sde['ui.quant.smooth'], search: de['pl.menu.search'] })   // its own words and the site's
		const pt = tr('pt')
		await said('pt-BR', { lang: 'pt', gamut: pt['pl.gamut.in'].replace('{gamut}', 'sRGB'), smooth: site('pt')['ui.quant.smooth'], search: pt['pl.menu.search'] })   // a region falls to its language
		const zh = tr('zh-Hans')
		await said('zh-CN', { lang: 'zh-Hans', gamut: zh['pl.gamut.in'].replace('{gamut}', 'sRGB'), smooth: site('zh-Hans')['ui.quant.smooth'], search: zh['pl.menu.search'] })   // Simplified Chinese
		await said('zh-TW', { lang: 'en', gamut: 'In sRGB.', smooth: 'smooth', search: 'Search spaces' })   // Traditional: no table, English
		await said('nl-NL', { lang: 'en', gamut: 'In sRGB.', smooth: 'smooth', search: 'Search spaces' })   // no Dutch: English
		await said(['en-US', 'ru-RU'], { lang: 'en', gamut: 'In sRGB.', smooth: 'smooth', search: 'Search spaces' })   // English first: a second language read is no reason to switch
		await said(['nl-NL', 'de-DE'], { lang: 'en', gamut: 'In sRGB.', smooth: 'smooth', search: 'Search spaces' })   // only the first language counts
	}

	/* ---------- 4. Dev Mode and LEGACY ---------- */
	{
		const node = { id: '3:1', name: 'Swatch', type: 'RECTANGLE', fills: [solid(0.25, 0.5, 0.75)], strokes: [] }
		const { page, ui, errors } = await open({ profile: 'LEGACY', editorType: 'dev', nodes: [node], selection: ['3:1'] })
		ok(await ui.locator('#profile').textContent() === 'sRGB, legacy', 'LEGACY labelled as sRGB')
		close(await shown(ui), valuesIn('SRGB', 'oklch', [0.25, 0.5, 0.75]), halfStep('oklch'), 'LEGACY read as sRGB')
		ok(await inputs(ui).first().evaluate(e => e.readOnly) && await ui.locator('#channels .cv[data-i="a"]').evaluate(e => e.readOnly), 'Dev Mode inputs, the opacity\'s too, are read-only')
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
		const clear = await ui.locator('#channels .cl:not([data-i="a"])').evaluateAll(els => els.map(s => {
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
