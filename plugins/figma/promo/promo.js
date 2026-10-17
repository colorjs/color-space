#!/usr/bin/env node
/**
 * The plugin's Community listing media, made from the plugin itself: the real ui.html and code.js running on the
 * mock Figma host (scripts/figma-mock.js), on a stage (stage.html) that draws a small design from the mock
 * document's paints, so an edit in the panel shows on the design. The stage borrows a design canvas's look – its grey, a
 * frame's name, a blue hover outline and selection box with handles as the pointer picks layers – and draws none of
 * Figma's interface (no toolbar, no layers or properties panel).
 *
 *   node plugins/figma/promo/promo.js            all of it, into plugins/figma/promo/out/
 *   node plugins/figma/promo/promo.js shots      the stills only (cover.png, 1–8.png, 1920×1080)
 *   node plugins/figma/promo/promo.js video      the videos only: video.mp4, the whole tour, and video-30.mp4, the cut that
 *                                                fits the Community carousel's reported 30 s (1920×1080, H.264)
 *   node plugins/figma/promo/promo.js video-30   the 30 s cut alone
 * SLOW=6 before it films more slowly (more frames a played second) on a busy machine
 *   node plugins/figma/promo/promo.js icon       the icon (icon.png, 128 px; icon-512.png to review) and the site's locus marks
 *
 * Needs ffmpeg for the video. The GPU picker runs on the machine's GPU (Metal under ANGLE on a Mac), so the planes
 * build as fast as they do in Figma; elsewhere Chromium falls back to its software GL, slower but the same pixels.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, extname } from 'node:path'
import { chromium } from 'playwright'
import { host } from '../../../scripts/figma-mock.js'

const ROOT = fileURLToPath(new URL('../../../', import.meta.url)), DIR = fileURLToPath(new URL('./', import.meta.url))
const OUT = join(DIR, 'out'), what = process.argv[2] || 'all'
mkdirSync(OUT, { recursive: true })
execFileSync(process.execPath, [join(ROOT, 'plugins/figma/build.js')], { stdio: 'inherit' })
const html = readFileSync(join(ROOT, 'plugins/figma/ui.html'), 'utf8'), code = readFileSync(join(ROOT, 'plugins/figma/code.js'), 'utf8')

/* ---------- the document: a card, its tokens, a gradient, a photo ---------- */

const solid = (r, g, b, ref) => ({ type: 'SOLID', visible: true, opacity: 1, blendMode: 'NORMAL', color: { r, g, b }, ...(ref ? { boundVariables: { color: { type: 'VARIABLE_ALIAS', id: ref } } } : {}) })
const stop = (position, r, g, b) => ({ position, color: { r, g, b, a: 1 } })
// colors: OkLCh picks (the site's brand orange 0.72 0.16 41, its edge 0.55 0.15 38, an accent 0.6 0.14 250, inks at hue 250), as sRGB
const C = { brand: [0.9641, 0.4915, 0.3102], edge: [0.7198, 0.2917, 0.1516], accent: [0.1951, 0.5169, 0.8148], ink9: [0.0766, 0.1074, 0.1398], ink5: [0.3564, 0.3936, 0.4334], surface: [0.9876, 0.9794, 0.9661] }
const variables = {
	'V:brand': { name: 'Brand/500', collection: 'C', values: { m: { r: C.brand[0], g: C.brand[1], b: C.brand[2], a: 1 } } },
	'V:accent': { name: 'Accent/500', collection: 'C', values: { m: { r: C.accent[0], g: C.accent[1], b: C.accent[2], a: 1 } } },
	'V:ink9': { name: 'Ink/900', collection: 'C', values: { m: { r: C.ink9[0], g: C.ink9[1], b: C.ink9[2], a: 1 } } },
	'V:ink5': { name: 'Ink/500', collection: 'C', values: { m: { r: C.ink5[0], g: C.ink5[1], b: C.ink5[2], a: 1 } } },
	'V:surface': { name: 'Surface', collection: 'C', values: { m: { r: C.surface[0], g: C.surface[1], b: C.surface[2], a: 1 } } },
}
const node = (id, name, type, fills, extra = {}) => ({ id, name, type, fills, strokes: [], modes: { C: 'm' }, ...extra })
const nodes = [
	node('9:1', 'Card', 'FRAME', [solid(...C.surface, 'V:surface')], { children: ['9:2', '9:3', '9:4', '9:5', '9:6', '9:7'] }),
	node('9:2', 'Photo', 'RECTANGLE', [{ type: 'IMAGE', visible: true, opacity: 1, blendMode: 'NORMAL', imageHash: 'wave', scaleMode: 'FILL' }]),
	node('9:3', 'Title', 'TEXT', [solid(...C.ink9, 'V:ink9')]),
	node('9:4', 'Credit', 'TEXT', [solid(...C.ink5, 'V:ink5')]),
	node('9:5', 'Button', 'RECTANGLE', [solid(...C.brand, 'V:brand')], { strokes: [solid(...C.edge)] }),
	node('9:6', 'Tag', 'RECTANGLE', [{ type: 'GRADIENT_LINEAR', visible: true, opacity: 1, blendMode: 'NORMAL', gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: [stop(0, 0.9796, 0.5627, 0.099), stop(0.5, 0.8728, 0.2154, 0.5977), stop(1, 0.3791, 0.3499, 0.8834)] }]),
	node('9:7', 'Badge', 'ELLIPSE', [solid(...C.accent, 'V:accent')]),   // its own token: a color shared with the button would be one swatch with it
]
// Figma's light theme, as its panel reads them (sampled from Figma's own color picker)
const theme = { bg: '#ffffff', 'bg-secondary': '#f5f5f5', text: '#000000e6', 'text-secondary': '#00000080', border: '#e6e6e6', 'border-selected': '#0d99ff' }
// a Display P3 file: the sliders and the plane show the wider gamut whole, not sRGB's cut of it
const setup = { profile: 'DISPLAY_P3', editorType: 'figma', nodes, variables, selection: ['9:5'], images: { wave: '/web/img/wave.jpg' }, theme, mount: '#mount', stored: { width: 300 } }

