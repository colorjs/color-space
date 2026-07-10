#!/usr/bin/env node
/**
 * Stage the whole site into _site/ — the deployable artifact, built from data.
 * web/ is the site source (template, styles, page modules, images); everything
 * generated (prerendered catalog, 156 reference pages, sitemap/robots/llms) plus
 * the runtime modules the app imports land here. Used identically by local dev
 * (npm run landing → serve _site) and the Pages workflow, so the two can't drift.
 *
 * The staged copy flattens web/ to the site root, so runtime modules move from
 * ../ to ./ — the four known import specifiers are rewritten in the STAGED copies
 * only, and each rewrite must hit or the build fails (a renamed import can't
 * silently ship a broken site).
 */
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
export const site = join(root, '_site')

const rewrite = (file, pairs) => {
	let s = readFileSync(file, 'utf8')
	for (const [from, to] of pairs) {
		if (!s.includes(from)) throw new Error(`build-site: expected import '${from}' not found in ${file} — update the rewrite map`)
		s = s.split(from).join(to)
	}
	writeFileSync(file, s)
}

export async function buildSite() {
	rmSync(site, { recursive: true, force: true })
	mkdirSync(site, { recursive: true })
	// sources: the web/ tree verbatim (index.html template, tokens.css, js/, img/, 404)
	cpSync(join(root, 'web'), site, { recursive: true })
	// runtime modules the app imports, placed beside the flattened root
	for (const f of ['wasm.js', 'lut.js', 'data.json']) cpSync(join(root, f), join(site, f))
	mkdirSync(join(site, 'dist'), { recursive: true })
	for (const f of ['color-space.js', 'color-space-gl.js']) cpSync(join(root, 'dist', f), join(site, 'dist', f))
	mkdirSync(join(site, 'wasm'), { recursive: true })
	cpSync(join(root, 'wasm/binary.js'), join(site, 'wasm/binary.js'))
	// generated content: prerendered catalog, per-space pages, sitemap, robots, llms
	const { build } = await import('./generate-landing.js')
	build(site)
	// web/ speaks repo-relative paths; the staged site speaks root-relative —
	// rewrite AFTER generation (build() re-emits index.html from the web source)
	rewrite(join(site, 'index.html'), [["'../wasm.js'", "'./wasm.js'"], ["'../lut.js'", "'./lut.js'"]])
	rewrite(join(site, 'js/core.js'), [["'../../dist/color-space.js'", "'../dist/color-space.js'"], ["'../../data.json'", "'../data.json'"]])
	rewrite(join(site, 'js/gl.js'), [["'../../dist/color-space-gl.js'", "'../dist/color-space-gl.js'"]])
	// structural guard: any repo-relative import that escaped the map must fail the
	// build here, not 404 in production
	for (const f of readdirSync(join(site, 'js')))
		if (f.endsWith('.js') && readFileSync(join(site, 'js', f), 'utf8').includes("from '../../"))
			throw new Error(`build-site: ${f} still imports above the site root — extend the rewrite map`)
	if (/from '\.\.\//.test(readFileSync(join(site, 'index.html'), 'utf8')))
		throw new Error(`build-site: index.html still imports above the site root — extend the rewrite map`)
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) await buildSite()
