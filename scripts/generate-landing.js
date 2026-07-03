#!/usr/bin/env node
// Prerender the landing catalog into docs/index.html (crawlable static markup —
// the page re-renders the identical template on load) and generate docs/llms.txt.
// Run after adding spaces or editing the catalog template: npm run landing
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { catHTML, sections, SPACES } from '../docs/landing/render.js'
import { meta, spaceCount } from '../docs/landing/core.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

// ── index.html: static catalog + live counts + version ──
const page = join(root, 'docs/index.html')
let html = readFileSync(page, 'utf8')
const inject = (re, repl) => { if (!re.test(html)) throw new Error(`anchor not found: ${re}`); html = html.replace(re, repl) }
inject(/<main class="cat" id="cat">[\s\S]*?<\/main>/, `<main class="cat" id="cat">${catHTML()}</main>`)
inject(/(<a class="ver tnum" id="ver"[^>]*>)[^<]*(<\/a>)/, `$1v${version}$2`)
inject(/(<span id="n">)[^<]*(<\/span>)/, `$1${spaceCount}$2`)
inject(/(<span id="n2">)[^<]*(<\/span>)/, `$1${spaceCount}$2`)
writeFileSync(page, html)

// ── llms.txt: machine-readable index of every space ──
const rng = c => c.max === 360 ? `${c.symbol} 0–360°` : `${c.symbol} ${c.min}–${c.max}`
const line = s => { const m = meta[s] || {}
	const ch = (m.channels || []).map(rng).join(', ')
	const desc = (m.description || '').replace(/\s+/g, ' ').trim()
	const ref = m.refs?.[0] ? ` | ref: ${m.refs[0]}` : ''
	return `- ${s} — ${desc} | channels: ${ch}${ref}` }
const llms = `# color-space — ${spaceCount} color spaces, one tiny JS API

> Converts colors between ${spaceCount} spaces using each space's conventional ranges
> (what CSS and the defining papers use). Formulas differentially tested against
> colorjs.io. Zero dependencies, public domain (Unlicense).

Install: npm i color-space
API: space[from][to](...values) -> number[]     e.g. space.rgb.oklch(255, 128, 0)
Per space: space[name].range (channel ranges), space[name].name
Metadata: import meta from 'color-space/meta.js' (channels, refs, illuminant, referred, dynamic)
Tree-shaken: import oklch from 'color-space/oklch.js' (~2 kB per space)
WASM batch: import { alloc, convert } from 'color-space/wasm' (buffers in place, 27 spaces)
Site: https://colorjs.github.io/color-space/
Repo: https://github.com/colorjs/color-space

${sections.map(c => `## ${c.name}\n${c.spaces.map(line).join('\n')}`).join('\n\n')}
`
writeFileSync(join(root, 'docs/llms.txt'), llms)

console.log(`prerendered ${SPACES.length} spaces (${sections.length} sections) into docs/index.html · v${version} · docs/llms.txt written`)