/* ---------- the page ---------- */

// The take is filmed in real time, so a busy machine (or a Mac in Low Power Mode) hands over fewer frames: the video is
// filmed SLOW times slower – every glide, wait and stage transition stretched – and played back SLOW times faster, so
// each played second gets SLOW seconds of frames
const SLOW = +process.env.SLOW || 3   // SLOW=6 on a loaded machine: more frames for each played second
const ORIGIN = 'http://localhost:9'
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' }
const browser = await chromium.launch({ headless: true, args: process.platform === 'darwin' ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : [] })

// scale: the device pixels per CSS px – 4/3 makes the 1440 × 810 stage 1920 × 1080; the video renders at 2, so a close-up
// still has pixels to show (the screencast is taken down to 1920)
async function open(extra = {}, scale = 4 / 3) {
	const page = await browser.newPage({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: scale })
	page.on('pageerror', e => console.error('page error:', e.message))
	await page.route(ORIGIN + '/**', route => {
		const path = new URL(route.request().url()).pathname
		const file = path === '/' ? join(DIR, 'stage.html') : join(ROOT, path)
		if (!file.startsWith(ROOT) || !existsSync(file)) return route.fulfill({ status: 404, body: '' })
		route.fulfill({ contentType: TYPES[extname(file)] || 'application/octet-stream', body: readFileSync(file) })
	})
	await page.goto(ORIGIN + '/')
	await page.evaluate(() => document.fonts.ready)
	await page.evaluate(`(${host})(${JSON.stringify({ ...setup, ...extra })}); window.__html__ = ${JSON.stringify(html).replace(/<\//g, '<\\/')};`)
	await page.addScriptTag({ content: code })
	await page.waitForFunction(() => window.__log.toUI.some(m => m.type === 'selection'))
	const ui = page.frameLocator('iframe'), frame = page.frames().find(f => f !== page.mainFrame())
	await frame.waitForFunction(() => { const c = document.querySelector('#plane canvas'); return c && c._key }, null, { timeout: 60000 })
	// the panel's tooltips, off for the camera (they'd cover what's shown) – on in the scenes that show one (person tips)
	const tipsOff = await frame.addStyleTag({ content: '#tip{ display:none !important }' })
	return { page, ui, frame, tipsOff }
}

