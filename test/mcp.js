// Drive the MCP server as a real client would: spawn the process, speak
// newline-delimited JSON-RPC over stdio, assert the tool results against the
// scalar library. Pins both protocol eras (the legacy initialize handshake and
// 2026-07-28's per-request _meta), the tool contract (titles, read-only
// annotations, closed inputs, structured outputs) and the tools' honesty
// (convert matches space.rgb.oklch, gamut matches the site's ladder, cube parses).
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import test, { is, ok } from 'tst'
import Color from 'colorjs.io'
import space from '../index.js'
import { parse } from '../css.js'
import NAMES from '../web/js/names.js'
import { fetch as httpFetch } from '../mcp.js'
import data from '../data.json' with { type: 'json' }
import pkg from '../package.json' with { type: 'json' }

const srv = spawn('node', [new URL('../mcp.js', import.meta.url).pathname])
const pending = new Map()
let buf = ''
srv.stdout.on('data', (d) => {
	buf += d
	let i
	while ((i = buf.indexOf('\n')) >= 0) {
		const line = buf.slice(0, i); buf = buf.slice(i + 1)
		if (!line.trim()) continue
		const msg = JSON.parse(line)
		pending.get(msg.id)?.(msg); pending.delete(msg.id)
	}
})
let nid = 0
const call = (method, params) => new Promise((resolve, reject) => {
	const id = ++nid
	pending.set(id, resolve)
	setTimeout(() => { if (pending.delete(id)) reject(Error(`timeout: ${method}`)) }, 8000)
	srv.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n')
})
const text = (r) => r.result.content[0].text
const tool = async (name, args) => (await call('tools/call', { name, arguments: args })).result
const P = 'io.modelcontextprotocol/'
const META = { [P + 'protocolVersion']: '2026-07-28', [P + 'clientCapabilities']: {}, [P + 'clientInfo']: { name: 'test', version: '0' } }
const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps

test('mcp: legacy initialize negotiates the protocol version', async () => {
	for (const v of ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05']) {
		const r = await call('initialize', { protocolVersion: v, capabilities: {}, clientInfo: { name: 'test', version: '0' } })
		is(r.result.protocolVersion, v, `echoes supported ${v}`)
	}
	const init = await call('initialize', { protocolVersion: '2099-01-01', capabilities: {}, clientInfo: { name: 'future', version: '0' } })
	is(init.result.protocolVersion, '2025-11-25', 'an unknown version gets our latest, never an echo')
	is(init.result.serverInfo.name, 'color-space', 'server name')
	is(init.result.serverInfo.version, pkg.version, 'server version from package.json')
	ok(!('resultType' in init.result), 'legacy results carry no resultType')
	srv.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n')
	is((await call('ping')).result, {}, 'legacy ping')
})

test('mcp: 2026-07-28 — discover, resultType, cache hints, version errors', async () => {
	const d = await call('server/discover', { _meta: META })
	is(d.result.resultType, 'complete', 'resultType')
	is(d.result.supportedVersions, ['2026-07-28'], 'supported per-request versions')
	ok(d.result.ttlMs >= 0 && d.result.cacheScope === 'public', 'discover carries cache hints')
	is(d.result._meta[P + 'serverInfo'].name, 'color-space', 'serverInfo in result _meta')
	const l = await call('tools/list', { _meta: META })
	ok(l.result.ttlMs >= 0 && l.result.cacheScope === 'public', 'tools/list carries cache hints')
	const c = await call('tools/call', { _meta: META, name: 'convert', arguments: { from: 'rgb', to: 'lab', values: [0, 0, 0] } })
	is(c.result.resultType, 'complete', 'tool results carry resultType')
	const old = await call('tools/list', { _meta: { ...META, [P + 'protocolVersion']: '1900-01-01' } })
	is(old.error.code, -32022, 'unsupported version → -32022')
	is(old.error.data, { supported: ['2026-07-28'], requested: '1900-01-01' }, 'names what it supports')
	const bare = await call('tools/list', { _meta: { [P + 'protocolVersion']: '2026-07-28' } })
	is(bare.error.code, -32602, 'missing clientCapabilities → -32602')
	is((await call('ping', { _meta: META })).error.code, -32601, '2026-07-28 removed ping')
})

