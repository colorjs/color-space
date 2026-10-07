// Generate the site CONTENT into an output dir (default _site — see build-site.js,
// which stages sources + runtime modules around it): the prerendered landing
// (crawlable static markup — the page re-renders the identical template on load),
// sitemap.xml + robots.txt, and llms.txt. stampPages() then writes <name>.html
// for every space — the 200-status document /<name> deep links and search engines
// land on is the atlas itself (the app's router opens the dossier from the path;
// 404.html only catches unknown slugs) — and the same set under /<lang>/ for every
// language the i18n plan stamps. web/ holds the source; docs/ is markdowns.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { catHTML, sections, SPACES, DEFAULT, fpOf, disp } from '../web/js/render.js'
import { meta, spaceCount, LUTOK, rgbOf, hex } from '../web/js/core.js'
import PURPOSE, { ORDER as PORDER, TIPS as PTIPS } from '../web/js/purpose.js'
import { t, use } from '../web/js/i18n.js'
import { apply } from './i18n.js'

// registry drift guards: every space carries a purpose tag from the vocabulary (else it
// silently drops out of the purpose filter), and every catalog family carries its tooltip
{ const untagged = SPACES.filter(s => !PURPOSE[s]?.length)
	if (untagged.length) throw new Error(`purpose.js: untagged spaces — ${untagged.join(', ')}`)
	const unknown = SPACES.flatMap(s => PURPOSE[s].filter(t => !PORDER.includes(t)))
	if (unknown.length) throw new Error(`purpose.js: tags outside ORDER — ${[...new Set(unknown)].join(', ')}`)
	const untipped = sections.filter(c => c.name !== 'more' && !c.tip).map(c => c.name)
	if (untipped.length) throw new Error(`categories.js: families missing tip — ${untipped.join(', ')}`)
	const unyeared = SPACES.filter(s => !isFinite(meta[s]?.year))
	if (unyeared.length) throw new Error(`meta: no birth year — ${unyeared.join(', ')} (the era grouping and history filter drop them silently)`)
	// dash policy: curated site content uses the en dash; the em dash reads as generated filler.
	// (meta descriptions are the library's JSDoc — out of this guard's reach by design.)
	const LORE = (await import('../web/js/lore.js')).default
	const emdash = [catHTML().includes(' — ') && 'catHTML (names/tips)',
		Object.values(LORE).some(l => Object.values(l).some(v => String(v).includes(' — '))) && 'lore.js',
		Object.values(PTIPS).some(v => v.includes(' — ')) && 'purpose.js tips'].filter(Boolean)
	if (emdash.length) throw new Error(`em dash in curated content — ${emdash.join(', ')}; the site voice uses the en dash ( – )`) }

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
// the one deployment-coupled constant: canonical/sitemap URLs must be absolute.
// If v3 publishes under a different base (e.g. …/color-space/docs), change it here.
const SITE = 'https://color-space.io'
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
// per-space social card, when generate-og.js has rendered it (gitignored cache)
const cardOf = (s) => existsSync(join(root, 'web/img/og', s + '.jpg')) ? `${SITE}/img/og/${s}.jpg` : null
// sitemap lastmod from git — the last commit touching each space's source; shallow
// clones degrade to the HEAD date, which is still a valid (if uniform) lastmod
const git = (cmd) => { try { return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }) } catch { return '' } }
const HEAD_DATE = git('git log -1 --format=%cI').trim().slice(0, 10) || new Date().toISOString().slice(0, 10)
const SRC_DATE = (() => { const map = {}; let d = HEAD_DATE
	for (const ln of git('git log --format=%x01%cI --name-only -- spaces').split('\n')) {
		if (ln.startsWith('\x01')) d = ln.slice(1, 11)
		else { const m = ln.match(/^spaces\/(.+)\.js$/); if (m && !map[m[1]]) map[m[1]] = d }
	}
	return map })()
// a translated page changes when its space's source OR its language file does
const langDate = (code) => git(`git log -1 --format=%cI -- web/i18n/${code}.json`).trim().slice(0, 10) || HEAD_DATE
const dateOf = (s, lang) => { const d = s ? SRC_DATE[s] || HEAD_DATE : HEAD_DATE, l = lang === 'en' ? '' : langDate(lang); return l > d ? l : d }

