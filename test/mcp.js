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
	is(tools.map((t) => t.name), ['convert', 'gamut', 'css', 'space', 'spaces', 'cube'], 'six tools, deterministic order')
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
	ok(/unknown space 'okclh' — did you mean oklch \(OKLCH\), oklab \(Oklab\), okhsl \(OkHSL\)\?/.test(typo.content[0].text), typo.content[0].text)
	const name = await tool('space', { name: 'Display P3' })
	ok(/did you mean p3 \(Display P3\)/.test(name.content[0].text), name.content[0].text)
	const cie = await tool('gamut', { from: 'CIELAB', values: [50, 0, 0] })
	ok(/did you mean lab \(CIELAB\)/.test(cie.content[0].text), cie.content[0].text)
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
})
