import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { serve } from './test-server.js'

const systemChrome = process.platform === 'darwin'
	? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
	: process.platform === 'win32'
		? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
		: '/usr/bin/google-chrome'
const executablePath = [process.env.CHROME_PATH, chromium.executablePath(), systemChrome].find(p => p && existsSync(p))
if (!executablePath) throw new Error('Chromium is not installed; run `npx playwright install chromium` or set CHROME_PATH')
if (!existsSync(resolve('_site/index.html'))) throw new Error('_site is missing; run `npm run landing` first')

const server = await serve(resolve('_site'))
const browser = await chromium.launch({ headless: true, executablePath })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
const errors = []
try {
	const page = await context.newPage()
	page.on('pageerror', error => errors.push(error.message))
	await page.goto(`${server.origin}/?sw&cb=${Date.now()}`, { waitUntil: 'networkidle' })   // ?sw: loopback skips the service worker for dev-freshness — the offline pin below needs it registered
	await page.waitForSelector('.ent[data-s="oklch"] .nm')
	assert.equal(await page.locator('.ent').count(), 162, 'catalog has all spaces')

	const search = page.locator('#q')
	await page.locator('.qx').click()
	await search.fill('oklch')
	assert.equal(await page.locator('.ent[data-s="oklch"]').isVisible(), true, 'search keeps OKLCH visible')
	assert.equal(await page.locator('.ent[data-s="rgb"]').isVisible(), false, 'search filters non-matches')
	// the overlay clear button: visible with a query, one click empties and restores
	assert.equal(await page.locator('.qclr').isVisible(), true, 'the clear button shows with a query')
	await page.locator('.qclr').click()
	assert.equal(await search.inputValue(), '', 'the clear button empties the query')
	assert.equal(await page.locator('.ent[data-s="rgb"]').isVisible(), true, 'and restores the catalog')

	// the coverage slider: ≥90% keeps full-coverage spaces, drops sRGB (~36%), and the
	// header chip resets it — pins the threshold predicate and its chip lifecycle
	await page.locator('#tfb').click()
	await page.locator('#fcov').fill('90')
	assert.equal(await page.locator('.ent[data-s="oklab"]').isVisible(), true, 'coverage ≥90% keeps oklab')
	assert.equal(await page.locator('.ent[data-s="rgb"]').isVisible(), false, 'coverage ≥90% drops sRGB')
	await page.locator('.fchip[data-cov]').click()
	assert.equal(await page.locator('.ent[data-s="rgb"]').isVisible(), true, 'removing the coverage chip restores the catalog')
	// the interval's low end: ≤50% finds the narrow-coverage spaces and drops the wide ones
	await page.locator('#tfb').click()   // the chip click closed the picker — reopen for the interval case
	await page.locator('#fcov1').fill('50')
	assert.equal(await page.locator('.ent[data-s="rgb"]').isVisible(), true, 'coverage ≤50% keeps sRGB (~36%)')
	assert.equal(await page.locator('.ent[data-s="oklab"]').isVisible(), false, 'coverage ≤50% drops oklab')
	await page.locator('.fchip[data-cov]').click()
	await page.keyboard.press('Escape')

	// each family's tooltip rides its rail button; card names carry the quick-tag
	// dossier; the FAQ entries fold and unfold
	assert.equal(await page.locator('.toc .tn[data-tip]').count(), 11, 'every family carries its tooltip')
	assert.match(await page.locator('.ent[data-s="oklch"] .nm').getAttribute('data-tip'), /2020/, 'card names carry the quick-tag dossier')
	assert.match(await page.locator('.ent[data-s="oklch"] .nm').getAttribute('data-tip-tags'), /perceptual/, 'and its tag chips')
	assert.equal(await page.locator('.fqa').count(), 16, 'the questions are all present')
	const fq = page.locator('.fqa').first()
	await fq.locator('summary').click()
	assert.equal(await fq.getAttribute('open'), '', 'a question unfolds')
	// a specimen value link sets color AND notation through the hash alone – the URL
	// carries the notation both ways (parsed on arrival, written back by urlHash)
	await fq.locator('a[href^="#oklch("]').click()
	assert.match(await page.locator('#cval').inputValue(), /^oklch\(/, 'a FAQ specimen link switches color and notation')
	assert.match(decodeURIComponent(page.url()), /#oklch\(/, 'and the URL speaks that notation')
	await page.locator('#cval').click()   // now CHANGE the color while in oklch – urlHash must write the new color back in the same notation
	await page.locator('#cval').pressSequentially('coral')
	await page.locator('#cval').press('Enter')
	await page.waitForFunction(() => decodeURIComponent(location.hash).startsWith('#oklch('))
	await page.evaluate(() => location.hash = 'ff8000')   // a hex hash restores hex notation – the later canonicalize assertions read hex
	assert.match(await page.locator('#cval').inputValue(), /^#FF8000$/i, 'a hex hash infers hex notation back')
	await fq.locator('summary').click()
	assert.equal(await fq.getAttribute('open'), null, 'and folds back')

	// the shelf cut lives at the rail's FOOT now — tabs regroup without the panel;
	// the filters then compose on the rebuilt DOM (scene-referred × era = the
	// camera-log timeline), and the header chips restore every layer
	assert.equal(await page.locator('.gtag').count(), 3, 'the rail offers the three cuts')
	await page.locator('.gtag[data-g="purpose"]').click()
	assert.match(await page.locator('.toc .tn').first().innerText(), /Picking/, 'purpose shelves lead the rail')
	await page.locator('.gtag[data-g="era"]').click()
	assert.equal(await page.locator('.ent[data-s]').count(), 162, 'era regroup keeps every space')
	assert.match(await page.locator('.toc .tn').first().innerText(), /2020/, 'era shelves lead the rail, newest first')
	await page.locator('#tfb').click()
	await page.locator('#tfp button[data-t="scene"]').click()
	assert.equal(await page.locator('.ent[data-s="slog3"]').isVisible(), true, 'signal filter composes with the era cut')
	assert.equal(await page.locator('.ent[data-s="hsl"]').isVisible(), false, 'and still drops non-matches there')
	await page.locator('.fchip[data-f]').click()
	await page.locator('.gtag[data-g="family"]').click()
	assert.match(await page.locator('.toc .tn').first().innerText(), /Display/, 'the Family tab restores the family cut')

	await page.locator('#cval').fill('rebeccapurple')
	await page.locator('#cval').press('Enter')
	assert.equal(await page.locator('#cval').inputValue(), '#663399', 'supported CSS color input canonicalizes')

	// catalog cells pasted without the space name: the sym sequence + value scale name the space
	await page.locator('#cval').fill('L 0.39 C 0.083 H 153')
	await page.locator('#cval').press('Enter')
	assert.equal(await page.locator('#cval').inputValue(), '#19512F', 'bare channel paste reads 0–1 L as oklch')
	await page.locator('#cval').fill('l 62.5 c 40 h 153')
	await page.locator('#cval').press('Enter')
	assert.equal(await page.locator('#cval').inputValue(), '#54A875', 'bare channel paste reads 0–100 L as lchab')

	await page.locator('#api-tab-wasm').click()
	assert.equal(await page.locator('#api-tab-wasm').getAttribute('aria-selected'), 'true', 'API tabs activate')
	assert.equal(await page.locator('#api-panel-wasm').isVisible(), true, 'active API panel is visible')

	await page.locator('#thm').click()
	assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark', 'theme toggles')
	await page.reload({ waitUntil: 'networkidle' })
	assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark', 'theme persists')

	// segmented rendering starts from a neutral so the OKLab lattice's neutral-axis
	// invariant is visible (the old floor-based a/b sites turned #808080 brown)
	await page.locator('#cval').fill('#808080')
	await page.locator('#cval').press('Enter')
	const trigger = page.locator('.ent[data-s="oklch"] .nm')
	await trigger.click()
	await page.waitForSelector('#modal:not([hidden]) #dtitle')
	assert.match(await page.locator('#dtitle').innerText(), /OKLCH/i, 'dossier opens')
	const mode=async value=>{ await page.locator('#qseg').selectOption(value); await page.waitForTimeout(80) }
	await mode('jnd')
	const evenHex=await page.locator('#cd').inputValue(), evenRgb=[1,3,5].map(i=>parseInt(evenHex.slice(i,i+2),16))
	assert.equal(Math.max(...evenRgb)-Math.min(...evenRgb)<=1,true,'even mode preserves the neutral axis')
	await mode('web')
	const safeHex=await page.locator('#cd').inputValue(), safeRgb=[1,3,5].map(i=>parseInt(safeHex.slice(i,i+2),16))
	assert.equal(safeRgb.every(v=>v%51===0),true,'safe mode lands on the 216-color web-safe lattice')
	await mode('10')
	const lbar=page.locator('.bar2[data-i="0"]'), lr=await lbar.boundingBox()
	await page.mouse.move(lr.x+lr.width*.27,lr.y+lr.height/2); await page.mouse.down(); await page.waitForTimeout(30)
	assert.equal(await page.locator('#bigch .nv').first().inputValue(),'0.27','quantized slider moves continuously while held')
	await page.mouse.up(); await page.waitForTimeout(40)
	assert.equal(await page.locator('#bigch .nv').first().inputValue(),'0.25','quantized slider snaps to its cell center on release')
	await page.mouse.click(lr.x+lr.width*.01,lr.y+lr.height/2)
	assert.equal(await page.locator('#bigch .nv').first().inputValue(),'0.05','10-step first cell selects its center, not an extra minimum')
	await page.mouse.click(lr.x+lr.width*.99,lr.y+lr.height/2)
	assert.equal(await page.locator('#bigch .nv').first().inputValue(),'0.95','10-step last cell selects its center, not an extra maximum')
	await page.locator('#bigch .nv').first().focus(); await page.keyboard.press('ArrowDown')
	assert.equal(await page.locator('#bigch .nv').first().inputValue(),'0.85','numeric spinner advances by one visible cell')
	const qplane=page.locator('.pl').first(), qr=await qplane.boundingBox()
	await page.mouse.move(qr.x+qr.width*.31,qr.y+qr.height*.62); await page.mouse.down(); await page.waitForTimeout(30)
	assert.equal(await page.locator('#bigch .nv').nth(0).inputValue(),'0.38','quantized plane moves continuously while held')
	assert.equal(await page.locator('#bigch .nv').nth(1).inputValue(),'0.124','both plane axes remain unsnapped during drag')
	await page.mouse.up(); await page.waitForTimeout(50)
	assert.equal(await page.locator('#bigch .nv').nth(0).inputValue(),'0.35','plane lightness snaps to its cell center on release')
	assert.equal(await page.locator('#bigch .nv').nth(1).inputValue(),'0.140','plane chroma snaps to its cell center on release')
	const solid10=await page.locator('#pl3d').screenshot()
	await mode('20')
	const solid20=await page.locator('#pl3d').screenshot()
	assert.equal(solid10.equals(solid20),false,'10/20 filled color sections render differently on the 3D solid')
	await mode('names'); await page.waitForTimeout(120)
	await page.mouse.move(lr.x+lr.width*.42,lr.y+lr.height/2); await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(120)
	const nameCentered=await lbar.evaluate((bar,target)=>{ const cv=bar.querySelector('.bgc'), d=cv.getContext('2d').getImageData(0,0,cv.width,1).data
		const rgb=[1,3,5].map(i=>parseInt(target.slice(i,i+2),16)), at=x=>[d[x*4],d[x*4+1],d[x*4+2]].every((v,i)=>Math.abs(v-rgb[i])<=1)
		const mf=parseFloat(bar.querySelector('.dk').style.left)/100*cv.width; let x=Math.max(0,Math.min(cv.width-1,Math.round(mf))), lo=x,hi=x
		if(!at(x)) return false; while(lo>0&&at(lo-1))lo--; while(hi<cv.width-1&&at(hi+1))hi++
		return Math.abs(mf-(lo+hi+1)/2)<=2 },await page.locator('#cd').inputValue())
	assert.equal(nameCentered,true,'palette slider marker settles at the visual region center')
	await mode('smooth')
	// the exporters ride the plates rail: label + target select + download buttons
	assert.match(await page.locator('#dex').innerText(), /conversion lut/i, 'LUT block rides the dossier rail')
	assert.equal(await page.locator('#dex #dldl').count() + await page.locator('#dex #didl').count(), 2, 'cube + icc downloads present')
	await page.keyboard.press('Escape')
	await page.waitForFunction(() => document.querySelector('#modal')?.hidden === true)
	assert.equal(await trigger.evaluate(el => document.activeElement === el), true, 'dossier restores focus')

	// Palette coordinates may exceed a space's declared instrument range. RGB remains
	// authoritative across mode changes: HPLuv used to retain S=196 after even→smooth,
	// punching transparent holes into its H×L plane.
	await page.locator('.ent[data-s="hpluv"] .nm').click(); await page.waitForSelector('#qseg')
	await mode('jnd'); await mode('smooth')
	assert.equal(+(await page.locator('#bigch .nv').nth(1).inputValue())<=100,true,'HPLuv even→smooth keeps saturation in range')
	const hpVoid=await page.locator('.pl[data-a="0"][data-b="2"] canvas').evaluate(c=>{ const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; let n=0; for(let i=3;i<d.length;i+=4) if(d[i]<10)n++; return n })
	assert.equal(hpVoid,0,'HPLuv H×L plane remains complete after even→smooth')
	await page.locator('#mx').click(); await page.waitForFunction(()=>document.querySelector('#modal')?.hidden === true)

	await page.goto(`${server.origin}/oklch?sw&cb=${Date.now()}`, { waitUntil: 'networkidle' })
	await page.waitForSelector('#modal:not([hidden]) #dtitle')
	assert.match(await page.locator('link[rel="canonical"]').getAttribute('href'), /\/oklch$/, 'direct dossier has its canonical URL')
	await page.locator('#mx').click()
	await page.waitForFunction(() => document.querySelector('#modal')?.hidden === true)

	// the canonical exact-coords form: path opens the dossier, the hash carries the space's
	// own coordinates and notation – one grammar for "a color" and "a color in this space"
	await page.goto(`${server.origin}/oklab?sw&cb=${Date.now()}#oklab(0.6 0.1 -0.05)`, { waitUntil: 'networkidle' })
	await page.waitForSelector('#modal:not([hidden]) #dtitle')
	assert.match(await page.locator('#dtitle').innerText(), /oklab/i, 'path + notation hash opens the dossier')
	assert.match(await page.locator('#cval').inputValue(), /^oklab\(0\.6/, 'with the exact coordinates, in that notation')
	await page.locator('#mx').click()
	await page.waitForFunction(() => document.querySelector('#modal')?.hidden === true)
	await page.evaluate(() => location.hash = 'ff8000')   // hex notation back for the tests below

	const mobile = await context.newPage()
	mobile.on('pageerror', error => errors.push(`mobile: ${error.message}`))
	await mobile.setViewportSize({ width: 390, height: 844 })
	await mobile.goto(`${server.origin}/?sw&cb=${Date.now()}`, { waitUntil: 'networkidle' })
	// no folding: headings are plain titles and every row is visible by default
	const heading = mobile.locator('.shw').first()
	await heading.waitFor()
	assert.equal(await heading.getAttribute('role'), null, 'mobile category heading is a plain title (folding removed)')
	const rowsShown = await mobile.evaluate(() =>
		[...document.querySelectorAll('.gcol > .ent')].slice(0, 8).every(e => e.getBoundingClientRect().height > 0))
	assert.equal(rowsShown, true, 'mobile rows are all visible without unfolding')
	// operating the grouping select must not raise its heading's explainer (tip.js stops
	// ancestor tips at form controls) — while the heading itself still explains
	await mobile.locator('.gsel').first().hover()
	await mobile.waitForTimeout(450)   // past tip.js's 300ms arm delay
	assert.equal(await mobile.locator('#tip.on').count(), 0, 'the grouping select does not raise the section tip')
	await mobile.locator('.shw').first().hover()
	await mobile.waitForTimeout(450)
	assert.equal(await mobile.locator('#tip.on').count(), 1, 'the heading itself still explains')
	await mobile.close()

	const og = await context.request.get(`${server.origin}/img/og.png?cb=${Date.now()}`)
	assert.equal(og.ok(), true, 'social image resolves')
	assert.match(og.headers()['content-type'], /^image\/png/, 'social image is PNG')

	// offline shell: sw.js precached the app on the first load above (regression: registration
	// once gated on a bare 'load' listener, which the module's data await lets fire first —
	// the SW never installed); an unvisited /<name> must come from the cached shell
	await page.waitForFunction(async () => {
		const r = await navigator.serviceWorker.getRegistration()
		if (!r?.active) return false   // cache entries appear MID-install – only an active worker guarantees the precache finished and navigations are intercepted
		const keys = await caches.keys()
		return keys.length && (await (await caches.open(keys[0])).keys()).length >= 30
	})
	await context.setOffline(true)
	await page.goto(`${server.origin}/oklab?cb=${Date.now()}`)
	await page.waitForSelector('#modal:not([hidden]) #dtitle')
	assert.match(await page.locator('#dtitle').innerText(), /oklab/i, 'offline navigation opens the dossier from the cached shell')
	await context.setOffline(false)

	if (errors.length) throw new Error(errors.join('\n'))
	console.log('browser: search, coverage filter, CSS parsing, tabs, persisted theme, modal lifecycle, direct route, mobile keyboard, social image and offline shell pass')
} finally {
	await context.close()
	await browser.close()
	await server.close()
}
