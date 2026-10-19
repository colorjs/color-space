#!/usr/bin/env node
/**
 * The extension's Marketplace media, made from the extension itself: its packaged .vsix installed in a VS Code of its own
 * (a fresh profile, no other extension, no development host), on a small project – a stylesheet with its tokens, a
 * gradient and a photo, and a SwiftUI file – driven over the DevTools protocol: real edits in the real editor, through
 * the real panel. The protocol's input moves no pointer on screen, so one is drawn (the Figma promo's, stage.html).
 *
 *   node plugins/vscode/promo/promo.js        out/video.mp4 (the whole take, 1920 × 1080) and media/picker.gif (its opening,
 *                                             the listing's loop – the Marketplace page shows images, never a player)
 * SLOW=3 before it films more slowly (more frames a played second) on a busy machine
 *
 * Needs VS Code (VSCODE: its executable; by default the macOS app's) and ffmpeg. The take is the window as VS Code opens
 * it, cut to 16:9 from the top; VS Code's own fades play SLOW times faster, as the Figma promo's stage transitions don't.
 */
import { execFileSync, spawn } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, copyFileSync, existsSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const ROOT = fileURLToPath(new URL('../../../', import.meta.url)), EXT = join(ROOT, 'plugins/vscode'), OUT = join(EXT, 'promo/out')
const CODE = process.env.VSCODE || '/Applications/Visual Studio Code.app/Contents/MacOS/Code'
const CLI = join(dirname(CODE), '../Resources/app/bin/code')   // the macOS app's command line
const SLOW = +process.env.SLOW || 2, MOD = process.platform === 'darwin' ? 'Meta' : 'Control'
const GIF_END = 15   // the loop: the take's opening seconds – a color picked in the code, dragged, a variable edited from its use
if (!existsSync(CODE)) throw new Error(`promo: no VS Code at ${CODE} – set VSCODE to its executable`)
mkdirSync(OUT, { recursive: true })

/* ---------- the extension, packaged and installed in a VS Code of its own ---------- */

const tmp = mkdtempSync(join(tmpdir(), 'cs-promo-')), ud = join(tmp, 'u'), ext = join(tmp, 'e'), app = join(tmp, 'my-app')   // short: the IPC socket's path stays under 104 bytes
const vsix = join(OUT, 'color-spaces.vsix')
execFileSync('npx', ['--yes', '@vscode/vsce@3.6.0', 'package', '--no-dependencies', '-o', vsix], { cwd: EXT, stdio: 'inherit' })
execFileSync(CLI, ['--extensions-dir', ext, '--user-data-dir', ud, '--install-extension', vsix], { stdio: 'inherit' })