test('mcp: every tool is titled, read-only, closed, and typed', async () => {
	const { tools } = (await call('tools/list')).result
	is(tools.map((t) => t.name), ['convert', 'gamut', 'css', 'space', 'spaces', 'cube', 'shader', 'icc', 'code'], 'nine tools, deterministic order')
	for (const t of tools) {
		ok(t.title && t.annotations.title === t.title, `${t.name}: title`)
		is([t.annotations.readOnlyHint, t.annotations.destructiveHint, t.annotations.idempotentHint, t.annotations.openWorldHint], [true, false, true, false], `${t.name}: read-only hints`)
		is(t.inputSchema.additionalProperties, false, `${t.name}: closed input`)
		is(!!t.outputSchema, t.name !== 'cube', `${t.name}: output schema unless a LUT file`)
		if (t.outputSchema) is(t.outputSchema.type, 'object', `${t.name}: object-rooted output (2025-11-25 requires it)`)
	}
})

test('mcp: convert matches the scalar library; structured = text', async () => {
	const r = await tool('convert', { from: 'rgb', to: 'oklch', values: [255, 128, 0] })
	is(JSON.parse(r.content[0].text), r.structuredContent, 'the text block is the structured result, serialized')
	const got = r.structuredContent.colors[0].values, exp = space.rgb.oklch(255, 128, 0)
	for (let k = 0; k < 3; k++) ok(near(got[k], exp[k]), `ch${k}: ${got[k]} = ${exp[k]}`)
	is(r.structuredContent.channels.map((c) => c.symbol), ['L', 'C', 'H'], 'target channels')
})

test('mcp: convert batches tuples and flags each channel against its range', async () => {
	const b = (await tool('convert', { from: 'rgb', to: 'oklch', colors: [[255, 128, 0], [0, 255, 128]] })).structuredContent
	const exp = space.rgb.oklch([255, 128, 0, 0, 255, 128])
	is(b.colors.length, 2, 'two colors')
	b.colors.forEach((c, i) => c.values.forEach((v, k) => ok(near(v, exp[i * 3 + k]), `color ${i} ch${k} = the batch API`)))
	const out = (await tool('convert', { from: 'oklch', to: 'rgb', values: [0.7, 0.25, 150] })).structuredContent.colors[0]
	is(out.inRange, [false, true, true], 'R < 0: outside sRGB, flagged per channel')
	ok(out.values[0] < 0, 'unclamped out')
	const hue = (await tool('convert', { from: 'rgb', to: 'oklch', values: [128, 128, 128] })).structuredContent.colors[0]
	is(hue.inRange, [true, true, true], 'a hue angle wraps — always in range')
	const flat = await tool('convert', { from: 'rgb', to: 'oklch', values: [255, 128, 0, 0, 255, 128] })
	ok(flat.isError && /colors/.test(flat.content[0].text), 'a flat batch in values points at colors')
	ok((await tool('convert', { from: 'rgb', to: 'oklch', values: [1, 2, 3], colors: [[1, 2, 3]] })).isError, 'values and colors are exclusive')
	const extra = await tool('convert', { from: 'rgb', to: 'oklch', value: [1, 2, 3] })
	ok(extra.isError && /unknown argument 'value'/.test(extra.content[0].text), 'unknown arguments are named')
})

test('mcp: unknown spaces suggest ids and display names', async () => {
	const typo = await tool('convert', { from: 'okclh', to: 'rgb', values: [0.7, 0.1, 30] })
	is(typo.isError, true, 'a tool error, not a crash')
	ok(/unknown space 'okclh' — did you mean oklch, oklab, okhsl\?/.test(typo.content[0].text), typo.content[0].text)   // a name that is only the id recased adds nothing
	const name = await tool('space', { name: 'Display P3' })
	ok(/did you mean p3 \(Display P3\)/.test(name.content[0].text), name.content[0].text)
	const cie = await tool('gamut', { from: 'CIELAB', values: [50, 0, 0] })
	ok(/did you mean lab \(CIELAB\)/.test(cie.content[0].text), cie.content[0].text)
	const lch = await tool('space', { name: 'CIELChab' })
	ok(/did you mean lchab \(CIELChab\)/.test(lch.content[0].text), lch.content[0].text)   // the site's pinned names, not a second derivation
	const aka = await tool('space', { name: 'F-Gamut' })
	ok(/did you mean rec2020-linear/.test(aka.content[0].text), aka.content[0].text)   // another name for the same math (@aka) points at the space
})

