#!/usr/bin/env node
/**
 * Build plugins/figma/ui.html, the single self-contained file Figma loads as the
 * plugin UI. Figma injects the manifest's `ui` file as a string (__html__), so
 * scripts and styles have to be inlined.
 *
 * - src/ui.js, the atlas's picker modules (web/js/core.js, gl.js) and the full
 *   color-space library and its shader chunks become one minified IIFE (esbuild). The
 *   library is bundled from source (index.js, gl/index.js), never a possibly stale dist/;
 *   the lite build lacks p3, hsl and hct.
 * - The registry metadata the picker reads (titles, channels, ranges, method) comes from
 *   data.json, inlined in place of web/js/data.js's fetch, trimmed of prose.
 * - The spacing and type tokens that src/ui.html uses (var(--…)) come from
 *   web/tokens.css. They are copied, never retyped, and the build fails if one is missing.
 *
 * - The atlas's icons become a font (scripts/icon-font.js), written to web/fonts/ and inlined
 *   here as a data URL, so the lens selects' options can carry them.
 * - src/code.js and the library become plugins/figma/code.js, the main thread.
 *
 *   node plugins/figma/build.js      (npm run build:figma)
 */
import { build } from 'esbuild'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { buildIconFont } from '../../scripts/icon-font.js'

const here = p => fileURLToPath(new URL(p, import.meta.url))
const root = p => fileURLToPath(new URL('../../' + p, import.meta.url))
const fail = msg => { console.error(`build:figma: ${msg}`); process.exit(1) }

// 0. the atlas's icons as a font (scripts/icon-font.js): the whole font written to web/fonts/ for any page or tool;
// the plugin inlines the subset it shows (the lenses' icons), on the same codepoints
const full = buildIconFont()
writeFileSync(root('web/fonts/color-space-icons.ttf'), full.ttf)
writeFileSync(root('web/fonts/color-space-icons.json'), JSON.stringify(full.map, null, '\t') + '\n')
const iconFont = buildIconFont('color-space icons', key => /^(QI|LI)\./.test(key))

// 1. registry metadata, checked against the runtime ranges
if (!existsSync(root('data.json'))) fail('data.json is missing. Run `npm run data` first.')
const { spaces } = JSON.parse(readFileSync(root('data.json'), 'utf8'))
const { default: space } = await import(root('index.js'))
const KEEP = ['title', 'channels', 'range', 'method', 'encoding', 'referred', 'dynamic', 'year']   // what core.js and gl.js read
const meta = {}
for (const id of Object.keys(space)) {
	const m = spaces[id]
	if (!m?.channels || m.channels.length !== space[id].range.length) fail(`data.json channels for "${id}" don't match the library (${m?.channels?.length} vs ${space[id].range.length})`)
	meta[id] = Object.fromEntries(KEEP.filter(k => k in m).map(k => [k, m[k]]))
}

// 2. tokens: everything the template references and doesn't define, resolved through web/tokens.css
let template = readFileSync(here('src/ui.html'), 'utf8')
const tokensCss = readFileSync(root('web/tokens.css'), 'utf8')
const rootBlock = tokensCss.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1] ?? fail('no :root block in web/tokens.css')
const decls = new Map([...rootBlock.matchAll(/^\s*(--[\w-]+)\s*:\s*([^;]+);/gm)].map(m => [m[1], m[2].trim()]))
const own = new Set([...template.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map(m => m[1]))
const refs = s => [...s.matchAll(/var\((--[\w-]+)\s*\)/g)].map(m => m[1])   // var(--x, fallback) carries its own value
const need = new Set(), queue = refs(template).filter(t => !own.has(t) && !t.startsWith('--figma-'))
while (queue.length) {
	const t = queue.shift()
	if (need.has(t) || own.has(t) || t.startsWith('--figma-')) continue   // a token's own references may name the panel's themed colors
	if (!decls.has(t)) fail(`token ${t} is used by src/ui.html but not defined in web/tokens.css :root`)
	need.add(t)
	queue.push(...refs(decls.get(t)))
}
const tokens = [...decls].filter(([k]) => need.has(k)).map(([k, v]) => `\t${k}:${v};`).join('\n')

// 3. bundle: the library from source, data.json inline, no runtime loads
const sources = {
	name: 'sources',
	setup(b) {
		b.onResolve({ filter: /\/dist\/color-space\.js$/ }, () => ({ path: root('index.js') }))
		b.onResolve({ filter: /\/dist\/color-space-gl\.js$/ }, () => ({ path: root('gl/index.js') }))
		b.onResolve({ filter: /^\.\/data\.js$/ }, () => ({ path: 'data', namespace: 'inline' }))
		b.onLoad({ filter: /^data$/, namespace: 'inline' }, () => ({ contents: `export default ${JSON.stringify({ spaces: meta })}`, loader: 'js' }))
		// extract.js lazy-loads a 1.4 MB HEIC decoder for files the browser can't read; Figma stores
		// images as PNG, JPEG, GIF or WebP, which the iframe decodes natively
		b.onResolve({ filter: /\/libheif\.mjs$/ }, () => ({ path: 'heic', namespace: 'inline' }))
		b.onLoad({ filter: /^heic$/, namespace: 'inline' }, () => ({ contents: 'export default () => { throw new Error("HEIC is not decoded in the plugin") }', loader: 'js' }))
	},
}
const out = await build({
	entryPoints: [here('src/ui.js')],
	bundle: true,
	format: 'iife',
	minify: true,
	target: 'es2022',
	charset: 'utf8',
	legalComments: 'none',
	write: false,
	plugins: [sources],
	logLevel: 'warning',
})
const js = out.outputFiles[0].text.replace(/<\/(script)/gi, '<\\/$1')

// function replacers, so `$` in the bundle is never read as a replacement pattern
template = template.replace('/*TOKENS*/', () => tokens)
if (/<script[^>]+src=|<link[^>]+href=|@import|url\(/i.test(template)) fail('src/ui.html must be self-contained (no external src/href/url)')
if (/\bimport\(|\bfetch\(/.test(js)) fail('the UI bundle must not load anything at runtime (manifest networkAccess is none)')
template = template.replace('/*ICONFONT*/', () => `@font-face{ font-family:'color-space icons'; src:url(data:font/ttf;base64,${Buffer.from(iconFont.ttf).toString('base64')}) format('truetype') }`)
template = template.replace('/*BUNDLE*/', () => js.trim())
writeFileSync(here('ui.html'), template)
console.log(`plugins/figma/ui.html  ${(template.length / 1024).toFixed(1)} KB  (${Object.keys(meta).length} spaces, ${need.size} tokens)`)

// 4. the main thread: src/code.js with the library (codegen formats CSS in Figma's sandbox).
// Figma's sandbox runs a conservative JS subset, so the bundle is lowered to ES2017.
await build({
	entryPoints: [here('src/code.js')],
	bundle: true,
	format: 'iife',
	minify: true,
	target: 'es2017',
	charset: 'utf8',
	legalComments: 'none',
	outfile: here('code.js'),
	logLevel: 'warning',
})
console.log(`plugins/figma/code.js  ${(readFileSync(here('code.js'), 'utf8').length / 1024).toFixed(1)} KB`)