// the project: a theme's tokens, a gradient over a photo, a button that uses the tokens; a SwiftUI palette
mkdirSync(app)
copyFileSync(join(ROOT, 'web/img/jungle.jpg'), join(app, 'cover.jpg'))
writeFileSync(join(app, 'theme.css'), `:root {
  --brand: oklch(0.72 0.16 41);
  --brand-deep: oklch(0.55 0.15 38);
  --accent: #2f7de1;
  --ink: oklch(0.25 0.03 255);
  --paper: #fbf7f1;
  --success: lch(62% 58 145);
}

.hero {
  background:
    url(cover.jpg) center / cover,
    linear-gradient(in oklch longer hue, oklch(0.82 0.13 85), oklch(0.6 0.2 330));
  color: var(--ink);
}

.button {
  background: var(--brand);
  color: var(--paper);
  border: 1px solid var(--brand-deep);
}

.link {
  color: var(--accent);
}
`)
writeFileSync(join(app, 'Theme.swift'), `import SwiftUI

extension Color {
    static let brand = Color(red: 0.96, green: 0.49, blue: 0.31)
    static let accent = Color(.displayP3, red: 0.18, green: 0.49, blue: 0.88)
    static let ink = Color(hue: 0.62, saturation: 0.35, brightness: 0.16)
}
`)
// the profile: the default dark theme at 120 %, nothing but the editor and the panel on screen
mkdirSync(join(ud, 'User'), { recursive: true })
writeFileSync(join(ud, 'User/settings.json'), JSON.stringify({
	'workbench.colorTheme': 'Default Dark Modern', 'window.zoomLevel': 1, 'workbench.startupEditor': 'none', 'workbench.tips.enabled': false,
	'security.workspace.trust.enabled': false, 'update.mode': 'none', 'telemetry.telemetryLevel': 'off', 'chat.disableAIFeatures': true,
	'extensions.autoUpdate': false, 'extensions.autoCheckUpdates': false, 'workbench.enableExperiments': false, 'git.enabled': false,
	'editor.minimap.enabled': false, 'breadcrumbs.enabled': false, 'editor.stickyScroll.enabled': false, 'editor.lightbulb.enabled': 'off',
	'editor.occurrencesHighlight': 'off', 'editor.selectionHighlight': false, 'editor.renderLineHighlight': 'none', 'editor.guides.indentation': false,
	'editor.hover.delay': 1000, 'extensions.ignoreRecommendations': true,
	'css.hover.documentation': false, 'css.hover.references': false, 'workbench.layoutControl.enabled': false, 'window.commandCenter': false,
	'workbench.colorCustomizations': { 'sash.hoverBorder': '#0000' },   // the panel's edge lit at every drag in it: noise on camera
}))
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE   // set when this runs inside VS Code's own terminal: the app would start as plain Node
let vscode = null
const done = () => { try { vscode?.kill('SIGKILL') } catch {} rmSync(tmp, { recursive: true, force: true }) }
process.on('exit', done)   // a failed take leaves no window open and no profile behind
vscode = spawn(CODE, ['--remote-debugging-port=0', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', `--user-data-dir=${ud}`, `--extensions-dir=${ext}`,
	'--skip-welcome', '--skip-release-notes', '--disable-workspace-trust', '--new-window', app], { env, stdio: 'ignore' })
const port = await until(() => existsSync(join(ud, 'DevToolsActivePort')) && readFileSync(join(ud, 'DevToolsActivePort'), 'utf8').split('\n')[0], 30000)
const EP = `http://127.0.0.1:${port}`
const browser = await until(() => chromium.connectOverCDP(EP).catch(() => null), 30000)
const win = await until(() => browser.contexts().flatMap(c => c.pages()).find(p => p.url().includes('workbench.html')), 30000)

async function until(f, ms) { const t = Date.now(); for (;;) { const v = await f(); if (v) return v; if (Date.now() - t > ms) throw new Error('promo: timed out'); await new Promise(r => setTimeout(r, 200)) } }

/* ---------- the window and the panel ---------- */

const sleep = ms => win.waitForTimeout(ms)
const key = async (k, ms = 300) => { await win.keyboard.press(k); await sleep(ms) }
const command = async name => { await key(`${MOD}+Shift+P`); await win.keyboard.type(name); await sleep(500); await key('Enter', 800) }

// The panel: VS Code nests its page (#active-frame) in the webview's own frame, an out-of-process iframe Playwright doesn't
// walk over CDP – reached through CDP itself, in an isolated world (its DOM, never its globals). box(sel): the element's
// rect in the window's CSS px, where the pointer moves
async function panel() {
	const t = await until(async () => (await (await fetch(EP + '/json/list')).json()).find(t => t.type === 'iframe' && t.url.startsWith('vscode-webview')), 30000)
	const ws = new WebSocket(t.webSocketDebuggerUrl)
	await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
	let id = 0
	const wait = new Map()
	ws.onmessage = e => { const m = JSON.parse(e.data); if (wait.has(m.id)) { const [res, rej] = wait.get(m.id); wait.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result) } }
	const send = (method, params = {}) => new Promise((res, rej) => { wait.set(++id, [res, rej]); ws.send(JSON.stringify({ id, method, params })) })
	const inner = await until(async () => ((await send('Page.getFrameTree')).frameTree.childFrames || [])[0]?.frame, 30000)
	const { executionContextId } = await send('Page.createIsolatedWorld', { frameId: inner.id, worldName: 'promo' })
	const evaluate = async (fn, ...args) => {
		const r = await send('Runtime.evaluate', { expression: `(${fn})(...${JSON.stringify(args)})`, contextId: executionContextId, returnByValue: true, awaitPromise: true })
		if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text)
		return r.result.value
	}
	const origin = async () => {
		const o = await win.evaluate(() => { const r = [...document.querySelectorAll('iframe')].find(f => f.src.startsWith('vscode-webview')).getBoundingClientRect(); return [r.x, r.y] })
		const io = JSON.parse((await send('Runtime.evaluate', { expression: 'JSON.stringify(document.getElementById("active-frame").getBoundingClientRect())', returnByValue: true })).result.value)
		return [o[0] + io.x, o[1] + io.y]
	}
	const box = async sel => { const [x, y] = await origin(), r = await evaluate(s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [b.x, b.y, b.width, b.height] }, sel); if (!r) throw new Error(`promo: no ${sel} in the panel`); return { x: r[0] + x, y: r[1] + y, w: r[2], h: r[3] } }
	return { evaluate, box }
}

