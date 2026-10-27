#!/usr/bin/env node
/**
 * Stage the whole site into _site/ — the deployable artifact, built from data.
 * web/ is the site source (template, styles, page modules, images); everything
 * generated (prerendered catalog, per-space atlas documents, sitemap/robots/llms) plus
 * the runtime modules the app imports land here. Used identically by local dev
 * (npm run landing → serve _site) and the Pages workflow, so the two can't drift.
 *
 * The staged copy flattens web/ to the site root, so runtime modules move from
 * ../ to ./ — the four known import specifiers are rewritten in the STAGED copies
 * only, and each rewrite must hit or the build fails (a renamed import can't
 * silently ship a broken site).
 *
 * Translations: i18n (default web/i18n) holds en.json, the extracted English, and one
 * <lang>.json per language. The build refuses a stale en.json, stamps /<lang>/ documents
 * for what each language has translated (scripts/i18n.js plan), and ships each one's
 * compiled runtime table as i18n/<lang>.json – the sources themselves never ship.
 */
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
export const site = join(root, '_site')

// fingerprint of every declared range — generate-reach.js stamps it into reach.js;
// the build refuses a stale reach (a range edit regenerates data.json but not the
// Monte Carlo, which once left osaucs showing 56% after its range widened to 96%)
export const rangesFp = m => createHash('sha1')
	.update(JSON.stringify(Object.keys(m).filter(s => m[s].range?.length >= 3).sort().map(s => [s, m[s].range])))
	.digest('hex').slice(0, 10)

