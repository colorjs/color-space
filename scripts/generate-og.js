#!/usr/bin/env node
// Generate the social cards — one Playwright screenshot per self-contained page,
// so cards can never drift from the site they represent.
//
//   web/img/og.png       the 1200×630 site card: masthead type + the banner's
//                        Ostwald ribbon (continuous over 24 stepped hues)
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
import { writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { bannerSVG } from './generate-banner.js'
import { spaceCount, meta, rgbOf, hex } from '../web/js/core.js'
import { SPACES, disp, unit } from '../web/js/render.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// shared card chrome — the og.png paper, type and accent, so every card is family
const PAPER = `*{ margin:0; box-sizing:border-box }
body{ width:1200px; height:630px; padding:56px 60px 48px; display:flex; flex-direction:column;
	font-family:-apple-system,'Helvetica Neue',Arial,sans-serif; background:oklch(0.978 0.004 245); color:oklch(0.17 0.015 248) }
.dia{ width:22px; height:22px; transform:rotate(45deg); background:oklch(0.69 0.16 42); flex:none }`

const siteHTML = `<!doctype html><meta charset="utf-8"><style>${PAPER}
h1{ font-size:72px; font-weight:800; letter-spacing:-.02em }
.sub{ display:flex; align-items:center; gap:16px; margin-top:26px; font-size:31px; color:oklch(0.34 0.014 246) }
.band{ margin-top:52px; height:110px } .band svg{ width:100%; height:100%; display:block }
hr{ border:0; border-top:1px solid oklch(0.17 0.015 248/.12); margin:52px 0 0 }
.claim{ margin-top:40px; font-size:30px; font-weight:700 }
.how{ margin-top:16px; font-size:26px; color:oklch(0.52 0.012 246) }
.url{ margin-top:auto; align-self:flex-end; font-size:24px; font-weight:700; color:oklch(0.52 0.012 246) }
</style><body>
<h1>color-space</h1>
<div class="sub"><span class="dia"></span>${spaceCount} color spaces · one open collection</div>
<div class="band">${bannerSVG()}</div>
<hr>
<div class="claim">Any space → any other</div>
<div class="how">conventional ranges · cited formulas · JS / WASM / GPU / LUT / ICC</div>
<div class="url">color-space.io</div>
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
.bars{ margin-top:44px; height:300px; display:flex; flex-direction:column; gap:14px }
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
	const browser = await chromium.launch()
	const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
	for (const s of stale) {
		await page.setContent(cardHTML(s))
		writeFileSync(join(dir, s + '.jpg'), await page.screenshot({ type: 'jpeg', quality: 88 }))
	}
	await browser.close()
	console.log(`og cards: ${stale.length} rendered → web/img/og`)
	return stale.length
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
	const browser = await chromium.launch()
	const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
	await page.setContent(siteHTML)
	await page.waitForTimeout(120)
	const png = await page.screenshot({ type: 'png' })
	await browser.close()
	writeFileSync(join(root, 'web/img/og.png'), png)
	console.log(`web/img/og.png written — 1200×630, ${(png.length / 1024).toFixed(0)} kB`)
	await spaceCards({ force: process.argv.includes('--force') })
}