// The Code panel's output for the card, from code.js's own generator (Dev Mode, codegen, no UI)
async function codegen() {
	const page = await browser.newPage()
	await page.route(ORIGIN + '/**', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><body></body>' }))
	await page.goto(ORIGIN + '/')
	await page.evaluate(`(${host})(${JSON.stringify({ ...setup, mode: 'codegen', editorType: 'dev', codegen: { format: 'oklch' } })}); window.__html__ = ''`)
	await page.addScriptTag({ content: code })
	const r = await page.evaluate(async () => window.__generate({ node: window.__node('9:1'), language: 'css' }))
	await page.close()
	return r.map(s => `/* ${s.title === 'Color Space' ? 'Card' : s.title} */\n${s.code}`).join('\n\n')
}

/* ---------- a person at the panel: a drawn pointer, real presses ---------- */

function person(page, ui, frame, video, tipsOff) {
	const k = video ? SLOW : 1   // the video's take runs SLOW times slower than it plays
	const wait = ms => page.waitForTimeout(video ? ms * k : Math.min(ms, 120))
	let at = [900, 560]
	// a glide paced by the clock, not by step count: each step lands where the eased path is at that moment
	const glide = async (x, y, ms = 450) => {
		const [x0, y0] = at, t0 = Date.now()
		ms *= k
		for (let t = 0; t < 1;) {
			t = video ? Math.min(1, (Date.now() - t0) / ms) : 1
			const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2   // ease in-out
			const px = x0 + (x - x0) * e, py = y0 + (y - y0) * e
			await Promise.all([page.mouse.move(px, py), page.evaluate(([a, b]) => window.pointer(a, b), [px, py])])
		}
		at = [x, y]
	}
	const box = async loc => { const b = await loc.boundingBox(); return [b.x, b.y, b.width, b.height] }
	const centre = async loc => { const [x, y, w, h] = await box(loc); return [x + w / 2, y + h / 2] }
	const click = async loc => { const [x, y] = await centre(loc); await glide(x, y, 320); await page.mouse.down(); await wait(70); await page.mouse.up(); await wait(120) }
	// a drag along fractions of an element's box
	const drag = async (loc, pts, ms = 900) => {
		const [x, y, w, h] = await box(loc)
		await glide(x + pts[0][0] * w, y + pts[0][1] * h)
		await page.mouse.down()
		for (const [fx, fy] of pts.slice(1)) await glide(x + fx * w, y + fy * h, ms / (pts.length - 1))
		await page.mouse.up()
		await wait(150)
	}
	// the pointer carried round the plane's centre from a place, by deg at its own distance out (on a wheel: its chroma
	// kept, its hue turned) – the button held down through it if `down`
	const arc = async (px, py, deg, ms = 1000, down = true) => {
		const [x, y, w, h] = await box(ui.locator('#plane')), cx = x + w / 2, cy = y + h / 2, r = Math.hypot(px - cx, py - cy), a0 = Math.atan2(py - cy, px - cx)
		if (down) { await glide(px, py, 400); await page.mouse.down() }
		for (let k = 1, n = 8; k <= n; k++) { const a = a0 + deg * Math.PI / 180 * k / n; await glide(cx + r * Math.cos(a), cy + r * Math.sin(a), ms / n) }
		await page.mouse.up(); await wait(150)
	}
	const centreOf = async loc => { const b = await loc.boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2] }
	// a drag from where the pointer is through page points ([x, y, ms] each)
	const dragTo = async pts => { await page.mouse.down(); for (const [x, y, ms] of pts) await glide(x, y, ms); await page.mouse.up(); await wait(150) }
	// a layer selected as a person selects it: the pointer goes to it on the design (hovering what it passes), then a click
	const select = async ids => {
		const at = video && ids.length === 1 ? await page.locator(`[data-node="${ids[0]}"]`).boundingBox() : null
		if (at) { await glide(at.x + Math.min(at.width / 2, 40), at.y + Math.min(at.height / 2, 24), 500); await wait(120) }
		await page.evaluate(ids => window.__select(ids), ids); await wait(350)
	}
	const planeReady = () => frame.waitForFunction(() => { const c = document.querySelector('#plane canvas'); return c && c._key }, null, { timeout: 60000 })
	const hide = () => page.evaluate(() => window.pointer(0, 0, false))
	// the camera in close on parts of the stage (the video only: the stills stay wide)
	const cam = async names => { if (!video) return; await page.evaluate(n => window.camera(n), names); await page.waitForTimeout(900 * k) }
	const wheel = async () => { for (let k = 0; k < 4 && !(await frame.evaluate(() => document.getElementById('plane').classList.contains('polar'))); k++) await click(ui.locator('#axes .laby')) }
	// the space menu, as a person uses it: open, type, pick
	const space = async (id, settle = 300) => {
		if (await ui.locator('#spbtn').getAttribute('data-id') === id) return   // already there
		await click(ui.locator('#spbtn'))
		await ui.locator('#spq').fill('')   // the field shows the current space's name: typed over, not after
		await ui.locator('#spq').pressSequentially(id, { delay: video ? 60 * k : 0 })
		await wait(120)
		await click(ui.locator(`#spmenu .spo[data-id="${id}"]`).first())
		await planeReady(); await wait(settle)
	}
	// a dot taken up and moved in toward the plane's middle (the grays), so the color stays inside the file's gamut
	const dragDot = async (dot, k = 0.3, ms = 1000) => {
		const [x, y, w, h] = await box(ui.locator('#plane')), d = await dot.boundingBox()
		const fx = (d.x + d.width / 2 - x) / w, fy = (d.y + d.height / 2 - y) / h, to = f => [fx + (0.5 - fx) * f, fy + (0.5 - fy) * f]
		await drag(ui.locator('#plane'), [[fx, fy], [to(k / 2)[0] + 0.04, to(k / 2)[1] - 0.04], to(k)], ms)
	}
	// a key held through `fn`, shown beside the pointer as a keycap
	const hold = async (key, cap, fn) => { await page.evaluate(t => window.keycap(t), cap); await wait(250); await page.keyboard.down(key)
		try { await fn() } finally { await page.keyboard.up(key); await wait(200); await page.evaluate(() => window.keycap(null)) } }
	// the panel's tooltips shown (or hidden again) for the camera
	const tips = on => tipsOff.evaluate((st, on) => { st.disabled = on }, on)
	// the pointer rests on a place: past the tooltips' wait (real time: the panel's clock isn't slowed), held for the eye
	const rest = async (x, y, ms = 1100) => { await glide(x, y, 500); await page.waitForTimeout(800); await wait(ms) }
	// the plane's place of two channel values (the plane's own pair: its x channel's, then its y's, as fractions of their ranges)
	const onPlane = async (fx, fy) => { const [x, y, w, h] = await box(ui.locator('#plane')); return [x + fx * w, y + (1 - fy) * h] }
	// a number typed into a cell, as a person does: the cell clicked, its number typed over, Enter
	const type = async (i, text) => { const c = ui.locator('#cells input').nth(i); await click(c); await c.fill(''); await c.pressSequentially(text, { delay: video ? 70 * k : 0 }); await c.press('Enter'); await wait(300) }
	// the settings opened, `fn` done in them, and shut
	const settings = async fn => { await click(ui.locator('#prmb')); await wait(300); try { await fn() } finally { await page.keyboard.press('Escape'); await wait(250) } }
	return { wait, glide, click, drag, dragTo, arc, centreOf, dragDot, select, planeReady, hide, box, cam, wheel, space, hold, tips, rest, onPlane, type, settings }
}

