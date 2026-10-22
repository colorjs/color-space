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
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import space from '../index.js'
import { classify, decOf, fmtc } from '../web/js/core.js'
import * as PALETTES from '../web/js/palettes.js'
import { quantRGB } from '../web/js/quant.js'
import NAMES from '../web/js/names.js'
import { gamutMap, deltaEOK, DEST, JND } from '../plugins/figma/src/gamut.js'
import { cssShort, cssOf } from '../plugins/figma/src/notation.js'
import { CSS, css } from '../css.js'
import { host } from './figma-mock.js'
import Color from 'colorjs.io'

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
// the short lab()/lch(): two decimals, and every 8-bit sRGB color comes back to its own bytes (every fifth level of each
// channel, the ends included); at one decimal some would not
{
	const parse = str => str.match(/-?[\d.]+/g).map(Number), off = { 2: 0, 1: 0 }
	for (let r = 0; r <= 255; r += 5) for (let g = 0; g <= 255; g += 5) for (let b = 0; b <= 255; b += 5)
		for (const [f, back] of [['lab', v => space.lab.rgb(...v)], ['lchab', v => space.lchab.rgb(...v)]]) {
			const v = space.rgb[f](r, g, b), same = x => x.every((u, k) => Math.round(u) === [r, g, b][k])
			if (!same(back(parse(cssShort(f, v))))) off[2]++
			if (!same(back(v.map(u => +u.toFixed(1))))) off[1]++
		}
	ok(off[2] === 0 && off[1] > 0, `lab()/lch() at two decimals: every 8-bit sRGB color back to its bytes (${off[2]} off; at one decimal ${off[1]})`)
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
// the system's scrollbars, as a mouse-driven Mac or Windows draws them: they take room (Playwright hides them by default,
// which once let a palette lose its last column to one unseen)
const browser = await chromium.launch({ headless: true, executablePath, ignoreDefaultArgs: ['--hide-scrollbars'] })
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

	// the checks read CSS oklch() in the value field unless a session says otherwise (the panel's own default is the space's
	// notation, checked in the Dev Mode session)
	async function open(setup, b = browser) {
		if (!('format' in (setup.stored || {}))) setup = { ...setup, stored: { ...setup.stored, format: 'oklch' } }
		const context = await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: setup.dsf || 1 })
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
	// the value: the coordinates its cells were written from (unrounded) and the opacity ride on it; a channel is typed as a
	// person would paste a whole value into a cell – the space's own notation with that channel (or the opacity, 'a', in
	// percent) replaced – then Enter
	const held = async ui => { const d = await ui.locator('#valf').getAttribute('data-v'); return d ? JSON.parse(d) : [] }
	const alphaOf = async ui => +(await ui.locator('#valf').getAttribute('data-a'))
	const setCh = async (ui, i, x) => {
		const sp = await ui.locator('#spbtn').getAttribute('data-id'), v = await held(ui), a = await alphaOf(ui), f = ui.locator('#cells input').first()
		if (i !== 'a') v[i] = +x
		await f.fill(`${sp}(${v.join(' ')} / ${i === 'a' ? +x / 100 : a})`)
		await f.press('Enter')
	}
	// the space menu, as a person uses it: open, click the space
	// the space field, as a person uses it: type a name (or an id) the list offers
	const frame1Fonts = page => page.frames().find(f => f !== page.mainFrame()).evaluate(async () => { await document.fonts.load('16px "color-space icons"', '▥'); return document.fonts.check('16px "color-space icons"', '▥') })
	// the space, as a person picks it: into its field, type, click the space the list offers
	const pickSpace = async (ui, id) => {
		await ui.locator('#spq').click()
		await ui.locator('#spq').fill(id)
		await ui.locator(`#splist .spo[data-id="${id}"]`).first().click()
	}
	const spaceOf = ui => ui.locator('#spbtn').getAttribute('data-id')
	const near3 = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-3)
	// the value in a notation: its row in the copy list, what a pick there copies
	const asFmt = (ui, f) => ui.locator(`#fmt option[value="${f}"]`).getAttribute('data-copy')
	// the cells' numbers, as they read
	const cellsText = ui => ui.locator('#cells input').evaluateAll(xs => xs.map(x => x.value).join(' '))
	const QV = { smooth: '0', '10-step': '10', Tailwind: 'tailwind' }
	// the settings (a popover under the top row's mark): opened if closed; the Quantize lens is one of its rows
	const openPrm = async ui => { if (!(await ui.locator('#prm').evaluate(e => e.matches(':popover-open')))) await ui.locator('#prmb').click() }
	const closePrm = ui => ui.locator('#prm').evaluate(e => e.hidePopover())
	const quant = async (ui, label) => { await openPrm(ui); await ui.locator('#quant').selectOption(QV[label]); await closePrm(ui) }
	const shown = ui => held(ui)
	// the gamut's line on the plane, drawn into its field at half strength in the letters' ink (gl.js uEdge): the pixels it
	// lightens or darkens – each one's least channel standing well above or below both its neighbours two away across it
	// (along x or along y), where a field's smooth sweep moves a little – counted, a signature, and up to 400 sampled
	const edgeOf = ui => ui.locator('#plane canvas:not(.density)').evaluate(cv => {
		const w = cv.width, d = cv.getContext('2d').getImageData(0, 0, w, w).data, px = []
		const lo = (x, y) => { const i = (y * w + x) * 4; return d[i + 3] === 255 ? Math.min(d[i], d[i + 1], d[i + 2]) : NaN }
		// its ink: one over the whole field – lighter than the field around each line pixel, or darker, never both – and the
		// field's own mean (its opaque pixels' luminance, every fourth; under half, dark)
		const lum = (x, y) => { const i = (y * w + x) * 4; return 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2] }
		let white = 0, sig = 0, lighter = 0, darker = 0, L = 0, n = 0
		for (let i = 0; i < d.length; i += 16) if (d[i + 3] > 128) { L += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; n++ }
		for (let y = 2; y < w - 2; y++) for (let x = 2; x < w - 2; x++) {
			const c = lo(x, y)
			const bump = (a, b) => c - Math.max(a, b) > 12 || Math.min(a, b) - c > 12
			const across = bump(lo(x - 2, y), lo(x + 2, y)), [a, b] = across ? [[x - 2, y], [x + 2, y]] : [[x, y - 2], [x, y + 2]]
			if (!(across || bump(lo(x, y - 2), lo(x, y + 2)))) continue
			const field = (lum(...a) + lum(...b)) / 2
			if (lum(x, y) > field + 8) lighter++; else if (lum(x, y) < field - 8) darker++
			const i = y * w + x
			white++; sig = (sig * 31 + i) % 1e9; px.push([x, y])
		}
		return { w, white, sig, lighter, darker, dark: L / n < 128, px: px.filter((_, k) => k % Math.ceil(px.length / 400 || 1) === 0) }
	})
	// the plane's field as opaque or void, every fourth pixel each way, and a check of it against a gamut: a pixel is
	// opaque exactly where its coordinate (pixel → [x, y] fractions across and up) is inside, away from the edge (2 px)
	const fieldOf = ui => ui.locator('#plane canvas:not(.density)').evaluate(cv => {
		const w = cv.width, d = cv.getContext('2d').getImageData(0, 0, w, w).data, px = []
		for (let y = 1; y < w - 1; y += 4) for (let x = 1; x < w - 1; x += 4) px.push([x, y, d[(y * w + x) * 4 + 3]])
		return { w, px }
	})
	const cutAt = ({ w, px }, inside) => px.filter(([x, y, a]) => {
		const at = (i, j) => inside((x + 0.5 + i) / w, 1 - (y + 0.5 + j) / w), n = [-2, 0, 2].flatMap(i => [-2, 0, 2].map(j => at(i, j)))
		return n.every(v => v === n[0]) && (a === 255) !== n[0]
	})
	// a pixel within r px of a gamut's edge: a point within r of its centre (sampled every quarter pixel) on the edge's other
	// side. inside(fx, fy): the field's fractions across and up
	const nearEdge = (x, y, w, inside, r) => {
		const at = (i, j) => inside((x + 0.5 + i) / w, 1 - (y + 0.5 + j) / w), c = at(0, 0)
		for (let j = -r; j <= r; j += 0.25) for (let i = -r; i <= r; i += 0.25) if (i * i + j * j <= r * r && at(i, j) !== c) return true
		return false
	}
	// the coordinates the UI holds at full precision: each bar's range input carries its channel unrounded
	// the coordinates the UI holds at full precision: each value cell carries its channel unrounded (data-v)
	const settle = (page, n) => page.waitForFunction(n => window.__log.toUI.filter(m => m.type === 'selection').length > n, n)
	const selections = page => page.evaluate(() => window.__log.toUI.filter(m => m.type === 'selection').length)
	const lastSet = page => page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'set').at(-1))
	// what the panel says: the gamut status line, then the notes
	const notes = async ui => (await ui.locator('#gamut').innerText().catch(() => '')) + '\n' + (await ui.locator('#err').innerText().catch(() => '')) + '\n' + (await ui.locator('#notes').innerText().catch(() => ''))   // the status, an error, the notes

	/** Type a value into channel i and commit it, then wait for the write and the re-read. */
	async function edit(page, ui, i, value) {
		const before = await selections(page)
		const writes = await page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'set').length)
		await setCh(ui, i, value)
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
		ok(await ui.locator('#badge, #anotes').count() === 0 && /^In sRGB\.$/.test(await ui.locator('#gamut').innerText()), 'no gamut mark, no notes card: the plane shows the file\'s colors alone; screen readers hear the gamut')
		ok(await spaceOf(ui) === 'oklch', 'default space is oklch')
		ok(await frame1Fonts(page), 'the lens selects\' icon font is loaded in the panel')
		// the space: its field shows its name; focused, it lists every space (Featured bold), the current one checked and
		// shown; the family select narrows the list to a family; typing filters it (by name or id); the field is the search
		ok(await ui.locator('#spq').inputValue() === 'OKLCH', `the field shows the space's name (${await ui.locator('#spq').inputValue()})`)
		await ui.locator('#spbtn').click()
		ok(await ui.locator('#spmenu').isVisible() && await ui.locator('#spq').getAttribute('aria-expanded') === 'true', 'a click in the field opens the list under it')
		ok(await ui.locator('#spgroup').inputValue() === 'featured' && await ui.locator('#splist .spo').count() === 21 && await ui.locator('#splist .spo.feat').count() === 21, 'Featured first: each family\'s three')
		ok(await ui.locator('#splist .spo[aria-selected="true"]').getAttribute('data-id') === 'oklch' && await ui.locator('#splist .spo[aria-selected="true"] .ok').isVisible() && await ui.locator('#splist .spo.on').getAttribute('data-id') === 'oklch', 'the current space checked, and the arrows start there')
		await ui.locator('#spgroup').click()
		ok(await ui.locator('#spgroup').evaluate(g => { const p = [...g.querySelectorAll('option')].at(-1).parentElement; return [...g.options].every(o => { const r = o.getBoundingClientRect(); return r.height > 0 && r.bottom <= innerHeight }) }), 'the family list shows every family at once, no scrolling')
		await page.keyboard.press('Escape')
		await ui.locator('#spgroup').selectOption('all')
		ok(await ui.locator('#splist .spo').count() === Object.keys(space).length, 'All spaces: every space, once')
		const seq = await ui.locator('#spgroup').evaluate(g => [...g.children].filter(c => c.tagName !== 'BUTTON').map(c => c.tagName === 'HR' ? '—' : c.value))
		ok(seq.slice(0, 4).join() === 'all,—,featured,—' && seq.filter(x => x === '—').length === 2, `All spaces and Featured each parted from what follows (${seq.slice(0, 5)})`)
		await ui.locator('#spgroup').selectOption('Camera')
		const film = await ui.locator('#splist .spo').evaluateAll(es => es.map(e => e.dataset.id))
		ok(film.includes('slog3') && !film.includes('oklch') && await ui.locator('#spmenu').isVisible(), `the family select narrows the list to a family (${film.length})`)
		await ui.locator('#spgroup').selectOption('featured')
		await ui.locator('#spq').fill('osa')
		{ const osa = await ui.locator('#splist .spo').evaluateAll(es => es.map(e => e.dataset.id))
		ok(osa.includes('osaucs') && osa.every(id => id.startsWith('osaucs')), `typing searches every space, whatever the family (OSA-UCS isn't featured): ${osa}`) }
		await ui.locator('#spq').fill('zzz')
		ok(await ui.locator('#splist .spnone').isVisible(), 'a search with no match says so')
		await ui.locator('#spq').fill('cam16-u')
		await page.keyboard.press('Enter')
		ok(await spaceOf(ui) === 'cam16-ucs' && await ui.locator('#spmenu').isHidden() && await ui.locator('#spq').inputValue() === 'CAM16-UCS', `Enter takes the highlighted space, closes the menu, and the field names it (${await ui.locator('#spq').inputValue()})`)
		await ui.locator('#spbtn').click()
		await ui.locator('#spq').fill('lab')
		await page.keyboard.press('Escape')
		ok(await ui.locator('#spmenu').isHidden() && await ui.locator('#spq').inputValue() === 'CAM16-UCS' && await spaceOf(ui) === 'cam16-ucs', 'Escape closes the menu, the field names the space again, nothing taken')
		// a press outside only closes it: the control under the press (a swatch, below the menu) doesn't act
		await ui.locator('#spbtn').click()
		const acts = () => page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'set' || m.type === 'choose').length), acts0 = await acts()
		await ui.locator('#paints .paint').first().click()
		await page.waitForTimeout(100)
		ok(await ui.locator('#spmenu').isHidden() && await acts() === acts0, 'a press outside closes the menu and nothing else')
		const storedN = await page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'store').length)
		await pickSpace(ui, 'samsunglog')
		ok(await spaceOf(ui) === 'samsunglog' && await page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'store').length) === storedN + 1, 'a pick takes that space and saves it')
		await pickSpace(ui, 'oklch')
		// the tooltip stays while its element is hovered, goes when the pointer leaves the panel, and comes back on the next
		// hover of the same element; any press elsewhere dismisses it
		const tipOn = () => ui.locator('#tip').evaluate(t => t.classList.contains('on'))
		const frame1 = page.frames().find(f => f !== page.mainFrame())
		// it comes after half a second's rest, Figma's own wait, and goes a linger after the pointer leaves – no fade out
		{
			const st = () => ui.locator('#tip').evaluate(t => [t.classList.contains('on'), +getComputedStyle(t).opacity])
			const ibt = await page.locator('iframe').boundingBox()
			await page.mouse.move(ibt.x + 3, ibt.y + ibt.height / 2)   // the panel's padding first: no tip
			await page.waitForTimeout(100)
			// the wait, timed in the panel itself – from the pointer's arrival to the tip's coming – so a slow test can't blur it
			await frame1.evaluate(() => { window.__over = 0; window.__came = 0; addEventListener('pointerover', e => { if (e.target.closest?.('#prmb')) window.__over ||= performance.now() }, true)
				new MutationObserver(() => { if (document.getElementById('tip').classList.contains('on')) window.__came ||= performance.now() }).observe(document.getElementById('tip'), { attributes: true }) })
			await ui.locator('#prmb').hover()
			await ui.locator('#tip.on').waitFor({ state: 'attached', timeout: 3000 })
			const waited = await frame1.evaluate(() => window.__came - window.__over), at300 = [waited < 450]
			await page.waitForTimeout(300)
			const shown = await st()
			const ib = await page.locator('iframe').boundingBox()
			await page.mouse.move(ib.x + 3, ib.y + ib.height / 2)   // the panel's padding: nothing there
			await page.waitForTimeout(650)   // past the tip's linger (tip.js, 500 ms) – the pointer's time to cross into it
			const left = await st()
			ok(!at300[0] && shown[0] && shown[1] === 1 && !left[0] && left[1] === 0, `the tooltip waits half a second (${Math.round(waited)} ms), then goes with the pointer after its linger, no fade (${JSON.stringify([shown, left])})`)
		}
		await ui.locator('#prmb').hover()
		await ui.locator('#tip.on').waitFor({ state: 'attached', timeout: 3000 })
		await page.waitForTimeout(3000)
		ok(await tipOn() && await ui.locator('#tip').evaluate(t => getComputedStyle(t).opacity) > 0.5, 'a hovered tooltip stays (no fade on its own)')
		// leaving the panel: the browser sends the frame's document a pointerleave. A synthetic mouse move out of this
		// scrolled frame doesn't reliably produce one (it depends on timing and load), so the event itself is dispatched
		await frame1.evaluate(() => document.documentElement.dispatchEvent(new PointerEvent('pointerleave')))
		ok(!(await tipOn()), 'the pointer leaving the panel hides the tooltip')
		await ui.locator('#paints .paint').first().hover()
		await ui.locator('#tip.on').waitFor({ state: 'attached', timeout: 3000 }).catch(() => {})
		await ui.locator('#prmb').hover()   // onto the next element: the first one's tip goes, the next one's comes
		await frame1.waitForFunction(() => /^Settings$/.test(document.getElementById('tip').textContent), null, { timeout: 3000 }).catch(() => {})
		ok(await tipOn() && await ui.locator('#tip').innerText() === 'Settings', `moving to another element swaps the tip: the settings mark's (${await ui.locator('#tip').innerText()})`)
		await ui.locator('#prmb').hover()
		await ui.locator('#tip.on').waitFor({ state: 'attached', timeout: 3000 }).catch(() => {})
		ok(await tipOn(), 'the same element hovered again shows it again')
		const pad = async () => { const b = await ui.locator('#picker').boundingBox(); await page.mouse.click(b.x - 6, Math.max(5, b.y + 20)) }   // the panel's padding beside the picker: nothing there
		await pad()
		ok(!(await tipOn()), 'a press dismisses the tooltip')
		await ui.locator('#prmb').hover()
		await ui.locator('#tip.on').waitFor({ state: 'attached', timeout: 3000 }).catch(() => {})
		// the tooltip is Figma's: under its element, its tip pointing at the element's middle
		const tipAt = await frame1.evaluate(() => { const t = document.getElementById('tip'), b = document.getElementById('prmb').getBoundingClientRect(), r = t.getBoundingClientRect(), a = getComputedStyle(t, '::before')
			return { side: t.dataset.side, below: r.top >= b.bottom, mid: Math.abs(r.left + parseFloat(t.style.getPropertyValue('--tip-ax')) - (b.left + b.width / 2)), arrow: a.content !== 'none' && parseFloat(a.width) > 0 } })
		ok(tipAt.side === 'bottom' && tipAt.below && tipAt.mid < 1 && tipAt.arrow, `the tooltip sits under its element, its tip at the element's middle (${JSON.stringify(tipAt)})`)
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
		ok(await asFmt(ui, 'oklch') === oklch3([L, C, H]), `css oklch(): ${await asFmt(ui, 'oklch')}`)
		const hexv = await asFmt(ui, 'hex')
		ok(hexv === '#ff8000', `css hex: ${hexv}`)
		ok(await asFmt(ui, 'lab') === cssShort('lab', space.rgb.lab(255, 127.5, 0)) && await asFmt(ui, 'oklch') === oklch3([L, C, H]), 'the copy list: lab() at two decimals, oklch() at three')
		ok(await ui.locator('#notes').innerText() === 'Dots are other selected colors.', `an in-gamut sRGB paint: only the dots' legend (${await ui.locator('#notes').innerText()})`)
		// the breakdown – the profile, the notes – is the info card's, and no lines of text
		ok(await ui.locator('#notes').innerText() === 'Dots are other selected colors.' && await ui.locator('#err').innerText() === '', `the notes, said to screen readers: ${await ui.locator('#notes').innerText()}`)
		ok(await ui.locator('#gamut').evaluate(e => e.getBoundingClientRect().width <= 1) && await ui.locator('#notes').evaluate(e => e.getBoundingClientRect().width <= 1), 'the gamut and the notes are said to screen readers, not shown')
		// the palette: a swatch each, a stroke's a ring, the current one pressed; name and place in its tooltip
		ok(await ui.locator('.paint.stroke').count() === 0 && await ui.locator('.paint', { hasText: 'stroke 1' }).count() === 1, 'a stroke\'s color is a swatch like any other, as in Figma\'s own')
		// its tooltip lists the layers it is on as Figma's layer menus do – the layer's kind (its icon), name, place – live
		const swTip = await ui.locator('.paint').first().evaluate(b => [b.dataset.tipRows, b.dataset.tip ?? null, b.hasAttribute('data-tip-live'), b.getAttribute('aria-label')])
		ok(swTip[0] === JSON.stringify([['RECTANGLE', 'Card', 'fill 1']]) && swTip[1] === null && swTip[2] && swTip[3] === 'Card, fill 1', `a swatch's tooltip (its layer: kind, name, place; no hex; live) and label: ${JSON.stringify(swTip)}`)

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
		ok(/^Outside sRGB, mapped in\.$/.test(await ui.locator('#gamut').innerText()), 'and screen readers hear it mapped in')
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
		ok((await held(ui)).length === 3 && /^L[\d.]+ a-?[\d.]+ b-?[\d.]+$/.test(await ui.locator('#fmt option[value="space"]').textContent()), `lab: three channels, its own row its letters and numbers (${await ui.locator('#fmt option[value="space"]').textContent()})`)
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
		ok(/ \/ 0\.5\)$/.test(await asFmt(ui, 'oklch')) && (await asFmt(ui, 'hex')).endsWith('80'), 'opacity appears in the CSS')

		// the value: the space's channels in cells, and nothing else – no text field, no format to view it in; beside them, a
		// copy button, Figma's icon button: a row picked from its list copies that value, Figma's toast says so, and the list
		// keeps no row picked (the same row, again, copies again)
		const cellf = await ui.locator('.vals').evaluate(v => { const a = v.querySelector('#valf').getBoundingClientRect(), b = v.querySelector('.fmt').getBoundingClientRect(); return { gap: Math.round(b.left - a.right), w: b.width, h: b.height, field: !!document.getElementById('val'), icb: v.querySelector('.fmt').classList.contains('icb'), chev: !!v.querySelector('.fmt .chev') } })
		ok(cellf.gap === 8 && cellf.w >= 32 && cellf.w <= 36 && cellf.h === 24 && !cellf.field && cellf.icb && cellf.chev, `the cells, then the copy button 8 px from them – its mark and a chevron, Figma's button that opens a list; no text field (${JSON.stringify(cellf)})`)
		for (const f of ['hex', 'hex', 'space']) {
			const want = await asFmt(ui, f), n0 = await page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'notify').length)
			await ui.locator('#fmt').selectOption(f); await page.waitForTimeout(100)
			const got = [await page.evaluate(() => navigator.clipboard.readText()), await page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'notify').length) - n0, await ui.locator('#fmt').evaluate(e => e.selectedIndex)]
			ok(got[0] === want && got[1] === 1 && got[2] === -1, `the copy list's ${f} row picked: ${want} copied, Figma told, no row kept picked (${JSON.stringify(got)})`)
		}

		// a variable-bound paint is edited where its color lives: through the alias, the token's value in the node's mode
		await ui.locator('.paint', { hasText: 'Bound' }).click()
		ok(await ui.locator('.paint', { hasText: 'Bound' }).locator('.src').innerText() === 'Brand/500', 'a bound paint names the token its alias resolves to')
		ok(/Editing the variable Brand\/500/.test(await notes(ui)), 'bound paint note names the token')
		ok(!(await ui.locator('#cells input').first().evaluate(e => e.readOnly)), 'a local token is editable')
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
			ok(await ui.locator('#cells input').first().evaluate(e => e.readOnly) && await ui.locator('#channels .nrg').first().getAttribute('aria-disabled') === 'true', `remote ${what}: locked`)
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
		await ui.locator('#err', { hasText: 'Write failed' }).waitFor()
		n = await selections(page)
		await page.evaluate(() => window.__select(['1:4']))
		await settle(page, n)
		ok(!/Write failed/.test(await notes(ui)), 'main-thread error dropped when the selection moves to another paint')

		// empty selection
		n = await selections(page)
		await page.evaluate(() => window.__select([]))
		await settle(page, n)
		ok(await ui.locator('#empty').isVisible() && await ui.locator('#channels').isHidden() && await ui.locator('#prmb').isVisible(), 'empty selection: no picker; the settings still at hand')
		// the hint in the space's place, the settings mark on its first line; the scope over the panel's bottom padding
		const emp = await ui.locator('#empty').evaluate(e => { const b = document.getElementById('prmb').getBoundingClientRect(), r = document.createRange(); r.selectNodeContents(e); const line = r.getClientRects()[0], sc = document.querySelector('.pal .sel').getBoundingClientRect()
			return { row: e.parentElement.className, mid: Math.round((b.top + b.bottom) / 2 - (line.top + line.bottom) / 2), right: b.left >= e.getBoundingClientRect().right, bottom: Math.round(innerHeight - sc.bottom) } })
		ok(emp.row === 'top' && Math.abs(emp.mid) <= 1 && emp.right && emp.bottom === 16, `empty: the hint beside the settings mark, on its first line; 16 px under the scope (${JSON.stringify(emp)})`)
		if (process.env.FIGMA_SHOTS) await page.locator('iframe').screenshot({ path: `${process.env.FIGMA_SHOTS}/figma-empty.png` })

		// structure (labels, names, roles): axe without color-contrast, since the theme colors here are stand-ins
		await page.evaluate(() => window.__select(['1:1']))
		await ui.locator('#channels').waitFor()
		const axe = await new AxeBuilder({ page }).include('iframe').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).disableRules(['color-contrast']).analyze()
		ok(!axe.violations.length, `axe: ${axe.violations.map(v => `${v.id}: ${v.nodes.map(x => x.target.join(' ')).join(', ')}`).join('; ')}`)

		// the settings: the top row's mark opens Figma's settings panel (a popover) – its name and a close, the gamut and the
		// Quantize rows, then the notes and the about lines, whose links open in the browser through the main thread – only
		// its three pages, whatever the UI sends; Escape closes it
		await ui.locator('#prmb').click()
		const prm = await ui.locator('#prm').evaluate(e => ({ open: e.matches(':popover-open'), rows: [...e.querySelectorAll('.plab')].map(l => l.textContent), w: e.getBoundingClientRect().width, r: getComputedStyle(e).borderTopLeftRadius }))
		ok(prm.open && prm.rows.join() === 'Gamut,Quantize,Hints' && prm.w <= 240 && prm.r === '13px', `the settings mark opens the settings: Gamut, Quantize and the hints, as wide as they need, 13 px corners (${JSON.stringify(prm)})`)
		ok(await ui.locator('#gamseg button').evaluateAll(bs => bs.every(b => b.scrollWidth <= b.clientWidth + 1)), 'every gamut fits its segment (Rec.2020 too)')
		await ui.locator('#prm [data-open="support"]').click()
		await ui.locator('#prm [data-open="github"]').click()
		await page.waitForFunction(() => window.__log.opened.length >= 2, null, { timeout: 3000 }).catch(() => {})
		for (const to of ['evil', '__proto__', 'toString']) await page.evaluate(to => figma.ui.onmessage({ type: 'open', to }), to)
		await page.evaluate(() => figma.ui.onmessage({ type: 'open', url: 'https://example.com' }))
		await page.waitForTimeout(50)
		ok(JSON.stringify(await page.evaluate(() => window.__log.opened)) === '["https://github.com/sponsors/colorjs","https://github.com/colorjs/color-space"]', `the card opens its own pages only: ${JSON.stringify(await page.evaluate(() => window.__log.opened))}`)
		await page.keyboard.press('Escape')
		ok(!(await ui.locator('#prm').evaluate(e => e.matches(':popover-open'))), 'Escape closes the settings')
		await ui.locator('#prmb').click(); await ui.locator('#prm .phead .icb').click()
		ok(!(await ui.locator('#prm').evaluate(e => e.matches(':popover-open'))), 'and so does its close')
		// the panel losing the focus (a press on Figma's own chrome): the settings, the space menu and an open list close
		{
			const frb = page.frames().find(f => f !== page.mainFrame()), blur = () => frb.evaluate(() => dispatchEvent(new FocusEvent('blur')))
			await ui.locator('#prmb').click(); await blur()
			const prmOpen = await ui.locator('#prm').evaluate(e => e.matches(':popover-open'))
			await ui.locator('#spq').click(); await blur()
			const menuOpen = await ui.locator('#spmenu').isVisible()
			await ui.locator('#scope').click(); await page.waitForTimeout(150); await blur(); await page.waitForTimeout(100)
			const listOpen = await ui.locator('#scope').evaluate(e => e.matches(':open'))
			ok(!prmOpen && !menuOpen && !listOpen, `the panel losing the focus closes the settings, the space menu, an open list (${[prmOpen, menuOpen, listOpen]})`)
		}
		// a slider names its channel in a tooltip
		ok(JSON.stringify(await ui.locator('.bar2').evaluateAll(bs => bs.map(b => b.dataset.tip))) === JSON.stringify([...(await ui.locator('.bar2:not(.alpha)').evaluateAll(bs => bs.map(b => b.dataset.tip))), 'Opacity']) && await ui.locator('.bar2:not(.alpha)').evaluateAll(bs => bs.every(b => /^[A-Z]/.test(b.dataset.tip))), 'each slider names its channel in a tooltip, the last its opacity')

		// the palette folds: the stroke's swatch dragged onto the fill's – the two merge into the one carried: the fill takes
		// the stroke's color and opacity in one write and one undo step, and the two are one swatch; an edit of that swatch
		// then writes both, in one message
		{
			await ui.locator('#paints .paint').first().waitFor()
			const fr0 = page.frames().find(f => f !== page.mainFrame())
			const st0 = (await page.evaluate(() => window.__paints('1:1', 'strokes')))[0], before = await ui.locator('#paints .paint').count()
			const u0 = await page.evaluate(() => window.__log.undo), n0 = await selections(page)
			const [a, b] = [await ui.locator('#paints .paint', { hasText: 'stroke 1' }).boundingBox(), await ui.locator('#paints .paint', { hasText: 'fill 1' }).first().boundingBox()]
			await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
			await page.mouse.down()
			await page.mouse.move(a.x + a.width / 2 + 3, a.y + a.height / 2, { steps: 2 })
			await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 6 })
			ok(await ui.locator('#paints .paint.drop').count() === 1 && await ui.locator('#paints .paint.lift').count() === 1, 'a dragged swatch is lifted, the one under it marked')
			ok(await ui.locator('#ghost').isVisible() && await ui.locator('#ghost.over .lbl').innerText() === 'Merge', 'its ghost follows the pointer, and says Merge over another swatch')
			// the swatch itself under the pointer, held where it was taken (the press at its middle: the ghost's swatch centred on
			// the pointer); its place in the palette left empty, never a pale copy
			const gh = await fr0.evaluate(() => { const g = document.querySelector('#ghost .sw').getBoundingClientRect(), l = document.querySelector('#paints .paint.lift'); return [g.left + g.width / 2, g.top + g.height / 2, g.width, l ? getComputedStyle(l).visibility : 'no lifted swatch', document.getElementById('scope').matches(':open')] })
			const ib0 = await page.locator('iframe').boundingBox()
			ok(Math.abs(gh[0] - (b.x - ib0.x + b.width / 2)) <= 1.5 && Math.abs(gh[1] - (b.y - ib0.y + b.height / 2)) <= 1.5 && gh[2] === a.width && gh[3] === 'hidden', `the dragged swatch under the pointer where it was taken, its own size; its place empty (${JSON.stringify(gh)}; the pointer at ${[b.x - ib0.x + b.width / 2, b.y - ib0.y + b.height / 2]})`)
			await page.mouse.up()
			ok(await ui.locator('#ghost').isHidden(), 'the ghost goes on release')
			await settle(page, n0)
			await page.waitForTimeout(60)
			const fl = (await page.evaluate(() => window.__paints('1:1', 'fills')))[0], st = (await page.evaluate(() => window.__paints('1:1', 'strokes')))[0]
			ok(near3(rgbOf(fl), rgbOf(st0)) && fl.opacity === st0.opacity && near3(rgbOf(st), rgbOf(st0)) && await page.evaluate(() => window.__log.undo) === u0 + 1, `folded: the fill takes the dragged stroke's color and opacity, the stroke keeps its own, one undo step (${rgbOf(fl)} vs ${rgbOf(st0)})`)
			ok(await ui.locator('#paints .paint').count() === before - 1 && (await ui.locator('#paints .paint[aria-pressed="true"]').getAttribute('data-keys')).split(' ').length === 2, 'and the two are one swatch, the current one')
			const set = await edit(page, ui, 0, 0.4)
			ok(set.targets?.length === 2 && set.targets.map(t => t.kind).sort().join() === 'fills,strokes', `an edit of the swatch writes both: ${JSON.stringify(set.targets)}`)
			ok(near3(rgbOf((await page.evaluate(() => window.__paints('1:1', 'fills')))[0]), rgbOf((await page.evaluate(() => window.__paints('1:1', 'strokes')))[0])), 'and they stay one color')
			// a translucent swatch: its color with its opacity (half of it over the checker), and opaque (the other half)
			await setCh(ui, 'a', 50)
			await page.waitForTimeout(150)
			const sw = await ui.locator('#paints .paint[aria-pressed="true"] .sw').evaluate(e => [e.style.getPropertyValue('--sw'), e.style.getPropertyValue('--swo')])
			ok(/ \/ 0\.5\)$/.test(sw[0]) && !sw[1].includes('/'), `a translucent swatch: half with its opacity, half opaque (${sw})`)
			ok(await ui.locator('.top').evaluate(f => [...f.children].filter(e => e.offsetParent).map(e => e.id).join()) === 'spbtn,prmb' && await ui.locator('#css, #named, #badge').count() === 0, 'the top line: the space, the settings mark; no value line, no gamut mark')
			// the sliders at the panel's full width; the eyedropper beside the values, which hover and focus as one field
			const lay = await ui.locator('#channels').evaluate(ch => { const w = ch.getBoundingClientRect().width, v = ch.querySelector('.vals')
				const d = document.getElementById('drop').getBoundingClientRect(), bs = [...ch.querySelectorAll('.bar2')].map(b => b.getBoundingClientRect())
				return { bars: bs.every(b => b.left >= d.right && Math.abs(b.right - ch.getBoundingClientRect().right) < 0.5), mid: Math.abs((d.top + d.bottom) / 2 - (bs[0].top + bs.at(-1).bottom) / 2) < 1, vals: [...v.children].map(e => e.id).join(), glyph: document.querySelector('#drop .ic').getBoundingClientRect().width } })
			ok(lay.bars && lay.mid && lay.vals === 'valf,' && lay.glyph === 16, `the eyedropper (16 px) before the sliders, centred on them, as Figma's; the value and its copy button under them (${JSON.stringify(lay)})`)
			// Figma's details: the plane's letters in the cells' face and size; the selects' chevrons one inset from their right
			// edge, in line with the copy button's; 5 px corners; Figma's section under the picker – its divider the panel's
			// full width, 16 px under the values, 12 px over its select, the swatches 8 px under that
			const fig = await frame1.evaluate(() => {
				const cs = e => getComputedStyle(e), r = e => e.getBoundingClientRect(), ax = document.querySelector('#axes .labx'), cl = document.querySelector('#cells input')
				const chevR = sel => { const c = document.querySelector(sel), b = r(c); return r(c.closest('.sel, .fld')).right - (b.left + b.right) / 2 }   // its centre's distance from its control's right edge
				const pal = document.getElementById('pal'), sc = r(pal.querySelector('.sel')), sw = r(document.querySelector('#paints .paint')), vals = r(document.querySelector('.vals'))
				return { font: [cs(ax).fontSize, cs(ax).fontWeight, cs(ax).fontFamily].join() === [cs(cl).fontSize, cs(cl).fontWeight, cs(cl).fontFamily].join(),
					chev: [chevR('#spbtn .chev'), chevR('.scope select > button .chev')].map(Math.round), radius: cs(document.getElementById('spbtn')).borderTopLeftRadius,
					divider: [r(pal).left, r(pal).right, innerWidth], gaps: [r(pal).top - vals.bottom, sc.top - r(pal).top, sw.top - sc.bottom].map(v => Math.round(v)) }
			})
			ok(fig.font, 'the plane\'s letters in the value field\'s face, size and weight')
			ok(fig.chev[0] === fig.chev[1] && fig.radius === '5px', `the selects' chevrons one inset from their edge (${fig.chev}), 5 px corners (${fig.radius})`)
			ok(fig.divider[0] === 0 && fig.divider[1] === fig.divider[2] && JSON.stringify(fig.gaps) === '[16,12,8]', `the palette's section: a full-width divider, 16 / 12 / 8 px (${JSON.stringify(fig)})`)
			// the plane's letters name their channel in a tooltip – that alone; their label says what a click does; the wheel's
			// switch, a word: what a click shows
			await ui.locator('#axes .labx').hover()
			await frame1.waitForFunction(() => document.getElementById('tip').classList.contains('on'), null, { timeout: 3000 }).catch(() => {})
			const axTip = [await ui.locator('#tip').innerText(), await ui.locator('#axes .labx').getAttribute('aria-label'), await ui.locator('#axes .pmode').getAttribute('data-tip'), await ui.locator('#plane').evaluate(e => e.classList.contains('polar'))]
			ok(axTip[1].startsWith(`${axTip[0]} across. Click for`) && !/Click/.test(axTip[0]) && axTip[2] === (axTip[3] ? 'Square' : 'Wheel'), `an axis letter's tooltip: its channel's name alone; its label what a click does; the wheel's switch what a click shows (${JSON.stringify(axTip)})`)
			// the icon buttons, Figma's: an ink glyph, a quiet fill under the pointer
			const bg0 = await ui.locator('#prmb').evaluate(b => getComputedStyle(b).backgroundColor)
			await ui.locator('#prmb').hover()
			const bg1 = await ui.locator('#prmb').evaluate(b => getComputedStyle(b).backgroundColor)
			ok(bg0 === 'rgba(0, 0, 0, 0)' && bg1 !== bg0 && /Settings/.test(await ui.locator('#prmb').getAttribute('data-tip')), `the settings mark: a fill under the pointer (${bg1}), its tooltip`)
			// the value, Figma's split field: 24 px, filled; the cells answer as one – a grey hairline under the pointer (Figma's
			// border) and the selection color while a cell has the focus; the copy button an icon button, never focused (nor a
			// tab stop). A select, as Figma's, keeps its look under the pointer
			const tok = v => frame1.evaluate(v => { const e = document.createElement('div'); e.style.color = v; document.body.append(e); const c = getComputedStyle(e).color; e.remove(); return c }, v)
			const [selC, hairC, none] = [await tok('var(--sel)'), await tok('var(--hair)'), 'rgba(0, 0, 0, 0)']
			const look = () => ui.locator('#cells').evaluate(c => getComputedStyle(c).outlineColor)
			const cell0 = ui.locator('#cells input').first()
			await frame1.evaluate(() => document.activeElement?.blur()); await ui.locator('#prmb').hover()
			const rg = [await look()]
			await cell0.hover(); rg.push(await look())
			await cell0.focus(); await ui.locator('#prmb').hover(); rg.push(await look())
			await cell0.blur()
			const box = await ui.locator('#valf').evaluate(c => getComputedStyle(c).height)
			const selLook = async () => ui.locator('#spbtn').evaluate(e => [getComputedStyle(e).borderTopColor, getComputedStyle(e).backgroundColor].join())
			const sl0 = await selLook(); await ui.locator('#spbtn').hover(); const sl1 = await selLook()
			ok(JSON.stringify(rg) === JSON.stringify([none, hairC, selC]) && box === '24px', `the value, Figma's split field: 24 px; the cells a grey hairline under the pointer, ringed in the selection color with the focus (${JSON.stringify(rg)})`)
			ok(sl0 === sl1, `a select keeps its look under the pointer, as Figma's (${sl0} → ${sl1})`)
			ok(await ui.locator('#fmt').getAttribute('tabindex') === '-1', 'the copy button is no tab stop')
			// its tooltip, after the wait: the select laid over the button holds it (tip.js gives no ancestor's tip over a select –
			// on the button it never came)
			await ui.locator('.fmt').hover(); await page.waitForTimeout(700)
			const cpTip = await frame1.evaluate(() => { const t = document.getElementById('tip'); return t.classList.contains('on') ? t.textContent : '' })
			ok(cpTip === 'Copy', `the copy button's tooltip: "Copy" (${JSON.stringify(cpTip)})`)
			await ui.locator('#prmb').hover()
			// the plane's letters and switch: the site's switch – half strength, whole under the pointer, no fill
			const op0 = await ui.locator('#axes .labx').evaluate(b => getComputedStyle(b).opacity)
			await ui.locator('#axes .labx').hover()
			const op1 = await ui.locator('#axes .labx').evaluate(b => [getComputedStyle(b).opacity, getComputedStyle(b).backgroundColor])
			ok(op0 === '0.5' && op1[0] === '1' && op1[1] === 'rgba(0, 0, 0, 0)', `an axis letter at half strength, whole when hovered, no fill (${op0} → ${op1})`)
			// the copy button's list: every notation, each the value it gives – over the value's row, as wide, above it (the window
			// never stretched under the palette), every row in sight: no scrollbar, a value past the width cut short
			await ui.locator('.fmt').click()
			await page.waitForTimeout(150)
			const fmtList = await frame1.evaluate(() => {
				const f = document.querySelector('.vals').getBoundingClientRect(), os = [...document.querySelectorAll('#fmt option')].map(o => o.getBoundingClientRect())
				return { open: document.getElementById('fmt').matches(':open'), above: Math.round(f.top - Math.max(...os.map(o => o.bottom))), sides: [Math.round(Math.min(...os.map(o => o.left)) - f.left), Math.round(f.right - Math.max(...os.map(o => o.right)))], inside: os.every(o => o.top >= 0 && o.bottom <= f.top && o.height > 0), cut: getComputedStyle(document.querySelector('#fmt option')).textOverflow }
			})
			ok(fmtList.open && fmtList.above >= 4 && fmtList.sides[0] === fmtList.sides[1] && fmtList.sides[0] <= 12 && fmtList.inside && fmtList.cut === 'ellipsis', `a click on the copy button opens its notations above the value's row, as wide, every row in sight (${JSON.stringify(fmtList)})`)
			const rowsT = await ui.locator('#fmt option').allTextContents(), sp0 = await spaceOf(ui), syms = classify(sp0).ch.map(c => c.sym)
			ok(new RegExp(`^${syms.map(y => `${y} ?-?[\\d.]+`).join(' ')}`).test(rowsT[0]) && rowsT.some(t => /^oklch\(/.test(t)) && /^#[0-9a-f]{6}/.test(rowsT.at(-1)), `each notation offered as the value it gives, the channels' first (${JSON.stringify(rowsT)})`)
			if (process.env.FIGMA_SHOTS) await page.locator('iframe').screenshot({ path: `${process.env.FIGMA_SHOTS}/figma-formats.png` })
			// every row's text starts at one column
			const lefts = await ui.locator('#fmt option').evaluateAll(os => os.map(o => { const r = document.createRange(); r.selectNodeContents(o); return Math.round([...r.getClientRects()].at(-1).left) }))
			ok(new Set(lefts).size === 1, `the notations line up (${lefts})`)
			// a pick by the pointer: copied, no focus left on the button
			await ui.locator('#fmt option[value="hex"]').click(); await page.waitForTimeout(100)
			ok(/^#[0-9a-f]{6}/.test(await page.evaluate(() => navigator.clipboard.readText())) && await frame1.evaluate(() => document.activeElement?.id !== 'fmt'), 'a row clicked: copied, no focus left on the button')
		}

		// the palette's scope, Figma's own pair: In selection (the default), or On this page – every layer's colors, the
		// selection's first one current; saved, and back
		ok(await ui.locator('#scope').inputValue() === 'selection', 'the palette starts on the selection\'s colors')
		// Figma's menus open over their control: the chosen row centred on it, its text over the control's text
		{
			const fr1 = page.frames().find(f => f !== page.mainFrame())
			const over = async (sel, ctrl) => { await ui.locator(sel).click(); await page.waitForTimeout(250)
				const m = await fr1.evaluate(([sel, ctrl]) => { const s = document.querySelector(sel), o = s.selectedOptions[0].getBoundingClientRect(), c = document.querySelector(ctrl).getBoundingClientRect()
					const rl = n => { const r = document.createRange(); r.selectNodeContents(n); return r.getBoundingClientRect().left }
					const t = rl(s.querySelector('selectedcontent'))
					const rows = [...s.options].map(x => x.getBoundingClientRect())
					return { open: s.matches(':open'), dy: Math.round((o.top + o.bottom) / 2 - (c.top + c.bottom) / 2), dx: Math.round(rl(s.selectedOptions[0]) - t),
						edge: [rows[0].left - 9, rows[0].top - 7, innerHeight - rows.at(-1).bottom - 7].map(Math.round) } }, [sel, ctrl])
				await page.keyboard.press('Escape'); return m }
			const sc = await over('#scope', '.pal .sel')
			// from the keyboard too: Space on the focused select opens it over its control
			await ui.locator('#scope').focus(); await page.keyboard.press(' '); await page.waitForTimeout(250)
			const kb = await fr1.evaluate(() => { const s = document.getElementById('scope'), o = s.selectedOptions[0].getBoundingClientRect(), c = s.closest('.sel').getBoundingClientRect(); return { open: s.matches(':open'), dy: Math.round((o.top + o.bottom) / 2 - (c.top + c.bottom) / 2), shown: getComputedStyle(s).getPropertyValue('--pk-o').trim() } })
			await page.keyboard.press('Escape')
			ok(kb.open && Math.abs(kb.dy) <= 1 && kb.shown === '1', `opened from the keyboard, the menu over its select too (${JSON.stringify(kb)})`)
			// (where the window is too small for that, the list is held 4 px inside its edge instead)
			const held4 = (m, i) => Math.abs(m.edge[i] - 4) <= 1
			ok(sc.open && Math.abs(sc.dy) <= 1 && (Math.abs(sc.dx) <= 1 || held4(sc, 0)), `the scope's menu over its select, the chosen row on it (${JSON.stringify(sc)})`)
		}
		const nSel = await ui.locator('#paints .paint').count(), n1 = await selections(page)
		await ui.locator('#scope').selectOption('page')
		await settle(page, n1)
		await page.waitForTimeout(60)
		const pg = await page.evaluate(() => window.__log.toUI.filter(m => m.type === 'selection').at(-1))
		ok(await page.evaluate(() => window.__stored('scope')) === 'page' && pg.paints.length > nSel && new Set(pg.paints.map(p => p.id)).size > 1, `On this page: the page's colors (${pg.paints.length} paints from ${new Set(pg.paints.map(p => p.id)).size} layers)`)
		ok(pg.paints.filter(p => p.current).length === 1 && pg.paints.find(p => p.current).id === (await page.evaluate(() => figma.currentPage.selection[0]?.id)), 'the selection\'s first color is the current one')
		const n2 = await selections(page)
		await ui.locator('#scope').selectOption('selection')
		await settle(page, n2)
		ok(await ui.locator('#paints .paint').count() === nSel, 'In selection again: the selection\'s colors')

		if (process.env.FIGMA_SHOTS) await page.locator('iframe').screenshot({ path: `${process.env.FIGMA_SHOTS}/figma-srgb.png` })
		ok(!errors.length, `sRGB page errors: ${errors.join(' | ')}`)
		await page.context().close()
	}

	/* ---------- a page of many colors: the palette runs to the window's edge, cropped there, as Figma's own ---------- */
	{
		const nodes = Array.from({ length: 48 }, (_, k) => ({ id: `9:${k}`, name: `Swatch ${k}`, type: 'RECTANGLE', fills: [solid((k * 37 % 100) / 100, (k * 53 % 100) / 100, (k * 71 % 100) / 100)], strokes: [] }))
		// at Figma's own width (240 px, its picker's), with the system's scrollbars taking room (see the launch)
		const { page, ui, errors } = await open({ profile: 'SRGB', editorType: 'figma', nodes, selection: ['9:47'], stored: { scope: 'page', width: 240 } })
		await ui.locator('#paints .paint').nth(40).waitFor()
		await page.waitForTimeout(400)
		const fr = page.frames().find(f => f !== page.mainFrame())
		const m = await fr.evaluate(() => {
			const l = document.getElementById('paints'), r = l.getBoundingClientRect(), on = l.querySelector('[aria-pressed="true"]').getBoundingClientRect(), shown = on.top >= r.top && on.bottom <= r.bottom
			const rowsAt = () => [...new Set([...l.querySelectorAll('.paint')].map(p => Math.round(p.getBoundingClientRect().top - r.top)))].sort((a, b) => a - b)
			const top = rowsAt().find(y => y > -16)   // the first row in sight, as the reveal left it
			l.scrollTop = 0   // from the top: the rows run past the edge
			const sw = [...l.querySelectorAll('.paint')].map(p => p.getBoundingClientRect()), slider = document.querySelector('.bar2').getBoundingClientRect(), field = document.getElementById('valf').getBoundingClientRect(), rows = rowsAt()
			return { scrollY, scrollable: document.documentElement.scrollHeight - innerHeight, edges: [Math.round(sw[0].left - field.left), Math.round(Math.max(...sw.map(b => b.right)) - slider.right)], listBottom: Math.round(r.bottom), inner: innerHeight, over: l.scrollHeight > l.clientHeight,
				size: [sw[0].width, sw[0].height], pitch: [Math.round(sw[1].left - sw[0].left), rows[1] - rows[0]], cols: new Set(sw.map(b => Math.round(b.left))).size, half: Math.round(r.bottom - rows[3] - r.top), top, gutter: l.offsetWidth - l.clientWidth, shown }
		})
		// a drag on the plane redraws neither the palette nor the dots (each frame's re-read once rebuilt them all): their
		// elements stay the same ones
		{
			await fr.evaluate(() => { for (const e of document.querySelectorAll('#paints .paint, #marks .dm')) e._kept = 1 })
			const pb = await ui.locator('#plane').boundingBox()
			await page.mouse.move(pb.x + pb.width * 0.2, pb.y + pb.height * 0.6); await page.mouse.down()
			await page.mouse.move(pb.x + pb.width * 0.3, pb.y + pb.height * 0.5, { steps: 8 })
			const kept = await fr.evaluate(() => [...document.querySelectorAll('#paints .paint, #marks .dm')].every(e => e._kept))
			await page.mouse.up(); await page.waitForTimeout(200)
			ok(kept, 'a drag on the plane keeps the palette\'s swatches and the plane\'s dots as they are')
		}
		ok(m.over && Math.abs(m.listBottom - m.inner) <= 1 && m.half === 8, `48 colors: the palette runs to the window's bottom edge and is cropped there, half its fourth row shown, as Figma's (${JSON.stringify(m)})`)
		// Figma's On this page (measured at 2× on its picker, 2026-10, 240 px): 16 px swatches on a 24 px pitch, 9 columns
		ok(JSON.stringify([m.size, m.pitch, m.cols]) === '[[16,16],[24,24],9]', `Figma's swatches: 16 px, 8 px apart, 9 columns at its width (${JSON.stringify([m.size, m.pitch, m.cols])})`)
		ok(m.gutter > 0 && m.edges[0] === 0 && m.edges[1] === 0, `the swatches' columns spread from the value field's left edge to the sliders' right edge, the scrollbar (${m.gutter} px) in the panel's padding (${m.edges})`)
		ok(m.scrollable === 0, `and the panel can't be scrolled: nothing past the window (a swatch's screen-reader text, positioned against the body, once reached ${m.scrollable} px below the palette's crop)`)
		ok(m.scrollY === 0 && m.shown && m.top === 2, `the current swatch (the last) shown by scrolling the palette alone, never the panel, its rows whole at the top (${JSON.stringify(m)})`)
		// the scrollbar: a thumb at the window's edge under the pointer, nothing at rest (the gutter's pixels against the panel's,
		// above the size grip)
		const gutterInk = async () => { const ib = await page.locator('iframe').boundingBox(), g = await fr.evaluate(() => { const r = document.getElementById('paints').getBoundingClientRect(); return [r.right - 8, r.top, 8, r.height - 24] })
			const b64 = (await page.screenshot({ clip: { x: ib.x + g[0], y: ib.y + g[1], width: g[2], height: g[3] } })).toString('base64')
			return fr.evaluate(async b64 => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode()
				const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0)
				const d = x.getImageData(0, 0, c.width, c.height).data, L = i => d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11; let far = 0; for (let i = 0; i < d.length; i += 4) far = Math.max(far, Math.abs(L(i) - L(0))); return Math.round(far) }, b64) }
		await page.mouse.move(0, 0)
		const rest = await gutterInk()
		await ui.locator('#paints').hover()
		const hov = await gutterInk()
		ok(rest < 2 && hov > 20, `the palette's scrollbar unseen at rest, a thumb under the pointer (the gutter's spread from its panel ${rest} → ${hov})`)
		if (process.env.FIGMA_SHOTS) await page.locator('iframe').screenshot({ path: `${process.env.FIGMA_SHOTS}/figma-palette.png` })
		ok(!errors.length, `many-colors page errors: ${errors.join(' | ')}`)
		await page.context().close()
	}

	/* ---------- a swatch's tooltip: its layers, as Figma's layer menus list them; ⌥'s measurement ---------- */
	{
		const long = 'Also known as Text-to-Speech. Produces high quality voice fragments from any text sequence with one of the predefined studio voices.'
		const shared = [0.8, 0.3, 0.2], fill = () => [solid(...shared)]
		const nodes = [{ id: '10:1', name: 'Card', type: 'RECTANGLE', fills: [solid(0.2, 0.4, 0.8)], strokes: [] },
			{ id: '10:2', name: long, type: 'TEXT', fills: fill(), strokes: [] },
			{ id: '10:3', name: 'Arrow', type: 'VECTOR', fills: fill(), strokes: [], vectorPaths: [{ windingRule: 'NONZERO', data: 'M0 0L50 100L100 0Z' }] },
			{ id: '10:4', name: 'Dot', type: 'ELLIPSE', fills: fill(), strokes: [] },
			{ id: '10:5', name: 'Far frame', type: 'FRAME', fills: fill(), strokes: [], box: { x: 5000, y: 5000, width: 200, height: 100 } },
			{ id: '10:6', name: 'Badge', type: 'RECTANGLE', fills: fill(), strokes: [] },
			{ id: '10:7', name: 'Scribble', type: 'VECTOR', fills: [solid(0.1, 0.7, 0.4)], strokes: [], vectorPaths: [{ windingRule: 'NONZERO', data: 'M0 0' + 'L1 1'.repeat(400) }] }]
		const { page, ui, errors } = await open({ profile: 'SRGB', editorType: 'figma', nodes, selection: nodes.map(n => n.id) })
		const fr = page.frames().find(f => f !== page.mainFrame())
		const tipState = () => fr.evaluate(() => { const t = document.getElementById('tip'); return { on: t.classList.contains('on'), opacity: +getComputedStyle(t).opacity } })
		const sw = ui.locator('#paints .paint').nth(1)
		await page.mouse.move(0, 0)
		await fr.evaluate(() => { window.__over = 0; window.__came = 0; addEventListener('pointerover', e => { if (e.target.closest?.('.paint')) window.__over ||= performance.now() }, true)
			new MutationObserver(() => { if (document.getElementById('tip').classList.contains('on')) window.__came ||= performance.now() }).observe(document.getElementById('tip'), { attributes: true }) })
		await sw.hover()
		await fr.waitForFunction(() => document.getElementById('tip').classList.contains('on'), null, { timeout: 3000 }).catch(() => {})
		const early = { on: await fr.evaluate(() => window.__came - window.__over < 450), waited: await fr.evaluate(() => Math.round(window.__came - window.__over)) }
		const tp = await fr.evaluate(() => {
			const tip = document.getElementById('tip'), r = tip.getBoundingClientRect(), rows = [...tip.querySelectorAll('.row')], nm = tip.querySelector('.row .nm')
			return { live: tip.classList.contains('live'), rows: rows.map(x => [x.tagName, x.querySelector('.nm').textContent, x.querySelector('.as')?.textContent || '', x.querySelector('svg')?.getAttribute('viewBox') || '', Math.round(x.getBoundingClientRect().height)]), cut: nm.scrollWidth > nm.clientWidth, last: tip.lastElementChild.className,
				whole: [tip.style.left, tip.style.top].every(v => /^-?\d+px$/.test(v)), inside: r.left >= 0 && r.right <= innerWidth, arrow: [tip.dataset.side, getComputedStyle(tip, '::before')[tip.dataset.side === 'top' ? 'top' : 'bottom'], `${r.height - 1}px`],
				corners: [getComputedStyle(tip).paddingTop, getComputedStyle(tip).paddingLeft, getComputedStyle(tip).borderTopLeftRadius, getComputedStyle(rows[0]).borderTopLeftRadius].map(parseFloat) }
		})
		ok(!early.on, `the tooltip waits half a second, Figma's own wait: not there at 300 ms (${JSON.stringify(early)})`)
		// the plane's dots carry no tooltip: it covered the plane
		ok(await ui.locator('#marks .dm').evaluateAll(ds => ds.length > 0 && ds.every(d => !d.dataset.tip && !d.dataset.tipRows)), 'the plane\'s dots carry no tooltip')
		ok(tp.live && JSON.stringify(tp.rows.map(r => r.slice(0, 3))) === JSON.stringify([['BUTTON', long, 'fill 1'], ['BUTTON', 'Arrow', 'fill 1'], ['BUTTON', 'Dot', 'fill 1'], ['BUTTON', '+2 more', '']]) && tp.rows.every(r => r[4] === 24) && tp.cut && tp.last === 'rows',
			`a swatch's tooltip: three of its five layers as Figma's 24 px rows, a long name cut to one line, then "+2 more"; no hex; its rows pressable (${JSON.stringify(tp)})`)
		ok(tp.rows[0][3] === '0 0 16 16' && /^-?[\d.]+ -?[\d.]+ [\d.]+ [\d.]+$/.test(tp.rows[1][3]) && tp.rows[1][3] !== '0 0 16 16', `the text layer's icon Figma's T; the vector's its own outline, in its own box (${tp.rows[0][3]} · ${tp.rows[1][3]})`)
		ok(tp.whole && tp.arrow[1] === tp.arrow[2], `the tooltip on whole pixels, its tip running a hairline into it: no seam (${JSON.stringify(tp)})`)
		ok(tp.corners[0] === tp.corners[1] && tp.corners[3] === tp.corners[2] - tp.corners[0] && tp.corners[3] > 0, `its rows' corners concentric with its own: inset alike on every side, their radius its own less the inset (${tp.corners})`)
		// a vector's outline rides to the tip only while it is short enough for a 16 px icon; a longer one is Figma's vector mark
		const icons = await ui.locator('#paints .paint').evaluateAll(bs => bs.map(b => JSON.parse(b.dataset.tipRows)).flat().filter(r => ['Arrow', 'Scribble'].includes(r[1])).map(r => [r[1], typeof r[0] === 'object' ? 'shape' : r[0]]))
		ok(JSON.stringify(icons) === JSON.stringify([['Arrow', 'shape'], ['Scribble', 'VECTOR']]), `a short vector's own outline, a long one's the vector mark (${JSON.stringify(icons)})`)
		if (process.env.FIGMA_SHOTS) await page.locator('iframe').screenshot({ path: `${process.env.FIGMA_SHOTS}/figma-swatch-tip.png` })
		// it is live: the pointer crosses into it and it stays; a layer pressed is selected in Figma, the view left where it
		// stands while the layer is in it; "+2 more" selects the rest, and the far one brings the view to them
		const row = n => fr.evaluate(n => { const b = document.querySelectorAll('#tip .row')[n].getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2] }, n)
		const ib = await page.locator('iframe').boundingBox(), r0 = await row(0)
		await page.mouse.move(ib.x + r0[0], ib.y + r0[1], { steps: 6 })
		const crossed = await tipState()
		await page.mouse.down(); await page.mouse.up()
		await page.waitForFunction(() => window.__log.selected.length > 0, null, { timeout: 3000 }).catch(() => {})
		const sel1 = await page.evaluate(() => [window.__log.selected.at(-1), window.__log.centered.length])
		ok(crossed.on && JSON.stringify(sel1) === JSON.stringify([['10:2'], 0]), `the pointer crosses into the tip and it stays; its first layer pressed: that layer selected, the view kept (${JSON.stringify([crossed, sel1])})`)
		await page.waitForTimeout(150)
		const now = await ui.locator('#paints .paint[aria-pressed="true"]').getAttribute('data-keys')
		close(await held(ui), space.rgb.oklch(204, 76.5, 51), 1e-6, `…and its color the current one, the layer's own (${now})`)
		await page.waitForTimeout(400)
		await page.mouse.move(0, 0)
		await page.evaluate(ids => window.__select(ids), nodes.map(n => n.id))   // all of them again (the press narrowed the selection to the one)
		await ui.locator('#paints .paint', { hasText: 'Arrow' }).first().waitFor()
		await ui.locator('#paints .paint', { hasText: 'Arrow' }).first().hover()
		await fr.waitForFunction(() => document.getElementById('tip').classList.contains('on'), null, { timeout: 3000 }).catch(() => {})
		const r3 = await row(3)
		await page.mouse.move(ib.x + r3[0], ib.y + r3[1], { steps: 6 })
		await page.mouse.down(); await page.mouse.up()
		await page.waitForFunction(() => window.__log.centered.length > 0, null, { timeout: 3000 }).catch(() => {})
		const sel2 = await page.evaluate(() => [window.__log.selected.at(-1), window.__log.centered.at(-1)])
		ok(JSON.stringify(sel2) === JSON.stringify([['10:5', '10:6'], { x: 2600, y: 2550 }]), `"+2 more" pressed: the other two selected, the view brought to them (${JSON.stringify(sel2)})`)
		// leaving: gone at once, no fade (the swatch now the two selected layers')
		await page.waitForTimeout(300)
		await ui.locator('#paints .paint').first().hover()
		await fr.waitForFunction(() => document.getElementById('tip').classList.contains('on'), null, { timeout: 3000 }).catch(() => {})
		await page.mouse.move(ib.x + 3, ib.y + 20)   // the panel's padding: nothing there
		await page.waitForTimeout(650)   // past the tip's linger (tip.js, 500 ms) – the pointer's time to cross into it
		const gone = await tipState()
		ok(!gone.on && gone.opacity === 0, `leaving the swatch: the tooltip gone after its linger, no fade (${JSON.stringify(gone)})`)
		// a press's focus shows no tip: a button clicked once showed its tip at once and kept it while the focus stayed (the
		// settings mark under an open panel); the keyboard's focus does show it
		await ui.locator('#prmb').click(); await page.waitForTimeout(100)
		const pressed = await tipState()
		await page.keyboard.press('Escape'); await page.mouse.move(ib.x + 3, ib.y + 20)
		await ui.locator('#spq').focus(); await page.keyboard.press('Escape'); await page.keyboard.press('Tab'); await page.waitForTimeout(50)   // from the space's field, its menu shut, the next stop
		const keyed = await fr.evaluate(() => [document.activeElement?.id, document.getElementById('tip').classList.contains('on')])
		ok(!pressed.on && keyed[0] === 'prmb' && keyed[1], `a button pressed: no tip from its focus; reached by the keyboard, its tip (${JSON.stringify([pressed, keyed])})`)
		await ui.locator('#prmb').evaluate(b => b.blur())
		// a slider pressed: its knob takes the focus (its arrow keys), and no tip comes of it – Chrome reads a focus the page
		// sets after a press as the keyboard's, and the knob's tip once stood at once and hung there for good
		const kb = await ui.locator('.bar2:not(.alpha) .nrg').first().boundingBox()
		await page.mouse.click(kb.x + kb.width / 2, kb.y + kb.height / 2); await page.waitForTimeout(80)
		const atPress = await tipState()
		await page.mouse.move(ib.x + 3, ib.y + 20); await page.waitForTimeout(600)
		const afterPress = [await tipState(), await fr.evaluate(() => document.activeElement?.className)]
		ok(!atPress.on && !afterPress[0].on && afterPress[1] === 'nrg', `a knob pressed takes the focus, and no tip shows nor hangs (${JSON.stringify([atPress, afterPress])})`)
		// the settings opened over a tip: the tip gone
		await ui.locator('#prmb').hover(); await fr.waitForFunction(() => document.getElementById('tip').classList.contains('on'), null, { timeout: 3000 }).catch(() => {})
		await ui.locator('#prm').evaluate(e => e.showPopover())
		ok(!(await tipState()).on, 'the settings open: no tooltip left behind them')
		await ui.locator('#prm').evaluate(e => e.hidePopover())
		// a tip whose element leaves the page under the pointer (a list redrawn) goes with the next move – it once stayed
		const sw0 = ui.locator('#paints .paint').first()
		await sw0.hover(); await fr.waitForFunction(() => document.getElementById('tip').classList.contains('on'), null, { timeout: 3000 }).catch(() => {})
		await sw0.evaluate(b => b.remove())
		const sb = await ui.locator('#paints').boundingBox()
		await page.mouse.move(sb.x + 2, sb.y + 2); await page.waitForTimeout(50)
		ok(!(await tipState()).on, 'a tip whose element was taken out under the pointer: gone with the next move')
		ok(!errors.length, `swatch tooltip page errors: ${errors.join(' | ')}`)
		await page.context().close()
	}
	{
		// on the plane a resting pointer is told what it rests on – after the tooltips' wait, gone as it moves, ⌥ held or
		// not: another color's dot, its color by name (tomato, its CSS name) or by its value in the space's channels; a point
		// of the field, the color there; past the field, the color the point is, past sRGB the tightest gamut holding it,
		// past the locus none. The palette's tooltips list the layers alone, no color named
		const nodes = [{ id: '16:1', name: 'Plain', type: 'RECTANGLE', fills: [solid(0.2, 0.4, 0.8)], strokes: [] }, { id: '16:2', name: 'Warm', type: 'RECTANGLE', fills: [solid(1, 99 / 255, 71 / 255)], strokes: [] }]
		const { page, ui, errors } = await open({ profile: 'SRGB', editorType: 'figma', nodes, selection: ['16:1', '16:2'] })
		const fr = page.frames().find(f => f !== page.mainFrame()), tipNow = () => fr.evaluate(() => { const t = document.getElementById('tip'); return t.classList.contains('on') ? t.textContent : '' })
		const heads = await ui.locator('#paints .paint').evaluateAll(bs => bs.map(b => b.dataset.tipHead ?? null))
		ok(JSON.stringify(heads) === '[null,null]', `the palette's tooltips: the layers alone, no color named (${JSON.stringify(heads)})`)
		const db = await ui.locator('#marks .dm').first().boundingBox()
		await page.mouse.move(db.x + db.width / 2 - 6, db.y + db.height / 2); await page.mouse.move(db.x + db.width / 2, db.y + db.height / 2)
		await page.waitForTimeout(250); const early = await tipNow()
		await page.waitForTimeout(450); const onDot = await tipNow()
		ok(early === '' && onDot === 'tomato', `a dot rested on: after the tooltips' wait, its color by name (${JSON.stringify([early, onDot])})`)
		const pb = await ui.locator('#plane').boundingBox(), H0 = (await held(ui))[2], ch = classify('oklch').ch
		await page.mouse.move(pb.x + pb.width * 0.1, pb.y + pb.height * 0.5, { steps: 3 }); await page.waitForTimeout(80)
		const moved = await tipNow()
		await page.waitForTimeout(600)
		const there = await tipNow(), want = space.oklch.rgb(0.5, 0.04, H0).map(Math.round), named = Object.keys(NAMES).find(n => NAMES[n].join() === want.join())
		ok(moved === '' && there === (named || [0.5, 0.04, H0].map((x, i) => `${ch[i].sym}${fmtc(x, ch[i])}`).join(' ')), `…gone as the pointer moves on; resting on the field, the color there in the space's channels (${JSON.stringify([moved, there])})`)
		// ⌥ pressed where it rests: the tooltip stays, the measurement drawn; ⌥ held as the pointer moves on and rests, it comes
		await fr.evaluate(() => dispatchEvent(new KeyboardEvent('keydown', { key: 'Alt', altKey: true }))); await page.waitForTimeout(100)
		const pressed = [await tipNow(), await fr.evaluate(() => !!document.querySelector('.plw > .ruler'))]
		await fr.evaluate(() => dispatchEvent(new KeyboardEvent('keyup', { key: 'Alt' })))
		ok(pressed[0] === there && pressed[1], `⌥ pressed: the tooltip stays, the measurement drawn (${JSON.stringify(pressed)})`)
		await page.keyboard.down('Alt'); await page.mouse.move(pb.x + pb.width * 0.1 + 2, pb.y + pb.height * 0.5); await page.mouse.move(pb.x + pb.width * 0.1, pb.y + pb.height * 0.5)
		const altMoved = await tipNow(); await page.waitForTimeout(700); const altThere = await tipNow()
		await page.keyboard.up('Alt')
		ok(altMoved === '' && altThere === there, `⌥ held: gone as the pointer moves, there again where it rests (${JSON.stringify([altMoved, altThere])})`)
		// past the field (the sRGB the file holds): C 0.26 at L 0.5 past sRGB, in P3 (CSS Color 4's oklab and display-p3,
		// the converters test/index.js checks); C 0.38 at L 0.25 no light at all, its Y below zero
		const valueText = v => v.map((x, i) => `${ch[i].sym}${fmtc(x, ch[i])}`).join(' ')
		await page.mouse.move(pb.x + pb.width * 0.65, pb.y + pb.height * 0.5); await page.waitForTimeout(700)
		const p3Tip = await tipNow()
		await page.mouse.move(pb.x + pb.width * 0.95, pb.y + pb.height * 0.75); await page.waitForTimeout(700)
		const noTip = await tipNow()
		ok(!space.oklch.rgb(0.5, 0.26, H0).every(u => u >= 0 && u <= 255) && space.oklch.p3(0.5, 0.26, H0).every(u => u >= 0 && u <= 1) && p3Tip === `${valueText([0.5, 0.26, H0])}, P3`, `past the field: the color the point is, and the tightest gamut holding it (${JSON.stringify(p3Tip)})`)
		ok(space.oklch.xyz(0.25, 0.38, H0)[1] < 0 && noTip === 'Not a color', `past the locus: no color (${JSON.stringify(noTip)})`)
		await page.mouse.move(pb.x - 6, pb.y + pb.height / 2); await page.waitForTimeout(100)   // beside it, in the panel: a move off the frame may go unreported, the page's own pointerleave its only word (tip.js)
		const off = await tipNow()
		ok(off === '', `off the plane: gone (${JSON.stringify(off)})`)
		ok(!errors.length, `swatch name page errors: ${errors.join(' | ')}`)
		await page.context().close()
		// a P3 file's pure red: its sRGB clip is CSS red's bytes, but it is no CSS red – its value, and P3 after it (once
		// named "red": a name was looked up on the clip)
		const p3 = await open({ profile: 'DISPLAY_P3', editorType: 'figma', nodes: [nodes[0], { id: '16:3', name: 'Red', type: 'RECTANGLE', fills: [solid(1, 0, 0)], strokes: [] }], selection: ['16:1', '16:3'] })
		const pfr = p3.page.frames().find(f => f !== p3.page.mainFrame()), rd = await p3.ui.locator('#marks .dm').first().boundingBox()
		await p3.page.mouse.move(rd.x + rd.width / 2 - 6, rd.y + rd.height / 2); await p3.page.mouse.move(rd.x + rd.width / 2, rd.y + rd.height / 2); await p3.page.waitForTimeout(700)
		const redTip = await pfr.evaluate(() => { const t = document.getElementById('tip'); return t.classList.contains('on') ? t.textContent : '' })
		ok(!space.p3.rgb(1, 0, 0).every(u => u >= -0.5 && u <= 255.5) && /^L[\d.]+ C[\d.]+ H[\d.]+, P3$/.test(redTip), `a P3 file's pure red rested on: its value and P3, not "red" (${JSON.stringify(redTip)})`)
		await p3.page.context().close()
	}
	{
		// ⌥ held over another color – a dot, its swatch, a point of the plane, a slider – weighed against the current one, as
		// Figma's ⌥ measures between two points (web/js/ruler.js): from the current color's mark a solid line along each of the
		// plane's channels to it, each with its step (the across one under its line, the up one beside), and from it a dashed
		// one back to each line's end – no knob there; in a corner the WCAG contrast (colorjs.io's contrastWCAG21, an
		// independent implementation), where the color stands and the off-plane channel's step; its value in the value field
		const nodes = [{ id: '11:1', name: 'Card', type: 'RECTANGLE', fills: [solid(0.2, 0.4, 0.8)], strokes: [] }, { id: '11:2', name: 'Label', type: 'TEXT', fills: [solid(0.8, 0.3, 0.2)], strokes: [] }]
		const measured = async (stored = {}) => {
			const { page, ui, errors } = await open({ profile: 'SRGB', editorType: 'figma', nodes, selection: ['11:1', '11:2'], stored })
			return { page, ui, errors, fr: page.frames().find(f => f !== page.mainFrame()) }
		}
		const { page, ui, errors, fr } = await measured()
		const over = () => fr.evaluate(() => { const r = document.querySelector('.plw > .ruler'); if (!r) return null
			const [svg, la, lb, ro] = r.children, [rs, rd] = svg.children, pos = e => [parseFloat(e.style.left), parseFloat(e.style.top)].map(Math.round)
			return { d: rs.getAttribute('d'), dash: rd.getAttribute('d'), steps: [la.textContent, lb.textContent], at: [pos(la), pos(lb)], sides: [la.dataset.at, lb.dataset.at], knob: !!r.querySelector('.rk'), readout: [...ro.children].map(b => b.textContent), corner: ro.classList.contains('tl') ? 'tl' : 'tr', value: [...document.querySelectorAll('#cells input')].map(x => x.value).join(' '),
				red: [getComputedStyle(rs).stroke, ro.firstElementChild && getComputedStyle(ro.firstElementChild).backgroundColor], dashes: [getComputedStyle(rs).strokeDasharray, getComputedStyle(rd).strokeDasharray] } })
		const [cur, other] = [new Color('srgb', [0.2, 0.4, 0.8]), new Color('srgb', [0.8, 0.3, 0.2])]
		const ratioOf = (a, b) => { const r = (Math.floor(a.contrastWCAG21(b) * 100) / 100).toFixed(2); return `${r}:1${+r >= 7 ? ' AAA' : +r >= 4.5 ? ' AA' : +r >= 3 ? ' AA large' : ''}` }
		const [lc, lo] = [space.rgb.oklch(51, 102, 204), space.rgb.oklch(204, 76.5, 51)], ch = classify('oklch').ch, stepOf = (i, a = lc, b = lo) => { let d = b[i] - a[i]; if (i === 2) d -= 360 * Math.round(d / 360); const s = Math.abs(d).toFixed(decOf(ch[i])); return +s ? `${ch[i].sym} ${d < 0 ? '−' : '+'}${s}` : '' }
		const valueC = await cellsText(ui)
		await page.mouse.move(0, 0)
		await page.keyboard.down('Alt')
		const dot = ui.locator('#marks .dm').first()
		await dot.hover()
		if (process.env.FIGMA_SHOTS) await page.locator('iframe').screenshot({ path: `${process.env.FIGMA_SHOTS}/figma-alt-dot.png` })
		const m1 = await over(), dotAt = await dot.evaluate(d => [parseFloat(d.style.left), parseFloat(d.style.top)]), cxAt = await fr.evaluate(() => { const c = document.querySelector('#plane .cx'); return [parseFloat(c.style.left), parseFloat(c.style.top)] })
		const nums = d => d.match(/-?[\d.]+/g).map(Number), near = (a, b, t = 0.01) => a.length === b.length && a.every((v, k) => Math.abs(v - b[k]) < t)
		const [x0, y0] = cxAt, [x1, y1] = dotAt
		ok(m1 && /^M[\d.]+ [\d.]+H[\d.]+M[\d.]+ [\d.]+V[\d.]+$/.test(m1.d) && near(nums(m1.d), [x0, y0, x1, x0, y0, y1]), `⌥ over a dot: a solid line along each channel from the current color's mark – across to the dot's C, up to its L (${m1?.d} vs ${cxAt} → ${dotAt})`)
		ok(m1 && /^M[\d.]+ [\d.]+H[\d.]+M[\d.]+ [\d.]+V[\d.]+$/.test(m1.dash) && near(nums(m1.dash), [x0, y1, x1, x1, y0, y1]), `…and a dashed one from the dot back to each line's end, as Figma's ⌥ draws them (${m1?.dash})`)
		ok(m1 && m1.dashes[0] === 'none' && /^8px,? 4px$/.test(m1.dashes[1]), `…the solid ones whole, the dashed ones 8 px on and 4 off (${m1?.dashes})`)
		ok(m1 && JSON.stringify(m1.steps) === JSON.stringify([stepOf(1), stepOf(0)]) && JSON.stringify(m1.at) === JSON.stringify([[Math.round((x0 + x1) / 2), Math.round(y0)], [Math.round(x0), Math.round((y0 + y1) / 2)]]), `…each solid line with its step at its middle (${JSON.stringify(m1 && [m1.steps, m1.at])}, want ${[stepOf(1), stepOf(0)]})`)
		ok(m1 && JSON.stringify(m1.red) === JSON.stringify(['rgb(242, 72, 34)', 'rgb(242, 72, 34)']), `…in Figma's measuring red, #f24822, lines and pills (${m1?.red})`)
		ok(m1 && !m1.knob, '…and no knob at the color weighed: the lines alone meet there')
		ok(m1 && JSON.stringify(m1.readout) === JSON.stringify([ratioOf(cur, other), stepOf(2)]) && m1.corner === 'tr', `…in the top corner the contrast (colorjs.io's) and the hue's step – in sRGB, no word for where it stands (${JSON.stringify(m1?.readout)})`)
		ok(m1 && m1.value === [...lo.map((x, i) => fmtc(x, ch[i])), '100'].join(' '), `…its value in the cells (${m1?.value})`)
		// over its swatch: the same, and no tooltip of the swatch's own coming over it, however long the pointer rests
		await ui.locator('#paints .paint').nth(1).hover()
		const m2 = await over()
		await page.mouse.move(...await ui.locator('#paints .paint').nth(1).boundingBox().then(b => [b.x + b.width / 2 + 1, b.y + b.height / 2]))
		await page.waitForTimeout(800)
		ok(!(await fr.evaluate(() => document.getElementById('tip').classList.contains('on'))), '⌥ resting on a swatch: no tooltip of its own over the readout')
		ok(m2 && m2.d === m1.d && JSON.stringify(m2.readout) === JSON.stringify(m1.readout), `⌥ over its swatch: the same measurement on the plane (${m2?.d})`)
		const pb = await ui.locator('#plane').boundingBox()
		await page.mouse.move(pb.x + pb.width * 0.3, pb.y + pb.height * 0.5)
		const m3 = await over()
		if (process.env.FIGMA_SHOTS) await page.locator('iframe').screenshot({ path: `${process.env.FIGMA_SHOTS}/figma-alt-plane.png` })
		ok(m3 && near(nums(m3.dash).slice(2, 3), [30]) && near(nums(m3.dash).slice(1, 2), [50]) && m3.value !== valueC, `⌥ over a point of the plane: the lines to the pointer, its value shown (${JSON.stringify(m3)})`)
		ok(m3 && JSON.stringify(m3.sides) === JSON.stringify([50 < cxAt[1] ? 'below' : 'above', 30 < cxAt[0] ? 'left' : 'right']), `…the steps set as Figma sets them, the across one outside the box the lines draw, the up one inside it (${m3?.sides}; the mark at ${cxAt})`)
		// close to the mark, every way round, and at the field's edges: the pills never meet, nor leave the field, nor sit on
		// the readout (each would once stand over the other at a few pixels' distance)
		{
			const clash = []
			const at = () => fr.evaluate(() => { const r = document.querySelector('.plw > .ruler'), box = document.getElementById('plane').getBoundingClientRect(); if (!r) return { none: true }
				const [, la, lb, ro] = r.children
				const R = e => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom] }, hit = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3]
				const ps = [la, lb].filter(e => e.textContent).map(R), inside = ps.every(b => b[0] >= box.left - 0.5 && b[2] <= box.right + 0.5 && b[1] >= box.top - 0.5 && b[3] <= box.bottom + 0.5)
				return { n: ps.length, apart: ps.length < 2 || !hit(ps[0], ps[1]), inside, clear: ps.every(b => !hit(b, R(ro))) } })
			const [cx, cy] = cxAt.map(p => p / 100)
			for (const [dx, dy] of [[8, -8], [-8, -8], [8, 8], [-8, 8], [14, -3], [3, 14], [-20, 2], [40, -40]]) {
				await page.mouse.move(pb.x + pb.width * cx + dx, pb.y + pb.height * cy + dy)
				const m = await at()
				if (!(m.apart && m.inside && m.clear)) clash.push([dx, dy, m])
			}
			for (const [fx, fy] of [[0.5, 0.02], [0.98, 0.5], [0.5, 0.98], [0.02, 0.5], [0.9, 0.04]]) {   // the edges (the corners hold the letters)
				await page.mouse.move(pb.x + pb.width * fx, pb.y + pb.height * fy)
				const m = await at()
				if (!(m.apart && m.inside && m.clear)) clash.push([fx, fy, m])
			}
			ok(!clash.length, `⌥ a few pixels from the mark, every way round, and at the corners: the pills apart, inside the field, off the readout (${JSON.stringify(clash)})`)
		}
		// past the field, a point is weighed too, where it stands left to the plane's tooltip: C 0.26 at L 0.5 is past sRGB,
		// in P3 – its contrast; C 0.38 at L 0.25 no light at all (its Y below zero: every real light's X, Y, Z are positive,
		// the CIE 1931 matching functions being so) – no contrast
		const H0 = (await held(ui))[2]
		await page.mouse.move(pb.x + pb.width * 0.65, pb.y + pb.height * 0.5)
		const inP3 = await over()
		await page.mouse.move(pb.x + pb.width * 0.95, pb.y + pb.height * 0.75)
		const none = await over()
		ok(!space.oklch.rgb(0.5, 0.26, H0).every(u => u >= 0 && u <= 255) && space.oklch.p3(0.5, 0.26, H0).every(u => u >= 0 && u <= 1) && /^[\d.]+:1/.test(inP3?.readout[0]) && !/P3|Rec|⚠/.test(inP3.readout.join()), `⌥ past the field: a color past sRGB, in P3 – its contrast, no word for its gamut (${JSON.stringify(inP3?.readout)})`)
		ok(space.oklch.xyz(0.25, 0.38, H0)[1] < 0 && none && !/:1|⚠/.test(none.readout.join()), `⌥ off the locus: no contrast, no sign (${JSON.stringify(none?.readout)})`)
		// the edges: the current color's own swatch, the opacity slider – nothing; a slider's knob: the current color itself,
		// no lines, the readout alone
		await ui.locator('#paints .paint').first().hover()
		const own = await over()
		const ab = await ui.locator('.bar2[data-i="a"]').boundingBox()
		await page.mouse.move(ab.x + ab.width * 0.3, ab.y + ab.height / 2)
		const alphaM = await over()
		const kn = await ui.locator('.bar2:not([data-i="a"]) .nrg').first().boundingBox()
		await page.mouse.move(kn.x + kn.width / 2, kn.y + kn.height / 2)
		const barM = await over()
		ok(own === null && alphaM === null, `⌥ over the current color's own swatch, the opacity slider: nothing (${JSON.stringify([own, alphaM])})`)
		ok(barM && barM.d === '' && JSON.stringify(barM.readout) === JSON.stringify(['1.00:1']) && barM.value === valueC, `⌥ on a slider's knob: the current color itself, the readout alone (${JSON.stringify(barM)})`)
		// ⌥ let go: all gone, the value back
		await dot.hover()
		await page.keyboard.up('Alt')
		await page.mouse.move(pb.x + pb.width * 0.31, pb.y + pb.height * 0.5)
		const off = await over()
		ok(off === null && await cellsText(ui) === valueC, `⌥ let go: the measurement gone, the value back (${JSON.stringify(off)})`)
		// the key itself, where the panel has the focus: pressed with the pointer resting on a dot, the measurement; let go, gone
		await ui.locator('#cells input').first().focus()
		await dot.hover()
		await page.keyboard.down('Alt')
		const keyM = await over()
		await page.keyboard.up('Alt')
		const keyOff = await over()
		ok(keyM && keyM.d && keyOff === null, `⌥ pressed and let go without a move: the measurement comes and goes with the key (${JSON.stringify([!!keyM, keyOff])})`)
		// held through a drag: how far the color has come – from where the press put it (the drag's origin, the one ⇧ holds a
		// channel to) to where it is
		{
			await page.mouse.move(pb.x + pb.width * 0.2, pb.y + pb.height * 0.4)
			await page.mouse.down(); await page.waitForTimeout(50)
			const before = await held(ui), start = await fr.evaluate(() => { const c = document.querySelector('#plane .cx'); return [parseFloat(c.style.left), parseFloat(c.style.top)] })
			await page.mouse.move(pb.x + pb.width * 0.25, pb.y + pb.height * 0.45, { steps: 2 })
			await page.keyboard.down('Alt')
			await page.mouse.move(pb.x + pb.width * 0.26, pb.y + pb.height * 0.46)
			const md = await over(), now = await held(ui)
			await page.keyboard.up('Alt')
			await page.mouse.up()
			const nowC = new Color('oklch', now), wasC = new Color('oklch', before)
			ok(md && near(nums(md.d).slice(0, 2), start, 0.05) && near(nums(md.dash).slice(2, 3), [26], 0.6) && JSON.stringify(md.steps) === JSON.stringify([stepOf(1, before, now), stepOf(0, before, now)]) && md.readout[0] === ratioOf(wasC, nowC), `⌥ held through a drag: the lines from where the press put the color, the steps and the contrast it has come (${JSON.stringify(md)})`)
		}
		ok(!errors.length, `⌥ page errors: ${errors.join(' | ')}`)
		await page.context().close()
		// on a wheel (H × C): around at the mark's radius and out along its angle, the dashed ones closing at the dot – H's
		// step on the arc, C's on the ray
		const w = await measured({ pairs: { oklch: 2 } })
		await w.ui.locator('#plane.polar').waitFor({ timeout: 5000 }).catch(() => {})
		await w.page.mouse.move(0, 0)
		await w.page.keyboard.down('Alt')
		await w.ui.locator('#marks .dm').first().hover()
		const mw = await w.fr.evaluate(() => { const r = document.querySelector('.plw > .ruler'); return r && { d: r.querySelector('.rs').getAttribute('d'), dash: r.querySelector('.rd').getAttribute('d'), steps: [...r.querySelectorAll('.rl')].map(e => e.textContent) } })
		await w.page.keyboard.up('Alt')
		const arc = /^M[\d.]+ [\d.]+A[\d.]+ [\d.]+ 0 0 [01] [\d.]+ [\d.]+M[\d.]+ [\d.]+L[\d.]+ [\d.]+$/
		ok(mw && arc.test(mw.d) && arc.test(mw.dash) && /^H [+−]/.test(mw.steps[0]) && /^C [+−]/.test(mw.steps[1]), `⌥ on a wheel: an arc at the mark's radius and a ray along its angle, solid; their dashed twins closing at the dot; H's step on the arc, C's on the ray (${JSON.stringify(mw)})`)
		ok(!w.errors.length, `⌥ wheel page errors: ${w.errors.join(' | ')}`)
		await w.page.context().close()
	}
	{
		// a drag snaps to another color's dot within 3 px of it – the plane's two channels its, the held one kept, as the
		// site's planes snap – not past that (6 px once took the color too eagerly), and not while ⌘ places finely
		const nodes = [{ id: '12:1', name: 'Card', type: 'RECTANGLE', fills: [solid(0.2, 0.4, 0.8)], strokes: [] }, { id: '12:2', name: 'Label', type: 'TEXT', fills: [solid(0.8, 0.3, 0.2)], strokes: [] }]
		const { page, ui, errors } = await open({ profile: 'SRGB', editorType: 'figma', nodes, selection: ['12:1', '12:2'] })
		const pb = await ui.locator('#plane').boundingBox(), dot = await ui.locator('#marks .dm').first().evaluate(d => [parseFloat(d.style.left), parseFloat(d.style.top)])
		const [L, C] = space.rgb.oklch(204, 76.5, 51), H = (await held(ui))[2], off = d => [pb.x + pb.width * dot[0] / 100 + d, pb.y + pb.height * dot[1] / 100]
		await page.mouse.move(pb.x + pb.width * 0.2, pb.y + pb.height * 0.3)
		const axesOn = () => ui.locator('#axes').evaluate(a => [...a.children].filter(b => !b.hidden).map(b => getComputedStyle(b).visibility).join())
		const axesBefore = await axesOn()
		await page.mouse.down()
		await page.mouse.move(...off(5), { steps: 3 })
		const past = await held(ui), axesMid = await axesOn()
		await page.mouse.move(...off(2.5), { steps: 2 })
		const snapped = await held(ui)
		await page.keyboard.down('ControlOrMeta')
		await page.mouse.move(off(2.5)[0] + 2, off(2.5)[1])
		const finely = await held(ui)
		await page.keyboard.up('ControlOrMeta')
		await page.mouse.up()
		const axesAfter = await axesOn()
		ok(/^visible(,visible)*$/.test(axesBefore) && /^hidden(,hidden)*$/.test(axesMid) && axesAfter === axesBefore, `a pick under way: the axes' letters and switch gone, back at the release (${[axesBefore, axesMid, axesAfter].join(' | ')})`)
		ok(Math.abs(snapped[0] - L) < 1e-9 && Math.abs(snapped[1] - C) < 1e-9 && Math.abs(snapped[2] - H) < 1e-9, `a drag 2.5 px off another color's dot lands on it: its L and C, the hue held (${snapped} vs ${[L, C, H]})`)
		ok(Math.abs(past[1] - C) > 1e-6, `…5 px off it, its own place (${past})`)
		ok(Math.abs(finely[1] - C) > 1e-6, `…and with ⌘ held it moves finely, unsnapped (${finely})`)
		// a dot taken up with ⇧ held and dragged across: L held at the dot's own L – the drag's origin is the dot's color, not
		// where the pointer first moved (once it was, and ⌥ showed L +0.01 for a channel ⇧ held); ⌥ then shows no L step
		const dc = await ui.locator('#marks .dm').first().boundingBox()
		await page.keyboard.down('Shift')
		await page.mouse.move(dc.x + dc.width / 2, dc.y + dc.height / 2); await page.mouse.down()
		await page.mouse.move(dc.x + dc.width / 2 + 20, dc.y + dc.height / 2 + 1)
		const shifted = await held(ui)
		await page.keyboard.down('Alt'); await page.mouse.move(dc.x + dc.width / 2 + 21, dc.y + dc.height / 2 + 1)
		const ruled = await page.frames().find(f => f !== page.mainFrame()).evaluate(() => { const r = document.querySelector('.plw > .ruler'); return r && [...r.querySelectorAll('.rl')].map(e => e.textContent) })
		await page.keyboard.up('Alt'); await page.mouse.up(); await page.keyboard.up('Shift')
		ok(Math.abs(shifted[0] - L) < 1e-9 && Math.abs(shifted[1] - C) > 1e-3 && ruled && /^C [+−]/.test(ruled[0]) && ruled[1] === '', `a dot dragged with ⇧: L held at the dot's own (${shifted[0]} vs ${L}), C moving; ⌥ shows C's step alone (${JSON.stringify(ruled)})`)
		// the settings' snap off: the same drag passes the dot, the choice kept; a panel opened with it off has it off
		await ui.locator('#prmb').click(); await ui.locator('#snap').click(); await page.keyboard.press('Escape')
		const keptOff = await page.evaluate(() => window.__stored('snap'))
		await page.mouse.move(pb.x + pb.width * 0.2, pb.y + pb.height * 0.3); await page.mouse.down()
		await page.mouse.move(...off(2.5), { steps: 3 })
		const passed = await held(ui)
		await page.mouse.up()
		ok(keptOff === false && Math.abs(passed[1] - C) > 1e-6, `snap off in the settings: 2.5 px off the dot, its own place – kept (${keptOff}; ${passed})`)
		// the settings' hints: each key the panel answers, a line each – on a Mac its glyphs; on Windows their names, + joining
		const hintsOf = pg => pg.frames().find(f => f !== pg.mainFrame()).evaluate(() => [...document.querySelectorAll('#hints p')].map(p => [p.firstElementChild.textContent, p.querySelector('kbd').textContent]))
		const macH = await hintsOf(page)
		ok(JSON.stringify(macH.map(h => h[1])) === JSON.stringify(['⇧', '⌘', '⌥', '⌃ Scroll', 'Double-click', '⇧ ↑↓']) && macH[0][0] === 'Drag along one channel', `the settings' hints, a Mac's keys (${JSON.stringify(macH)})`)
		ok(!errors.length, `snap page errors: ${errors.join(' | ')}`)
		await page.context().close()
		const off2 = await open({ profile: 'SRGB', editorType: 'figma', nodes, selection: ['12:1', '12:2'], stored: { snap: false }, platform: 'Win32' })
		ok(!(await off2.ui.locator('#snap').isChecked()), 'a panel opened with snap kept off: its box unchecked')
		const winH = (await hintsOf(off2.page)).map(h => h[1])
		ok(JSON.stringify(winH) === JSON.stringify(['Shift', 'Ctrl', 'Alt', 'Ctrl+Scroll', 'Double-click', 'Shift+↑↓']), `on Windows the hints name the keys: Ctrl for ⌘ (${JSON.stringify(winH)})`)
		await off2.page.context().close()
	}

	{
		// a space with no CSS of its own (CMYK): no made-up notation – its channels as cells, Figma's split field for RGB: a
		// cell a channel, its letter before its number, the opacity last in %; typed (Enter takes it, Escape puts it back),
		// stepped with ↑↓ (Shift: ten), a whole value pasted into one taken whole. Its own row in the format list is the
		// value as text, the print shops' C12 M24 Y36 K0; narrower than every letter and number, the numbers alone
		const nodes = [{ id: '13:1', name: 'Print', type: 'RECTANGLE', fills: [solid(0.2, 0.5, 0.8, { opacity: 0.8 })], strokes: [] }]
		const { page, ui, errors } = await open({ profile: 'SRGB', editorType: 'figma', nodes, selection: ['13:1'], stored: { space: 'cmyk', format: 'space', width: 360 } })   // room for every letter, at 100 too
		const cs = classify('cmyk').ch, txt = v => v.map((x, i) => `${cs[i].sym}${fmtc(x, cs[i])}`).join(' ')
		const cellsOf = () => ui.locator('#cells input').evaluateAll(xs => xs.map(x => [x.getAttribute('aria-label'), x.value, (x.previousElementSibling || x.nextElementSibling).textContent, x.scrollWidth <= x.clientWidth + 1]))
		const filled = async () => rgbOf((await page.evaluate(() => window.__paints('13:1', 'fills')))[0]).map(u => u * 255)
		let c = await cellsOf(), v0 = space.rgb.cmyk(51, 127.5, 204)
		ok(JSON.stringify(c.map(x => x[0])) === '["Cyan","Magenta","Yellow","Black","Opacity"]' && JSON.stringify(c.map(x => x[2])) === '["C","M","Y","K","%"]', `CMYK: a cell a channel, named and lettered, the opacity last in % (${JSON.stringify(c)})`)
		ok(JSON.stringify(c.map(x => x[1])) === JSON.stringify([...v0.map((x, i) => fmtc(x, cs[i])), '80']) && c.every(x => x[3]), `…each at the atlas's decimals, every number in sight (${c.map(x => x[1])})`)
		ok(await ui.locator('#fmt option[value="space"]').textContent() === `${txt(v0)} / 80%`, `its own row in the format list: the value as text, ${txt(v0)} / 80% (${await ui.locator('#fmt option[value="space"]').textContent()})`)
		const cell = k => ui.locator('#cells input').nth(k)
		await cell(1).click()
		ok(await cell(1).evaluate(x => x.selectionStart === 0 && x.selectionEnd === x.value.length), 'a cell focused: its number selected')
		await page.keyboard.type('50'); await page.keyboard.press('Enter'); await page.waitForTimeout(120)
		let v = space.rgb.cmyk(...await filled())
		ok(Math.abs(v[1] - 50) < 0.5 && Math.abs(v[0] - v0[0]) < 0.5, `M typed, Enter: the fill's magenta 50, the rest kept (${v.map(x => x.toFixed(2))})`)
		await page.keyboard.press('ArrowUp'); await page.keyboard.press('Shift+ArrowUp'); await page.waitForTimeout(120)
		ok(Math.abs((await held(ui))[1] - 61) < 1e-9, `↑ then ⇧↑: M by 1, then 10 (${(await held(ui))[1]})`)
		await page.keyboard.type('5'); await page.keyboard.press('Escape'); await page.waitForTimeout(80)
		ok((await cellsOf())[1][1] === '61', 'Escape puts the number back')
		// its number typed again as it is, or the cell emptied: nothing written, the number back
		const w0 = (await page.evaluate(() => window.__log.writes.length))
		await cell(1).fill('61'); await cell(1).press('Enter')
		await cell(1).fill(''); await cell(1).press('Enter'); await page.waitForTimeout(100)
		ok(await page.evaluate(() => window.__log.writes.length) === w0 && (await cellsOf())[1][1] === '61' && (await ui.locator('#err').innerText()) === '', 'the same number typed again, or the cell emptied: nothing written, no error, the number back')
		await cell(4).fill('50'); await cell(4).press('Enter'); await page.waitForTimeout(120)
		ok(await alphaOf(ui) === 0.5, 'the opacity cell: 50 is 50%')
		await cell(0).fill('C10 M20 Y30 K5'); await cell(0).press('Enter'); await page.waitForTimeout(150)
		close(await held(ui), [10, 20, 30, 5], 1e-9, 'a whole value pasted into a cell, as its row gives it: every channel taken')
		await cell(2).fill('#336699'); await cell(2).press('Enter'); await page.waitForTimeout(150)
		close((await filled()).map(Math.round), [0x33, 0x66, 0x99], 0, 'a hex pasted into a cell: that color')
		// the group answers as one: the value's grey hairline under the pointer, the selection color round it while a cell
		// has the focus
		const ring = () => ui.locator('#cells').evaluate(e => getComputedStyle(e).outlineColor)
		await ui.locator('#prmb').hover(); await ui.locator('body').evaluate(() => document.activeElement?.blur()); const r0 = await ring()
		await cell(1).hover(); const r1 = await ring()
		await cell(1).focus(); await ui.locator('#prmb').hover(); const r2 = await ring()
		ok(/, 0\)$|transparent/.test(r0) && r1 !== r0 && r2 !== r1 && !/, 0\)$/.test(r2), `the cells: a hairline under the pointer, the selection color with the focus (${[r0, r1, r2]})`)
		// a letter, or the %, scrubs its number, as Figma's: a drag across, a step a pixel (Shift: ten), Figma's ew-resize
		// cursor through it, one write at the release; held to the range as a slider is
		const fr = page.frames().find(f => f !== page.mainFrame())
		await setCh(ui, 1, '40'); await page.waitForTimeout(100)
		const scrub = async (k, dx, mods = []) => {
			const g = await ui.locator('#cells .cell').nth(k).locator('i').last().boundingBox(), w0 = await page.evaluate(() => window.__log.writes.length)
			await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2); await page.mouse.down()
			for (const m of mods) await page.keyboard.down(m)
			await page.mouse.move(g.x + g.width / 2 + dx / 2, g.y + g.height / 2); await page.mouse.move(g.x + g.width / 2 + dx, g.y + g.height / 2)
			const cur = await fr.evaluate(() => [document.documentElement.classList.contains('scrub'), getComputedStyle(document.body).cursor])
			for (const m of mods) await page.keyboard.up(m)
			await page.mouse.up(); await page.waitForTimeout(100)
			return [cur, await page.evaluate(() => window.__log.writes.length) - w0]
		}
		await pickSpace(ui, 'hsv'); await page.waitForTimeout(100); await setCh(ui, 0, '355'); await page.waitForTimeout(100)
		await scrub(0, 10)
		ok(Math.abs((await held(ui))[0] - 5) < 1e-9, `a hue scrubbed past 360 comes round: H 355 + 10 px → 5 (${(await held(ui))[0]})`)
		await pickSpace(ui, 'cmyk'); await page.waitForTimeout(100); await setCh(ui, 1, '40'); await page.waitForTimeout(100)
		const [sc1, wr1] = await scrub(1, 12)
		const mScrub = (await held(ui))[1]
		ok(Math.abs(mScrub - 52) < 1e-9 && sc1[0] && sc1[1] === 'ew-resize', `M's letter dragged 12 px: M 40 → 52, the ew-resize cursor through it (${mScrub}, ${sc1})`)
		await scrub(1, 10, ['Shift'])
		ok(Math.abs((await held(ui))[1] - 100) < 1e-9, `…with Shift, ten a pixel, held at its range's end, 100 (${(await held(ui))[1]})`)
		await scrub(1, -3)
		ok(Math.abs((await held(ui))[1] - 97) < 1e-9, `…and from the end, 3 px back is 97 at once, no slack (${(await held(ui))[1]})`)
		await scrub(4, -20)
		ok(await alphaOf(ui) === 0.8, `the opacity's % dragged 20 px left: 100% → 80% (${await alphaOf(ui)})`)
		const gapAt = async w => { const m = await open({ profile: 'SRGB', editorType: 'figma', nodes, selection: ['13:1'], stored: { space: 'cmyk', width: w } }); await m.page.waitForTimeout(200); const g = await m.ui.locator('#cells .cell').first().evaluate(c => parseFloat(getComputedStyle(c).columnGap)); await m.page.context().close(); return Math.round(g * 10) / 10 }
		const gaps = [await gapAt(240), await gapAt(288), await gapAt(384), await gapAt(480), await gapAt(560)]
		ok(JSON.stringify(gaps) === JSON.stringify([4, 4, 6, 8, 8]), `a letter 4 px from its number up to Figma's 288 px, growing with the panel to Figma's 8 at 480 (${gaps} at 240, 288, 384, 480, 560 px)`)
		// a focus ring only on the keyboard's way: a slider's knob pressed takes the focus (its arrow keys) without one; Tab
		// brings it
		const focusRing = () => fr.evaluate(() => { const a = document.activeElement; return [a?.className || a?.id, getComputedStyle(a).outlineStyle] })
		const kn = await ui.locator('.bar2:not(.alpha) .nrg').first().boundingBox()
		await page.mouse.click(kn.x + kn.width / 2, kn.y + kn.height / 2); await page.keyboard.press('ArrowRight')
		const pressedRing = await focusRing()
		await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab')
		const tabbedRing = await focusRing()
		ok(pressedRing[0] === 'nrg' && pressedRing[1] === 'none' && tabbedRing[0] === 'nrg' && tabbedRing[1] === 'solid', `a knob pressed, then its arrow keys: no ring; reached by Tab: its ring (${JSON.stringify([pressedRing, tabbedRing])})`)
		// every space's own value is its cells – a CSS one's too, its CSS a row of the list
		await pickSpace(ui, 'oklch'); await page.waitForTimeout(100)
		ok(await ui.locator('#cells').isVisible() && await ui.locator('#cells input').count() === 4 && /^oklch\(/.test(await ui.locator('#fmt option[value="oklch"]').textContent()), 'OKLCH: its cells too, its CSS the list\'s next row')
		// a letter ending in a digit stands apart from its number: Ohta's I1 0.32 reads back as I1 = 0.32
		await pickSpace(ui, 'ohta'); await page.waitForTimeout(100)
		const oRow = await ui.locator('#fmt option[value="space"]').textContent()
		await cell(0).fill(oRow); await cell(0).press('Enter'); await page.waitForTimeout(120)
		const oh = await held(ui), ochs = classify('ohta').ch
		ok(/^I1 [-\d.]+ I2 [-\d.]+ I3 [-\d.]+/.test(oRow) && oh.every((x, i) => fmtc(x, ochs[i]) === oRow.split(' ')[2 * i + 1]), `Ohta: I1 spaced off its number, and its row read back as it reads (${oRow}; ${oh})`)
		ok(!errors.length, `cells page errors: ${errors.join(' | ')}`)
		await page.context().close()
		// narrow, CMYK's four letters and numbers don't fit: the numbers alone, each cell's name its tooltip
		const n = await open({ profile: 'SRGB', editorType: 'figma', nodes, selection: ['13:1'], stored: { space: 'cmyk', format: 'space', width: 240 } })
		await n.page.waitForTimeout(300)
		const nc = await n.ui.locator('#cells').evaluate(b => [b.classList.contains('tight'), [...b.querySelectorAll('input')].every(x => x.scrollWidth <= x.clientWidth + 1), [...b.querySelectorAll('.cell:not(.op) i')].every(i => getComputedStyle(i).display === 'none') && getComputedStyle(b.querySelector('.cell.op i')).display !== 'none', [...b.querySelectorAll('.cell')].map(l => l.dataset.tip)])
		ok(nc[0] && nc[1] && nc[2] && JSON.stringify(nc[3]) === '["Cyan","Magenta","Yellow","Black","Opacity"]', `240 px wide: CMYK's numbers alone, the opacity's % kept, every one in sight, each cell named in its tooltip (${JSON.stringify(nc)})`)
		await n.page.context().close()
		// the cells share the row equally, the opacity's as wide as a channel's, its % at the cell's right and kept at 240 px;
		// XYB's X at the atlas's four decimals (a hundredth of its −0.015…0.028) where its cell has the room; at 240 px,
		// letters gone, −0.0018 still doesn't: it sheds one (never cut) – ↑ steps it at what it shows, Enter on it as shown
		// writes nothing
		const olive = space.oklch.rgb(0.47, 0.088, 121).map(x => x / 255)   // oklch(0.47 0.088 121), at 100%: in XYB, X −0.0018
		const cOf = async w => {
			const m = await open({ profile: 'SRGB', editorType: 'figma', nodes: [{ id: '13:2', name: 'Olive', type: 'RECTANGLE', fills: [solid(...olive)], strokes: [] }], selection: ['13:2'], stored: { space: 'xyb', width: w } })
			await m.page.waitForTimeout(300)
			return { m, got: await m.ui.locator('#cells').evaluate(b => ({ texts: [...b.querySelectorAll('input')].map(x => x.value), fit: [...b.querySelectorAll('input')].every(x => x.scrollWidth <= x.clientWidth + 1), widths: [...b.querySelectorAll('.cell')].map(c => Math.round(c.getBoundingClientRect().width)), pct: (() => { const c = b.querySelector('.cell.op'), i = c.querySelector('i'); return getComputedStyle(i).display === 'none' ? null : Math.round(c.getBoundingClientRect().right - i.getBoundingClientRect().right) })() })) }
		}
		const even = ws => Math.max(...ws) - Math.min(...ws) <= 1
		const wide = await cOf(480)
		ok(wide.got.texts[0] === '-0.0018' && wide.got.fit && even(wide.got.widths) && wide.got.pct === 4, `480 px: X at four decimals, every number in sight, the cells equal, the % at the opacity cell's right, 4 px in (${JSON.stringify(wide.got)})`)
		await wide.m.page.context().close()
		const slim = await cOf(240), C2 = slim.got.texts[0]
		ok(C2 === '-0.002' && slim.got.texts[1] === '0.321' && slim.got.fit && even(slim.got.widths) && slim.got.pct > 0 && slim.got.pct <= 4, `240 px: X at three decimals, every number in sight, none cut, the cells equal, the % kept at the right (${JSON.stringify(slim.got)})`)
		const sets = () => slim.m.page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'set').length), s0 = await sets()
		const cc = slim.m.ui.locator('#cells input').nth(0)
		await cc.fill(C2); await cc.press('Enter'); await slim.m.page.waitForTimeout(150)
		const s1 = await sets()
		await cc.focus(); await cc.press('ArrowUp'); await slim.m.page.waitForTimeout(150)
		const up = await held(slim.m.ui)
		ok(s1 === s0 && Math.abs(up[0] - (+C2 + 0.001)) < 1e-9, `…Enter on it as shown writes nothing; ↑ a thousandth from what it shows (${[s0, s1]}; ${C2} → ${up[0]})`)
		await slim.m.page.context().close()
	}
	{
		// the window never taller than the canvas it floats over, on screen: Figma moves a taller one up to hold its foot in
		// view, its head (the close) past the top, out of reach; the panel scrolls in what it has
		const { page, errors } = await open({ profile: 'SRGB', editorType: 'figma', nodes: [{ id: '15:1', name: 'A', type: 'RECTANGLE', fills: [solid(0.2, 0.5, 0.8)], strokes: [] }], selection: ['15:1'], viewport: { width: 800, height: 400 }, zoom: 1, stored: { width: 400 } })
		await page.waitForTimeout(200)
		const sizes = await page.evaluate(() => window.__log.resize.slice())
		ok(sizes.length && sizes.every(([w, h]) => h <= 352 && w <= 784) && sizes.at(-1)[0] === 400, `a canvas 400 px tall on screen: the window at most 352 px (its head and a margin kept), its width as stored (${JSON.stringify(sizes.slice(-3))})`)
		ok(!errors.length, `room page errors: ${errors.join(' | ')}`)
		await page.context().close()
	}
	{
		// the space menu scrolled under a resting pointer: rows passing under it compile nothing – each once compiled its
		// space there and then, and the scroll stalled for seconds (a software GL compiles in the page's own time)
		const { page, ui, errors } = await open({ profile: 'SRGB', editorType: 'figma', nodes: [{ id: '14:1', name: 'A', type: 'RECTANGLE', fills: [solid(0.2, 0.5, 0.8)], strokes: [] }], selection: ['14:1'] })
		const fr = page.frames().find(f => f !== page.mainFrame())
		await ui.locator('#spq').click(); await page.waitForTimeout(300)
		const lb = await ui.locator('#splist').boundingBox()
		await page.mouse.move(lb.x + lb.width / 2, lb.y + lb.height / 2)
		await fr.evaluate(() => { window.__gaps = []; let t = performance.now(); const f = n => { window.__gaps.push(n - t); t = n; if (!window.__stop) requestAnimationFrame(f) }; requestAnimationFrame(f) })
		for (let k = 0; k < 30; k++) { await page.mouse.wheel(0, 60); await page.waitForTimeout(40) }
		await page.waitForTimeout(400)
		const worst = await fr.evaluate(() => { window.__stop = true; return Math.round(Math.max(...window.__gaps.slice(1))) })
		ok(worst < 250, `the space menu scrolled under a resting pointer: no frame stalls (the longest ${worst} ms)`)
		// a row: the space's name and its shape's mark (a cube, a disc, a parted rhombus) – no id, no channels' count; the mark
		// the site's (core.js geoOf): a hue angle makes it polar, HWB too (whiteness and blackness, no lightness)
		const row = await ui.locator('#splist .spo[data-id="lab"]').evaluate(b => [b.querySelector('.nm')?.textContent, b.querySelector('.kind')?.innerText, !!b.querySelector('.kind svg'), b.innerText.includes('lab')])
		ok(row[0] === 'CIELAB' && row[1] === '' && row[2] && !row[3], `a space's row: its name and its shape's mark alone (${JSON.stringify(row)})`)
		const marks = await ui.locator('#splist .spo').evaluateAll(bs => Object.fromEntries(bs.map(b => [b.dataset.id, b.querySelector('.kind').innerHTML])))
		ok(marks.hwb === marks.hsl && marks.hwb === marks.oklch && marks.lab !== marks.hsl && marks.rgb !== marks.hsl && marks.rgb !== marks.lab, `the marks the site's: HWB's polar as HSL's and OKLCH's, CIELAB's opponent, sRGB's a cube (${['hwb', 'hsl', 'lab', 'rgb'].map(k => marks[k] === marks.hsl ? 'polar' : marks[k] === marks.lab ? 'opponent' : 'other').join()})`)
		// the field's chevron shuts the menu, and opens it again
		const cb = await ui.locator('#spbtn .chev').boundingBox()
		await page.mouse.click(cb.x + cb.width / 2, cb.y + cb.height / 2); await page.waitForTimeout(100)
		const shut = await fr.evaluate(() => document.getElementById('spmenu').hidden)
		await page.mouse.click(cb.x + cb.width / 2, cb.y + cb.height / 2); await page.waitForTimeout(100)
		const reopened = !(await fr.evaluate(() => document.getElementById('spmenu').hidden))
		ok(shut && reopened, `the field's chevron shuts the menu and opens it again (${[shut, reopened]})`)
		// as wide as the space's field, never narrower than the row's whole width at Figma's own 240 px
		for (const [w, want] of [[240, 'row'], [480, 'field']]) {
			const m = await open({ profile: 'SRGB', editorType: 'figma', nodes: [{ id: '14:2', name: 'B', type: 'RECTANGLE', fills: [solid(0.2, 0.5, 0.8)], strokes: [] }], selection: ['14:2'], stored: { width: w } })
			await m.ui.locator('#spq').focus(); await m.page.waitForTimeout(150)
			const got = await m.page.frames().find(f => f !== m.page.mainFrame()).evaluate(() => { const r = e => Math.round(e.getBoundingClientRect().width)
				return { menu: r(document.getElementById('spmenu')), field: r(document.getElementById('spbtn')), row: r(document.querySelector('.top')), marks: [...document.querySelectorAll('#splist .spo')].every(b => b.querySelector('.kind svg')), fams: document.querySelectorAll('#splist .fam').length } })
			ok(got.menu === got[want] && got.marks && !got.fams, `${w} px: the space menu as wide as the ${want}, every row its mark, no family beside a name (${JSON.stringify(got)})`)
			await m.page.context().close()
		}
		ok(!errors.length, `menu scroll page errors: ${errors.join(' | ')}`)
		await page.context().close()
	}
	{
		// the grip pressed while a menu is open – the space menu, its family list, the settings and their Quantize list: the
		// menu shuts and the same drag resizes the window (a press outside the space menu once did nothing else, so the
		// drag took a second press)
		const nodes = [{ id: '14:3', name: 'B', type: 'RECTANGLE', fills: [solid(0.2, 0.5, 0.8)], strokes: [] }]
		for (const how of ['space', 'family', 'settings', 'quantize']) {
			const { page, ui, errors } = await open({ profile: 'SRGB', editorType: 'figma', nodes, selection: ['14:3'] })
			if (how !== 'settings' && how !== 'quantize') { await ui.locator('#spq').click(); await page.waitForTimeout(150) }
			if (how === 'family') await ui.locator('#spgroup').click()
			if (how === 'settings' || how === 'quantize') { await ui.locator('#prmb').click(); await page.waitForTimeout(150) }
			if (how === 'quantize') await ui.locator('#quant').click()
			await page.waitForTimeout(200)
			const fr = page.frames().find(f => f !== page.mainFrame()), openNow = () => fr.evaluate(() => [!document.getElementById('spmenu').hidden && 'menu', document.getElementById('prm').matches(':popover-open') && 'prm', ...[...document.querySelectorAll('select')].map(x => x.matches(':open') && x.id)].filter(Boolean).join() || false)
			const was = await openNow(), n0 = await page.evaluate(() => window.__log.fromUI.length), gb = await ui.locator('#grip').boundingBox()
			const gx = gb.x + gb.width * 0.75, gy = gb.y + gb.height * 0.75   // in the corner's triangle
			// the press taken by the grip at once, the move resizing; one move only – a drag across this mock's frame as it
			// resizes loses the pointer (the resize's own check, below, drags it in short steps)
			await page.mouse.move(gx, gy); await page.mouse.down()
			const live = await ui.locator('#grip').evaluate(g => g.classList.contains('live'))
			await page.mouse.move(gx - 4, gy)
			await page.waitForFunction(n0 => window.__log.fromUI.slice(n0).some(m => m.type === 'resize' && m.width === 284), n0, { timeout: 3000 }).catch(() => {})
			await page.mouse.up(); await page.waitForTimeout(100)
			const widths = await page.evaluate(n0 => window.__log.fromUI.slice(n0).filter(m => m.type === 'resize' && m.width).map(m => m.width), n0), still = await openNow()
			ok(was && live && widths.includes(284) && !still, `the grip pressed with the ${how} menu open: the press the grip's, the drag resizing, the menu shut (${[was, live, still]}; ${widths})`)
			ok(!errors.length, `grip over ${how} page errors: ${errors.join(' | ')}`)
			await page.context().close()
		}
	}

	/* ---------- the swatches' grouping: one pass over a grid, as a search of every swatch in order would group them ---------- */
	{
		// 40 colors, each written four ways: itself again, a step well under the swatch's width (JND / 5 in ΔEOK), one near
		// it and one past it – some land in neighbouring grid cells; a translucent one apart. The reference groups them as
		// the rule says: each paint joins the first swatch (in order) of its opacity whose first color is under JND / 5 away
		const nodes = [], bump = (c, d) => c.map((v, k) => Math.min(1, Math.max(0, v + d * [1, -0.6, 0.4][k])))
		for (let k = 0; k < 40; k++) {
			const c = [(k * 37 % 100) / 100, (k * 53 % 100) / 100, (k * 71 % 100) / 100]
			for (const [j, d] of [[0, 0], [1, 0], [2, 0.0004], [3, 0.0016], [4, 0.004]]) nodes.push({ id: `12:${k}:${j}`, name: `C${k}.${j}`, type: 'RECTANGLE', fills: [solid(...bump(c, d), j === 4 && k % 5 === 0 ? { opacity: 0.5 } : {})], strokes: [] })
		}
		const { page, ui, errors } = await open({ profile: 'SRGB', editorType: 'figma', nodes, selection: [nodes[0].id], stored: { scope: 'page' } })
		await ui.locator('#paints .paint').nth(30).waitFor()
		const paints = (await page.evaluate(() => window.__log.toUI.filter(m => m.type === 'selection').at(-1).paints))
		const want = []
		for (const p of paints) {
			const L = DEST.rgb.toOklab([p.r, p.g, p.b]), g = want.find(g => Math.abs(g.op - p.opacity) <= 0.004 && deltaEOK(g.L, L) < JND / 5)
			const key = `${p.id}:${p.kind}:${p.index}:${p.stop}`
			if (g) g.keys.push(key); else want.push({ L, op: p.opacity, keys: [key] })
		}
		const got = await ui.locator('#paints .paint').evaluateAll(bs => bs.map(b => b.dataset.keys))
		ok(JSON.stringify(got) === JSON.stringify(want.map(g => g.keys.join(' '))), `${paints.length} paints in ${got.length} swatches, as a search of every swatch in order groups them (${want.length})`)
		ok(!errors.length, `grouping page errors: ${errors.join(' | ')}`)
		await page.context().close()
	}

	// A page's read runs on Figma's own thread, so it hands the thread back every few milliseconds (code.js SLICE) and a newer
	// read stops an older one; the panel hears a read began ('reading') and, once it has lasted a moment, turns a circle in
	// the plane's free corner (top right) – an empty panel says it in words – till the answer lands
	{
		const nodes = Array.from({ length: 400 }, (_, k) => ({ id: `13:${k}`, name: `R${k}`, type: 'RECTANGLE', fills: [solid((k % 10) / 10, (k % 7) / 7, (k % 3) / 3)] }))
		const { page, ui, errors } = await open({ profile: 'SRGB', editorType: 'figma', nodes, selection: [nodes[0].id], stored: { scope: 'page' } })
		const types = await page.evaluate(() => window.__log.toUI.map(m => m.type))
		ok(types.indexOf('reading') >= 0 && types.indexOf('reading') < types.indexOf('selection'), `a read says it began before it answers: ${types.slice(0, 4).join(', ')}`)
		// the host's clock run fast (5 ms a call): the walk must yield – a timer set as the read starts fires before it answers –
		// and a second read begun meanwhile is the only one that answers
		const sliced = await page.evaluate(async () => {
			const real = Date.now, log = window.__log, n0 = log.toUI.filter(m => m.type === 'selection').length
			let now = real(), tick = null
			Date.now = () => (now += 5)
			try {
				window.__select(['13:1']); window.__select(['13:2'])   // two reads, one after the other
				setTimeout(() => { tick = log.toUI.filter(m => m.type === 'selection').length })
				for (let k = 0; k < 400 && log.toUI.filter(m => m.type === 'selection').length === n0; k++) await new Promise(r => setTimeout(r, 5))
				await new Promise(r => setTimeout(r, 200))
				return { tick: tick - n0, answers: log.toUI.filter(m => m.type === 'selection').length - n0, current: log.toUI.filter(m => m.type === 'selection').at(-1).paints.find(p => p.current)?.id }
			} finally { Date.now = real }
		})
		ok(sliced.tick === 0, `the walk hands the thread back: a timer set as it starts runs before it answers (${sliced.tick} answers by then)`)
		ok(sliced.answers === 1 && sliced.current === '13:2', `a newer read stops the older one: ${sliced.answers} answer(s), current ${sliced.current}`)
		// the circle: hidden while nothing is read; a read that lasts shows it, turning, in the plane's top right corner, at the
		// letters' half strength; the answer hides it
		const fr = page.frames().find(f => f !== page.mainFrame())
		const busy = () => fr.evaluate(() => { const b = document.getElementById('busy'), r = b.getBoundingClientRect(), p = document.getElementById('plane').getBoundingClientRect(), cs = getComputedStyle(b), sp = getComputedStyle(b, '::before')
			return { hidden: b.hidden, opacity: +cs.opacity, spin: sp.animationName, right: Math.round(p.right - r.right), top: Math.round(r.top - p.top), w: Math.round(r.width) } })
		ok((await busy()).hidden, 'no read under way: no circle')
		const first = await fr.evaluate(() => new Promise(done => { window.postMessage({ pluginMessage: { type: 'reading' } }, '*'); setTimeout(() => { const b = document.getElementById('busy'); done({ hidden: b.hidden, opacity: +getComputedStyle(b).opacity }) }) }))
		ok(!first.hidden && first.opacity === 0, `a read just begun: the circle there, still clear (${JSON.stringify(first)})`)
		await fr.waitForFunction(() => { const b = document.getElementById('busy'); return !b.hidden && +getComputedStyle(b).opacity === 0.5 }, null, { timeout: 3000 }).catch(() => {})
		const on = await busy()
		ok(!on.hidden && on.opacity === 0.5 && on.spin === 'busy' && on.right >= 0 && on.right <= 6 && on.top >= 0 && on.top <= 6, `a read that lasts turns the circle in the plane's top right corner: ${JSON.stringify(on)}`)
		const last = await page.evaluate(() => window.__log.toUI.filter(m => m.type === 'selection').at(-1))
		await fr.evaluate(m => window.postMessage({ pluginMessage: m }, '*'), last)
		await fr.waitForFunction(() => document.getElementById('busy').hidden, null, { timeout: 3000 }).catch(() => {})
		ok((await busy()).hidden, 'the answer hides it')
		ok(!errors.length, `slicing page errors: ${errors.join(' | ')}`)
		await page.context().close()
	}
	// an empty panel (no layer selected) says a long read in words, where the plane isn't
	{
		const { page, ui, errors } = await open({ profile: 'SRGB', editorType: 'figma', nodes: [{ id: '14:1', name: 'A', type: 'RECTANGLE', fills: [solid(1, 0, 0)] }], selection: [] })
		const fr = page.frames().find(f => f !== page.mainFrame())
		// timed in the frame (a timer never fires early, so the wait is at least its own whatever the machine's load)
		const r = await fr.evaluate(() => new Promise(done => {
			const e = document.getElementById('empty'), hint = e.textContent, t0 = performance.now()
			window.postMessage({ pluginMessage: { type: 'reading' } }, '*')
			setTimeout(() => { const quick = e.textContent; const poll = () => e.textContent !== hint ? done({ hint, quick, slow: e.textContent, after: Math.round(performance.now() - t0) }) : performance.now() - t0 > 3000 ? done({ hint, quick, slow: e.textContent, after: -1 }) : setTimeout(poll, 10); poll() })
		}))
		ok(r.quick === r.hint && r.slow === 'Loading…' && r.after >= 240, `an empty panel: the hint through a quick read, then "${r.slow}" after ${r.after} ms`)
		ok(!errors.length, `empty reading page errors: ${errors.join(' | ')}`)
		await page.context().close()
	}

	/* ---------- 2. DISPLAY_P3 document ---------- */
	{
		const profile = 'DISPLAY_P3'
		const red = { id: '2:1', name: 'P3 red', type: 'RECTANGLE', fills: [solid(1, 0, 0)], strokes: [] }
		const { page, ui, errors } = await open({ profile, editorType: 'figma', nodes: [red], selection: ['2:1'], stored: { space: 'hct', width: 320 } })

		ok(await spaceOf(ui) === 'hct', 'stored space (hct) restored')
		ok(await page.evaluate(() => window.__log.resize.some(r => r[0] === 320)), 'the stored width (320) restored')
		await planePainted(page.frames().find(f => f !== page.mainFrame()))
		const lineP3 = await edgeOf(ui)
		ok(lineP3.white > 0, `a P3 file's plane draws sRGB's edge as a line (${lineP3.white} px)`)
		ok(/Display P3/.test(await ui.locator('#gamut').innerText()), 'the status names Display P3')
		ok(await ui.locator('#gamseg [aria-checked="true"]').getAttribute('data-g') === 'p3', 'a P3 file shows P3 by default')
		let rgb = [1, 0, 0]
		close(await shown(ui), valuesIn(profile, 'hct', rgb), halfStep('hct'), 'P3 read: hct values of P3 red')
		ok(await asFmt(ui, 'p3') === 'color(display-p3 1 0 0)', 'css color(display-p3)')
		const hexP3 = await asFmt(ui, 'hex')
		ok(hexP3 === '#' + gamutMap(space.p3.oklch(1, 0, 0), DEST.rgb).rgb.map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('') && /mapped into sRGB/.test(await ui.locator('#fmt option[value="hex"]').textContent()), `hex of P3 red: mapped into sRGB, its row saying so, the hex alone copied (${hexP3}; ${await ui.locator('#fmt option[value="hex"]').textContent()})`)
		await asFmt(ui, 'oklch')
		const [L, C, H] = space.p3.oklch(...rgb)
		ok(await asFmt(ui, 'oklch') === oklch3([L, C, H]), `P3 css oklch(): ${await asFmt(ui, 'oklch')}`)
		ok(await ui.locator('#notes').innerText() === '', 'no notes: P3 red is inside the document gamut')

		await pickSpace(ui, 'oklch')
		close(await shown(ui), valuesIn(profile, 'oklch', rgb), halfStep('oklch'), 'P3 read: oklch values')
		// the plane paints in the file's space: P3 red is 255,0,0 on a display-p3 canvas, not its sRGB clip
		const frame = page.frames().find(f => f !== page.mainFrame())
		await planePainted(frame)
		const px = await pixelUnderMarker(frame, -3), cw = await frame.evaluate(() => document.querySelector('#plane canvas').width)   // P3 red sits on the field's edge (past it, at this lightness and hue, no light exists: void), under P3's line: 3 px inside it
		ok(px.space === 'display-p3', `P3 file: the plane canvas is display-p3 (${px.space})`)
		const [Lr, Cr, Hr] = await held(ui), in3 = space.oklch.p3(Lr, Cr - 3 * 0.4 / cw, Hr).map(u => Math.round(u * 255))
		close(px.rgb.slice(0, 3), in3, 8, `P3 file: the pixel 3 px inside the marker (P3 red, on the field's edge) is that coordinate's P3 color, ${in3} (an sRGB clip of P3 red would read about 234, 51, 35)`)
		// a P3 file's plane holds P3's colors and voids the rest; sRGB's edge is a line over it, every line pixel within 2.5 px
		// of that edge, by the library's own conversion (L up, C across, at the held H): the line lies from half a pixel to a
		// pixel and a half past it, its antialiasing spreading that to two – at a slant and round the hue's sharp cusp too
		{
			const Hp = (await held(ui))[2], inP3 = (L, C) => space.oklch.p3(L, C, Hp).every(u => u >= 0 && u <= 1), inS = (L, C) => space.oklch.rgb(L, C, Hp).every(u => u >= 0 && u <= 255)
			const fld = await fieldOf(ui), wrong = cutAt(fld, (fx, fy) => inP3(fy, 0.4 * fx))
			ok(!wrong.length, `P3 file: the plane holds P3's colors and voids the rest (${wrong.length} of ${fld.px.length} sampled pixels wrong)`)
			const e = await edgeOf(ui), off = e.px.filter(([x, y]) => !nearEdge(x, y, e.w, (fx, fy) => inS(fy, 0.4 * fx), 2.5))
			ok(e.white > 0 && (e.dark ? e.darker <= e.lighter / 50 && e.lighter > 0 : e.lighter <= e.darker / 50 && e.darker > 0), `P3 file: the line in one ink over the field, as the image's dots – white over a dark field, black over a light one (field ${e.dark ? 'dark' : 'light'}; ${e.lighter} pixels lighter, ${e.darker} darker – a few at the void's edge read either way)`)
			ok(e.white > 0 && !off.length, `P3 file: the line is sRGB's edge (${e.px.length - off.length} of ${e.px.length} sampled line pixels on it; off: ${JSON.stringify(off.slice(0, 6))})`)
			// zoomed in, the line keeps its ink – read off the whole field only: the part in view (the light at the top) would
			// once turn it, and again at every pan
			const pl = ui.locator('#plane'), pb = await pl.boundingBox(), dark0 = await pl.evaluate(p => p._dark)
			await page.mouse.move(pb.x + pb.width * 0.08, pb.y + pb.height * 0.08)
			await page.keyboard.down('Control'); await page.mouse.wheel(0, -800); await page.keyboard.up('Control'); await page.waitForTimeout(300)
			const zoomed = await pl.evaluate(p => { const cv = p.querySelector('canvas:not(.density)'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let L = 0, n = 0; for (let i = 0; i < d.length; i += 64) if (d[i + 3] > 128) { L += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; n++ } return { dark: p._dark, viewDark: !n || L / n < 128, zoom: !p.querySelector('.zx').hidden } })
			ok(zoomed.zoom && zoomed.viewDark !== dark0 && zoomed.dark === dark0, `zoomed into the field's light corner: the lines keep the ink of the whole field (${JSON.stringify({ dark0, ...zoomed })})`)
			await page.keyboard.down('Control'); await page.mouse.wheel(0, 3000); await page.keyboard.up('Control'); await page.waitForTimeout(300)   // the whole again, nothing picked
		}

		// a color outside sRGB but inside P3 is written as is: the document gamut is P3
		let exp = expectWrite(profile, 'oklch', valuesIn(profile, 'oklch', rgb), 1, 0.27)
		ok(!exp.mapped, 'test premise: C 0.27 at P3 red\'s L and H is inside P3')
		ok(gamutMap([L, 0.27, H], DEST.rgb).mapped, 'test premise: the same color is outside sRGB')
		let set = await edit(page, ui, 1, 0.27)
		ok(set.profile === 'DISPLAY_P3', 'set carries the P3 profile')
		close(rgbOf({ color: set.color }), exp.rgb, 1e-12, 'P3 set color (unmapped)')
		close(rgbOf((await page.evaluate(() => window.__paints('2:1', 'fills')))[0]), exp.rgb, 1e-12, 'P3 fill written')
		ok(await ui.locator('#notes').innerText() === '', 'no gamut note for a P3-inside color')
		ok(Math.abs((await shown(ui))[1] - 0.27) < 5e-5, 'C reads back 0.27')
		rgb = exp.rgb

		// outside P3: mapped into P3
		exp = expectWrite(profile, 'oklch', exp.values, 1, 0.4)
		ok(exp.mapped, 'test premise: C 0.4 is outside P3')
		set = await edit(page, ui, 1, 0.4)
		close(rgbOf({ color: set.color }), exp.rgb, 1e-12, 'P3 gamut-mapped set color')
		ok(/^Outside Display P3/.test(await ui.locator('#gamut').innerText()), 'P3 out-of-gamut status')
		rgb = exp.rgb

		// stepped, the P3 file's plane draws no sRGB line: its cells are whole colors, in sRGB or out, and a line read off a
		// pixel's rate on their edges came out as broken white seams between cells
		await quant(ui, '10-step'); await page.waitForTimeout(150); await planePainted(frame)
		ok((await edgeOf(ui)).white === 0, `P3 file, stepped: no gamut line over the cells (${(await edgeOf(ui)).white} line pixels)`)
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
		await setCh(ui, 0, '0.5')
		await settle(page, n)
		await page.waitForTimeout(30)
		ok(JSON.stringify(await page.evaluate(() => window.__paints('2:1', 'fills'))) === JSON.stringify(before), 'stale-profile write refused')
		ok(/sRGB/.test(await ui.locator('#gamut').innerText()), 'UI follows the new profile')
		await page.waitForTimeout(100)
		ok((await edgeOf(ui)).white === 0, 'and in sRGB, no line: the field ends at the gamut')
		ok(!/Display P3/.test(await ui.locator('#gamut').innerText()), 'the status follows the new profile')

		if (process.env.FIGMA_SHOTS) await page.locator('iframe').screenshot({ path: `${process.env.FIGMA_SHOTS}/figma-p3.png` })
		// a field lying ON sRGB's surface (HSV and HSL at full saturation, HWB with no white) runs along the edge, never across it: no
		// line there – the rounding once laid one over the whole hue slider, as noise or as a veil, and ticks where a hue's
		// sector turns. Each slider pixel its own color, by the library's conversion (the slider's hue there, the held channels);
		// the hue then across the plane, the other channel at the surface: no line on it either (it once drew a lattice of them)
		{
			const surf = [], flat = []
			await quant(ui, 'smooth')   // the colors themselves, no lens's cells
			await openPrm(ui); await ui.locator('#gamseg [data-g="p3"]').click(); await closePrm(ui)   // P3 shown: sRGB's edge drawn over it
			for (const [id, i, v] of [['hsv', 1, 100], ['hsl', 1, 100], ['hwb', 1, 0]]) {
				await pickSpace(ui, id); await page.waitForTimeout(100)
				for (let k = 0; k < 6 && (await ui.locator('.bar2:not(.alpha)').first().getAttribute('data-i')) !== '0'; k++) await ui.locator(k % 2 ? '#axes .laby' : '#axes .labx').click()   // the hue on the slider
				await setCh(ui, i, String(v)); await page.waitForTimeout(300)
				const held0 = await held(ui), row = await ui.locator('.bar2:not(.alpha)').first().evaluate(b => { const cv = b.querySelector('canvas'); const x = cv.getContext('2d'); return { w: cv.width, cap: b._cap, p3: x.getContextAttributes().colorSpace === 'display-p3', d: [...x.getImageData(0, 0, cv.width, 1).data] } })
				const span = row.w - 2 * row.cap
				let worst = 0
				for (let x = row.cap + 1; x < row.cap + span - 1; x++) {   // every pixel of the sweep: a tick at a sector's turn too
					const c = held0.slice(); c[0] = 360 * (x - row.cap + 0.5) / span
					const want = row.p3 ? space[id].p3(...c).map(u => u * 255) : space[id].rgb(...c), got = row.d.slice(x * 4, x * 4 + 3)   // in the canvas's own space
					worst = Math.max(worst, ...want.map((u, k) => Math.abs(u - got[k])))
				}
				surf.push([id, Math.round(worst)])
				if (id === 'hwb') continue   // (its wheel's colors meet at the centre in a ridge of their own: no line to tell from it)
				await ui.locator('#axes .labx').click(); await page.waitForTimeout(100); await planePainted(page.frames().find(f => f !== page.mainFrame()))
				flat.push([id, await ui.locator('#axes .labx').getAttribute('data-tip'), (await edgeOf(ui)).white])
			}
			ok(surf.every(([, n]) => n <= 10), `P3 file: HSV and HSL at full saturation and HWB with no white – every hue slider pixel its own color, no edge line over it (${JSON.stringify(surf)}, the worst byte off)`)
			ok(flat.every(([, h, n]) => h === 'Hue' && n === 0), `P3 file: and the hue across the plane, saturation held at full – no line on it (${JSON.stringify(flat)}, line pixels)`)
		}
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
		ok(/Click for Hue/.test(await ui.locator('#axes .labx').getAttribute('aria-label')), 'the C letter says what a click brings: the hue')
		await ui.locator('#axes .labx').click()
		ok(await ui.locator('#axes .labx').innerText() === 'H' && await ui.locator('#axes .laby').innerText() === 'L', 'a click on C makes it H×L')
		await ui.locator('#axes .labx').click()
		ok(await ui.locator('#axes .labx').innerText() === 'C', 'and again, C×L')
		// the lens controls: clickable over their whole face, the chevron too; their width never moves
		await openPrm(ui)
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
		if (process.env.FIGMA_SHOTS) await page.locator('iframe').screenshot({ path: `${process.env.FIGMA_SHOTS}/figma-lens.png` })
		// Figma's menu rhythm and check, as measured on its own: 24 px rows, the check's left about 15.5 px in, text 17 px past it
		const rh = await ui.locator('#quant option').evaluateAll(os => { const r = os.map(o => o.getBoundingClientRect()); return [r[1].top - r[0].top, r[0].height] })
		ok(rh[0] === 24 && rh[1] === 24, `the menu's rows 24 px apart (${rh})`)
		const inset = await ui.locator('#quant').evaluate(q => [getComputedStyle(q, '::picker(select)').paddingTop, getComputedStyle(q, '::picker(select)').paddingBottom, getComputedStyle(q.options[0]).marginLeft, getComputedStyle(q.options[0]).marginRight])
		ok(new Set(inset).size === 1 && inset[0] === '8px', `the list's rows as far from its top and bottom as from its sides, 8 px: a lit row sits evenly in it (${inset})`)
		ok(await ui.locator('#quant option:checked').evaluate(o => getComputedStyle(o, '::checkmark').width) === '12px', 'the check in a 12 px box, its mark about Figma\'s 9 px')
		ok(await ui.locator('#quant legend').first().isHidden() && await ui.locator('#quant option[value="20"]').evaluate(o => o.querySelector('.nm').getBoundingClientRect().left - o.querySelector('.ico').getBoundingClientRect().right >= 3), 'the sections unlabelled, a hairline apart; each icon apart from its name')
		ok(await frame.evaluate(async () => { await document.fonts.load('11px Inter', 'Abc'); return document.fonts.check('11px Inter', 'Abc') }) && await ui.locator('#quant option').first().evaluate(o => getComputedStyle(o).fontSize) === '11px', 'the panel speaks Inter, Figma\'s face, bundled; its menus at Figma\'s 11 px')
		// a small dropdown's list is Figma's menu: dark, its row under the pointer on the menu's selection color
		ok(await ui.locator('#quant option[value="20"]').evaluate(o => getComputedStyle(o).backgroundColor) === 'rgb(13, 153, 255)' && await ui.locator('#quant').evaluate(q => getComputedStyle(q).getPropertyValue('--menu-bg').trim()) === '#1e1e1e', 'Figma\'s menu: its fill and its highlight, as measured')
		await page.waitForTimeout(500)
		ok(!(await tipText()), `no tooltip over the open list (${await tipText()})`)
		await page.keyboard.press('Escape')
		await closePrm(ui)
		// one menu at a time: the settings opened over the space menu close it, and the space menu closes the settings
		await ui.locator('#spbtn').click()
		await ui.locator('#prmb').click()
		ok(await ui.locator('#spmenu').isHidden() && await ui.locator('#prm').evaluate(e => e.matches(':popover-open')), 'opening the settings closes the space menu')
		await ui.locator('#spbtn').click()
		ok(await ui.locator('#spmenu').isVisible() && !(await ui.locator('#prm').evaluate(e => e.matches(':popover-open'))), 'opening the space menu closes the settings')
		await page.keyboard.press('Escape')
		// the size: the grip by the panel's corner drags its width (the height follows), saved; the resize cursor shows
		// throughout (a picker drag hides it); here narrower, as a drag out of this mock's frame loses the pointer
		ok(await ui.locator('.menu:not([hidden])').count() === 0 && !(await frame.evaluate(() => document.getElementById('quant').matches(':open'))), `no menu left open before the resize (${await ui.locator('.menu:not([hidden])').evaluateAll(es => es.map(e => e.id))})`)
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
		await frame.waitForFunction(() => innerWidth === 288, null, { timeout: 3000 }).catch(() => {})   // the frame at its new width before the grip is measured: a press must land in its corner
		const gr = await ui.locator('#grip').boundingBox()
		await page.mouse.move(gr.x + gr.width * 0.75, gr.y + gr.height * 0.75)
		await page.mouse.down()
		await page.mouse.move(gr.x + gr.width * 0.75 - 16, gr.y + gr.height * 0.75, { steps: 2 })
		await frame.evaluate(([x, y]) => dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, buttons: 0, clientX: x, clientY: y, bubbles: true })), [gr.x - 40, gr.y - 40])
		await page.waitForFunction(() => window.__stored('width') === 272, null, { timeout: 3000 }).catch(() => {})   // the save is a message: wait for it, as the checks above do
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

		// ⌘Z in the panel is Figma's undo (figma.triggerUndo): the last step goes – the fill and the values return to the
		// color before it. In a cell being typed in, ⌘Z is the text's own undo and Figma's history is left alone
		{
			const f0 = await fill(), un0 = await page.evaluate(() => window.__log.undone)
			await setCh(ui, 0, '0.3')
			await page.waitForTimeout(150)
			const f1 = await fill()
			await ui.locator('#plane').focus()
			await page.keyboard.press('ControlOrMeta+z')
			await page.waitForTimeout(150)
			close(await fill(), f0, 1e-9, `⌘Z: one undo, the fill back to the color before the edit (${f1.map(v => v.toFixed(3))} → ${(await fill()).map(v => v.toFixed(3))})`)
			ok(await page.evaluate(() => window.__log.undone) === un0 + 1, '⌘Z: Figma\'s undo, once')
			close(await held(ui), valuesIn(profile, 'oklch', f0), [1e-6, 1e-6, 1e-4], '⌘Z: the values are the undone-to color\'s, not the ones the panel wrote')
			const ups = await page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'undo').length)
			await ui.locator('#cells input').first().click(); await page.keyboard.type('9')
			await page.keyboard.press('ControlOrMeta+z')
			await page.waitForTimeout(100)
			ok(await page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'undo').length) === ups, '⌘Z in a cell being typed in: its text\'s undo, not Figma\'s')
			await page.keyboard.press('Escape'); await ui.locator('#plane').focus()
			await page.keyboard.press('ControlOrMeta+Shift+z')
			await ui.locator('#spq').focus(); await page.keyboard.press('ControlOrMeta+z'); await page.keyboard.press('Escape')
			await page.waitForTimeout(100)
			ok(await page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'undo').length) === ups && await page.evaluate(() => window.__log.undone) === un0 + 1, '⇧⌘Z (no redo in the API) and ⌘Z in the space search ask Figma for nothing')
			await page.keyboard.press('Escape'); await ui.locator('#plane').focus()
			await page.waitForTimeout(100)
			await setCh(ui, 2, String(shownDrag[2]))   // the drag's hue again, for the checks after
			await page.waitForTimeout(100)
		}

		// the status is one line in and out of the gamut, so a drag held at the field's edge, past it, moves nothing below; a
		// value typed past the gamut is said to be mapped in, and changes no height either
		const gh = () => ui.locator('#gamut').evaluate(g => [g.textContent, document.body.getBoundingClientRect().height])   // the status's text, the panel's height
		box = await ui.locator('#plane').boundingBox()
		const r0 = await page.evaluate(() => window.__log.resize.length)
		await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5)
		await page.mouse.down()
		const g1 = await gh()
		await page.mouse.move(box.x + box.width * 0.98, box.y + box.height * 0.5, { steps: 6 })
		const g2 = await gh()
		await page.mouse.up()
		await page.waitForTimeout(150)
		const Lc = (await held(ui))[0]
		await setCh(ui, 1, 0.37); await page.waitForTimeout(100)
		const g3 = await gh()
		ok(/^In sRGB\.$/.test(g1[0]) && /^In sRGB\.$/.test(g2[0]) && /^Outside sRGB/.test(g3[0]) && g1[1] === g2[1] && g2[1] === g3[1], `a drag past the field stays in sRGB; a value typed past it is mapped in; the panel keeps its height (${g1[1]} → ${g2[1]} → ${g3[1]} px)`)
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

		// a re-read that lands mid-drag (the selection set again, here – a drag's own writes no longer ask for one) never
		// moves the coordinates under the pointer
		await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.4)
		await page.mouse.down()
		await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.4, { steps: 2 })
		const reads = await selections(page)
		await page.mouse.move(box.x + box.width * 0.46, box.y + box.height * 0.4, { steps: 3 })
		await page.waitForTimeout(100)
		ok(await selections(page) === reads, `a drag's live writes are not answered with reads – the page's colors read and sent every frame made it lag (${await selections(page) - reads} reads)`)
		const mid = await held(ui), nre = await selections(page)
		await page.evaluate(() => window.__select(['4:1']))
		await settle(page, nre)
		await page.waitForTimeout(50)
		ok(JSON.stringify(await held(ui)) === JSON.stringify(mid), 'a re-read mid-drag leaves the coordinates where the pointer put them')
		const nrel = await selections(page)
		await page.mouse.up()
		await page.waitForTimeout(150)
		ok(await selections(page) > nrel, 'the release is answered with a read: the panel settles on the file as written')

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

		// the slider: the channel the plane doesn't hold (OKLCH's L×C plane: H), the pointer's place along the knob's travel
		// its value; past its end, the end
		ok(await ui.locator('#channels .bar2:not(.alpha)').count() === 1 && await ui.locator('#channels .bar2:not(.alpha)').getAttribute('data-i') === '2', 'one slider under the plane: the channel it holds (H)')
		ok(await ui.locator('#cells input').evaluateAll(xs => xs.every(x => x.scrollWidth <= x.clientWidth + 1)), `every number fits its cell (${await cellsText(ui)})`)
		ok(await ui.locator('#spq').evaluate(q => q.scrollWidth <= q.clientWidth + 1), 'the space\'s name fits its field')
		// (at a low chroma, every hue inside sRGB: the slider's whole travel is its field)
		await setCh(ui, 1, '0.05'); await page.waitForTimeout(100); await painted()
		const bar0 = await ui.locator('#channels .bar2').first().boundingBox(), kw = await ui.locator('#channels .nrg').first().evaluate(k => k.offsetWidth), hueBefore = (await held(ui))[2]
		u0 = await undos()
		await page.mouse.move(bar0.x + kw / 2 + (bar0.width - kw) * 0.25, bar0.y + bar0.height / 2)
		await page.mouse.down()
		ok(Math.abs((await held(ui))[2] - 90) < 1, `slider press at a quarter of the travel: H 90 (${(await held(ui))[2]})`)
		await page.mouse.move(bar0.x - 4, bar0.y + bar0.height / 2, { steps: 3 })
		await page.mouse.up()
		await page.waitForTimeout(150)
		ok((await held(ui))[2] === 0 && await undos() === u0 + 1, 'a drag past its start holds at 0, one undo step')
		await setCh(ui, 2, String(hueBefore)); await page.waitForTimeout(100)   // the hue as it was, for the checks after
		// the cells, Figma's: a number typed and Enter takes it, the number staying selected; ↑↓ step it by the power of ten
		// under a hundredth of its range (Shift: ten), each a write; a whole value pasted into a cell – a hex, the channels as
		// the copy list gives them, bare numbers with an opacity – is taken whole; too few numbers, or text, is no color
		{
			const cc = ui.locator('#cells input').nth(1)   // C's
			await cc.fill('0.07'); await cc.press('Enter'); await page.waitForTimeout(120)
			ok(Math.abs((await held(ui))[1] - 0.07) < 1e-9 && await cc.evaluate(x => x.selectionStart === 0 && x.selectionEnd === x.value.length), `C typed, Enter takes it, its number selected (${await cc.inputValue()})`)
			const u2 = await undos()
			await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowUp'); await page.keyboard.press('Shift+ArrowDown')
			await page.waitForTimeout(120)
			ok(Math.abs((await held(ui))[1] - 0.062) < 1e-9 && await undos() === u2 + 3, `↑↑ then ⇧↓ step chroma by 0.001 (the power of ten under a hundredth of its range), ten with Shift, a write each (${(await held(ui))[1]})`)
			await cc.fill('#336699'); await cc.press('Enter')
			await page.waitForTimeout(150)
			close((await fill()).map(v => Math.round(v * 255)), [0x33, 0x66, 0x99], 0, 'a #336699 pasted into a cell is taken as that color')
			const w0 = await writesOf()
			await cc.fill(await asFmt(ui, 'space')); await cc.press('Enter'); await page.waitForTimeout(80)
			ok((await writesOf()).length === w0.length, `the value as the copy list gives it, pasted back: nothing written (${await asFmt(ui, 'space')})`)
			await cc.fill('0.6 0.05 40 / 50%'); await cc.press('Enter'); await page.waitForTimeout(120)
			close(await held(ui), [0.6, 0.05, 40], 1e-9, 'bare numbers are the space\'s own channels')
			ok(await alphaOf(ui) === 0.5, 'an opacity in percent: 50% is 0.5')
			await cc.fill('oklch(0.6 0.05)'); await cc.press('Enter'); await page.waitForTimeout(80)
			ok(/Not a color: oklch\(0\.6 0\.05\)/.test(await notes(ui)) && Math.abs((await held(ui))[0] - 0.6) < 1e-9, 'too few numbers: no color, nothing changed')
			await setCh(ui, 'a', 100)
			await cc.fill('nonsense'); await cc.press('Enter'); await page.waitForTimeout(80)
			ok(/Not a color: nonsense/.test(await notes(ui)), 'text that is no color says so')
			await setCh(ui, 2, String(hueBefore))
		}
		// the knob sits on its own color: the slider's pixel under its knob's centre is the coordinate's color (one sRGB holds:
		// past it the slider is void)
		await setCh(ui, 0, '0.5')
		await setCh(ui, 1, '0.1')
		await page.waitForTimeout(150)
		await painted()
		const knobMid = await frame.evaluate(() => {
			const bar = document.querySelector('#channels .bar2:not(.alpha)'), cv = bar.querySelector('canvas'), k = bar.querySelector('.nrg').getBoundingClientRect(), r = cv.getBoundingClientRect()
			return [...cv.getContext('2d').getImageData(Math.min(cv.width - 1, Math.floor((k.left + k.width / 2 - r.left) / r.width * cv.width)), 0, 1, 1).data]
		})
		near8({ rgb: knobMid }, await own('oklch'), 4, 'the slider\'s pixel under its knob is the coordinate\'s color')

		// zero chroma keeps the hue: the UI's own coordinates outlive the achromatic paint
		await setCh(ui, 1, '0')
		await page.waitForTimeout(100)
		await setCh(ui, 1, '0.1')
		await page.waitForTimeout(100)
		ok(Math.abs((await held(ui))[2] - H0) < 1e-9, `hue survives zero chroma: ${(await held(ui))[2]}`)
		close(valuesIn(profile, 'oklch', await fill()).slice(1), [0.1, H0], [5e-4, 0.5], 'the fill carries that hue again')

		// steps: every pick lands on a cell centre, on the plane and on the bars (at a hue whose L 0.75 and 0.85 at C 0.14 are
		// both inside sRGB, the key's step stays in the field)
		await setCh(ui, 2, '126'); await page.waitForTimeout(100)
		await quant(ui, '10-step')
		await page.waitForFunction(() => window.__stored('quant') === 10)
		await painted()
		box = await ui.locator('#plane').boundingBox()
		// as a palette lens does: mid-drag the coordinates where the hand puts them and the color its cell's centre's; the
		// release lands them on that centre
		await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3); await page.mouse.down()
		await page.mouse.move(box.x + box.width * 0.33, box.y + box.height * 0.27, { steps: 2 }); await page.waitForTimeout(100)
		const midDrag = await shown(ui), midFill = valuesIn(profile, 'oklch', await fill())
		await page.mouse.up(); await page.waitForTimeout(150)
		ok(Math.abs(midDrag[0] - 0.73) < 2e-3 && Math.abs(midDrag[1] - 0.132) < 2e-3 && Math.abs(midFill[0] - 0.75) < 2e-3 && Math.abs(midFill[1] - 0.14) < 2e-3, `stepped, mid-drag: the coordinates as the hand puts them (${midDrag.slice(0, 2).map(x => x.toFixed(3))}), the color its cell centre's (${midFill.slice(0, 2).map(x => x.toFixed(3))})`)
		close((await shown(ui)).slice(0, 2), [0.75, 0.14], [5e-4, 5e-5], 'stepped plane pick, released: L and C on their cell centres (0.75, 0.14)')
		await ui.locator('#plane').focus()
		await page.keyboard.press('ArrowUp')
		await page.waitForTimeout(100)
		ok(Math.abs((await shown(ui))[0] - 0.85) < 5e-4, `stepped plane key: L to the next cell centre (${(await shown(ui))[0]})`)
		// a palette lens: the pick snaps to the nearest Tailwind token, and the field names it
		await quant(ui, 'Tailwind')
		await page.waitForFunction(() => window.__stored('quant') === 'tailwind')
		ok(await ui.locator('#gamut').innerText() === 'Snapped to Tailwind.', 'the status names the palette lens')
		await painted()
		box = await ui.locator('#plane').boundingBox()
		// under the lens the plane names the token under the pointer in a tooltip – what a press there takes, ⌥ held too;
		// ⌥'s readout keeps its own: the contrast
		const Hq = (await held(ui))[2], twOf = v => quantRGB(space.oklch.rgb(...v).map(u => Math.min(255, Math.max(0, Math.round(u)))), 'tailwind'), nameOfTw = rgb => PALETTES.tailwind.find(([, c]) => c.join() === rgb.join())?.[0]
		await page.mouse.move(box.x + box.width * 0.1 + 1, box.y + box.height * 0.4); await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.4); await page.waitForTimeout(700)   // C 0.04: inside the field at any hue; the tooltips' wait
		const twTip = await frame.evaluate(() => { const t = document.getElementById('tip'); return [t.classList.contains('on'), t.textContent] })
		await page.keyboard.down('Alt'); await page.mouse.move(box.x + box.width * 0.1 + 1, box.y + box.height * 0.4); await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.4); await page.waitForTimeout(700)
		const twRead = await ui.locator('.ruler .ro b').allInnerTexts().catch(() => []), twTipAlt = await frame.evaluate(() => { const t = document.getElementById('tip'); return t.classList.contains('on') ? t.textContent : '' })
		await page.keyboard.up('Alt'); await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.4)
		const twWant = nameOfTw(twOf([0.6, 0.4 * 0.1, Hq]))
		ok(twWant && twTip[0] && twTip[1] === twWant, `under a palette lens, the plane's tooltip names the token under the pointer, ${twWant} (${JSON.stringify(twTip)})`)
		ok(/^[\d.]+:1/.test(twRead[0]) && !twRead.includes(twWant) && twTipAlt === twWant, `…⌥'s readout its own – the contrast first, no token in it – and the tooltip naming the token while ⌥ weighs (${JSON.stringify([twRead, twTipAlt])})`)
		await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.4)
		await page.waitForTimeout(150)
		const tw = (await fill()).map(v => Math.round(v * 255)), token = PALETTES.tailwind.find(([, c]) => c.join() === tw.join())
		ok(!!token, `Tailwind pick is a Tailwind color (${tw})`)
		// the release lands mid-run, the site's palette snap: along C, then L, the middle of the stretch where the lens gives
		// the token picked – the coordinates under the color, not wherever in its cell the press fell
		{
			const N = 256, runMid = (v, i, [lo, hi]) => { const at = k => { const w = v.slice(); w[i] = lo + (hi - lo) * (k + 0.5) / N; return twOf(w).join() }, k0 = Math.min(N - 1, Math.floor((v[i] - lo) / (hi - lo) * N)), want = at(k0); let a = k0, b = k0; while (a > 0 && at(a - 1) === want) a--; while (b < N - 1 && at(b + 1) === want) b++; return lo + (hi - lo) * (a + b + 1) / 2 / N }
			const now = await held(ui), okc = classify('oklch').ch, midL = runMid(now, 0, [okc[0].min, okc[0].max])
			ok(twOf(now).join() === tw.join() && Math.abs(now[0] - midL) < 1e-9, `released under the lens: on the token picked, L the middle of its run (${now.map(x => +x.toFixed(4))}; L's run's middle ${midL.toFixed(4)})`)
		}
		ok(token && await ui.locator('#fmt option[value="name"]').textContent() === token[0], `the copy button's list offers the token's name first (${token && token[0]})`)
		await ui.locator('#fmt').selectOption('name')
		await page.waitForTimeout(100)
		ok(token && await page.evaluate(() => navigator.clipboard.readText()) === token[0], 'a pick of the name copies it')
		const px = await underMarker()
		close(px.rgb.slice(0, 3), tw, 0, 'the plane cell under the marker is that token')
		await quant(ui, 'smooth')
		ok(await ui.locator('#fmt option[value="name"]').count() === 0, 'smooth: no name in the list')

		// the lens lists, where the select is customizable (this Chromium): drawn by the page, each option's icon in the
		// icon font beside its name, the closed control showing the icon alone; a click on an option takes it
		const rich = await frame.evaluate(() => CSS.supports('appearance', 'base-select'))
		ok(rich, 'test premise: this Chromium has customizable selects')
		await openPrm(ui)
		await ui.locator('#quant').click()
		const lst = await frame.evaluate(() => {
			const s = document.getElementById('quant'), o = s.querySelector('option[value="web"]'), ico = o.querySelector('.ico')
			return { open: s.matches(':open'), font: getComputedStyle(ico).fontFamily, glyph: ico.textContent, w: ico.getBoundingClientRect().width, closedName: getComputedStyle(s.querySelector('selectedcontent .nm') || document.body).display }
		})
		ok(lst.open && /color-space icons/.test(lst.font) && lst.glyph.length > 0 && lst.w > 0, `the open list shows the web-safe icon in the icon font (${JSON.stringify(lst)})`)
		ok(lst.closedName !== 'none', `the closed control shows its icon and its name, as Figma's Style row (${lst.closedName})`)
		await ui.locator('#quant option[value="web"]').click()
		await page.waitForFunction(() => window.__stored('quant') === 'web')
		ok(await ui.locator('#quant').inputValue() === 'web' && !(await frame.evaluate(() => document.getElementById('quant').matches(':open'))), 'a click on an option takes it and closes the list')
		await closePrm(ui)
		await quant(ui, 'smooth')
		await page.waitForFunction(() => window.__stored('quant') === 0)
		await painted()

		// the fields paint the colors the file can hold, nothing past them – no pixel ghosted: opaque inside sRGB, void past
		// it, by the library's own conversion (L up, C across, at the held H) – and draw no line: the field's end is the edge
		const alphas = await frame.evaluate(() => { const cv = document.querySelector('#plane canvas'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let half = 0, n = 0; for (let i = 3; i < d.length; i += 4) { n++; if (d[i] > 0 && d[i] < 255) half++ } return { half, n } })
		ok(alphas.half === 0, `the plane ghosts nothing (${alphas.half} of ${alphas.n} pixels translucent)`)
		// (inside: within half a code value of the box, the kernel's own pad – gl.js, its encoded ±0.002)
		const H = (await held(ui))[2], inRgb = (L, C) => space.oklch.rgb(L, C, H).every(u => u >= -0.51 && u <= 255.51)
		// (below L 0.1 every edge converges on black, where the kernel's locus test of a near-zero tristimulus voids first:
		// not judged there)
		const fld = await fieldOf(ui), wrong = cutAt(fld, (fx, fy) => inRgb(fy, 0.4 * fx)).filter(([, y]) => 1 - (y + 0.5) / fld.w >= 0.1)
		ok(fld.px.some(p => p[2] === 255) && fld.px.some(p => p[2] === 0) && !wrong.length, `the plane holds sRGB's colors and voids the rest (H ${H}; ${wrong.length} of ${fld.px.length} sampled pixels wrong: ${JSON.stringify(wrong.slice(0, 6))})`)
		ok((await edgeOf(ui)).white === 0, 'an sRGB file draws no line: the field ends at its gamut')
		// picks are held to the field: a press past it (the plane's bottom-right corner, void at this hue) takes the field's
		// nearest pixel, a color inside sRGB; a key that would step out of it doesn't; a slider press past its field takes
		// the slider's nearest painted hue
		{
			const pb = await ui.locator('#plane').boundingBox()
			await page.mouse.click(pb.x + pb.width - 2, pb.y + pb.height - 2)
			await page.waitForTimeout(150)
			const [Lp, Cp, Hp] = await held(ui), inS = (L, C, H) => space.oklch.rgb(L, C, H).every(u => u >= -0.6 && u <= 255.6)
			ok(inS(Lp, Cp, Hp) && (await pixelUnderMarker(frame)).rgb[3] === 255, `a press past the field picks inside it (L ${Lp.toFixed(3)} C ${Cp.toFixed(3)}), the marker on the field`)
			await ui.locator('#plane').focus()
			for (let k = 0; k < 6; k++) await page.keyboard.press('ArrowRight')
			await page.waitForTimeout(100)
			ok(inS(...await held(ui)), 'keys stepping out of the field stop at it')
			const bh = await ui.locator('#bars .bar2:not(.alpha)').boundingBox(), kn = await ui.locator('#bars .nrg').first().evaluate(k => k.offsetWidth)
			const hues = []
			for (const f of [0.15, 0.5, 0.85]) { await page.mouse.click(bh.x + kn / 2 + (bh.width - kn) * f, bh.y + bh.height / 2); await page.waitForTimeout(80); hues.push(await held(ui)) }
			ok(hues.every(v => inS(...v)), `slider presses past its field take its nearest painted hue (${hues.map(v => v[2].toFixed(0))})`)
		}
		// the gamut the fields show, in the settings: sRGB's in an sRGB file; Rec.2020 chosen, the plane holds Rec.2020's
		// colors with sRGB's and P3's edges as lines, kept for the profile; sRGB again
		{
			await openPrm(ui)
			ok(await ui.locator('#gamseg [aria-checked="true"]').getAttribute('data-g') === 'srgb', 'an sRGB file shows sRGB by default')
			await ui.locator('#gamseg [data-g="rec2020"]').click()
			await page.waitForFunction(() => window.__stored('gamuts')?.SRGB === 'rec2020')
			await closePrm(ui)
			await painted()
			const H2 = (await held(ui))[2], inR = (L, C) => space.oklch.rec2020(L, C, H2).every(u => u >= -0.002 && u <= 1.002), inS2 = (L, C) => space.oklch.rgb(L, C, H2).every(u => u >= 0 && u <= 255), inP = (L, C) => space.oklch.p3(L, C, H2).every(u => u >= 0 && u <= 1)
			const f2 = await fieldOf(ui), wrong2 = cutAt(f2, (fx, fy) => inR(fy, 0.4 * fx)).filter(([, y]) => 1 - (y + 0.5) / f2.w >= 0.15)   // (Rec.2020's primaries lie on the spectral locus: near black its edge and the kernel's sampled locus meet, and the locus decides)
			ok(!wrong2.length, `Rec.2020 shown: the plane holds its colors (${wrong2.length} of ${f2.px.length} sampled pixels wrong, above L 0.15)`)
			const e2 = await edgeOf(ui), onEdge = (x, y, inside) => nearEdge(x, y, e2.w, (fx, fy) => inside(fy, 0.4 * fx), 2.5)
			const both = e2.px.filter(([x, y]) => onEdge(x, y, inS2)).length, onP3 = e2.px.filter(([x, y]) => onEdge(x, y, inP)).length, off2 = e2.px.filter(([x, y]) => !onEdge(x, y, inS2) && !onEdge(x, y, inP))
			ok(both > 0 && onP3 > 0 && !off2.length, `and two lines: sRGB's (${both} px) and P3's (${onP3}), nothing else (${off2.length} off)`)
			await openPrm(ui); await ui.locator('#gamseg [data-g="srgb"]').click(); await closePrm(ui)
			await page.waitForFunction(() => window.__stored('gamuts')?.SRGB === 'srgb')
			await painted()
			ok((await edgeOf(ui)).white === 0, 'sRGB again: no line')
		}
		// the hue's slider alike: each column opaque exactly where its hue is inside sRGB, away from the edge (1°)
		const [L0, C0] = await held(ui), inH = h => space.oklch.rgb(L0, C0, h).every(u => u >= 0 && u <= 255)
		const cols = await ui.locator('#bars .bar2:not(.alpha)').evaluate(bar => {
			const cv = bar.querySelector('canvas'), w = cv.width, css = cv.clientWidth, cap = Math.round(bar.querySelector('.nrg').offsetWidth / 2 / css * w), d = cv.getContext('2d').getImageData(0, 0, w, 1).data, out = []
			for (let x = cap; x < w - cap; x += 3) out.push([(x + 0.5 - cap) / (w - 2 * cap), d[x * 4 + 3]])
			return out
		})
		const offH = cols.filter(([f, a]) => inH(f * 360 - 1) === inH(f * 360 + 1) && (a === 255) !== inH(f * 360))
		ok(cols.some(c => c[1] === 0) && !offH.length, `the hue's slider holds sRGB's hues and voids the rest (${offH.length} of ${cols.length} columns wrong)`)

		// the wheel: hue around, chroma out; the marker sits on the fill's own pixel
		await ui.locator('#axes .laby').click()   // L swapped for the hue held: H around, C out
		await page.waitForFunction(() => window.__stored('pairs')?.oklch === 2)
		await painted()
		ok(await ui.locator('#plane').evaluate(e => e.classList.contains('polar')), 'H×C paints as a disc')
		// a press in the wheel's corner, outside the disc: the field's nearest pixel, on the disc
		{
			const wb = await ui.locator('#plane').boundingBox()
			await page.mouse.click(wb.x + wb.width - 3, wb.y + 3)   // the top right: the one corner no letter or switch holds
			await page.waitForTimeout(150)
			ok((await pixelUnderMarker(frame)).rgb[3] === 255, 'a press past the wheel picks on its field')
		}
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
		await page.waitForTimeout(200)
		const sqInk = await inks()
		ok(sqInk === 'rgb(255, 255, 255),rgb(255, 255, 255),rgb(255, 255, 255)', `on a square plane the letters and the switch stand over the field: white, as every mark over it (${sqInk})`)
		await ui.locator('#axes .pmode').click()
		await page.waitForFunction(() => window.__stored('disc')?.['oklch:2,1'] === true)
		ok(await ui.locator('#plane').evaluate(e => e.classList.contains('polar')), 'and back as a wheel')
		// a hue with the tone is a wheel too, as on the site: H×L a square by default (L up), the switch there to make it a
		// disc (black at its centre), saved for that pair
		{
			const pairs1 = await page.evaluate(() => window.__stored('pairs')?.oklch)
			await ui.locator('#axes .laby').click()   // C swapped for L: H around/across, L
			await page.waitForFunction(p => window.__stored('pairs')?.oklch !== p, pairs1)
			const lab = await ui.locator('#axes').evaluate(a => [a.querySelector('.labx').textContent, a.querySelector('.laby').textContent])
			ok(lab.join() === 'H,L' && await ui.locator('#axes .pmode').isVisible() && await ui.locator('#axes .pmode').getAttribute('data-tip') === 'Wheel' && !(await ui.locator('#plane').evaluate(e => e.classList.contains('polar'))), `H×L: a square by default, the wheel switch offered, its tooltip "Wheel" (${lab})`)
			await ui.locator('#axes .pmode').click()
			await page.waitForFunction(() => window.__stored('disc')?.['oklch:2,0'] === true)
			await painted()
			ok(await ui.locator('#plane').evaluate(e => e.classList.contains('polar')), 'switched: H×L as a disc')
			await ui.locator('#axes .pmode').click()
			await page.waitForFunction(() => window.__stored('disc')?.['oklch:2,0'] === false)
			await ui.locator('#axes .laby').click()   // back to H×C
			await page.waitForFunction(p => window.__stored('pairs')?.oklch === p, pairs1)
			await painted()
		}
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
		ok(await ui.locator('#drop').isVisible() && /eyedropper isn't available/.test(await notes(ui)), 'eyedropper refused: the button stays in its place, a note says why')
		// no EyeDropper at all (Figma in Firefox or Safari): no eyedropper shown, the sliders the panel's full width
		await frame.evaluate(() => { delete window.EyeDropper })
		const nd = await selections(page)
		await page.evaluate(() => window.__select(figma.currentPage.selection.map(n => n.id)))
		await settle(page, nd)
		await page.waitForTimeout(60)
		const wide = await frame.evaluate(() => { const ch = document.getElementById('channels').getBoundingClientRect(), b = document.querySelector('.bar2').getBoundingClientRect(); return [document.getElementById('drop').hidden, Math.round(b.left - ch.left), Math.round(ch.right - b.right)] })
		ok(JSON.stringify(wide) === '[true,0,0]', `no EyeDropper at all: no eyedropper shown, the sliders the panel's full width (${wide})`)

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
		await setCh(ui, 2, '264')   // a blue hue: every pick below inside sRGB
		await page.waitForTimeout(100)
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
		// zoomed in, its scrollbars: along the bottom the window's span of C, along the right its span of L, as Figma's canvas shows its own
		const bars = await frame.evaluate(() => { const p = document.getElementById('plane').getBoundingClientRect(), [x, y] = [...document.querySelectorAll('#plane .zoom')].map(e => [e.hidden, e.getBoundingClientRect()])
			return [x[0], y[0], (x[1].left - p.left) / p.width, x[1].width / p.width, (p.bottom - y[1].bottom) / p.height, y[1].height / p.height].map(v => typeof v === 'number' ? +v.toFixed(3) : v) })
		ok(!bars[0] && !bars[1] && Math.abs(bars[2] - (0.25 - 0.25 * k)) < 0.01 && Math.abs(bars[3] - k) < 0.01 && Math.abs(bars[4] - (0.25 - 0.25 * k)) < 0.01 && Math.abs(bars[5] - k) < 0.01, `zoomed in: its scrollbars show the window in the whole (${bars}; want ${(0.25 - 0.25 * k).toFixed(3)}, ${k.toFixed(3)})`)
		// zoomed into a corner away from the color: no marker pinned to the edge
		await page.mouse.move(pz.x + pz.width * 0.95, pz.y + pz.height * 0.05)
		await page.keyboard.down('Control'); await page.mouse.wheel(0, -600); await page.keyboard.up('Control'); await page.waitForTimeout(200)
		ok(await ui.locator('#plane .cx').isHidden(), 'zoomed away from the color: the marker hides')
		await page.mouse.dblclick(...pmid); await page.waitForTimeout(200)
		close((await clickMid()).slice(0, 2), [0.5, 0.2], [1e-3, 1e-3], 'a double click shows the whole again')
		ok(await frame.evaluate(() => [...document.querySelectorAll('#plane .zoom')].every(e => e.hidden)), 'whole again: no scrollbars')
		// ⇧ held through a drag holds it to one channel: the one moved farther moves, the other stays where the press put it
		await page.mouse.move(pmid[0] - 40, pmid[1]); await page.mouse.down(); await page.waitForTimeout(50)
		const at0 = await held(ui)
		await page.keyboard.down('Shift'); await page.mouse.move(pmid[0] + 30, pmid[1] - 12, { steps: 6 }); await page.waitForTimeout(80)
		const along = await held(ui)
		await page.mouse.move(pmid[0] - 30, pmid[1] - 60, { steps: 6 }); await page.waitForTimeout(80)
		const up = await held(ui)
		await page.mouse.up(); await page.keyboard.up('Shift'); await page.waitForTimeout(150)
		ok(along[0] === at0[0] && along[1] > at0[1] && up[1] === at0[1] && up[0] > at0[0], `⇧-drag: across, L held; then farther up, C held (${[at0, along, up].map(v => v.slice(0, 2).map(x => +x.toFixed(4)).join('/'))})`)
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
		const docH = await frame.evaluate(() => { const pad = parseFloat(getComputedStyle(document.body).paddingBottom) || 0
			return Math.ceil(Math.max(...[...document.body.children].filter(e => e.offsetParent !== null && !e.matches('[popover]')).map(e => e.getBoundingClientRect().bottom + Math.max(0, pad + Math.min(0, parseFloat(getComputedStyle(e).marginBottom) || 0))))) })   // a part running into the padding (the palette, to the window's edge) takes it back
		ok(sizes.length && sizes.at(-1)[0] === 288 && Math.abs(sizes.at(-1)[1] - docH) <= 1, `resize to content: ${JSON.stringify(sizes.at(-1))} vs ${docH}`)

		if (process.env.FIGMA_SHOTS) await page.locator('iframe').screenshot({ path: `${process.env.FIGMA_SHOTS}/figma-picker.png` })
		// a four-channel space: the plane holds two, the other two are sliders
		await pickSpace(ui, 'cmyk')
		ok(await ui.locator('#channels .bar2:not(.alpha)').count() === 2 && (await held(ui)).length === 4, 'CMYK: two sliders under its plane, four values')
		ok(!errors.length, `picker page errors: ${errors.join(' | ')}`)
		await page.context().close()
	}

	{
		// a swatch on many layers dragged. Figma may take longer to apply a write than a frame lasts, and the plugin runs on its
		// thread – a backlog there held Figma's own picker back too: the writes go one at a time, a waiting live one giving
		// way to the next (twelve sent at once: the first and the release written, the eleven between never), the release
		// always. A live write paints the layers on screen – the one at x 5000, past the 1000 × 800 view, at the drag's rest
		// (300 ms) or its release; three layers on one variable set it once a write; the relaunch button set at the release
		// alone. And Figma's own picker dragged over them – a nodechange a frame – is followed a read at a time
		const box = k => ({ x: k * 120, y: 0, width: 100, height: 100 }), bind = { boundVariables: { color: { type: 'VARIABLE_ALIAS', id: 'V:9' } } }
		const nodes = [...[0, 1, 2, 41].map(k => ({ id: `21:${k}`, name: `Raw ${k}`, type: 'RECTANGLE', fills: [solid(1, 0.5, 0)], strokes: [], box: box(k) })),
			...[3, 4, 5].map(k => ({ id: `21:${k}`, name: `Token ${k}`, type: 'RECTANGLE', fills: [solid(1, 0.5, 0, bind)], strokes: [], box: box(k), modes: { C: 'm' } }))]
		const variables = { 'V:9': { name: 'Orange', collection: 'C', values: { m: { r: 1, g: 0.5, b: 0, a: 1 } } } }
		const { page, errors } = await open({ profile: 'SRGB', editorType: 'figma', nodes, variables, selection: nodes.map(n => n.id) })
		const targets = nodes.map(n => ({ id: n.id, kind: 'fills', index: 0, stop: -1 })), off = '21:41'
		const send = msgs => page.evaluate(ms => ms.forEach(m => figma.ui.onmessage(m)), msgs)
		const set = (k, r, commit = false) => ({ type: 'set', ...targets[0], targets, profile: 'SRGB', color: { r, g: 0.5, b: 0 }, opacity: 1, commit, seq: 100 + k })
		const log = () => page.evaluate(() => ({ writes: window.__log.writes.map(w => [w.id, w.paints[0].color.r]), vars: window.__log.varWrites.length, relaunch: window.__log.relaunch.length, undo: window.__log.undo }))
		const l0 = await log()
		await send([...[...Array(12)].map((_, k) => set(k, k / 20)), set(12, 0.9, true)])
		await page.waitForFunction(n => window.__log.undo > n, l0.undo, { timeout: 3000 }).catch(() => {})
		const l1 = await log(), w1 = l1.writes.slice(l0.writes.length), on0 = w1.filter(w => w[0] === '21:0').map(w => w[1]), off1 = w1.filter(w => w[0] === off).map(w => w[1])
		ok(JSON.stringify(on0) === '[0,0.9]' && JSON.stringify(off1) === '[0.9]', `twelve live writes and a release sent at once: on screen the first and the release, off screen the release alone (${JSON.stringify({ on0, off1 })})`)
		ok(l1.vars - l0.vars === 2 && l1.relaunch - l0.relaunch === nodes.length, `three layers on one variable: one set a write (${l1.vars - l0.vars}); the relaunch button at the release, once a layer (${l1.relaunch - l0.relaunch})`)
		const paintsNow = await page.evaluate(ids => ids.map(id => window.__paints(id, 'fills')[0].color.r), nodes.filter(n => !n.fills[0].boundVariables).map(n => n.id))
		ok(paintsNow.every(r => r === 0.9) && (await page.evaluate(() => window.__var('V:9').m.r)) === 0.9, `every layer and the variable at the release's color (${paintsNow})`)
		// one live write, then rest: the layer off screen follows after 300 ms, not before
		await page.waitForTimeout(400)
		const l2 = await log()
		await send([set(13, 0.3)])
		await page.waitForTimeout(150)
		const early = (await log()).writes.slice(l2.writes.length).filter(w => w[0] === off).length
		await page.waitForTimeout(400)
		const rested = (await log()).writes.slice(l2.writes.length).filter(w => w[0] === off).map(w => w[1])
		ok(early === 0 && JSON.stringify(rested) === '[0.3]', `a drag resting: the layer off screen written after 300 ms, not at once (${[early, JSON.stringify(rested)]})`)
		await send([set(14, 0.3, true)]); await page.waitForTimeout(400)
		// Figma's picker dragged: twenty paint changes at once, read at once and once more after – the last change in it
		const r0 = await selections(page)
		await page.evaluate(() => { for (let k = 1; k <= 20; k++) window.__edit('21:0', 'fills', [{ type: 'SOLID', visible: true, opacity: 1, blendMode: 'NORMAL', color: { r: k / 20, g: 0.5, b: 0 } }]) })
		await page.waitForTimeout(600)
		const reads = (await page.evaluate(() => window.__log.toUI.filter(m => m.type === 'selection'))).slice(r0)
		ok(reads.length >= 1 && reads.length <= 3 && reads.at(-1).paints.find(p => p.id === '21:0').r === 1, `Figma's picker dragged (twenty changes): ${reads.length} reads, the last with the last change`)
		ok(!errors.length, `write pacing page errors: ${errors.join(' | ')}`)
		await page.context().close()
	}

	{
		// a field right at the middle of light and dark: its lines are drawn in the ink read off it, and they move its mean a
		// little – the ink once flipped at every paint and the plane repainted without end (a P3 file's blue made a green, H
		// 160 typed, Rec.2020 shown): the plane paints and stays painted
		const { page, ui, errors } = await open({ profile: 'DISPLAY_P3', editorType: 'figma', nodes: [{ id: '22:1', name: 'A', type: 'RECTANGLE', fills: [solid(0.2, 0.5, 0.8)], strokes: [] }], selection: ['22:1'], stored: { space: 'oklch' } })
		const fr = page.frames().find(f => f !== page.mainFrame()), state = () => fr.evaluate(() => { const c = document.querySelector('#plane canvas'); return [c._key, c._paints] })
		const h = ui.locator('#cells input').nth(2); await h.click(); await h.fill('160'); await h.press('Enter'); await page.waitForTimeout(300)
		await ui.locator('#prmb').click(); await ui.locator('#gamseg [data-g="rec2020"]').click(); await page.keyboard.press('Escape')
		await page.waitForTimeout(500)
		const [k1, n1] = await state(); await page.waitForTimeout(1000); const [k2, n2] = await state()
		ok(k1 && k2 && n2 - n1 <= 1, `a field at the middle of light and dark: painted once and kept, no repaint loop (${n2 - n1} repaints in a second; key ${!!k2})`)
		ok(!errors.length, `ink loop page errors: ${errors.join(' | ')}`)
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
		ok(/ \/ 0\.5\)$/.test(await asFmt(ui, 'oklch')), 'the stop\'s alpha appears in the CSS')
		const exp = expectWrite(profile, 'oklch', valuesIn(profile, 'oklch', [0, 0, 1]), 0, 0.5)
		const set = await edit(page, ui, 0, 0.5)
		ok(set.stop === 1, 'set targets stop 2')
		const g = (await page.evaluate(() => window.__paints('5:1', 'fills')))[0]
		close(rgbOf(g.gradientStops[1]), exp.rgb, 1e-12, 'stop 2 written')
		ok(g.gradientStops[1].color.a === 0.5 && g.gradientStops[1].position === 1, 'stop 2 keeps its alpha and position')
		ok(JSON.stringify(g.gradientStops[0]) === JSON.stringify(stops[0]) && g.type === 'GRADIENT_LINEAR', 'stop 1 and the gradient untouched')
		ok(await page.evaluate(() => window.__log.relaunch.some(r => r.id === '5:1' && r.d.open)), 'an edited layer gets the relaunch button')
		ok(await frame.evaluate(() => !!document.querySelector('#picker ~ #notes')), 'the notes sit under the picker')

		// the other colors: the selection's own (the gradient's other stop) – nothing else in the file, its variables and
		// styles included – as faint dots; the gradient's stops joined by a line through the knob; a dot names where its color lives
		await ui.locator('#marks .dm').first().waitFor()
		const marks = await ui.locator('#marks .dm').evaluateAll(els => els.map(e => [e.getAttribute('aria-label'), e.style.background]))
		ok(marks.some(([l, bg]) => l === 'Edit Sky, fill 1, stop 1' && /srgb 1 0 0\)/.test(bg)), `the selection's other stop: a dot in its color, its label naming its layer and place (${JSON.stringify(marks)})`)
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
		const dotsNow = await ui.locator('#marks .dm').evaluateAll(els => els.map(e => [e.getAttribute('aria-label'), (e.style.background.match(/-?[\d.]+(e-?\d+)?/g) || []).map(Number)]))
		ok(dotsNow.some(([l, c]) => l === 'Edit Sky, fill 1, stop 2' && [written.r, written.g, written.b].every((v, k) => Math.abs(v - c[k]) < 1e-4)), `the color just written is a dot on the next paint's plane, in that color (${JSON.stringify(dotsNow)})`)
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
		ok(await ui.locator('.paint', { hasText: 'Inner' }).locator('.sw').evaluate(e => e.style.getPropertyValue('--sw').includes(' 0 1 0')), 'a change two levels inside the group re-reads it')

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
		// the slider carries the image's histogram of its channel, over its own field
		await frame.waitForFunction(() => [...document.querySelectorAll('#channels .bar2:not(.alpha) .hist')].some(h => !h.hidden), null, { timeout: 10000 }).catch(() => {})
		const lanes = await frame.evaluate(() => [...document.querySelectorAll('#channels .bar2:not(.alpha)')].map(b => { const h = b.querySelector('.hist'); return [!!h && !h.hidden && /^url\(/.test(h.style.maskImage || h.style.webkitMaskImage) && getComputedStyle(h).backgroundColor === 'rgb(255, 255, 255)' && getComputedStyle(h).filter === 'none', !b.querySelector('canvas').hidden || /gradient/.test(b.style.background)] }))
		ok(lanes.length === 1 && lanes.every(([h, field]) => h && field), `an image's histogram on the slider, keeping its field: ${JSON.stringify(lanes)}`)
		await planePainted(frame)
		const dots = await frame.evaluate(() => { const cv = document.querySelector('#plane .density'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let any = false; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 0) { any = true; if (d[i] !== 255 || d[i + 1] !== 255 || d[i + 2] !== 255) return 'not white' } return any })
		ok(dots === true, `the image's pixels are dots on the plane, white – as every mark over a field (${dots})`)
		ok(/Dots are image pixels\. Select a fill or stroke to edit a color\./.test(await notes(ui)), `image-only notes: ${await notes(ui)}`)
		ok(await ui.locator('.paint').first().getAttribute('aria-pressed') === 'true', 'the image\'s row is the current row, shaded like any other')
		const sets0 = (await page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'set'))).length
		const pb = await ui.locator('#plane').boundingBox()
		await page.mouse.click(pb.x + pb.width * 0.5, pb.y + pb.height * 0.5)
		await page.waitForTimeout(100)
		ok((await page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'set'))).length === sets0, 'the image\'s color explores without writing')
		// a drag snaps to an image pixel's dot within 3 px as to another color's: its two channels, the held one kept
		const px = await frame.evaluate(() => { const s = document.querySelector('#plane .density')._snap; return s && [...s.k].map((k, j) => ({ x: s.xy[2 * j], y: s.xy[2 * j + 1], v: [...s.c.v.slice(k * s.c.dim, (k + 1) * s.c.dim)] })) })
		const [rL, rC] = space.rgb.oklch(...red), rd = px && px.find(d => Math.abs(d.v[0] - rL) < 1e-5 && Math.abs(d.v[1] - rC) < 1e-5)
		const near = d => [pb.x + pb.width * rd.x + d, pb.y + pb.height * rd.y]
		await page.mouse.move(pb.x + pb.width * 0.5, pb.y + pb.height * 0.5); await page.mouse.down()
		await page.mouse.move(...near(5), { steps: 3 })
		const imPast = await held(ui)
		await page.mouse.move(...near(2.5), { steps: 2 })
		const imSnap = await held(ui)
		await page.mouse.up()
		ok(rd && Math.abs(imSnap[0] - rd.v[0]) < 1e-9 && Math.abs(imSnap[1] - rd.v[1]) < 1e-9 && Math.abs(imSnap[2] - imPast[2]) < 1e-9, `a drag 2.5 px off an image pixel's dot lands on it: its L and C, the hue held (${imSnap} vs ${rd && rd.v})`)
		ok(rd && Math.abs(imPast[1] - rd.v[1]) > 1e-6, `…5 px off it, its own place (${imPast})`)

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
		const wantTok = `color: var(--brand-500, ${cssShort('lab', space.rgb.lab(0.2 * 255, 0.4 * 255, 0.6 * 255))}); /* variable Brand/500 */`
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
		// the opacity, as the value field holds it (in percent) and as it is typed (in the field's text)
		const field = { inputValue: async () => String(Math.round(await alphaOf(ui) * 100)) }, knob = ui.locator('#channels .nrg[data-i="a"]')
		const fills = id => page.evaluate(id => window.__paints(id, 'fills'), id)
		const pick = async ids => { const n = await selections(page); await page.evaluate(ids => window.__select(ids), ids); await settle(page, n) }
		async function typeAlpha(pct) {
			const n = await selections(page), w = await page.evaluate(() => window.__log.fromUI.filter(m => m.type === 'set').length)
			await setCh(ui, 'a', pct)
			await page.waitForFunction(w => window.__log.fromUI.filter(m => m.type === 'set').length > w, w)
			await settle(page, n)
			await page.waitForTimeout(30)
		}

		ok(await field.inputValue() === '60' && await knob.getAttribute('aria-valuenow') === '60', `a solid paint's opacity reads 60%: ${await field.inputValue()}`)
		ok(/ \/ 0\.6\)$/.test(await asFmt(ui, 'oklch')), 'the opacity rides the CSS')
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
		const hex0 = await asFmt(ui, 'hex'), sw0 = await ui.locator('.paint .sw').first().evaluate(e => e.style.getPropertyValue('--sw'))
		await page.evaluate(() => { const m = window.__log.toUI.filter(m => m.type === 'selection').at(-1); figma.ui.postMessage({ ...m, ack: m.ack - 1, paints: m.paints.map(p => ({ ...p, r: 0, g: 0, b: 0 })) }) })
		await page.waitForTimeout(50)
		ok(await asFmt(ui, 'hex') === hex0 && await ui.locator('.paint .sw').first().evaluate(e => e.style.getPropertyValue('--sw')) === sw0, `a re-read trailing a write keeps the color as written (${await asFmt(ui, 'hex')} vs ${hex0})`)
		// a re-read that has seen every write is the truth, even when it differs (an edit made in Figma)
		await page.evaluate(() => { const all = window.__log.toUI.filter(m => m.type === 'selection'), m = all.at(-1); figma.ui.postMessage({ ...m, ack: Math.max(...all.map(m => m.ack)), paints: m.paints.map(p => ({ ...p, r: 0, g: 0, b: 0 })) }) })
		await page.waitForTimeout(50)
		ok(/^#000000/.test(await asFmt(ui, 'hex')), `a current re-read is taken (${await asFmt(ui, 'hex')})`)
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
		const { page, ui, errors } = await open({ profile: 'LEGACY', editorType: 'dev', nodes: [node], selection: ['3:1'], stored: { format: null } })
		ok(await ui.locator('#cells').isVisible() && /^L[\d.]+ C[\d.]+ H[\d.]+$/.test(await ui.locator('#fmt option[value="space"]').textContent()), `a fresh panel's value: the space's own channels in cells, Figma's default – OKLCH's too, its CSS a row of the list (${await ui.locator('#fmt option[value="space"]').textContent()})`)
		ok(/^In sRGB\.$/.test(await ui.locator('#gamut').innerText()), 'LEGACY read as sRGB')
		close(await shown(ui), valuesIn('SRGB', 'oklch', [0.25, 0.5, 0.75]), halfStep('oklch'), 'LEGACY read as sRGB')
		ok(await ui.locator('#cells input').evaluateAll(xs => xs.every(x => x.readOnly)), 'Dev Mode: the cells are read-only')
		ok(/Dev Mode is read-only/.test(await notes(ui)), 'Dev Mode note')
		ok(await ui.locator('#drop').isHidden(), 'Dev Mode: no eyedropper – nothing is ever written there')
		// even a forced change event writes nothing
		await ui.locator('#cells input').first().evaluate(e => { e.value = 'oklch(0.1 0 0)'; e.dataset.dirty = '1'; e.dispatchEvent(new Event('change', { bubbles: true })) })
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
		// a space with no CSS and long channel names: its cells, read-only in Dev Mode, every number in sight
		await pickSpace(ui, 'lalphabeta')
		await ui.locator('#fmt').selectOption('space')
		const lab = await ui.locator('#cells input').evaluateAll(xs => xs.map(x => [x.readOnly, x.scrollWidth <= x.clientWidth + 1]))
		ok(lab.length === 4 && lab.every(([ro, fits]) => ro && fits), `the value as its channels' cells, read-only, every number fitting (${JSON.stringify(lab)})`)
		ok(!errors.length, `Dev Mode page errors: ${errors.join(' | ')}`)
		await page.context().close()
	}

	/* ---------- Figma parity: the panel's pieces against Figma's own ---------- */
	// The references (scripts/figma-ref) are 2× crops of Figma's own UI in its light theme, 2026-10: its picker's eyedropper,
	// its Advanced stroke settings mark, a split field's chevron. Ours are drawn the same way – Figma's light-theme colors,
	// 2× – and each glyph compared with its reference pixel for pixel, at the best ±2 px shift: the ink's box and weight,
	// the farthest any ink pixel of one stands from the other's (Hausdorff), and the darkness that differs, as a share of
	// the reference's. A redrawn glyph that looks off fails: the eyedropper before its fit (a straight tube, its collar line
	// high) stood 2.8 px off. The panel's rhythm is checked against Figma's picker beside it, and its measures as numbers.
	// When Figma redraws its UI these fail: crop the references again, then follow them
	{
		const theme = { bg: '#ffffff', 'bg-secondary': '#f5f5f5', 'bg-hover': '#f5f5f5', text: '#000000e6', 'text-secondary': '#00000080', border: '#e6e6e6', 'border-selected': '#0d99ff', icon: '#000000e6' }   // Figma's light theme: its ink black at 90% (the references' strokes read 25 of 255)
		const node = { id: '8:1', name: 'Parity', type: 'RECTANGLE', fills: [solid(0.4, 0.5, 0.8)], strokes: [] }
		// the panel's frame kept in its page's process: Chromium paints an isolated frame at 1× and scales it up, and its
		// screenshots at 2× come out soft – Figma's crops are crisp
		const crisp = await chromium.launch({ headless: true, executablePath, ignoreDefaultArgs: ['--hide-scrollbars'], args: ['--disable-site-isolation-trials', '--disable-features=IsolateOrigins,site-per-process'] })
		const { page, ui, errors } = await open({ profile: 'SRGB', editorType: 'figma', nodes: [node], selection: ['8:1'], theme, dsf: 2, stored: { width: 240 } }, crisp)
		await page.waitForFunction(() => window.__log.resize.some(r => r[0] === 240))   // Figma's width taken, the frame settled: a glyph shot mid-resize comes out smeared
		await page.waitForTimeout(300)
		await page.mouse.move(0, 0)
		const fr = page.frames().find(f => f !== page.mainFrame())
		// a 2× picture's darkness against its own ground (its commonest light: a crop may hold a button's fill), 0 … 1, and
		// its ink (darker than half), from its ink's box
		const inkOf = b64 => fr.evaluate(async b64 => {
			const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode()
			const c = document.createElement('canvas'); c.width = im.width; c.height = im.height
			const x = c.getContext('2d'); x.drawImage(im, 0, 0)
			const d = x.getImageData(0, 0, c.width, c.height).data, pts = [], dark = [], L = [], seen = new Map()
			for (let i = 0; i < d.length; i += 4) { const l = Math.round(d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11); L.push(l); seen.set(l, (seen.get(l) || 0) + 1) }
			const ground = [...seen].sort((a, b) => b[1] - a[1])[0][0]
			for (let y = 0; y < c.height; y++) for (let k = 0; k < c.width; k++) { const l = L[y * c.width + k]; dark.push([k, y, Math.max(0, (ground - l) / ground)]); if (l < 150) pts.push([k, y]) }
			const x0 = Math.min(...pts.map(p => p[0])), y0 = Math.min(...pts.map(p => p[1]))
			return { w: Math.max(...pts.map(p => p[0])) - x0 + 1, h: Math.max(...pts.map(p => p[1])) - y0 + 1, ink: pts.map(([a, b]) => [a - x0, b - y0]), dark: dark.filter(p => p[2] > 0.02).map(([a, b, v]) => [a - x0, b - y0, v]) }
		}, b64)
		const compare = (A, B) => {
			const near = (P, Q, dx, dy) => P.map(([x, y]) => Math.min(...Q.map(([u, v]) => Math.hypot(x + dx - u, y + dy - v))))
			const db = new Map(B.dark.map(([x, y, v]) => [`${x},${y}`, v])), total = B.dark.reduce((t, p) => t + p[2], 0)
			let best = null
			for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {   // the shift where the darkness agrees best
				const da = new Map(A.dark.map(([x, y, v]) => [`${x + dx},${y + dy}`, v])), keys = new Set([...da.keys(), ...db.keys()])
				const diff = [...keys].reduce((t, k) => t + Math.abs((da.get(k) || 0) - (db.get(k) || 0)), 0) / total
				if (!best || diff < best.diff) best = { diff, haus: Math.max(...near(A.ink, B.ink, dx, dy), ...near(B.ink, A.ink, -dx, -dy)) }
			}
			return best
		}
		for (const [name, sel, file] of [['eyedropper', '#drop .ic', 'eyedropper.png'], ['settings mark', '#prmb .ic', 'settings.png']]) {   // (the split field's chevron, its copy, gone with the field's text: the copy button is the panel's own icon)
			const shot = await ui.locator(sel).screenshot()
			if (process.env.FIGMA_SHOTS) writeFileSync(`${process.env.FIGMA_SHOTS}/parity-${file}`, shot)
			const a = await inkOf(shot.toString('base64')), b = await inkOf(readFileSync(new URL(`./figma-ref/${file}`, import.meta.url)).toString('base64'))
			const weight = a.ink.length / b.ink.length, c = compare(a, b)
			ok(Math.abs(a.w - b.w) <= 2 && Math.abs(a.h - b.h) <= 2 && weight > 0.8 && weight < 1.25 && c.haus <= 1.5 && c.diff <= 0.3, `Figma's ${name}: ink box ${a.w}×${a.h} (Figma's ${b.w}×${b.h}), weight ${weight.toFixed(2)}, farthest ${c.haus.toFixed(2)} px, darkness off ${(c.diff * 100).toFixed(0)}%`)
		}
		// Figma's measures (at 2×, 2026-10): fields and selects 24 px tall; the field filled #f5f5f5, the select outlined
		// #e6e6e6; 5 px corners; 11 px text at Figma UI3's body weight, 450; the panel's inset 16 px at the sides
		const m = await fr.evaluate(() => { const cs = e => getComputedStyle(e), v = document.querySelector('#cells .cell'), sp = document.getElementById('spbtn')
			return { field: [document.getElementById('valf').getBoundingClientRect().height, cs(v).backgroundColor, cs(v).fontSize, cs(v).fontWeight, cs(v).webkitFontSmoothing], select: [sp.getBoundingClientRect().height, cs(sp).borderTopColor, cs(sp).borderTopLeftRadius, cs(sp).fontSize], inset: cs(document.body).paddingLeft } })
		ok(JSON.stringify(m) === JSON.stringify({ field: [24, 'rgb(245, 245, 245)', '11px', '450', 'antialiased'], select: [24, 'rgb(230, 230, 230)', '5px', '11px'], inset: '16px' }), `Figma's measures: ${JSON.stringify(m)}`)
		// Figma's rhythm, measured at 2× beside its own picker (its Custom tab, 240 px, 2026-10), from the window's top: its tool
		// row 8–32 px, a divider at 40, the plane from 57, the sliders at 277 and 305, the value at 333, the palette's divider
		// at 373, its select at 385 and the swatches at 417 – each of ours level with it
		const rh = await fr.evaluate(() => { const top = e => Math.round(e.getBoundingClientRect().top), q = s => document.querySelector(s), bars = [...document.querySelectorAll('.bar2')]
			return [top(q('#spbtn')), Math.round(q('#spbtn').getBoundingClientRect().bottom), top(q('#picker')), top(q('#plane')), top(bars[0]), top(bars.at(-1)), top(q('#valf')), top(q('#pal')), top(q('.pal .sel')), top(q('#paints .paint'))] })
		ok(JSON.stringify(rh) === JSON.stringify([8, 32, 40, 57, 277, 305, 333, 373, 385, 417]), `the panel level with Figma's picker, row for row (${rh}; Figma's 8,32,40,57,277,305,333,373,385,417)`)
		ok(!errors.length, `parity page errors: ${errors.join(' | ')}`)
		await crisp.close()
	}

} finally {
	await browser.close()
}
if (failures.length) {
	console.error(`figma: ${failures.length} failed, ${passed} passed\n  ${failures.join('\n  ')}`)
	process.exit(1)
}
console.log(`figma: ${passed} checks pass (SRGB, DISPLAY_P3, LEGACY + Dev Mode; read → display → edit → set → write)`)
