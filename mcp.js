#!/usr/bin/env node
/**
 * color-space MCP server — the registry as tools for AI agents, zero dependencies.
 *
 * Color math is exactly what language models hallucinate: plausible matrices,
 * wrong in the third decimal. This server lets an agent call the verified
 * conversions instead of guessing. MCP stdio transport = newline-delimited
 * JSON-RPC 2.0, small enough to speak directly — no SDK.
 *
 *     npx -y color-space mcp
 *     { "mcpServers": { "color-space": { "command": "npx", "args": ["-y", "color-space", "mcp"] } } }
 *
 * Tools: convert (any pair, batches, per-channel range flags) · gamut (which display gamut
 * holds a color) · css (CSS Color 4 strings) · space (the full dossier: refs, ranges,
 * provenance, neighbours) · spaces (the catalog, searchable) · cube (a .cube LUT).
 *
 * One process serves both protocol eras:
 * - legacy (2024-11-05 … 2025-11-25): an `initialize` handshake; the requested version is
 *   echoed when supported, else the latest one offered.
 *   @see https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle#version-negotiation
 * - modern (2026-07-28): no handshake — each request carries its version and client
 *   capabilities in _meta; server/discover MUST exist; every result carries resultType;
 *   discover and list results carry ttlMs + cacheScope.
 *   @see https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning
 *   @see https://modelcontextprotocol.io/specification/2026-07-28/server/discover
 *   @see https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/caching
 * @see https://modelcontextprotocol.io/specification/2025-11-25/basic/transports#stdio
 */
import { realpathSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'
import space from './index.js'
import data from './data.json' with { type: 'json' }
import pkg from './package.json' with { type: 'json' }
import { cube, channelwise } from './lut.js'
import { css, exact, hex, CSSABLE } from './css.js'
import CATS from './web/js/categories.js'
import PURPOSE, { ORDER as PURPOSES } from './web/js/purpose.js'

const meta = data.spaces
const names = Object.keys(space)
const N = names.length

const LEGACY = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05']   // newest first: [0] is offered to unknown versions
const MODERN = ['2026-07-28']
const P = 'io.modelcontextprotocol/'
const TTL = 3600000   // the tool list changes only with the package version
const SERVER = { name: 'color-space', version: pkg.version, description: `Verified conversions between ${N} color spaces`, websiteUrl: 'https://color-space.io/' }
const INSTRUCTIONS = `Verified color conversions between ${N} spaces — call these instead of computing color math yourself. \`convert\` any pair (batches too; flags values outside the target's range), \`gamut\` for which display gamut holds a color, \`css\` for CSS Color 4 strings, \`space\` / \`spaces\` for references, ranges and provenance, \`cube\` for a .cube LUT.`

// ── catalog vocabulary: the site's own families and purposes, not a new taxonomy
const FAMILY = Object.fromEntries(CATS.flatMap((c) => c.spaces.map((s) => [s, c.name])))
const FAMILIES = CATS.map((c) => c.name)
const chans = (s) => (meta[s]?.channels || []).map(({ symbol, name, min, max }) => ({ symbol, name, min, max }))
const count = (s) => (meta[s]?.channels || space[s].range).length
const num = (x) => Number.isFinite(x) ? x : null   // JSON has no NaN: a coordinate outside a space's domain reads null
// a channel is cyclic when it is a hue angle — 0–360 or a renamed wheel (munsell H, coloroid A); the site's LUTTGT test
const cyclic = (c) => c.max === 360 || /hue/i.test(c.name)
// conventional range, 1e-4 of the span as slack for float noise; cyclic channels wrap, so any finite angle is in range
const inRange = (s, v) => (meta[s]?.channels || []).map((c, i) => Number.isFinite(v[i])
	&& (cyclic(c) || (v[i] >= c.min - 1e-4 * (c.max - c.min) && v[i] <= c.max + 1e-4 * (c.max - c.min))))

// ── "did you mean": edit distance over ids and display names — data.json's spaces[id].title, the
// names the site shows (scripts/generate-data.js); '' where the name is just the id (HSV for hsv)
const norm = (x) => String(x).toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
const TITLE = Object.fromEntries(names.map((s) => { const t = meta[s]?.title || ''
	return [s, norm(t) === norm(s) ? '' : t] }))
const lev = (a, b) => {
	const d = Array.from({ length: b.length + 1 }, (_, j) => j)
	for (let i = 1; i <= a.length; i++) {
		let p = d[0]; d[0] = i
		for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, p + (a[i - 1] === b[j - 1] ? 0 : 1)); p = t }
	}
	return d[b.length]
}
// ties go to the id sharing the longer prefix: okclh → oklch, oklab, okhsl — not hcl, dkl
const prefix = (a, b) => { let i = 0; while (i < a.length && a[i] === b[i]) i++; return i }
const suggest = (q) => {
	const k = norm(q)
	return names.map((s) => [s, Math.min(lev(k, norm(s)), TITLE[s] ? lev(k, norm(TITLE[s])) : Infinity), prefix(k, norm(s))])
		.sort((a, b) => a[1] - b[1] || b[2] - a[2] || a[0].length - b[0].length).slice(0, 3)
		.map(([s]) => TITLE[s] ? `${s} (${TITLE[s]})` : s)
}
const need = (s) => {
	if (typeof s !== 'string' || !s) throw Error(`expected a space id, e.g. 'rgb' or 'oklch' (the 'spaces' tool lists all ${N})`)
	if (Object.hasOwn(space, s)) return space[s]
	throw Error(`unknown space '${s}' — did you mean ${suggest(s).join(', ')}? (the 'spaces' tool lists all ${N})`)
}
const tuple = (s, v, what = 'values') => {
	const k = count(s)
	if (!Array.isArray(v) || v.length !== k || !v.every(Number.isFinite))
		throw Error(`${what}: ${s} takes ${k} numbers (${chans(s).map((c) => `${c.symbol} ${c.min}…${c.max}`).join(', ')})${what === 'values' && Array.isArray(v) && v.length > k && v.length % k === 0 ? ' — several colors go in `colors`, one tuple each' : ''}`)
	return v
}
const args = (tool, a) => {
	const known = Object.keys(TOOLS.find((t) => t.name === tool).inputSchema.properties)
	const extra = Object.keys(a).filter((k) => !known.includes(k))
	if (extra.length) throw Error(`unknown argument${extra.length > 1 ? 's' : ''} ${extra.map((k) => `'${k}'`).join(', ')} — ${tool} takes ${known.join(', ')}`)
	return a
}