// ── languages: every document's address, its hreflang group and its catalog ──
// English is the root; a language lives under /<lang>/ (GitHub Pages can't rewrite, so each
// is a stamped document). EN is the plan's shape for the source language
const EN = { code: 'en', name: 'English', table: {}, pages: new Set(['', ...SPACES]), indexed: true }
export const pageURL = (lang, s = '') => `${SITE}/${lang === 'en' ? '' : lang + '/'}${s}`
// the hreflang group of a page: English, every language that stamps it, x-default → English;
// a page only English has carries none
export const alternates = (i18n, s = '') => {
	const ls = (i18n?.langs || []).filter((l) => l.indexed && l.pages.has(s))
	return ls.length ? [['en', pageURL('en', s)], ...ls.map((l) => [l.code, pageURL(l.code, s)]), ['x-default', pageURL('en', s)]] : [] }
// the catalog baked in the current language (use() set by the caller): default-color values,
// slider gradients and tick markers; data-fp fingerprints the bare template so the page
// hydrates the existing DOM instead of rebuilding it, replacing only on drift.
// Hydration contract: the baked variant may differ from the bare template ONLY in
// attributes — an element added or dropped under `vals` would hand the page a DOM
// its wiring doesn't expect, and the fingerprint (bare vs bare) can't see it
const catalog = () => { const bare = catHTML(), baked = catHTML(DEFAULT)
	const shape = (h) => h.replace(/<([a-z0-9]+)(\s[^>]*)?>/gi, '<$1>')
	if (shape(bare) !== shape(baked)) throw new Error('generate-landing: catHTML(DEFAULT) changes element structure, not just attributes — hydration would desync')
	return `<main class="cat" id="cat" data-fp="${fpOf(bare)}">${baked}</main>` }
// the hero's facts, read off the data: how many spaces, and the years they span
const years = SPACES.map((s) => +meta[s].year).filter(Boolean), FACT = { n: spaceCount, y0: Math.min(...years), y1: Math.max(...years) }
const counts = (h) => h.replace(/(<span id="(n|y0|y1)">)[^<]*(<\/span>)/g, (m, a, k, b) => a + FACT[k] + b)

export function build(out = join(root, '_site'), i18n) {
// ── index.html: static catalog + live counts + version (from the web/ source) ──
let html = readFileSync(join(root, 'web/index.html'), 'utf8')
const inject = (re, repl) => { if (!re.test(html)) throw new Error(`anchor not found: ${re}`); html = html.replace(re, repl) }
// the catalog ships COMPLETE, in English here (stampPages re-bakes it per language)
const cat = catalog()
inject(/<main class="cat" id="cat"[^>]*>[\s\S]*?<\/main>/, () => cat)
inject(/(<a class="ver tnum" id="ver"[^>]*>)[^<]*(<\/a>)/, `$1v${version}$2`)
for (const k of ['n', 'y0', 'y1']) inject(new RegExp(`(<span id="${k}">)[^<]*(</span>)`), `$1${FACT[k]}$2`)
// the current-color rhombus + value carry the DEFAULT color from the first frame —
// an unvalued <input type=color> paints BLACK until the module lands
const dhx = hex(rgbOf(DEFAULT.s, DEFAULT.vals))
inject(/(<input type="color" class="cd" id="cd")/, `$1 value="${dhx.toLowerCase()}"`)
inject(/(<input id="cval")/, `$1 value="${dhx}"`)
// the meta descriptions carry no live count by design — the counts live in #n and the per-space stamps
html = html.replace(/any of \d+ × \d+ pairs/g, `any of ${spaceCount} × ${spaceCount - 1} pairs`)
// the registry as a schema.org Dataset — Google Dataset Search reaches the science
// crowd; homepage only (stampSpacePages strips it — a copy on every space page would read as spam)
const ld = { '@context': 'https://schema.org', '@type': 'Dataset',
	name: 'color-space — color space registry',
	description: `Machine-readable registry of ${spaceCount} color spaces: channels and conventional ranges, conversion-graph edges, gamut primaries, white points, CIE 1931 2° color-matching functions, provenance and cited conformance anchors.`,
	url: SITE, sameAs: 'https://github.com/colorjs/color-space',
	license: 'https://creativecommons.org/publicdomain/zero/1.0/', isAccessibleForFree: true,
	creator: { '@type': 'Person', name: 'Dmitry Ivanov' },
	keywords: ['color space', 'color conversion', 'colorimetry', 'OKLCH', 'CIELAB', 'CAM16', 'ACES', 'LUT', 'ICC'],
	distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: `${SITE}/data.json` }] }
