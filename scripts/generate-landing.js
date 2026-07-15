// Generate the site CONTENT into an output dir (default _site — see build-site.js,
// which stages sources + runtime modules around it): the prerendered landing
// (crawlable static markup — the page re-renders the identical template on load),
// one static reference page per space (<name>.html — the 200-status document
// /<name> deep links and search engines land on; 404.html only catches unknown
// slugs), sitemap.xml + robots.txt, and llms.txt. web/ holds the source; docs/ is markdowns.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { catHTML, sections, SPACES } from '../web/js/render.js'
import { space, meta, spaceCount, LUTOK } from '../web/js/core.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

export function build(out = join(root, '_site')) {
// ── index.html: static catalog + live counts + version (from the web/ source) ──
let html = readFileSync(join(root, 'web/index.html'), 'utf8')
const inject = (re, repl) => { if (!re.test(html)) throw new Error(`anchor not found: ${re}`); html = html.replace(re, repl) }
inject(/<main class="cat" id="cat">[\s\S]*?<\/main>/, `<main class="cat" id="cat">${catHTML()}</main>`)
inject(/(<a class="ver tnum" id="ver"[^>]*>)[^<]*(<\/a>)/, `$1v${version}$2`)
inject(/(<span id="n">)[^<]*(<\/span>)/, `$1${spaceCount}$2`)
inject(/(<span id="n2">)[^<]*(<\/span>)/, `$1${spaceCount}$2`)
inject(/(<meta name="description" content=")\d+( color coordinate systems)/, `$1${spaceCount}$2`)
inject(/(<meta property="og:description" content=")\d+( color coordinate systems)/, `$1${spaceCount}$2`)
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
const llms = `# color-space — ${spaceCount} color spaces, one tiny JS API

> Converts colors between ${spaceCount} spaces using each space's conventional ranges
> (what CSS and the defining papers use). Every conversion verified against
> colorjs.io and its source paper. Zero dependencies, public domain (CC0).

Install: npm i color-space
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
MCP: npx color-space-mcp — zero-dep stdio server; tools: convert / space / spaces / cube, so agents call verified conversions instead of guessing color math
Site: https://colorjs.github.io/color-space/
Repo: https://github.com/colorjs/color-space

${sections.map(c => `## ${c.name}\n${c.spaces.map(line).join('\n')}`).join('\n\n')}
`
writeFileSync(join(out, 'llms.txt'), llms)

// ── per-space reference pages: the canonical 200-status document behind /<name> ──
// Content mirrors the dossier from the same metadata; humans get one CTA into the
// live app. A #hash on arrival is live app state (a refreshed or shared color) —
// those visitors bounce straight back into the app; crawlers never carry a hash.
// the one deployment-coupled constant: canonical/sitemap URLs must be absolute.
// If v3 publishes under a different base (e.g. …/color-space/docs), change it here.
const SITE = 'https://colorjs.github.io/color-space'
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const catOf = Object.fromEntries(sections.flatMap((c) => c.spaces.map((s) => [s, c.name])))
const linked = (t) => esc(t).replace(/(https?:\/\/[^\s)]+)/g, '<a href="$1">$1</a>')
const fmtn = (x) => String(+(+x).toPrecision(6))

const pageOf = (s) => {
	const m = meta[s] || {}
	const desc = (m.description || '').replace(/\s+/g, ' ').trim()
	const short = desc.length > 155 ? desc.slice(0, 152).replace(/\s+\S*$/, '') + '…' : desc
	const neighbors = Object.keys(space).filter((to) => { const f = space[s][to]
		return to !== s && typeof f === 'function' && !((f.scalar || f).chained) })
	const refs = [...new Set([...(m.refs || []), ...(m.wiki ? [m.wiki] : [])])]
	const rows = (m.channels || []).map((c) => `<tr><td>${esc(c.name)}</td><td>${esc(c.symbol)}</td><td class="tnum">${fmtn(c.min)} … ${fmtn(c.max)}${c.max === 360 ? '°' : ''}</td></tr>`).join('')
	const facts = [
		m.year || m.by ? ['origin', [m.year, m.by].filter(Boolean).join(' · ')] : null,
		m.illuminant ? ['white point', m.illuminant + (m.observer ? ` · ${m.observer}° observer` : '')] : null,
		[m.method, m.encoding].filter(Boolean).length ? ['model', [m.method, m.encoding].filter(Boolean).join(' · ')] : null,
		m.referred || m.dynamic ? ['signal', [m.referred && m.referred + '-referred', m.dynamic && m.dynamic.toUpperCase()].filter(Boolean).join(' · ')] : null,
		m.loss ? ['loss', m.loss + (m.lossNote ? ' — ' + m.lossNote : '')] : null,
		m.gamut ? ['gamut', m.gamut] : null,
	].filter(Boolean)
	return `<!doctype html>
<html lang="en">
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(s)} color space — channels, ranges, conversion | color-space</title>
<meta name="description" content="${esc(short)}">
<link rel="canonical" href="${SITE}/${s}">
<meta property="og:title" content="${esc(s)} color space — color-space">
<meta property="og:description" content="${esc(short)}">
<meta property="og:type" content="article">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><circle cx='8' cy='8' r='7' fill='%23ef7a4a'/></svg>">
<link href="./tokens.css" rel="stylesheet">
<script>if(location.hash)location.replace('./?s=${s}'+location.hash)</script>
<style>
body{font-family:var(--f,system-ui);background:var(--paper,#fff);color:var(--ink,#1b1408);max-width:44rem;margin:0 auto;padding:2rem 1rem 4rem;line-height:1.55}
h1{font-size:2.2rem;letter-spacing:-.02em;margin:.2rem 0}
.k{font-size:.72rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--soft,#8a8175)}
.cta{display:inline-block;font-weight:800;background:var(--ink,#1b1408);color:var(--paper,#fff);padding:.5rem .9rem;text-decoration:none;margin:.8rem 0 1.4rem}
table{border-collapse:collapse;margin:.4rem 0 1.2rem}td,th{text-align:left;padding:.25rem 1.2rem .25rem 0;border-bottom:1px solid var(--hair,#e5e0d8)}
.tnum{font-variant-numeric:tabular-nums}
dl{display:grid;grid-template-columns:max-content 1fr;gap:.3rem 1.2rem;margin:0 0 1.2rem}dt{font-weight:700}dd{margin:0}
pre{background:var(--panel,#f4f1ec);padding:.8rem 1rem;overflow-x:auto}
nav.crumb{font-size:.85rem;margin-bottom:1.2rem}a{color:inherit}
.nb a{margin-right:.6em;white-space:nowrap}
footer{margin-top:2.4rem;font-size:.85rem;color:var(--soft,#8a8175)}
</style>
<body>
<nav class="crumb"><a href="./">color-space</a> · ${esc(catOf[s] || 'catalog')}</nav>
<p class="k">color space</p>
<h1>${esc(s)}</h1>
<a class="cta" href="./?s=${s}">Open the live dossier — convert, plot, export →</a>
<p>${linked(desc)}</p>
${m.use ? `<p><span class="k">used for</span><br>${esc(m.use)}</p>` : ''}
<h2>Channels</h2>
<table><tr><th>channel</th><th>symbol</th><th>conventional range</th></tr>${rows}</table>
${facts.length ? `<dl>${facts.map(([k, v]) => `<dt class="k">${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : ''}
<h2>Convert</h2>
<pre>import space from 'color-space'

space.${s.includes('-') ? `['${s}']` : s}.rgb(…)   // ${esc(s)} → sRGB
space.rgb${s.includes('-') ? `['${s}']` : '.' + s}(…)   // sRGB → ${esc(s)}, any of ${spaceCount} × ${spaceCount - 1} pairs</pre>
${LUTOK.has(s) ? `<p>Also exports as a verified <a href="./?s=${s}">.cube LUT</a> — Resolve, Premiere, Final Cut, OBS, ffmpeg.</p>` : ''}
<h2>Converts directly to</h2>
<p class="nb">${neighbors.map((n) => `<a href="./${n}">${n}</a>`).join(' ')}</p>
${refs.length ? `<h2>References</h2><ul>${refs.map((u) => `<li><a href="${esc(u)}" rel="noopener">${esc(u)}</a></li>`).join('')}</ul>` : ''}
<footer>Formulas differentially verified — see <a href="https://github.com/colorjs/color-space">colorjs/color-space</a> (<a href="https://github.com/colorjs/color-space/blob/master/spaces/${s}.js">${s}.js</a>) · v${version} · Public domain (CC0)</footer>
</body>
</html>
`
}

for (const s of SPACES) writeFileSync(join(out, s + '.html'), pageOf(s))

// sitemap + robots — the crawl surface: the app root + every space document
writeFileSync(join(out, 'sitemap.xml'),
	`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
	[`${SITE}/`, ...SPACES.map((s) => `${SITE}/${s}`)].map((u) => `<url><loc>${u}</loc></url>`).join('\n') +
	`\n</urlset>\n`)
writeFileSync(join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`)

console.log(`site content: prerendered catalog · ${SPACES.length} reference pages · sitemap + robots + llms · v${version} → ${out}`)
}