// ── the site's gamut pill (web/index.html gamutOf): convert straight from the source — never
// through clamped rgb — and test each display gamut's box, smallest first, with its 1e-4 slack.
// The site's further rungs (object-color solid, spectral locus) live in its own module, not the package.
const LADDER = [['srgb', 'rgb', 255], ['display-p3', 'p3', 1], ['rec2020', 'rec2020', 1]]   // ids = data.json gamuts
const box = (v, hi) => v.every((x) => x >= -1e-4 && x <= hi + 1e-4)
const ladder = (from, v) => LADDER.map(([gamut, s, hi]) => {
	let w = null; try { w = Array.from(from === s ? v : space[from][s](...v)) } catch {}
	return { gamut, space: s, white: data.gamuts[gamut].white, primaries: data.gamuts[gamut].primaries, inside: !!w && box(w, hi), values: w ? w.map(num) : null }
})

// ── tool schemas
const RO = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
const SPACE = (what) => ({ type: 'string', description: `${what} space id, e.g. 'rgb', 'oklch', 'lab', 'slog3', 'rec709' (the 'spaces' tool lists all ${N})` })
const MAXCH = Math.max(...names.map(count))
const COLOR = { type: 'array', items: { type: 'number' }, minItems: 1, maxItems: MAXCH }
const NUMS = { type: 'array', items: { type: ['number', 'null'] } }
const CHANNEL = { type: 'object', required: ['symbol', 'name', 'min', 'max'], properties: { symbol: { type: 'string' }, name: { type: 'string' }, min: { type: 'number' }, max: { type: 'number' } } }
const CHANNELS = { type: 'array', items: CHANNEL }

