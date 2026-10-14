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
 * - The panel's languages: its own words (t('pl.…', English) in src/ui.js, data-i18n="pl.…" in src/ui.html) are
 *   written to src/i18n/en.json, translated in src/i18n/<lang>.json (the site's format, web/i18n/README.md); the
 *   words it shares with the site (lens names, families, channel names) come from web/i18n/<lang>.json. Fresh, valid
 *   translations only, inlined; a language ships once its own words are nearly all translated (COVER).
 * - src/code.js and the library become plugins/figma/code.js, the main thread.
 *
 *   node plugins/figma/build.js      (npm run build:figma)
 */
import { build } from 'esbuild'
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { buildIconFont } from '../../scripts/icon-font.js'
import { hash, units, status, plan, COVER } from '../../scripts/i18n.js'
import { format } from '../../scripts/i18n-extract.js'

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

// 2b. the panel's languages
const SHARED = /^(ui\.quant\.|ui\.gamut\.|ui\.cell\.draw$|cat\.|channel\.)/   // the site's words the panel says too
const uiSrc = readFileSync(here('src/ui.js'), 'utf8')
const words = {}
for (const m of uiSrc.matchAll(/\bt\(\s*'(pl\.[\w.-]+)'\s*,\s*'((?:[^'\\]|\\.)*)'/g)) {
	const en = m[2].replace(/\\(.)/g, '$1')
	if (words[m[1]] && words[m[1]] !== en) fail(`${m[1]} has two Englishes: "${words[m[1]]}" and "${en}"`)
	words[m[1]] = en
}
for (const u of units(template)) if (u.key?.startsWith('pl.')) {
	if (words[u.key] && words[u.key] !== u.en) fail(`${u.key} has two Englishes: "${words[u.key]}" and "${u.en}"`)
	words[u.key] = u.en
}
const enPl = Object.fromEntries(Object.keys(words).sort().map(k => [k, { t: words[k], h: hash(words[k]) }]))
writeFileSync(here('src/i18n/en.json'), format({ name: 'English', source: 'generated by plugins/figma/build.js – edit the English where it lives (src/ui.js, src/ui.html), never here' }, enPl))
const site = plan(root('web/i18n'), []).all
const TABLES = {}
for (const f of readdirSync(here('src/i18n')).filter(f => f.endsWith('.json') && f !== 'en.json').sort()) {
	const code = f.slice(0, -5), st = status(enPl, JSON.parse(readFileSync(here(`src/i18n/${f}`), 'utf8')), [])
	const done = st.ok.length + st.stale.length, keys = Object.keys(enPl).length
	console.log(`plugins/figma i18n ${code}: ${st.ok.length} ok · ${st.stale.length} stale · ${st.missing.length} missing · ${st.invalid.length} invalid`)
	if (done < COVER * keys) continue   // too little of the panel translated: it stays English
	const shared = site.find(l => l.code === code)?.table || {}
	TABLES[code] = { ...Object.fromEntries(Object.entries(shared).filter(([k]) => SHARED.test(k))), ...st.table }
}

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
		b.onResolve({ filter: /^virtual:i18n$/ }, () => ({ path: 'i18n', namespace: 'inline' }))
		b.onLoad({ filter: /^i18n$/, namespace: 'inline' }, () => ({ contents: `export default ${JSON.stringify(TABLES)}`, loader: 'js' }))
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
if (/<script[^>]+src=|<link[^>]+href=|@import|url\((?!["']?data:)/i.test(template)) fail('src/ui.html must be self-contained (no external src/href/url; data: URLs only)')
if (/\bimport\(|\bfetch\(/.test(js)) fail('the UI bundle must not load anything at runtime (manifest networkAccess is none)')
template = template.replace('/*ICONFONT*/', () => `@font-face{ font-family:'color-space icons'; src:url(data:font/ttf;base64,${Buffer.from(iconFont.ttf).toString('base64')}) format('truetype') }`)
template = template.replace('/*LOCUS*/', () => `data:image/png;base64,${readFileSync(root('web/img/locus-64.png')).toString('base64')}`)   // the project's mark (promo/promo.js icon)
template = template.replace('/*BUNDLE*/', () => js.trim())
writeFileSync(here('ui.html'), template)
console.log(`plugins/figma/ui.html  ${(template.length / 1024).toFixed(1)} KB  (${Object.keys(meta).length} spaces, ${need.size} tokens, ${['en', ...Object.keys(TABLES)].join(' ')})`)

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
