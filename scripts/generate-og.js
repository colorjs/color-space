#!/usr/bin/env node
// Generate the social cards — one Playwright screenshot per self-contained page,
// so cards can never drift from the site they represent.
//
//   web/img/og.png       the 1200×630 site card: the hero's title and line, flush
//                        left, over the hero's cloud of hues
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
import { BLOBS, tints } from '../web/js/cloud.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// shared card chrome — the site's paper, Inter and accent, so every card is family
const INTER = readFileSync(join(root, 'web/fonts/inter-latin.woff2')).toString('base64')
const PAPER = `@font-face{ font-family:Inter; font-weight:400 800; src:url(data:font/woff2;base64,${INTER}) format('woff2') }
*{ margin:0; box-sizing:border-box }
body{ width:1200px; height:630px; padding:56px 60px 48px; display:flex; flex-direction:column;
	font-family:Inter,-apple-system,'Helvetica Neue',Arial,sans-serif; background:oklch(0.978 0.004 245); color:oklch(0.17 0.015 248) }
.dia{ width:22px; height:22px; transform:rotate(45deg); background:oklch(0.69 0.16 42); flex:none }`

// the site card: the hero's own title and line, read from web/index.html (the years from the
// data, as the landing stamps them), flush left as on the page
const years = SPACES.map((s) => +meta[s].year).filter(Boolean), Y = { y0: Math.min(...years), y1: Math.max(...years) }
const hero = (id) => readFileSync(join(root, 'web/index.html'), 'utf8').match(new RegExp(`id="${id}"[^>]*>([\\s\\S]*?)</(h1|p)>`))[1]
	.replace(/(<span id="(y0|y1)">)[^<]*/g, (m, a, k) => a + Y[k]).replace(/<br>/g, '\n').replace(/<[^>]+>/g, '').replace(/\n/g, '<br>')
// the hero's own cloud (web/js/cloud.js) at rest with none picked – the wheel as laid out, the band's light, soft end –
// drawn as blurred CSS blobs on the card
const W = 1200, H = 630, blob = ([x, y, r], [L, C, h]) => `radial-gradient(circle ${r * W}px at ${x * W + 120}px ${y * H + 120}px, oklch(${L} ${C} ${h}), oklch(${L} ${C} ${h} / 0))`
const CLOUD = tints({ hue: 10, L: .84, C: .13, spread: 1 }).map((t, i) => blob(BLOBS[i], t)).join(',')
const siteHTML = `<!doctype html><meta charset="utf-8"><style>${PAPER}
body{ position:relative; overflow:hidden; padding:0 80px; justify-content:center }
.cloud{ position:absolute; inset:-120px; background:${CLOUD}; filter:blur(40px) }
.n,h1,.sub{ position:relative }
.n{ margin-bottom:26px; font-size:24px; font-weight:600; color:oklch(0.34 0.014 246) }
h1{ max-width:760px; font-size:88px; font-weight:800; line-height:1; letter-spacing:-.04em; text-wrap:balance }
.sub{ margin-top:30px; font-size:28px; line-height:1.42; color:oklch(0.34 0.014 246) }
.url{ position:absolute; left:80px; bottom:44px; display:flex; align-items:center; gap:12px; font-size:24px; font-weight:700 } .url .dia{ width:14px; height:14px }
</style><body><div class="cloud"></div>
<div class="n">${spaceCount} color spaces</div>
<h1>${hero('hero-t')}</h1>
<div class="sub">${hero('hsub')}</div>
<div class="url"><span class="dia"></span>color-space.io</div>
</body>`

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
	const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined })
	const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
	await page.setContent(siteHTML)
	await page.evaluate(() => document.fonts.ready)
	const png = await page.screenshot({ type: 'png' })
	await browser.close()
	writeFileSync(join(root, 'web/img/og.png'), png)
	console.log(`web/img/og.png written — 1200×630, ${(png.length / 1024).toFixed(0)} kB`)
	await spaceCards({ force: process.argv.includes('--force') })
}