/* ---------- the scenes: a caption, then what the panel does ---------- */

// The scenes, in the video's order: one heavy feature each, said as what it does for the person using it; the rest of what
// the plugin does is the outro's list. `short` marks the ones the 30 s cut keeps, `cut` one only it plays (`hs`: a
// shortened scene's headline). A still is taken at each one's end, wide, except where a scene says `still: false` (the
// carousel holds nine)
const PILLS = ['Free', 'Offline', 'Open']
// every space the panel lists, counted from the library (web/js/categories.js files them all into seven families)
const { space: SPACES, meta: META } = await import('../../../web/js/core.js')
const N = Object.keys(SPACES).filter(id => META[id]).length
const SCENES = [
	{ id: 'hook', short: true, still: false, h: 'Advanced color picker', s: `Pick in OKLCH, HCT, RYB, CMYK, Munsell and ${N - 5} more color spaces.`, pills: PILLS,
		run: async ({ ui, p }) => {
			await p.select(['9:5']); await p.wait(p.short ? 300 : 900); await p.cam(['panel', 'design'])
			if (p.short) return p.arc(...await p.centreOf(ui.locator('#plane .cx')), 140, 1300)   // the 30 s cut opens on OkHSL's hue wheel: the pick carried round it
			await p.drag(ui.locator('#plane'), [[0.62, 0.42], [0.52, 0.3], [0.62, 0.34], [0.44, 0.36]], 1300)
		} },
	{ id: 'selection', short: true, h: 'Every color of a selection', s: 'The fills and strokes of every layer you select, on one plane. Drag one; near another color, it snaps onto it.',
		run: async ({ ui, page, p }) => {
			if (!p.short) await p.space('oklab')   // a × b at one lightness: every color of the card lands inside the square (the 30 s cut stays in OKLCH)
			await p.cam(['panel', 'design']); await p.select(['9:1']); await p.wait(500)
			// the badge's dot taken up, brought by the button's color (it snaps onto it, the badge the button's color), then on
			const [x, y, w, h] = await p.box(ui.locator('#plane')), dot = async key => { const d = await ui.locator(`#marks .dm[data-key^="${key}"]`).boundingBox(); return [d.x + d.width / 2, d.y + d.height / 2] }
			const cx = await ui.locator('#plane .cx').boundingBox()   // the button's color, the current one's mark: a dot once the badge is taken up
			const [bx, by] = await dot('9:7:'), [tx, ty] = [cx.x + cx.width / 2, cx.y + cx.height / 2]
			await p.glide(bx, by, 450); await p.wait(150)
			if (p.short) { await page.mouse.down(); await p.glide(tx + 2, ty + 1, 600); await p.wait(350); return p.arc(tx + 2, ty + 1, -110, 800, false) }   // snapped; then round the wheel
			await p.dragTo([[tx + 2, ty + 1, 900], [tx + 2, ty + 1, 600], [x + w * 0.66, y + h * 0.66, 900]])   // held by the button's dot a moment: snapped; then on, to a violet
		} },
	{ id: 'gradient', short: true, h: 'Edit gradients on the plane', s: 'A gradient is drawn through its colors. Drag a stop and the whole blend updates.',
		run: async ({ ui, p }) => {
			await p.select(['9:6']); await p.wait(400)
			const stop2 = ui.locator('#marks .dm[data-key^="9:6:fills:0:1"]')
			if (p.short) await p.arc(...await p.centreOf(stop2), 70, 900)   // on the wheel: stop 2 carried round its hue
			else await p.dragDot(stop2, 0.35, 1200)   // stop 2, taken up and moved
		} },
	{ id: 'image', short: true, h: 'Plot image pixels', s: 'Analyze a photo’s palette: see where its colors fall in any color space.',
		run: async ({ frame, p }) => {
			await p.select(['9:2']); await p.cam(['panel'])   // in close: the dots on the plane and the histograms on the bars read
			await frame.waitForFunction(() => { const c = document.querySelector('#plane .density'); return c && c.width && c.getContext('2d').getImageData(0, 0, c.width, c.height).data.some((v, i) => i % 4 === 3 && v > 0) }, null, { timeout: 60000 })
			await p.wait(p.short ? 600 : 1200)
		} },
	{ id: 'spaces', h: `${N} color spaces`, s: 'In seven families, from display RGB to video, film and print – each space with its own plane and sliders.',
		run: async ({ ui, page, p }) => {
			await p.select(['9:5']); await p.cam(['panel'])
			if (p.video && !p.short) { await p.click(ui.locator('#spbtn')); await p.click(ui.locator('#spgroup')); await p.wait(1100); await page.keyboard.press('Escape'); await p.wait(250) }   // the families, at the menu's top
			for (const id of p.video && !p.short ? ['ryb', 'cmyk', 'munsell', 'hct', 'oklch'] : p.video ? ['cmyk', 'okhsl'] : ['cmyk']) await p.space(id, p.short ? 250 : 500)   // the cut: back to its wheel
		} },
	{ id: 'tailwind', h: 'Snap to Tailwind colors', s: 'Quantize to Tailwind, CSS names, web-safe and more: every pick lands on a named color, its name under the pointer.', tip: true,
		run: async ({ ui, p }) => {
			await p.select(['9:5']); if (!p.short) await p.space('hsl'); await p.cam(['panel'])   // saturation × lightness, a full square (the 30 s cut keeps the wheel: its tokens in sectors)
			await p.settings(async () => { await p.click(ui.locator('#quant')); await p.click(ui.locator('#quant option[value="tailwind"]')) })
			await p.planeReady()
			if (!p.short) await p.drag(ui.locator('#plane'), [[0.75, 0.5], [0.55, 0.62], [0.82, 0.4]], 1000)   // the 30 s cut: the name alone
			await p.tips(true); await p.rest(...await p.onPlane(0.62, 0.66), p.short ? 900 : 1300)   // the token there, named
		} },
	{ id: 'views', h: 'Zoom, swap axes, square or wheel', s: 'Pinch into the plane; click an axis to swap its channel; turn a hue plane into a wheel. Drag the corner to resize.', still: false,
		run: async ({ ui, page, p }) => {
			await p.tips(false)
			await p.settings(async () => { await p.click(ui.locator('#quant')); await p.click(ui.locator('#quant option[value="0"]')) })
			await p.space('oklch'); await p.cam(['panel'])   // L × C: a square, zoomable
			const m = await ui.locator('#plane .cx').boundingBox(), [cx, cy] = [m.x + m.width / 2, m.y + m.height / 2]
			await p.glide(cx, cy, 500)
			await p.hold('Control', 'pinch', async () => { for (let k = 0; k < 5; k++) { await page.mouse.wheel(0, -120); await p.wait(110) } })   // about the marker, 4× in
			await p.wait(600)
			await page.mouse.dblclick(cx, cy); await p.wait(500)   // the whole plane again
			await p.click(ui.locator('#axes .labx')); await p.wait(700)   // C across becomes H across
			await p.wheel(); await p.wait(700)   // a hue with the tone: a wheel
			await p.click(ui.locator('#axes .pmode')); await p.wait(600)   // and back to the square
			for (let k = 0; k < 6 && (await ui.locator('#axes .labx').innerText()) !== 'C'; k++) await p.click(ui.locator('#axes .labx'))   // C across again, for the scenes after
			// the window narrowed by its corner (and the plane with it), then widened back from the keyboard
			const g = await ui.locator('#grip').boundingBox(), [gx, gy] = [g.x + g.width * 0.75, g.y + g.height * 0.75]
			await p.glide(gx, gy, 500); await page.mouse.down(); await p.glide(gx - 48, gy, 900); await page.mouse.up(); await p.wait(700)
			await ui.locator('#grip').focus(); for (let k = 0; k < 3; k++) { await ui.locator('#grip').press('ArrowRight'); await p.wait(120) }
			await p.planeReady(); await p.wait(300)
		} },
	{ id: 'gamut', h: 'sRGB, Display P3, Rec.2020', s: 'See where each display’s colors end. Rest the pointer: the color there, and the gamut it needs – or that it is no color.', tip: true,
		run: async ({ ui, p }) => {
			await p.select(['9:7']); await p.space('oklch'); await p.cam(['panel'])
			await p.type(2, '160'); await p.type(1, '0.15')   // a green: its P3 and Rec.2020 reach widest (oklch at L 0.6: sRGB to C 0.136, P3 to 0.188, Rec.2020 to 0.294)
			await p.settings(() => p.click(ui.locator('#gamseg [data-g="rec2020"]')))   // the plane shows Rec.2020, sRGB and P3 drawn as lines in it
			await p.planeReady(); await p.tips(true)
			const C = 0.4   // the plane's C across (0 … 0.4), L up (0 … 1)
			await p.rest(...await p.onPlane(0.16 / C, 0.6))   // in P3, past sRGB
			await p.rest(...await p.onPlane(0.35 / C, 0.2))   // past the spectral locus: no color at all
			await p.rest(...await p.onPlane(0.24 / C, 0.6), 1400)   // in Rec.2020, past P3
		} },
	{ id: 'zoom', short: true, cut: true, h: 'Square or wheel, zoom in, pick finely', s: '',
		run: async ({ ui, page, p }) => {
			await p.select(['9:5']); await p.cam(['panel']); await p.wait(250)
			await p.click(ui.locator('#axes .pmode')); await p.planeReady(); await p.wait(500)   // the wheel turned into its square: hue across, saturation up
			const [cx, cy] = await p.centreOf(ui.locator('#plane .cx'))
			await p.glide(cx, cy, 400)
			await p.hold('Control', 'pinch', async () => { for (let k = 0; k < 4; k++) { await page.mouse.wheel(0, -120); await p.wait(100) } })   // about the marker, in
			await p.wait(400)
			const [mx, my] = await p.centreOf(ui.locator('#plane .cx'))
			await p.glide(mx, my, 300); await page.mouse.down()
			await p.hold('Meta', '⌘', () => p.glide(mx + 160, my - 70, 700))   // fine: the pick a tenth as far as the pointer
			await page.mouse.up(); await p.wait(250)
			await page.mouse.dblclick(mx, my); await p.wait(300)   // the whole plane again
		} },
	{ id: 'measure', short: true, tip: true, hs: 'Measure, see each gamut', h: 'Measure, hold an axis, pick finely', s: 'Hold ⌥ over a color: its steps and contrast, as Figma’s redlines. ⇧ keeps one channel; ⌘ moves a tenth as far.',
		run: async ({ ui, page, p }) => {
			await p.tips(false)
			if (!p.short) await p.settings(() => p.click(ui.locator('#gamseg [data-g="p3"]')))   // after the gamut scene's Rec.2020 (the cut never left the file's P3)
			await p.select(['9:1']); await p.space('oklch', p.short ? 150 : 300); await p.cam(['panel', 'design']); await p.wait(p.short ? 200 : 400)
			await ui.locator('#paints .paint[data-keys*="9:5:fills"]').click(); await p.wait(300)   // the button's color the current one
			const [px, py] = await p.onPlane(0.45, 0.55)
			if (p.short) { await p.tips(true); await p.rest(...await p.onPlane(0.22 / 0.4, 0.7), 700) }   // the cut: past sRGB at the button's hue (oklch L 0.7 H 41: sRGB to C 0.200, P3 to 0.244) – the tooltip names it P3
			if (!p.short) {   // the 30 s cut: ⌥ and the tooltips
				await p.glide(px, py, 500); await page.mouse.down()
				await p.hold('Shift', '⇧', () => p.glide(px + 70, py - 14, 900))   // across: L held
				await p.hold('Meta', '⌘', () => p.glide(px + 230, py - 40, 1000))   // fine: the pick a tenth as far as the pointer
				await page.mouse.up(); await p.wait(500)
			}
			// ⌥ over the badge: its steps from the button's color and their contrast, held for the picture (the next scene lets go)
			const d = await ui.locator('#marks .dm[data-key^="9:7:"]').boundingBox(), [dx, dy] = [d.x + d.width / 2, d.y + d.height / 2]
			await page.evaluate(t => window.keycap(t), '⌥'); await p.wait(250); await page.keyboard.down('Alt')
			await p.glide(dx, dy, p.short ? 500 : 700); await p.wait(p.short ? 1000 : 1300)
		} },
	{ id: 'palette', h: 'Merge colors, find their layers', s: 'Drop a swatch onto another to make them one color. Point at a swatch: its layers – click one to select it.', tip: true,
		run: async ({ ui, page, p }) => {
			await page.keyboard.up('Alt'); await page.evaluate(() => window.keycap(null))   // the measure scene's ⌥ let go
			await p.select(['9:1']); await p.cam(['panel', 'design']); await p.wait(300)
			const sw = key => ui.locator(`#paints .paint[data-keys*="${key}"]`).first(), mid = async loc => { const b = await loc.boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2] }
			// the tag's first stop carried onto the button's stroke (two raw paints: a token's color would stay its own swatch)
			const [ax, ay] = await mid(sw('9:6:fills:0:0')), [bx, by] = await mid(sw('9:5:strokes'))
			await p.glide(ax, ay, 500); await page.mouse.down(); await p.glide(ax + 6, ay - 4, 200); await p.glide(bx, by, 900); await p.wait(300); await page.mouse.up(); await p.wait(700)
			await p.tips(true)
			await p.rest(...await mid(sw('9:5:strokes')), 1100)   // the one color: both its layers, in the tooltip
			if (p.video) { const row = ui.locator('#tip .row').nth(1); if (await row.count()) await p.click(row); await p.wait(900) }   // a layer pressed: selected on the canvas
		} },
	{ id: 'outro', short: true, h: 'Also', s: '', pills: PILLS,
		list: ['Variables and styles, edited in place', 'Dev Mode CSS in your format', 'Copy in any notation', 'Offline, in 12 languages'],
		run: async ({ page, p }) => { await page.keyboard.up('Alt'); await page.evaluate(() => window.keycap(null)); await p.tips(false); await p.cam(null); await p.wait(p.short ? 1000 : 3000) } },
]