test('mcp: display names are the site\'s – data.json spaces[id].title, one source', async () => {
	const { disp } = await import('../web/js/render.js')
	for (const s of ['lalphabeta', 'okhsl', 'ycbcr-bt601-525', 'slog3', 'p3']) {
		const d = (await tool('space', { name: s })).structuredContent
		is(d.title, disp(s), `${s}: ${d.title}`)
	}
	const list = (await tool('spaces', { query: 'oklab' })).structuredContent.spaces
	is(list[0].title, disp(list[0].name), 'the catalog list carries it too')
})

test('mcp: gamut walks the site ladder sRGB ⊂ Display P3 ⊂ Rec. 2020', async () => {
	const g = (await tool('gamut', { from: 'oklch', values: [0.7, 0.25, 150] })).structuredContent
	is(g.gamuts.map((x) => x.gamut), ['srgb', 'display-p3', 'rec2020'], 'the ladder, ids as in data.json gamuts')
	ok(g.gamuts.every((x) => data.gamuts[x.gamut].white === x.white), 'whites from data.json')
	is(g.smallest, 'display-p3', 'outside sRGB, inside P3')
	const p3 = space.oklch.p3(0.7, 0.25, 150)
	g.gamuts[1].values.forEach((v, k) => ok(near(v, p3[k]), `p3 ch${k} straight from the source`))
	is((await tool('gamut', { from: 'rgb', values: [255, 128, 0] })).structuredContent.smallest, 'srgb', 'an sRGB color')
	is((await tool('gamut', { from: 'xyz', values: [10, 80, 5] })).structuredContent.smallest, null, 'beyond Rec. 2020')
})

test('mcp: css writes CSS Color 4 strings, null where CSS would clamp', async () => {
	const c = (await tool('css', { from: 'oklch', values: [0.7, 0.15, 150] })).structuredContent
	const at = (s) => c.css.find((x) => x.space === s).css
	is(c.gamut, 'srgb', 'inside sRGB')
	is(c.hex, '#' + space.oklch.rgb(0.7, 0.15, 150).map((x) => Math.round(x).toString(16).padStart(2, '0')).join(''), 'hex from the rgb conversion')
	is(at('oklch'), 'oklch(0.7 0.15 150)', 'oklch(), trailing zeros dropped as CSS serializes')
	is(at('rgb'), `rgb(${space.oklch.rgb(0.7, 0.15, 150).map(Math.round).join(' ')})`, 'rgb()')
	ok(/^lab\(\d+(\.\d{1,3})?% -?\d+(\.\d{1,3})? -?\d+(\.\d{1,3})?\)$/.test(at('lab')), 'lab() with a percent lightness, ≤ 3 places')
	ok(/^color\(display-p3 [\d.]+ [\d.]+ [\d.]+\)$/.test(at('p3')), 'color(display-p3 …)')
	ok(!c.css.some((x) => x.space === 'rec2020'), 'no color(rec2020): CSS now defines it with a 2.4 gamma, not our BT.2020 OETF')
	const wide = (await tool('css', { from: 'oklch', values: [0.7, 0.25, 150] })).structuredContent
	is(wide.hex, null, 'no hex outside sRGB')
	is(wide.css.filter((x) => x.css === null).map((x) => x.space), ['rgb', 'hsl', 'hwb'], 'the sRGB functions would clamp — null, never a wrong color')
	is(wide.gamut, 'display-p3', 'and says where it does fit')
	const only = (await tool('css', { from: 'rgb', values: [255, 0, 0], notations: ['hsl'] })).structuredContent
	is(only.css, [{ space: 'hsl', css: 'hsl(0 100% 50%)' }], 'notations narrows the list')
	// CSS Color 4's serialization minimums (≥ 5 places for oklch, 16 bits for xyz …) – every string
	// parses back (colorjs.io) to the same 8-bit sRGB color; the old 3-place xyz missed by ~8 levels
	for (const rgb of [[5, 5, 5], [1, 2, 3], [11, 251, 5], [248, 1, 213], [9, 241, 87]]) {
		const r = (await tool('css', { from: 'rgb', values: rgb })).structuredContent
		for (const { css } of r.css) {
			const back = new Color(css).to('srgb').coords.map((x) => x * 255)
			ok(back.every((x, k) => Math.abs(x - rgb[k]) < 0.5), `${css} → rgb(${rgb})`)
		}
	}
	const neg = (await tool('css', { from: 'oklch', values: [0.6, -0.1, 30] })).structuredContent
	is(neg.css.find((x) => x.space === 'oklch').css, null, 'a negative chroma clamps to 0 in CSS — null')
})