inject(/(<link rel="canonical" href="[^"]*">)/, `$1<script type="application/ld+json" id="ld-dataset">${JSON.stringify(ld)}</script>`)
writeFileSync(join(out, 'index.html'), html)

// ── llms.txt: machine-readable index of every space ──
const rng = c => c.max === 360 ? `${c.symbol} 0–360°` : `${c.symbol} ${c.min}–${c.max}`
const line = s => { const m = meta[s] || {}
	const ch = (m.channels || []).map(rng).join(', ')
	const desc = (m.description || '').replace(/\s+/g, ' ').trim()
	const org = m.year || m.by ? ` | origin: ${[m.year, m.by].filter(Boolean).join(' ')}` : ''
	const ref = m.refs?.[0] ? ` | ref: ${m.refs[0]}` : ''
	return `- ${s} — ${desc}${org} | channels: ${ch}${ref}` }
const installName = version.includes('-') ? 'color-space@next' : 'color-space'
const llms = `# color-space — ${spaceCount} color spaces, one tiny JS API

> Converts colors between ${spaceCount} spaces using each space's conventional ranges
> (what CSS and the defining papers use). All ${spaceCount} spaces are test-pinned: most by an
> independent cited reference value, 29 differential-tested against colorjs.io in both directions. Zero dependencies, public domain (CC0).

Install: npm i ${installName}
API: space[from][to](...values) -> number[]     e.g. space.rgb.oklch(255, 128, 0)
Batch: space[from][to](pixels) -> Float64Array  interleaved array-like, stride = channel count; a batch of one = the v2 array call
Per space: space[name].range (channel ranges), space[name].name
Metadata: color-space/data.json — spaces (channels, refs, illuminant, referred, dynamic, year, by, use, neighbors) + gamuts, whitepoints, CMFs, conformance
Tree-shaken: import oklch from 'color-space/oklch.js' (~2 kB per space; scalar form — batch is wired by the hubs)
Compact hub: import space from 'color-space/lite' — the 27 wasm-covered spaces in plain JS (~9 kB gzip), same two-form API
WASM: import space, { alloc } from 'color-space/wasm' — same API, 27 spaces: scalar via true multi-value exports, buffers zero-copy via alloc(n)
LUT export: import { cube } from 'color-space/lut' — cube(space.slog3, space.rec709) -> .cube file (3D: Resolve, Premiere, Final Cut, OBS, ffmpeg lut3d; 1D, for transfer-only pairs: Resolve, ffmpeg lut1d; { dims: 3 } forces 3D), header states its own measured deviation, ${LUTOK.size} of ${spaceCount} spaces; { shaper: true } = Resolve-flavor 1D+3D combined cube (shaped 33³ beats plain 65³ for log->display)
ICC export: import { profile } from 'color-space/icc' — profile(space.p3) -> .icc bytes; matrix+TRC display profile for RGB working spaces (colorants pinned to Lindbloom, ColorSync-verified), CLUT (mft2, Lab PCS) colour-space/input profile for everything else incl. munsell/cmyk/kelvin (lcms-verified); profile(space.lab, { xyz: space.xyz }) adds the reverse table where the inverse is continuous
Data: color-space/data.json — the whole registry, language-neutral: per-space metadata + ranges, conversion-graph edges, gamut primaries, whitepoints, CIE 1931 2° CMFs, cited conformance triples the test suite pins to
MCP: npx -y color-space mcp — zero-dep stdio server; tools: convert (batches, per-channel range flags) / gamut (sRGB ⊂ Display P3 ⊂ Rec. 2020 membership) / css (CSS Color 4 strings) / space / spaces (search by name, family, purpose) / cube, so agents call the library instead of guessing color math
Site: https://color-space.io/
Repo: https://github.com/colorjs/color-space

${sections.map(c => `## ${c.name}\n${c.spaces.map(line).join('\n')}`).join('\n\n')}
`
writeFileSync(join(out, 'llms.txt'), llms)

// sitemap + robots — the crawl surface: the app root + every space document, and each under
// every published language, every member of a group listing the whole group (xhtml:link)
const iurl = (loc, date, img, alts = []) => `<url><loc>${loc}</loc><lastmod>${date}</lastmod>${alts.map(([l, u]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${u}"/>`).join('')}${img ? `<image:image><image:loc>${img}</image:loc></image:image>` : ''}</url>`
const langs = [EN, ...(i18n?.langs || []).filter((l) => l.indexed)]
const urls = ['', ...SPACES].flatMap((s) => langs.filter((l) => l.pages.has(s)).map((l) => iurl(pageURL(l.code, s), dateOf(s, l.code), s ? cardOf(s) : `${SITE}/img/og.png`, alternates(i18n, s))))
writeFileSync(join(out, 'sitemap.xml'),
	`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"${langs.length > 1 ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' : ''}>\n` +
	urls.join('\n') + `\n</urlset>\n`)
writeFileSync(join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`)
writeFileSync(join(out, 'CNAME'), SITE.replace(/^https?:\/\//, '') + '\n')   // gh-pages custom domain — must ship in every deploy artifact or the domain detaches

console.log(`site content: prerendered catalog · sitemap + robots + llms · v${version} → ${out}`)
}

// ── per-space documents: the atlas itself, stamped at every /<name> URL ──
// Pages can't rewrite, so each slug gets a byte-copy of index.html with its own
// title/description/canonical; the app's router (BOOT.seg) opens the dossier from
// the path — same document, no redirect, no summary interstitial. Called LAST by
// build-site.js, after the app extraction + preload injection, so the copies are
// the FINAL optimized document, not the intermediate one build() writes.
// …and the whole set again under /<lang>/ for every language the i18n plan stamps: the
// same document with its marked markup translated (scripts/i18n.js apply), <html lang>,
// the catalog baked in that language, asset URLs one level up (the document sits in
// /<lang>/, the assets stay at the root; routes stay relative, so ./oklch stays in the
// language), its own canonical and the hreflang group,
// and its runtime table (i18n/<lang>.json, fresh + valid keys only) preloaded.
const swap = (h, re, repl) => { if (!re.test(h)) throw new Error(`stamp anchor not found: ${re}`); return h.replace(re, typeof repl === 'string' ? () => repl : repl) }
// the language select, in the de-chromed select idiom of the header's view lenses: the
// current language names itself short (EN), the others by their own names
const langSelect = (opts, L) => `<span class="dctl"><select id="lang" aria-label="${esc(t('ui.header.lang', 'Language'))}">${opts.map((l) =>
	`<option value="${l.code}" lang="${l.code}"${l === L ? ' selected' : ''}>${l === L ? l.code.split('-')[0].toUpperCase() : esc(l.name)}</option>`).join('')}</select></span>`
// what every stamped document's head says about its address and its language siblings
const head = (h, L, s, i18n) => {
	const url = pageURL(L.code, s), group = alternates(i18n, s)
	h = swap(h, /<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">` + group.map(([l, u]) => `<link rel="alternate" hreflang="${l}" href="${u}">`).join(''))
	h = swap(h, /<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`)
	// the select lists English and every language that stamps this page – reviewed or not: a reader
	// may choose a current translation; only search waits for the review. Absent while there is nothing to choose
	const opts = [EN, ...(i18n?.langs || []).filter((l) => l.pages.has(s))]
	return opts.length > 1 ? swap(h, /<a class="gh" /, (m) => langSelect(opts, L) + m) : h }
// one space's document from its language's index
const spaceDoc = (html, s) => {
	const desc = t(`space.${s}.desc`, meta[s]?.description || '').replace(/\s+/g, ' ').trim()
	const short = desc.length > 155 ? desc.slice(0, 152).replace(/\s+\S*$/, '') + '…' : desc
	// searchers use the display name ("S-Gamut3.Cine"), not the slug — disp() is the
	// site-wide derivation (description leader + pinned names); LUT-capable spaces
	// name the artifact people actually search for
	const name = disp(s), lut = LUTOK.has(s) && meta[s]?.referred === 'scene'
	let h = html
	// the name view travels LIGHT: the 300kB baked catalog stays on the index — stamped
	// pages ship #cat empty (no data-fp → the page rebuilds it at idle, behind the
	// prerendered dossier bake-dossiers.js injects after this)
	h = swap(h, /<main class="cat" id="cat"[^>]*>[\s\S]*?<\/main>/, '<main class="cat" id="cat"></main>')
	h = swap(h, /<title>[^<]*<\/title>/, `<title>${esc(lut ? t('page.space.title-lut', '{name} color space — channels, ranges, conversion LUT | color-space', { name })
		: t('page.space.title', '{name} color space — channels, ranges, conversion | color-space', { name }))}</title>`)
	h = swap(h, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(short)}">`)
	h = swap(h, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(t('page.space.og-title', '{name} color space — color-space', { name }))}">`)
	h = swap(h, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(short)}">`)
	h = swap(h, /<meta property="og:type" content="[^"]*">/, `<meta property="og:type" content="article">`)
	h = h.replace(/<script type="application\/ld\+json" id="ld-dataset">[^<]*<\/script>/, '')   // a language's index already shed it
	const card = cardOf(s)
	if (card) {
		h = swap(h, /<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${card}">`)
		const alt = esc(t('page.space.og-alt', '{name} color space — its channel gradients, ranges and use', { name }))
		h = h.replace(/<meta (property="og:image:alt"|name="twitter:image:alt") content="[^"]*">/g, (m, a) => `<meta ${a} content="${alt}">`)
	}
	return h }
export function stampPages(out = join(root, '_site'), i18n) {
	const tpl = readFileSync(join(out, 'index.html'), 'utf8')   // the final document, data-i18n marks and all
	for (const L of [EN, ...(i18n?.langs || [])]) {
		use(L.table, L.code)
		const dir = L.code === 'en' ? out : join(out, L.code)
		let html = apply(tpl, L.table)
		if (L.code !== 'en') {
			mkdirSync(dir, { recursive: true }); mkdirSync(join(out, 'i18n'), { recursive: true })
			html = swap(html, /<html lang="en">/, `<html lang="${L.code}"${((l) => l.getTextInfo?.() ?? l.textInfo)(new Intl.Locale(L.code)).direction === 'rtl' ? ' dir="rtl"' : ''}>`)   // Arabic reads right to left
			html = counts(swap(html, /<main class="cat" id="cat"[^>]*>[\s\S]*?<\/main>/, catalog()))
			html = swap(html, /<script type="application\/ld\+json" id="ld-dataset">[^<]*<\/script>/, '')   // the Dataset is the English index's
			html = html.replace(/(\s(?:href|src)=")\.\/([^"#?]+)/g, (m, a, p) => !p.endsWith('.html') && existsSync(join(out, p)) ? `${a}../${p}` : m)
			html = swap(html, /<link rel="preload" href="\.\.\/data\.json" as="fetch" crossorigin>/, (m) => `${m}<link rel="preload" href="../i18n/${L.code}.json" as="fetch" crossorigin>`)
			writeFileSync(join(out, 'i18n', L.code + '.json'), JSON.stringify(L.table))
		}
		writeFileSync(join(dir, 'index.html'), head(html, L, '', i18n))
		let n = 0
		for (const s of SPACES) if (L.pages.has(s)) { writeFileSync(join(dir, s + '.html'), head(spaceDoc(html, s), L, s, i18n)); n++ }
		console.log(L.code === 'en' ? `stamped ${n} per-space atlas documents`
			: `stamped /${L.code}/: index + ${n} space pages${L.reviewed ? '' : ' (unreviewed)'}${L.stale.length + L.missing.length + L.invalid.length ? ` · ${L.stale.length} stale, ${L.missing.length} missing, ${L.invalid.length} invalid keys read English` : ''}`)
	}
	use({})
}