/* ---------- stills: the cover, then one per scene ---------- */

async function shots() {
	for (const f of readdirSync(OUT)) if (/^\d+-.*\.png$/.test(f)) rmSync(join(OUT, f))   // a renamed scene leaves no stale still
	const code = await codegen()
	const { page, ui, frame, tipsOff } = await open()
	const p = person(page, ui, frame, false, tipsOff)
	// a still: the pointer away first – but where a tooltip is the point, the pointer stays on what it names
	const still = async (name, tip) => { if (!tip) { await p.hide(); await page.mouse.move(4, 4) } await page.waitForTimeout(600); await page.screenshot({ path: join(OUT, name) }) }
	await page.evaluate(([h, s, x]) => window.caption(h, s, true, x), [SCENES[0].h, SCENES[0].s, { pills: SCENES[0].pills }])
	await p.select(['9:5'])
	await page.evaluate(() => document.body.classList.add('cover')); await page.waitForTimeout(400)
	await still('cover.png')
	await page.evaluate(() => document.body.classList.remove('cover'))
	let n = 0
	for (const sc of SCENES.filter(sc => !sc.cut)) {
		await page.evaluate(([h, s, x]) => window.caption(h, s, true, x), [sc.h, sc.s, { pills: sc.pills, list: sc.list }])
		await sc.run({ page, ui, frame, p, code })
		if (sc.still === false) continue   // played for its state, not photographed: the carousel holds nine
		await still(`${++n}-${sc.id}.png`, sc.tip)
		console.log('still', n, sc.id)
	}
	await page.close()
}