test('mcp: spaces searches by query, family and purpose', async () => {
	const all = (await tool('spaces', {})).structuredContent
	is(all.count, Object.keys(space).length, 'the whole catalog')
	ok(all.spaces.every((s) => s.family && Array.isArray(s.purpose)), 'family and purpose on every entry')
	const p3 = (await tool('spaces', { query: 'Display P3' })).structuredContent
	is(p3.spaces[0].name, 'p3', 'a display name finds its space first')
	const logs = (await tool('spaces', { family: 'Film & camera', purpose: 'grading', query: 'sony' })).structuredContent
	ok(logs.count > 0 && logs.spaces.every((s) => s.family === 'Film & camera' && s.purpose.includes('grading')), 'filters combine')
	ok(logs.spaces.some((s) => s.name === 'slog3'), 'Sony logs found')
	ok((await tool('spaces', { family: 'Nope' })).isError, 'an unknown family is a tool error')
})

test('mcp: space dossier carries provenance and refs', async () => {
	const r = await tool('space', { name: 'slog3' })
	const d = r.structuredContent
	is(JSON.parse(r.content[0].text), d, 'structured = text')
	is(d.year, 2014, 'year'); is(d.by, 'Sony', 'author')
	is(d.family, 'Film & camera', 'family')
	ok(d.neighbors.includes('xyz'), 'direct neighbour edge')
	ok(Array.isArray(d.refs) && d.refs.length > 0, 'defining references present')
})

test('mcp: CSS strings parse as CSS Color 4 does (vs colorjs)', () => {
	// every notation, units, percentages, none and legacy syntax: our parse + convert lands where colorjs.io's parser does
	const strs = ['#f80', '#ff8000cc', 'rebeccapurple', 'rgb(255 128 0)', 'rgba(255, 128, 0, 0.5)', 'rgb(100% 50% 0% / 50%)',
		'hsl(30 100% 50%)', 'hsl(30deg, 100%, 50%)', 'hsl(0.5turn 100% 50%)', 'hwb(1rad 10% 20%)', 'lab(54% 80 67)', 'lab(54 64% -10%)',
		'lch(50% 50% 90)', 'oklab(0.7 0.1 -0.1)', 'oklab(70% 25% 25%)', 'oklch(70% 0.1 50)', 'oklch(0.7 25% 200grad)',
		'color(display-p3 1 0.5 0)', 'color(srgb 100% 50% 0%)', 'color(srgb-linear 0.5 0.2 0.1)', 'color(a98-rgb 0.4 0.5 0.6)',
		'color(prophoto-rgb 0.4 0.5 0.6)', 'color(xyz-d65 0.4 0.2 0.02)', 'color(xyz-d50 0.4 0.2 0.02)', 'color(xyz 0.4 0.2 0.02)']
	// compared in the parsed space itself (colorjs id, scale): parsing only, no conversion in between
	const CJ = { rgb: ['srgb', 255], hsl: ['hsl', 1], hwb: ['hwb', 1], lab: ['lab', 1], lchab: ['lch', 1], oklab: ['oklab', 1], oklch: ['oklch', 1], p3: ['p3', 1],
		lrgb: ['srgb-linear', 1], a98rgb: ['a98rgb', 1], prophoto: ['prophoto', 1], xyz: ['xyz-d65', 100], 'xyz-d50': ['xyz-d50', 100], 'rec2020-linear': ['rec2020-linear', 1] }
	for (const t of strs) {
		const p = parse(t, NAMES), [id, k] = CJ[p.space], exp = new Color(t).to(id).coords.map((x) => (Number.isNaN(x) ? 0 : x) * k)
		ok(p.values.every((v, i) => Math.abs(v - exp[i]) < 1e-9 * Math.max(1, Math.abs(exp[i]))), `${t} → ${p.space} [${p.values.map((x) => +x.toFixed(6))}] vs colorjs ${id} [${exp.map((x) => +x.toFixed(6))}]`)
	}
	is([parse('#ff8000cc').alpha, parse('rgba(255, 128, 0, 0.5)').alpha, parse('transparent').alpha], [0.8, 0.5, 0], 'alpha read apart')
	is(parse('oklch(none 0.1 50)').values, [0, 0.1, 50], 'none = 0')
	// CSS's rec2020 is BT.1886's 2.4 gamma (CSS Color 4 §10.8; colorjs 0.7 agrees, 0.5 still used the BT.2020 OETF)
	is(parse('color(rec2020 0.6 0.4 0.2)'), { space: 'rec2020-linear', values: [0.6 ** 2.4, 0.4 ** 2.4, 0.2 ** 2.4], alpha: 1 }, 'color(rec2020) decodes 2.4 onto rec2020-linear')
	is(parse('hsl(0.5turn 100 50)').values, [180, 100, 50], 'modern hsl() takes bare numbers as percentages (CSS Color 4 §7.1; colorjs 0.5 predates it)')
	for (const bad of ['nope', 'rgb(1 2)', '#12345', 'hsl(30, 100, 50)', 'color(foo 1 2 3)', 'rebeccapurple']) is(parse(bad), undefined, `${bad} is not a CSS color${bad === 'rebeccapurple' ? ' without the names table' : ''}`)
})

