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
	assert.equal(await page.locator('#stripgl').count(), 0, 'catalog has no page-sized canvas on its scroll/input path')
	const initialGradient=await page.locator('.ent[data-s="oklch"] .ch').first().evaluate(el => el.style.background.includes('linear-gradient')?el.style.background:el._gradStack?.at(-1)?.style.background||'')
	assert.match(initialGradient, /linear-gradient/, 'catalog strips use CSS gradients')
	assert.match(initialGradient, /rgb\([^)]*\.\d+/, 'gradient guides retain sub-byte color precision')
	assert.doesNotMatch(initialGradient, /\d(?:\.\d+)?%\s+\d(?:\.\d+)?%/, 'smooth mode has interpolated stops, not hard sampled bands')
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
		const neighbor=document.querySelector('.ent[data-s="rgb"] .ch[data-i="1"]'), currentVal=document.querySelector('.ent[data-s="rgb"] .cv[data-i="0"]'), otherLane=document.querySelector('.ent[data-s="p3"] .ch'), otherVal=document.querySelector('.ent[data-s="p3"] .cv'), otherRange=document.querySelector('.ent[data-s="p3"] .nrg')
		const frame=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))), set=v=>{ src.value=v; src.dispatchEvent(new Event('input',{bubbles:true})) }, pause=ms=>new Promise(r=>setTimeout(r,ms))
		src.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:17,isPrimary:true}))
		const g0=otherLane._g||otherLane.closest('.ent').dataset.g; set(160); await frame()
		for(let n=0;n<50&&(otherLane._g||otherLane.closest('.ent').dataset.g)===g0;n++) await pause(10)
		const mid={gradient:neighbor.style.background,value:otherVal.value,thumb:otherRange.value,otherGradient:otherLane._g}
		set(190); await frame(); const immediate={gradient:neighbor.style.background,currentValue:currentVal.value,thumb:otherRange.value,otherGradient:otherLane._g}
		const vd=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value'), writes=[]
		Object.defineProperty(otherVal,'value',{configurable:true,get(){return vd.get.call(this)},set(v){writes.push(performance.now());vd.set.call(this,v)}})
		const st=performance.now(); await new Promise(done=>{ let k=0; const tick=t=>{ set(190+(k++%45)); t-st<240?requestAnimationFrame(tick):done() }; requestAnimationFrame(tick) })
		delete otherVal.value; const throttled={writes:writes.length,value:otherVal.value}; await pause(180); const settled={otherGradient:otherLane._g}
		set(245); const beforeRelease=otherVal.value
		src.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:17,isPrimary:true})); src.dispatchEvent(new Event('change',{bubbles:true})); const released={value:otherVal.value}; return {mid,immediate,throttled,settled,beforeRelease,released} })
	assert.notEqual(liveTier.immediate.gradient,liveTier.mid.gradient,'current-space neighboring gradients update live')
	assert.equal(+liveTier.immediate.currentValue,190,'the actively dragged row keeps its numeric value live')
	assert.equal(liveTier.throttled.writes>0&&liveTier.throttled.writes<=4,true,'other-space numeric writes stay bounded to the 100ms tier during a drag burst')
	assert.notEqual(liveTier.throttled.value,liveTier.mid.value,'other-space numeric inputs catch up during the 100ms tier')
	assert.notEqual(liveTier.released.value,liveTier.beforeRelease,'release always flushes the final throttled numeric values')
	assert.notEqual(liveTier.immediate.thumb,liveTier.mid.thumb,'other-space slider pickers update live')
	assert.equal(liveTier.immediate.otherGradient,liveTier.mid.otherGradient,'other-space gradients remain on the throttled tier')
	assert.notEqual(liveTier.settled.otherGradient,liveTier.immediate.otherGradient,'other-space gradients catch up on the 300ms tier')

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
	const mode=async value=>{ await page.evaluate(v=>{ const q=document.getElementById('qseg'); q.value=v; q.dispatchEvent(new Event('change',{bubbles:true})) },value)   // the view select lives in the (closed) filter panel now — drive it by value, not by visibility
		await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))) }
	const sliderBoundaryParity=async s=>page.evaluate(s=>[...document.querySelector(`.ent[data-s="${s}"]`).querySelectorAll('.ch')].every((ch,i)=>{ const bg=ch._gradStack?.at(-1)?.style.background||ch.style.background||'', p=[...bg.matchAll(/([\d.]+)%/g)].map(m=>+m[1]), css=p.filter((x,k)=>k&&Math.abs(x-p[k-1])<1e-6)
		const c=document.querySelector(`.bar2[data-i="${i}"] .bgc`), d=c.getContext('2d').getImageData(0,0,c.width,c.height).data, gpu=[]; let a=d[3]>=20
		for(let x=1;x<c.width;x++){ const next=d[x*4+3]>=20; if(next!==a){ gpu.push(x/c.width*100); a=next } }
		return css.length===gpu.length&&css.every((x,k)=>Math.abs(x-gpu[k])<.6) }),s)
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
	const backBefore=await backLane.evaluate(el=>el._g||el.closest('.ent').dataset.g)
	const smoothL=page.locator('.bar2[data-i="0"]'), smoothLR=await smoothL.boundingBox()
	await page.mouse.move(smoothLR.x+smoothLR.width*.36,smoothLR.y+smoothLR.height/2); await page.mouse.down()
	for(let n=0;n<50&&await backLane.evaluate((el,g)=>(el._g||el.closest('.ent').dataset.g)===g,backBefore);n++) await page.waitForTimeout(10)
	const backMid={picker:await backPicker.inputValue(),value:await backValue.inputValue(),gradient:await backLane.evaluate(el=>el._g||el.closest('.ent').dataset.g)}, smoothMid=await smoothNeighbor.evaluate(el=>el.toDataURL())
	await page.mouse.move(smoothLR.x+smoothLR.width*.46,smoothLR.y+smoothLR.height/2)
	for(let n=0;n<30&&await smoothNeighbor.evaluate((el,before)=>el.toDataURL()===before,smoothMid||smoothBefore);n++) await page.waitForTimeout(10)
	assert.equal(await page.locator('#bigch .nv').first().inputValue(),'0.46','dossier numeric input follows a smooth drag live')
	assert.notEqual(await smoothNeighbor.evaluate(el=>el.toDataURL()),smoothMid||smoothBefore,'dossier neighboring gradients follow the active space live')
	assert.notEqual(await page.locator('#tcap').innerText(),transferBefore,'transfer picker follows a held drag')
	assert.notEqual(await backPicker.inputValue(),backMid.picker,'dossier drag moves background catalog picker positions live')
	await page.waitForTimeout(110)
	assert.notEqual(await backValue.inputValue(),backMid.value,'dossier drag updates background catalog numbers on the 100ms tier')
	await page.waitForTimeout(230)
	assert.notEqual(await backLane.evaluate(el=>el._g||el.closest('.ent').dataset.g),backMid.gradient,'dossier drag catches other catalog gradients up on the throttle')
	await page.mouse.up()
	await mode('web')
	const safeHex=await page.locator('#cd').inputValue(), safeRgb=[1,3,5].map(i=>parseInt(safeHex.slice(i,i+2),16))
	assert.equal(safeRgb.every(v=>v%51===0),true,'safe mode lands on the 216-color web-safe lattice')
	await mode('10')
	const lbar=page.locator('.bar2[data-i="0"]'), lr=await lbar.boundingBox()
	await page.mouse.move(lr.x+lr.width*.27,lr.y+lr.height/2); await page.mouse.down(); await page.waitForTimeout(30)
	assert.equal(await page.locator('#bigch .nv').first().inputValue(),'0.27','quantized slider moves continuously while held')
	await page.mouse.up(); await page.waitForTimeout(260)   // the release PARKS: a 180ms glide into the cell, so the read waits it out
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
	for(const [i,v] of [[0,'0.30'],[1,'0.143'],[2,'263']]) await page.locator('#bigch .nv').nth(i).fill(v)
	const cbar=page.locator('.bar2[data-i="1"]'), cr=await cbar.boundingBox()
	await page.mouse.move(cr.x+cr.width*(.143/.4),cr.y+cr.height/2); await page.mouse.down(); await page.mouse.move(cr.x+cr.width*(.143/.4)+2,cr.y+cr.height/2)
	await page.waitForFunction(()=>{ const el=document.querySelector('.ent[data-s="oklch"] .ch[data-i="0"]'), bg=el._gradStack?.at(-1)?.style.background||el.style.background||''; return /(?:\/ 0\)|,\s*0\))/.test(bg) }); await page.waitForTimeout(700)
	const validityEdges=await page.evaluate(()=>{ const main=document.querySelector('.ent[data-s="oklch"] .ch[data-i="0"]'), dossier=document.querySelector('.bar2[data-i="0"] .bgc')
		const mbg=main._gradStack?.at(-1)?.style.background||main.style.background||''
		const hard=s=>{ const p=[...s.matchAll(/([\d.]+)%/g)].map(m=>+m[1]); return p.filter((x,i)=>i&&Math.abs(x-p[i-1])<1e-6) }
		const d=dossier.getContext('2d').getImageData(0,0,dossier.width,dossier.height).data; let last=-1
		for(let x=0;x<dossier.width;x++) if(d[x*4+3]>=20) last=x
		return {main:hard(mbg),dossier:last<0?[]:[(last+1)/dossier.width*100],mainVoid:/(?:\/ 0\)|,\s*0\))/.test(mbg),mainGhost:/(?:\/ 0\.5\)|,\s*0\.5\))/.test(mbg),dossierVoid:last>=0&&last<dossier.width-1} })
	assert.equal(validityEdges.mainVoid&&validityEdges.dossierVoid&&!validityEdges.mainGhost,true,'main and dossier preserve the transparent validity limit without dossier-only half-transparent gamut ghosting')
	await page.mouse.up(); await page.waitForTimeout(700)
	const settledEdges=await page.evaluate(()=>{ const main=document.querySelector('.ent[data-s="oklch"] .ch[data-i="0"]'), c=document.querySelector('.bar2[data-i="0"] .bgc'), bg=main._gradStack?.at(-1)?.style.background||main.style.background||''
		const p=[...bg.matchAll(/([\d.]+)%/g)].map(m=>+m[1]), hard=p.filter((x,i)=>i&&Math.abs(x-p[i-1])<1e-6), d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; let last=-1
		for(let x=0;x<c.width;x++)if(d[x*4+3]>=20)last=x; return {main:hard.at(-1),dossier:(last+1)/c.width*100} })
	assert.equal(isFinite(settledEdges.main)&&Math.abs(settledEdges.main-settledEdges.dossier)/100<.03,true,'main and dossier sliders settle to the same validity boundary')
	// the exporters ride the plates rail: label + target select + download buttons
	assert.match(await page.locator('#dex').innerText(), /conversion lut/i, 'LUT block rides the dossier rail')
	assert.equal(await page.locator('#dex #dldl').count() + await page.locator('#dex #didl').count(), 2, 'cube + icc downloads present')
	await page.keyboard.press('Escape')
	await page.waitForFunction(() => document.querySelector('#modal')?.hidden === true)
	assert.equal(await trigger.evaluate(el => document.activeElement === el), true, 'dossier restores focus')

	// Palette coordinates may exceed a space's declared instrument range. RGB remains
	// authoritative across mode changes: HPLuv used to retain S=196 after even→smooth,
	// punching transparent holes into its H×L plane.
	await page.locator('.ent[data-s="hpluv"] .nm').click(); await page.waitForSelector('#modal:not([hidden]) #gseg')
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
	await motion.locator('#cval').fill('#123456'); await motion.waitForTimeout(450)
	assert.equal(await motion.locator('#cd').inputValue(),'#123456','authored color input stops the ambient orbit')
	await motion.locator('.ent:not(.lite)').last().scrollIntoViewIfNeeded(); await motion.waitForTimeout(180)
	const bottomPickers=await motion.evaluate(()=>{ const rows=[...document.querySelectorAll('.ent:not(.lite)')].filter(e=>{ const r=e.getBoundingClientRect(); return r.bottom>0&&r.top<innerHeight&&e.querySelector('.nrg') })
		const ranges=rows.flatMap(e=>[...e.querySelectorAll('.nrg')]), positioned=rows.every(e=>{ const cvs=e.querySelectorAll('.cv'), rs=e.querySelectorAll('.nrg'); return [...rs].every((r,i)=>Math.abs(+r.value-+cvs[i].value)<=(+r.max-+r.min)*.006+1e-9) })
		return {n:ranges.length,colored:ranges.every(r=>getComputedStyle(r).getPropertyValue('--tkc').trim().toUpperCase()==='#123456'),positioned} })
	assert.equal(bottomPickers.n>0&&bottomPickers.colored,true,'offscreen catalog pickers inherit the current color when scrolled into view')
	assert.equal(bottomPickers.positioned,true,'newly visible catalog picker positions catch up to the current color')
	await motion.evaluate(()=>scrollTo(0,0)); await motion.waitForTimeout(180)
	const interrupted=await motion.evaluate(async()=>{ const src=document.querySelector('.ent[data-s="rgb"] .nrg'), lane=document.querySelector('.ent[data-s="p3"] .ch'), sleep=ms=>new Promise(r=>setTimeout(r,ms))
		const g0=lane._g||lane.closest('.ent').dataset.g; src.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:29,isPrimary:true})); src.value=160; src.dispatchEvent(new Event('input',{bubbles:true}))
		for(let n=0;n<80&&((lane._g||lane.closest('.ent').dataset.g)===g0||!lane._gradStack?.length);n++) await sleep(10)
		const inFlight=lane._gradStack?.at(-1), before=inFlight?+getComputedStyle(inFlight).opacity:0
		src.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:29,isPrimary:true})); src.dispatchEvent(new Event('change',{bubbles:true})); await new Promise(r=>requestAnimationFrame(r))
		const stack=lane._gradStack||[], after=inFlight&&stack.includes(inFlight)?+getComputedStyle(inFlight).opacity:-1
		const result={layers:stack.length,preserved:stack.includes(inFlight),before,after,opaqueUnderlay:stack.slice(0,-1).some(el=>+getComputedStyle(el).opacity===1)}
		await sleep(500); result.remaining=lane._gradStack?.length||0; return result })
	assert.equal(interrupted.layers>=3,true,'an interrupted gradient transition retains its in-flight composite')
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
	await motion.locator('#cvfile').setInputFiles(resolve('_site/img/wave.jpg'))
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
