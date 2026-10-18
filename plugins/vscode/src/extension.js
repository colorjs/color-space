/**
 * color-space for VS Code: the extension host. build.js bundles it, with the library, into dist/extension.cjs.
 *
 * The Figma panel (plugins/figma/src/ui.js) runs in a webview view of its own in the secondary side bar, beside the code
 * as Figma's panel floats beside the canvas (a VS Code without that container puts it in the Explorer); this host plays
 * Figma's part. What Figma calls the selection is here the document's color targets: every color literal in it – CSS's
 * in any file (colors.js), code's (code.js: Swift, Flutter, Compose, Unity, Godot, Unreal, 0x…, shaders), data files'
 * (data.js: Xcode color sets, design tokens, iTerm2 themes, GIMP palettes) – or, while a range is selected, those inside
 * the range – sent as the panel's paints ({r, g, b} in the panel's file profile, the literal's alpha as the opacity). The
 * literals of a gradient are its stops, mixed on the plane in the gradient's own interpolation space; the images its
 * url()s name are read for their pixels. The literal under the cursor is the current paint, and a paint chosen in the
 * panel brings the editor to it. A variable's literal (--brand: #0af) is edited where it lives, as Figma edits a paint's
 * variable: a cursor on a use of it, var(--brand), picks that literal. A 'set' writes the color back into the literal's
 * own notation; a gesture's live writes and its release are one undo step, as in Figma. With an image open (VS Code's
 * image preview), the panel shows its pixels; with an .ase swatch file (ase.js), its swatches, read-only.
 *
 * Besides the panel: a hover on any color literal (or a variable's use) shows it in OKLCH, Display P3 and hex with its
 * gamut, and opens it in the panel; "Convert Color To…" rewrites the selected literals in another notation; the
 * library's MCP server (mcp.js, bundled as dist/mcp.mjs) is offered to the editor's agents where VS Code has the MCP API.
 */
import * as vscode from 'vscode'
import { readFileSync } from 'node:fs'
import { createHash, randomBytes } from 'node:crypto'
import { FORMATS } from '../../figma/src/notation.js'
import { scan, nameAt, gradients, mixOf, urls, profileOf, toDoc, serialize, WRITE } from './colors.js'
import { scanCode } from './code.js'
import { scanData } from './data.js'
import { readAse } from './ase.js'

const MAX = 100   // color slots sent at once, as the Figma panel's
const IMAGES = 4   // images read at once, as the Figma panel's
const TEXT = 2e6   // characters of a document read: a huge minified file stops there
const BYTES = 32 << 20   // the largest image file read
const PREFS = ['space', 'quant', 'gamuts', 'pairs', 'disc', 'snap', 'scope']   // what the panel may keep (globalState)
const LINKS = { site: 'https://color-space.io/', github: 'https://github.com/colorjs/color-space', support: 'https://github.com/sponsors/colorjs' }
// where the color keywords count: in a stylesheet `red` is a color, in code or prose it's too often a word
const STYLESHEETS = new Set(['css', 'scss', 'sass', 'less', 'stylus', 'postcss'])
// the images the webview decodes (extract.js: the browser's own decoders)
const IMAGE = /\.(png|jpe?g|gif|webp|avif|bmp)$/i

const setting = k => vscode.workspace.getConfiguration('colorSpace').get(k)
const l10n = (s, ...a) => vscode.l10n.t(s, ...a)   // the host's own words, in VS Code's language (l10n/bundle.l10n.<lang>.json)
const gamut = () => setting('gamut') === 'srgb' ? 'srgb' : 'p3'
// the language a document's colors are read as: VS Code's id, or, for a file VS Code has no language for, its extension's
const EXT = { dart: 'dart', gd: 'gdscript', kt: 'kotlin', kts: 'kotlin', swift: 'swift', cs: 'csharp', java: 'java', cpp: 'cpp', cc: 'cpp', cxx: 'cpp', h: 'cpp', hpp: 'cpp', glsl: 'glsl', frag: 'glsl', vert: 'glsl', comp: 'glsl', wgsl: 'wgsl', hlsl: 'hlsl', fx: 'hlsl', metal: 'metal', toml: 'toml', yml: 'yaml', yaml: 'yaml' }
const langOf = doc => doc.languageId !== 'plaintext' ? doc.languageId : EXT[doc.uri.path.split('.').pop().toLowerCase()] || 'plaintext'
// Android writes an 8- or 4-digit #hex alpha first: its resource XML, and Color.parseColor in its Java and Kotlin
const argbIn = (lang, text) => lang === 'java' || lang === 'kotlin' || (lang === 'xml' && /<resources[\s>]|xmlns:android/.test(text))

