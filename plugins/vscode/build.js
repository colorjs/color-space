#!/usr/bin/env node
/**
 * Build the VS Code extension into plugins/vscode/dist/:
 *
 * - panel.html: the Figma plugin's panel (plugins/figma/build.js panel()), with VS Code's words for what differs –
 *   a document's lines and literals where Figma has layers and fills – and src/host.css, the workbench's theme.
 *   English only for now: the panel's translations say Figma's words.
 * - extension.cjs: src/extension.js and the library, CommonJS for the extension host (vscode stays external).
 * - mcp.mjs: the library's MCP server (mcp.js) as one file, run by the editor's Node for its agents.
 * - LICENSE.md beside package.json: the repository's license.md, which the package must carry.
 * - icon.png (the project's mark, web/img/locus-512.png) and locus.svg (the view's, shown where it is moved to a bar of
 *   its own: the spectral locus as a line, web/js/locus.js).
 *
 *   node plugins/vscode/build.js      (npm run build:vscode)
 */
import { build } from 'esbuild'
import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { panel } from '../figma/build.js'
import { locusPath } from '../../web/js/locus.js'

const here = p => fileURLToPath(new URL(p, import.meta.url))
const root = p => fileURLToPath(new URL('../../' + p, import.meta.url))
mkdirSync(here('dist'), { recursive: true })

// the panel's words where VS Code isn't Figma: the colors are a document's, a color's place is a line, the profile is the
// gamut edits are written in
const WORDS = {
	'pl.empty.hint': 'No colors here. Open a stylesheet, code or a theme with colors, or an image.',
	'pl.paints': 'Colors in the document',
	'pl.scope.page': 'In this file',
	'pl.where.fill': 'line {n}',
	'pl.where.stroke': 'line {n}',
	'pl.dots.others': 'the other colors',
	'pl.gamut.out': 'Outside {gamut}; edits map it in.',
	'pl.note.dev': 'This document is read-only. Copy the values below.',
	'pl.note.more': 'Showing the first {n} colors.',
	'pl.note.mixed': 'Some colors here aren\'t read: their color space isn\'t one this library has (an .ase swatch in CMYK, Lab or Gray; an iTerm2 color without a Color Space).',
	'pl.note.virtual': 'An image\'s pixels are shown here, not edited.',
}

const html = await panel({ tables: { en: WORDS }, css: readFileSync(here('src/host.css'), 'utf8'), inter: false })   // the workbench's own face, not Figma's
writeFileSync(here('dist/panel.html'), html)
console.log(`plugins/vscode/dist/panel.html  ${(html.length / 1024).toFixed(1)} KB`)

await build({
	entryPoints: [here('src/extension.js')],
	bundle: true,
	format: 'cjs',
	platform: 'node',
	target: 'node20',
	external: ['vscode'],
	minify: true,
	charset: 'utf8',
	legalComments: 'none',
	outfile: here('dist/extension.cjs'),
	logLevel: 'warning',
})
await build({
	entryPoints: [root('mcp.js')],
	bundle: true,
	format: 'esm',
	platform: 'node',
	target: 'node20',
	minify: true,
	charset: 'utf8',
	legalComments: 'none',
	outfile: here('dist/mcp.mjs'),
	logLevel: 'warning',
})
for (const f of ['extension.cjs', 'mcp.mjs']) console.log(`plugins/vscode/dist/${f}  ${(readFileSync(here(`dist/${f}`)).length / 1024).toFixed(1)} KB`)

copyFileSync(root('web/img/locus-512.png'), here('dist/icon.png'))
copyFileSync(root('license.md'), here('LICENSE.md'))   // the package carries the repository's license (CC0); a copy, not committed
// the view's icon: the horseshoe (CIE 1931 xy, x 0–0.74, y 0–0.84) fit to a 24-unit box, a line in currentColor
const s = 20 / 0.83, P = ([x, y]) => [12 - 0.37 * s + x * s, 22 - y * s]
const pts = locusPath(P).slice(1, -1).split('L').filter((p, k, a) => p !== a[k - 1])   // 5 nm steps round to the same point at the ends
writeFileSync(here('dist/locus.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M${pts.join('L')}Z"/></svg>\n`)