test('mcp: a color goes in as a CSS string – convert, batches, gamut, css', async () => {
	const c = (await tool('convert', { color: 'oklch(0.7 0.1 50)', to: 'rgb' })).structuredContent
	is(c.colors[0].from, 'oklch', 'the string names its own space')
	ok(c.colors[0].values.every((v, k) => near(v, space.oklch.rgb(0.7, 0.1, 50)[k])), 'same as the values route')
	const b = (await tool('convert', { from: 'rgb', to: 'lab', colors: ['rebeccapurple', [255, 0, 0], '#00ff80'] })).structuredContent
	is(b.colors.map((x) => x.from), ['rgb', 'rgb', 'rgb'], 'strings and tuples mix in one batch')
	ok(b.colors[0].values.every((v, k) => near(v, space.rgb.lab(102, 51, 153)[k])), 'a named color')
	const tup = await tool('convert', { to: 'lab', colors: [[1, 2, 3]] })
	ok(tup.isError && /pass `from`/.test(tup.content[0].text), 'a tuple without from says so')
	const bad = await tool('gamut', { color: 'nope' })
	ok(bad.isError && /not a CSS color/.test(bad.content[0].text), 'an unparseable string says what parses')
	is((await tool('gamut', { color: 'color(display-p3 1 0 0)' })).structuredContent.smallest, 'display-p3', 'gamut from a string')
	is((await tool('css', { color: '#d18c65', notations: ['rgb'] })).structuredContent.css[0].css, 'rgb(209 140 101)', 'css from a string')
	ok((await tool('css', { color: '#fff', from: 'rgb', values: [1, 2, 3] })).isError, 'values and color are exclusive')
})

