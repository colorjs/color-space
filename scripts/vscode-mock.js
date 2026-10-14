/**
 * A mock of the `vscode` module for plugins/vscode, in Node: the real dist/extension.cjs is required against it.
 * scripts/check-vscode.js checks the extension on it.
 *
 * It holds one text editor at a time (open(text, opts)), whose edit() applies replacements, records the undo stops it
 * was asked for, moves the selections as VS Code does (a position inside a replaced range lands at its end, one after
 * it on the same line shifts) and fires the document and selection events; and one active tab (setTab: an image open in
 * VS Code's image preview, a custom editor). file: URIs read the real disk. Its webview view hands the page's messages
 * to the extension and the extension's to the page through `bridge` (set by the check: { toPage(msg) }).
 */
import Module from 'node:module'
import { posix } from 'node:path'
import { readFileSync, statSync } from 'node:fs'

export function mock() {
	const handlers = { selection: [], editor: [], document: [], config: [], tabs: [] }
	const fire = (k, e) => handlers[k].forEach(f => f(e))
	const on = k => f => { handlers[k].push(f); return { dispose() {} } }
	const log = { edits: [], commands: {}, providers: {}, opened: [], info: [], revealed: [], quickPick: null, mcp: null }

	class Position {
		constructor(line, character) { this.line = line; this.character = character }
		compareTo(o) { return this.line - o.line || this.character - o.character }
		isBefore(o) { return this.compareTo(o) < 0 }
	}
	class Range {
		constructor(a, b, c, d) { [this.start, this.end] = typeof a === 'number' ? [new Position(a, b), new Position(c, d)] : [a, b] }
		get isEmpty() { return this.start.compareTo(this.end) === 0 }
	}
	class Selection extends Range {
		constructor(anchor, active) { super(anchor.isBefore(active) ? anchor : active, anchor.isBefore(active) ? active : anchor); this.anchor = anchor; this.active = active }
	}
	const uri = s => { const m = s.match(/^([a-z][\w+.-]*):(?:\/\/)?(.*)$/i); return { scheme: m[1], path: m[2].startsWith('/') ? m[2] : '/' + m[2], toString: () => s } }
	const Uri = { parse: uri, joinPath: (u, ...segs) => uri(`${u.scheme}://${posix.join(u.path, ...segs)}`) }
	class TabInputText { constructor(u) { this.uri = u } }
	class TabInputCustom { constructor(u, viewType) { this.uri = u; this.viewType = viewType } }

	let editor = null, tab = null
	// a document: its lines, its uri (scheme: 'file' unless said), its language
	function open(text, { uri: u = 'file:///a.css', languageId = 'css', selections = [[0, 0, 0, 0]] } = {}) {
		const doc = { uri: Uri.parse(u), languageId, lines: text.split('\n'), version: 1 }
		doc.lineAt = n => ({ text: doc.lines[n] })
		doc.getText = r => { const t = doc.lines.join('\n'); return r ? t.slice(doc.offsetAt(r.start), doc.offsetAt(r.end)) : t }
		doc.offsetAt = p => doc.lines.slice(0, p.line).reduce((n, l) => n + l.length + 1, 0) + p.character
		doc.positionAt = o => { let line = 0; while (line < doc.lines.length - 1 && o > doc.lines[line].length) { o -= doc.lines[line].length + 1; line++ } return new Position(line, o) }
		editor = {
			document: doc,
			selections: selections.map(([l1, c1, l2, c2]) => new Selection(new Position(l1, c1), new Position(l2, c2))),
			set selection(s) { this.selections = [s]; fire('selection', { textEditor: editor }) },
			get selection() { return this.selections[0] },
			revealRange(r) { log.revealed.push(r) },
			setDecorations(type, ranges) { log.marked = ranges },
			async edit(cb, opts = { undoStopBefore: true, undoStopAfter: true }) {
				const reps = []
				cb({ replace: (r, text) => reps.push({ r, text }) })
				log.edits.push({ reps: reps.map(({ r, text }) => ({ line: r.start.line, start: r.start.character, end: r.end.character, text })), before: opts.undoStopBefore, after: opts.undoStopAfter })
				for (const { r, text } of reps.sort((a, b) => b.r.start.compareTo(a.r.start))) {
					if (r.start.line !== r.end.line) throw new Error('mock: single-line replacements only')
					const ln = r.start.line, s = doc.lines[ln], delta = text.length - (r.end.character - r.start.character)
					doc.lines[ln] = s.slice(0, r.start.character) + text + s.slice(r.end.character)
					const move = p => p.line !== ln || p.character < r.start.character ? p : p.character <= r.end.character ? new Position(ln, r.start.character + text.length) : new Position(ln, p.character + delta)
					this.selections = this.selections.map(sel => new Selection(move(sel.anchor), move(sel.active)))
				}
				if (reps.length) { doc.version++; fire('document', { document: doc }); fire('selection', { textEditor: editor }) }
				return true
			},
		}
		tab = { input: new TabInputText(doc.uri) }
		fire('editor', editor)
		fire('selection', { textEditor: editor })
		return editor
	}
	const select = (...sels) => { editor.selections = sels.map(([l1, c1, l2, c2]) => new Selection(new Position(l1, c1), new Position(l2, c2))); fire('selection', { textEditor: editor }) }
	// an image opened in its own tab: no text editor is active; null goes back to the document
	const setTab = u => { tab = u ? { input: new TabInputCustom(Uri.parse(u), 'imagePreview.previewEditor') } : { input: new TabInputText(editor.document.uri) }; fire('tabs', {}) }

	const config = { gamut: 'p3' }
	const setGamut = g => { config.gamut = g; fire('config', { affectsConfiguration: k => k === 'colorSpace' || k === 'colorSpace.gamut' }) }

	// the webview view: resolved by the check, which wires the page
	const view = {
		visible: true,
		webview: {
			options: {}, html: '',
			postMessage: msg => { view.bridge?.toPage(msg); return Promise.resolve(true) },
			onDidReceiveMessage: f => { view.receive = f; return { dispose() {} } },
		},
		onDidChangeVisibility: () => ({ dispose() {} }),
		onDidDispose: () => ({ dispose() {} }),
	}

	const vscode = {
		Position, Range, Selection, Uri, TabInputText, TabInputCustom,
		TextEditorRevealType: { InCenterIfOutsideViewport: 2 },
		ThemeColor: class { constructor(id) { this.id = id } },
		MarkdownString: class { constructor(value) { this.value = value } },
		Hover: class { constructor(contents, range) { this.contents = contents; this.range = range } },
		McpStdioServerDefinition: class { constructor(label, command, args, env, version) { Object.assign(this, { label, command, args, env, version }) } },
		window: {
			get activeTextEditor() { return tab && tab.input instanceof TabInputCustom ? undefined : editor },
			tabGroups: { get activeTabGroup() { return { activeTab: tab } }, onDidChangeTabs: on('tabs') },
			onDidChangeTextEditorSelection: on('selection'),
			onDidChangeActiveTextEditor: on('editor'),
			registerWebviewViewProvider: (id, provider) => { log.providers[id] = provider; return { dispose() {} } },
			showTextDocument: async () => editor,
			showQuickPick: async (items, o) => { log.quickPick = { items, o }; return log.pickAnswer ? items.find(log.pickAnswer) : undefined },
			showInformationMessage: async m => { log.info.push(m) },
			createTextEditorDecorationType: o => ({ ...o, dispose() {} }),
		},
		workspace: {
			getConfiguration: section => ({ get: k => section === 'colorSpace' ? config[k] : undefined }),
			getWorkspaceFolder: () => undefined,
			onDidChangeTextDocument: on('document'),
			onDidChangeConfiguration: on('config'),
			fs: {
				isWritableFileSystem: scheme => scheme === 'git' ? false : scheme === 'file' ? true : undefined,
				stat: async u => ({ size: statSync(u.path).size }),
				readFile: async u => new Uint8Array(readFileSync(u.path)),
			},
		},
		languages: { registerHoverProvider: (sel, p) => { log.hover = p; return { dispose() {} } } },
		commands: {
			registerCommand: (id, f) => { log.commands[id] = f; return { dispose() {} } },
			executeCommand: async (id, ...a) => { log.opened.push(id); return log.commands[id]?.(...a) },
		},
		env: { openExternal: async u => { log.opened.push(u.toString()) } },
		lm: { registerMcpServerDefinitionProvider: (id, p) => { log.mcp = { id, p }; return { dispose() {} } } },
	}
	return { vscode, log, open, select, setTab, setGamut, view, get editor() { return editor } }
}

/** Require `file` (CommonJS) afresh, with `require('vscode')` answered by `vscode`. */
export function requireWith(file, vscode) {
	const load = Module._load, req = Module.createRequire(import.meta.url)
	delete req.cache[req.resolve(file)]   // each session its own module, bound to its own mock
	Module._load = function (r, ...rest) { return r === 'vscode' ? vscode : load.call(this, r, ...rest) }
	try { return req(file) } finally { Module._load = load }
}