// a place in the code: the first line holding `line`, the text `at` in it – its start, `chars` characters in, mid-height
async function inCode(line, at, chars = 2) {
	const p = await win.evaluate(([line, at, chars]) => {
		for (const v of document.querySelectorAll('.monaco-editor .view-line')) {
			const text = v.textContent.replace(/ /g, ' ')
			if (!text.includes(line)) continue
			const i = text.indexOf(at, text.indexOf(line)) + chars, walker = document.createTreeWalker(v, NodeFilter.SHOW_TEXT)
			for (let n, k = 0; (n = walker.nextNode()); k += n.length) if (i < k + n.length) {
				const r = document.createRange(); r.setStart(n, i - k); r.setEnd(n, i - k + 1)
				const b = r.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]
			}
		}
		return null
	}, [line, at, chars])
	if (!p) throw new Error(`promo: no "${at}" on a line with "${line}"`)
	return p
}

/* ---------- a person at the editor: a drawn pointer, real presses (the Figma promo's person) ---------- */

const pointerOn = () => win.evaluate(() => {
	const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
	s.id = 'promo-pointer'; s.setAttribute('viewBox', '0 0 20 20')
	const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')   // built, not parsed: the workbench takes Trusted Types only
	for (const [k, v] of Object.entries({ d: 'M2 2l6.2 15 2.1-6.3L16.6 8.6z', fill: '#111', stroke: '#fff', 'stroke-width': '1.4', 'stroke-linejoin': 'round' })) path.setAttribute(k, v)
	s.append(path)
	Object.assign(s.style, { position: 'fixed', left: '0', top: '0', width: '20px', height: '20px', zIndex: '2147483647', pointerEvents: 'none', transform: 'translate(-2px,-2px)' })
	document.body.append(s)
})
let at = [0, 0]
const wait = ms => sleep(ms * SLOW)
// a glide paced by the clock, not by step count: each step lands where the eased path is at that moment
async function glide(x, y, ms = 450) {
	const [x0, y0] = at, t0 = Date.now()
	for (let t = 0; t < 1;) {
		t = Math.min(1, (Date.now() - t0) / (ms * SLOW))
		const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2, px = x0 + (x - x0) * e, py = y0 + (y - y0) * e   // ease in-out
		await Promise.all([win.mouse.move(px, py), win.evaluate(([a, b]) => { const s = document.getElementById('promo-pointer').style; s.left = a + 'px'; s.top = b + 'px' }, [px, py])])
	}
	at = [x, y]
}
const click = async ([x, y], ms = 500) => { await glide(x, y, ms); await win.mouse.down(); await wait(60); await win.mouse.up(); await wait(150) }
// a drag through points ([x, y, ms] each) from where the pointer is
const drag = async pts => { await win.mouse.down(); for (const [x, y, ms] of pts) await glide(x, y, ms); await win.mouse.up(); await wait(200) }
// the current color's mark on the plane, as a person takes it up
const mark = async p => { const b = await p.box('#plane .cx'); return [b.x + b.w / 2, b.y + b.h / 2] }
const planeReady = p => until(() => p.evaluate(() => { const c = document.querySelector('#plane canvas'); return !!c && c.width > 0 }), 30000)