// The variables, Figma's tokens: a custom property's definition whose whole value is one literal (--brand: #0af;), a
// Sass or Less one's in a stylesheet ($brand: #0af;, @brand: #0af;), or an alias of another (--button: var(--brand);).
// Their uses – var(--brand), $brand, @brand – stand for the literal that holds the value, edited there, as Figma edits a
// paint's variable rather than the paint: every use changes with it. A use names a variable of this document; one
// defined in another file (a theme imported) isn't followed
const DEF = /(?:^|[\s{;"'`])(--[\w-]+|\$[\w-]+|@[\w-]+)\s*:\s*$/   // after a quote too: style="--x: …", a template's `--x: …`
const DEF_END = /^\s*(?:!(?:default|global|important)\s*)*(?:[;}"']|\r?\n|$)/
const ALIAS = /(?<![\w-])(--[\w-]+|\$[\w-]+|@[\w-]+)\s*:\s*(?:var\(\s*(--[\w-]+)\s*\)|(\$[\w-]+)|(@[\w-]+))\s*(?:!(?:default|global|important)\s*)*(?=[;}"']|\r?\n)/g
const USE = /var\(\s*(--[\w-]+)\s*\)?|(?<![\w$@-])([$@][\w-]+)(?![\w-]|\s*:)/g
const own = (name, lang) => name.startsWith('--') || STYLESHEETS.has(lang)   // $x and @x are variables only in a stylesheet
function variables(text, lang, lits) {
	const vars = new Map(), alias = new Map()
	for (const l of lits) {
		if (l.gid !== undefined) continue
		const m = text.slice(text.lastIndexOf('\n', l.start - 1) + 1, l.start).match(DEF)
		if (!m || !own(m[1], lang) || !DEF_END.test(text.slice(l.end, l.end + 64))) continue
		Object.assign(l, { name: m[1], src: { type: 'variable', name: m[1], remote: false } })
		vars.set(m[1], [...vars.get(m[1]) || [], l])
	}
	for (const m of text.matchAll(ALIAS)) if (own(m[1], lang) && !vars.has(m[1])) alias.set(m[1], m[2] || m[3] || m[4])
	// a variable's definitions (a theme's light and dark ones), its aliases followed – a cycle or a long chain ends empty
	const defsOf = name => { for (let hop = 0; name && hop < 8; hop++, name = alias.get(name)) if (vars.has(name)) return vars.get(name); return [] }
	const uses = []
	for (const m of text.matchAll(USE)) {
		const name = m[1] || m[2], defs = own(name, lang) ? defsOf(name) : []
		if (defs.length) uses.push({ start: m.index, end: m.index + m[0].length, name, defs })
	}
	return uses
}

// A document's color targets, read once per version: its literals in order (k) – CSS's, code's (code.js), data files'
// (data.js), one per place: a value inside another's span (a design token's hex fallback) is part of that one – each with
// its line and what it sets, a gradient's stops grouped (gid, stop) with the gradient's mixing space, a variable's
// definition with the variable (src); the uses of the variables; its url()s; and how many colors it holds that aren't
// read (skipped)
const cache = new WeakMap()
function targets(doc) {
	const c = cache.get(doc), shaders = setting('shaders')
	if (c && c.version === doc.version && c.lang === doc.languageId && c.shaders === shaders) return c
	const text = doc.getText().slice(0, TEXT), lang = langOf(doc), path = doc.uri.path, data = scanData(text, lang, path)
	const found = [...scan(text, { named: STYLESHEETS.has(lang), argb: argbIn(lang, text) }), ...scanCode(text, lang, { shaders: shaders === 'srgb' || shaders === 'linear' ? shaders : null }), ...data]
	const flat = []
	for (const l of found.sort((a, b) => a.start - b.start || b.end - a.end)) if (!flat.length || l.start >= flat.at(-1).end) flat.push(l)
	const set = (path.match(/([^/]+)\.colorset\/Contents\.json$/) || [])[1]   // an Xcode color set is named by its folder
	const lits = flat.map((l, k) => ({ ...l, k, line: doc.positionAt(l.start).line, name: l.name || set || nameAt(text, l.start) }))
	gradients(text).forEach((g, gid) => {
		const stops = lits.filter(l => l.start > g.start && l.end <= g.end)
		const mix = mixOf(g, stops), line = doc.positionAt(g.start).line, name = nameAt(text, g.start)
		stops.forEach((l, stop) => Object.assign(l, { gid, stop, gline: line, mix, name: l.name || name }))   // a stop on its own line takes the gradient's property
	})
	const uses = variables(text, lang, lits)
	const t = { version: doc.version, lang: doc.languageId, shaders, lits, uses, refs: urls(text), skipped: data.skipped || 0 }
	cache.set(doc, t)
	return t
}
const keyOf = l => l.gid === undefined ? `c${l.k}` : `g${l.gid}`   // the paint id: a literal, or a gradient whose stops it holds
const rangeOf = (doc, l) => new vscode.Range(doc.positionAt(l.start), doc.positionAt(l.end))
const inRanges = (doc, ranges, x) => ranges.some(r => doc.offsetAt(r.start) < x.end && doc.offsetAt(r.end) > x.start)
// the literal under (or beside) a cursor: the one written there, else the one a variable used there holds (its first
// definition)
const at = (doc, t, pos) => { const o = doc.offsetAt(pos); return t.lits.find(l => l.start <= o && o <= l.end) || t.uses.find(u => u.start <= o && o <= u.end)?.defs[0] }
// the literals the selections touch: each one inside a selected range, the one under each cursor (unless `cursors` is
// off), and those that hold the variables used there
function touched(ed, cursors = true) {
	const doc = ed.document, t = targets(doc), ranges = ed.selections.filter(s => !s.isEmpty)
	const cur = cursors ? ed.selections.filter(s => s.isEmpty).map(s => at(doc, t, s.active)) : []
	const used = new Set(t.uses.filter(u => inRanges(doc, ranges, u)).flatMap(u => u.defs))
	return t.lits.filter(l => cur.includes(l) || used.has(l) || inRanges(doc, ranges, l))
}

// An image a url() names, as a source the panel can ask for: a data: URL's bytes, or a file beside the document (a
// root-relative path from its workspace folder); remote URLs are not fetched
function imageOf(doc, ref) {
	if (/^data:image\/[\w.+-]+;base64,/i.test(ref)) return { hash: 'data:' + createHash('sha1').update(ref).digest('hex'), name: 'data: URL', read: async () => Buffer.from(ref.slice(ref.indexOf(',') + 1), 'base64') }
	const path = ref.replace(/[?#].*$/, '')
	if (/^[a-z][\w+.-]*:/i.test(path) || path.startsWith('//') || !IMAGE.test(path)) return null
	const base = path.startsWith('/') ? vscode.workspace.getWorkspaceFolder(doc.uri)?.uri : vscode.Uri.joinPath(doc.uri, '..')
	if (!base) return null
	const uri = vscode.Uri.joinPath(base, decodeURIComponent(path))
	return { hash: uri.toString(), name: path.split('/').pop(), read: () => readImage(uri) }
}
async function readImage(uri) {
	const st = await vscode.workspace.fs.stat(uri)
	return st.size > BYTES ? null : vscode.workspace.fs.readFile(uri)
}
// the file open in the active tab when it isn't text: an image (VS Code's image preview, a custom editor whose input
// carries the file) or a binary swatch file (.ase, which VS Code opens as an unsupported binary)
function openFile() {
	const input = vscode.window.tabGroups?.activeTabGroup?.activeTab?.input
	const uri = input && !(vscode.TabInputText && input instanceof vscode.TabInputText) && input.uri
	if (!uri) return null
	if (IMAGE.test(uri.path)) return { image: { hash: uri.toString(), name: uri.path.split('/').pop(), read: () => readImage(uri) } }
	if (/\.ase$/i.test(uri.path)) return { ase: uri }
	return null
}

// the webview's page: the built panel under a strict policy – its one script by nonce, styles inline, fonts and the
// mark as data: URLs, images as blob: URLs the panel makes of the bytes it is sent, nothing loaded – in VS Code's display
// language (data-lang: the webview's navigator says the system's, not the workbench's)
function page(ctx) {
	const nonce = randomBytes(16).toString('base64'), lang = String(vscode.env.language || 'en').replace(/[^\w-]/g, '')
	const csp = `default-src 'none'; img-src data: blob:; font-src data:; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';`
	return readFileSync(ctx.asAbsolutePath('dist/panel.html'), 'utf8')
		.replace('<html lang="en">', () => `<html lang="en" data-lang="${lang}">`)
		.replace('<head>', () => `<head><meta http-equiv="Content-Security-Policy" content="${csp}">`)
		.replace('<script>', () => `<script nonce="${nonce}">`)
}

class Picker {
	constructor(ctx) {
		this.ctx = ctx
		this.view = null
		this.last = null   // the last read: { uri, profile, sent: paint key → literal }; a write names its literal by key
		this.images = new Map()   // image hash → source, for the panel's asks
		this.acked = 0     // the last 'set' applied: each read says it, so the panel can tell one that trails its writes
		this.open = false  // a gesture's undo step is open
		this.queue = Promise.resolve()
		this.timer = 0
		this.focus = -1   // the current literal's place in its document (k)
		this.mark = vscode.window.createTextEditorDecorationType({ borderWidth: '1px', borderStyle: 'solid', borderColor: new vscode.ThemeColor('focusBorder'), borderRadius: '2px' })
		ctx.subscriptions.push(this.mark)
	}
	resolveWebviewView(view) {
		this.view = view
		view.webview.options = { enableScripts: true, localResourceRoots: [] }
		view.webview.html = page(this.ctx)
		view.webview.onDidReceiveMessage(m => { this.queue = this.queue.then(() => this.receive(m && m.pluginMessage)).catch(err => this.post({ type: 'error', text: String(err && err.message || err) })) })
		view.onDidChangeVisibility(() => { if (view.visible) this.read() })
		view.onDidDispose(() => { this.view = null })
	}
	post(msg) { if (this.view) this.view.webview.postMessage({ pluginMessage: msg }) }
	// an edit, a cursor move, another editor or tab: one read per burst
	changed() {
		if (!this.view || !this.view.visible) return
		clearTimeout(this.timer)
		this.timer = setTimeout(() => this.read(), 16)
	}
	read() {
		clearTimeout(this.timer)
		const file = openFile()
		if (file && file.ase) return this.readAse(file.ase)
		const img = file && file.image, ed = file ? null : vscode.window.activeTextEditor
		const doc = ed && ed.document, all = doc ? targets(doc) : { lits: [], refs: [] }
		// the palette's scope: the file's colors (the default), or the selection's – those in the selected ranges, or under
		// the cursors where nothing is selected
		const ranges = ed ? ed.selections.filter(s => !s.isEmpty) : [], inSel = this.ctx.globalState.get('pref.scope') === 'selection'
		const lits = !inSel ? all.lits : ed ? touched(ed, !ranges.length) : []
		const cur = ed && ed.selection.isEmpty ? [at(doc, all, ed.selection.active)].find(l => lits.includes(l)) : null
		// the profile: the current literal's (a #hex edits in sRGB, an oklch() in the configured gamut), else all of them
		const profile = profileOf(cur ? [cur] : lits, gamut()), sent = new Map()
		const paints = lits.slice(0, MAX).map(l => {
			const p = { id: keyOf(l), name: l.name || l.text, kind: 'fills', index: l.gid === undefined ? l.line : l.gline, stop: l.gid === undefined ? -1 : l.stop, ...toDoc(l, profile), opacity: l.alpha, visible: true, src: l.src || null }
			if (l.mix !== undefined) p.mix = l.mix
			if (l === cur) p.current = true
			sent.set(`${p.id}:${p.stop}`, l)
			return p
		})
		const images = img ? [img] : []
		for (const r of all.refs) if (images.length < IMAGES && (!inSel || inRanges(doc, ranges, r))) {
			const src = imageOf(doc, r.ref)
			if (src && !images.some(i => i.hash === src.hash)) images.push(src)
		}
		for (const i of images) this.images.set(i.hash, i)
		this.last = doc ? { uri: doc.uri.toString(), profile, sent } : null
		// the literal the panel edits, outlined in the editor: the cursor's, else the one last chosen in the panel
		if (cur) this.focus = cur.k
		if (ed) ed.setDecorations(this.mark, [all.lits.find(l => l.k === this.focus && lits.includes(l))].filter(Boolean).map(l => rangeOf(doc, l)))
		const editable = !!doc && vscode.workspace.fs.isWritableFileSystem(doc.uri.scheme) !== false
		this.post({ type: 'selection', profile, paints, images: images.map(({ hash, name }) => ({ hash, name })), more: Math.max(0, lits.length - MAX), mixed: all.skipped || 0, editable, ack: this.acked })
	}
	// an .ase file's swatches, read once per file, shown and never written; the swatches it holds in other models counted
	readAse(uri) {
		const key = uri.toString()
		if (!this.ase || this.ase.key !== key) {
			this.ase = { key, swatches: null }
			Promise.resolve(vscode.workspace.fs.readFile(uri)).then(b => readAse(new Uint8Array(b)), () => null).then(r => { if (this.ase.key === key) { this.ase.swatches = r || { colors: [], skipped: 0 }; this.read() } })
		}
		const sw = this.ase.swatches || { colors: [], skipped: 0 }, profile = 'SRGB'
		this.last = null
		const paints = sw.colors.slice(0, MAX).map((c, k) => ({ id: `s${k}`, name: c.name || `#${k + 1}`, kind: 'fills', index: k, stop: -1, where: `swatch ${k + 1}`, ...toDoc(c, profile), opacity: 1, visible: true, src: null }))
		this.post({ type: 'selection', profile, paints, images: [], more: Math.max(0, sw.colors.length - MAX), mixed: sw.skipped, editable: false, ack: this.acked })
	}
	async receive(msg) {
		if (!msg || typeof msg !== 'object') return
		const state = this.ctx.globalState
		if (msg.type === 'ready') {
			const init = { type: 'init', editable: true }
			for (const k of PREFS) init[k] = state.get(`pref.${k}`)
			init.scope ??= 'page'   // the file's colors, until the selection's are chosen
			this.post(init)
			this.read()
		}
		else if (msg.type === 'store' && PREFS.includes(msg.key)) {
			await state.update(`pref.${msg.key}`, msg.value)
			if (msg.key === 'scope') this.read()   // the palette's colors, read anew
		}
		else if (msg.type === 'open' && Object.hasOwn(LINKS, msg.to)) await vscode.env.openExternal(vscode.Uri.parse(LINKS[msg.to]))
		else if (msg.type === 'image') {
			const src = this.images.get(msg.hash)
			let bytes = null
			try { bytes = src ? await src.read() : null } catch {}   // gone, unreadable: no pixels, the panel says so
			this.post({ type: 'image', hash: msg.hash, bytes: bytes ? new Uint8Array(bytes) : null })   // always answer: the panel waits on it
		}
		else if (msg.type === 'choose') this.reveal(msg)
		else if (msg.type === 'goto' && Array.isArray(msg.targets)) {   // a use pressed in a swatch's tip: its literal, the cursor at it, in the editor
			const f = msg.targets[0] && this.find(msg.targets[0])
			if (!f) return
			const at = rangeOf(f.ed.document, f.lit).start
			this.reveal(msg.targets[0])
			await vscode.window.showTextDocument(f.ed.document, { viewColumn: f.ed.viewColumn, selection: new vscode.Range(at, at), preserveFocus: false })
		}
		else if (msg.type === 'set') {
			try { await this.write(msg) } finally { if (typeof msg.seq === 'number') this.acked = msg.seq }
			this.read()   // always answer, so the panel settles even when nothing changed
		}
		else if (msg.type === 'notify' && typeof msg.text === 'string') vscode.window.setStatusBarMessage(msg.text.slice(0, 160), 2500)   // a copy made: the status bar says so
		else if (msg.type === 'undo') {   // ⌘Z in the panel: the document's own undo (the workbench's runs on the focused editor), then back
			const ed = vscode.window.activeTextEditor
			if (!ed || !this.last || ed.document.uri.toString() !== this.last.uri) return
			await vscode.window.showTextDocument(ed.document, { viewColumn: ed.viewColumn, preserveFocus: false })
			await vscode.commands.executeCommand('undo')
			await vscode.commands.executeCommand('colorSpace.picker.focus')
		}
	}
	// the literal this paint key named in the last read, if the document still holds it there
	find(msg) {
		const ed = vscode.window.activeTextEditor, last = this.last
		if (!ed || !last || ed.document.uri.toString() !== last.uri) return null
		const was = last.sent.get(`${msg.id}:${typeof msg.stop === 'number' ? msg.stop : -1}`)
		const doc = ed.document, lit = was && targets(doc).lits[was.k]
		return lit && lit.start === was.start && doc.getText(rangeOf(doc, lit)) === was.text ? { ed, lit } : null   // the text itself, not a reading of it
	}
	// a paint chosen in the panel (a swatch, a dot on the plane): the editor shows its literal, outlined, and the cursor goes
	// there unless a range is selected (which would then narrow the set to it)
	reveal(msg) {
		const f = this.find(msg)
		if (!f) return
		const r = rangeOf(f.ed.document, f.lit)
		this.focus = f.lit.k
		f.ed.setDecorations(this.mark, [r])
		f.ed.revealRange(r, vscode.TextEditorRevealType.InCenterIfOutsideViewport)
		if (f.ed.selections.every(s => s.isEmpty)) f.ed.selection = new vscode.Selection(r.start, r.start)
	}
	// a swatch's literals (the panel groups those that share a color), each in its own notation, in one edit
	async write(msg) {
		const c = msg.color, ed = vscode.window.activeTextEditor
		if (!ed || !this.last || msg.profile !== this.last.profile) return   // moved on: the read that follows says where
		if (!c || ![c.r, c.g, c.b].every(v => typeof v === 'number' && v >= 0 && v <= 1)) return
		const lits = (Array.isArray(msg.targets) ? msg.targets : [msg]).map(t => this.find(t)).filter(Boolean).map(f => f.lit)
		const alpha = l => typeof msg.opacity === 'number' && msg.opacity >= 0 && msg.opacity <= 1 ? msg.opacity : l.alpha
		const reps = lits.map(l => [l, serialize(l.nt, c, this.last.profile, alpha(l), l.text)]).filter(([l, text]) => text !== l.text)
		// a gesture is one undo step: a stop before its first write, none between its live writes, one after its release
		await ed.edit(b => { for (const [l, text] of reps) b.replace(rangeOf(ed.document, l), text) }, { undoStopBefore: !this.open, undoStopAfter: !!msg.commit })
		this.open = !msg.commit   // after the edit: one that throws leaves the step as it was
	}
}

// the hover: the literal in OKLCH, Display P3 and hex, the gamuts it fits, and a link that opens it in the panel; over a
// variable's use, the literal that holds it, named
function hover(doc, pos) {
	const t = targets(doc), o = doc.offsetAt(pos), lit = t.lits.find(l => l.start <= o && o < l.end)
	const use = !lit && t.uses.find(u => u.start <= o && o < u.end), l = lit || use && use.defs[0]
	if (!l) return
	const p3 = toDoc(l, 'DISPLAY_P3'), srgb = toDoc(l, 'SRGB')
	const inside = c => [c.r, c.g, c.b].every(v => v >= -1e-4 && v <= 1 + 1e-4)
	const fits = inside(srgb) ? l10n('In sRGB') : inside(p3) ? l10n('Outside sRGB, in Display P3 (hex: mapped into sRGB)') : l10n('Outside Display P3 (hex: mapped into sRGB)')
	const lines = ['oklch', 'p3', 'hex'].map(f => serialize({ fn: f }, p3, 'DISPLAY_P3', l.alpha)).filter(s => s.toLowerCase() !== l.text.toLowerCase())
	const start = doc.positionAt(use ? use.start : l.start)   // a use's own place: its cursor stands for the variable
	const args = encodeURIComponent(JSON.stringify([{ uri: doc.uri.toString(), line: start.line, character: start.character }]))
	const head = use ? [`\`${l.src.name}: ${l.text}\` ${l10n('(line {0})', l.line + 1)}`] : []
	const md = new vscode.MarkdownString([...head, ...lines.map(s => '`' + s + '`'), `${fits} · [${l10n('Pick in Color Space')}](command:colorSpace.pick?${args})`].join('  \n'))
	md.isTrusted = { enabledCommands: ['colorSpace.pick'] }
	return new vscode.Hover(md, use ? new vscode.Range(doc.positionAt(use.start), doc.positionAt(use.end)) : rangeOf(doc, l))
}

async function pick(at) {
	if (at && at.uri) {
		const ed = await vscode.window.showTextDocument(vscode.Uri.parse(at.uri), { preserveFocus: false })
		const p = new vscode.Position(at.line, at.character)
		ed.selection = new vscode.Selection(p, p)
	}
	await vscode.commands.executeCommand('colorSpace.picker.focus')
}

// CSS literals only: a notation of code or data has one form, its own (a Swift Color can't become an oklch())
async function convert() {
	const ed = vscode.window.activeTextEditor
	const lits = ed ? touched(ed).filter(l => !(l.nt.fn in WRITE)) : []
	if (!lits.length) return vscode.window.showInformationMessage(l10n('Put the cursor on a CSS color, or select text with CSS colors in it.'))
	const sample = toDoc(lits[0], 'DISPLAY_P3')
	const choice = await vscode.window.showQuickPick(FORMATS.map(([fn, label]) => ({ label, description: serialize({ fn }, sample, 'DISPLAY_P3', lits[0].alpha), fn })), { placeHolder: lits.length === 1 ? l10n('Convert {0} to…', lits[0].text) : l10n('Convert {0} colors to…', lits.length) })
	if (!choice) return
	await ed.edit(b => { for (const l of lits) b.replace(rangeOf(ed.document, l), serialize({ fn: choice.fn }, toDoc(l, 'DISPLAY_P3'), 'DISPLAY_P3', l.alpha)) })
}

export function activate(ctx) {
	const picker = new Picker(ctx), changed = () => picker.changed()
	ctx.subscriptions.push(
		vscode.window.registerWebviewViewProvider('colorSpace.picker', picker, { webviewOptions: { retainContextWhenHidden: true } }),
		vscode.window.onDidChangeTextEditorSelection(changed),
		vscode.window.onDidChangeActiveTextEditor(changed),
		vscode.window.tabGroups.onDidChangeTabs(changed),
		vscode.workspace.onDidChangeTextDocument(e => { if (e.document === vscode.window.activeTextEditor?.document) changed() }),
		vscode.workspace.onDidChangeConfiguration(e => { if (e.affectsConfiguration('colorSpace')) changed() }),
		vscode.languages.registerHoverProvider('*', { provideHover: hover }),
		vscode.commands.registerCommand('colorSpace.pick', pick),
		vscode.commands.registerCommand('colorSpace.convert', convert),
	)
	// the library's MCP server for the editor's agents: mcp.js bundled, run by the editor's own Node (Electron as Node)
	if (vscode.lm && vscode.lm.registerMcpServerDefinitionProvider) ctx.subscriptions.push(vscode.lm.registerMcpServerDefinitionProvider('colorSpace.mcp', {
		provideMcpServerDefinitions: () => [new vscode.McpStdioServerDefinition('Color Space', process.execPath, [ctx.asAbsolutePath('dist/mcp.mjs')], { ELECTRON_RUN_AS_NODE: '1' }, ctx.extension.packageJSON.version)],
	}))
}

export function deactivate() {}