const TOOLS = [
	{
		name: 'convert', title: 'Convert color',
		description: `Convert channel values between any two of the ${N} color spaces, identity included, in each space's conventional ranges (rgb 0-255, oklch L 0-1 / C 0-0.4 / H 0-360, lab L 0-100 …). One color as \`values\`, or a batch as \`colors\`. Out-of-range in, unclamped out: \`inRange\` flags each channel against the target's conventional range (rgb below 0 means outside sRGB); null = undefined at that coordinate.`,
		inputSchema: { type: 'object', additionalProperties: false, required: ['from', 'to'], properties: {
			from: SPACE('source'), to: SPACE('target'),
			values: { ...COLOR, description: 'one color in the source space, e.g. [255, 128, 0] for rgb' },
			colors: { type: 'array', items: COLOR, minItems: 1, maxItems: 1024, description: 'a batch instead of `values`: one tuple per color, e.g. [[255, 128, 0], [0, 255, 128]]' },
		} },
		outputSchema: { type: 'object', required: ['from', 'to', 'channels', 'colors'], properties: {
			from: { type: 'string' }, to: { type: 'string' }, channels: CHANNELS,
			colors: { type: 'array', items: { type: 'object', required: ['values', 'inRange'], properties: {
				values: NUMS, inRange: { type: 'array', items: { type: 'boolean' } } } } },
		} },
		annotations: { title: 'Convert color', ...RO },
	},
	{
		name: 'gamut', title: 'Gamut membership',
		description: `Which standard display gamuts hold a color — sRGB ⊂ Display P3 ⊂ Rec. 2020, each tested in its own RGB box straight from the source space, the same ladder as the color-space.io gamut pill. \`smallest\` is the tightest one; null = beyond Rec. 2020. Membership only: nothing is gamut-mapped.`,
		inputSchema: { type: 'object', additionalProperties: false, required: ['from', 'values'], properties: {
			from: SPACE('source'), values: { ...COLOR, description: 'one color in the source space' },
		} },
		outputSchema: { type: 'object', required: ['smallest', 'gamuts'], properties: {
			smallest: { type: ['string', 'null'], enum: [...LADDER.map(([g]) => g), null] },
			gamuts: { type: 'array', items: { type: 'object', required: ['gamut', 'space', 'inside', 'values'], properties: {
				gamut: { type: 'string' }, space: { type: 'string' }, white: { type: 'string' }, primaries: { type: 'object' },
				inside: { type: 'boolean' }, values: { anyOf: [NUMS, { type: 'null' }] } } } },
		} },
		annotations: { title: 'Gamut membership', ...RO },
	},
	{
		name: 'css', title: 'CSS color strings',
		description: `A color as CSS Color 4 strings — rgb(), hsl(), hwb(), lab(), lch(), oklab(), oklch() and color(display-p3 | a98-rgb | prophoto-rgb | srgb-linear | xyz-d65 | xyz-d50) — plus #hex inside sRGB. Converted, never gamut-mapped: a string is null where CSS would clamp it into a different color (rgb/hsl/hwb outside sRGB, lightness out of range). \`gamut\` is the smallest display gamut that holds the color.`,
		inputSchema: { type: 'object', additionalProperties: false, required: ['from', 'values'], properties: {
			from: SPACE('source'), values: { ...COLOR, description: 'one color in the source space' },
			notations: { type: 'array', items: { type: 'string', enum: [...CSSABLE] }, minItems: 1, description: 'only these, by library space id (default: all)' },
		} },
		outputSchema: { type: 'object', required: ['hex', 'gamut', 'css'], properties: {
			hex: { type: ['string', 'null'] }, gamut: { type: ['string', 'null'] },
			css: { type: 'array', items: { type: 'object', required: ['space', 'css'], properties: { space: { type: 'string' }, css: { type: ['string', 'null'] } } } },
		} },
		annotations: { title: 'CSS color strings', ...RO },
	},
	{
		name: 'space', title: 'Space dossier',
		description: 'The dossier of one color space: display name (as color-space.io shows it), description, channels + conventional ranges, defining references, provenance (year, author), illuminant/observer, encoding class, family and purpose, and its direct conversion neighbours.',
		inputSchema: { type: 'object', additionalProperties: false, required: ['name'], properties: { name: SPACE('the') } },
		outputSchema: { type: 'object', required: ['name', 'title', 'family', 'purpose', 'channels', 'neighbors', 'source'], properties: {
			name: { type: 'string' }, title: { type: 'string' }, family: { type: 'string' }, purpose: { type: 'array', items: { type: 'string' } },
			channels: CHANNELS, neighbors: { type: 'array', items: { type: 'string' } }, source: { type: 'string' },
		} },
		annotations: { title: 'Space dossier', ...RO },
	},
	{
		name: 'spaces', title: 'Space catalog',
		description: `List the ${N} color spaces with display name, family, purpose, channels and one-line use. Optional filters: \`query\` (words matched against id, name, use line and description; best matches first), \`family\`, \`purpose\`.`,
		inputSchema: { type: 'object', additionalProperties: false, properties: {
			query: { type: 'string', description: "free text, e.g. 'camera log', 'cielab', 'display p3'" },
			family: { type: 'string', enum: FAMILIES },
			purpose: { type: 'string', enum: PURPOSES },
		} },
		outputSchema: { type: 'object', required: ['count', 'spaces'], properties: {
			count: { type: 'integer' },
			spaces: { type: 'array', items: { type: 'object', required: ['name', 'title', 'family', 'purpose', 'channels'], properties: {
				name: { type: 'string' }, title: { type: 'string' }, family: { type: 'string' }, purpose: { type: 'array', items: { type: 'string' } },
				channels: { type: 'string' }, use: { type: 'string' } } } },
		} },
		annotations: { title: 'Space catalog', ...RO },
	},
	{
		name: 'cube', title: '.cube LUT',
		description: 'Render a conversion as a .cube LUT file (Resolve, Premiere, Final Cut, OBS, ffmpeg). The header carries the measured deviation vs the direct conversion. Pure per-channel transfers auto-emit 1D. Size ≤ 33 here (larger via the library or https://color-space.io/).',
		inputSchema: { type: 'object', additionalProperties: false, required: ['from', 'to'], properties: {
			from: SPACE('source'), to: SPACE('target'),
			size: { type: 'integer', minimum: 2, maximum: 33, description: '3D lattice size (default 17)' },
		} },
		annotations: { title: '.cube LUT', ...RO },
	},
]

