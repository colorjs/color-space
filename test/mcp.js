// Drive the MCP server as a real client would: spawn the process, speak
// newline-delimited JSON-RPC over stdio, assert the tool results against the
// scalar library. Pins the protocol shape (initialize / tools/list / tools/call)
// and the tools' honesty (convert matches space.rgb.oklch, cube parses).
import { spawn } from 'node:child_process'
import test, { is } from 'tst'
import space from '../index.js'

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

test('mcp: initialize → serverInfo, tools listed', async () => {
	const init = await call('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'test', version: '0' } })
	is(init.result.serverInfo.name, 'color-space', 'server name')
	is(init.result.protocolVersion, '2025-03-26', 'negotiates the supported protocol version')
	const future = await call('initialize', { protocolVersion: '2099-01-01', capabilities: {}, clientInfo: { name: 'future', version: '0' } })
	is(future.result.protocolVersion, '2025-03-26', 'does not claim support for an unknown client version')
	srv.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n')
	const tools = await call('tools/list')
	is(tools.result.tools.map((t) => t.name).sort(), ['convert', 'cube', 'space', 'spaces'], 'four tools')
})

test('mcp: convert matches the scalar library', async () => {
	const r = await call('tools/call', { name: 'convert', arguments: { from: 'rgb', to: 'oklch', values: [255, 128, 0] } })
	const got = JSON.parse(text(r)).oklch
	const exp = space.rgb.oklch(255, 128, 0)
	for (let k = 0; k < 3; k++) is(Math.abs(got[k] - exp[k]) < 1e-9, true, `ch${k}: ${got[k]} = ${exp[k]}`)
})

test('mcp: space dossier carries provenance and refs; errors stay in-band', async () => {
	const r = await call('tools/call', { name: 'space', arguments: { name: 'slog3' } })
	const d = JSON.parse(text(r))
	is(d.year, 2014, 'year'); is(d.by, 'Sony', 'author')
	is(d.neighbors.includes('xyz'), true, 'direct neighbour edge')
	is(Array.isArray(d.refs) && d.refs.length > 0, true, 'defining references present')
	const bad = await call('tools/call', { name: 'convert', arguments: { from: 'nope', to: 'rgb', values: [1, 2, 3] } })
	is(bad.result.isError, true, 'unknown space is a tool error, not a crash')
	is(/unknown space/.test(text(bad)), true, 'error names the problem')
})

test('mcp: cube tool emits a parseable LUT', async () => {
	const r = await call('tools/call', { name: 'cube', arguments: { from: 'slog3', to: 'rec709', size: 5 } })
	const t = text(r)
	is(/LUT_3D_SIZE 5/.test(t), true, 'declares the lattice')
	is(t.trim().split('\n').filter((l) => /^[-\d]/.test(l)).length, 125, '5³ data lines')
	srv.stdin.end(); srv.kill()
})