/* ---------- the take ---------- */

await win.waitForSelector('.monaco-workbench', { timeout: 60000 })
await sleep(2000)
await key(`${MOD}+P`); await win.keyboard.type('theme.css'); await sleep(600); await key('Enter', 1200)
await command('View: Close Primary Side Bar')
await command('Color Space: Focus on Color Space View')
const p = await panel()
await planeReady(p)
await p.evaluate(() => { const s = document.createElement('style'); s.textContent = '#tip{ display:none !important }'; document.head.append(s) })   // its tooltips would cover what's shown
// the side bar wider, the plane larger: its edge dragged
const edge = await win.evaluate(() => { const a = document.getElementById('workbench.parts.auxiliarybar').getBoundingClientRect(); return [a.left, a.top + a.height / 2] })
await win.mouse.move(edge[0] - 1, edge[1]); await win.mouse.down(); await win.mouse.move(edge[0] - 70, edge[1], { steps: 10 }); await win.mouse.up()
// the panel builds the featured spaces' planes in the background once it opens: filming waits for them, so no first
// draw of a space lands mid-take
await sleep(10000)
await key('Escape')
await pointerOn()
const [vw, vh] = await win.evaluate(() => [innerWidth, innerHeight])
at = [vw * 0.35, vh * 0.55]
await glide(at[0], at[1], 1)

const cdp = await win.context().newCDPSession(win), frames = [], dir = join(OUT, 'frames')
rmSync(dir, { recursive: true, force: true }); mkdirSync(dir)
cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
	const f = join(dir, `${String(frames.length).padStart(5, '0')}.jpg`)
	writeFileSync(f, Buffer.from(data, 'base64'))
	frames.push({ f, t: metadata.timestamp })
	cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
})
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1920, everyNthFrame: 1 })
await wait(900)

// 1. a color in the code: the cursor on it, the panel on it; its mark dragged – the literal rewritten as it moves
await click(await inCode('--brand: ', 'oklch(0.72', 3))
await wait(700)
let m = await mark(p), pl = await p.box('#plane')
await glide(m[0], m[1], 600); await wait(150)
await drag([[m[0] - pl.w * 0.08, m[1] + pl.h * 0.06, 700], [m[0] - pl.w * 0.14, m[1] - pl.h * 0.05, 800], [m[0] - pl.w * 0.05, m[1] + pl.h * 0.02, 700]])
await wait(700)

// 2. a token edited from its use: the cursor on var(--brand-deep), its hue swept – line 3 changes, the cursor stays
await click(await inCode('border: ', 'var(--brand-deep)', 6))
await wait(900)
const bar = await p.box('#bars .bar2:not(.alpha)'), knob = await p.box('#bars .bar2:not(.alpha) .nrg')
await glide(knob.x + knob.w / 2, knob.y + knob.h / 2, 700); await wait(150)
await drag([[bar.x + bar.w * 0.45, bar.y + bar.h / 2, 1100], [bar.x + bar.w * 0.3, bar.y + bar.h / 2, 600]])
await wait(900)
const loopEnd = frames.length ? frames.at(-1).t - frames[0].t : 0   // the listing's loop ends here

// 3. any of 205 spaces: OKHSL found by name, its hue wheel; the color carried round it
const field = await p.box('#spq')
await click([field.x + field.w * 0.3, field.y + field.h / 2])
await win.keyboard.type('okhsl', { delay: 90 * SLOW }); await wait(300)   // the field selects its name on focus: typing replaces it
const opt = await p.box('#splist .spo[data-id="okhsl"]')
await click([opt.x + opt.w * 0.3, opt.y + opt.h / 2]); await planeReady(p); await wait(700)
// its wheel: hue round, saturation out – an axis letter swaps that axis for the channel held, until the plane is polar
for (let k = 0; k < 3 && !(await p.evaluate(() => document.getElementById('plane').classList.contains('polar'))); k++) {
	const y = await p.box('#axes .laby'); await click([y.x + y.w / 2, y.y + y.h / 2]); await planeReady(p); await wait(500)
}
await wait(500)
m = await mark(p); pl = await p.box('#plane')
const cx = pl.x + pl.w / 2, cy = pl.y + pl.h / 2, r = Math.hypot(m[0] - cx, m[1] - cy), a0 = Math.atan2(m[1] - cy, m[0] - cx)
await glide(m[0], m[1], 600); await win.mouse.down()
for (let k = 1; k <= 10; k++) { const a = a0 - Math.PI * 0.9 * k / 10; await glide(cx + r * Math.cos(a), cy + r * Math.sin(a), 140) }
await win.mouse.up(); await wait(900)

