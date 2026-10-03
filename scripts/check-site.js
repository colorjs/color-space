import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
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
// CS_SITE points the check at another staged copy (a snapshot built elsewhere); default _site
const SITE = resolve(process.env.CS_SITE || '_site')
if (!existsSync(resolve(SITE, 'index.html'))) throw new Error(`${SITE} is missing; run \`npm run landing\` first`)

const server = await serve(SITE)
const browser = await chromium.launch({ headless: true, executablePath })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
const errors = []
try {
	const page = await context.newPage()
	page.on('pageerror', error => errors.push(error.message))
	await page.goto(`${server.origin}/?sw&cb=${Date.now()}`, { waitUntil: 'networkidle' })   // ?sw: loopback skips the service worker for dev-freshness — the offline pin below needs it registered
	await page.waitForSelector('.ent[data-s="oklch"] .nm')
	assert.equal(await page.locator('.ent').count(), 168, 'catalog has all spaces')
	assert.equal(await page.locator('#stripgl').count(), 0, 'catalog has no page-sized canvas on its scroll/input path')
	// a name is the entry's identity: it wraps, never clips (CMYK once read "CM…") – the text's own
	// extent must fit its box, measured on the text node so the hidden ↗ overhang doesn't count
	assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('.ent .nm')].filter(n => n.offsetParent).filter(n => {
		const r = document.createRange(); r.selectNodeContents(n); return r.getBoundingClientRect().width > n.getBoundingClientRect().width + 1 }).map(n => n.closest('.ent').dataset.s)), [], 'no catalog name is clipped')
	assert.equal(await page.locator('.ent[data-s="cmyk"] .cvp .stk button').first().evaluate(b => getComputedStyle(b).opacity), '0', 'on hover-capable pointers the spinners rest until their row is pointed')
	const initialGradient=await page.locator('.ent[data-s="oklch"] .ch').first().evaluate(el => el.style.background.includes('linear-gradient')?el.style.background:el._gradStack?.at(-1)?.style.background||'')
	assert.match(initialGradient, /linear-gradient/, 'catalog strips use CSS gradients')
	assert.match(initialGradient, /rgb\([^)]*\.\d+/, 'gradient guides retain sub-byte color precision')
	assert.doesNotMatch(initialGradient, /\d(?:\.\d+)?%\s+\d(?:\.\d+)?%/, 'smooth mode has interpolated stops, not hard sampled bands')
	const mainLensesBefore=await page.locator('.ent[data-g]').evaluateAll(els=>els.map(el=>el.dataset.g))
	assert.equal(mainLensesBefore.length>1&&mainLensesBefore.every(key=>/:off(?::|$)/.test(key)),true,'every populated catalog slider renders on full Light')
	await page.locator('#gseg').selectOption('srgb'); await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
	assert.deepEqual(await page.locator('.ent[data-g]').evaluateAll(els=>els.map(el=>el.dataset.g)),mainLensesBefore,'dossier limits do not repaint any main slider')
	await page.locator('#gseg').selectOption('vis')
	assert.equal(await page.locator('#cd').inputValue(), '#808080', 'undefined color starts neutral gray')
	await page.locator('#upfl').click(); await page.waitForSelector('#uppop:not([hidden])')
	const specimens=page.locator('#uppop .upim:not(.upld)')
	assert.equal(await specimens.count(),7,'image rail carries the seven canonical specimens')
	assert.deepEqual(await specimens.evaluateAll(bs=>bs.map(b=>b.title)),['Signal chart – bars, ramps, hue, limits','Color rendition target','Simultaneous contrast – one gray, four surrounds','Video calibration – 75% bars, PLUGE, multiburst','Colormap paths – gray, viridis, plasma, inferno, magma, cool-warm, turbo','Emissive star – clipped core and chromatic glow','The Great Wave – Hokusai'],'specimen order moves from exact diagnostics through scenes and art')
	assert.equal(await specimens.locator('canvas').count(),3,'all three graphical diagnostics are generated losslessly')
	assert.equal(await specimens.locator('img').evaluateAll(imgs=>imgs.length===4&&imgs.every(img=>img.complete&&img.naturalWidth>0)),true,'all four raster specimens decode')
	const rasterTruth=await specimens.locator('img').evaluateAll(imgs=>{ const raster=img=>{ const c=Object.assign(document.createElement('canvas'),{width:img.naturalWidth,height:img.naturalHeight}),x=c.getContext('2d'); x.drawImage(img,0,0); return {c,x} }, sample=(r,pts)=>pts.map(([a,b])=>[...r.x.getImageData(a,b,1,1).data.slice(0,3)])
		const maps=raster(imgs[1]), glow=raster(imgs[2]), labels=[]; let y0=0
		for(let row=0;row<7;row++){ const h=Math.floor(480/7)+(row<480%7?1:0),d=maps.x.getImageData(0,y0,160,h).data; let white=0; for(let i=0;i<d.length;i+=4)if(d[i]>245&&d[i+1]>245&&d[i+2]>245)white++; labels.push(white); y0+=h }
		return {maps:sample(maps,[[0,100],[639,100],[0,380],[639,380]]),labels,glow:sample(glow,[[320,240],[350,240],[380,240]])} })
	assert.deepEqual(rasterTruth.maps,[[68,1,84],[253,231,37],[59,76,192],[180,4,38]],'colormap atlas keeps the reference path endpoints')
	assert.equal(rasterTruth.labels.every(n=>n>20),true,'every colormap path carries a compact white label')
	assert.deepEqual(rasterTruth.glow,[[255,255,255],[255,238,98],[255,177,71]],'emissive target exposes its clipped white-to-warm radial sequence')
	const generatedTruth=await specimens.locator('canvas').evaluateAll(cs=>{ const px=(c,x,y)=>[...c.getContext('2d').getImageData(x,y,1,1).data.slice(0,3)]
		return {contrast:[[160,120],[480,120],[160,360],[480,360]].map(([x,y])=>px(cs[1],x,y)),video:[px(cs[2],40,40),px(cs[2],600,40)]} })
	assert.deepEqual(generatedTruth.contrast,Array(4).fill([128,128,128]),'simultaneous-contrast centers are numerically identical')
	assert.deepEqual(generatedTruth.video,[[180,180,180],[16,16,180]],'video card preserves its 75% studio-level endpoints')
	assert.equal(await page.locator('#uppop .upld').count(),1,'upload remains available after the canonical seven')
	await page.locator('#upfl').click()
	const liveTier=await page.evaluate(async()=>{ const src=document.querySelector('.ent[data-s="rgb"] .nrg[data-i="0"]')
		const neighbor=document.querySelector('.ent[data-s="rgb"] .ch[data-i="1"]'), currentVal=document.querySelector('.ent[data-s="rgb"] .cv[data-i="0"]'), otherLane=document.querySelector('.ent[data-s="p3"] .ch'), otherVal=document.querySelector('.ent[data-s="p3"] .cv'), otherRange=document.querySelector('.ent[data-s="p3"] .nrg'), hueLine=document.querySelector('.hueline')
		const frame=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))), set=v=>{ src.value=v; src.dispatchEvent(new Event('input',{bubbles:true})) }, pause=ms=>new Promise(r=>setTimeout(r,ms)), cur=el=>getComputedStyle(el).getPropertyValue('--cur').trim(), rowKeys=()=>[...document.querySelectorAll('.ent:not(.lite)')].filter(el=>{ const r=el.getBoundingClientRect(); return r.bottom>0&&r.top<innerHeight }).map(el=>({s:el.dataset.s,key:el.querySelector('.ch')?._g||el.dataset.g||''}))
		let rootWrites=0; const rootObserver=new MutationObserver(()=>rootWrites++); rootObserver.observe(document.documentElement,{attributes:true,attributeFilter:['style']})
		src.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:17,isPrimary:true}))
		set(160); await frame()
		const mid={gradient:neighbor.style.background,value:otherVal.value,thumb:otherRange.value,thumbColor:getComputedStyle(otherRange).getPropertyValue('--tkc'),otherGradient:otherLane._g,uiColor:hueLine.style.getPropertyValue('--cur')}
		set(190); await frame(); const uiColor=cur(hueLine), scoped=[hueLine,document.querySelector('.fgrad'),document.getElementById('lutszL'),document.getElementById('api-tab-core')?.parentElement,document.querySelector('.gtabs'),src.closest('.ent')].filter(Boolean).map(cur)
		const immediate={gradient:neighbor.style.background,currentValue:currentVal.value,thumb:otherRange.value,thumbColor:getComputedStyle(otherRange).getPropertyValue('--tkc'),otherGradient:otherLane._g,uiColor,scoped}
		const vd=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value'), writes=[]
		Object.defineProperty(otherVal,'value',{configurable:true,get(){return vd.get.call(this)},set(v){writes.push(performance.now());vd.set.call(this,v)}})
		const st=performance.now(); await new Promise(done=>{ let k=0; const tick=t=>{ set(190+(k++%45)); t-st<240?requestAnimationFrame(tick):done() }; requestAnimationFrame(tick) })
		delete otherVal.value; const throttled={writes:writes.length,value:otherVal.value}; await pause(180); const held={thumb:otherRange.value,otherGradient:otherLane._g,rootWrites}; rootObserver.disconnect()
		set(245); const beforeRelease={value:otherVal.value,thumb:otherRange.value,otherGradient:otherLane._g}
		src.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:17,isPrimary:true})); src.dispatchEvent(new Event('change',{bubbles:true})); const released={value:otherVal.value,thumb:otherRange.value,otherGradient:otherLane._g,rows:rowKeys()}
		await pause(500); const post={accent:document.documentElement.style.accentColor,current:getComputedStyle(hueLine).backgroundColor}; return {mid,immediate,throttled,held,beforeRelease,released,post} })
	assert.notEqual(liveTier.immediate.gradient,liveTier.mid.gradient,'current-space neighboring gradients update live')
	assert.notEqual(liveTier.immediate.uiColor,liveTier.mid.uiColor,'scoped current-color UI stays live during a drag')
	assert.equal(liveTier.immediate.scoped.length===6&&liveTier.immediate.scoped.every(color=>color===liveTier.immediate.uiColor),true,'every static current-color consumer follows the scoped drag color')
	assert.equal(liveTier.held.rootWrites,0,'a held drag never mutates inherited style on the document root')
	assert.equal(+liveTier.immediate.currentValue,190,'the actively dragged row keeps its numeric value live')
	assert.equal(liveTier.throttled.writes>0&&liveTier.throttled.writes<=4,true,'other-space numeric writes stay bounded to the 100ms tier during a drag burst')
	assert.notEqual(liveTier.throttled.value,liveTier.mid.value,'other-space numeric inputs catch up during the 100ms tier')
	assert.notEqual(liveTier.released.value,liveTier.beforeRelease.value,'release always flushes the final throttled numeric values')
	assert.notEqual(liveTier.immediate.thumb,liveTier.mid.thumb,'every visible slider picker follows a held drag immediately')
	assert.notEqual(liveTier.immediate.thumbColor,liveTier.mid.thumbColor,'every visible slider picker color follows a held drag immediately')
	assert.equal(liveTier.immediate.thumbColor.trim().toLowerCase(),liveTier.immediate.uiColor.toLowerCase(),'every visible picker wears the current displayed color')
	assert.notEqual(liveTier.held.otherGradient,liveTier.immediate.otherGradient,'other-space gradients repaint on the held throttle')
	assert.match(liveTier.held.otherGradient,/:8:off:/,'held secondary gradients use the reduced guide count')
	assert.notEqual(liveTier.released.thumb,liveTier.beforeRelease.thumb,'release flushes the final picker position synchronously')
	assert.notEqual(liveTier.released.otherGradient,liveTier.beforeRelease.otherGradient,'release repaints secondary gradients synchronously')
	assert.match(liveTier.released.otherGradient,/:48:off:/,'released secondary sliders regain full-quality Light guides immediately')
	assert.equal(liveTier.released.rows.length>1&&liveTier.released.rows.every(({s,key})=>key.includes(`:${s==='rgb'?1:48}:off:`)),true,'release repaints every visible catalog row at its full Light guide count')
	assert.equal(liveTier.post.accent,liveTier.post.current,'native accent color catches up after release')
	const cancelled=await page.evaluate(async()=>{ const src=document.querySelector('.ent[data-s="rgb"] .nrg[data-i="0"]'), lane=document.querySelector('.ent[data-s="p3"] .ch'), before=lane._g
		src.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:18,isPrimary:true})); src.value=32; src.dispatchEvent(new Event('input',{bubbles:true})); await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))
		src.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:18,isPrimary:true})); return {before,after:lane._g} })
	assert.notEqual(cancelled.after,cancelled.before,'pointer cancellation repaints catalog gradients synchronously')
	assert.match(cancelled.after,/:48:off:/,'pointer cancellation restores full-quality Light guides immediately')
	const customCatalogCancel=await page.evaluate(async()=>{ const ch=document.querySelector('.ent[data-s="rgb"] .ch'), back=document.querySelector('.ent[data-s="p3"] .ch'), r=ch.getBoundingClientRect(), capture=ch.setPointerCapture; ch.setPointerCapture=()=>{}
		const pointer=(type,f)=>ch.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:21,isPrimary:true,clientX:r.left+r.width*f,clientY:r.top+r.height/2}))
		pointer('pointerdown',.2); pointer('pointermove',.65); await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))); const active=ch.classList.contains('live'), held=back._g||back.closest('.ent').dataset.g
		pointer('pointercancel',.65); ch.setPointerCapture=capture; return {active,parked:!ch.classList.contains('live'),held,after:back._g||back.closest('.ent').dataset.g} })
	assert.equal(customCatalogCancel.active&&customCatalogCancel.parked,true,'pointer cancellation parks a custom catalog slider')
	assert.notEqual(customCatalogCancel.after,customCatalogCancel.held,'custom catalog cancellation repaints ranges synchronously')
	assert.match(customCatalogCancel.after,/:48:off:/,'custom catalog cancellation restores full-quality ranges')
	await page.locator('#cval').fill('#123456'); await page.waitForFunction(()=>document.querySelector('#cd').value.toLowerCase()==='#123456')
	assert.equal(await page.locator('#cd').inputValue(),'#123456','pointer cancellation releases the catalog drag guard')
	await page.waitForFunction(()=>document.documentElement._accent==='#123456')   // the typed color's own root accent lands CURRENT_SETTLE after its frame – let it, or it counts inside the burst below
	const nonPointerRoot=await page.evaluate(async()=>{ const src=document.querySelector('.ent[data-s="rgb"] .nrg[data-i="0"]'); let writes=0
		const observer=new MutationObserver(()=>writes++); observer.observe(document.documentElement,{attributes:true,attributeFilter:['style']})
		for(let n=0;n<12;n++){ src.value=40+n*10; src.dispatchEvent(new Event('input',{bubbles:true})); await new Promise(r=>requestAnimationFrame(r)) }
		const during=writes; src.dispatchEvent(new Event('change',{bubbles:true})); await new Promise(r=>setTimeout(r,250)); observer.disconnect(); return {during,after:writes} })
	assert.equal(nonPointerRoot.during,0,'a rapid non-pointer input burst does not mutate inherited root style')
	assert.equal(nonPointerRoot.after,1,'the native root accent updates once after the input burst settles')

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
	// the fill IS the interval: after a reset the track must return to full ink, not clear
	assert.equal(await page.locator('#fcov').evaluate(i => { const d = i.closest('.dual'); return d.style.getPropertyValue('--lo') + ' ' + d.style.getPropertyValue('--hi') }), '0% 100%', 'coverage reset repaints the full interval')
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
	await page.waitForFunction(()=>/^#FF8000$/i.test(document.querySelector('#cval').value))
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
	assert.equal(await page.locator('.ent[data-s]').count(), 168, 'era regroup keeps every space')
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
	assert.match(await page.locator('#detail .dgrid2').evaluate(el => el.textContent), /made for\s*The polar form CSS adopted/, 'the lore line says what the space was made for, sentence-cased')
	assert.equal(await page.locator('#cseg').evaluate(el=>getComputedStyle(el).getPropertyValue('--cur').trim().toLowerCase()),(await page.locator('#cd').inputValue()).toLowerCase(),'dynamic dossier tabs receive the scoped current color')
	const mode=async value=>{ await page.evaluate(v=>{ const q=document.getElementById('qseg'); q.value=v; q.dispatchEvent(new Event('change',{bubbles:true})) },value)   // the view select lives in the (closed) filter panel now — drive it by value, not by visibility
		await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))) }
	const sliderBoundaryParity=async s=>page.evaluate(s=>[...document.querySelector(`.ent[data-s="${s}"]`).querySelectorAll('.ch')].every((ch,i)=>{ const bg=ch._gradStack?.at(-1)?.style.background||ch.style.background||'', p=[...bg.matchAll(/([\d.]+)%/g)].map(m=>+m[1]), css=p.filter((x,k)=>k&&Math.abs(x-p[k-1])<1e-6)
		const c=document.querySelector(`.bar2[data-i="${i}"] .bgc`), d=c.getContext('2d').getImageData(0,0,c.width,c.height).data, gpu=[]; let a=d[3]>=20
		for(let x=1;x<c.width;x++){ const next=d[x*4+3]>=20; if(next!==a){ gpu.push(x/c.width*100); a=next } }
		return css.length===gpu.length&&css.every((x,k)=>Math.abs(x-gpu[k])<.6) }),s)
	await mode('names')
	const paletteLane=page.locator('.ent[data-s="oklab"] .ch').first(); await page.waitForFunction(()=>{ const el=document.querySelector('.ent[data-s="oklab"] .ch'); return (el._g||el.closest('.ent').dataset.g||'').endsWith(':names:oklab') })
	const paletteBefore={color:await page.locator('#cd').inputValue(),key:await paletteLane.evaluate(el=>el._g||el.closest('.ent').dataset.g)}
	await page.evaluate(()=>{ const m=document.getElementById('mseg'); m.value='de76'; m.dispatchEvent(new Event('change',{bubbles:true})) })
	await page.waitForFunction(before=>{ const el=document.querySelector('.ent[data-s="oklab"] .ch'), key=el._g||el.closest('.ent').dataset.g||''; return key!==before&&key.endsWith(':names:de76') },paletteBefore.key)
	const paletteAfter={color:await page.locator('#cd').inputValue(),key:await paletteLane.evaluate(el=>el._g||el.closest('.ent').dataset.g)}
	assert.equal(paletteAfter.color,paletteBefore.color,'an exact named color stays fixed across palette metrics')
	assert.notEqual(paletteAfter.key,paletteBefore.key,'a palette metric change repaints background gradients even when the color stays fixed')
	assert.match(paletteAfter.key,/:names:de76$/,'settled catalog gradients carry the new palette metric')
	await page.evaluate(()=>{ const m=document.getElementById('mseg'); m.value='oklab'; m.dispatchEvent(new Event('change',{bubbles:true})) }); await mode('smooth')
	await mode('jnd')
	const evenHex=await page.locator('#cd').inputValue(), evenRgb=[1,3,5].map(i=>parseInt(evenHex.slice(i,i+2),16))
	assert.equal(Math.max(...evenRgb)-Math.min(...evenRgb)<=4,true,'even mode preserves the neutral axis')
	await mode('smooth'); await page.waitForTimeout(120)
	const markerPlane=page.locator('.pl').first(), markerRect=await markerPlane.boundingBox(), gamutMark=page.locator('#gam2d .cx')
	const markerBefore={gamut:await gamutMark.evaluate(el=>el.style.left+'|'+el.style.top),solid:await page.locator('#pl3d').screenshot()}
	await page.mouse.move(markerRect.x+markerRect.width*.74,markerRect.y+markerRect.height*.28); await page.mouse.down(); await page.waitForTimeout(50)
	assert.notEqual(await gamutMark.evaluate(el=>el.style.left+'|'+el.style.top),markerBefore.gamut,'gamut picker follows a held drag')
	assert.equal((await page.locator('#pl3d').screenshot()).equals(markerBefore.solid),false,'3D picker follows a held drag')
	await page.mouse.up()
	for(const [i,v] of [[0,'0.60'],[1,'0'],[2,'90']]) await page.locator('#bigch .nv').nth(i).fill(v)
	await page.waitForTimeout(50)
	const smoothNeighbor=page.locator('.bar2[data-i="1"] .bgc'), smoothBefore=await smoothNeighbor.evaluate(el=>el.toDataURL()), transferBefore=await page.locator('#tcap').innerText()
	const backPicker=page.locator('.ent[data-s="oklab"] .nrg').first(), backValue=page.locator('.ent[data-s="oklab"] .cv').first(), backLane=page.locator('.ent[data-s="oklab"] .ch').first()
	const smoothL=page.locator('.bar2[data-i="0"]'), smoothLR=await smoothL.boundingBox()
	await page.mouse.move(smoothLR.x+smoothLR.width*.36,smoothLR.y+smoothLR.height/2); await page.mouse.down(); await page.waitForTimeout(20)
	const backMid={picker:await backPicker.inputValue(),pickerColor:await backPicker.evaluate(el=>getComputedStyle(el).getPropertyValue('--tkc')),value:await backValue.inputValue(),gradient:await backLane.evaluate(el=>el._g||el.closest('.ent').dataset.g)}, smoothMid=await smoothNeighbor.evaluate(el=>el.toDataURL())
	await page.mouse.move(smoothLR.x+smoothLR.width*.46,smoothLR.y+smoothLR.height/2)
	for(let n=0;n<30&&await smoothNeighbor.evaluate((el,before)=>el.toDataURL()===before,smoothMid||smoothBefore);n++) await page.waitForTimeout(10)
	assert.equal(await page.locator('#bigch .nv').first().inputValue(),'0.46','dossier numeric input follows a smooth drag live')
	assert.notEqual(await smoothNeighbor.evaluate(el=>el.toDataURL()),smoothMid||smoothBefore,'dossier neighboring gradients follow the active space live')
	assert.notEqual(await page.locator('#tcap').innerText(),transferBefore,'transfer picker follows a held drag')
	assert.notEqual(await backPicker.inputValue(),backMid.picker,'dossier drag updates every background catalog picker immediately')
	assert.notEqual(await backPicker.evaluate(el=>getComputedStyle(el).getPropertyValue('--tkc')),backMid.pickerColor,'dossier drag updates every background picker color immediately')
	assert.equal((await backPicker.evaluate(el=>getComputedStyle(el).getPropertyValue('--tkc').trim().toLowerCase())),(await page.locator('#cd').inputValue()).toLowerCase(),'background picker colors match the modal drag color')
	await page.waitForTimeout(110)
	assert.notEqual(await backValue.inputValue(),backMid.value,'dossier drag updates background catalog numbers on the 100ms tier')
	await page.waitForTimeout(230)
	const backHeld=await backLane.evaluate(el=>el._g||el.closest('.ent').dataset.g)
	assert.notEqual(backHeld,backMid.gradient,'dossier drag repaints background catalog gradients on the throttle')
	assert.match(backHeld,/:8:off:/,'held background catalog gradients use reduced guides')
	await page.mouse.up()
	const backReleased=await backLane.evaluate(el=>el._g||el.closest('.ent').dataset.g)
	assert.notEqual(backReleased,backHeld,'dossier release repaints background catalog gradients synchronously')
	assert.match(backReleased,/:48:off:/,'dossier release restores full-quality background gradients immediately')
	const nativeCancel=await page.evaluate(async()=>{ const r=document.querySelector('.bar2[data-i="1"] .nrg'), bar=r.closest('.bar2'), back=document.querySelector('.ent[data-s="oklab"] .ch'), frame=()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)))
		r.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:19,isPrimary:true})); r.value=+r.min+(+r.max-+r.min)*.37; r.dispatchEvent(new Event('input',{bubbles:true})); await frame(); const active=bar.classList.contains('live'), held=back._g||back.closest('.ent').dataset.g
		r.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:19,isPrimary:true})); return {active,parked:!bar.classList.contains('live'),held,after:back._g||back.closest('.ent').dataset.g} })
	assert.equal(nativeCancel.active&&nativeCancel.parked,true,'pointer cancellation parks a native dossier slider')
	assert.notEqual(nativeCancel.after,nativeCancel.held,'native dossier cancellation repaints background ranges synchronously')
	assert.match(nativeCancel.after,/:48:off:/,'native dossier cancellation restores full-quality background ranges')
	await page.locator('#cval').fill('#234567'); await page.waitForFunction(()=>document.querySelector('#cd').value.toLowerCase()==='#234567')
	assert.equal(await page.locator('#cd').inputValue(),'#234567','native pointer cancellation releases the dossier drag guard')
	const customCancel=await smoothL.evaluate(async el=>{ const back=document.querySelector('.ent[data-s="oklab"] .ch'), r=el.getBoundingClientRect(), capture=el.setPointerCapture; el.setPointerCapture=()=>{}
		const pointer=(type,f)=>el.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:20,isPrimary:true,clientX:r.left+r.width*f,clientY:r.top+r.height/2}))
		pointer('pointerdown',.52); pointer('pointermove',.58); await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))); const active=el.classList.contains('live'), held=back._g||back.closest('.ent').dataset.g
		pointer('pointercancel',.58); el.setPointerCapture=capture; return {active,parked:!el.classList.contains('live'),held,after:back._g||back.closest('.ent').dataset.g} })
	assert.equal(customCancel.active&&customCancel.parked,true,'pointer cancellation parks a custom dossier slider')
	assert.notEqual(customCancel.after,customCancel.held,'custom dossier cancellation repaints background ranges synchronously')
	assert.match(customCancel.after,/:48:off:/,'custom dossier cancellation restores full-quality background ranges')
	await page.locator('#cval').fill('#345678'); await page.waitForFunction(()=>document.querySelector('#cd').value.toLowerCase()==='#345678')
	assert.equal(await page.locator('#cd').inputValue(),'#345678','custom pointer cancellation releases the dossier drag guard')
	await mode('web')
	const safeHex=await page.locator('#cd').inputValue(), safeRgb=[1,3,5].map(i=>parseInt(safeHex.slice(i,i+2),16))
	assert.equal(safeRgb.every(v=>v%51===0),true,'safe mode lands on the 216-color web-safe lattice')
	await mode('10')
	const lbar=page.locator('.bar2[data-i="0"]'), lr=await lbar.boundingBox()
	await page.mouse.move(lr.x+lr.width*.27,lr.y+lr.height/2); await page.mouse.down(); await page.waitForTimeout(30)
	assert.equal(await page.locator('#bigch .nv').first().inputValue(),'0.27','quantized slider moves continuously while held')
	await page.mouse.up()
	assert.match(await page.locator('.ent[data-s="oklch"] .ch').first().evaluate(el=>el._g||el.closest('.ent').dataset.g),/^oklch\|0\.25,.*:0:48:off:10$/,'release synchronously repaints catalog ranges from the final snapped value')
	await page.waitForTimeout(260)   // the release PARKS: a 180ms glide into the cell, so the read waits it out
	assert.equal(await page.locator('#bigch .nv').first().inputValue(),'0.25','quantized slider snaps to its cell center on release')
	await page.mouse.click(lr.x+lr.width*.01,lr.y+lr.height/2); await page.waitForTimeout(260)
	assert.equal(await page.locator('#bigch .nv').first().inputValue(),'0.05','10-step first cell selects its center, not an extra minimum')
	await page.mouse.click(lr.x+lr.width*.99,lr.y+lr.height/2); await page.waitForTimeout(260)
	assert.equal(await page.locator('#bigch .nv').first().inputValue(),'0.95','10-step last cell selects its center, not an extra maximum')
	await page.locator('#bigch .nv').first().focus(); await page.keyboard.press('ArrowDown')
	assert.equal(await page.locator('#bigch .nv').first().inputValue(),'0.85','numeric spinner advances by one visible cell')
	const qplane=page.locator('.pl').first(), qr=await qplane.boundingBox()
	await page.mouse.move(qr.x+qr.width*.31,qr.y+qr.height*.62); await page.mouse.down(); await page.waitForTimeout(30)
	assert.equal(await page.locator('#bigch .nv').nth(0).inputValue(),'0.38','quantized plane moves continuously while held')
	assert.equal(await page.locator('#bigch .nv').nth(1).inputValue(),'0.124','both plane axes remain unsnapped during drag')
	await page.mouse.up(); await page.waitForTimeout(260)   // the parking glide again
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
		const nr=bar.querySelector('.nrg')   // the native thumb IS the marker — its value carries the snap fraction
		const mf=(parseFloat(nr.value)-parseFloat(nr.min))/(parseFloat(nr.max)-parseFloat(nr.min))*cv.width; let x=Math.max(0,Math.min(cv.width-1,Math.round(mf))), lo=x,hi=x
		if(!at(x)) return false; while(lo>0&&at(lo-1))lo--; while(hi<cv.width-1&&at(hi+1))hi++
		return Math.abs(mf-(lo+hi+1)/2)<=2 },await page.locator('#cd').inputValue())
	assert.equal(nameCentered,true,'palette slider marker settles at the visual region center')
	await mode('smooth')
	// The catalog is always Light; the dossier alone wears the selected Surface limit.
	// Both still void imaginary coordinates at the same locus boundary.
	await page.evaluate(()=>{ const g=document.getElementById('gseg'); g.value='vis'; g.dispatchEvent(new Event('change',{bubbles:true})) })
	await page.waitForTimeout(200)
	for(const [i,v] of [[0,'0.30'],[1,'0.143'],[2,'263']]) await page.locator('#bigch .nv').nth(i).fill(v)
	await page.waitForFunction(()=>{ const el=document.querySelector('.ent[data-s="oklch"] .ch[data-i="0"]'), bg=el._gradStack?.at(-1)?.style.background||el.style.background||''; return /(?:\/ 0\)|,\s*0\))/.test(bg) }); await page.waitForTimeout(400)
	const cbar=page.locator('.bar2[data-i="1"]'), cr=await cbar.boundingBox()
	await page.mouse.move(cr.x+cr.width*(.143/.4),cr.y+cr.height/2); await page.mouse.down(); await page.mouse.move(cr.x+cr.width*(.143/.4)+2,cr.y+cr.height/2); await page.waitForTimeout(100)
	const validityEdges=await page.evaluate(()=>{ const main=document.querySelector('.ent[data-s="oklch"] .ch[data-i="0"]'), dossier=document.querySelector('.bar2[data-i="0"] .bgc')
		const mbg=main._gradStack?.at(-1)?.style.background||main.style.background||''
		const d=dossier.getContext('2d').getImageData(0,0,dossier.width,dossier.height).data; let first=-1, ghost=false
		for(let x=0;x<dossier.width;x++){ const a=d[x*4+3]; if(first<0&&a>=20) first=x; if(a>=80&&a<=180) ghost=true }
		return {mainVoid:/(?:\/ 0\)|,\s*0\))/.test(mbg),mainGhost:/(?:\/ 0\.5\)|,\s*0\.5\))/.test(mbg),dossierVoid:first>0,dossierGhost:ghost} })
	assert.equal(validityEdges.mainVoid&&!validityEdges.mainGhost&&validityEdges.dossierVoid&&validityEdges.dossierGhost,true,'catalog gradients stay on Light while the held dossier shows the Surface limit')
	await page.mouse.up(); await page.waitForTimeout(700)
	const settledEdges=await page.evaluate(()=>{ const main=document.querySelector('.ent[data-s="oklch"] .ch[data-i="0"]'), c=document.querySelector('.bar2[data-i="0"] .bgc'), bg=main._gradStack?.at(-1)?.style.background||main.style.background||''
		const p=[...bg.matchAll(/([\d.]+)%/g)].map(m=>+m[1]), hard=p.filter((x,i)=>i&&Math.abs(x-p[i-1])<1e-6), d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; let first=-1
		for(let x=0;x<c.width;x++)if(d[x*4+3]>=20){ first=x; break }
		return {main:hard[0],dossier:first/c.width*100} })
	assert.equal(isFinite(settledEdges.main)&&Math.abs(settledEdges.main-settledEdges.dossier)/100<.03,true,'Light catalog and limited dossier share the same locus boundary')
	await page.evaluate(()=>{ const g=document.getElementById('gseg'); g.value='vis'; g.dispatchEvent(new Event('change',{bubbles:true})) })   // restore the dossier default
	// the exporters ride the plates rail: label + target select + download buttons
	assert.match(await page.locator('#dex').innerText(), /conversion lut/i, 'LUT block rides the dossier rail')
	assert.equal(await page.locator('#dex #dldl').count() + await page.locator('#dex #didl').count(), 2, 'cube + icc downloads present')
	await page.keyboard.press('Escape')
	await page.waitForFunction(() => document.querySelector('#modal')?.hidden === true)
	assert.equal(await trigger.evaluate(el => document.activeElement === el), true, 'dossier restores focus')

	// Palette coordinates may exceed a space's declared instrument range. RGB remains
	// authoritative across mode changes: HPLuv used to retain S=196 after even→smooth,
	// punching transparent holes into its H×L plane.
	await page.locator('.ent[data-s="hpluv"] .nm').click(); await page.waitForSelector('#modal:not([hidden]) #dtitle')
	await mode('jnd'); await mode('smooth')
	assert.equal(+(await page.locator('#bigch .nv').nth(1).inputValue())<=100,true,'HPLuv even→smooth keeps saturation in range')
	const hpVoid=await page.locator('.pl[data-a="0"][data-b="2"] canvas').evaluate(c=>{ const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; let n=0; for(let i=3;i<d.length;i+=4) if(d[i]<10)n++; return n })
	assert.equal(hpVoid,0,'HPLuv H×L plane remains complete after even→smooth')
	await page.locator('#mx').click(); await page.waitForFunction(()=>document.querySelector('#modal')?.hidden === true)

	// Munsell's legal chroma is sharply bounded. A held drag must keep the exact GPU
	// boundary instead of swapping to a sparse CSS approximation until release.
	await page.locator('.ent[data-s="munsell"] .nm').click(); await page.waitForSelector('#detail .bar2')
	for(const [i,v] of [[2,'15.4'],[1,'6.3'],[0,'50']]){ await page.locator('.bar2 .nrg').nth(i).fill(v); await page.waitForTimeout(100) }
	await page.waitForFunction(()=>document.querySelector('.ent[data-s="munsell"]')?.dataset.g?.startsWith('munsell|50,6.3,15.4'))
	assert.equal(await sliderBoundaryParity('munsell'),true,'Munsell H 50 V 6.3 C 15.4 has identical catalog and dossier limits')
	await page.waitForFunction(()=>{ const c=document.querySelectorAll('#detail .bar2 .bgc')[2]; if(!c||c.style.display!=='block')return false
		const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; for(let i=3;i<d.length;i+=4)if(d[i]<20)return true; return false })
	const mbar=page.locator('#detail .bar2').first(), mbr=await mbar.boundingBox()
	await page.mouse.move(mbr.x+mbr.width*.2,mbr.y+mbr.height/2); await page.mouse.down(); await page.mouse.move(mbr.x+mbr.width*.75,mbr.y+mbr.height/2,{steps:6}); await page.waitForTimeout(150)
	const munsellLimit=await page.locator('#detail .bar2').nth(2).evaluate(bar=>{ const c=bar.querySelector('.bgc'), d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; let n=0; for(let i=3;i<d.length;i+=4)if(d[i]<20)n++; return c.style.display==='block'&&n>0 })
	assert.equal(munsellLimit,true,'Munsell keeps its invalid slider span during a live drag')
	await page.mouse.up(); await page.locator('#mx').click(); await page.waitForFunction(()=>document.querySelector('#modal')?.hidden === true)

	await page.locator('.ent[data-s="tsl"] .nm').click(); await page.waitForSelector('#detail .bar2')
	for(const [i,v] of [[2,'107'],[1,'0.63'],[0,'45']]){ await page.locator('.bar2 .nrg').nth(i).fill(v); await page.waitForTimeout(100) }
	await page.waitForFunction(()=>document.querySelector('.ent[data-s="tsl"]')?.dataset.g?.startsWith('tsl|45,0.63,107'))
	assert.equal(await sliderBoundaryParity('tsl'),true,'TSL T 45° S 0.63 L 107 has identical catalog and dossier limits')
	await page.locator('#mx').click(); await page.waitForFunction(()=>document.querySelector('#modal')?.hidden === true)

	// DKL is contrast around a mid-linear adapting background. The old white-relative,
	// one-sided ranges collapsed its fields into nearly flat strips.
	await page.locator('.ent[data-s="dkl"] .nm').click(); await page.waitForSelector('#detail .pl')
	assert.deepEqual(await page.locator('.bar2 .nrg').evaluateAll(rs=>rs.map(r=>[+r.min,+r.max])),[[-1,1],[-1.7,1.7],[-1.85,1.85]],'DKL exposes signed cardinal-axis ranges')
	for(let i=0;i<3;i++)await page.locator('.bar2 .nrg').nth(i).fill('0')
	await page.waitForFunction(()=>[...document.querySelectorAll('#detail .pl > canvas:first-child')].every(c=>{ const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data, colors=new Set; let opaque=0; for(let i=0;i<d.length;i+=4)if(d[i+3]>20){ opaque++; colors.add((d[i]>>4)+'|'+(d[i+1]>>4)+'|'+(d[i+2]>>4)) } return opaque>1000&&colors.size>100 }))
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

	const motionContext=await browser.newContext({viewport:{width:800,height:600}}), motion=await motionContext.newPage()
	await motion.goto(`${server.origin}/?cb=${Date.now()}`,{waitUntil:'networkidle'})
	await motion.waitForTimeout(700)
	assert.notEqual(await motion.locator('#cd').inputValue(),'#808080','undefined gray enters its ambient color orbit')
	const ambientPicker=await motion.evaluate(()=>{ const hx=document.querySelector('#cd').value.toUpperCase()
		const colors=[...document.querySelectorAll('.ent:not(.lite) .nrg')].filter(el=>{ const r=el.getBoundingClientRect(); return r.bottom>0&&r.top<innerHeight }).map(el=>getComputedStyle(el).getPropertyValue('--tkc').trim().toUpperCase())
		return {hx,colors} })
	assert.equal(ambientPicker.colors.length>0&&ambientPicker.colors.every(c=>c===ambientPicker.hx),true,'all visible slider pickers wear the animated color')
	const nameContext=await browser.newContext({viewport:{width:800,height:600}}), nameView=await nameContext.newPage()   // its OWN context: a second page in motionContext backgrounds the index, whose rAF pauses (CI caught the orbit unrepainted after typed input)
	await nameView.goto(`${server.origin}/oklch?cb=${Date.now()}`,{waitUntil:'networkidle'})
	await nameView.waitForFunction(()=>document.querySelector('#cd').value!=='#808080',null,{timeout:20000})   // a dossier's GL instruments make the first orbit frame late on software GL – wait for it, don't race it
	assert.equal(await nameView.locator('#cval').inputValue(),'','the orbit stays ambient on a name view – no value asserted, no URL written')
	assert.equal(new URL(nameView.url()).hash,'','the ambient orbit never writes the URL')
	await nameContext.close()
	await motion.locator('#cval').fill('#123456')
	await motion.waitForFunction(()=>document.querySelector('#cd').value==='#123456',null,{timeout:10000})   // wait for the repaint, don't race it – a loaded runner paints later than 450ms
	await motion.waitForTimeout(400)
	assert.equal(await motion.locator('#cd').inputValue(),'#123456','authored color input stops the ambient orbit')   // …and it HOLDS: a still-running orbit would have moved on
	await motion.locator('.ent:not(.lite)').last().scrollIntoViewIfNeeded(); await motion.waitForTimeout(180)
	const bottomPickers=await motion.evaluate(()=>{ const rows=[...document.querySelectorAll('.ent:not(.lite)')].filter(e=>{ const r=e.getBoundingClientRect(); return r.bottom>0&&r.top<innerHeight&&e.querySelector('.nrg') })
		const ranges=rows.flatMap(e=>[...e.querySelectorAll('.nrg')]), positioned=rows.every(e=>{ const cvs=e.querySelectorAll('.cv'), rs=e.querySelectorAll('.nrg'); return [...rs].every((r,i)=>Math.abs(+r.value-+cvs[i].value)<=(+r.max-+r.min)*.006+1e-9) })
		return {n:ranges.length,colored:ranges.every(r=>getComputedStyle(r).getPropertyValue('--tkc').trim().toUpperCase()==='#123456'),positioned} })
	assert.equal(bottomPickers.n>0&&bottomPickers.colored,true,'offscreen catalog pickers inherit the current color when scrolled into view')
	assert.equal(bottomPickers.positioned,true,'newly visible catalog picker positions catch up to the current color')
	await motion.evaluate(()=>scrollTo(0,0)); await motion.waitForTimeout(180)
	const interrupted=await motion.evaluate(async()=>{ const src=document.querySelector('.ent[data-s="rgb"] .nrg'), lane=document.querySelector('.ent[data-s="p3"] .ch'), sleep=ms=>new Promise(r=>setTimeout(r,ms))
		const g0=lane._g||lane.closest('.ent').dataset.g; src.value=160; src.dispatchEvent(new Event('input',{bubbles:true}))
		for(let n=0;n<80&&((lane._g||lane.closest('.ent').dataset.g)===g0||!lane._gradStack?.length);n++) await sleep(10)
		const inFlight=lane._gradStack?.at(-1), before=inFlight?+getComputedStyle(inFlight).opacity:0
		src.value=190; src.dispatchEvent(new Event('input',{bubbles:true}))
		for(let n=0;n<80&&(!lane._gradStack||lane._gradStack.at(-1)===inFlight);n++) await sleep(10)
		src.dispatchEvent(new Event('change',{bubbles:true})); await new Promise(r=>requestAnimationFrame(r))
		const stack=lane._gradStack||[], after=inFlight&&stack.includes(inFlight)?+getComputedStyle(inFlight).opacity:-1
		const result={layers:stack.length,preserved:stack.includes(inFlight),before,after,opaqueUnderlay:stack.slice(0,-1).some(el=>+getComputedStyle(el).opacity===1)}
		await sleep(500); result.remaining=lane._gradStack?.length||0; return result })
	assert.equal(interrupted.layers>=2,true,'an interrupted gradient transition retains its in-flight composite')
	assert.equal(interrupted.preserved&&interrupted.after>=interrupted.before,true,'the prior layer continues from its current opacity instead of resetting')
	assert.equal(interrupted.opaqueUnderlay,true,'an interrupted transition keeps an opaque color field underneath—never paper')
	assert.equal(interrupted.remaining,1,'covered transition layers are removed after the newest field lands')
	await motion.locator('.ent[data-s="oklch"] .nm').click(); await motion.waitForSelector('#pl3d'); await motion.waitForTimeout(1000)
	const solid=motion.locator('#pl3d'), ambientA=await solid.screenshot(); await motion.waitForTimeout(350); const ambientB=await solid.screenshot()
	assert.equal(ambientA.equals(ambientB),false,'3D solid starts in its subtle ambient rotation')
	const sr=await solid.boundingBox(); await motion.mouse.move(sr.x+sr.width*.45,sr.y+sr.height*.45); await motion.mouse.down(); await motion.mouse.move(sr.x+sr.width*.45+47,sr.y+sr.height*.45+18,{steps:3}); await motion.waitForTimeout(180); await motion.mouse.up(); await motion.waitForTimeout(180)
	const parkedA=await solid.screenshot(); await motion.waitForTimeout(350); const parkedB=await solid.screenshot()
	assert.equal(parkedA.equals(parkedB),true,'a no-inertia release parks the 3D view')
	await motion.mouse.move(sr.x+sr.width*.55,sr.y+sr.height*.5); await motion.mouse.down(); await motion.mouse.move(sr.x+sr.width*.55-45,sr.y+sr.height*.5,{steps:2}); await motion.mouse.up(); await motion.waitForTimeout(120)
	const flickA=await solid.screenshot(); await motion.waitForTimeout(350); const flickB=await solid.screenshot()
	assert.equal(flickA.equals(flickB),false,'a moving release keeps rotating in the chosen direction')
	await motion.evaluate(()=>{ const orig=createImageBitmap; window.__imageBitmapOrig=orig; let stall=true
		window.createImageBitmap=(source,...rest)=>{ if(stall&&source instanceof Blob){ stall=false; return new Promise(()=>{}) } return orig(source,...rest) } })
	await motion.locator('#cvfile').setInputFiles(resolve(SITE, 'img/wave.jpg'))
	await motion.waitForFunction(()=>document.body.classList.contains('himg')&&document.querySelector('#detail .pl canvas.density'))
	await motion.evaluate(()=>{ window.createImageBitmap=window.__imageBitmapOrig; delete window.__imageBitmapOrig })
	const firstPlane=motion.locator('#detail .pl').first(), pr=await firstPlane.boundingBox()
	await firstPlane.evaluate(pl=>{ const density=pl._density, dc=density.getContext('2d'), oldImage=dc.drawImage.bind(dc)
		const mesh=document.querySelector('#detail .mesh3'), gl=mesh.getContext('webgl2'), oldArrays=gl.drawArrays.bind(gl), oldElements=gl.drawElements.bind(gl)
		pl._dragTest={dc,oldImage,gl,oldArrays,oldElements,densityDraws:0,meshDraws:0}
		dc.drawImage=(...args)=>{ pl._dragTest.densityDraws++; return oldImage(...args) }
		gl.drawArrays=(...args)=>{ pl._dragTest.meshDraws++; return oldArrays(...args) }; gl.drawElements=(...args)=>{ pl._dragTest.meshDraws++; return oldElements(...args) } })
	await motion.mouse.move(pr.x+pr.width*.25,pr.y+pr.height*.6); await motion.mouse.down(); await motion.mouse.move(pr.x+pr.width*.38,pr.y+pr.height*.52,{steps:3}); await motion.waitForTimeout(100)
	await firstPlane.evaluate(pl=>{ const t=pl._dragTest, neighbour=[...document.querySelectorAll('#detail .pl')].find(p=>p!==pl).querySelector('canvas'); t.meshDraws=0; t.neighbour=neighbour; t.neighbourBefore=neighbour.toDataURL() })
	await motion.mouse.move(pr.x+pr.width*.72,pr.y+pr.height*.3,{steps:12}); await motion.waitForTimeout(100)
	const imageDrag=await firstPlane.evaluate(pl=>{ const t=pl._dragTest, result={densityDraws:t.densityDraws,meshDraws:t.meshDraws,neighbourLive:t.neighbour.toDataURL()!==t.neighbourBefore}
		t.dc.drawImage=t.oldImage; t.gl.drawArrays=t.oldArrays; t.gl.drawElements=t.oldElements; delete pl._dragTest; return result })
	await motion.mouse.up()
	assert.equal(imageDrag.neighbourLive,true,'the neighbouring plane field repaints while another plane is still held')
	assert.equal(imageDrag.densityDraws,0,'a cached plane histogram is not repainted during picking')
	assert.equal(imageDrag.meshDraws,0,'a static 3D image cloud is not replayed merely to move its picker')
	const planeFields=motion.locator('#detail .pl > canvas:first-child'), beforeImage=await planeFields.evaluateAll(cs=>cs.map(c=>c.toDataURL())), imageBox=await motion.locator('#imgpk').boundingBox()
	await motion.mouse.move(imageBox.x+imageBox.width*.12,imageBox.y+imageBox.height*.18); await motion.mouse.down(); await motion.mouse.move(imageBox.x+imageBox.width*.82,imageBox.y+imageBox.height*.76,{steps:12}); await motion.waitForTimeout(100)
	const imagePlanes=await planeFields.evaluateAll((cs,before)=>cs.filter((c,i)=>c.toDataURL()!==before[i]).length,beforeImage)
	await motion.mouse.up()
	assert.equal(imagePlanes,3,'all plane fields repaint while an image color is still held')
	// Exercise the transfer watchdog last: after one intentionally stranded host promise,
	// the app must retire this optional GPU-present path without starting another transfer.
	await motion.evaluate(()=>{ const orig=createImageBitmap; window.__bitmapFlight={active:0,max:0,orig,stall:true}; window.createImageBitmap=(...args)=>{ const s=window.__bitmapFlight; s.active++; s.max=Math.max(s.max,s.active)
		if(s.stall){ s.stall=false; return new Promise(()=>{}) }   // software-GL hosts can strand one snapshot forever
		try{ return orig(...args).finally(()=>s.active--) }catch(error){ s.active--; throw error } } })
	const memoryPlane=motion.locator('#detail .pl').first(), mr=await memoryPlane.boundingBox()
	await motion.mouse.move(mr.x+mr.width*.25,mr.y+mr.height*.55); await motion.mouse.down(); await motion.mouse.move(mr.x+mr.width*.7,mr.y+mr.height*.3,{steps:24}); await motion.mouse.up(); await motion.waitForTimeout(120)
	await motion.waitForFunction(()=>[...document.querySelectorAll('#detail canvas')].every(c=>!c._glPending&&!c._glQueued))
	const bitmapFlight=await motion.evaluate(()=>{ const s=window.__bitmapFlight; window.createImageBitmap=s.orig; delete window.__bitmapFlight; return {max:s.max,active:s.active,stall:s.stall} })
	assert.equal(bitmapFlight.max<=1&&bitmapFlight.active<=1&&(!bitmapFlight.stall||bitmapFlight.max===0),true,'a stalled host snapshot falls back without starting another shared-kernel transfer')
	await motionContext.close()

	// the creator LUT flow: the editor picks the file – a plain 3D cube at a size that app takes,
	// the shaper cube only under Resolve (and the library's generic path), the app's steps beneath.
	// Its own context: these loads skip ?sw, and on loopback that unregisters the offline shell
	// the check below pins
	const wireContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
	const wire = await wireContext.newPage()
	wire.on('pageerror', error => errors.push(`wire: ${error.message}`))
	await wire.goto(`${server.origin}/rec709?cb=${Date.now()}`, { waitUntil: 'networkidle' })
	await wire.waitForSelector('#modal:not([hidden]) #dex #dled')
	await wire.locator('#dex').scrollIntoViewIfNeeded()
	await wire.locator('#dlto').selectOption('rgb')   // a per-channel pair: the generic path's 1D curve, an editor's 3D lattice
	const lutOf = async (editor, size) => {
		if (editor != null) await wire.locator('#dled').selectOption({ value: editor })
		if (size != null) await wire.locator('#dlsz').selectOption({ value: size })
		const [dl] = await Promise.all([wire.waitForEvent('download'), wire.locator('#dldl').click()])
		return { name: dl.suggestedFilename(), text: readFileSync(await dl.path(), 'utf8'),
			sizes: await wire.locator('#dlsz option').evaluateAll(os => os.map(o => o.value)),
			how: await wire.locator('#dlhow').evaluate(el => el.hidden ? '' : el.innerText) } }
	const generic = await lutOf('', null)
	assert.equal(generic.name, 'rec709-to-rgb.cube', 'generic: a per-channel pair saves the library’s own 1D cube')
	assert.match(generic.text, /^LUT_1D_SIZE 4096$/m, 'generic: the 4096-point 1D curve')
	assert.equal(generic.how, '', 'generic: no app steps')
	const ff = await lutOf('ffmpeg', null)
	assert.equal(ff.name, 'rec709-to-rgb-33.cube', 'an editor turns the same pair into a 33³ file')
	assert.equal(/^LUT_3D_SIZE 33$/m.test(ff.text) && !/LUT_1D_SIZE/.test(ff.text), true, 'an editor always gets a plain 3D cube')
	assert.deepEqual(ff.sizes, ['33', '65'], 'ffmpeg offers 33 and 65, no shaper')
	assert.match(ff.how, /lut3d=file=rec709-to-rgb-33\.cube:interp=tetrahedral/, 'the ffmpeg step names the very file it saved')
	assert.deepEqual((await lutOf('lumafusion', null)).sizes, ['33'], 'LumaFusion (up to 64 points) gets 33 only')
	const r65 = await lutOf('davinci-resolve', '65')
	assert.equal(r65.name === 'rec709-to-rgb-65.cube' && /^LUT_3D_SIZE 65$/m.test(r65.text), true, 'Resolve takes the 65³ high-precision cube')
	assert.deepEqual(r65.sizes, ['33', '65', '33s', '65s'], 'Resolve alone among the editors adds the shaper cubes')
	assert.equal(await wire.locator('#dlsz optgroup').getAttribute('label'), 'DaVinci Resolve / OCIO only', 'the shaper option is labeled for its only readers')
	assert.match(r65.how, /Project Settings/, 'Resolve shows its own steps')
	const shaped = await lutOf(null, '33s')
	assert.equal(shaped.name, 'rec709-to-rgb-33-shaper.cube', 'the shaper cube says so in its name')
	assert.equal(/^LUT_1D_SIZE 1024$/m.test(shaped.text) && /^LUT_3D_SIZE 33$/m.test(shaped.text), true, 'shaper cube: 1D shaper + 3D lattice in one file')
	await wire.locator('#dled').selectOption('capcut-mobile')
	assert.equal(await wire.locator('#dldl').isDisabled(), true, 'CapCut mobile takes no .cube – no download, the steps send it to desktop')
	// Python + embed tabs: the verified snippet (preamble once), the iframe for this very space
	await wire.goto(`${server.origin}/oklch?cb=${Date.now()}`, { waitUntil: 'networkidle' })
	await wire.locator('#cseg [data-t="py"]').click()
	const py = await wire.locator('#snip').innerText()
	assert.equal(py.split('import numpy as np, colour').length - 1, 1, 'Python tab: the colour-science preamble, once')
	assert.match(py, /v = colour\.Oklab_to_Oklch\(colour\.XYZ_to_Oklab\(XYZ\)\)/, 'Python tab: the verified oklch expression')
	assert.match(py, /# verified against color-space – colour-science /, 'Python tab: says what it was verified with')
	await wire.locator('#cseg [data-t="embed"]').click()
	assert.match(await wire.locator('#snip').innerText(), /^<iframe src="https:\/\/color-space\.io\/oklch\?embed"\s+title="OKLCH color space – color-space\.io"\s+width="\d+" height="\d+" style="[^"]+" loading="lazy"><\/iframe>$/, 'embed tab: the iframe for this space')
	await wire.evaluate(() => { location.hash = 'hsluv' })   // the data module is in – a space without a verified entry gets no tab
	await wire.waitForFunction(() => /hsluv/i.test(document.getElementById('dtitle')?.textContent || ''))
	await wire.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
	assert.equal(await wire.locator('#cseg [data-t="py"]').count(), 0, 'no Python tab where no verified equivalent exists')
	// the vision lens: one root filter, defs mounted once, cited models
	await wire.goto(`${server.origin}/?cb=${Date.now()}`, { waitUntil: 'networkidle' })
	assert.match(await wire.locator('#vseg').getAttribute('title'), /doi:10\.1109\/TVCG\.2009\.113[\s\S]*doi:10\.1364\/JOSAA\.14\.002647/, 'the vision tooltip cites Machado 2009 and Brettel 1997')
	await wire.locator('#vseg').selectOption('deutan')
	assert.equal(await wire.evaluate(() => document.documentElement.dataset.cvd), 'deutan', 'vision lens sets data-cvd on the root')
	assert.equal(await wire.locator('filter#cvd-deutan[color-interpolation-filters="linearRGB"]').count(), 1, 'the deutan filter is mounted, in linear light')
	assert.match(await wire.evaluate(() => getComputedStyle(document.documentElement).filter), /url\(.*#cvd-deutan/, 'the root wears the filter')
	await wire.locator('#vseg').selectOption('tritan'); await wire.locator('#vseg').selectOption('none')
	assert.deepEqual(await wire.evaluate(() => [document.documentElement.dataset.cvd, document.querySelectorAll('filter#cvd-tritan').length]), [undefined, 1], 'typical vision clears the lens; the defs mounted once')
	// Cite: BibTeX + APA from CITATION.cff, the version package.json's
	await wire.locator('.legal .cite').click()
	await wire.waitForSelector('#citep:popover-open')
	const cite = await wire.locator('#citep').innerText(), { version } = JSON.parse(readFileSync(resolve('package.json'), 'utf8'))
	assert.equal(cite.includes('title = {{color-space}}') && cite.includes(`version = {${version}}`), true, 'Cite: BibTeX carries the title and the package version')
	assert.match(cite, new RegExp(`Ivanov, D\\. \\(\\d{4}\\)\\. color-space \\(Version ${version.replace(/\./g, '\\.')}\\) \\[Computer software\\]\\. https://github\\.com/colorjs/color-space`), 'Cite: APA in GitHub’s CITATION.cff form')
	await wire.keyboard.press('Escape')
	assert.equal(await wire.locator('#citep:popover-open').count(), 0, 'Esc closes the Cite popover')
	await wire.close()
	// embed: /<name>?embed is the card alone – no chrome, no close, no route leaving the frame
	const embed = await wireContext.newPage()
	embed.on('pageerror', error => errors.push(`embed: ${error.message}`))
	await embed.goto(`${server.origin}/oklch?embed&cb=${Date.now()}`, { waitUntil: 'networkidle' })
	await embed.waitForSelector('#modal:not([hidden]) #dtitle')
	assert.deepEqual(await embed.evaluate(() => ['.mast', '#cat', '#faq', '#ftr', '#mx', '.mnavbar', '#upfl'].filter(q => { const el = document.querySelector(q); return el && el.getClientRects().length })), [], 'embed hides header, catalog, FAQ, footer, close, prev/next and the image seat')
	assert.equal(await embed.locator('#cat .ent').count(), 0, 'embed never builds the catalog')
	assert.match(await embed.locator('link[rel="canonical"]').getAttribute('href'), /\/oklch$/, 'embed keeps the clean canonical')
	const mb = await embed.locator('.mbox').boundingBox(), vw = await embed.evaluate(() => document.documentElement.clientWidth)
	assert.equal(Math.abs(mb.width - vw) <= 20 && mb.x <= 1, true, 'the card fills the frame')
	const embl = embed.locator('#embl'), emblHref = await embl.getAttribute('href')
	assert.equal(await embl.isVisible() && await embl.getAttribute('target') === '_blank' && /\/oklch(#|$)/.test(emblHref) && !/embed/.test(emblHref), true, 'one link out: the full page, new tab')
	await embed.keyboard.press('Escape')
	assert.equal(await embed.locator('#modal').isVisible(), true, 'Esc does not close an embedded card')
	const hist = await embed.evaluate(() => history.length)
	const famLink = embed.locator('#detail .fam a[href^="#"]').first(), famTo = (await famLink.getAttribute('href')).slice(1)
	const [tab] = await Promise.all([wireContext.waitForEvent('page'), famLink.click()])
	assert.equal(new URL(embed.url()).pathname === '/oklch' && await embed.evaluate(() => history.length) === hist, true, 'an in-card space link opens a new tab – the frame and its history stay put')
	await tab.waitForURL((u) => u.protocol.startsWith('http'))
	assert.equal(new URL(tab.url()).pathname, `/${famTo}`, 'the new tab is that space’s full page (no ?embed)')
	// no keyboard trap (WCAG 2.1.2): Tab off either end of the card is left to the host page
	assert.deepEqual(await embed.evaluate(() => {
		const els = [...document.querySelector('#modal').querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),[tabindex="0"]')].filter(el => el.offsetParent !== null)   // the dossier's own focus-trap set
		return [[els.at(-1), false], [els[0], true]].map(([el, shiftKey]) => { el.focus(); const ev = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true }); el.dispatchEvent(ev); return ev.defaultPrevented })
	}), [false, false], 'embed: Tab and Shift+Tab off the card’s ends are not wrapped back in')
	await wireContext.close()

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

	// Exercise the staged renderer directly, with a fresh module instance and no
	// page animation. Read pixels in the draw task (WebGL clears between frames).
	const gpu = await context.newPage()
	gpu.on('pageerror', error => errors.push(error.message))
	await gpu.goto(`${server.origin}/robots.txt?cb=${Date.now()}`)
	const rendering = await gpu.evaluate(async () => {
		const { paintBarGL, paintPlaneGL, mesh3Canvas, drawMesh3GL } = await import('/js/gl.js')
		const { quantRGB } = await import('/js/study-render.js')
		const check = (ok, message) => { if (!ok) throw new Error(message) }
		const ready = async draw => { const end = performance.now() + 20000
			while (!draw()) { check(performance.now() < end, 'renderer did not become ready'); await new Promise(r => requestAnimationFrame(r)) } }
		const pixel = Object.assign(document.createElement('canvas'), { width: 1, height: 1 })
		const samples = [
			[[0,0,0], '565'], [[255,255,255], '565'], [[4.49,2.49,4.49], '565'], [[4.5,2.5,4.5], '565'],
			[[25.49,127.49,229.49], 'web'], [[25.5,127.5,229.5], 'web'],
			[[0,0,0], 'jnd'], [[127.49,127.49,127.49], 'jnd'], [[255,255,255], 'jnd'],
			[[245.49,105.49,22.49], 'pico8'], [[255,0,0], 'names'], [[255,0,0], 'pico8'], [[255,0,0], 'names'],
		]
		for (const [rgb, mode] of samples) {
			const expected = quantRGB(rgb, mode), rx = [rgb[0],rgb[0]], ry = [rgb[1],rgb[1]]
			for (const draw of [
				() => paintBarGL(pixel, 'rgb', rgb, 0, rx, 'off', mode),
				() => paintPlaneGL(pixel, 'rgb', rgb, 0, 1, rx, ry, 'off', mode),
			]) {
				await ready(draw); draw()
				const got = pixel.getContext('2d').getImageData(0,0,1,1).data
				check(got[3] === 255 && expected.every((v,i) => Math.abs(v-got[i]) <= (mode === 'jnd' ? 1 : 0)), `${mode} ${rgb}: GPU ${[...got]} differs from CPU ${expected}`)
			}
		}
		const cv = mesh3Canvas(); cv.width = cv.height = 256
		const gl = cv.getContext('webgl2'), rot = { a: -.6, b: .42 }
		const maps = { rgb: { min:[0,0,0], max:[255,255,255], ti:0 }, oklab: { min:[0,-.4,-.4], max:[1,.4,.4], ti:0, bip:[1,2] } }
		const draw = (s, grid) => drawMesh3GL(cv, s, { ...maps[s], grid }, rot, 1.2)
		const capture = (s, grid) => { check(draw(s,grid), `${s}: warmed renderer failed`)
			const out = new Uint8Array(cv.width*cv.height*4); gl.readPixels(0,0,cv.width,cv.height,gl.RGBA,gl.UNSIGNED_BYTE,out); return out }
		const equal = (a,b) => a.every((v,i) => v === b[i])
		let first, changed = 0
		for (const s of ['rgb','oklab','rgb']) {
			await ready(() => draw(s))
			const off = capture(s), repeat = capture(s), on = capture(s,true), reset = capture(s), explicit = capture(s,false)
			check(equal(off,repeat), `${s}: repeated draw changed pixels`)
			check(equal(off,reset) && equal(off,explicit), `${s}: contour uniform leaked into default/off draw`)
			if (s === 'rgb') { if (first) check(equal(first,off), 'RGB → OKLab → RGB changed the original surface'); else first = off }
			let visible = 0, darkened = 0, untouched = 0
			for (let i = 0; i < off.length; i += 4) {
				check(off[i+3] === on[i+3], `${s}: contours changed surface coverage`)
				check(on[i] <= off[i] && on[i+1] <= off[i+1] && on[i+2] <= off[i+2], `${s}: contours lightened a pixel`)
				if (!off[i+3]) continue
				visible++
				if (on[i] < off[i] || on[i+1] < off[i+1] || on[i+2] < off[i+2]) darkened++; else untouched++
			}
			check(visible > 1000 && darkened > 100 && untouched > visible*.2, `${s}: contours missing or covering whole faces (${visible}/${darkened}/${untouched})`)
			changed += darkened
		}
		return { samples: samples.length*2, changed }
	})
	assert.equal(rendering.samples, 26, 'one-pixel bar and plane quantization agree with the CPU at byte boundaries')
	assert.ok(rendering.changed > 0, 'contours preserve coverage and reset across RGB → OKLab → RGB on one canvas')
	await gpu.close()

	if (errors.length) throw new Error(errors.join('\n'))
	console.log('browser: search, coverage filter, CSS parsing, tabs, persisted theme, modal lifecycle, direct route, mobile keyboard, social image, offline shell, quantization boundaries and contour reuse pass')
} finally {
	await context.close()
	await browser.close()
	await server.close()
}
