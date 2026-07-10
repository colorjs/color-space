#!/usr/bin/env node
/**
 * color-space MCP server — the registry as tools for AI agents, zero dependencies.
 *
 * Color math is exactly what language models hallucinate: plausible matrices,
 * wrong in the third decimal. This server lets an agent call the verified
 * conversions instead of guessing. MCP stdio transport = newline-delimited
 * JSON-RPC 2.0, small enough to speak directly — no SDK.
 *
 *     { "mcpServers": { "color-space": { "command": "npx", "args": ["color-space-mcp"] } } }
 *
 * Tools: convert (any of 156×155 pairs) · space (the full dossier: formula refs,
 * ranges, provenance, neighbours) · spaces (the catalog) · cube (a .cube LUT).
 * @see {@link https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#stdio}
 */
import { createInterface } from 'node:readline'
import space from './index.js'
import data from './data.json' with { type: 'json' }
import { cube, channelwise } from './lut.js'

const meta = data.spaces

const VERSION = '3.0.0'
const names = Object.keys(space)

const TOOLS = [
	{
		name: 'convert',
		description: 'Convert channel values between any two of the 156 color spaces (conventional ranges: rgb 0-255, oklch L 0-1 / C 0-0.4 / H 0-360, lab L 0-100 …). Formulas are differentially verified against colorjs.io / cited specs.',
		inputSchema: {
			type: 'object',
			properties: {
				from: { type: 'string', description: "source space, e.g. 'rgb', 'slog3'" },
				to: { type: 'string', description: "target space, e.g. 'oklch', 'rec709'" },
				values: { type: 'array', items: { type: 'number' }, description: 'source channel values, in the source space conventional ranges' },
			},
			required: ['from', 'to', 'values'],
		},
	},
	{
		name: 'space',
		description: 'The dossier of one color space: description, channels + conventional ranges, defining references, provenance (year, author), illuminant/observer, encoding class, and its direct conversion neighbours.',
		inputSchema: {
			type: 'object',
			properties: { name: { type: 'string', description: "space id, e.g. 'oklch', 'slog3', 'cam16'" } },
			required: ['name'],
		},
	},
	{
		name: 'spaces',
		description: 'List all 156 registered color spaces with channels and one-line usage.',
		inputSchema: { type: 'object', properties: {} },
	},
	{
		name: 'cube',
		description: 'Render a conversion as a .cube LUT file (Resolve, Premiere, Final Cut, OBS, ffmpeg). The header carries the measured deviation vs the direct conversion. Pure per-channel transfers auto-emit 1D. Size ≤ 33 here (larger via the library or https://colorjs.github.io/color-space/).',
		inputSchema: {
			type: 'object',
			properties: {
				from: { type: 'string' }, to: { type: 'string' },
				size: { type: 'number', description: '3D lattice size, 2-33 (default 17)' },
			},
			required: ['from', 'to'],
		},
	},
]

const need = (name) => {
	if (!space[name]) throw Error(`unknown space '${name}' — call the 'spaces' tool for the list`)
	return space[name]
}

const CALL = {
	convert({ from, to, values }) {
		const f = need(from), t = need(to)
		const n = (meta[from]?.channels || f.range || []).length
		if (!Array.isArray(values) || values.length !== n) throw Error(`${from} takes ${n} values (${(meta[from]?.channels || []).map((c) => c.symbol).join(', ')})`)
		const out = f[to](...values)
		return JSON.stringify({
			[to]: out,
			channels: (meta[to]?.channels || []).map((c, i) => `${c.symbol} ${out[i]} (range ${c.min}…${c.max})`),
		}, null, 1)
	},
	space({ name }) {
		need(name)
		const m = meta[name] || {}
		const neighbors = names.filter((to) => { const f = space[name][to]
			return to !== name && typeof f === 'function' && !((f.scalar || f).chained) })
		return JSON.stringify({ name, ...m, neighbors, source: `https://github.com/colorjs/color-space/blob/master/spaces/${name}.js` }, null, 1)
	},
	spaces() {
		return JSON.stringify({
			count: names.length,
			spaces: names.map((n) => ({ name: n, channels: (meta[n]?.channels || []).map((c) => c.symbol).join(''), use: meta[n]?.use })),
		}, null, 1)
	},
	cube({ from, to, size }) {
		const f = need(from), t = need(to)
		size ??= channelwise(f, t) ? undefined : 17
		if (size !== undefined && !(size >= 2 && size <= 33)) throw Error('size 2-33 here — larger LUTs via the library or the site')
		return cube(f, t, { size })
	},
}

const rpc = (id, body) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, ...body }) + '\n')

export function handle(msg) {
	const { id, method, params } = msg
	if (method === 'initialize')
		return rpc(id, { result: {
			protocolVersion: params?.protocolVersion || '2025-03-26',
			capabilities: { tools: {} },
			serverInfo: { name: 'color-space', version: VERSION },
			instructions: 'Verified color conversions between 156 spaces. Use `convert` instead of computing color math yourself; `space` for authoritative references and ranges; `cube` for a LUT file.',
		} })
	if (method === 'ping') return rpc(id, { result: {} })
	if (method === 'tools/list') return rpc(id, { result: { tools: TOOLS } })
	if (method === 'tools/call') {
		const fn = CALL[params?.name]
		if (!fn) return rpc(id, { error: { code: -32602, message: `unknown tool '${params?.name}'` } })
		try { return rpc(id, { result: { content: [{ type: 'text', text: fn(params.arguments || {}) }] } }) }
		catch (e) { return rpc(id, { result: { content: [{ type: 'text', text: String(e.message || e) }], isError: true } }) }
	}
	if (method?.startsWith('notifications/')) return // no response to notifications
	if (id !== undefined) rpc(id, { error: { code: -32601, message: `method '${method}' not found` } })
}

// serve only when executed directly — importing this module must stay side-effect-free
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
	createInterface({ input: process.stdin }).on('line', (line) => {
		if (!line.trim()) return
		let msg; try { msg = JSON.parse(line) } catch { return rpc(null, { error: { code: -32700, message: 'parse error' } }) }
		try { handle(msg) } catch (e) { if (msg.id !== undefined) rpc(msg.id, { error: { code: -32603, message: String(e.message || e) } }) }
	})
}