const CALL = {
	convert({ from, to, values, colors }) {
		const f = need(from); need(to)
		if (typeof f[to] !== 'function') throw Error(`${from} → ${to} is not convertible`)
		if ((values === undefined) === (colors === undefined)) throw Error('pass one color as `values` or a batch as `colors` (one of the two)')
		if (colors !== undefined && !(Array.isArray(colors) && colors.length && colors.length <= 1024)) throw Error('colors: 1-1024 tuples, e.g. [[255, 128, 0], [0, 255, 128]]')
		const list = values !== undefined ? [tuple(from, values)] : colors.map((c, i) => tuple(from, c, `colors[${i}]`))
		return { from, to, channels: chans(to), colors: list.map((c) => { const v = Array.from(f[to](...c)); return { values: v.map(num), inRange: inRange(to, v) } }) }
	},
	gamut({ from, values }) {
		need(from); tuple(from, values)
		const gamuts = ladder(from, values)
		return { smallest: gamuts.find((g) => g.inside)?.gamut ?? null, gamuts }
	},
	css({ from, values, notations }) {
		const f = need(from); tuple(from, values)
		if (notations !== undefined && !(Array.isArray(notations) && notations.length && notations.every((s) => CSSABLE.has(s))))
			throw Error(`notations: library space ids from ${[...CSSABLE].join(', ')}`)
		const g = ladder(from, values), srgb = g[0].inside
		return {
			hex: srgb ? hex(g[0].values) : null,
			gamut: g.find((x) => x.inside)?.gamut ?? null,
			css: (notations || [...CSSABLE]).map((s) => { const v = Array.from(from === s ? values : f[s](...values)); return { space: s, css: exact(s, v, srgb) ? css(s, v) : null } }),
		}
	},
	space({ name }) {
		need(name)
		const neighbors = names.filter((to) => { const g = space[name][to]; return to !== name && typeof g === 'function' && !((g.scalar || g).chained) })
		return { name, family: FAMILY[name] || 'more', purpose: PURPOSE[name] || [], ...(meta[name] || {}), channels: chans(name), neighbors,
			source: `https://github.com/colorjs/color-space/blob/master/spaces/${name}.js` }
	},
	spaces({ query, family, purpose }) {
		if (family !== undefined && !FAMILIES.includes(family)) throw Error(`family: one of ${FAMILIES.join(' · ')}`)
		if (purpose !== undefined && !PURPOSES.includes(purpose)) throw Error(`purpose: one of ${PURPOSES.join(', ')}`)
		const q = String(query ?? '').toLowerCase(), words = q.split(/\s+/).filter(Boolean)
		// rank: the id or name itself, then id/name matches, then the use line, then the description
		const rank = (s) => {
			const m = meta[s] || {}, use = (m.use || '').toLowerCase(), name = `${s} ${TITLE[s].toLowerCase()}`
			if (!words.length || norm(s) === norm(q) || (TITLE[s] && norm(TITLE[s]) === norm(q))) return 0
			if (words.every((w) => name.includes(w))) return 1
			if (words.every((w) => use.includes(w))) return 2
			return words.every((w) => `${s} ${use} ${(m.description || '').toLowerCase()}`.includes(w)) ? 3 : Infinity
		}
		const list = names.filter((s) => (!family || FAMILY[s] === family) && (!purpose || PURPOSE[s]?.includes(purpose)))
			.map((s) => [s, rank(s)]).filter(([, r]) => r < Infinity).sort((a, b) => a[1] - b[1])
			.map(([s]) => ({ name: s, title: meta[s]?.title, family: FAMILY[s] || 'more', purpose: PURPOSE[s] || [], channels: chans(s).map((c) => c.symbol).join(''), use: meta[s]?.use }))
		return { count: list.length, spaces: list }
	},
	cube({ from, to, size }) {
		const f = need(from), t = need(to)
		size ??= channelwise(f, t) ? undefined : 17
		if (size !== undefined && !(Number.isInteger(size) && size >= 2 && size <= 33)) throw Error('size: an integer 2-33 here — larger LUTs via the library or the site')
		return cube(f, t, { size })
	},
}

