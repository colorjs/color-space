#!/usr/bin/env node
// Generate the social cards — one Playwright screenshot per self-contained page,
// so cards can never drift from the site they represent.
//
//   web/img/og.png       the 1200×630 site card: the hero's locus beside its title
//                        and line, in the page's own stylesheet and modules –
//                        re-rendered by the build once older than what it shows
//   web/img/og/<s>.jpg   a card per space: display name, its use line, and the
//                        space's own channel-gradient signature — stamped into
//                        each /<name> page's og:image and the image sitemap.
//                        Gitignored build cache: only missing/stale cards render
//                        (staleness = the space source or this generator newer),
//                        so dev rebuilds stay fast and CI renders once per deploy.
//
//   npm run og   (needs the playwright devDependency, same as check-site)
//
import { chromium } from 'playwright'
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { spaceCount, meta, rgbOf, hex } from '../web/js/core.js'
import { SPACES, disp, unit } from '../web/js/render.js'
import { heroLocus } from '../web/js/locus.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// the space cards' chrome — the site's paper, Inter and accent, so every card is family
const INTER = readFileSync(join(root, 'web/fonts/inter-latin.woff2')).toString('base64')
const PAPER = `@font-face{ font-family:Inter; font-weight:400 800; src:url(data:font/woff2;base64,${INTER}) format('woff2') }
*{ margin:0; box-sizing:border-box }
body{ width:1200px; height:630px; padding:56px 60px 48px; display:flex; flex-direction:column;
	font-family:Inter,-apple-system,'Helvetica Neue',Arial,sans-serif; background:oklch(0.978 0.004 245); color:oklch(0.17 0.015 248) }
.dia{ width:22px; height:22px; transform:rotate(45deg); background:oklch(0.69 0.16 42); flex:none }`

// the site card: the hero as the page draws it – its locus (js/locus.js: the horseshoe filled, the Limits named, the
// current color on it), its title and line read from web/index.html (the years from the data, as the landing stamps
// them) – in the page's own stylesheet, at the hero's own sizes: an 800 × 420 page shot at 1.5×. Only the card's
// layout is its own. Served from the repo under a routed origin, so its modules import as the page's do
const ORIGIN = 'http://og.local', K = 1.5
const years = SPACES.map((s) => +meta[s].year).filter(Boolean), Y = { y0: Math.min(...years), y1: Math.max(...years) }
const siteHTML = () => { const index = readFileSync(join(root, 'web/index.html'), 'utf8')
	const hero = (id) => index.match(new RegExp(`id="${id}"[^>]*>([\\s\\S]*?)</(h1|p)>`))[1].replace(/(<span id="(y0|y1)">)[^<]*/g, (m, a, k) => a + Y[k])
	return `<!doctype html><html lang="en"><meta charset="utf-8"><link href="./tokens.css" rel="stylesheet"><style>${index.match(/<style>([\s\S]*?)<\/style>/)[1]}</style><style>
body{ display:grid; place-items:center; height:100vh; overflow:hidden }
.og{ display:flex; gap:var(--s12) }   /* the locus and the words beside it, as tall as it, the pair centred */
.hlocus{ position:relative; display:block; flex:none; height:17.5rem; aspect-ratio:290/318; --tkc:var(--c) }
.hlocus .lims{ opacity:1 }   /* the Limits named, as at the page's first paint */
.ow{ display:flex; flex-direction:column; justify-content:space-between }
.ow .hh{ font-size:var(--t6) }
.ow .hsub{ margin-bottom:0; contain:inline-size }   /* the line wraps to the title's measure, never sets it */
.ow .ft{ display:flex; gap:var(--s4); font-size:var(--t2); color:var(--soft) } .ow .ft b{ color:var(--ink) }
</style><body style="--cur:var(--c)"><div class="mtop"></div>
<div class="og">${heroLocus('', 'Surface', 'Light').replace('class="hlocus"', 'class="hlocus lit"')}
<div class="ow"><div><h1 class="hh">${hero('hero-t')}</h1><p class="hsub">${hero('hsub')}</p></div><div class="ft"><b>color-space.io</b>${spaceCount} color spaces</div></div></div>
<script type="module">
import { locusFill, limPath, GXY } from './js/locus.js'
import { space, xyOf } from './js/core.js'
// as the page mounts its hero's locus: the fill over the plate, the Limit (sRGB) clipped in full, the checker at 12 px,
// the current color – the site's accent – at its chromaticity
const box = document.querySelector('.hlocus'), svg = box.firstElementChild, mk = box.querySelector('.cx')
const im = [...svg.querySelectorAll('image')], u = locusFill(([a, b]) => [a * .857 - .107, (1 - b) * .955 - .055], 320, 352)
await Promise.all(im.map(i => new Promise(ok => { i.onload = ok; i.setAttribute('href', u) })))
svg.querySelector('#hl-lim path').setAttribute('d', limPath('srgb', GXY))
svg.querySelector('#hl-chk').setAttribute('patternTransform', 'scale(' + (1 / svg.getScreenCTM().a).toFixed(4) + ')')
const [L, C, h] = getComputedStyle(box).getPropertyValue('--tkc').match(/[\\d.]+/g).map(Number), [x, y] = GXY(xyOf(...space.oklch.xyz(L, C, h)))
mk.style.left = ((x - 36) / 290 * 100).toFixed(2) + '%'; mk.style.top = ((y - 18) / 318 * 100).toFixed(2) + '%'
await document.fonts.ready; document.documentElement.dataset.ready = 1
</script>` }

