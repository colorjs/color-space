#!/usr/bin/env node
/**
 * color-space CLI — the registry from the shell, zero dependencies.
 * The bin name equals the package name, so `npx color-space …` needs no install.
 *
 *     npx color-space rgb oklch 255 128 0    → 0.7319 0.1858 52.98   (convert is the default command)
 *     npx color-space cube slog3 rec709      → .cube LUT on stdout
 *     npx color-space icc p3 > p3.icc        → ICC profile on stdout
 *     npx color-space space oklch            → one space's dossier, JSON
 *     npx color-space spaces                 → the catalog
 *     npx color-space mcp                    → MCP stdio server (agent tools)
 */
import space from './index.js'
import data from './data.json' with { type: 'json' }
import pkg from './package.json' with { type: 'json' }
import { cube, channelwise } from './lut.js'
import { profile } from './icc.js'
import { serve } from './mcp.js'

const meta = data.spaces, names = Object.keys(space)
const fail = (m) => { process.stderr.write(m + '\n'); process.exit(1) }
const need = (n) => space[n] || fail(`unknown space '${n}' — see: color-space spaces`)

const usage = `color-space ${pkg.version} — ${names.length} verified color spaces

  color-space <from> <to> <values…>    convert (the default command)
  color-space cube <from> <to> [size]  .cube LUT → stdout (Resolve, Premiere, OBS, ffmpeg)
  color-space icc <space>              ICC profile → stdout
  color-space space <name>             one space's dossier (JSON)
  color-space spaces                   list every space
  color-space mcp                      MCP server on stdio (tools: convert · space · spaces · cube)

  color-space rgb oklch 255 128 0      → 0.7319 0.1858 52.98
`

const run = {
	convert(from, to, ...vals) {
		const f = need(from); need(to)
		if (typeof f[to] !== 'function') fail(`${from} → ${to} is not convertible (one-way source?)`)
		const n = (meta[from]?.channels || f.range).length
		vals = vals.map(Number)
		if (vals.length !== n || vals.some((v) => !isFinite(v)))
			fail(`${from} takes ${n} numbers (${(meta[from]?.channels || []).map((c) => c.symbol).join(' ')})`)
		console.log(f[to](...vals).join(' '))
	},
	cube(from, to, size) {
		const f = need(from), t = need(to)
		process.stdout.write(cube(f, t, { size: size ? +size : (channelwise(f, t) ? undefined : 33) }))
	},
	icc(name) { process.stdout.write(profile(need(name), { xyz: space.xyz })) },
	space(name) {
		need(name)
		const neighbors = names.filter((to) => { const f = space[name][to]
			return to !== name && typeof f === 'function' && !((f.scalar || f).chained) })
		console.log(JSON.stringify({ name, ...(meta[name] || {}), neighbors,
			source: `https://github.com/colorjs/color-space/blob/master/spaces/${name}.js` }, null, 1))
	},
	spaces() { console.log(names.join('\n')) },
	mcp: serve,
}

const [cmd, ...rest] = process.argv.slice(2)
if (!cmd || cmd === '--help' || cmd === '-h') { process.stdout.write(usage); process.exit(cmd ? 0 : 1) }
if (cmd === '--version' || cmd === '-v') { console.log(pkg.version); process.exit(0) }
try { (run[cmd] || ((...a) => run.convert(cmd, ...a)))(...rest) }
catch (e) { fail(String(e && e.message || e)) }
