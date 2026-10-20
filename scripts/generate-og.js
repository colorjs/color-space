#!/usr/bin/env node
// Generate the social cards — one Playwright screenshot per self-contained page,
// so cards can never drift from the site they represent.
//
//   web/img/og.png       the 1200×630 site card: the hero's locus beside the name,
//                        the atlas in two lines and its facts, in the page's own stylesheet and modules –
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

// the space cards' chrome — the site's paper, Inter and mark, so every card is family
const INTER = readFileSync(join(root, 'web/fonts/inter-latin.woff2')).toString('base64')
const PAPER = `@font-face{ font-family:Inter; font-weight:400 800; src:url(data:font/woff2;base64,${INTER}) format('woff2') }
*{ margin:0; box-sizing:border-box }
body{ width:1200px; height:630px; padding:56px 60px 48px; display:flex; flex-direction:column;
	font-family:Inter,-apple-system,'Helvetica Neue',Arial,sans-serif; background:oklch(0.978 0.004 245); color:oklch(0.17 0.015 248) }`
const MARK = `data:image/png;base64,${readFileSync(join(root, 'web/img/locus-192.png')).toString('base64')}`   // the site's mark, the favicon

// the site card: the film's opening frame – the hero's locus at rest (js/locus.js: the horseshoe filled, the current
// color on it) beside the name, the atlas in two lines and its three facts – in the page's own stylesheet and
// tokens: a 600 × 315 page shot at 2×. The count and the years from the data, as the landing stamps them. Served from the
// repo under a routed origin, so its modules import as the page's do
const ORIGIN = 'http://og.local', K = 2
const years = SPACES.map((s) => +meta[s].year).filter(Boolean), Y = { y0: Math.min(...years), y1: Math.max(...years) }
const HUES = 'linear-gradient(to right in oklch longer hue, oklch(0.75 0.125 30), oklch(0.75 0.125 30))'   // the top line: the hue wheel whole, at one lightness and chroma – the most chroma sRGB holds at every hue at L 0.75
const siteHTML = () => { const index = readFileSync(join(root, 'web/index.html'), 'utf8')
	const shield = index.match(/<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 13c0 5[\s\S]*?<\/svg>/)?.[0]
	if (!shield) throw new Error('generate-og: the intro\'s shield mark (Reference-tested) is gone from web/index.html')   // the intro's own marks: Reference-tested's shield, Public domain's turned ©
	return `<!doctype html><html lang="en"><meta charset="utf-8"><link href="./tokens.css" rel="stylesheet"><style>${index.match(/<style>([\s\S]*?)<\/style>/)[1]}</style><style>
body{ overflow:hidden }
.hero{ display:grid; place-items:center; width:auto; height:100vh; margin:0; padding:0 }   /* the page's hero – the top line's glow under it – the card its frame */
.og{ display:grid; grid-template-columns:auto auto; column-gap:var(--s8) }   /* the locus as tall as the words beside it, the pair centred */
.hlocus{ position:relative; display:block; align-self:center; height:80%; aspect-ratio:290/318; --tkc:var(--c) }   /* at rest – the colors, no outlines – a little under the words' height */
.ow .kick{ margin:0 0 var(--s1); font-size:var(--t3); color:var(--soft) }
.ow .hh{ font-size:var(--t6) }
.ow .sl{ margin:var(--s3) 0 0; font-size:var(--t3); line-height:1.4; color:var(--body) } .ow .sl span{ display:block; white-space:nowrap }
.ow .facts{ display:flex; gap:var(--s5); margin:var(--s5) 0 0; padding:0; list-style:none; font-size:var(--t2); font-weight:650; color:var(--ink) }
.ow .facts li{ display:flex; align-items:center; gap:var(--s2) } .ow .facts .ic{ --ic:1.1em; width:var(--ic); height:var(--ic) }
.ow .facts .pdm{ width:1.1em; text-align:center; rotate:180deg; font-weight:500 }
</style><body><div class="mtop" style="--cur:${HUES}"></div>
<section class="hero" style="--cur:${HUES}"><div class="og">${heroLocus('', 'Surface', 'Light').replace('class="hlocus"', 'class="hlocus lit"')}
<div class="ow"><p class="kick">A reference guide</p><h1 class="hh">color-space.io</h1>
<p class="sl"><span>Open atlas of color spaces: from web to print,</span><span>pickers to research, ${Y.y0} to ${Y.y1}.</span></p>
<ul class="facts"><li>${spaceCount} spaces</li><li>${shield}verified</li><li><span class="pdm" aria-hidden="true">©</span>public domain</li></ul></div></div></section>
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
.sub{ margin-top:22px; font-size:28px; line-height:1.35; color:oklch(0.34 0.014 246); max-width:1000px }
.bars{ flex:1; min-height:0; margin:44px 0 28px; display:flex; flex-direction:column; gap:14px }
.bar{ flex:1; display:flex; align-items:stretch; gap:18px; min-height:0 }
.bar span{ flex:none; width:44px; align-self:center; font-size:26px; font-weight:700; color:oklch(0.52 0.012 246); text-align:right }
.bar i{ flex:1 }
.foot{ margin-top:auto; display:flex; justify-content:space-between; align-items:center; font-size:24px; color:oklch(0.52 0.012 246) }
.foot .rng{ display:flex; gap:36px } .foot .url{ display:flex; align-items:center; gap:12px; font-weight:700 } .foot .url img{ width:34px; height:34px }
</style><body>
<h1 style="font-size:${h1px}px">${esc(name)}</h1>
<div class="sub">${esc(sub) || `${ch.length}-channel color space`}</div>
<div class="bars">${bars}</div>
<div class="foot"><span class="rng">${ch.map(c => `<span>${esc(fmtRange(c))}</span>`).join('')}</span><span class="url"><img src="${MARK}" alt="">color-space.io/${s}</span></div>
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