test('mcp: shader writes the conversion in four languages', async () => {
	const g = (await tool('shader', { from: 'rgb', to: 'oklch' })).structuredContent
	is([g.language, g.entry], ['glsl', 'rgb_oklch'], 'GLSL by default, the entry named')
	ok(/vec3 rgb_oklch\(vec3 c\)/.test(g.code), 'the entry function is in the source')
	const w = (await tool('shader', { from: 'lab-d65', to: 'p3', language: 'wgsl' })).structuredContent
	ok(/fn labd65_p3\(/.test(w.code), 'WGSL, hyphens stripped from the entry')
	const h = (await tool('shader', { from: 'rgb', to: 'oklab', language: 'hlsl' })).structuredContent
	ok(/float3 rgb_oklab\(/.test(h.code), 'HLSL through naga')
	ok((await tool('shader', { from: 'rgb', to: 'oklab', language: 'cuda' })).isError, 'other languages refused')
})

test('mcp: icc returns the profile as an embedded resource', async () => {
	const r = await tool('icc', { name: 'p3' })
	is([r.structuredContent.class, r.structuredContent.pcs], ['mntr', 'XYZ'], 'an RGB working space: matrix + TRC display profile')
	const blob = r.content[1].resource, bytes = Buffer.from(blob.blob, 'base64')
	is([blob.mimeType, bytes.length], ['application/vnd.iccprofile', r.structuredContent.bytes], 'the bytes, base64')
	is(bytes.toString('latin1', 36, 40), 'acsp', 'an ICC header')
	const c = (await tool('icc', { name: 'oklch', grid: 9 })).structuredContent
	is([c.class, c.pcs], ['scnr', 'Lab'], 'anything else: a CLUT on a Lab PCS')
})

test('mcp: code gives the JS call and the verified Python', async () => {
	const r = (await tool('code', { color: '#ff8000', to: 'oklab' })).structuredContent
	ok(r.js.includes("space.rgb.oklab(255, 128, 0)"), 'the JS call with the parsed values')
	ok(/rgb = \[255, 128, 0\]/.test(r.python) && /v = colour\./.test(r.python), 'colour-science snippet at the same color')
	ok(/oklab/.test(r.pythonFor), 'says which pair it is')
	const x = (await tool('code', { from: 'oklch', to: 'lab-d65' })).structuredContent
	ok(x.js.includes("space.oklch['lab-d65']("), 'hyphenated ids index as strings')
	is(x.python, null, 'no sRGB side: no Python pair')
})

test('mcp: resources – the catalog and one dossier per space', async () => {
	const l = (await call('resources/list')).result.resources
	is(l.map((r) => r.uri), ['color-space://data.json'], 'data.json listed')
	is((await call('resources/templates/list')).result.resourceTemplates[0].uriTemplate, 'color-space://space/{name}', 'a dossier template')
	const d = JSON.parse((await call('resources/read', { uri: 'color-space://space/oklch' })).result.contents[0].text)
	is([d.name, d.title], ['oklch', 'OKLCH'], 'one dossier')
	is((await call('resources/read', { uri: 'color-space://space/nope' })).error.code, -32002, 'unknown → resource not found')
})

test('mcp: Streamable HTTP – POST JSON-RPC, 202 for notifications, CORS', async () => {
	const post = (b) => httpFetch(new Request('http://x/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }))
	const r = await post({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'convert', arguments: { color: '#ff8000', to: 'oklch' } } })
	is([r.status, r.headers.get('access-control-allow-origin')], [200, '*'], 'JSON response, CORS open')
	ok(near((await r.json()).result.structuredContent.colors[0].values[0], space.rgb.oklch(255, 128, 0)[0]), 'the same tools')
	is((await post({ jsonrpc: '2.0', method: 'notifications/initialized' })).status, 202, 'a notification: accepted, no body')
	is((await httpFetch(new Request('http://x/'))).status, 405, 'GET: no event stream here')
	is((await httpFetch(new Request('http://x/', { method: 'POST', body: '{' }))).status, 400, 'bad JSON: parse error')
})

test('mcp: cube tool emits a parseable LUT', async () => {
	const r = await call('tools/call', { name: 'cube', arguments: { from: 'slog3', to: 'rec709', size: 5 } })
	const t = text(r)
	ok(!r.result.structuredContent, 'a file, not structured data')
	is(/LUT_3D_SIZE 5/.test(t), true, 'declares the lattice')
	is(t.trim().split('\n').filter((l) => /^[-\d]/.test(l)).length, 125, '5³ data lines')
	srv.stdin.end(); srv.kill()
})

test('mcp: server.json registers this package under its mcpName', () => {
	const s = JSON.parse(readFileSync(new URL('../server.json', import.meta.url)))
	is(s.name, pkg.mcpName, 'registry name = package.json mcpName (the registry checks it on npm)')
	ok(s.description.length <= 100, 'description ≤ 100 chars (schema maxLength)')
	ok(s.description.includes(`${Object.keys(space).length} `), 'description states the live space count')
	const [p] = s.packages
	is([p.registryType, p.identifier, p.transport.type], ['npm', pkg.name, 'stdio'], 'the npm package over stdio')
	is(p.packageArguments, [{ type: 'positional', value: 'mcp' }], 'npx -y color-space mcp — the bare bin is the CLI')
	ok(!/[\^~<>*x|]/.test(s.version) && s.version === p.version, 'one pinned version (release.yml syncs it to package.json)')
	const plugin = JSON.parse(readFileSync(new URL('../.claude-plugin/plugin.json', import.meta.url)))
	is([plugin.name, plugin.version, plugin.mcpServers['color-space'].args], ['color-space', pkg.version, ['-y', 'color-space', 'mcp']], 'the Claude plugin wraps this version\'s server')
})
