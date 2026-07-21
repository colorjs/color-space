#!/usr/bin/env node
// Generate web/img/og.png — the 1200×630 social card. Same paper, type and claim as
// the atlas masthead, with the banner's Ostwald ribbon (continuous over 24 stepped
// hues) as the centerpiece — one Playwright screenshot of a self-contained page,
// so the card can never drift from the banner it embeds.
//
//   npm run og   (needs the playwright devDependency, same as check-site)
//
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { bannerSVG } from './generate-banner.js'
import { spaceCount } from '../web/js/core.js'

const html = `<!doctype html><meta charset="utf-8"><style>
*{ margin:0; box-sizing:border-box }
body{ width:1200px; height:630px; padding:56px 60px 48px; display:flex; flex-direction:column;
	font-family:-apple-system,'Helvetica Neue',Arial,sans-serif; background:oklch(0.978 0.004 245); color:oklch(0.17 0.015 248) }
h1{ font-size:72px; font-weight:800; letter-spacing:-.02em }
.sub{ display:flex; align-items:center; gap:16px; margin-top:26px; font-size:31px; color:oklch(0.34 0.014 246) }
.dia{ width:22px; height:22px; transform:rotate(45deg); background:oklch(0.69 0.16 42) }
.band{ margin-top:52px; height:110px }
.band svg{ width:100%; height:100%; display:block }
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

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await page.setContent(html)
await page.waitForTimeout(120)
const png = await page.screenshot({ type: 'png' })
await browser.close()

const out = join(dirname(fileURLToPath(import.meta.url)), '../web/img/og.png')
writeFileSync(out, png)
console.log(`web/img/og.png written — 1200×630, ${(png.length / 1024).toFixed(0)} kB`)