// the site card, shot when missing or older than what it shows – the page (its words, its stylesheet), the tokens, the
// locus, the data (the count, the years), this generator: the page's files served from the repo, the card at its own
// path beside them. Committed, so a re-render that changes no pixel changes nothing in git
export async function siteCard({ force = false } = {}) {
	const f = join(root, 'web/img/og.png'), src = ['web/index.html', 'web/tokens.css', 'web/js/locus.js', 'data.json', 'scripts/generate-og.js']
	if (!force && existsSync(f) && src.every(s => statSync(join(root, s)).mtimeMs <= statSync(f).mtimeMs)) return 0
	const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined })
	const page = await browser.newPage({ viewport: { width: 1200 / K, height: 630 / K }, deviceScaleFactor: K, reducedMotion: 'reduce' })
	const html = siteHTML()
	await page.route(`${ORIGIN}/**`, (r) => { const p = new URL(r.request().url()).pathname
		return p === '/web/og.html' ? r.fulfill({ contentType: 'text/html', body: html }) : r.fulfill({ path: join(root, p) }) })
	const broke = new Promise((ok, no) => page.on('pageerror', no))   // a module that fails to load fails the card, not a timeout
	await page.goto(`${ORIGIN}/web/og.html`)
	await Promise.race([page.waitForFunction(() => document.documentElement.dataset.ready), broke])
	const png = await page.screenshot({ type: 'png' })
	await browser.close()
	writeFileSync(f, png)
	console.log(`web/img/og.png written — 1200×630, ${(png.length / 1024).toFixed(0)} kB`)
	return 1
}

// the space's signature: each channel swept across its range, the others held at
// mid — the same fingerprint the catalog sliders draw. Non-finite corners keep
// the last finite stop instead of baking a hole into the ramp.
const gradient = (s, i) => {
	const ch = meta[s].channels
	const base = ch.map(c => (c.min + c.max) / 2)
	const stops = []
	let last = 'oklch(0.9 0 0)'
	for (let k = 0; k <= 24; k++) {
		const t = k / 24, v = base.slice()
		v[i] = ch[i].min + t * (ch[i].max - ch[i].min)
		try { const rgb = rgbOf(s, v); if (rgb && rgb.every(isFinite)) last = hex(rgb) } catch {}
		stops.push(`${last} ${(t * 100).toFixed(1)}%`)
	}
	return `linear-gradient(90deg,${stops.join(',')})`
}

const fmtRange = (c) => c.min === -c.max ? `${c.symbol} ±${c.max}` : `${c.symbol} ${c.min}–${c.max}${unit(c)}`

export const cardHTML = (s) => {
	const name = disp(s), ch = meta[s].channels || []
	const use = (meta[s].use || '').replace(/\s+/g, ' ').trim()
	const sub = use.length > 105 ? use.slice(0, 102).replace(/\s+\S*$/, '') + '…' : use
	const h1px = name.length > 24 ? 44 : name.length > 15 ? 56 : 66
	const bars = ch.map((c, i) => `<div class="bar"><span title="${esc(c.name)}">${esc(c.symbol)}</span><i style="background:${gradient(s, i)}"></i></div>`).join('')
	return `<!doctype html><meta charset="utf-8"><style>${PAPER}
h1{ font-weight:800; letter-spacing:-.02em }
.sub{ display:flex; align-items:flex-start; gap:16px; margin-top:22px; font-size:28px; line-height:1.35; color:oklch(0.34 0.014 246); max-width:1000px } .sub .dia{ margin-top:8px }
.bars{ flex:1; min-height:0; margin:44px 0 28px; display:flex; flex-direction:column; gap:14px }
.bar{ flex:1; display:flex; align-items:stretch; gap:18px; min-height:0 }
.bar span{ flex:none; width:44px; align-self:center; font-size:26px; font-weight:700; color:oklch(0.52 0.012 246); text-align:right }
.bar i{ flex:1 }
.foot{ margin-top:auto; display:flex; justify-content:space-between; align-items:baseline; font-size:24px; color:oklch(0.52 0.012 246) }
.foot .rng{ font-weight:400 } .foot .url{ font-weight:700 }
</style><body>
<h1 style="font-size:${h1px}px">${esc(name)}</h1>
<div class="sub"><span class="dia"></span>${esc(sub) || `${ch.length}-channel color space`}</div>
<div class="bars">${bars}</div>
<div class="foot"><span class="rng">${esc(ch.map(fmtRange).join(' · '))}</span><span class="url">color-space.io/${s}</span></div>
</body>`
}

// render every missing/stale card into web/img/og/ (the gitignored cache)
export async function spaceCards({ force = false } = {}) {
	const dir = join(root, 'web/img/og')
	mkdirSync(dir, { recursive: true })
	const genM = Math.max(statSync(fileURLToPath(import.meta.url)).mtimeMs, statSync(join(root, 'data.json')).mtimeMs)
	const stale = SPACES.filter(s => {
		if (force) return true
		const f = join(dir, s + '.jpg')
		if (!existsSync(f)) return true
		const m = statSync(f).mtimeMs
		const src = join(root, 'spaces', s + '.js')
		return m < genM || (existsSync(src) && m < statSync(src).mtimeMs)
	})
	if (!stale.length) return 0
	const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined })
	const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
	for (const s of stale) {
		await page.setContent(cardHTML(s))
		await page.evaluate(() => document.fonts.ready)
		writeFileSync(join(dir, s + '.jpg'), await page.screenshot({ type: 'jpeg', quality: 88 }))
	}
	await browser.close()
	console.log(`og cards: ${stale.length} rendered → web/img/og`)
	return stale.length
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
	await siteCard({ force: true })
	await spaceCards({ force: process.argv.includes('--force') })
}
