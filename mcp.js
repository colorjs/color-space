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
 * provenance, neighbours) · spaces (the catalog, searchable) · cube (a .cube LUT) ·
 * shader (the conversion as GLSL / WGSL / HLSL / MSL) · icc (an ICC profile) · code (the
 * call in JS, and its verified colour-science equivalent in Python). Colors go in as channel
 * values or as any CSS color string ('#ff8000', 'oklch(0.7 0.1 50)', 'rebeccapurple').
 * Resources: data.json (the catalog) and color-space://space/{name} (one dossier).
 *
 * Transports: stdio (`npx -y color-space mcp`) and Streamable HTTP, stateless JSON
 * (`npx -y color-space mcp --http 8787`, or `fetch` below in a Worker / Deno / Bun).
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
import space from './index.js'
import data from './data.json' with { type: 'json' }
import pkg from './package.json' with { type: 'json' }
import { cube, channelwise } from './lut.js'
import { profile } from './icc.js'
import { css, exact, hex, CSSABLE, parse } from './css.js'
import NAMES from './web/js/names.js'
import { code as pyCode, VERIFIED as PYVERIFIED } from './web/js/python.js'
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
const INSTRUCTIONS = `Verified color conversions between ${N} spaces — call these instead of computing color math yourself, and use \`shader\` / \`code\` instead of writing conversion matrices from memory. A color goes in as a CSS string (\`color\`: '#ff8000', 'oklch(0.7 0.1 50)', 'rebeccapurple') or as channel values with \`from\`. \`convert\` any pair (batches too; flags values outside the target's range), \`gamut\` for which display gamut holds a color, \`css\` for CSS Color 4 strings, \`space\` / \`spaces\` for references, ranges and provenance, \`cube\` for a .cube LUT, \`icc\` for an ICC profile, \`shader\` for GLSL / WGSL / HLSL / MSL, \`code\` for the JS call and its Python equivalent.`

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