/* ---------- the video: the scenes in one take, frames from the compositor, then H.264 ---------- */

async function video(short) {
	const code = await codegen()
	// 2: in a close-up the panel's canvases (the plane's dots, the bars' histograms) keep about a pixel per pixel shown.
	// The compositor hands over fewer frames at that size, which the SLOW take makes up for
	// the 30 s cut opens on OkHSL's hue wheel (hue round, saturation out: its first plane pair, a disc by default) – a
	// whole color wheel, perceptual, where a selection's colors, a gradient and a photo's pixels read at a glance (OKLCH's
	// wheel at one lightness is the gamut's slice, a polygon in a black disc)
	const { page, ui, frame, tipsOff } = await open(short ? { stored: { ...setup.stored, space: 'okhsl', pairs: { okhsl: 0 } } } : {}, 2)
	// the panel compiles the featured spaces' planes in the background once it opens (gl.js warmPlaneGL): filming waits
	// for them, so no first draw of a space lands mid-take
	await page.waitForTimeout(12000)
	await page.evaluate(k => { document.documentElement.style.setProperty('--slow', k); window.SLOW = k }, SLOW)   // the stage's transitions slowed with the take
	const p = { ...person(page, ui, frame, true, tipsOff), video: true, short }
	const scenes = SCENES.filter(sc => short ? sc.short : !sc.cut)   // cut: the 30 s cut's own
	const cdp = await page.context().newCDPSession(page), frames = [], tmp = join(OUT, 'frames')
	rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp)
	cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
		const f = join(tmp, `${String(frames.length).padStart(5, '0')}.jpg`)
		writeFileSync(f, Buffer.from(data, 'base64'))
		frames.push({ f, t: metadata.timestamp })
		cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
	})
	const head = sc => short && sc.hs || sc.h   // a scene the 30 s cut shortens says only what it still shows
	await page.evaluate(([h, s, x]) => window.caption(h, s, true, x), [head(scenes[0]), scenes[0].s, { pills: scenes[0].pills, list: scenes[0].list }])
	await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 })
	await page.waitForTimeout(300 * SLOW)
	for (const [k, sc] of scenes.entries()) {
		const t0 = Date.now()
		if (k) await page.evaluate(([h, s, x]) => window.caption(h, s, false, x), [head(sc), sc.s, { pills: sc.pills, list: sc.list }])
		await page.waitForTimeout(250 * SLOW)
		await sc.run({ page, ui, frame, p, code })
		await page.waitForTimeout(200 * SLOW)
		console.log('scene', sc.id, ((Date.now() - t0) / 1000).toFixed(1), 's')
	}
	await page.waitForTimeout(400 * SLOW)
	await cdp.send('Page.stopScreencast')
	await page.close()
	// a steady 30 fps: each output frame shows the newest captured frame at its time (the compositor sends frames only
	// when something changes, so a still stretch is one frame held)
	const FPS = 30, t0 = frames[0].t, total = frames.at(-1).t - t0, out = []
	const gaps = frames.slice(1).map((f, k) => f.t - frames[k].t)
	console.log(`frames: ${frames.length}, gaps over 100 ms: ${gaps.filter(g => g > .1).length} (longest ${(Math.max(...gaps) * 1000).toFixed(0)} ms – a still stretch is one long gap)`)
	// the take is real time: a busy machine hands over fewer frames, and the video stutters
	const fps = frames.length / total * SLOW   // frames per second of the played video
	if (fps < 24) console.warn(`promo: only ${fps.toFixed(0)} frames a second for the video – the machine was busy; re-run \`node plugins/figma/promo/promo.js video\` when it is idle`)
	for (let k = 0, j = 0; k <= Math.round(total * FPS); k++) {
		while (j + 1 < frames.length && frames[j + 1].t - t0 <= k / FPS) j++
		out.push(`file '${frames[j].f}'\nduration ${(1 / FPS).toFixed(6)}`)
	}
	// the cut fits 30 s: a take a little over is played a little faster (at most 25%), not trimmed – a real-time take's
	// length wanders by a few tenths of a second, so it aims at 29.5
	const speed = SLOW * (short && total / SLOW > 29.5 ? Math.min(1.25, total / SLOW / 29.5) : 1)
	writeFileSync(join(tmp, 'list.txt'), out.join('\n') + `\nfile '${frames.at(-1).f}'\n`)
	execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', join(tmp, 'list.txt'), '-vf', `setpts=PTS/${speed},fps=${FPS},scale=1920:1080:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-movflags', '+faststart', join(OUT, short ? 'video-30.mp4' : 'video.mp4')], { stdio: 'inherit' })
	rmSync(tmp, { recursive: true, force: true })
	console.log(`video: ${frames.length} frames, ${total.toFixed(1)} s`)
}