const rpc = (id, body) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, ...body }) + '\n')

export function handle(msg) {
	if (Array.isArray(msg) || !msg || typeof msg !== 'object') return rpc(null, { error: { code: -32600, message: 'invalid request: one JSON-RPC object per line' } })
	const { id, method, params } = msg
	if (typeof method !== 'string')   // a response (result/error) needs no answer; anything else is malformed
		return 'result' in msg || 'error' in msg ? undefined : rpc(id ?? null, { error: { code: -32600, message: 'invalid request: method must be a string' } })
	if (method.startsWith('notifications/')) return   // no response to notifications
	const m = params?._meta || {}, version = m[P + 'protocolVersion']
	const modern = method !== 'initialize' && version !== undefined
	const ok = (result) => rpc(id, { result: modern ? { resultType: 'complete', ...result, _meta: { [P + 'serverInfo']: { name: SERVER.name, version: SERVER.version } } } : result })
	const err = (code, message, data) => rpc(id, { error: { code, message, ...(data && { data }) } })

	if (method === 'initialize')   // legacy handshake: echo a supported version, else offer our latest
		return ok({ protocolVersion: LEGACY.includes(params?.protocolVersion) ? params.protocolVersion : LEGACY[0],
			capabilities: { tools: {} }, serverInfo: SERVER, instructions: INSTRUCTIONS })
	if (modern) {
		// a version we don't serve per-request → -32022 listing what we do; required _meta missing → -32602
		// @see https://modelcontextprotocol.io/specification/2026-07-28/basic/index#meta
		if (!MODERN.includes(version)) return err(-32022, 'Unsupported protocol version', { supported: MODERN, requested: version })
		const caps = m[P + 'clientCapabilities']
		if (!caps || typeof caps !== 'object' || Array.isArray(caps)) return err(-32602, `missing _meta['${P}clientCapabilities'] (an object)`)
		if (method === 'server/discover')
			return ok({ supportedVersions: MODERN, capabilities: { tools: {} }, instructions: INSTRUCTIONS, ttlMs: TTL, cacheScope: 'public' })
	} else if (method === 'ping') return ok({})   // legacy only: 2026-07-28 removed ping
	if (method === 'tools/list') return ok(modern ? { tools: TOOLS, ttlMs: TTL, cacheScope: 'public' } : { tools: TOOLS })
	if (method === 'tools/call') {
		const name = params?.name, fn = Object.hasOwn(CALL, name) ? CALL[name] : null
		if (!fn) return err(-32602, `unknown tool '${name}' — tools: ${TOOLS.map((t) => t.name).join(', ')}`)
		// input problems come back as tool errors the model can read and correct, not protocol errors
		try {
			const a = params.arguments ?? {}
			if (typeof a !== 'object' || Array.isArray(a)) throw Error('arguments must be an object')
			const r = fn(args(name, a))
			return ok(typeof r === 'string' ? { content: [{ type: 'text', text: r }] }
				: { content: [{ type: 'text', text: JSON.stringify(r) }], structuredContent: r })
		} catch (e) { return ok({ content: [{ type: 'text', text: String(e.message || e) }], isError: true }) }
	}
	if (id !== undefined) err(-32601, `method '${method}' not found`)
}

// The stdio loop — run by this bin directly, and by `color-space mcp` (cli.js).
export function serve() {
	createInterface({ input: process.stdin }).on('line', (line) => {
		if (!line.trim()) return
		let msg; try { msg = JSON.parse(line) } catch { return rpc(null, { error: { code: -32700, message: 'parse error' } }) }
		try { handle(msg) } catch (e) { if (msg?.id !== undefined) rpc(msg.id, { error: { code: -32603, message: String(e.message || e) } }) }
	})
}

// Serve only when executed directly — importing this module must stay side-effect-free.
// Resolve both sides through realpath: npm launches bins through node_modules/.bin
// symlinks, while import.meta.url names the package file itself.
const isMain = (() => {
	if (!process.argv[1]) return false
	try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)) }
	catch { return false }
})()
if (isMain) serve()