// ── "did you mean": edit distance over ids, display names and other names (@aka) — data.json's spaces[id].title, the
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
	return names.map((s) => [s, Math.min(lev(k, norm(s)), TITLE[s] ? lev(k, norm(TITLE[s])) : Infinity, ...(meta[s]?.aka || []).map((n) => lev(k, norm(n)))), prefix(k, norm(s))])
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
// a color as channel values in `from`, or as a CSS color string (`color`) – which names its own space
const resolve = (from, values, color) => {
	if (color !== undefined) {
		if (values !== undefined) throw Error('pass `from` + `values`, or a CSS `color` string – not both')
		const p = typeof color === 'string' ? parse(color, NAMES) : undefined
		if (!p) throw Error(`not a CSS color: ${JSON.stringify(color)} — e.g. '#ff8000', 'rebeccapurple', 'oklch(0.7 0.1 50)', 'color(display-p3 1 0.5 0)'`)
		return { from: p.space, values: p.values }
	}
	if (from === undefined || values === undefined) throw Error('pass `from` + `values` (channel values), or a CSS `color` string')
	need(from)
	return { from, values: tuple(from, values) }
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
const CSSCOLOR = { type: 'string', description: "a CSS color instead of `from` + `values`: '#ff8000', 'rebeccapurple', 'oklch(0.7 0.1 50)', 'lab(54% 80 67)', 'color(display-p3 1 0.5 0)'" }
const CHANNEL = { type: 'object', required: ['symbol', 'name', 'min', 'max'], properties: { symbol: { type: 'string' }, name: { type: 'string' }, min: { type: 'number' }, max: { type: 'number' } } }
const CHANNELS = { type: 'array', items: CHANNEL }

const TOOLS = [
	{
		name: 'convert', title: 'Convert color',
		description: `Convert a color between any two of the ${N} color spaces, identity included, in each space's conventional ranges (rgb 0-255, oklch L 0-1 / C 0-0.4 / H 0-360, lab L 0-100 …). The color goes in as a CSS string (\`color\`) or as channel values (\`from\` + \`values\`); a batch as \`colors\` – tuples in \`from\`, CSS strings, or both. Out-of-range in, unclamped out: \`inRange\` flags each channel against the target's conventional range (rgb below 0 means outside sRGB); null = undefined at that coordinate.`,
		inputSchema: { type: 'object', additionalProperties: false, required: ['to'], properties: {
			from: SPACE('source'), to: SPACE('target'),
			values: { ...COLOR, description: 'one color in the source space, e.g. [255, 128, 0] for rgb' },
			color: CSSCOLOR,
			colors: { type: 'array', items: { anyOf: [COLOR, { type: 'string' }] }, minItems: 1, maxItems: 1024, description: "a batch: one tuple (in `from`) or CSS string per color, e.g. [[255, 128, 0], '#00ff80', 'oklch(0.7 0.1 50)']" },
		} },
		outputSchema: { type: 'object', required: ['to', 'channels', 'colors'], properties: {
			from: { type: 'string' }, to: { type: 'string' }, channels: CHANNELS,
			colors: { type: 'array', items: { type: 'object', required: ['from', 'values', 'inRange'], properties: {
				from: { type: 'string' }, values: NUMS, inRange: { type: 'array', items: { type: 'boolean' } } } } },
		} },
		annotations: { title: 'Convert color', ...RO },
	},
	{
		name: 'gamut', title: 'Gamut membership',
		description: `Which standard display gamuts hold a color — sRGB ⊂ Display P3 ⊂ Rec. 2020, each tested in its own RGB box straight from the source space, the same ladder as the color-space.io gamut pill. \`smallest\` is the tightest one; null = beyond Rec. 2020. Membership only: nothing is gamut-mapped.`,
		inputSchema: { type: 'object', additionalProperties: false, properties: {
			from: SPACE('source'), values: { ...COLOR, description: 'one color in the source space' }, color: CSSCOLOR,
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
		inputSchema: { type: 'object', additionalProperties: false, properties: {
			from: SPACE('source'), values: { ...COLOR, description: 'one color in the source space' }, color: CSSCOLOR,
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
	{
		name: 'shader', title: 'Shader code',
		description: 'The conversion as shader source – GLSL (WebGL2; WebGL1 too unless the path reads a table), WGSL (WebGPU), HLSL (DirectX, Unity, Unreal) or MSL (Metal) – with an entry function `<from>_<to>` (hyphens stripped), e.g. `vec3 rgb_oklch(vec3 c)`, plus every function on the path. Each language is differentially tested against the library and compiled on real GPUs: use it instead of writing color matrices. HLSL and MSL need the optional peer `naga-wasm` installed beside color-space.',
		inputSchema: { type: 'object', additionalProperties: false, required: ['from', 'to'], properties: {
			from: SPACE('source'), to: SPACE('target'),
			language: { type: 'string', enum: ['glsl', 'wgsl', 'hlsl', 'msl'], description: 'default glsl' },
		} },
		outputSchema: { type: 'object', required: ['language', 'entry', 'code'], properties: {
			language: { type: 'string' }, entry: { type: 'string' }, code: { type: 'string' },
		} },
		annotations: { title: 'Shader code', ...RO },
	},
	{
		name: 'icc', title: 'ICC profile',
		description: 'One space as an ICC v2 profile (.icc): matrix + tone curve where the space is an RGB working space (Photoshop, OS color management), a CLUT on a Lab PCS otherwise (lcms, ArgyllCMS, ImageMagick). Returned as a base64 embedded resource; `class`, `pcs` and `bytes` describe it.',
		inputSchema: { type: 'object', additionalProperties: false, required: ['name'], properties: {
			name: SPACE('the'),
			grid: { type: 'integer', minimum: 2, maximum: 65, description: 'CLUT lattice points per channel, CLUT profiles only (default 33 for 3 channels; fewer = a smaller file)' },
		} },
		outputSchema: { type: 'object', required: ['name', 'file', 'class', 'pcs', 'bytes'], properties: {
			name: { type: 'string' }, file: { type: 'string' }, class: { type: 'string' }, pcs: { type: 'string' }, bytes: { type: 'integer' },
		} },
		annotations: { title: 'ICC profile', ...RO },
	},
	{
		name: 'code', title: 'Library code',
		description: 'The conversion as code to paste: the color-space JS call with its result and – where one exists for the space on the non-sRGB side – the colour-science (Python) equivalent verified against color-space (sRGB ↔ that space), with any named caveat. The color goes in as a CSS string or as values in `from` (default: sRGB 200, 100, 50).',
		inputSchema: { type: 'object', additionalProperties: false, required: ['to'], properties: {
			from: SPACE('source'), to: SPACE('target'),
			values: { ...COLOR, description: 'the color in the source space' }, color: CSSCOLOR,
		} },
		outputSchema: { type: 'object', required: ['js', 'python', 'pythonFor'], properties: {
			js: { type: 'string' }, python: { type: ['string', 'null'] }, pythonFor: { type: ['string', 'null'] },
		} },
		annotations: { title: 'Library code', ...RO },
	},
]

// MCP resources: the catalog artifact, and one dossier per space by template
const RESOURCES = [{ uri: 'color-space://data.json', name: 'data.json', title: `The ${N}-space catalog`, mimeType: 'application/json',
	description: 'Every space: channels and ranges, references, provenance, gamuts, cited conformance points – the language-neutral artifact.' }]
const TEMPLATES = [{ uriTemplate: 'color-space://space/{name}', name: 'space', title: 'Space dossier', mimeType: 'application/json',
	description: 'One space\'s dossier (the `space` tool\'s output), e.g. color-space://space/oklch' }]


const CALL = {
	convert({ from, to, values, colors, color }) {
		need(to)
		let list
		if (colors !== undefined) {
			if (values !== undefined || color !== undefined) throw Error('pass one color (`values` or `color`) or a batch (`colors`), not both')
			if (!(Array.isArray(colors) && colors.length && colors.length <= 1024)) throw Error("colors: 1-1024 entries, each a tuple in `from` or a CSS string, e.g. [[255, 128, 0], '#00ff80']")
			list = colors.map((c, i) => {
				if (typeof c === 'string') return resolve(undefined, undefined, c)
				if (from === undefined) throw Error(`colors[${i}] is a tuple: pass \`from\`, or give it as a CSS string`)
				need(from)
				return { from, values: tuple(from, c, `colors[${i}]`) }
			})
		} else list = [resolve(from, values, color)]
		return { ...(from !== undefined && { from }), to, channels: chans(to), colors: list.map((c) => {
			if (typeof space[c.from][to] !== 'function') throw Error(`${c.from} → ${to} is not convertible`)
			const v = Array.from(space[c.from][to](...c.values))
			return { from: c.from, values: v.map(num), inRange: inRange(to, v) }
		}) }
	},
	gamut({ from, values, color }) {
		const c = resolve(from, values, color)
		const gamuts = ladder(c.from, c.values)
		return { smallest: gamuts.find((g) => g.inside)?.gamut ?? null, gamuts }
	},
	css({ from, values, color, notations }) {
		const c = resolve(from, values, color), f = space[c.from]
		if (notations !== undefined && !(Array.isArray(notations) && notations.length && notations.every((s) => CSSABLE.has(s))))
			throw Error(`notations: library space ids from ${[...CSSABLE].join(', ')}`)
		const g = ladder(c.from, c.values), srgb = g[0].inside
		return {
			hex: srgb ? hex(g[0].values) : null,
			gamut: g.find((x) => x.inside)?.gamut ?? null,
			css: (notations || [...CSSABLE]).map((s) => { const v = Array.from(c.from === s ? c.values : f[s](...c.values)); return { space: s, css: exact(s, v, srgb) ? css(s, v) : null } }),
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
	async shader({ from, to, language = 'glsl' }) {
		need(from); need(to)
		if (!['glsl', 'wgsl', 'hlsl', 'msl'].includes(language)) throw Error('language: glsl, wgsl, hlsl or msl')
		// loaded on first use: the full chunk registry stays off the server's startup path
		const emit = language === 'glsl' ? (await import('./gl/index.js')).glsl : (await import(`./gl/${language}.js`)).default
		return { language, entry: `${from.replace(/-/g, '')}_${to.replace(/-/g, '')}`, code: await emit(from, to) }
	},
	icc({ name, grid }) {
		const s = need(name)
		if (grid !== undefined && !(Number.isInteger(grid) && grid >= 2 && grid <= 65)) throw Error('grid: an integer 2-65')
		const b = profile(s, { xyz: space.xyz, ...(grid && { grid }) }), sig = (o) => String.fromCharCode(...b.subarray(o, o + 4)).trim()
		return { name, file: `${name}.icc`, class: sig(12), pcs: sig(20), bytes: b.length,
			[BLOB]: { uri: `color-space://icc/${name}.icc`, mimeType: 'application/vnd.iccprofile', blob: base64(b) } }
	},
	code({ from, to, values, color }) {
		need(to)
		const c = values === undefined && color === undefined
			? { from: from ?? 'rgb', values: from === undefined || from === 'rgb' ? [200, 100, 50] : Array.from(space.rgb[need(from).name](200, 100, 50)) }
			: resolve(from, values, color)
		const f = space[c.from]
		if (typeof f[to] !== 'function') throw Error(`${c.from} → ${to} is not convertible`)
		const id = (s) => /^[a-z_$][\w$]*$/i.test(s) ? `.${s}` : `['${s}']`, r = (x) => Number.isFinite(x) ? +x.toPrecision(6) : 'NaN'
		const js = `import space from 'color-space'\n\nspace${id(c.from)}${id(to)}(${c.values.map(r).join(', ')})\n// → [${Array.from(f[to](...c.values)).map(r).join(', ')}]`
		// colour-science equivalents are verified per space as sRGB → space (and back): the snippet for the non-sRGB side
		const other = c.from === 'rgb' ? to : to === 'rgb' ? c.from : null
		const rgb = (c.from === 'rgb' ? c.values : Array.from(f.rgb(...c.values))).map((x) => Math.min(255, Math.max(0, Math.round(x))))
		const python = other && pyCode(other, rgb)
		return { js, python: python || null, pythonFor: python ? `sRGB ↔ ${other}, verified against ${PYVERIFIED}` : null }
	},
}

const BLOB = Symbol('blob')   // a tool result's binary payload, sent as an embedded resource beside its JSON
// btoa over byte chunks: no Buffer, so the module also runs where only web APIs exist (Workers, Deno, browsers)
const base64 = (b) => { let t = ''; for (let i = 0; i < b.length; i += 0x8000) t += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(t) }

// color-space://data.json, and color-space://space/{name} – one dossier, the `space` tool's output
const read = (uri) => {
	if (uri === 'color-space://data.json') return { uri, mimeType: 'application/json', text: JSON.stringify(data) }
	const m = /^color-space:\/\/space\/([\w-]+)$/.exec(String(uri))
	if (m && Object.hasOwn(space, m[1])) return { uri, mimeType: 'application/json', text: JSON.stringify(CALL.space({ name: m[1] })) }
	throw Object.assign(Error(`resource not found: ${uri} — color-space://data.json or color-space://space/{name}`), { code: -32002 })
}

const res = (id, body) => ({ jsonrpc: '2.0', id, ...body })
const CAPS = { tools: {}, resources: {} }

/** One JSON-RPC message in, its response out (undefined for a notification or a response). */
export async function handle(msg) {
	if (Array.isArray(msg) || !msg || typeof msg !== 'object') return res(null, { error: { code: -32600, message: 'invalid request: one JSON-RPC object per message' } })
	const { id, method, params } = msg
	if (typeof method !== 'string')   // a response (result/error) needs no answer; anything else is malformed
		return 'result' in msg || 'error' in msg ? undefined : res(id ?? null, { error: { code: -32600, message: 'invalid request: method must be a string' } })
	if (method.startsWith('notifications/')) return   // no response to notifications
	const m = params?._meta || {}, version = m[P + 'protocolVersion']
	const modern = method !== 'initialize' && version !== undefined
	const ok = (result) => res(id, { result: modern ? { resultType: 'complete', ...result, _meta: { [P + 'serverInfo']: { name: SERVER.name, version: SERVER.version } } } : result })
	const err = (code, message, data) => res(id, { error: { code, message, ...(data && { data }) } })

	if (method === 'initialize')   // legacy handshake: echo a supported version, else offer our latest
		return ok({ protocolVersion: LEGACY.includes(params?.protocolVersion) ? params.protocolVersion : LEGACY[0],
			capabilities: CAPS, serverInfo: SERVER, instructions: INSTRUCTIONS })
	if (modern) {
		// a version we don't serve per-request → -32022 listing what we do; required _meta missing → -32602
		// @see https://modelcontextprotocol.io/specification/2026-07-28/basic/index#meta
		if (!MODERN.includes(version)) return err(-32022, 'Unsupported protocol version', { supported: MODERN, requested: version })
		const caps = m[P + 'clientCapabilities']
		if (!caps || typeof caps !== 'object' || Array.isArray(caps)) return err(-32602, `missing _meta['${P}clientCapabilities'] (an object)`)
		if (method === 'server/discover')
			return ok({ supportedVersions: MODERN, capabilities: CAPS, instructions: INSTRUCTIONS, ttlMs: TTL, cacheScope: 'public' })
	} else if (method === 'ping') return ok({})   // legacy only: 2026-07-28 removed ping
	const list = (r) => ok(modern ? { ...r, ttlMs: TTL, cacheScope: 'public' } : r)
	if (method === 'tools/list') return list({ tools: TOOLS })
	if (method === 'resources/list') return list({ resources: RESOURCES })
	if (method === 'resources/templates/list') return list({ resourceTemplates: TEMPLATES })
	if (method === 'resources/read') {
		try { return ok({ contents: [read(params?.uri)] }) } catch (e) { return err(e.code || -32602, e.message, { uri: params?.uri }) }
	}
	if (method === 'tools/call') {
		const name = params?.name, fn = Object.hasOwn(CALL, name) ? CALL[name] : null
		if (!fn) return err(-32602, `unknown tool '${name}' — tools: ${TOOLS.map((t) => t.name).join(', ')}`)
		// input problems come back as tool errors the model can read and correct, not protocol errors
		try {
			const a = params.arguments ?? {}
			if (typeof a !== 'object' || Array.isArray(a)) throw Error('arguments must be an object')
			const r = await fn(args(name, a))
			if (typeof r === 'string') return ok({ content: [{ type: 'text', text: r }] })
			const text = { type: 'text', text: JSON.stringify(r) }
			return ok({ content: r[BLOB] ? [text, { type: 'resource', resource: r[BLOB] }] : [text], structuredContent: r })
		} catch (e) { return ok({ content: [{ type: 'text', text: String(e.message || e) }], isError: true }) }
	}
	if (id !== undefined) return err(-32601, `method '${method}' not found`)
}

// an internal failure answers the request it belongs to; a notification has no one to tell
const reply = (msg) => handle(msg).catch((e) => msg?.id !== undefined ? res(msg.id, { error: { code: -32603, message: String(e.message || e) } }) : undefined)

// The stdio loop — run by this bin directly, and by `color-space mcp` (cli.js).
export async function serve() {
	const { createInterface } = await import('node:readline')
	const out = (r) => r && process.stdout.write(JSON.stringify(r) + '\n')
	createInterface({ input: process.stdin }).on('line', (line) => {
		if (!line.trim()) return
		let msg; try { msg = JSON.parse(line) } catch { return out(res(null, { error: { code: -32700, message: 'parse error' } })) }
		reply(msg).then(out)
	})
}

/**
 * Streamable HTTP, stateless: POST one JSON-RPC message, get its JSON response (202 and no
 * body for a notification). No sessions and no server-sent events – each call is
 * self-contained. A fetch handler, so the same code serves from Node (`serveHttp`), a
 * Worker, Deno or Bun. CORS is open: the tools are read-only, pure computation.
 * @see https://modelcontextprotocol.io/specification/2025-11-25/basic/transports#streamable-http
 * @param {Request} request
 * @returns {Promise<Response>}
 */
export async function fetch(request) {
	const H = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS',
		'access-control-allow-headers': 'content-type, accept, mcp-protocol-version, mcp-session-id' }
	if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: H })
	if (request.method !== 'POST') return new Response(`color-space MCP server – POST JSON-RPC here (${N} spaces, https://color-space.io/)\n`, { status: 405, headers: { ...H, allow: 'POST, OPTIONS' } })
	let msg; try { msg = await request.json() } catch { return Response.json(res(null, { error: { code: -32700, message: 'parse error' } }), { status: 400, headers: H }) }
	const r = await reply(msg)
	return r ? Response.json(r, { headers: H }) : new Response(null, { status: 202, headers: H })
}

/** `color-space mcp --http [port]`: the fetch handler on node:http, on localhost. */
export async function serveHttp(port = 8787, host = '127.0.0.1') {
	const { createServer } = await import('node:http')
	return createServer(async (req, out) => {
		const body = []; for await (const c of req) body.push(c)
		const r = await fetch(new Request(`http://${host}:${port}${req.url}`, { method: req.method, headers: req.headers, body: req.method === 'POST' ? Buffer.concat(body) : undefined }))
		out.writeHead(r.status, Object.fromEntries(r.headers)); out.end(Buffer.from(await r.arrayBuffer()))
	}).listen(port, host, () => process.stderr.write(`color-space MCP server on http://${host}:${port}/\n`))
}

// Serve only when executed directly – importing this module must stay side-effect-free.
// Resolve both sides through realpath: npm launches bins through node_modules/.bin
// symlinks, while import.meta.url names the package file itself.
// Node builtins load only here and in the transports: outside Node (a Worker importing `fetch`) nothing runs.
const isMain = await (async () => {
	if (typeof process === 'undefined' || !process.argv?.[1] || !import.meta.url.startsWith('file:')) return false
	const [{ realpathSync }, { fileURLToPath }] = await Promise.all([import('node:fs'), import('node:url')])
	try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)) }
	catch { return false }
})()
if (isMain) { const i = process.argv.indexOf('--http'); i < 0 ? serve() : serveHttp(+process.argv[i + 1] || undefined) }