/* ---------- the mark: the spectral locus, each chromaticity in its own color ---------- */

// The project's mark, as the site's chromaticity plate fills it (web/js/locus.js locusFill): the CIE 1931 horseshoe,
// each xy at sRGB's full saturation, its edge antialiased by the locus path. Written as the site's favicon and master
// (web/img/locus-*.png, transparent) and as the plugin's icon (out/icon.png, 128 px): the mark on a frosted light tile,
// its own colors glowing through the glass.
async function icon() {
	const { locus, space } = await import('../../../web/js/core.js')
	const N = 1024, L = locus(), xs = L.map(q => q[0]), ys = L.map(q => q[1])
	const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)], k = 0.9 * N / Math.max(x1 - x0, y1 - y0)
	const P = ([x, y]) => [N / 2 + (x - (x0 + x1) / 2) * k, N / 2 - (y - (y0 + y1) / 2) * k], Q = (u, v) => [(x0 + x1) / 2 + (u - N / 2) / k, (y0 + y1) / 2 - (v - N / 2) / k]
	const enc = c => c <= .0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - .055
	const px = new Uint8ClampedArray(N * N * 4)
	for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
		const [x, y] = Q(i + .5, j + .5); if (y <= .005) continue
		const l = space.xyz.lrgb(x / y * 100, 100, (1 - x - y) / y * 100), c = l.map(v => Math.max(0, v)), m = Math.max(...c) || 1, o = (j * N + i) * 4
		for (let n = 0; n < 3; n++) px[o + n] = enc(c[n] / m) * 255
		px[o + 3] = 255
	}
	const path = L.map(q => P(q).map(v => +v.toFixed(2)))
	const page = await browser.newPage()
	const out = await page.evaluate(async ({ data, N, path }) => {
		const cv = new OffscreenCanvas(N, N), g = cv.getContext('2d')
		g.putImageData(new ImageData(new Uint8ClampedArray(data), N, N), 0, 0)
		g.globalCompositeOperation = 'destination-in'   // the fill kept inside the horseshoe, its edge antialiased
		g.beginPath(); path.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill()
		const png = async c => Array.from(new Uint8Array(await (await c.convertToBlob({ type: 'image/png' })).arrayBuffer()))
		// halving steps keep a small size crisp
		const at = (src, n) => { let c = src; while (c.width / 2 >= n) { const h = new OffscreenCanvas(c.width / 2, c.height / 2), x = h.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, h.width, h.height); c = h }
			return c }
		// the tile, drawn at full size and halved down: frosted glass to the edges – square, the corners are the host's to
		// round (the Community takes a JPG, so it masks whatever it shows)
		const T = new OffscreenCanvas(N, N), t = T.getContext('2d')
		const base = t.createLinearGradient(0, 0, 0, N); base.addColorStop(0, '#eeeef2'); base.addColorStop(1, '#d6d6de')
		t.fillStyle = base; t.fillRect(0, 0, N, N)
		t.filter = `blur(${N * 0.12}px) saturate(.6)`; t.globalAlpha = 0.6   // the mark's colors, diffused through the glass to its edges
		t.drawImage(cv, -N * 0.15, -N * 0.15, N * 1.3, N * 1.3)
		t.filter = 'none'; t.globalAlpha = 1
		t.fillStyle = 'rgba(255,255,255,.14)'; t.fillRect(0, 0, N, N)   // the frost
		const sheen = t.createLinearGradient(0, 0, 0, N * 0.55); sheen.addColorStop(0, 'rgba(255,255,255,.4)'); sheen.addColorStop(1, 'rgba(255,255,255,0)')
		t.fillStyle = sheen; t.fillRect(0, 0, N, N)
		t.filter = 'saturate(.72) brightness(1.06)'; t.drawImage(cv, N * 0.08, N * 0.08, N * 0.84, N * 0.84); t.filter = 'none'   // the mark itself, crisp, a touch softer than the neon of a full-saturation fill
		return { tile: await png(at(T, 128)), big: await png(at(T, 512)), master: await png(at(cv, 512)), fav: await png(at(cv, 64)) }
	}, { data: Array.from(px), N, path })
	writeFileSync(join(OUT, 'icon.png'), Buffer.from(out.tile))
	writeFileSync(join(OUT, 'icon-512.png'), Buffer.from(out.big))
	writeFileSync(join(ROOT, 'web/img/locus-512.png'), Buffer.from(out.master))
	writeFileSync(join(ROOT, 'web/img/locus-64.png'), Buffer.from(out.fav))
	await page.close()
	console.log('icon: 128 × 128 tile (and 512 to look at); web/img/locus-512.png, locus-64.png')
}

try {
	if (what === 'all' || what === 'icon') await icon()
	if (what === 'all' || what === 'shots') await shots()
	if (what === 'all' || what === 'video') await video(false)
	if (what === 'all' || what === 'video' || what === 'video-30') await video(true)
} finally { await browser.close() }
