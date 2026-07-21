// Generate the site CONTENT into an output dir (default _site — see build-site.js,
// which stages sources + runtime modules around it): the prerendered landing
// (crawlable static markup — the page re-renders the identical template on load),
// sitemap.xml + robots.txt, and llms.txt. stampSpacePages() then writes <name>.html
// for every space — the 200-status document /<name> deep links and search engines
// land on is the atlas itself (the app's router opens the dossier from the path;
// 404.html only catches unknown slugs). web/ holds the source; docs/ is markdowns.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { catHTML, sections, SPACES, DEFAULT, fpOf } from '../web/js/render.js'
import { meta, spaceCount, LUTOK, rgbOf, hex } from '../web/js/core.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
// the one deployment-coupled constant: canonical/sitemap URLs must be absolute.
// If v3 publishes under a different base (e.g. …/color-space/docs), change it here.
const SITE = 'https://color-space.io'
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function build(out = join(root, '_site')) {
// ── index.html: static catalog + live counts + version (from the web/ source) ──
let html = readFileSync(join(root, 'web/index.html'), 'utf8')
const inject = (re, repl) => { if (!re.test(html)) throw new Error(`anchor not found: ${re}`); html = html.replace(re, repl) }
// the catalog ships COMPLETE: default-color values, slider gradients and tick markers
// baked in (catHTML(DEFAULT)); data-fp fingerprints the bare template so the page
// hydrates the existing DOM instead of rebuilding it, replacing only on drift.
// Hydration contract: the baked variant may differ from the bare template ONLY in
// attributes — an element added or dropped under `vals` would hand the page a DOM
// its wiring doesn't expect, and the fingerprint (bare vs bare) can't see it
const bare = catHTML(), baked = catHTML(DEFAULT)
const shape = (h) => h.replace(/<([a-z0-9]+)(\s[^>]*)?>/gi, '<$1>')
if (shape(bare) !== shape(baked)) throw new Error('generate-landing: catHTML(DEFAULT) changes element structure, not just attributes — hydration would desync')
inject(/<main class="cat" id="cat"[^>]*>[\s\S]*?<\/main>/, `<main class="cat" id="cat" data-fp="${fpOf(bare)}">${baked}</main>`)
inject(/(<a class="ver tnum" id="ver"[^>]*>)[^<]*(<\/a>)/, `$1v${version}$2`)
inject(/(<span id="n">)[^<]*(<\/span>)/, `$1${spaceCount}$2`)
inject(/(<span id="n2">)[^<]*(<\/span>)/, `$1${spaceCount}$2`)
// the current-color rhombus + value carry the DEFAULT color from the first frame —
// an unvalued <input type=color> paints BLACK until the module lands
const dhx = hex(rgbOf(DEFAULT.s, DEFAULT.vals))
inject(/(<input type="color" class="cd" id="cd")/, `$1 value="${dhx.toLowerCase()}"`)
inject(/(<input id="cval")/, `$1 value="${dhx}"`)
// the meta descriptions carry no live count by design — the counts live in #n/#n2 and the per-space stamps
html = html.replace(/any of \d+ × \d+ pairs/g, `any of ${spaceCount} × ${spaceCount - 1} pairs`)
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
> (what CSS and the defining papers use). All ${spaceCount} spaces carry an independent cited
> conformance anchor; 29 are differential-tested against colorjs.io in both directions. Zero dependencies, public domain (CC0).

Install: npm i ${installName}
API: space[from][to](...values) -> number[]     e.g. space.rgb.oklch(255, 128, 0)
Batch: space[from][to](pixels) -> Float64Array  interleaved array-like, stride = channel count; a batch of one = the v2 array call
Per space: space[name].range (channel ranges), space[name].name
Metadata: color-space/data.json — spaces (channels, refs, illuminant, referred, dynamic, year, by, use, neighbors) + gamuts, whitepoints, CMFs, conformance
Tree-shaken: import oklch from 'color-space/oklch.js' (~2 kB per space; scalar form — batch is wired by the hubs)
Compact hub: import space from 'color-space/lite' — the 27 wasm-covered spaces in plain JS (~9 kB gzip), same two-form API
WASM: import space, { alloc } from 'color-space/wasm' — same API, 27 spaces: scalar via true multi-value exports, buffers zero-copy via alloc(n)
LUT export: import { cube } from 'color-space/lut' — cube(space.slog3, space.rec709) -> .cube file (Resolve, Premiere, Final Cut, OBS, ffmpeg), header states its own measured deviation, ${LUTOK.size} of ${spaceCount} spaces; { shaper: true } = Resolve-flavor 1D+3D combined cube (shaped 33³ beats plain 65³ for log->display)
ICC export: import { profile } from 'color-space/icc' — profile(space.p3) -> .icc bytes; matrix+TRC display profile for RGB working spaces (colorants pinned to Lindbloom, ColorSync-verified), CLUT (mft2, Lab PCS) colour-space/input profile for everything else incl. munsell/cmyk/kelvin (lcms-verified); profile(space.lab, { xyz: space.xyz }) adds the reverse table where the inverse is continuous
Data: color-space/data.json — the whole registry, language-neutral: per-space metadata + ranges, conversion-graph edges, gamut primaries, whitepoints, CIE 1931 2° CMFs, cited conformance triples the test suite pins to
MCP: npx --yes --package color-space color-space-mcp — zero-dep stdio server; tools: convert / space / spaces / cube, so agents call the library instead of guessing color math
Site: https://color-space.io/
Repo: https://github.com/colorjs/color-space

${sections.map(c => `## ${c.name}\n${c.spaces.map(line).join('\n')}`).join('\n\n')}
`
writeFileSync(join(out, 'llms.txt'), llms)

// sitemap + robots — the crawl surface: the app root + every space document
writeFileSync(join(out, 'sitemap.xml'),
	`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
	[`${SITE}/`, ...SPACES.map((s) => `${SITE}/${s}`)].map((u) => `<url><loc>${u}</loc></url>`).join('\n') +
	`\n</urlset>\n`)
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
export function stampSpacePages(out = join(root, '_site')) {
	const html = readFileSync(join(out, 'index.html'), 'utf8')
	const swap = (h, re, repl) => { if (!re.test(h)) throw new Error(`stamp anchor not found: ${re}`); return h.replace(re, repl) }
	for (const s of SPACES) {
		const desc = (meta[s]?.description || '').replace(/\s+/g, ' ').trim()
		const short = desc.length > 155 ? desc.slice(0, 152).replace(/\s+\S*$/, '') + '…' : desc
		let h = html
		h = swap(h, /<title>[^<]*<\/title>/, `<title>${esc(s)} color space — channels, ranges, conversion | color-space</title>`)
		h = swap(h, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(short)}">`)
		h = swap(h, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(s)} color space — color-space">`)
		h = swap(h, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(short)}">`)
		h = swap(h, /<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${SITE}/${s}">`)
		h = swap(h, /<meta property="og:type" content="[^"]*">/, `<meta property="og:type" content="article">`)
		h = swap(h, /<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${SITE}/${s}">`)
		writeFileSync(join(out, s + '.html'), h)
	}
	console.log(`stamped ${SPACES.length} per-space atlas documents`)
}