// ── Cite: BibTeX + APA from CITATION.cff, formatted the way GitHub's "Cite this repository"
// does (ruby-cff's BibTeX and APALike formatters: @software, fields sorted, month as its
// three-letter macro, repository-code over url, a DOI first when there is one). Without a
// .cff the same record comes from package.json — the version is never typed twice.
// @see https://github.com/citation-file-format/ruby-cff/tree/main/lib/cff/formatters
const unq = (v) => v.trim().replace(/^(["'])(.*)\1$/, '$2')
export function readCff(txt) {   // the flat CFF subset a software record uses: top-level scalars + the authors list
	const out = { authors: [] }
	let list = null, item = null
	for (const line of txt.split('\n')) {
		if (/^\s*(#|$)/.test(line)) continue
		const top = line.match(/^([\w-]+):\s*(.*)$/)
		if (top) { list = top[1] === 'authors' ? out.authors : null; if (!list && top[2] && !/^[>|]/.test(top[2])) out[top[1]] = unq(top[2]); continue }
		const it = list && line.match(/^\s*(-\s+)?([\w-]+):\s*(.*)$/)
		if (!it) continue
		if (it[1]) list.push(item = {})
		if (item) item[it[2]] = unq(it[3])
	}
	return out
}
export function citation(dir = root) {
	let c
	if (existsSync(join(dir, 'CITATION.cff'))) c = readCff(readFileSync(join(dir, 'CITATION.cff'), 'utf8'))
	else {
		const p = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')), a = String(p.author || '').match(/^\s*(.*?)\s+(\S+)\s*(?:<|$)/)
		c = { title: p.name, version: p.version, license: p.license, url: p.homepage,
			'repository-code': /^[\w.-]+\/[\w.-]+$/.test(p.repository || '') ? `https://github.com/${p.repository}` : '',
			authors: a ? [{ 'given-names': a[1], 'family-names': a[2] }] : [] }
	}
	const tex = (s) => String(s).replace(/([&%$#_{}])/g, '\\$1')
	const date = /^(\d{4})-(\d{2})/.exec(c['date-released'] || ''), year = date ? date[1] : ''
	const MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
	const url = c.doi ? `https://doi.org/${c.doi}` : c['repository-code'] || c.url || ''
	const fam = (a) => [a['name-particle'], a['family-names']].filter(Boolean).join(' ')
	const bibAuthor = c.authors.map((a) => a.name ? `{${tex(a.name)}}` : [fam(a), a['name-suffix'], a['given-names']].filter(Boolean).join(', ')).join(' and ')
	const fields = { author: bibAuthor, doi: c.doi && tex(c.doi), license: c.license && tex(c.license), month: date ? MON[+date[2] - 1] : '',
		title: `{${tex(c.title)}}`, url: c['repository-code'] || c.url || '', version: c.version && tex(c.version), year }
	const key = `${bibAuthor.split(',')[0]}_${fields.title.split(/\s+/).slice(0, 3).join('_')}_${year}`.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\-_]+/gi, '_').replace(/_{2,}/g, '_').replace(/^_|_$/g, '')
	const bibtex = `@software{${key},\n${Object.keys(fields).filter((k) => fields[k]).sort().map((k) => `  ${k} = ${k === 'month' ? fields[k] : `{${fields[k]}}`}`).join(',\n')}\n}`
	const ini = (g) => g.split(/\s+/).map((p) => p.includes('-') ? p.split('-').map((x) => x[0].toUpperCase()).join('.-') : p[0].toUpperCase()).join('. ')
	const apaName = (a) => a.name || [a['name-particle'], [a['family-names'], a['given-names'] && `${ini(a['given-names'])}.`].filter(Boolean).join(', ')].filter(Boolean).join(' ') + (a['name-suffix'] ? `, ${a['name-suffix']}` : '')
	const names = c.authors.map(apaName), who = (names.length > 1 ? `${names.slice(0, -1).join(', ')}, & ${names.at(-1)}` : names[0] || '').replace(/\.$/, '')
	const apa = [who, year && `(${year})`, `${c.title}${c.version ? ` (Version ${c.version})` : ''} [Computer software]`, url].filter(Boolean).join('. ')
	return { title: c.title, bibtex, apa }
}

const rewrite = (file, pairs) => {
	let s = readFileSync(file, 'utf8')
	for (const [from, to] of pairs) {
		if (!s.includes(from)) throw new Error(`build-site: expected import '${from}' not found in ${file} — update the rewrite map`)
		s = s.split(from).join(to)
	}
	writeFileSync(file, s)
}

export async function buildSite({ out = site, i18n = join(root, 'web/i18n') } = {}) {
	// i18n guard: en.json is what translators translate and what every h is checked against —
	// an English edit (index.html, data.json, lore…) not re-extracted would leave translations
	// of OLD English passing as fresh. Same contract as the reach guard below
	const { catalog } = await import('./i18n-extract.js'), { plan } = await import('./i18n.js'), { SPACES } = await import('../web/js/render.js')
	if (!existsSync(join(i18n, 'en.json')) || readFileSync(join(i18n, 'en.json'), 'utf8') !== await catalog())
		throw new Error(`build-site: ${join(i18n, 'en.json')} is stale — the English changed; run: npm run i18n`)
	const lang = plan(i18n, SPACES)
	// social cards first — the site's (web/img/og.png) and the spaces' (web/img/og, gitignored
	// cache); only missing/stale cards bake, so the cpSync below ships them with the rest
	const { siteCard, spaceCards } = await import('./generate-og.js')
	await siteCard(); await spaceCards()
	rmSync(out, { recursive: true, force: true })
	mkdirSync(out, { recursive: true })
	// sources: the web/ tree verbatim (index.html template, tokens.css, js/, img/, 404)
	cpSync(join(root, 'web'), out, { recursive: true, filter: (f) => f !== join(root, 'web/i18n') })   // translation sources stay home; stampPages ships the compiled tables
	// runtime modules the app imports, placed beside the flattened root
	for (const f of ['wasm.js', 'lut.js', 'css.js', 'math.js', 'data.json']) cpSync(join(root, f), join(out, f))
	cpSync(join(root, 'conformance.json'), join(out, 'conformance.json'))   // not imported: served for other libraries' test suites
	mkdirSync(join(out, 'dist'), { recursive: true })
	for (const f of ['color-space.js', 'color-space-gl.js']) cpSync(join(root, 'dist', f), join(out, 'dist', f))
	cpSync(join(root, 'wasm'), join(out, 'wasm'), { recursive: true })
	// the data modules the page imports on demand – kept in web/js too, so the page served from its source finds them;
	// written only when their bytes change
	const both = (f, text) => { const src = join(root, 'web/js', f); if (!existsSync(src) || readFileSync(src, 'utf8') !== text) writeFileSync(src, text); writeFileSync(join(out, 'js', f), text) }
	// meodai's color-name-list (MIT, David Aerne): every name a line, then every hex in their order, as one string a module
	// exports – the color field's search imports it on first use, the host gzips it, the offline precache keeps it
	{	const l = JSON.parse(readFileSync(join(root, 'node_modules/color-name-list/dist/colornames.json'), 'utf8')).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
		both('colornames.js', `// color-name-list ${JSON.parse(readFileSync(join(root, 'node_modules/color-name-list/package.json'), 'utf8')).version} – MIT, David Aerne (meodai): generated by scripts/build-site.js\nexport default ${JSON.stringify(l.map(c => c.name).join('\n') + '\n' + l.map(c => c.hex.slice(1)).join(''))}\n`) }
	// Sanzo Wada's A Dictionary of Color Combinations (1933), as Matt DesLauriers keeps it (MIT): its 159 colors and the
	// 348 combinations of two to four of them – the color field's palettes
	{	const d = JSON.parse(readFileSync(join(root, 'node_modules/dictionary-of-colour-combinations/colors.json'), 'utf8')), combos = {}
		d.forEach((c, i) => c.combinations.forEach((k) => (combos[k] ??= []).push(i)))
		both('wada.js', `// dictionary-of-colour-combinations – MIT, Matt DesLauriers, after Sanzo Wada (1933): generated by scripts/build-site.js\nexport const colors = ${JSON.stringify(d.map((c) => [c.name, c.hex]))}\nexport const combos = ${JSON.stringify(Object.entries(combos).map(([k, v]) => [+k, v]))}\n`) }   // the whole runtime dir — hand-listing files here once shipped a 404 (wasm/spaces.js) that killed the page's module graph
	// the colormaps, palettes and gradients the color field draws from, each from where it lives. Colormaps, each map's five
	// quarters (0, ¼, ½, ¾, 1): ColorBrewer's schemes (Cynthia Brewer), Google's Turbo and d3's own as d3-scale-chromatic
	// carries them (ISC); MATLAB's classic maps, Plotly's colorscales and cmocean's (Thyng et al. 2016) as the colormap
	// package keeps them (MIT) – its control points, met linearly in sRGB as that package meets them. Palettes: the
	// COLOURlovers favourites Experience Monks keep as nice-color-palettes (MIT); Kjetil Golid's chromotome (MIT).
	// Gradients: uiGradients' community collection (CC0, as uigradients.gradients keeps it); WebGradients' 180 (itmeo,
	// as tailwindcss-webgradients carries them, MIT) – their colors in order, positions let go
	{	const d3 = await import('d3-scale-chromatic'), nice = JSON.parse(readFileSync(join(root, 'node_modules/nice-color-palettes/1000.json'), 'utf8'))
		const req = createRequire(import.meta.url), cmap = req('colormap/colorScale.js'), chromo = (await import('chromotome')).getAll()
		const ui = req('uigradients.gradients').gradients, wg = req('tailwindcss-webgradients/src/gradients.js')
		const hx = (c) => { const m = c.match(/\d+/g); return c[0] === '#' ? c.toLowerCase() : '#' + m.slice(0, 3).map((x) => (+x).toString(16).padStart(2, '0')).join('') }
		const five = (f) => [0, 0.25, 0.5, 0.75, 1].map((t) => hx(f(t))).join(' ')
		const of = (names) => names.map((n) => [n.toLowerCase(), five(d3['interpolate' + n])])
		const at = (pts, t) => { const j = Math.max(1, pts.findIndex((p) => p.index >= t)), a = pts[j - 1], b = pts[j] || a, k = b.index > a.index ? (t - a.index) / (b.index - a.index) : 0
			return `rgb(${[0, 1, 2].map((i) => Math.round(a.rgb[i] + (b.rgb[i] - a.rgb[i]) * k)).join(',')})` }
		const cm = (names) => names.map(([n, k]) => { if (!cmap[k]) throw new Error(`colormap: no ${k}`); return [n, five((t) => at(cmap[k], t))] })
		const sets = { colorbrewer: of(['Blues', 'Greens', 'Greys', 'Oranges', 'Purples', 'Reds', 'BuGn', 'BuPu', 'GnBu', 'OrRd', 'PuBu', 'PuBuGn', 'PuRd', 'RdPu', 'YlGn', 'YlGnBu', 'YlOrBr', 'YlOrRd', 'BrBG', 'PRGn', 'PiYG', 'PuOr', 'RdBu', 'RdGy', 'RdYlBu', 'RdYlGn', 'Spectral']),
			google: of(['Turbo']), d3: of(['Sinebow', 'Rainbow', 'Warm', 'Cool', 'CubehelixDefault']).map(([n, c]) => [n === 'cubehelixdefault' ? 'cubehelix' : n, c]),
			matlab: cm(['jet', 'hsv', 'hot', 'cool', 'spring', 'summer', 'autumn', 'winter', 'bone', 'copper'].map((n) => [n, n])),
			plotly: cm([['bluered', 'bluered'], ['rdbu', 'rdbu'], ['ylgnbu', 'yignbu'], ['ylorrd', 'yiorrd'], ['greens', 'greens'], ['greys', 'greys'], ['picnic', 'picnic'], ['portland', 'portland'], ['blackbody', 'blackbody'], ['earth', 'earth'], ['electric', 'electric']]),
			cmocean: cm(['bathymetry', 'cdom', 'chlorophyll', 'density', 'freesurface-blue', 'freesurface-red', 'oxygen', 'par', 'phase', 'salinity', 'temperature', 'turbidity', 'velocity-blue', 'velocity-green'].map((n) => [n, n])),
			nice: nice.map((p) => p.join(' ')), chromotome: chromo.map((p) => [p.name, p.colors.map(hx).join(' ')]),
			uigradients: Object.entries(ui).map(([n, c]) => [n, c.map(hx).join(' ')]),
			webgradients: Object.entries(wg).map(([n, g]) => [n.replace(/-/g, ' '), (String(g.backgroundImage).match(/linear-gradient\(([^()]|\([^()]*\))*\)/)?.[0].match(/#[\da-f]{6}\b/gi) || []).map(hx).filter((c, i, l) => c !== l[i - 1])]).filter(([, c]) => c.length > 1).map(([n, c]) => [n, c.join(' ')]) }
		both('sets.js', `// colormaps (d3-scale-chromatic – ISC: ColorBrewer, Turbo, d3's own; colormap – MIT: MATLAB's, Plotly's, cmocean's), palettes (nice-color-palettes, chromotome – MIT) and gradients (uiGradients – CC0, WebGradients – MIT): generated by scripts/build-site.js\nexport default ${JSON.stringify(sets)}\n`) }
	// icc.js reaches into the rgb/xyz/transfers chain for the Bradford matrix — bundle it
	// self-contained (the landing's live ICC exporter imports it) rather than flatten each dep
	const esbuild = await import('esbuild')
	await esbuild.build({ entryPoints: [join(root, 'icc.js')], bundle: true, format: 'esm', minify: true, outfile: join(out, 'icc.js'), logLevel: 'silent' })
	await esbuild.build({ entryPoints: [join(root, 'ocio.js')], bundle: true, format: 'esm', minify: true, outfile: join(out, 'ocio.js'), logLevel: 'silent' })   // ocio.js too: gamuts, math and the hub's Bradford, one file
	// mcp.js for the page's WebMCP tools (js/webmcp.js imports it where the browser offers them): bundled with the shader
	// emitters and their naga, the vendored naga-wasm as the page's GL tab loads it; what the page already serves – the
	// library, its GL registry, data.json, lut/icc/css, the web/js data modules – stays an import of the page's own copy;
	// node:* only the stdio and HTTP servers import, never run here
	{	const own = { 'index.js': './dist/color-space.js', 'gl/index.js': './dist/color-space-gl.js', 'data.json': './data.json', 'lut.js': './lut.js', 'icc.js': './icc.js', 'css.js': './css.js' }
		const site = { name: 'site', setup(b) {
			b.onResolve({ filter: /^naga-wasm$/ }, () => ({ path: './vendor/naga-wasm/index.js', external: true }))
			b.onResolve({ filter: /^\./ }, ({ path: p, importer }) => { const f = relative(root, join(dirname(importer), p))
				const to = own[f] ?? (f.startsWith('web/js/') ? './' + f.slice(4) : null); return to ? { path: to, external: true } : undefined }) } }
		await esbuild.build({ entryPoints: [join(root, 'mcp.js')], bundle: true, format: 'esm', minify: true, plugins: [site], external: ['node:*'], outfile: join(out, 'mcp.js'), logLevel: 'silent' }) }
	// lighthigh (MIT, dy) paints the code plates through the CSS Custom Highlight API: its CommonJS as a module the page
	// imports with its first plate
	both('lighthigh.js', `// lighthigh ${JSON.parse(readFileSync(join(root, 'node_modules/lighthigh/package.json'), 'utf8')).version} – MIT, dy: generated by scripts/build-site.js\n` +
		(await esbuild.build({ entryPoints: [join(root, 'node_modules/lighthigh/index.js')], bundle: true, format: 'esm', minify: true, write: false, logLevel: 'silent' })).outputFiles[0].text)
	// gl/naga.js (HLSL/MSL via naga) the same way, for the GL tab to lazy-load beside the
	// vendored vendor/naga-wasm: the page passes that module to emit(), so naga-wasm stays external.
	// gl/translate.js (the WGSL pick) rides the same build, split, so naga.js and translate.js
	// share one translator chunk instead of each carrying a copy
	await esbuild.build({ entryPoints: [join(root, 'gl/naga.js'), join(root, 'gl/translate.js')], bundle: true, splitting: true, format: 'esm', minify: true, outdir: join(out, 'gl'), external: ['naga-wasm'], logLevel: 'silent' })
	// generated content: prerendered catalog, per-space pages, sitemap, robots, llms
	const { build } = await import('./generate-landing.js')
	build(out, lang)
	// Cite: the footer popover's two plates, filled from CITATION.cff (the stamped name views
	// copy index.html later, so they carry it too)
	{	const { bibtex, apa } = citation(), h = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
		rewrite(join(out, 'index.html'), [['<pre class="snip" id="citebib"></pre>', `<pre class="snip" id="citebib">${h(bibtex)}</pre>`], ['<pre class="snip" id="citeapa"></pre>', `<pre class="snip" id="citeapa">${h(apa)}</pre>`]])
	}
	// ── extract the app module out of index.html into js/app.js: the page parses lighter,
	// the module graph preloads from the head (below), and the module minifies with the
	// rest. Specifiers rebase from the page root to js/ — './js/x' → './x', './vendor/x' →
	// '../vendor/x' (the lazy naga-wasm); the '../' runtime modules (wasm/lut/icc) land beside
	// the site root, one level up from js/, so the web-form '../x.js' specifiers are ALREADY
	// staged-correct from js/app.js.
	{	let html = readFileSync(join(out, 'index.html'), 'utf8')
		const m = html.match(/<script type="module">([\s\S]*?)<\/script>/)
		if (!m) throw new Error('build-site: inline app module not found in index.html')
		writeFileSync(join(out, 'index.html'), html.replace(m[0], '<script type="module" src="./js/app.js"></script>'))
		writeFileSync(join(out, 'js/app.js'), m[1])
		rewrite(join(out, 'js/app.js'), [["'./js/", "'./"], ["'./vendor/", "'../vendor/"]])
	}
	// web/ speaks repo-relative paths; the staged site speaks root-relative —
	// rewrite AFTER generation (build() re-emits index.html from the web source)
	rewrite(join(out, 'js/core.js'), [["'../../dist/color-space.js'", "'../dist/color-space.js'"], ["'../../math.js'", "'../math.js'"], ["'../../css.js'", "'../css.js'"]])
	rewrite(join(out, 'js/stops.js'), [["'../../math.js'", "'../math.js'"]])
	rewrite(join(out, 'js/data.js'), [["'../../data.json'", "'../data.json'"]])
	rewrite(join(out, 'js/gl.js'), [["'../../dist/color-space-gl.js'", "'../dist/color-space-gl.js'"]])
	rewrite(join(out, 'js/calc.js'), [["'../../lut.js'", "'../lut.js'"], ["'../../icc.js'", "'../icc.js'"]])
	rewrite(join(out, 'js/webmcp.js'), [["'../../mcp.js'", "'../mcp.js'"]])
	// structural guard: any repo-relative import that escaped the map must fail the
	// build here, not 404 in production
	for (const f of readdirSync(join(out, 'js')))
		if (f.endsWith('.js') && readFileSync(join(out, 'js', f), 'utf8').includes("from '../../"))
			throw new Error(`build-site: ${f} still imports above the site root — extend the rewrite map`)
	if (/from '\.\.\//.test(readFileSync(join(out, 'index.html'), 'utf8')))
		throw new Error(`build-site: index.html still imports above the site root — extend the rewrite map`)
	// reach guard: reach.js is a Monte Carlo over the declared ranges — regenerate it
	// whenever any range changes, or the label under the horseshoe quietly lies
	{	const stamp = readFileSync(join(out, 'js/reach.js'), 'utf8').match(/^\/\/ ranges (\w+)/m)?.[1]
		const fp = rangesFp(JSON.parse(readFileSync(join(root, 'data.json'), 'utf8')).spaces)
		if (stamp !== fp) throw new Error(`build-site: reach.js is stale (ranges ${stamp ?? 'unstamped'} ≠ ${fp}) — run: node scripts/generate-reach.js`)
	}
	// shader guard: a uniform used in a site shader but not declared in that stage silently
	// fails to compile — undeclared uBip in fsSurf once blanked the whole 3D solid, and the
	// library's gl tests eval chunks as JS so they can't see it. Every referenced uniform
	// must be declared in the shader (or in MAP_GLSL when that shader interpolates it).
	// Match every shader by its #version header, not the assignment form, so caps built as
	// `const fsCap = fsCapVis || glin && \`#version…\`` are covered alongside vs/fsSurf.
	{	const gl = readFileSync(join(out, 'js/gl.js'), 'utf8')
		const decl = (s) => [...s.matchAll(/uniform\s+(?:(?:lowp|mediump|highp)\s+)?\w+\s+([^;]+);/g)].flatMap((x) => x[1].split(',').map((t) => t.trim().replace(/\[.*$/, '')))
		const mapU = new Set(decl(gl.match(/const MAP_GLSL = `([\s\S]*?)`/)[1]))
		for (const [, src] of gl.matchAll(/`(#version 300 es[\s\S]*?)`/g)) {
			const declared = new Set([...decl(src), ...(src.includes('${MAP_GLSL}') ? mapU : [])])
			const bad = [...new Set([...src.matchAll(/\bu[A-Z]\w*/g)].map((x) => x[0]))].filter((u) => !declared.has(u))
			if (bad.length) throw new Error(`build-site: a site shader uses undeclared uniform(s): ${bad.join(', ')} — declare them in that shader stage (near: ${src.replace(/\s+/g, ' ').slice(0, 70)}…)`)
		}
	}
	// ── flatten the load waterfall (LAST — the guards above read the pre-minified
	// staged sources): compact data.json, BFS the staged import graph from the two
	// entry modules, minify every module in it, and preload the WHOLE graph (plus the
	// data.json fetch) from the head — the browser fetches everything at once instead
	// of discovering each level after parsing the one above
	writeFileSync(join(out, 'data.json'), JSON.stringify(JSON.parse(readFileSync(join(out, 'data.json'), 'utf8'))))
	{	const spec = (code) => [...code.matchAll(/(?:import|from)\s*['"](\.[^'"]+)['"]/g)].map((x) => x[1])
		const graph = ['js/app.js', 'js/tip.js'], seen = new Set(graph)
		for (let i = 0; i < graph.length; i++) {
			const dir = dirname(graph[i])
			for (const sp of spec(readFileSync(join(out, graph[i]), 'utf8'))) {
				const p = join(dir, sp)
				if (!seen.has(p)) { seen.add(p); graph.push(p) }
			}
		}
		for (const p of graph) {
			const f = join(out, p)
			const { code } = await esbuild.transform(readFileSync(f, 'utf8'), { minify: true, format: 'esm', target: 'es2022' })
			writeFileSync(f, code)
		}
		const links = `<link rel="preload" href="./data.json" as="fetch" crossorigin>` +
			graph.map((p) => `<link rel="modulepreload" href="./${p}">`).join('')
		rewrite(join(out, 'index.html'), [['<link href="./tokens.css" rel="stylesheet">', `<link href="./tokens.css" rel="stylesheet">${links}`]])
	}
	// per-space documents stamp LAST — byte-copies of the now-final index.html, in English and
	// in every language the plan stamps
	const { stampPages } = await import('./generate-landing.js')
	stampPages(out, lang)
	// …then each gets its dossier prerendered INTO it — the name view shows its space
	// at first paint (headless capture of the real app; skips gracefully without a browser)
	const { bakeDossiers } = await import('./bake-dossiers.js')
	await bakeDossiers(out, lang)
	// ── sw.js: stamp the offline shell. Precache set = the root document + every staged
	// non-document asset (space pages are byte-copies of index.html and the router reads
	// the path, so the shell alone serves the whole atlas offline) + each language's index,
	// the shell of its /<lang>/ pages. VERSION = content hash of the set — a deploy
	// invalidates the cache exactly when bytes change.
	// vendor/naga-wasm (2 MB, loaded only when a shader tab opens) stays out of the precache
	{	const skip = /\.(html|xml|txt|md)$|(^|\/)(CNAME|sw\.js)$|^vendor\/naga-wasm\//
		const files = []
		const walk = (d) => { for (const f of readdirSync(join(out, d), { withFileTypes: true })) {
			const p = d ? `${d}/${f.name}` : f.name
			if (f.isDirectory()) walk(p)
			else if (!skip.test(p)) files.push(p)
		} }
		walk('')
		files.sort()
		const h = createHash('sha1'), langs = lang.langs.map((l) => l.code)
		for (const p of ['index.html', ...langs.map((c) => `${c}/index.html`), ...files]) h.update(readFileSync(join(out, p)))
		rewrite(join(out, 'sw.js'), [
			["const VERSION = 'dev'", `const VERSION = '${h.digest('hex').slice(0, 10)}'`],
			["const ASSETS = ['./']", `const ASSETS = ${JSON.stringify(['./', ...langs.map((c) => `./${c}/`), ...files.map((p) => './' + p)])}`],
			["const LANGS = []", `const LANGS = ${JSON.stringify(langs)}`],
		])
	}
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) await buildSite()