// 4. a gradient's stop: the gradient's line on the plane bends as it moves
await click(await inCode('linear-gradient', 'oklch(0.6', 3))
await wait(900)
m = await mark(p); pl = await p.box('#plane')
await glide(m[0], m[1], 600); await wait(150)
await drag([[m[0] + (pl.x + pl.w / 2 - m[0]) * 0.35, m[1] + (pl.y + pl.h / 2 - m[1]) * 0.35, 1100]])
await wait(900)

// 5. not only CSS: a SwiftUI palette, its calls rewritten in their own form
await key(`${MOD}+P`, 400); await win.keyboard.type('Theme.swift', { delay: 60 * SLOW }); await wait(400); await key('Enter', 1200)
await click(await inCode('static let brand', 'red: 0.96', 6))
await wait(800)
m = await mark(p); pl = await p.box('#plane')
await glide(m[0], m[1], 600)
await drag([[m[0] + pl.w * 0.06, m[1] - pl.h * 0.12, 1000]])
await wait(800)

// 6. a hover: the color in OKLCH, Display P3 and hex, and the gamut it needs
const h = await inCode('static let accent', 'displayP3', 4)
await glide(h[0], h[1], 700)
await sleep(1600)   // VS Code's hover waits its own second in real time
await wait(2200)

await cdp.send('Page.stopScreencast')
await browser.close().catch(() => {})
done()

/* ---------- the video and the loop ---------- */

// a steady 30 fps: each output frame shows the newest captured frame at its time (the compositor sends frames only when
// something changes, so a still stretch is one frame held); the take filmed SLOW times slower plays SLOW times faster
const FPS = 30, t0 = frames[0].t, total = frames.at(-1).t - t0, list = []
const fps = frames.length / total * SLOW
if (fps < 24) console.warn(`promo: only ${fps.toFixed(0)} frames a second for the video – the machine was busy; re-run with SLOW=3 when it is idle`)
for (let k = 0, j = 0; k <= Math.round(total * FPS); k++) {
	while (j + 1 < frames.length && frames[j + 1].t - t0 <= k / FPS) j++
	list.push(`file '${frames[j].f}'\nduration ${(1 / FPS).toFixed(6)}`)
}
writeFileSync(join(dir, 'list.txt'), list.join('\n') + `\nfile '${frames.at(-1).f}'\n`)
// 16:9 from the top of the window's frame: the title, the editor and the panel whole; the status bar's line goes
const video = join(OUT, 'video.mp4'), crop = 'crop=iw:iw*9/16:0:0'
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', join(dir, 'list.txt'), '-vf', `setpts=PTS/${SLOW},fps=${FPS},${crop},scale=1920:1080:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-movflags', '+faststart', video], { stdio: 'inherit' })
// the loop: the opening, 15 frames a second, 960 wide (the listing's column), one 256-color palette for the whole loop,
// diffused – an ordered dither bands the plane's gradients
const gif = join(EXT, 'media/picker.gif'), end = Math.min(GIF_END, loopEnd / SLOW + 0.5)
mkdirSync(dirname(gif), { recursive: true })
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-t', String(end), '-i', video, '-vf', 'fps=15,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=256[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle', '-loop', '0', gif], { stdio: 'inherit' })
rmSync(dir, { recursive: true, force: true })
console.log(`video: ${frames.length} frames, ${(total / SLOW).toFixed(1)} s played, ${(statSync(video).size / 1e6).toFixed(1)} MB → ${video}`)
console.log(`loop: ${end.toFixed(1)} s, ${(statSync(gif).size / 1e6).toFixed(1)} MB → ${gif}`)
