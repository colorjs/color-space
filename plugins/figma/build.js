#!/usr/bin/env node
/**
 * Build plugins/figma/ui.html, the single self-contained file Figma loads as the
 * plugin UI. Figma injects the manifest's `ui` file as a string (__html__), so
 * scripts and styles have to be inlined.
 *
 * - src/ui.js plus the full color-space library becomes one minified IIFE (esbuild).
 *   The lite build lacks p3, hsl and hct, so the full library is used.
 * - Channel symbols and names for every space come from data.json.
 * - The spacing and type tokens that src/ui.html uses (var(--…)) come from
 *   web/tokens.css. They are copied, never retyped, and the build fails if one is missing.
 *
 *   node plugins/figma/build.js      (npm run build:figma)
 */
import { build } from 'esbuild'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const here = p => fileURLToPath(new URL(p, import.meta.url))
const root = p => fileURLToPath(new URL('../../' + p, import.meta.url))
const fail = msg => { console.error(`build:figma: ${msg}`); process.exit(1) }

// 1. channel metadata (symbol, name), checked against the runtime ranges
if (!existsSync(root('data.json'))) fail('data.json is missing. Run `npm run data` first.')
const { spaces } = JSON.parse(readFileSync(root('data.json'), 'utf8'))
const { default: space } = await import(root('index.js'))
const channels = {}
for (const id of Object.keys(space)) {
	const meta = spaces[id]?.channels
	if (!meta || meta.length !== space[id].range.length) fail(`data.json channels for "${id}" don't match the library (${meta?.length} vs ${space[id].range.length})`)
	channels[id] = meta.map(c => [c.symbol, c.name])
}

// 2. tokens: everything the template references and doesn't define, resolved through web/tokens.css
let template = readFileSync(here('src/ui.html'), 'utf8')
const tokensCss = readFileSync(root('web/tokens.css'), 'utf8')
const rootBlock = tokensCss.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1] ?? fail('no :root block in web/tokens.css')
const decls = new Map([...rootBlock.matchAll(/^\s*(--[\w-]+)\s*:\s*([^;]+);/gm)].map(m => [m[1], m[2].trim()]))
const own = new Set([...template.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map(m => m[1]))
const refs = s => [...s.matchAll(/var\((--[\w-]+)/g)].map(m => m[1])
const need = new Set(), queue = refs(template).filter(t => !own.has(t) && !t.startsWith('--figma-'))
while (queue.length) {
	const t = queue.shift()
	if (need.has(t)) continue
	if (!decls.has(t)) fail(`token ${t} is used by src/ui.html but not defined in web/tokens.css :root`)
	need.add(t)
	queue.push(...refs(decls.get(t)))
}
const tokens = [...decls].filter(([k]) => need.has(k)).map(([k, v]) => `\t${k}:${v};`).join('\n')

// 3. bundle
const out = await build({
	entryPoints: [here('src/ui.js')],
	bundle: true,
	format: 'iife',
	minify: true,
	target: 'es2020',
	charset: 'utf8',
	legalComments: 'none',
	write: false,
	define: { __CHANNELS__: JSON.stringify(channels) },
	logLevel: 'warning',
})
const js = out.outputFiles[0].text.replace(/<\/(script)/gi, '<\\/$1')

// function replacers, so `$` in the bundle is never read as a replacement pattern
template = template.replace('/*TOKENS*/', () => tokens)
if (/<script[^>]+src=|<link[^>]+href=|@import|url\(/i.test(template)) fail('src/ui.html must be self-contained (no external src/href/url)')
if (/\bimport\(|\bfetch\(/.test(js)) fail('the UI bundle must not load anything at runtime (manifest networkAccess is none)')
template = template.replace('/*BUNDLE*/', () => js.trim())
writeFileSync(here('ui.html'), template)
console.log(`plugins/figma/ui.html  ${(template.length / 1024).toFixed(1)} KB  (${Object.keys(channels).length} spaces, ${need.size} tokens)`)
