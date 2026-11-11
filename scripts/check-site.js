import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
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

// every name view's prerendered dossier is ITS OWN space's – the document crawlers read, in every
// stamped language. The bake once clicked rows the app wires only at idle: the click was a no-op,
// and the previous space's dossier went into 132 of 168 pages. A page shipped unbaked is skipped
{	const { SPACES } = await import('../web/js/render.js')
	const langs = existsSync(resolve(SITE, 'i18n')) ? readdirSync(resolve(SITE, 'i18n')).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5) + '/') : []
	const wrong = ['', ...langs].flatMap(pre => SPACES.map(s => pre + s).filter(p => { const f = resolve(SITE, p + '.html')
		if (!existsSync(f)) return false
		const h = readFileSync(f, 'utf8'), i = h.indexOf('<div class="detail" id="detail" tabindex="-1">')
		return i >= 0 && !h.startsWith('</div>', i + 46) && !h.includes(`/spaces/${p.split('/').at(-1)}.js"`, i) }))
	assert.deepEqual(wrong, [], 'every baked name view carries its own space\'s dossier')
}
// Usage's facts are the build's, the same in every stamped language: a translation keeps the span, never its number
{	const facts = (f) => Object.fromEntries([...readFileSync(f, 'utf8').matchAll(/<span data-fact="(\w+)">([^<]*)<\/span>/g)].map((m) => [m[1], m[2]]))
	const { spaces: WASM } = await import('../wasm/spaces.js'), en = facts(resolve(SITE, 'index.html'))
	const langs = existsSync(resolve(SITE, 'i18n')) ? readdirSync(resolve(SITE, 'i18n')).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5) + '/') : []
	assert.equal(en.wal, WASM.join(', '), 'Usage lists the spaces the WASM kernel carries')
	assert.equal(+en.wan, WASM.length, '…and counts them')
	assert.ok(+en.jskb > 0 && +en.wakb > 0, 'the weights, in kB')
	for (const pre of langs) assert.deepEqual(facts(resolve(SITE, pre + 'index.html')), en, `${pre}: the facts the English shows`)
}

// a name view's hero is the atlas's own: the space's name is its dossier's title, there while the dossier is
{	const hero = (f) => readFileSync(resolve(SITE, f), 'utf8').match(/<h1 class="hh" id="hero-t"[^>]*>[\s\S]*?<\/h1>/)?.[0]
	assert.equal(hero('oklch.html'), hero('index.html'), 'a name view keeps the atlas\'s title over its dossier')
}

// a menu's option, picked through the page's own handler: a lens ('q' draw, 'm' distance, 'g' limit, 'v' vision) or,
// with 'f', a facet value
// a menu's setting taken as a hand would: a switch's option pressed (a facet's again lets it go), a select's value set
const lens = (pg, k, v) => pg.evaluate(([k, v]) => { const b = document.querySelector(k === 'f' ? `.dpop .mseg[data-f] button[data-v="${CSS.escape(v)}"]` : `.dpop .mseg[data-lens="${k}"] button[data-v="${CSS.escape(v)}"]`)
	if (b) return b.click()
	const sel = document.querySelector(`.dpop select[data-lens="${k}"]`); sel.value = v; sel.dispatchEvent(new Event('change', { bubbles: true })) }, [k, v])
// the catalog's layout switch, in the pinned row – it offers the next view: grid → rows → list → grid
const layout = (pg, v) => pg.locator(`#c-layout[data-view="${v}"]`).click()
// the row's own value field shows once the hero's field has passed under the row – bring the catalog up to type in it
const toCatalog = (pg) => pg.evaluate(async () => { const y = document.getElementById('cat').getBoundingClientRect().top + scrollY - document.getElementById('strip').offsetHeight; if (scrollY < y) scrollTo(0, y)
	await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))) })   // the scroll timeline moves the row's cells on the frames after the scroll
const server = await serve(SITE)
const browser = await chromium.launch({ headless: true, executablePath })
// headless Chrome rasterizes on SwiftShader, where the page paints its JS paths (gl.js softGL): every check but the one
// below drives the GPU kernels a visitor with a GPU gets (CS_GL), the software path checked on its own
const softContext = browser.newContext.bind(browser)
browser.newContext = async (o) => { const c = await softContext(o); await c.addInitScript(() => { globalThis.CS_GL = 'gpu' }); return c }
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
const errors = []
try {
	const page = await context.newPage()
	page.on('pageerror', error => errors.push(error.message))
	// the catalog the prerender painted is the one the page wires: none of #cat's own children leaves it at boot
	await page.addInitScript(() => { globalThis.__catGone = 0; new MutationObserver(ms => { for (const m of ms) if (m.target.id === 'cat') globalThis.__catGone += m.removedNodes.length }).observe(document, { childList: true, subtree: true }) })
	await page.goto(`${server.origin}/?sw&cb=${Date.now()}`, { waitUntil: 'networkidle' })   // ?sw: loopback skips the service worker for dev-freshness — the offline pin below needs it registered
	await page.waitForSelector('.ent[data-s="oklch"] .nm')
	assert.equal(await page.locator('.ent').count(), 221, 'catalog has all spaces')
	assert.equal(await page.evaluate(() => globalThis.__catGone), 0, 'the prerendered catalog is hydrated, not rebuilt: a rebuild at every load froze the page a third of a second (render.js preHTML)')
	assert.equal(await page.locator('#stripgl').count(), 0, 'catalog has no page-sized canvas on its scroll/input path')
	// the row's color rests in the hero's field – its rhombus on the field's middle – and, sticky, pins in the row
	const dockAt=()=>page.evaluate(()=>{ const c=document.querySelector('.cx .cdw').getBoundingClientRect(), f=document.getElementById('hq').getBoundingClientRect(), r=document.getElementById('strip').getBoundingClientRect()
		return { onField:Math.abs(c.top+c.height/2-(f.top+f.height/2))<2&&c.left>=f.left, inRow:c.top>=r.top&&c.bottom<=r.bottom } })
	assert.equal((await dockAt()).onField, true, 'over the hero the color rests in the field')
	// the row: full-bleed, its edge the window's width, paper under it always – fading out past its foot, the hero included
	const bar=()=>page.evaluate(()=>{ const m=document.querySelector('.mhead'), e=getComputedStyle(m.querySelector('.medge')), p=getComputedStyle(m,'::after'); return [Math.round(m.getBoundingClientRect().width)===document.documentElement.clientWidth||Math.round(m.getBoundingClientRect().width)===innerWidth, parseFloat(e.height)>0, 1-parseFloat(p.backgroundPositionY)/100] })   // the paper's share slid in from the row's top: 0 clear, 1 whole
	assert.deepEqual(await bar(), [true,true,0], 'over the hero: the row spans the window, its edge drawn, clear')
	await page.evaluate(async()=>{ scrollTo(0,document.getElementById('hq').getBoundingClientRect().top+scrollY-120); await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))) })
	assert.equal((await dockAt()).onField, true, 'scrolled, it rides with the field')
	await page.evaluate(async()=>{ scrollTo(0,document.getElementById('cat').getBoundingClientRect().top+scrollY); await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))) })
	assert.equal((await dockAt()).inRow, true, 'past the field it rests in the row')
	await page.waitForTimeout(400)   // the stuck state is read after the scroll, and the paper eases in
	assert.deepEqual(await bar(), [true,true,1], 'docked: paper and its hairline')
	await page.evaluate(()=>scrollTo(0,0))
	// the hero's locus: only the horseshoe answers the pointer (its box's empty corner shows nothing); pointing inside shows
	// the Limits' edges, the tightest under the pointer strongest, and changes nothing; a click picks that Limit – stored,
	// filled – as the row's menu would
	// the footer wall: one hue wheel in four rows, stepped, the current color the middle step of each; the top edge is that
	// color alone – its preview, no wheel
	assert.deepEqual(await page.evaluate(()=>{ const w=document.getElementById('ftr').style.getPropertyValue('--wall'), rows=w.split(/,(?=linear-gradient)/)
		const stops=r=>r.slice(16,-1).split(/,(?![^(]*\))/).slice(1)
		return [rows.length, rows.map(r=>stops(r).every(x=>(x.match(/[\d.]+%/g)||[]).length===2)), rows.map(r=>{ const st=stops(r); return st[(st.length-1)/2].startsWith('var(--cur)') }), document.getElementById('strip').style.getPropertyValue('--hues')] }), [4,[true,true,true,true],[true,true,true,true],''], 'the footer wall: one stepped wheel, the current color centered; the top edge the color alone')
	// the hero's locus: pointed at, its Limits' edges and names, all alike; a press is the site's home – the Limit is the row's menu's
	{ const box=await page.locator('.hlocus').boundingBox()
	  assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('.hlocus text')].map(t=>t.textContent)),['sRGB','P3','Rec. 2020','Surface','Light','A','D50','D65'],'the outlines named – the displays, Surface and the horseshoe, Light, the Planckian locus by the whites on it – no wavelengths')
	  assert.deepEqual(await page.evaluate(()=>{ const a=document.querySelector('.hlocus'); return [a.tagName,a.getAttribute('href')] }),['A','./'],'the locus is the link home')
	  const xy=(x,y)=>page.evaluate(([x,y])=>{ const svg=document.querySelector('.hlocus svg'), q=new DOMPoint((x+0.107)/0.857*320,(1-(y+0.055)/0.955)*352).matrixTransform(svg.getScreenCTM()); return [q.x,q.y] },[x,y])
	  const st=()=>page.evaluate(()=>({ edges:getComputedStyle(document.querySelector('.hlocus .lims')).opacity, on:[...document.querySelectorAll('.hlocus .lims path.on')].map(e=>e.dataset.g).join(), gm:localStorage.csGm||'', fill:document.querySelector('#hl-lim path').getAttribute('d') }))
	  await page.mouse.move(box.x+box.width-4,box.y+6); await page.waitForTimeout(300)
	  assert.equal((await st()).edges,'0','the locus box outside the horseshoe shows no edges')
	  const before=await st(), [sx,sy]=await xy(.31,.33); await page.mouse.move(sx,sy); await page.waitForTimeout(300)
	  const over=await st(); assert.deepEqual([over.edges,over.on,over.gm,over.fill===before.fill],['1','',before.gm,true],'pointing shows the edges, all alike – and picks nothing')
	  await page.mouse.move(2,2); await page.waitForTimeout(300)
	  assert.equal((await st()).edges,'0','let go, the plain locus')
	  await lens(page,'g','srgb'); await page.waitForTimeout(200)
	  assert.equal(await page.evaluate(()=>document.querySelector('#hl-lim path').getAttribute('d')===document.querySelector('.hlocus .lims path[data-g="srgb"]').getAttribute('d')),true,'the Limit picked in the row\'s menu fills its own region in the locus')
	  await lens(page,'g','vis'); await page.waitForTimeout(200)
	  assert.equal(await page.evaluate(()=>document.querySelector('#hl-lim path').getAttribute('d')===document.querySelector('.hlocus .lims path[data-g="vis"]').getAttribute('d')), true, 'Surface: its own region filled')
	  assert.equal(await page.evaluate(()=>document.getElementById('c-view').dataset.g),'vis','the View cell\'s mark: the Limit in force')
	  const shows=await page.evaluate(()=>matchMedia('(color-gamut: p3)').matches?'p3':'srgb')
	  await lens(page,'g',shows); await page.evaluate(()=>{ try{ localStorage.removeItem('csGm') }catch{} })   // back to the default Limit – the display's own – through the row's own menu
	  assert.equal(await page.evaluate(g=>document.querySelector('#hl-lim path').getAttribute('d')===document.querySelector(`.hlocus .lims path[data-g="${g}"]`).getAttribute('d'),shows), true, 'the display\'s gamut again: its own region filled') }
	// a name is the entry's identity: it wraps, never clips (CMYK once read "CM…") – the text's own
	// extent must fit its box, measured on the text node
	assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('.ent .nm')].filter(n => n.offsetParent).filter(n => {
		const r = document.createRange(); r.selectNodeContents(n); return r.getBoundingClientRect().width > n.getBoundingClientRect().width + 1 }).map(n => n.closest('.ent').dataset.s)), [], 'no catalog name is clipped')
	assert.equal(await page.locator('#cat .stk').count(), 0, 'the catalog carries no spinners – its numbers take typing and ↑ ↓; the spinners are the dossier\'s')
	const initialGradient=await page.locator('.ent[data-s="oklch"] .ch').first().evaluate(el => el.style.background.includes('linear-gradient')?el.style.background:el._gradStack?.at(-1)?.style.background||'')
	assert.match(initialGradient, /linear-gradient/, 'catalog strips use CSS gradients')
	assert.match(initialGradient, /rgb\([^)]*\.\d+/, 'gradient guides retain sub-byte color precision')
	assert.doesNotMatch(initialGradient, /\d(?:\.\d+)?%\s+\d(?:\.\d+)?%/, 'smooth mode has interpolated stops, not hard sampled bands')
	// one Limit cuts every slider – the catalog's as the dossier's: the display's own by default (sRGB where it can't show
	// P3 – the prerender's, so a first paint is what the page keeps there)
	await page.waitForFunction(()=>{ const g=matchMedia('(color-gamut: p3)').matches?'p3':'srgb'; return [...document.querySelectorAll('.ent[data-g]')].every(el=>new RegExp(`:${g}(?::|$)`).test(el.dataset.g)) },null,{timeout:8000}).catch(()=>{})   // the rows within reach (a screen each way) repaint from the pool as it answers
	const mainLensesBefore=await page.locator('.ent[data-g]').evaluateAll(els=>els.map(el=>el.dataset.g)), shows=await page.evaluate(()=>matchMedia('(color-gamut: p3)').matches?'p3':'srgb')
	assert.equal(mainLensesBefore.length>1&&mainLensesBefore.every(key=>new RegExp(`:${shows}(?::|$)`).test(key)),true,'every populated catalog slider renders under the Limit – the display\'s gamut by default')
	await page.evaluate(()=>document.querySelector('.ent[data-s="p3"]').scrollIntoView({block:'center'}))
	const keyed=(s,re)=>page.waitForFunction(([s,re])=>new RegExp(re).test(document.querySelector(`.ent[data-s="${s}"]`)?.dataset.g||''),[s,re.source],{timeout:3000}).catch(()=>{})   // a row's strips come from the sweep pool, a frame or so after the change
	await lens(page,'g','srgb'); await keyed('p3',/:srgb(?::|$)/)
	assert.match(await page.locator('.ent[data-s="p3"]').getAttribute('data-g'),/:srgb(?::|$)/,'the Limit repaints the catalog\'s sliders')
	await lens(page,'g','vis'); await keyed('p3',/:vis(?::|$)/)
	assert.match(await page.locator('.ent[data-s="p3"]').getAttribute('data-g'),/:vis(?::|$)/,'and back')
	// the Limit menu marks what this screen can't show: on an sRGB screen P3 and wider, on a P3 one Rec. 2020 and wider
	const clipped=pg=>pg.evaluate(()=>Object.fromEntries([...document.querySelectorAll('#m-view .mseg[data-lens="g"] button')].map(b=>[b.dataset.v,/\n/.test(b.title||b.dataset.tip||'')])))
	assert.deepEqual(await clipped(page),{ srgb:false, p3:true, rec2020:true, vis:true, locus:true },'an sRGB screen: every Limit past sRGB says it shows clipped')
	{ const p3Context=await browser.newContext({ viewport:{ width:1440, height:900 }, reducedMotion:'reduce' }), p3=await p3Context.newPage()
	  await (await p3Context.newCDPSession(p3)).send('Emulation.setEmulatedMedia',{ features:[{ name:'color-gamut', value:'p3' }] })
	  await p3.goto(`${server.origin}/?cb=${Date.now()}`,{ waitUntil:'networkidle' })
	  assert.deepEqual(await p3.evaluate(()=>[document.querySelector('#m-view .mseg[data-lens="g"] button.on')?.dataset.v, localStorage.csGm??null]),['p3',null],'a P3 screen, nothing picked: the Limit is P3')
	  assert.deepEqual(await clipped(p3),{ srgb:false, p3:false, rec2020:true, vis:true, locus:true },'…and only the Limits past P3 say they show clipped')
	  await p3Context.close() }
	// a phone's dossier record: one grid of pairs – origin | lineage, test | source, primaries | matrix – nothing past the screen
	{ const phoneContext=await browser.newContext({ viewport:{ width:390, height:844 }, reducedMotion:'reduce' }), phone=await phoneContext.newPage()
	  await phone.goto(`${server.origin}/rec709?cb=${Date.now()}`,{ waitUntil:'networkidle' }); await phone.waitForSelector('#modal:not([hidden]) .props [data-k="channels"]')
	  const rec=await phone.evaluate(()=>{ const at=k=>document.querySelector(`#overview [data-k="${k}"]`).getBoundingClientRect(), pair=(a,b)=>{ const x=at(a), y=at(b); return Math.round(x.top)===Math.round(y.top)&&x.right<=y.left }, m=document.getElementById('modal')
	    return [pair('origin','lineage'),pair('test','source'),pair('primaries','matrix'),m.scrollWidth<=m.clientWidth,!document.querySelector('#modal .drep,#modal [data-k="report"]')] })
	  assert.deepEqual(rec,[true,true,true,true,true],'a phone\'s record pairs origin | lineage, test | source, primaries | matrix, nothing wider than the screen, no report link')
	  await phoneContext.close() }
	assert.equal(await page.locator('#cd').inputValue(), '#808080', 'undefined color starts neutral gray')
	await page.locator('#him').click(); await page.waitForSelector('#uppop:popover-open .upim')
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
	await page.locator('#him').click()
	// the catalog starts under the hero's first screen – bring its first family into view (the live tiers paint what is on screen)
	await page.evaluate(async()=>{ document.querySelector('.ent[data-s="rgb"]').scrollIntoView({block:'center'}); await new Promise(r=>setTimeout(r,300)) })
	const liveTier=await page.evaluate(async()=>{ const src=document.querySelector('.ent[data-s="rgb"] .nrg[data-i="0"]')
		const neighbor=document.querySelector('.ent[data-s="rgb"] .ch[data-i="1"]'), currentVal=document.querySelector('.ent[data-s="rgb"] .cv[data-i="0"]'), otherLane=document.querySelector('.ent[data-s="p3"] .ch'), otherVal=document.querySelector('.ent[data-s="p3"] .cv'), otherRange=document.querySelector('.ent[data-s="p3"] .nrg'), hueLine=document.getElementById('strip')
		const frame=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))), set=v=>{ src.value=v; src.dispatchEvent(new Event('input',{bubbles:true})) }, pause=ms=>new Promise(r=>setTimeout(r,ms)), until=async(f,ms=2000)=>{ const t0=performance.now(); while(!f()&&performance.now()-t0<ms) await new Promise(r=>requestAnimationFrame(r)) }, cur=el=>getComputedStyle(el).getPropertyValue('--cur').trim(), rowKeys=()=>[...document.querySelectorAll('.ent')].filter(el=>{ const r=el.getBoundingClientRect(); return r.bottom>0&&r.top<innerHeight }).map(el=>({s:el.dataset.s,key:el.querySelector('.ch')?._g||el.dataset.g||''}))
		let rootWrites=0; const rootObserver=new MutationObserver(()=>rootWrites++); rootObserver.observe(document.documentElement,{attributes:true,attributeFilter:['style']})
		src.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:17,isPrimary:true}))
		set(160); await frame()
		const mid={gradient:neighbor.style.background,value:otherVal.value,thumb:otherRange.value,thumbColor:getComputedStyle(otherRange).getPropertyValue('--tkc'),otherGradient:otherLane._g,uiColor:hueLine.style.getPropertyValue('--cur')}
		set(190); await frame(); const uiColor=cur(hueLine), scoped=[hueLine,document.getElementById('ftr'),document.getElementById('lutszL'),document.getElementById('api-tab-core')?.parentElement,document.querySelector('.gtabs')].filter(Boolean).map(cur)   // a channel pair wears no color: its line is the ink
		const immediate={gradient:neighbor.style.background,currentValue:currentVal.value,thumb:otherRange.value,thumbColor:getComputedStyle(otherRange).getPropertyValue('--tkc'),otherGradient:otherLane._g,uiColor,scoped}
		const vd=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value'), writes=[]
		Object.defineProperty(otherVal,'value',{configurable:true,get(){return vd.get.call(this)},set(v){writes.push(performance.now());vd.set.call(this,v)}})
		const st=performance.now(); await new Promise(done=>{ let k=0; const tick=t=>{ set(190+(k++%45)); t-st<240?requestAnimationFrame(tick):done() }; requestAnimationFrame(tick) })
		delete otherVal.value; const throttled={writes:writes.length,value:otherVal.value}; await pause(180); const held={thumb:otherRange.value,otherGradient:otherLane._g,rootWrites}; rootObserver.disconnect()
		set(245); const beforeRelease={value:otherVal.value,thumb:otherRange.value,otherGradient:otherLane._g}
		src.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:17,isPrimary:true})); src.dispatchEvent(new Event('change',{bubbles:true})); await new Promise(r=>requestAnimationFrame(()=>setTimeout(()=>requestAnimationFrame(r))))
		const full=()=>otherLane._g!==beforeRelease.otherGradient&&rowKeys().every(({s,key})=>new RegExp(`:${s==='rgb'?1:48}:(vis|off):`).test(key)); await until(full); const released={value:otherVal.value,thumb:otherRange.value,otherGradient:otherLane._g,rows:rowKeys()}
		await pause(500); const post={accent:getComputedStyle(document.querySelector('.dpop')).accentColor,current:getComputedStyle(document.getElementById('ftr')).backgroundColor}; return {mid,immediate,throttled,held,beforeRelease,released,post} })
	assert.notEqual(liveTier.immediate.gradient,liveTier.mid.gradient,'current-space neighboring gradients update live')
	assert.notEqual(liveTier.immediate.uiColor,liveTier.mid.uiColor,'scoped current-color UI stays live during a drag')
	assert.equal(liveTier.immediate.scoped.length===5&&liveTier.immediate.scoped.every(color=>color===liveTier.immediate.uiColor),true,'every static current-color consumer follows the scoped drag color')
	assert.equal(liveTier.held.rootWrites,0,'a held drag never mutates inherited style on the document root')
	assert.equal(+liveTier.immediate.currentValue,190,'the actively dragged row keeps its numeric value live')
	assert.equal(liveTier.throttled.writes>0&&liveTier.throttled.writes<=4,true,'other-space numeric writes stay bounded to the 100ms tier during a drag burst')
	assert.notEqual(liveTier.throttled.value,liveTier.mid.value,'other-space numeric inputs catch up during the 100ms tier')
	assert.notEqual(liveTier.released.value,liveTier.beforeRelease.value,'release always flushes the final throttled numeric values')
	assert.notEqual(liveTier.immediate.thumb,liveTier.mid.thumb,'every visible slider picker follows a held drag immediately')
	assert.notEqual(liveTier.immediate.thumbColor,liveTier.mid.thumbColor,'every visible slider picker color follows a held drag immediately')
	assert.equal(liveTier.immediate.thumbColor.trim().toLowerCase(),liveTier.immediate.uiColor.toLowerCase(),'every visible picker wears the current displayed color')
	assert.notEqual(liveTier.held.otherGradient,liveTier.immediate.otherGradient,'a held hand moves the other spaces\' gradients too – throttled, not held for the release')
	assert.match(liveTier.held.otherGradient,/:48:(vis|off):/,'held, the other strips keep full quality – computed off the main thread, the drag\'s frames stay with the strip in hand')
	assert.notEqual(liveTier.released.thumb,liveTier.beforeRelease.thumb,'release flushes the final picker position – the frame after it lets go (the cursor back first)')
	assert.notEqual(liveTier.released.otherGradient,liveTier.beforeRelease.otherGradient,'release lands the final color on the other strips')
	assert.match(liveTier.released.otherGradient,/:48:(vis|off):/,'released, the other strips stand at full quality')
	assert.equal(liveTier.released.rows.length>1&&liveTier.released.rows.every(({s,key})=>new RegExp(`:${s==='rgb'?1:48}:(vis|off):`).test(key)),true,'release leaves every visible catalog row at its full guide count')
	assert.equal(liveTier.post.accent,liveTier.post.current,'the menus\' native ranges wear the current color – never through an accent on <html>, which restyles the whole page')
	const cancelled=await page.evaluate(async()=>{ const src=document.querySelector('.ent[data-s="rgb"] .nrg[data-i="0"]'), lane=document.querySelector('.ent[data-s="p3"] .ch'), before=lane._g
		src.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:18,isPrimary:true})); src.value=32; src.dispatchEvent(new Event('input',{bubbles:true})); await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))
		src.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:18,isPrimary:true})); await new Promise(r=>requestAnimationFrame(()=>setTimeout(()=>requestAnimationFrame(r))))
		for(let t0=performance.now();lane._g===before&&performance.now()-t0<2000;) await new Promise(r=>requestAnimationFrame(r)); return {before,after:lane._g} })
	assert.notEqual(cancelled.after,cancelled.before,'pointer cancellation lands the final color on the catalog\'s strips')
	assert.match(cancelled.after,/:48:(vis|off):/,'…at full quality')
	const customCatalogCancel=await page.evaluate(async()=>{ const ch=document.querySelector('.ent[data-s="rgb"] .ch'), back=document.querySelector('.ent[data-s="p3"] .ch'), r=ch.getBoundingClientRect(), capture=ch.setPointerCapture; ch.setPointerCapture=()=>{}
		const pointer=(type,f)=>ch.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:21,isPrimary:true,clientX:r.left+r.width*f,clientY:r.top+r.height/2}))
		const key=()=>back._g||back.closest('.ent').dataset.g, before=key()
		pointer('pointerdown',.2); pointer('pointermove',.65); await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))); const active=ch.classList.contains('live')
		pointer('pointercancel',.65); ch.setPointerCapture=capture; await new Promise(r=>requestAnimationFrame(()=>setTimeout(()=>requestAnimationFrame(r)))); const parked=!ch.classList.contains('live')
		// the other strips may already stand at the final color while held – the pool keeps them at it, in full – so the
		// cancel is read against the color itself, not against the held frame
		const final=()=>document.getElementById('cd').value.toLowerCase(), at=()=>key().toLowerCase().startsWith(final())
		for(let t0=performance.now();!at()&&performance.now()-t0<2000;) await new Promise(r=>requestAnimationFrame(r)); return {active,parked,before,after:key(),final:final()} })
	assert.equal(customCatalogCancel.active&&customCatalogCancel.parked,true,'pointer cancellation parks a custom catalog slider')
	assert.notEqual(customCatalogCancel.after,customCatalogCancel.before,'a custom catalog drag moves the other strips')
	assert.equal(customCatalogCancel.after.toLowerCase().startsWith(customCatalogCancel.final),true,'custom catalog cancellation leaves the other strips at the final color')
	assert.match(customCatalogCancel.after,/:48:(vis|off):/,'…at full quality')
	await toCatalog(page)
	await page.locator('#cval').fill('#123456'); await page.waitForFunction(()=>document.querySelector('#cd').value.toLowerCase()==='#123456')
	assert.equal(await page.locator('#cd').inputValue(),'#123456','pointer cancellation releases the catalog drag guard')
	// the field reads CSS Color 4 as css.js does – angle units, per-channel percentages, none, 8-digit hex (the targets
	// colorjs.io's: new Color(s).to('srgb')) – and still the catalog's own forms CSS can't write
	for(const [typed,want] of [['hsl(0.5turn 100% 50%)','#00ffff'],['#ff8000cc','#ff8000'],['lab(54 64% -10%)','#f0189a'],['oklch(none 0 0)','#000000'],['okhsv(30 80 90)','#e44f3d']]){
		await page.locator('#cval').fill(typed)
		await page.waitForFunction(w=>document.querySelector('#cd').value.toLowerCase()===w,want,{ timeout:5000 }).catch(()=>{})
		assert.equal((await page.locator('#cd').inputValue()).toLowerCase(),want,`the field reads ${typed}`) }
	await page.locator('#cval').fill('#123456'); await page.waitForFunction(()=>document.querySelector('#cd').value.toLowerCase()==='#123456')
	await page.waitForTimeout(400)   // the typed color's own frame and settle – past them, or they count inside the burst below
	const nonPointerRoot=await page.evaluate(async()=>{ const src=document.querySelector('.ent[data-s="rgb"] .nrg[data-i="0"]'); let writes=0
		const observer=new MutationObserver(()=>writes++); observer.observe(document.documentElement,{attributes:true,attributeFilter:['style']})
		for(let n=0;n<12;n++){ src.value=40+n*10; src.dispatchEvent(new Event('input',{bubbles:true})); await new Promise(r=>requestAnimationFrame(r)) }
		const during=writes; src.dispatchEvent(new Event('change',{bubbles:true})); await new Promise(r=>setTimeout(r,250)); observer.disconnect(); return {during,after:writes} })
	assert.equal(nonPointerRoot.during,0,'a rapid non-pointer input burst does not mutate inherited root style')
	assert.equal(nonPointerRoot.after,0,'nor after it settles – the root never wears the color (an inherited style there restyles the whole page); the menus\' native ranges take it from their own --cur')

	// the row's search: words narrow the catalog as typed; Esc empties it and lets the search go
	const search = page.locator('#fq')
	await page.locator('.cells .qx').click()   // the icon opens the field
	await search.fill('oklch')
	assert.equal(await page.locator('.ent[data-s="oklch"]').isVisible(), true, 'search keeps OKLCH visible')
	assert.equal(await page.locator('.ent[data-s="rgb"]').isVisible(), false, 'search filters non-matches')
	assert.equal(new URL(page.url()).searchParams.get('find'), 'oklch', 'the search rides the URL')
	await search.press('Escape')
	assert.equal(new URL(page.url()).searchParams.get('find'), null, 'and leaves it when let go')
	assert.equal(await search.inputValue(), '', 'Esc empties the query')
	await search.fill('display-p3')
	assert.equal(await page.locator('.ent[data-s="p3"]').isVisible(), true, 'a CSS id finds its space – a hyphen reads as the name\'s space')
	await search.press('Escape')
	assert.equal(await page.locator('.ent[data-s="rgb"]').isVisible(), true, 'and restores the catalog')

	// the coverage slider: ≥90% keeps full-coverage spaces, drops sRGB (~36%), and More's Any resets it — pins the
	// threshold predicate and its reset lifecycle
	await page.locator('#c-more').click()
	await page.locator('#fcov').fill('90')
	assert.equal(await page.locator('.ent[data-s="oklab"]').isVisible(), true, 'coverage ≥90% keeps oklab')
	assert.equal(await page.locator('.ent[data-s="rgb"]').isVisible(), false, 'coverage ≥90% drops sRGB')
	assert.equal(await page.locator('.cells .count').innerText(), `${await page.locator('.ent:visible').count()} spaces`, 'the row\'s count is what the filters leave')
	assert.equal(await page.evaluate(()=>[document.querySelector('#c-more b').textContent,document.getElementById('c-more').title].join('|')), '≥90%|Filters: ≥90%', 'the pick inks Filters and names itself there')
	assert.equal(await page.locator('#fclr').isVisible(), true, 'a pick shows the one × that lets the filters go')
	// one menu holds every facet, once – the row shows only what is picked
	assert.deepEqual(await page.evaluate(()=>['range','geometry','signal','encoding','white','channels','coverage'].filter(k=>{ const body=document.querySelectorAll(`.mbody[data-m="${k}"]`)
		return body.length!==1||!body[0].closest('#m-more') })),[],'each facet lives once, in the Filters menu')
	await toCatalog(page)
	assert.equal(await page.locator('.cells .cell:visible').count(), 6, 'the row: Filters, search, the view\'s one menu, the layout, the theme and the source – a pick adds no cell')
	await page.locator('#fcov').fill('0')
	assert.equal(await page.locator('.ent[data-s="rgb"]').isVisible(), true, 'the full interval again restores the catalog')
	assert.equal(await page.evaluate(()=>[document.querySelector('#c-more b').textContent,document.querySelector('#c-more b.on')].join('|')), '|', 'let go, Filters is plain again')
	assert.equal(await page.evaluate(()=>document.getElementById('fclr').hidden), true, 'and the × leaves with the last pick')
	// the interval's low end: ≤50% finds the narrow-coverage spaces and drops the wide ones
	await page.locator('#fcov1').fill('50')
	assert.equal(await page.locator('.ent[data-s="rgb"]').isVisible(), true, 'coverage ≤50% keeps sRGB (~36%)')
	assert.equal(await page.locator('.ent[data-s="oklab"]').isVisible(), false, 'coverage ≤50% drops oklab')
	await page.locator('#fcov1').fill('100')
	// the fill IS the interval: after a reset the track must return to full ink, not clear
	assert.equal(await page.locator('#fcov').evaluate(i => { const d = i.closest('.dual'); return d.style.getPropertyValue('--lo') + ' ' + d.style.getPropertyValue('--hi') }), '0% 100%', 'coverage reset repaints the full interval')
	await page.keyboard.press('Escape')

	// each family's tooltip rides its rail button; card names carry the quick-tag
	// dossier; the FAQ entries fold and unfold
	assert.equal(await page.locator('.toc .tn:is([data-tip],[data-tip-off])').count(), 7, 'every family carries its tooltip – the active one\'s parked while its description stands under it')
	// the rail rests by the first space: as each family reaches the pinned row, its title's baseline sits on its first
	// space name's – every family, not only the first (a passed title steps out of sight). A line's baseline: an empty
	// inline-block's bottom, prepended to it
	assert.deepEqual(await page.evaluate(async()=>{ const off=[], base=el=>{ const q=document.createElement('i'); q.style.cssText='display:inline-block;width:0;height:0'; el.prepend(q); const y=q.getBoundingClientRect().bottom; q.remove(); return y }
		for(const [i,sec] of [...document.querySelectorAll('.sec')].entries()){ sec.scrollIntoView(); scrollBy(0,40); await new Promise(r=>setTimeout(r,150))
			const d=Math.abs(base(document.querySelectorAll('.ti .tt')[i])-(base(sec.querySelector('.ent .nm'))+40))
			if(d>1||document.querySelectorAll('.ti')[i].classList.contains('past')) off.push(i+':'+Math.round(d)) }
		return off }), [], 'each family\'s title rests on its first space\'s baseline')
	// entering, the first title comes up with its first space; the waiting stack stays at the screen's foot but never
	// rises over the first family – its box begins under that family's description
	assert.equal(await page.evaluate(async()=>{ const sec=document.querySelector('.sec'); scrollTo(0,sec.getBoundingClientRect().top+scrollY-56-300); await new Promise(r=>setTimeout(r,300))
		const t=document.querySelector('.ti .tn').getBoundingClientRect(), n=sec.querySelector('.ent .nm').getBoundingClientRect(); const tip=document.querySelector('.ti .tip').getBoundingClientRect(), nx=document.querySelectorAll('.ti')[1].getBoundingClientRect()
		return Math.abs(t.top+t.height/2-(n.top+n.height/2))<8&&nx.top>=tip.bottom-1&&nx.bottom<=innerHeight }), true, 'the first title enters with its first space; the coming ones wait on screen under its description')
	// …and the shelf tabs wait below its description, never riding up over the first family
	assert.equal(await page.evaluate(async()=>{ const sec=document.querySelector('.sec'); scrollTo(0,sec.getBoundingClientRect().top+scrollY-innerHeight+80); await new Promise(r=>setTimeout(r,300))
		return document.querySelector('.gtabs').getBoundingClientRect().top>=document.querySelector('.ti .tip').getBoundingClientRect().bottom-1 }), true, 'the shelf tabs stay below the first family\'s description')
	// every family's description stands under its title wherever the rail has the room – the family on screen's and, beside
	// its section, the coming one's; a title waiting in the stack at the foot has the next title lying over its own. Nothing
	// switches them: they are covered and uncovered (one family's alone showed, by a class, till 2026-11)
	assert.deepEqual(await page.evaluate(async()=>{ const secs=[...document.querySelectorAll('.sec')], tis=[...document.querySelectorAll('.ti')]
		scrollTo(0,secs[1].getBoundingClientRect().top+scrollY-innerHeight/2); await new Promise(r=>setTimeout(r,300))
		return tis.slice(0,4).map(t=>{ const tip=t.querySelector('.tip'), r=tip.getBoundingClientRect(); return getComputedStyle(tip).visibility==='visible'&&document.elementFromPoint(r.left+8,r.top+8)===tip }) }),
		[true,true,false,false],'the family on screen and the one coming up both speak their description; the stack at the foot covers the waiting ones\'')
	// …and a description in full sight is not said twice: its title's tooltip is parked, a covered one's stands
	assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('.ti .tn')].slice(0,4).map(b=>b.dataset.tip!=null)),[false,false,true,true],'a title tips its description only while that is covered')
	// a title pushed off the line takes its description along
	assert.equal(await page.evaluate(async()=>{ const sec=document.querySelectorAll('.sec')[1]; sec.scrollIntoView(); scrollBy(0,40); await new Promise(r=>setTimeout(r,300))
		const [a,b]=document.querySelectorAll('.ti'); return a.classList.contains('past')&&getComputedStyle(a.querySelector('.tip')).visibility==='hidden'&&b.classList.contains('act')&&getComputedStyle(b.querySelector('.tip')).visibility==='visible' }),true,'the family that left the line leaves no description behind')
	// a window too short to stack the coming titles under that line keeps the line – they wait in their flow places
	await page.setViewportSize({ width: 1440, height: 440 }); await page.waitForTimeout(300)
	assert.equal(await page.evaluate(async()=>{ const sec=document.querySelector('.sec'); sec.scrollIntoView(); await new Promise(r=>setTimeout(r,300))
		const t=document.querySelector('.ti .tn').getBoundingClientRect(), n=sec.querySelector('.ent .nm').getBoundingClientRect(); return Math.abs(t.top+t.height/2-(n.top+n.height/2)) }) < 8, true, 'a short window keeps the first title on its line')
	await page.setViewportSize({ width: 1440, height: 900 }); await page.waitForTimeout(300)
	// a card's kind (.lc lead, .tc tile, .lr row) styles only catalog entries – the rail's count chip is .tc too
	assert.deepEqual(await page.locator('.ti .tc').first().evaluate(el => { const c = getComputedStyle(el); return [c.contentVisibility, c.flexDirection] }), ['visible', 'row'], 'the rail\'s count is not styled as a tile')
	{ const nm = page.locator('.ent[data-s="oklch"] .nm')
		assert.equal(await nm.getAttribute('data-tip-head'), 'Björn Ottosson, 2020', 'card names carry the maker whole and the year as the tip\'s head')
		assert.match(await nm.getAttribute('data-tip'), /CSS/, 'and what the space was made for') }
	assert.match(await page.locator('.ent[data-s="oklch"] .nm').getAttribute('data-tip-tags'), /^polar\|.*perceptual\|perceptual/i, 'and its tag chips, each with its icon key – the word in any case')
	assert.equal(await page.locator('.fqa').count(), 14, 'the questions are all present')
	const fq = page.locator('.fqa').first()
	await fq.locator('summary').click()
	assert.equal(await fq.getAttribute('open'), '', 'a question unfolds')
	// a specimen value link sets color AND notation through the hash alone – the URL
	// carries the notation both ways (parsed on arrival, written back by urlHash)
	await fq.locator('a[href^="#oklch("]').click()
	await page.waitForFunction(() => document.querySelector('#cval').value.startsWith('oklch('))
	assert.match(await page.locator('#cval').inputValue(), /^oklch\(/, 'a FAQ specimen link switches color and notation')
	assert.match(decodeURIComponent(page.url()), /#oklch\(/, 'and the URL speaks that notation')
	await toCatalog(page)
	await page.locator('#cval').click()   // now CHANGE the color while in oklch – urlHash must write the new color back in the same notation
	await page.locator('#cval').press('ControlOrMeta+a')   // a press places the caret, as in any field: the whole value taken to replace it
	await page.locator('#cval').pressSequentially('coral')
	await page.locator('#cval').press('Enter')
	await page.waitForFunction(() => document.querySelector('#cd').value === '#ff7f50'
		&& decodeURIComponent(location.hash).startsWith('#oklch(')
		&& document.querySelector('#cval').value === 'coral')   // the URL in the notation chosen; the field keeps the name typed
	await page.evaluate(() => location.hash = 'ff8000')   // a hex hash restores hex notation – the later canonicalize assertions read hex
	await page.waitForFunction(()=>/^#FF8000$/i.test(document.querySelector('#cval').value))
	assert.match(await page.locator('#cval').inputValue(), /^#FF8000$/i, 'a hex hash infers hex notation back')
	await fq.locator('summary').click()
	assert.equal(await fq.getAttribute('open'), null, 'and folds back')

	// the shelf cut lives at the rail's FOOT now — tabs regroup without the panel;
	// the filters then compose on the rebuilt DOM (scene-referred × era = the
	// camera-log timeline), and the header chips restore every layer
	assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('.gtabs .gtag')].map(b => b.dataset.g + (b.hidden ? ' hidden' : ''))), ['family', 'purpose', 'author', 'era', 'bookmarks'], 'the rail offers the four cuts – family, purpose, author, era – and the bookmarks shelf\'s bookmark, the starter six on it')
	await page.locator('.gtabs .gtag[data-g="purpose"]').click()
	assert.match(await page.locator('.toc .tn').first().textContent(), /Picking/, 'purpose shelves lead the rail')
	await page.locator('.gtabs .gtag[data-g="era"]').click()
	assert.equal(await page.locator('.ent[data-s]').count(), 221, 'era regroup keeps every space')
	assert.match(await page.locator('.toc .tn').first().textContent(), /2020/, 'era shelves lead the rail, newest first')
	await lens(page,'f','scene')
	assert.equal(await page.locator('.ent[data-s="slog3"]').isVisible(), true, 'signal filter composes with the era cut')
	assert.equal(await page.locator('.ent[data-s="hsl"]').isVisible(), false, 'and still drops non-matches there')
	assert.match(await page.locator('#c-more').getAttribute('title'), /^Filters: .*Scene/, 'Filters names the picked signal')
	await page.locator('#fclr').click(); assert.equal(await page.locator('.cells .count').innerText(), '221 spaces', 'the × lets every pick go at once')
	await lens(page,'f','scene')   // picked again, for what follows
	await lens(page,'f','scene')   // unpicked where it was picked – no Any
	await page.locator('.gtabs .gtag[data-g="family"]').click()
	assert.match(await page.locator('.toc .tn').first().textContent(), /Display/, 'the Family tab restores the family cut')
	await page.locator('.gtabs .gtag[data-g="author"]').click()
	assert.deepEqual(await page.evaluate(() => { const k = [...document.querySelectorAll('#cat .sec')].map(s => s.dataset.k); return [k[0], k.at(-1), document.querySelectorAll('#cat .sec .ent').length] }), ['author.cie', 'author.people', 221], 'the Author cut: the CIE first, the researchers last, every space shelved once')
	await page.locator('.gtabs .gtag[data-g="family"]').click()
	// nothing kept yet, the shelf holds the starter six (groups.js STARTER), marked as bookmarked; the bookmark on a card's maker
	// line adds a space after them, every one a lead card – side by side to compare; let go there, a card stays till the shelf is
	// redrawn; every one let go, the tab hides and the empty shelf is kept – never the six again
	const shelf = () => page.evaluate(() => [...document.querySelectorAll('#cat .ent[data-s]')].map(e => e.dataset.s + (e.matches('.lc') ? '' : ' tile')))
	const starter = ['oklch', 'rgb', 'p3', 'hsl', 'lab', 'xyz']
	assert.equal(await page.locator('.ent[data-s="oklch"] .bm').getAttribute('aria-pressed'), 'true', 'a starter space comes marked')
	await page.locator('.ent[data-s="cam16"] .eh').hover(); await page.locator('.ent[data-s="cam16"] .bm').click()
	await page.locator('.gtabs [data-g="bookmarks"]').click()
	assert.deepEqual(await shelf(), [...starter, 'cam16'], 'the bookmarks shelf: the starter six, then the one bookmarked, each a lead card')
	await page.locator('.ent[data-s="lab"] .bm').click()
	assert.deepEqual([await page.locator('.ent[data-s="lab"]').isVisible(), await page.locator('.ent[data-s="lab"] .bm').getAttribute('aria-pressed')], [true, 'false'], 'let go on the shelf, a space stays, unmarked, till the shelf is drawn again')
	await page.locator('.gtabs .gtag[data-g="family"]').click()
	for (const s of [...starter.filter(x => x !== 'lab'), 'cam16']) { await page.locator(`.ent[data-s="${s}"] .eh`).hover(); await page.locator(`.ent[data-s="${s}"] .bm`).click() }
	assert.equal(await page.locator('.gtabs [data-g="bookmarks"]').isHidden(), true, 'nothing bookmarked: the bookmarks shelf\'s tab hides')
	assert.equal(await page.evaluate(() => localStorage.csBookmarks), '[]', 'the emptied shelf is kept empty, not filled with the six again')
	// a language switch keeps ?g=: the page arrives in that cut, built once, and its tabs stay live – the arrival used to
	// regroup, then the prerender's drift path redrew the family over it with the cut still set, so Family looked picked and Purpose did nothing
	{	const cutContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }), cut = await cutContext.newPage()
		const shelf = () => cut.evaluate(() => document.querySelector('#cat .sec')?.dataset.k)
		await cut.goto(`${server.origin}/ru/?sw&g=purpose&cb=${Date.now()}`, { waitUntil: 'networkidle' })
		assert.equal(await shelf(), 'purpose.picking', 'a shared ?g=purpose arrives in the purpose cut, translated page included')
		await cut.locator('.gtabs .gtag[data-g="family"]').click(); assert.equal(await shelf(), 'cat.display', 'its Family tab answers')
		await cut.locator('.gtabs .gtag[data-g="purpose"]').click(); assert.equal(await shelf(), 'purpose.picking', 'and its Purpose tab again')
		await cutContext.close() }

	// the views: the List rebuilds the same catalog; a List column orders every space in one shelf, again the
	// other way; Grid returns. A lead card's own switch shows its channel pairs as planes
	assert.equal(await page.locator('#m-view [data-lens="w"]').count(), 0, 'the layout is not a lens – the View menu holds Quantize, Limit and Vision')
	assert.equal(await page.locator('#c-layout').getAttribute('data-view'), 'list', 'the switch shows the view it turns to next')
	await layout(page,'list')
	assert.equal(await page.locator('.ent.tr').count(), 221, 'the List shows every space')
	await page.locator('[data-sort="year"]').first().click()
	assert.equal(await page.locator('.sec').count(), 1, 'a sorted column gathers every space in one shelf')
	const years = await page.locator('.ent.tr .c-year').allInnerTexts()
	assert.equal(years.every((y, i) => !i || +years[i - 1] <= +y), true, 'oldest first')
	await page.locator('[data-sort="year"]').first().click()
	assert.equal(+(await page.locator('.ent.tr .c-year').first().innerText()) >= +years.at(-1), true, 'and again, newest first')
	assert.equal(await page.evaluate(() => localStorage.csView), 'list', 'the view is kept for the next visit')
	{ const r = page.locator('.ent.tr').nth(2), s = await r.getAttribute('data-s'); await r.locator('.c-year').click()   // not the name: any cell of the row
		await page.waitForSelector('#modal:not([hidden]) #dtitle'); await page.waitForFunction(s => location.pathname.endsWith('/' + s), s, { timeout: 3000 }).catch(() => {})   // the URL follows the card's first frame
		assert.equal(await page.evaluate(() => location.pathname.split('/').pop()), s, 'a List row opens its dossier from any cell')
		await page.locator('#mx').click(); await page.waitForFunction(() => document.querySelector('#modal')?.hidden === true) }
	await layout(page,'grid')
	assert.equal(await page.locator('.ent.lc').count(), 21, 'Grid returns: the families\' featured cards')
	const okl = page.locator('.ent[data-s="oklch"]'); await okl.scrollIntoViewIfNeeded(); await okl.hover()
	await okl.locator('.pvs').click()
	assert.equal(await okl.locator('.pl').count(), 3, 'the switch shows a card\'s three planes')
	assert.equal(await okl.locator('.pv>.chs').isVisible(), false, 'in place of its strips')
	await okl.locator('.pvs').click()
	assert.equal(await okl.locator('.pv>.chs').isVisible(), true, 'and back')
	// the history builds as the reader nears it: one band per space, its milestones read off the data; a band opens its dossier
	await page.locator('#lineage').scrollIntoViewIfNeeded(); await page.waitForSelector('#lineage .hl-b')
	assert.equal(await page.locator('#lineage .hl-b').count(), 221, 'the history draws every space')
	assert.deepEqual(await page.locator('#lineage .hl-ms[data-s]').evaluateAll(b => b.map(x => x.dataset.s)), ['xyz', 'lab', 'rgb', 'oklab'], 'its milestones: CIE XYZ, CIELAB, sRGB, OKLab')
	await page.locator('#lineage .hl-ms[data-s="lab"]').click(); await page.waitForSelector('#modal:not([hidden]) #dtitle')
	assert.match(await page.locator('#dtitle').innerText(), /CIELAB/, 'a milestone opens its dossier')
	await page.locator('#mx').click(); await page.waitForFunction(() => document.querySelector('#modal')?.hidden === true)

	await toCatalog(page)
	await page.locator('#cval').fill('rebeccapurple')
	await page.locator('#cval').press('Enter')
	assert.equal(await page.locator('#cval').inputValue(), 'rebeccapurple', 'a CSS name typed stays the name – the field never rewrites what it was told')
	assert.equal(await page.locator('#cd').inputValue(), '#663399', '…its color the name’s')
	// the field's colors written the one way, whatever parted them as typed: a list's by ", ", a gradient's by " – " – a
	// name holding a dash or a space, a CSS gradient, a color's own parens as written
	for (const [typed, said] of [['red - blue', 'red – blue'], ['red->blue', 'red – blue'], ['red → blue', 'red – blue'], ['red > blue', 'red – blue'], ['red−blue', 'red – blue'], ['red..blue', 'red – blue'], ['red to blue', 'red – blue'],
		['red; blue | green + gold', 'red, blue, green, gold'], ['red blue green', 'red, blue, green'], ['#f00 #00f', '#f00, #00f'], ['rgb(255 0 0) rgb(0 0 255)', 'rgb(255 0 0), rgb(0 0 255)'],
		['red – blue - green in oklch', 'red – blue – green in oklch'], ['oklch(0.7 0.1 30) -> #00f', 'oklch(0.7 0.1 30) – #00f'], ['linear-gradient(red, blue)', 'linear-gradient(red, blue)'], ['rebeccapurple', 'rebeccapurple']]) {
		await page.locator('#cval').fill(typed); await page.locator('#cval').press('Enter'); await page.evaluate(() => document.activeElement.blur())
		assert.equal(await page.locator('#cval').inputValue(), said, `"${typed}" said "${said}"`) }
	// a gradient's method being typed: CSS's interpolation spaces offered, as typed so far
	await page.locator('#cval').click(); await page.locator('#cval').fill('red – blue in okl'); await page.waitForTimeout(300)
	assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('#csug .sgt>span:first-child')].map(s => s.textContent)), ['red – blue in oklch', 'red – blue in oklab'], 'in okl…: oklch and oklab offered')
	await page.locator('#cval').fill('red – blue in oklch'); await page.waitForTimeout(300)
	{ const got = await page.evaluate(() => [...document.querySelectorAll('#csug .sgt>span:first-child')].map(s => s.textContent))
		assert.equal(got[0], 'red – blue in oklab', 'in oklch typed whole: the other spaces offered, oklab first'); assert.ok(got.length > 5 && !got.includes('red – blue in oklch'), 'every other interpolation space, not the one typed') }
	await page.locator('#cval').press('Escape'); await page.evaluate(() => document.activeElement.blur())
	// a collection's name is a suggestion's line, never the field's: taken, the field holds its value; the color's neighbour
	// is one row – the value, its name and collection under it – its name pressed, the next nearest; the notation is the
	// View menu's, every value's
	{	await page.locator('#cval').fill('lead'); await page.waitForFunction(() => [...document.querySelectorAll('#csug .sgn, #csug small')].some(s => /lead/i.test(s.textContent)), null, { timeout: 15000 })
		await page.locator('#cval').press('Enter'); await page.evaluate(() => document.activeElement.blur()); await page.waitForTimeout(200)
		assert.match(await page.locator('#cval').inputValue(), /^#[\dA-F]{6}$/i, 'a collection\'s name taken: the field holds its value, not the name')
		await page.locator('#cval').click(); await page.waitForTimeout(400)
		const nb = () => page.evaluate(() => { const r = [...document.querySelectorAll('#csug .sgr')].find(r => r.querySelector('.sgt small')?.textContent.includes('color-name-list')); return r && [r.querySelector('.sgt>span').textContent, r.querySelector('.sgn')?.textContent] })
		const [v1, n1] = await nb(); assert.match(v1, /^#[\dA-F]{6}$/i, 'the neighbour row reads as a value'); assert.ok(n1, 'its name under it')
		assert.equal(await page.evaluate(() => [...document.querySelectorAll('#csug .sgt small')].filter(s => s.textContent.includes('color-name-list')).length), 1, 'one neighbour')
		await page.locator('#csug .sgn').first().click(); await page.waitForTimeout(200)
		const [, n2] = await nb(); assert.notEqual(n2, n1, 'its name pressed: the next nearest')
		await page.locator('#cval').press('Escape'); await page.evaluate(() => document.activeElement.blur())
		await lens(page, 'n', 'oklch'); await page.waitForTimeout(200)
		assert.match(await page.locator('#cval').inputValue(), /^oklch\(/, 'the View menu\'s Format: the field in OKLCH')
		await page.evaluate(() => document.dispatchEvent(new CustomEvent('imgpal', { detail: [[255, 0, 0], [0, 0, 255]] }))); await page.waitForTimeout(200)
		assert.match(await page.locator('#cval').inputValue(), /^oklch\([^)]*\), oklch\(/, 'an image\'s palette written in the Format picked')
		await lens(page, 'n', 'hex'); await page.waitForTimeout(200) }
	// the field's words: a name holding " to " is one color, kept as typed; the caret's color inked among the others
	{ await page.locator('#cval').fill('red – orange – gold – lime – teal – blue – navy – purple – magenta – crimson – maroon – olive – khaki'); await page.locator('#cval').press('Enter'); await page.evaluate(() => document.activeElement.blur()); await page.waitForTimeout(300)
		const [h, lh] = await page.evaluate(() => { const c = document.getElementById('cval'); return [c.offsetHeight, parseFloat(getComputedStyle(c).lineHeight)] })
		assert.ok(h < lh * 1.5, 'a long value let go: one line, cut short') }
	await page.locator('#cval').fill('red, blue, tomato'); await page.locator('#cval').press('Enter')
	await page.locator('#cval').click(); await page.evaluate(() => { const c = document.getElementById('cval'); c.setSelectionRange(6, 6); document.dispatchEvent(new Event('selectionchange')) })
	assert.deepEqual(await page.evaluate(() => [document.querySelector('.cvul').childNodes.length, [...CSS.highlights.get('cv-held')].map(r => r.toString())[0], document.querySelector('.cvul').classList.contains('many')]), [1, 'blue', true], 'the field\'s twin one string, the caret\'s color its highlight')
	assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('.hlocus .sto[data-j]')].map(d => !!d.dataset.tipHead && /^x [\d.]+\u2003y [\d.]+\u2003Y [\d.]+$/.test(d.dataset.tip))), [true, true], 'the other colors\' dots on the locus tell their value over x, y and Y')
	await page.locator('#cval').fill('red - orange - gold - lime - teal - blue'); await page.waitForTimeout(300); await page.locator('#cval').press('Enter')
	await page.locator('#cval').click(); await page.waitForTimeout(500)
	assert.equal(await page.evaluate(() => [...document.querySelectorAll('#csug small')].some(s => /one step on/.test(s.textContent))), false, 'six stops: no step on')
	await page.locator('#cval').press('Escape')

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
	// a plate's colors are lighthigh's ranges over its own text – no span per token
	await page.waitForFunction(() => [...CSS.highlights.values()].some((h) => [...h].some((r) => r.toString() === "'color-space/wasm'")), null, { timeout: 10000 })
	assert.equal(await page.locator('#api-panel-wasm pre').first().evaluate((p) => p.childElementCount), 0, 'a plate holds its text alone')

	await page.locator('#thm').click()
	assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark', 'theme toggles')
	await page.reload({ waitUntil: 'networkidle' })
	assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark', 'theme persists')

	// segmented rendering starts from a neutral so the OKLab lattice's neutral-axis
	// invariant is visible (the old floor-based a/b sites turned #808080 brown)
	await toCatalog(page)
	await page.locator('#cval').fill('#808080')
	await page.locator('#cval').press('Enter')
	await page.locator('.ent[data-s="oklab"]').scrollIntoViewIfNeeded()   // the lane the lens checks below must be on screen behind the card – a restored scroll left it under the fold some runs
	const trigger = page.locator('.ent[data-s="oklch"] .nm')
	await trigger.click()
	await page.waitForSelector('#modal:not([hidden]) #dtitle')
	assert.match(await page.locator('#dtitle').innerText(), /OKLCH/i, 'dossier opens')
	// the rows round the card: one in sight past its side, painted as the card's color moves (its thumbs every frame, its
	// strips on their tier); one the card covers, left for the release or the close (renderFast's behindEnts)
	const [inSight,covered]=await page.evaluate(()=>{ const m=document.querySelector('.mbox').getBoundingClientRect(), rows=[...document.querySelectorAll('.ent[data-s]')].filter(e=>{ const r=e.getBoundingClientRect(); return e.querySelector('.nrg')&&r.width&&r.top>80&&r.bottom<innerHeight-20 })
		const out=e=>{ const r=e.getBoundingClientRect(); return r.right>m.right+1||r.left<m.left-1 }
		return [rows.find(out)?.dataset.s,rows.find(e=>!out(e))?.dataset.s] })
	assert.ok(inSight&&covered,'a row in sight round the card, and one under it')
	// a plane zoomed (a pinch: ctrl+wheel) repaints its field, never a stylesheet: a stylesheet changed restyles the whole
	// page – a zoom once ran at a frame a second on a code plate re-highlighted each frame (lighthigh 1.0: a sheet a paint)
	{	const rules = () => page.evaluate(() => document.querySelectorAll('style').length + [...document.adoptedStyleSheets].reduce((n, x) => n + x.cssRules.length, 0)), before = await rules()
		const pb = await page.locator('#detail .pl').first().boundingBox(); await page.mouse.move(pb.x + pb.width / 2, pb.y + pb.height / 2)
		await page.keyboard.down('Control'); for (let k = 0; k < 6; k++) { await page.mouse.wheel(0, -40); await page.waitForTimeout(40) } await page.keyboard.up('Control')
		await page.waitForTimeout(300)
		assert.equal(await rules(), before, 'zooming a plane adds no stylesheet or rule – the code plate repaints only when its text changes, and then moves ranges')
		await page.keyboard.down('Control'); for (let k = 0; k < 6; k++) await page.mouse.wheel(0, 40); await page.keyboard.up('Control') }   // the view back to full by the same pinch – a press on the plane would take its color
	// a dossier gone gives its plates' highlights back: every dossier builds its own plates, and each one's stylesheet once
	// stayed behind it – a stylesheet more a dossier opened, each a whole-page restyle (the deploy's bake ran out its 6 h on them)
	{	const reopen = (s) => page.evaluate((s) => new Promise((ok) => { document.getElementById('mx').click(); document.querySelector(`.ent[data-s="${s}"] .nm`).click()
			requestAnimationFrame(() => requestAnimationFrame(ok)) }), s)
		const held = () => page.evaluate(() => [document.querySelectorAll('style[data-lighthigh]').length, CSS.highlights.size])
		await reopen('lab'); const n0 = await held()
		for (const s of ['hsl', 'xyz', 'oklab', 'lab']) await reopen(s)
		assert.deepEqual(await held(), n0, 'reopened dossiers hold no more highlight stylesheets or highlights than one did')
		await reopen('oklch'); await page.waitForFunction(() => /OKLCH/i.test(document.getElementById('dtitle')?.textContent)) }
	assert.match(await page.locator('#detail .dgrid2').evaluate(el => el.textContent), /made for\s*The polar form CSS adopted/, 'the lore line says what the space was made for, sentence-cased')
	assert.equal(await page.locator('#cseg').evaluate(el=>getComputedStyle(el).getPropertyValue('--cur').trim().toLowerCase()),(await page.locator('#cd').inputValue()).toLowerCase(),'dynamic dossier tabs receive the scoped current color')
	const mode=async value=>{ await lens(page,'q',value)   // Draw's menu option, through the page's own handler
		await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))) }
	// the void's edges (what no light can be): the catalog's hard stops where alpha crosses 0, the dossier bar's alpha < 20
	// a space past its family's fold: the family unfolded by its "more" (a no-op once open) – a held-back tile is never painted
	const unfold=s=>page.evaluate(s=>{ const sec=document.querySelector(`.ent[data-s="${s}"]`).closest('.sec'); if(!sec.classList.contains('open')) sec.querySelector('.more').click() },s)
	const sliderBoundaryParity=async s=>page.evaluate(s=>[...document.querySelector(`.ent[data-s="${s}"]`).querySelectorAll('.ch')].every((ch,i)=>{ const bg=ch._gradStack?.at(-1)?.style.background||ch.style.background||''
		const st=[...bg.matchAll(/rgb\(([^)]*)\)\s+([\d.]+)%/g)].map(m=>{ const am=m[1].match(/\/\s*([\d.]+)/); return { a:am?+am[1]:1, p:+m[2] } })
		const css=st.filter((x,k)=>k&&Math.abs(x.p-st[k-1].p)<1e-6&&(x.a===0)!==(st[k-1].a===0)).map(x=>x.p)
		const c=document.querySelector(`.bar2[data-i="${i}"] .bgc`), d=c.getContext('2d').getImageData(0,0,c.width,c.height).data, gpu=[]; let a=d[3]>=20
		for(let x=1;x<c.width;x++){ const next=d[x*4+3]>=20; if(next!==a){ gpu.push(x/c.width*100); a=next } }
		return css.length===gpu.length&&css.every((x,k)=>Math.abs(x-gpu[k])<.6) }),s)
	await mode('names')
	const paletteLane=page.locator(`.ent[data-s="${inSight}"] .ch`).first(); await page.waitForFunction(inSight=>{ const el=document.querySelector(`.ent[data-s="${inSight}"] .ch`); return (el._g||el.closest('.ent').dataset.g||'').endsWith(':names:oklab') },inSight)
	const paletteBefore={color:await page.locator('#cd').inputValue(),key:await paletteLane.evaluate(el=>el._g||el.closest('.ent').dataset.g)}
	await lens(page,'m','de76')
	await page.waitForFunction(([before,s])=>{ const el=document.querySelector(`.ent[data-s="${s}"] .ch`), key=el._g||el.closest('.ent').dataset.g||''; return key!==before&&key.endsWith(':names:de76') },[paletteBefore.key,inSight])
	const paletteAfter={color:await page.locator('#cd').inputValue(),key:await paletteLane.evaluate(el=>el._g||el.closest('.ent').dataset.g)}
	assert.equal(paletteAfter.color,paletteBefore.color,'an exact named color stays fixed across palette metrics')
	assert.notEqual(paletteAfter.key,paletteBefore.key,'a palette metric change repaints background gradients even when the color stays fixed')
	assert.match(paletteAfter.key,/:names:de76$/,'settled catalog gradients carry the new palette metric')
	await lens(page,'m','oklab'); await mode('smooth')
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
	await page.evaluate(()=>document.querySelector('#figseg button[data-v="tc"]').click()); await page.waitForFunction(()=>document.querySelector('#tcap').textContent.trim())   // the transfer curve shown: a figure draws where it is seen
	// 18% gray on the curve: a mark like any color's, over the line and saying what it is – a hollow notch painted into the
	// plot read as a dot the curve crossed out (2026-11)
	{	await page.waitForFunction(()=>{ const g=document.querySelector('.tcvw .sto'); return g&&!g.hidden })
		const m=await page.evaluate(()=>{ const g=document.querySelector('.tcvw .sto'); g.scrollIntoView({block:'nearest'})
			const q=g.getBoundingClientRect(), at=document.elementFromPoint(q.x+q.width/2,q.y+q.height/2)
			return { head:g.dataset.tipHead, tip:g.dataset.tip, left:parseFloat(g.style.left), top:parseFloat(g.style.top), over:at===g, size:q.width } })
		const enc=+(/([\d.]+)\s*$/.exec(m.tip)||[])[1]
		assert.ok(/18/.test(m.head)&&/18/.test(m.tip)&&enc>0&&enc<1,`the transfer curve marks 18% gray and says so (${m.head} / ${m.tip})`)
		assert.ok(m.over&&m.size>=3&&Math.abs(m.left-(40+.18*279)/320*100)<.5&&Math.abs(m.top-(155-enc*154)/176*100)<.6,`the mark sits on the curve at linear 18%, over its line (${m.left}%, ${m.top}%, encoded ${enc})`) }
	const smoothNeighbor=page.locator('.bar2[data-i="1"] .bgc'), smoothBefore=await smoothNeighbor.evaluate(el=>el.toDataURL()), transferBefore=await page.locator('#tcap').innerText()
	const backPicker=page.locator(`.ent[data-s="${inSight}"] .nrg`).first(), backValues=()=>page.evaluate(s=>[...document.querySelectorAll(`.ent[data-s="${s}"] .cv`)].map(el=>el.value).join(' '),inSight), backLane=page.locator(`.ent[data-s="${inSight}"] .ch`).first()
	const smoothL=page.locator('.bar2[data-i="0"]'), smoothLR=await smoothL.boundingBox()
	await page.mouse.move(smoothLR.x+smoothLR.width*.36,smoothLR.y+smoothLR.height/2); await page.mouse.down(); await page.waitForTimeout(20)
	const backMid={picker:await backPicker.inputValue(),pickerColor:await backPicker.evaluate(el=>getComputedStyle(el).getPropertyValue('--tkc')),value:await backValues(),gradient:await backLane.evaluate(el=>el._g||el.closest('.ent').dataset.g)}, smoothMid=await smoothNeighbor.evaluate(el=>el.toDataURL())
	await page.mouse.move(smoothLR.x+smoothLR.width*.46,smoothLR.y+smoothLR.height/2)
	for(let n=0;n<30&&await smoothNeighbor.evaluate((el,before)=>el.toDataURL()===before,smoothMid||smoothBefore);n++) await page.waitForTimeout(10)
	assert.equal(await page.locator('#bigch .nv').first().inputValue(),'0.46','dossier numeric input follows a smooth drag live')
	assert.notEqual(await smoothNeighbor.evaluate(el=>el.toDataURL()),smoothMid||smoothBefore,'dossier neighboring gradients follow the active space live')
	assert.notEqual(await page.locator('#tcap').innerText(),transferBefore,'transfer picker follows a held drag')
	await page.evaluate(()=>{ document.querySelector('#figseg button[data-v="3d"]').click(); try{ localStorage.removeItem('csFig') }catch{} })   // the solid back, as the checks below found it
	assert.notEqual(await backPicker.inputValue(),backMid.picker,'dossier drag updates every background catalog picker immediately')
	assert.notEqual(await backPicker.evaluate(el=>getComputedStyle(el).getPropertyValue('--tkc')),backMid.pickerColor,'dossier drag updates every background picker color immediately')
	assert.equal((await backPicker.evaluate(el=>getComputedStyle(el).getPropertyValue('--tkc').trim().toLowerCase())),(await page.locator('#cd').inputValue()).toLowerCase(),'background picker colors match the modal drag color')
	await page.waitForFunction(([v,s])=>[...document.querySelectorAll(`.ent[data-s="${s}"] .cv`)].map(el=>el.value).join(' ')!==v,[backMid.value,inSight],{timeout:1500}).catch(()=>{})   // the row's numbers, not its first: a hue's stays 0 on the gray this drags
	assert.notEqual(await backValues(),backMid.value,'dossier drag updates background catalog numbers on their 250 ms tier')
	await page.waitForFunction(([g,s])=>{ const el=document.querySelector(`.ent[data-s="${s}"] .ch`); return (el._g||el.closest('.ent').dataset.g)!==g },[backMid.gradient,inSight],{timeout:1500}).catch(()=>{})
	const backHeld=await backLane.evaluate(el=>el._g||el.closest('.ent').dataset.g)
	assert.notEqual(backHeld,backMid.gradient,'a dossier drag paints the catalog\'s strips behind it on their 250 ms tier, not only at the release')
	assert.equal(await page.evaluate(()=>document.querySelector('.veil').hidden),false,'a held mouse drag veils the page – one element\'s cursor:none, its marker the pointer')
	await page.mouse.up(); assert.equal(await page.evaluate(()=>document.querySelector('.veil').hidden),true,'the release lifts the veil at once: the cursor back before any settle')
	await page.waitForFunction(([h,s])=>{ const el=document.querySelector(`.ent[data-s="${s}"] .ch`), k=el._g||el.closest('.ent').dataset.g; return k!==h&&/:48:(vis|off):/.test(k) },[backMid.gradient,inSight],{timeout:3000}).catch(()=>{})   // the strips come from the sweep pool, a frame or so after
	const backReleased=await backLane.evaluate(el=>el._g||el.closest('.ent').dataset.g)
	assert.notEqual(backReleased,backMid.gradient,'dossier release lands the final color on the background catalog\'s strips')
	assert.match(backReleased,/:48:(vis|off):/,'…at full quality')
	const nativeCancel=await page.evaluate(async covered=>{ const r=document.querySelector('.bar2[data-i="1"] .nrg'), bar=r.closest('.bar2'), back=document.querySelector(`.ent[data-s="${covered}"] .ch`), frame=()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)))
		r.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:19,isPrimary:true})); r.value=+r.min+(+r.max-+r.min)*.37; r.dispatchEvent(new Event('input',{bubbles:true})); await frame(); const active=bar.classList.contains('live'), held=back._g||back.closest('.ent').dataset.g
		r.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:19,isPrimary:true})); await new Promise(r=>requestAnimationFrame(()=>setTimeout(()=>requestAnimationFrame(r)))); const parked=!bar.classList.contains('live'), key=()=>back._g||back.closest('.ent').dataset.g
		for(let t0=performance.now();key()===held&&performance.now()-t0<2000;) await new Promise(r=>requestAnimationFrame(r)); return {active,parked,held,after:key()} },covered)
	assert.equal(nativeCancel.active&&nativeCancel.parked,true,'pointer cancellation parks a native dossier slider')
	assert.notEqual(nativeCancel.after,nativeCancel.held,'native dossier cancellation lands the final color on the background strips')
	assert.match(nativeCancel.after,/:48:(vis|off):/,'…at full quality')
	await toCatalog(page)
	await page.locator('#cval').fill('#234567'); await page.waitForFunction(()=>document.querySelector('#cd').value.toLowerCase()==='#234567'); await page.locator('#cval').press('Enter')   // typed and committed: its suggestions shut, as a hand reaching for a slider shuts them
	assert.equal(await page.locator('#cd').inputValue(),'#234567','native pointer cancellation releases the dossier drag guard')
	const customCancel=await smoothL.evaluate(async (el,covered)=>{ const back=document.querySelector(`.ent[data-s="${covered}"] .ch`), r=el.getBoundingClientRect(), capture=el.setPointerCapture; el.setPointerCapture=()=>{}
		const pointer=(type,f)=>el.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:20,isPrimary:true,clientX:r.left+r.width*f,clientY:r.top+r.height/2}))
		pointer('pointerdown',.52); pointer('pointermove',.58); await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))); const active=el.classList.contains('live'), held=back._g||back.closest('.ent').dataset.g
		pointer('pointercancel',.58); el.setPointerCapture=capture; await new Promise(r=>requestAnimationFrame(()=>setTimeout(()=>requestAnimationFrame(r)))); const parked=!el.classList.contains('live'), key=()=>back._g||back.closest('.ent').dataset.g
		for(let t0=performance.now();key()===held&&performance.now()-t0<2000;) await new Promise(r=>requestAnimationFrame(r)); return {active,parked,held,after:key()} },covered)
	assert.equal(customCancel.active&&customCancel.parked,true,'pointer cancellation parks a custom dossier slider')
	assert.notEqual(customCancel.after,customCancel.held,'custom dossier cancellation lands the final color on the background strips')
	assert.match(customCancel.after,/:48:(vis|off):/,'…at full quality')
	await toCatalog(page)
	await page.locator('#cval').fill('#345678'); await page.waitForFunction(()=>document.querySelector('#cd').value.toLowerCase()==='#345678'); await page.locator('#cval').press('Enter')   // typed and committed: its suggestions shut, as a hand reaching for a slider shuts them
	assert.equal(await page.locator('#cd').inputValue(),'#345678','custom pointer cancellation releases the dossier drag guard')
	await mode('web')
	const safeHex=await page.locator('#cd').inputValue(), safeRgb=[1,3,5].map(i=>parseInt(safeHex.slice(i,i+2),16))
	assert.equal(safeRgb.every(v=>v%51===0),true,'safe mode lands on the 216-color web-safe lattice')
	await mode('10')
	const lbar=page.locator('.bar2[data-i="0"]'), lr=await lbar.boundingBox()
	await page.mouse.move(lr.x+lr.width*.27,lr.y+lr.height/2); await page.mouse.down(); await page.waitForTimeout(30)
	assert.equal(await page.locator('#bigch .nv').first().inputValue(),'0.27','quantized slider moves continuously while held')
	await page.mouse.up(); await page.waitForFunction(()=>{ const el=document.querySelector('.ent[data-s="oklch"] .ch'); return /^oklch\|0\.25,.*:0:48:vis:10$/.test(el._g||el.closest('.ent').dataset.g) },null,{timeout:3000}).catch(()=>{})
	assert.match(await page.locator('.ent[data-s="oklch"] .ch').first().evaluate(el=>el._g||el.closest('.ent').dataset.g),/^oklch\|0\.25,.*:0:48:vis:10$/,'release repaints catalog ranges from the final snapped value')
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
	await lens(page,'g','vis')
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
	assert.equal(validityEdges.mainVoid&&validityEdges.mainGhost&&validityEdges.dossierVoid&&validityEdges.dossierGhost,true,'catalog gradients take the Surface limit the held dossier shows')
	await page.mouse.up(); await page.waitForTimeout(700)
	const settledEdges=await page.evaluate(()=>{ const main=document.querySelector('.ent[data-s="oklch"] .ch[data-i="0"]'), c=document.querySelector('.bar2[data-i="0"] .bgc'), bg=main._gradStack?.at(-1)?.style.background||main.style.background||''
		const p=[...bg.matchAll(/([\d.]+)%/g)].map(m=>+m[1]), hard=p.filter((x,i)=>i&&Math.abs(x-p[i-1])<1e-6), d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; let first=-1
		for(let x=0;x<c.width;x++)if(d[x*4+3]>=20){ first=x; break }
		return {main:hard[0],dossier:first/c.width*100} })
	assert.equal(isFinite(settledEdges.main)&&Math.abs(settledEdges.main-settledEdges.dossier)/100<.03,true,'Light catalog and limited dossier share the same locus boundary')
	await lens(page,'g','vis')   // restore the dossier default
	// the exporters ride the plates rail: label + target select + download buttons
	assert.match(await page.locator('#dex').innerText(), /conversion lut/i, 'LUT block rides the dossier rail')
	assert.equal(await page.locator('#dex #dldl').count() + await page.locator('#dex #didl').count(), 2, 'cube + icc downloads present')
	await page.keyboard.press('Escape')
	await page.waitForFunction(() => document.querySelector('#modal')?.hidden === true)
	assert.equal(await trigger.evaluate(el => document.activeElement === el), true, 'dossier restores focus')

	// Palette coordinates may exceed a space's declared instrument range. RGB remains
	// authoritative across mode changes: HPLuv used to retain S=196 after even→smooth,
	// punching transparent holes into its H×L plane.
	// HPLuv sits past its family's fold: its "more" first – the unfolded tiles take a press like any other
	const hpMore=page.locator('.sec:has(.ent[data-s="hpluv"]) .more'); await hpMore.click()
	assert.equal(await page.locator('.ent[data-s="atd95"]').isVisible(),true,'a family\'s "more" unfolds the spaces it held back')   // its last – HPLuv now leads the secondaries
	await page.locator('.ent[data-s="hpluv"] .nm').click(); await page.waitForSelector('#modal:not([hidden]) #dtitle')
	await mode('jnd'); await mode('smooth')
	assert.equal(+(await page.locator('#bigch .nv').nth(1).inputValue())<=100,true,'HPLuv even→smooth keeps saturation in range')
	// polled, not read after two frames: a loaded runner can land the repaint later (it read a still-blank canvas, every
	// pixel void); holes that persist – the bug – still fail, with their count
	const hpVoid=await page.locator('.pl[data-a="0"][data-b="2"] canvas').evaluate(c=>new Promise(ok=>{ const end=performance.now()+10000
		const tick=()=>{ const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; let n=0; for(let i=3;i<d.length;i+=4) if(d[i]<10)n++
			n&&performance.now()<end?requestAnimationFrame(tick):ok(n) }; tick() }))
	assert.equal(hpVoid,0,'HPLuv H×L plane remains complete after even→smooth')
	await page.locator('#mx').click(); await page.waitForFunction(()=>document.querySelector('#modal')?.hidden === true)
	await hpMore.click(); assert.equal(await page.locator('.ent[data-s="atd95"]').isVisible(),false,'and "Less" folds them back')

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

	await unfold('tsl'); await page.locator('.ent[data-s="tsl"] .nm').click(); await page.waitForSelector('#detail .bar2')   // past its family's fold, as DKL below
	for(const [i,v] of [[2,'107'],[1,'0.63'],[0,'45']]){ await page.locator('.bar2 .nrg').nth(i).fill(v); await page.waitForTimeout(100) }
	await page.waitForFunction(()=>document.querySelector('.ent[data-s="tsl"]')?.dataset.g?.startsWith('tsl|45,0.63,107'))
	assert.equal(await sliderBoundaryParity('tsl'),true,'TSL T 45° S 0.63 L 107 has identical catalog and dossier limits')
	await page.locator('#mx').click(); await page.waitForFunction(()=>document.querySelector('#modal')?.hidden === true)

	// DKL is contrast around a mid-linear adapting background. The old white-relative,
	// one-sided ranges collapsed its fields into nearly flat strips.
	await unfold('dkl'); await page.locator('.ent[data-s="dkl"] .nm').click(); await page.waitForSelector('#detail .pl')
	assert.deepEqual(await page.locator('.bar2 .nrg').evaluateAll(rs=>rs.map(r=>[+r.min,+r.max])),[[-1,1],[-1.7,1.7],[-1.85,1.85]],'DKL exposes signed cardinal-axis ranges')
	for(let i=0;i<3;i++)await page.locator('.bar2 .nrg').nth(i).fill('0')
	await page.waitForFunction(()=>[...document.querySelectorAll('#detail .pl > canvas:first-child')].every(c=>{ const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data, colors=new Set; let opaque=0; for(let i=0;i<d.length;i+=4)if(d[i+3]>20){ opaque++; colors.add((d[i]>>4)+'|'+(d[i+1]>>4)+'|'+(d[i+2]>>4)) } return opaque>1000&&colors.size>100 }))
	await page.locator('#mx').click(); await page.waitForFunction(()=>document.querySelector('#modal')?.hidden === true)

	await page.goto(`${server.origin}/oklch?sw&cb=${Date.now()}`, { waitUntil: 'networkidle' })
	await page.waitForSelector('#modal:not([hidden]) #dtitle')
	assert.match(await page.locator('link[rel="canonical"]').getAttribute('href'), /\/oklch$/, 'direct dossier has its canonical URL')
	// the figure by the sliders: one at a time, switched, remembered. A hidden plate has no width – the solid must not
	// size itself by one (it once shrank to a dot), and a plate shown is painted at its own size, the locus's marks on it
	assert.deepEqual(await page.locator('#figseg button').evaluateAll(bs=>bs.map(b=>b.dataset.v)), ['3d','xy','tc'], 'oklch offers the solid, the xy plate and the transfer curve')
	await page.evaluate(()=>{ try{ localStorage.removeItem('csFig') }catch{} })
	await page.locator('#figseg button[data-v="3d"]').click()
	await page.waitForFunction(()=>document.querySelector('#pl3d .mesh3')?._scale3>0)
	assert.ok(await page.evaluate(()=>document.querySelector('#pl3d .mesh3')._scale3>0.3), 'the solid keeps its own size while the plates hide')
	await page.locator('#figseg button[data-v="xy"]').click()
	assert.deepEqual(await page.evaluate(()=>{ const g=document.querySelector('#gam2d'); return [document.querySelector('#dfig').dataset.v, g.clientWidth>200, g.querySelector('canvas').width>=g.clientWidth, g.querySelectorAll('.gxy :is(.lg,.glim)').length, [...g.querySelectorAll('.gxy text')].some(t=>t.textContent==='520'), !!document.querySelector('#pl3d').closest('#gam2d')&&!g.classList.contains('lift')&&getComputedStyle(document.querySelector('#pl3d .mesh3')).visibility==='hidden', localStorage.csFig] }),
		['xy',true,true,0,true,true,'xy'], 'xy shown alone, painted at its size, ticked, no reference triangle on it – the solid under it, unseen while it lies flat; the choice remembered')
	// a drag lifts the plate into xyY: the plate the floor, turned with it, the solid over it; a double click lays it flat
	{ await page.locator('#gam2d').scrollIntoViewIfNeeded(); const b=await page.locator('#gam2d').boundingBox(), x=b.x+b.width/2, y=b.y+b.height/2
		await page.mouse.move(x,y); await page.mouse.down(); for(let k=1;k<=8;k++){ await page.mouse.move(x+k*3,y-k*8); await page.waitForTimeout(16) }
		await page.waitForTimeout(200); await page.mouse.up()
		await page.waitForFunction(()=>document.querySelector('#gam2d').classList.contains('lift')&&document.querySelector('#pl3d .mesh3')._scale3>0)
		assert.deepEqual(await page.evaluate(()=>[/^matrix\(/.test(document.querySelector('#gam2d .flr').style.transform), getComputedStyle(document.querySelector('#pl3d .mesh3')).visibility, getComputedStyle(document.querySelector('#gam2d .flr .cx')).visibility]),
			[true,'visible','hidden'], 'a drag lifts the plate: its floor turned, the solid shown, the plate\'s own marks given to the solid\'s')
		await page.locator('#gam2d').dblclick(); await page.waitForTimeout(100)
		assert.deepEqual(await page.evaluate(()=>[document.querySelector('#gam2d').classList.contains('lift'), document.querySelector('#gam2d .flr').style.transform]), [false,''], 'a double click lays the plate flat again') }
	await page.locator('#figseg button[data-v="3d"]').click()
	await page.locator('#mx').click()
	await page.waitForFunction(() => document.querySelector('#modal')?.hidden === true)

	// the definition a searcher comes for: the channels at the head of the record's first column, the origin beside them;
	// the primaries (x and y named as a channel is, the white its mark) the first column's last item, the matrix the
	// second's, its copy beside its label; the curve's
	// formula under its plot; every label saying what it is; the tested values behind their sources; OCIO carries the
	// whole colorspace; none of it where a space has no primaries
	await page.goto(`${server.origin}/sgamut3cine?sw&cb=${Date.now()}`, { waitUntil: 'networkidle' })
	await page.waitForSelector('#modal:not([hidden]) .props [data-k="primaries"]')
	assert.deepEqual(await page.evaluate(()=>{ const n=s=>s.replace(/[\u2007\u2008]/g,'').trim(), cells=[...document.querySelectorAll('[data-k="primaries"] .xylist > *')].map(e=>n(e.textContent))
		const cols=[...document.querySelector('.props:not(.dside)').querySelectorAll(':scope>.pcol')]
		return [cols.map(c=>c.firstElementChild?.dataset.k), cols.map(c=>c.lastElementChild?.dataset.k), cells.slice(0,4), cells.slice(-4), !!document.querySelector('[data-k="primaries"] .wdot'),
			[...document.querySelectorAll('.props:not(.dside) [data-k] i.term')].every(i=>i.title), document.querySelectorAll('[data-k="matrix"] .mtx > span').length, document.querySelector('#mtxc').textContent.split('\n').length, !!document.querySelector('[data-k="matrix"] .dlab > .cpyi[data-copy="mtxc"]')] }),
		[['channels','origin'], ['primaries','matrix'], ['R','x0.766','y0.275',''], ['','x0.3127','y0.329','D65'], true, true, 9, 3, true], 'S-Gamut3.Cine: the channels and the origin heading the record\'s columns, the primaries and the matrix closing them, each label explained, the white its mark, the matrix copied from beside its label')
	assert.deepEqual(await page.evaluate(()=>[[...document.querySelectorAll('[data-k="test"] a')].some(a=>/→/.test(a.title)), !document.querySelector('#modal [data-k="report"],#modal .drep'), !document.querySelector('#cseg [data-t="css"],#cseg [data-t="mtx"]')]),
		[true, true, true], 'the test names its sources, the values in their tips; no report link; no CSS or matrix code tab')
	await page.locator('#cseg button[data-t="ocio"]').click()
	assert.match(await page.locator('#snip').textContent(), /!<ColorSpace>[\s\S]*!<LogCameraTransform>[\s\S]*!<MatrixTransform>/, 'OCIO: S-Gamut3.Cine as a whole colorspace, its S-Log3 curve then its matrix')
	await page.locator('#cseg button[data-t="js"]').click()
	// the solid marks an RGB space's own primaries whatever the Limit – S-Gamut3.Cine's lie past every display's volume, and
	// held to it 37 of the 92 RGB spaces showed none under any Limit. A space inside the volume (RYB) holds none of the
	// volume's corners: its body is its own box
	{	const [fig, gm] = await page.evaluate(() => [localStorage.csFig ?? null, localStorage.csGm ?? null])
		const marks = async () => { await page.evaluate(() => document.querySelector('#figseg button[data-v="3d"]')?.click())
			await page.waitForFunction(() => { const el = document.querySelector('.vgrp[data-f="3d"] #pl3d'); return el && !el.classList.contains('busy') })
			return page.evaluate(() => document.querySelectorAll('#pl3d .p3o .prm').length) }
		assert.equal(await marks(), 4, 'S-Gamut3.Cine: its three primaries and its white marked on the solid')
		await page.evaluate(() => { localStorage.csGm = 'srgb' })   // the next two under sRGB, whatever Limit the checks above left
		await page.goto(`${server.origin}/ryb?sw&cb=${Date.now()}`, { waitUntil: 'networkidle' })
		await page.waitForSelector('#modal:not([hidden]) #dtitle')
		assert.equal(await marks(), 0, 'RYB: none of the volume\'s corners marked on its box')
		const tones = async () => { const th = await page.evaluate(() => { const r = document.documentElement, was = r.dataset.theme; r.dataset.theme = 'light'; return was })   // over light paper, whatever theme the checks above left
			const png = (await page.locator('#pl3d').screenshot()).toString('base64'); await page.evaluate((was) => { document.documentElement.dataset.theme = was }, th)
			return page.evaluate(async (b64) => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
				const c = Object.assign(document.createElement('canvas'), { width: img.width, height: img.height }), x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0)
				const d = x.getImageData(0, 0, c.width, c.height).data; let dark = 0, vivid = 0
				for (let i = 0; i < d.length; i += 4) { const hi = Math.max(d[i], d[i+1], d[i+2]); if (hi < 48) dark++; if (hi - Math.min(d[i], d[i+1], d[i+2]) > 80) vivid++ }
				return [dark / (d.length / 4), vivid / (d.length / 4)] }, png) }
		// …and that box IS drawn: its caps are its body (masked as faces the volume lies along, every one of them went, and the figure stood empty)
		{ let ryb = await tones(); for (const end = Date.now() + 60000; ryb[1] < .1 && Date.now() < end; ryb = await tones()) await page.waitForTimeout(250)
			assert.ok(ryb[1] >= .1, `RYB: its box drawn (colored ${(ryb[1] * 100).toFixed(1)}% of the figure)`) }
		// OSA-UCS: the body is cut at its lightness floor – its black lies at L −13.5 under the −10 floor, and uncut the
		// near-blacks fanned out under it, a black slab as wide as the box (14% of the figure near-black; cut, a quarter percent)
		await page.goto(`${server.origin}/osaucs?sw&cb=${Date.now()}`, { waitUntil: 'networkidle' })
		await page.waitForSelector('#modal:not([hidden]) #dtitle'); await marks()
		let tone = await tones(); for (const end = Date.now() + 60000; tone[1] < .02 && Date.now() < end; tone = await tones()) await page.waitForTimeout(250)   // its kernel links first
		assert.ok(tone[1] >= .02 && tone[0] < .03, `OSA-UCS: its solid drawn, no slab of black under its floor (near-black ${(tone[0] * 100).toFixed(1)}%, colored ${(tone[1] * 100).toFixed(1)}%)`)
		// Nayatani 95 under Display P3: a cut is the body's own cross-section – its chroma wall under L 12, where any chroma
		// reads as the gray, is none of the body's, and drew a black ring round its foot (4% of the figure near-black)
		await page.evaluate(() => { localStorage.csGm = 'p3' })
		await page.goto(`${server.origin}/nayatani95?sw&cb=${Date.now()}`, { waitUntil: 'networkidle' })
		await page.waitForSelector('#modal:not([hidden]) #dtitle'); await marks()
		tone = await tones(); for (const end = Date.now() + 60000; tone[1] < .02 && Date.now() < end; tone = await tones()) await page.waitForTimeout(250)
		assert.ok(tone[1] >= .02 && tone[0] < .012, `Nayatani 95: its solid drawn, no black ring round its foot (near-black ${(tone[0] * 100).toFixed(1)}%, colored ${(tone[1] * 100).toFixed(1)}%)`)
		// …and under Light: a cut is the wall where the body's own sheets say it is inside – no color read off the wall's
		// coordinates, which under L 12 are the gray's whatever their chroma (tested by the pixel against the locus alone, the
		// ring floated under the foot again: 6.2% of the figure near-black; 2.0% is the body's own dark lights)
		await page.evaluate(() => { localStorage.csGm = 'locus' })
		await page.goto(`${server.origin}/nayatani95?sw&cb=${Date.now()}`, { waitUntil: 'networkidle' })
		await page.waitForSelector('#modal:not([hidden]) #dtitle'); await marks()
		tone = await tones(); for (const end = Date.now() + 60000; tone[1] < .02 && Date.now() < end; tone = await tones()) await page.waitForTimeout(250)
		assert.ok(tone[1] >= .02 && tone[0] < .035, `Nayatani 95 under Light: its solid drawn, no black ring under its foot (near-black ${(tone[0] * 100).toFixed(1)}%, colored ${(tone[1] * 100).toFixed(1)}%)`)
		await page.evaluate(([fig, gm]) => { for (const [k, v] of [['csFig', fig], ['csGm', gm]]) try { v == null ? localStorage.removeItem(k) : localStorage[k] = v } catch {} }, [fig, gm]) }
	await page.goto(`${server.origin}/prophoto?sw&cb=${Date.now()}`, { waitUntil: 'networkidle' })
	await page.waitForSelector('#modal:not([hidden]) .vgrp[data-f="tc"] .tform', { state: 'attached' })
	assert.match(await page.locator('.vgrp[data-f="tc"] .tform').textContent(), /L = V \/ 16[\s\S]*L = V1\.8/, 'ProPhoto: the ROMM curve as its formula, a branch a line, under its plot')
	await page.goto(`${server.origin}/xyb?sw&cb=${Date.now()}`, { waitUntil: 'networkidle' })
	await page.waitForSelector('#modal:not([hidden]) #dtitle')
	assert.deepEqual(await page.evaluate(()=>[!!document.querySelector('.props [data-k="channels"]'), !!document.querySelector('.props [data-k="primaries"],.props [data-k="matrix"]'), !!document.querySelector('#cseg [data-t="ocio"]')]), [true, false, false], 'XYB: its channels alone, no definition numbers, no OCIO tab')
	await page.locator('#mx').click()
	await page.waitForFunction(() => document.querySelector('#modal')?.hidden === true)

	// the canonical exact-coords form: path opens the dossier, the hash carries the space's
	// own coordinates and notation – one grammar for "a color" and "a color in this space"
	await page.goto(`${server.origin}/oklab?sw&cb=${Date.now()}#oklab(0.6 0.1 -0.05)`, { waitUntil: 'networkidle' })
	await page.waitForSelector('#modal:not([hidden]) #dtitle')
	assert.match(await page.locator('#dtitle').innerText(), /oklab/i, 'path + notation hash opens the dossier')
	assert.match(await page.locator('#cval').inputValue(), /^oklab\(0\.6/, 'with the exact coordinates, in that notation')
	// ⌥ held over an instrument: the color there weighed against the one held, as Figma measures (js/ruler.js) – on a plane
	// a solid line along each channel from the held color's mark, each with its step, and dashed ones back from the color
	// weighed; in a corner the contrast and where the color stands; on the held color's own mark, contrast 1:1; ⌥ let go,
	// all gone. On a catalog strip, the two at the pointer
	{	const readout=()=>page.evaluate(()=>{ const r=document.querySelector('#detail .pl .ruler'); if(!r) return null
			return { d:r.querySelector('.rs').getAttribute('d'), dash:r.querySelector('.rd').getAttribute('d'), steps:[...r.querySelectorAll('.rl')].map(e=>e.textContent), knob:!!r.querySelector('.rk'), readout:[...r.querySelectorAll('.ro b')].map(e=>e.textContent), red:getComputedStyle(r.querySelector('.ro b')).backgroundColor } })
		const pl=page.locator('#detail .pl').first(), cx=await pl.locator('.cx').boundingBox(), pb=await pl.boundingBox()
		await page.keyboard.down('Alt')
		await page.mouse.move(cx.x+cx.width/2,cx.y+cx.height/2)
		const same=await readout()
		await page.mouse.move(pb.x+pb.width*0.9,pb.y+pb.height*0.1)
		const far=await readout()
		await page.keyboard.up('Alt'); await page.mouse.move(pb.x+pb.width*0.9+1,pb.y+pb.height*0.1)
		const gone=await readout()
		assert.ok(same&&same.readout[0]==='1.00:1', `⌥ on the held color's own mark: contrast 1:1 (${JSON.stringify(same)})`)
		assert.ok(far&&/^M[\d.]+ [\d.]+(H|A)/.test(far.d)&&/^M/.test(far.dash)&&far.steps.every(t=>/^\S+ [+−]/.test(t))&&!far.knob&&far.readout.length>=1&&far.red==='rgb(242, 72, 34)', `⌥ far from it on a plane: solid lines with their steps, dashed ones back, no knob, the readout, in Figma's measuring red (${JSON.stringify(far)})`)
		assert.ok(gone===null, `⌥ let go: the measurement gone (${JSON.stringify(gone)})`)
	}
	await page.locator('#mx').click()
	await page.waitForFunction(() => document.querySelector('#modal')?.hidden === true)
	{	const ch=page.locator('#cat .ent .ch').first(); await ch.scrollIntoViewIfNeeded(); const b=await ch.boundingBox()
		await page.keyboard.down('Alt'); await page.mouse.move(b.x+b.width*0.2,b.y+b.height/2)
		const on=await page.evaluate(()=>{ const t=document.getElementById('tip'); return t.classList.contains('on')&&/^([\d.]+:1|⚠)/.test(t.textContent) })
		await page.keyboard.up('Alt'); await page.mouse.move(b.x+b.width*0.2+1,b.y+b.height/2)
		assert.ok(on&&!(await page.evaluate(()=>document.getElementById('tip').classList.contains('on'))), '⌥ over a catalog strip: the readout, gone with ⌥')
		// a strip held: its number in the current color (.on) while the drag lasts – pointed at, before and after, the card's
		// unpicked line alone (the slider pointed at is the card's hover; the number itself pointed at, its own color)
		const ul=()=>ch.evaluate(c=>{ const i=+c.dataset.i, p=c.closest('.ent').querySelectorAll('.cv')[i]?.closest('.cvp'); return !!p?.classList.contains('on') })
		await page.mouse.move(b.x+b.width*0.3,b.y+b.height/2); await page.waitForTimeout(80)
		const before=await ul()
		await page.mouse.down(); await page.mouse.move(b.x+b.width*0.4,b.y+b.height/2,{steps:3})
		const held=await ul()
		await page.mouse.up(); await page.waitForTimeout(80)
		const after=await ul()
		assert.deepEqual([before,held,after],[false,true,false], 'a strip: pointed at, no pick; held, its number in the current color; let go, the unpicked line again')
	}
	// a plate's disc/square switch, there and back: the marker and the corner inks are the disc's own again – both were
	// once placed and sampled before the plate repainted (the marker on the square's geometry, the letters inked from
	// the square's corners)
	await page.goto(`${server.origin}/hsluv?sw&cb=${Date.now()}#ff8000`, { waitUntil: 'networkidle' })
	await page.waitForSelector('#modal:not([hidden]) .pl.polar .pmode')
	const plate = () => page.evaluate(() => { const pl = document.querySelector('#detail .pl:has(.pmode)'), cx = pl.querySelector('.cx')
		return [pl.classList.contains('polar'), cx.style.left, cx.style.top, ...['.laby', '.labx', '.pmode'].map(k => pl.querySelector(k).style.color)].join(' ') })
	await page.waitForFunction(() => document.querySelector('#detail .pl.polar .laby')?.style.color)
	await page.waitForTimeout(600)
	const plate0 = await plate()
	for (const polar of [false, true]) {
		await page.locator('#detail .pl:has(.pmode) .pmode').first().click()
		await page.waitForFunction(p => document.querySelector('#detail .pl:has(.pmode)').classList.contains('polar') === p, polar)
		await page.waitForTimeout(600)
	}
	assert.equal(await plate(), plate0, 'disc → square → disc: the marker and the corner inks are the disc\'s own again')
	await page.locator('#mx').click()
	await page.waitForFunction(() => document.querySelector('#modal')?.hidden === true)
	// a pole is a real color: HSL's L = 0 is black at every hue and saturation, so under a display limit the whole H × S
	// slice paints solid, never as the ghost of a fold (gl.js sameGLSL); HWB's w + b > 100 fold still ghosts
	const gm0 = await page.evaluate(() => { try { const g = localStorage.csGm; localStorage.csGm = 'srgb'; return g ?? null } catch { return null } })
	const ghosts = async (path) => {
		await page.goto(`${server.origin}/${path}`, { waitUntil: 'networkidle' })
		await page.waitForFunction(() => document.querySelector('#modal:not([hidden]) #detail .pl .laby')?.style.color)
		await page.waitForTimeout(600)
		return page.evaluate(() => [...document.querySelectorAll('#detail .pl')].map(pl => { const cv = pl.querySelector('canvas'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data
			let g = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 100 && d[i] < 160) g++
			return g / (d.length / 4) }))
	}
	assert.ok((await ghosts(`hsl?sw&cb=${Date.now()}#000000`)).every(g => g < 0.01), 'HSL at black: every plate solid, no ghost')
	assert.ok((await ghosts(`hwb?sw&cb=${Date.now()}#808080`)).every(g => g > 0.2), 'HWB at mid gray: the w + b > 100 fold still ghosts on every plate')
	await page.evaluate(g => { try { g == null ? localStorage.removeItem('csGm') : localStorage.csGm = g } catch {} }, gm0)
	await page.evaluate(() => location.hash = 'ff8000')   // hex notation back for the tests below

	// a tip waits for the pointer to REST on its element (#tip{--tip-delay}): a pointer gliding along a name raises none, its
	// rest does, and a press hides it till the pointer leaves – no element borrows another's shown tip
	{ await page.goto(`${server.origin}/?sw&cb=${Date.now()}#ff8000`, { waitUntil: 'load' }); await page.locator('.ent[data-s] .nm').first().waitFor(); await toCatalog(page)   // the catalog's own page – the ghosts above left a dossier over it (load, not networkidle: CI's network never idled there)
	  const nm=await page.evaluate(()=>{ const e=[...document.querySelectorAll('.ent[data-s] .nm')].find(e=>{ const r=e.getBoundingClientRect(); return r.top>120&&r.bottom<innerHeight-60&&r.width>60 }); e.addEventListener('click',ev=>{ ev.preventDefault(); ev.stopImmediatePropagation() },{ capture:true, once:true }); const r=e.getBoundingClientRect(); return [r.left,r.top+r.height/2,r.width] })   // its press tested, not its dossier opened
	  const tipOn=()=>page.evaluate(()=>document.getElementById('tip').classList.contains('on'))
	  await page.mouse.move(nm[0]+2,nm[1]); let glided=false
	  for(let k=0;k<=20;k++){ await page.mouse.move(nm[0]+2+(nm[2]-4)*k/20,nm[1]); await page.waitForTimeout(45); glided||=await tipOn() }
	  await page.waitForTimeout(900); const rested=await tipOn()
	  await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(900); const pressed=await tipOn()
	  await page.mouse.move(5,5)
	  assert.equal(glided,false,'a pointer gliding along a name raises no tip')
	  assert.equal(rested,true,'resting on it, its tip')
	  assert.equal(pressed,false,'a press hides it, and it stays hidden while the pointer stays') }
	// a slider's drag let go off the card keeps the card (the release over the veil once clicked the body: a backdrop close),
	// a right press on a slider hides no cursor and leaves no drag, and a press and release off the card still close it
	{ await page.evaluate(()=>document.querySelector('.ent[data-s="oklch"] .nm').click()); await page.locator('#detail .bar2').first().waitFor()
	  const keep={}
	  for(const sel of ['#detail .bar2 .nrg','#detail .bar2 .bg']){ const b=await page.locator(sel).first().boundingBox(), y=b.y+b.height/2
		await page.mouse.move(b.x+b.width*.5,y); await page.mouse.down(); await page.mouse.move(b.x+b.width*.3,y,{steps:5}); await page.mouse.move(20,y,{steps:8}); await page.mouse.up(); await page.waitForTimeout(150)
		keep[sel]=await page.evaluate(()=>!document.getElementById('modal').hidden&&!document.querySelector('#detail .bar2.live')) }
	  assert.deepEqual(keep,{'#detail .bar2 .nrg':true,'#detail .bar2 .bg':true},`a slider's drag let go off the card: the card stays, the drag ends (${JSON.stringify(keep)})`)
	  const b=await page.locator('#detail .bar2 .bg').first().boundingBox(), y=b.y+b.height/2
	  await page.mouse.move(b.x+b.width*.5,y); await page.mouse.down({button:'right'}); await page.mouse.move(b.x+b.width*.7,y,{steps:5})
	  const right=await page.evaluate(()=>({ veil:!document.querySelector('.veil').hidden, cursor:getComputedStyle(document.querySelector('#detail .bar2')).cursor, live:!!document.querySelector('#detail .bar2.live') }))
	  await page.mouse.up({button:'right'}); await page.keyboard.press('Escape')
	  assert.deepEqual(right,{ veil:false, cursor:'ew-resize', live:false },'a right press on a slider starts no drag and hides no cursor')
	  await page.evaluate(()=>{ if(document.getElementById('modal').hidden) document.querySelector('.ent[data-s="oklch"] .nm').click() }); await page.locator('#detail .bar2').first().waitFor()
	  await page.mouse.click(12,Math.round((await page.evaluate(()=>innerHeight))*.6)); await page.waitForTimeout(150)
	  assert.equal(await page.evaluate(()=>document.getElementById('modal').hidden),true,'a press and release off the card close it') }
	const mobile = await context.newPage()
	mobile.on('pageerror', error => errors.push(`mobile: ${error.message}`))
	await mobile.setViewportSize({ width: 390, height: 844 })
	await mobile.goto(`${server.origin}/?sw&cb=${Date.now()}`, { waitUntil: 'networkidle' })
	// a phone: headings are plain titles; a family shows its featured spaces and two rows of tiles, the rest behind its "more"
	const heading = mobile.locator('.shw').first()
	await heading.waitFor()
	assert.equal(await heading.getAttribute('role'), null, 'mobile category heading is a plain title')
	const fam = await mobile.evaluate(() => { const sec = document.querySelector('.sec')
		return { shown: [...sec.querySelectorAll('.ent')].filter(e => e.getBoundingClientRect().height > 0).map(e => e.dataset.s), more: sec.querySelector('.fold .more')?.getBoundingClientRect().height > 0, names: [...sec.querySelectorAll('.fns .nm')].filter(e => e.getBoundingClientRect().width > 0).length } })
	assert.deepEqual(fam.shown, ['rgb', 'p3', 'rec2020', 'lrgb', 'rec709'], 'a phone shows the family\'s featured spaces, then a second row of tiles')
	assert.equal(fam.more, true, 'and the rest behind its "more"')
	assert.equal(fam.names, 27, 'its line naming every one it holds back')
	assert.equal(await mobile.locator('.sec').first().locator('.lead .ent').count(), 1, 'a phone\'s one column leads each family with one featured space')
	// a tablet has no rail: the rail's four tabs ride the first heading, a phone's select hidden; a phone, the select alone
	{	const tabContext = await browser.newContext({ viewport: { width: 900, height: 1100 }, reducedMotion: 'reduce' }), tab = await tabContext.newPage()
		await tab.goto(`${server.origin}/?cb=${Date.now()}`, { waitUntil: 'load' }); await tab.waitForSelector('.sec .gtabh')
		assert.deepEqual(await tab.evaluate(() => [[...document.querySelectorAll('.sec .gtabh .gtag')].filter(b => b.offsetParent).map(b => b.dataset.g), getComputedStyle(document.querySelector('.gsel')).display]), [['family', 'purpose', 'author', 'era', 'bookmarks'], 'none'], 'a tablet: the four cuts and the bookmarks shelf as tabs in the first heading, no select')
		await tab.locator('.sec .gtabh .gtag[data-g="purpose"]').click(); assert.equal(await tab.evaluate(() => document.querySelector('#cat .sec')?.dataset.k), 'purpose.picking', 'its Purpose tab regroups')
		await tabContext.close() }
	assert.deepEqual(await mobile.evaluate(() => [document.querySelector('.sec .gtabh')?.offsetParent ?? null, getComputedStyle(document.querySelector('.gsel')).display !== 'none']), [null, true], 'a phone: the select, no tabs')
	// operating the grouping select must not raise its heading's explainer (tip.js stops
	// ancestor tips at form controls) — while the heading itself still explains
	await mobile.locator('.gsel').first().hover()
	await mobile.waitForTimeout(750)   // past the page's 600 ms tip delay (#tip{--tip-delay})
	assert.equal(await mobile.locator('#tip.on').count(), 0, 'the grouping select does not raise the section tip')
	assert.equal(await mobile.locator('.sec').first().locator('.stip').isVisible(), true, 'the heading still explains – its description under it, in words, not a tooltip beside them')
	// a phone: nothing in the row moves as the page scrolls – the color keeps its place, size and width from the hero into
	// the row (its clear × never slides), the count gives the row its room; the plugins live on the page and scroll away
	await mobile.evaluate(() => { location.hash = 'ef4a5f' }); await mobile.waitForFunction(() => document.getElementById('cd').value.toLowerCase() === '#ef4a5f')
	const still = await mobile.evaluate(async () => { const at = () => { const r = s => document.querySelector(s).getBoundingClientRect()
			return { x: Math.round(r('#cvx').left), font: getComputedStyle(document.getElementById('cval')).fontSize, w: Math.round(r('.hcolor>.cx').width), plug: Math.round(r('.hplug').top) } }
		const top = at(); scrollTo(0, 900); await new Promise(r => setTimeout(r, 300)); const docked = at(); scrollTo(0, 0); await new Promise(r => setTimeout(r, 100))
		return { top, docked, count: getComputedStyle(document.querySelector('.cells>.count')).display } })
	assert.deepEqual([still.docked.x, still.docked.font, still.docked.w], [still.top.x, still.top.font, still.top.w], 'a phone: the color keeps its place, size and width as it docks – its × never moves')
	assert.equal(still.count, 'none', 'the count gives the row its room on a phone')
	assert.ok(still.docked.plug < still.top.plug - 800, 'the plugins scroll away with the page, never pinned in the row')
	// a finger on a strip: going up or down is the page's scroll, the color untouched; going sideways takes the strip – the
	// whole way, however the finger drifts after; a tap picks where it lands
	const finger = await mobile.evaluate(async () => { const ch = document.querySelector('.ent[data-s="rgb"] .ch'); ch.scrollIntoView({ block: 'center' }); await new Promise(f => setTimeout(f, 200))
		const r = ch.getBoundingClientRect(), red = () => parseInt(document.getElementById('cd').value.slice(1, 3), 16); ch.setPointerCapture = () => {}
		const go = (type, fx, dy = 0) => ch.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 31, pointerType: 'touch', isPrimary: true, clientX: r.left + r.width * fx, clientY: r.top + r.height / 2 + dy }))
		const frame = () => new Promise(f => requestAnimationFrame(() => requestAnimationFrame(f)))
		const r0 = red(); go('pointerdown', .2); go('pointermove', .21, 18); go('pointercancel', .21, 18); await frame(); const scrolled = red()
		go('pointerdown', .2); go('pointermove', .3, 2); go('pointermove', .6, 30); go('pointerup', .6, 30); await frame(); const dragged = red()
		go('pointerdown', .9); go('pointerup', .9); await frame(); return { r0, scrolled, dragged, tapped: red() } })
	assert.equal(finger.scrolled, finger.r0, 'a finger going down a strip scrolls the page – the color untouched')
	assert.ok(Math.abs(finger.dragged - .6 * 255) <= 4, `a finger going sideways drags the strip, drifting after: R ${finger.dragged} ≈ ${.6 * 255}`)
	assert.ok(Math.abs(finger.tapped - .9 * 255) <= 4, `a tap picks where it lands: R ${finger.tapped} ≈ ${.9 * 255}`)
	await mobile.close()

	const motionContext=await browser.newContext({viewport:{width:800,height:600}}), motion=await motionContext.newPage()
	await motion.goto(`${server.origin}/?cb=${Date.now()}`,{waitUntil:'networkidle'})
	// the orbit starts a beat after load – polled, not read at a fixed moment: a loaded runner (CI's software GL) lands
	// its first frame later than a desktop does
	assert.ok(await motion.waitForFunction(()=>document.getElementById('cd').value!=='#808080',null,{timeout:8000}).then(()=>true,()=>false),'undefined gray enters its ambient color orbit')
	await motion.evaluate(async()=>{ document.getElementById('cat').scrollIntoView(); await new Promise(r=>setTimeout(r,300)) })   // the catalog, under the hero
	const ambientPicker=await motion.evaluate(()=>{ const hx=document.querySelector('#cd').value.toUpperCase()
		const colors=[...document.querySelectorAll('.ent .nrg')].filter(el=>{ const r=el.getBoundingClientRect(); return r.bottom>0&&r.top<innerHeight }).map(el=>getComputedStyle(el).getPropertyValue('--tkc').trim().toUpperCase())
		return {hx,colors} })
	assert.equal(ambientPicker.colors.length>0&&ambientPicker.colors.every(c=>c===ambientPicker.hx),true,'all visible slider pickers wear the animated color')
	const nameContext=await browser.newContext({viewport:{width:800,height:600}}), nameView=await nameContext.newPage()   // its OWN context: a second page in motionContext backgrounds the index, whose rAF pauses (CI caught the orbit unrepainted after typed input)
	await nameView.goto(`${server.origin}/oklch?cb=${Date.now()}`,{waitUntil:'networkidle'})
	await nameView.waitForFunction(()=>document.querySelector('#cd').value!=='#808080',null,{timeout:20000})   // a dossier's GL instruments make the first orbit frame late on software GL – wait for it, don't race it
	assert.equal(await nameView.locator('#cval').inputValue(),'','the orbit stays ambient on a name view – no value asserted, no URL written')
	assert.equal(new URL(nameView.url()).hash,'','the ambient orbit never writes the URL')
	// under the orbit a card's fields – its planes, its bars' sweeps – go in steps, each face cross-fading into the next, not
	// one a frame: each is a GPU kernel copied out of the shared canvas, and Safari and Firefox wait on the GPU at every copy
	// (thirty planes and sixty sweeps a second held their main thread). The thumbs move every frame
	{ const steps=await nameView.evaluate(async()=>{ const pl=document.querySelector('#detail .pl canvas'), bar=document.querySelector('#detail .bar2 .bgc'), nr=document.querySelector('#detail .bar2 .nrg'); let p=0, b=0, moves=0, v=nr.value
			const onP=()=>p++, onB=()=>b++; pl.addEventListener('present',onP); bar.addEventListener('present',onB)
			const t0=performance.now(); while(performance.now()-t0<1500){ await new Promise(r=>requestAnimationFrame(r)); if(nr.value!==v){ v=nr.value; moves++ } }
			pl.removeEventListener('present',onP); bar.removeEventListener('present',onB)
			const tw=pl.parentElement.querySelector('canvas.xf'), bt=bar.parentElement.querySelector('canvas.xf')
			return { p, b, moves, twin:!!tw&&tw.width===pl.width&&tw!==pl.parentElement.querySelector('canvas'), barTwin:!!bt, checker:tw?getComputedStyle(tw).backgroundImage!=='none':false } })
		assert.ok(steps.p>=1&&steps.p<=8&&steps.b>=1&&steps.b<=8,`the orbit's planes and bars repaint a step at a time, a few a second (${JSON.stringify(steps)})`)
		assert.ok(steps.twin&&steps.barTwin&&steps.checker,`each field keeps its last face on a twin over it, opaque on its own checker – the step a cross-fade (${JSON.stringify(steps)})`)
		assert.ok(steps.moves>steps.p,`the thumbs go on moving between the fields' steps (${JSON.stringify(steps)})`) }
	// the pinned row stays over a name view's card – its Limit, Quantize and Vision reach the dossier – at the top, paper,
	// live; closing the card leaves the first screen where it was
	assert.deepEqual(await nameView.evaluate(()=>{ const el=document.getElementById('strip'), st=getComputedStyle(el); return [st.position,st.visibility,el.inert,Math.round(el.getBoundingClientRect().top),getComputedStyle(el.firstElementChild).backgroundColor!=='rgba(0, 0, 0, 0)'] }),['sticky','visible',false,0,true],'the row stays, live and paper, over a first-screen card')
	await nameView.locator('#mx').click()
	assert.deepEqual(await nameView.evaluate(()=>[Math.round(document.getElementById('strip').getBoundingClientRect().top),scrollY]),[0,0],'closing the card leaves the first screen in place')
	assert.ok(await nameView.evaluate(async()=>{ scrollTo(0,600); await new Promise(r=>requestAnimationFrame(r)); const y=scrollY; scrollTo(0,0); return y>0&&getComputedStyle(document.body).overflowY!=='hidden' }),'a card landed on and closed leaves the page scrolling')
	// the card landed on is an entry of its own: closed, the atlas is the next; Back opens the card again, Forward closes it
	await nameView.waitForFunction(()=>location.pathname==='/')
	await nameView.goBack(); await nameView.waitForFunction(()=>!document.getElementById('modal').hidden&&location.pathname==='/oklch')
	await nameView.goForward(); await nameView.waitForFunction(()=>document.getElementById('modal').hidden&&location.pathname==='/')
	await nameContext.close()
	// a wide name view: its catalog builds behind the card at idle, and the rows in sight round the card move with the orbit
	// (the rows round a card once stayed measured from before the build – none – and stood still until the close)
	{	const wideContext=await browser.newContext({viewport:{width:1440,height:900}}), wide=await wideContext.newPage()
		await wide.goto(`${server.origin}/oklch?cb=${Date.now()}`,{waitUntil:'networkidle'})
		// the catalog builds at idle or within 2 s (ensureCat's ric) – then its ~650 rows, on CI's software GL a long task
		// of its own under the card's JS painters: 15 s at an eighth of a laptop's speed (CDP CPU throttling), measured
		await wide.waitForFunction(()=>document.querySelector('.ent[data-s] .nrg')&&document.querySelector('#cd').value!=='#808080',null,{timeout:45000})
		const side=await wide.evaluateHandle(()=>{ const m=document.querySelector('.mbox').getBoundingClientRect()
			return [...document.querySelectorAll('.ent[data-s] .nrg')].find(el=>{ const r=el.closest('.ent').getBoundingClientRect(); return r.width&&r.top>0&&r.bottom<innerHeight&&(r.right>m.right+1||r.left<m.left-1) }) })
		assert.ok(await side.evaluate(el=>!!el),'a wide name view shows catalog rows round its card')
		assert.ok(await wide.waitForFunction(el=>{ const c=getComputedStyle(el).getPropertyValue('--tkc'); return (el._c0??=c)!==c },side,{timeout:5000,polling:'raf'}).then(()=>true,()=>false),'the rows round a card landed on move with the orbit, the catalog built behind it')
		await wideContext.close() }
	await toCatalog(motion)
	await motion.locator('#cval').fill('#123456'); await motion.locator('#cval').press('Enter')   // typed and committed – its list shut, as a reader's next press on the page shuts it
	await motion.waitForFunction(()=>document.querySelector('#cd').value==='#123456',null,{timeout:10000})   // wait for the repaint, don't race it – a loaded runner paints later than 450ms
	await motion.waitForTimeout(400)
	assert.equal(await motion.locator('#cd').inputValue(),'#123456','authored color input stops the ambient orbit')   // …and it HOLDS: a still-running orbit would have moved on
	await motion.locator('.ent').last().scrollIntoViewIfNeeded(); await motion.waitForTimeout(180)
	const bottomPickers=await motion.evaluate(()=>{ const rows=[...document.querySelectorAll('.ent')].filter(e=>{ const r=e.getBoundingClientRect(); return r.bottom>0&&r.top<innerHeight&&e.querySelector('.nrg') })
		const ranges=rows.flatMap(e=>[...e.querySelectorAll('.nrg')]), positioned=rows.every(e=>{ const cvs=e.querySelectorAll('.cv'), rs=e.querySelectorAll('.nrg'); return [...rs].every((r,i)=>Math.abs(+r.value-+cvs[i].value)<=(+r.max-+r.min)*.006+1e-9) })
		return {n:ranges.length,colored:ranges.every(r=>getComputedStyle(r).getPropertyValue('--tkc').trim().toUpperCase()==='#123456'),positioned} })
	assert.equal(bottomPickers.n>0&&bottomPickers.colored,true,'offscreen catalog pickers inherit the current color when scrolled into view')
	assert.equal(bottomPickers.positioned,true,'newly visible catalog picker positions catch up to the current color')
	await motion.evaluate(()=>document.querySelector('.ent[data-s="rgb"]').scrollIntoView({block:'center'})); await motion.waitForTimeout(180)
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
	assert.equal(interrupted.preserved&&interrupted.after>=interrupted.before,true,`the prior layer continues from its current opacity instead of resetting (${JSON.stringify(interrupted)})`)
	assert.equal(interrupted.opaqueUnderlay,true,'an interrupted transition keeps an opaque color field underneath—never paper')
	assert.equal(interrupted.remaining,1,'covered transition layers are removed after the newest field lands')
	await motion.locator('.ent[data-s="oklch"] .nm').click(); await motion.waitForSelector('#pl3d'); await motion.waitForTimeout(1000)
	const solid=motion.locator('#pl3d'), ambientA=await solid.screenshot(); await motion.waitForTimeout(350); const ambientB=await solid.screenshot()
	assert.equal(!ambientA.equals(ambientB)||await solid.getAttribute('data-rest')==='slow',true,'3D solid starts in its subtle ambient rotation – or rests, by design, where a frame takes too long to turn (a software rasterizer, CI)')
	const sr=await solid.boundingBox(); await motion.mouse.move(sr.x+sr.width*.45,sr.y+sr.height*.45); await motion.mouse.down(); await motion.mouse.move(sr.x+sr.width*.45+47,sr.y+sr.height*.45+18,{steps:3}); await motion.waitForTimeout(180); await motion.mouse.up(); await motion.waitForTimeout(180)
	const parkedA=await solid.screenshot(); await motion.waitForTimeout(350); const parkedB=await solid.screenshot()
	assert.equal(parkedA.equals(parkedB),true,'a no-inertia release parks the 3D view')
	await motion.mouse.move(sr.x+sr.width*.55,sr.y+sr.height*.5); await motion.mouse.down(); await motion.mouse.move(sr.x+sr.width*.55-45,sr.y+sr.height*.5,{steps:2}); await motion.mouse.up(); await motion.waitForTimeout(120)
	const flickA=await solid.screenshot(); await motion.waitForTimeout(350); const flickB=await solid.screenshot()
	assert.equal(!flickA.equals(flickB)||await solid.getAttribute('data-rest')==='slow',true,'a moving release keeps rotating in the chosen direction – or rests where frames are too slow to turn')
	await motion.evaluate(()=>{ const orig=createImageBitmap; window.__imageBitmapOrig=orig; let stall=true
		window.createImageBitmap=(source,...rest)=>{ if(stall&&source instanceof Blob){ stall=false; return new Promise(()=>{}) } return orig(source,...rest) } })
	await motion.locator('#cvfile').setInputFiles(resolve(SITE, 'img/wave.jpg'))
	await motion.waitForFunction(()=>document.body.classList.contains('himg')&&document.querySelector('#detail .pl canvas.density'))
	await motion.evaluate(()=>{ window.createImageBitmap=window.__imageBitmapOrig; delete window.__imageBitmapOrig })
	const firstPlane=motion.locator('#detail .pl').first(); await firstPlane.evaluate(pl=>pl.scrollIntoView({block:'center'}))   // clear of the sticky foot nav, whatever the planes' size
	const pr=await firstPlane.boundingBox()
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
	const turned=await motion.evaluate(()=>{ const pairs=()=>[...document.querySelectorAll('#detail #planes .pl')].map(p=>[+p.dataset.a,+p.dataset.b]), before=pairs()
		document.querySelector('#detail #planes .pl .laby').click(); const after=pairs(), key=p=>p.slice().sort().join()
		return { before, after, distinct:key(after[0])!==key(after[1]), y:after[0][1]!==before[0][1]||after[0][0]!==before[0][0] } })
	assert.equal(turned.y&&turned.distinct,true,`an axis's name turns it, the planes kept on different pairs (${JSON.stringify(turned)})`)
	// a drag's planes and bars leave the shared kernel canvas once a task: every copy out of it (a drawImage of that detached
	// WebGL canvas) comes after the task's last kernel draw – a copy between two draws is another wait on the GPU (Safari:
	// ~10 ms each, five a frame once)
	await motion.evaluate(()=>{ const s=window.__copies={ n:0, bursts:0, drew:false }, di=CanvasRenderingContext2D.prototype.drawImage, da=WebGL2RenderingContext.prototype.drawArrays
		s.restore=()=>{ CanvasRenderingContext2D.prototype.drawImage=di; WebGL2RenderingContext.prototype.drawArrays=da }
		CanvasRenderingContext2D.prototype.drawImage=function(src,...r){ if(src instanceof HTMLCanvasElement&&!src.isConnected&&src.getContext('2d')===null){ s.n++; if(s.drew){ s.bursts++; s.drew=false } } return di.call(this,src,...r) }
		WebGL2RenderingContext.prototype.drawArrays=function(...a){ if(!this.canvas.isConnected) s.drew=true; return da.apply(this,a) } })
	const copyBar=await motion.locator('#detail .bar2').first().boundingBox()
	await motion.mouse.move(copyBar.x+copyBar.width*.2,copyBar.y+copyBar.height/2); await motion.mouse.down(); await motion.mouse.move(copyBar.x+copyBar.width*.8,copyBar.y+copyBar.height/2,{steps:24}); await motion.mouse.up(); await motion.waitForTimeout(120)
	const copies=await motion.evaluate(()=>{ const s=window.__copies; s.restore(); delete window.__copies; return { n:s.n, bursts:s.bursts } })
	assert.equal(copies.bursts>0&&copies.n>=2*copies.bursts,true,`a slider drag's planes and bars copy out of the kernel canvas together, once a task (${JSON.stringify(copies)})`)
	await motionContext.close()
	// a value emptied lets the color go once the field is let go; the distance waits for a palette; the row's own field focuses where it is
	const freshContext=await browser.newContext({viewport:{width:1440,height:800},reducedMotion:'reduce'}), fresh=await freshContext.newPage(); await fresh.goto(`${server.origin}/?cb=${Date.now()}`,{waitUntil:'networkidle'})
	await fresh.locator('#cval').fill('#336699'); await fresh.waitForFunction(()=>location.hash.length>1,null,{timeout:5000})
	await fresh.locator('#cval').fill(''); await fresh.waitForTimeout(300)
	assert.ok(await fresh.evaluate(()=>location.hash.length>1), 'emptied in hand, the color holds – the field is let go first')
	await fresh.locator('#cval').blur(); await fresh.waitForFunction(()=>!location.hash,null,{timeout:5000})
	assert.equal(await fresh.evaluate(()=>document.getElementById('cval').placeholder.length>0), true, 'emptied, the field invites again – no color chosen, no hash')
	await fresh.locator('#cval').focus(); await fresh.waitForTimeout(100)
	assert.equal(await fresh.evaluate(()=>getComputedStyle(document.getElementById('cvx')).visibility), 'hidden', 'the placeholder alone in hand: no × – nothing to clear')
	await fresh.locator('#cval').press('Escape'); await fresh.waitForTimeout(100)
	assert.notEqual(await fresh.evaluate(()=>document.activeElement?.id), 'cval', 'Esc lets the field go')
	assert.equal(await fresh.evaluate(()=>[...document.querySelectorAll('.dpop .mseg[data-lens="m"] button')].every(b=>b.disabled)), true, 'the palette distance is shown, disabled, until a palette is picked')
	// the field's rise into the row, a frame a scroll step, down and back: the many colors' text under the field eases with it
	// (its size and width the field's in the same frame – it once kept the hero's or the row's snapshot till the field came to
	// rest), and where the scroll drives the rise (a timeline) no script writes the field's style on the way
	{	await fresh.locator('#cval').fill('rgb(68 1 84) – rgb(59 82 158) – rgb(33 145 140) – rgb(92 200 99) – rgb(253 231 37)'); await fresh.locator('#cval').press('Enter'); await fresh.locator('#cval').blur()
		const r=await fresh.evaluate(async()=>{ const hc=document.getElementById('hcolor'), cv=document.getElementById('cval'), ul=document.querySelector('.cvul'), raf=()=>new Promise(r=>requestAnimationFrame(r))
			const d=parseFloat(document.querySelector('.page').style.getPropertyValue('--hc-dock')); let writes=0, off=[], mid=0
			const mo=new MutationObserver(ms=>{ writes+=ms.length }); mo.observe(hc,{ attributes:true, attributeFilter:['style'] })
			const look=()=>{ const p=+getComputedStyle(hc).getPropertyValue('--dkp'); if(p>0&&p<1) mid++
				const a=getComputedStyle(cv), b=getComputedStyle(ul); if(a.fontSize!==b.fontSize||Math.abs(cv.getBoundingClientRect().width-ul.getBoundingClientRect().width)>.5) off.push(`${p.toFixed(2)}: ${a.fontSize}/${b.fontSize}`) }
			for(let y=d-130;y<=d+40;y+=6){ scrollTo(0,y); await raf(); look() }
			for(let y=d+40;y>=0;y-=6){ scrollTo(0,y); await raf(); look() }
			mo.disconnect(); return { writes, off, mid, tl:CSS.supports('animation-timeline:scroll()') } })
		assert.ok(r.mid>4,`the scroll passes through the rise (${r.mid} frames mid-rise)`)
		assert.deepEqual(r.off,[],'the colors\' text under the field eases with the field, a frame at a time, down and back')
		if(r.tl) assert.equal(r.writes,0,'where a timeline drives the rise, no script writes the field\'s style during the scroll')
		// a card opened mid-rise stops the page's scroll, and its timeline with it: the rise is held where it stood (holdDock)
		const held=()=>fresh.evaluate(()=>[parseFloat(getComputedStyle(document.getElementById('cval')).fontSize),+getComputedStyle(document.getElementById('hcolor')).getPropertyValue('--dkp')])
		await fresh.evaluate(async()=>{ const d=parseFloat(document.querySelector('.page').style.getPropertyValue('--hc-dock')), run=2*parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s12'))*parseFloat(getComputedStyle(document.documentElement).fontSize)
			scrollTo(0,d-run/2); await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))) })
		const before=await held(); assert.ok(before[1]>0&&before[1]<1,`the page stands mid-rise (${before[1]})`)
		await fresh.evaluate(()=>document.querySelector('.ent[data-s="lab"] .nm').click()); await fresh.waitForSelector('#modal:not([hidden]) #dtitle')
		const under=await held()
		assert.ok(Math.abs(under[0]-before[0])<.05&&Math.abs(under[1]-before[1])<.01,`a card opened mid-rise holds the field's size and its rise where they stood (${before} → ${under})`)
		await fresh.locator('#mx').click(); await fresh.waitForFunction(()=>document.getElementById('modal').hidden) }
	await fresh.evaluate(()=>scrollTo(0,900)); await fresh.waitForFunction(()=>document.body.classList.contains('cdock'))   // pinned first – the check is of a pinned field (under load its docking frame can lag the 200ms this waited)
	// a press where the field shows, as a hand presses – a locator's click first scrolls the whole element into view (the
	// docked field's box reaches past the row's clip), which is Playwright moving the page, not the field
	{ const r=await fresh.locator('#cval').boundingBox(); await fresh.mouse.click(r.x+Math.min(r.width/2,40),Math.max(r.y,0)+8) } await fresh.waitForTimeout(200)
	assert.equal(await fresh.evaluate(()=>scrollY), 900, 'focusing the pinned color does not scroll the page')
	await freshContext.close()

	// the creator LUT flow: the editor picks the file – a plain 3D cube at a size that app takes,
	// the shaper cube only under Resolve (and the library's generic path), the app's steps beneath.
	// Its own context: these loads skip ?sw, and on loopback that unregisters the offline shell
	// the check below pins
	const wireContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
	const wire = await wireContext.newPage()
	wire.on('pageerror', error => errors.push(`wire: ${error.message}`))
	await wire.goto(`${server.origin}/rec709?cb=${Date.now()}`, { waitUntil: 'networkidle' })
	await wire.waitForSelector('#modal:not([hidden]) #dex #dlsz')
	await wire.locator('#dex').scrollIntoViewIfNeeded()
	assert.equal(await wire.locator('#dex select').count(), 2, 'the LUT asks two things – the target and the size; no app picker')
	await wire.locator('#dlto').selectOption('rgb')   // a per-channel pair: still a 3D cube by default, the 1D curve on request
	const lutOf = async (size) => {
		if (size != null) await wire.locator('#dlsz').selectOption({ value: size })
		const [dl] = await Promise.all([wire.waitForEvent('download'), wire.locator('#dldl').click()])
		return { name: dl.suggestedFilename(), text: readFileSync(await dl.path(), 'utf8'),
			sizes: await wire.locator('#dlsz option').evaluateAll(os => os.map(o => o.value)),
			note: await wire.locator('#dlnote').evaluate(el => el.hidden ? '' : el.textContent) } }
	const plain = await lutOf(null)
	assert.equal(plain.name, 'rec709-to-rgb-33.cube', 'the default: a 33³ cube, even for a per-channel pair')
	assert.equal(/^LUT_3D_SIZE 33$/m.test(plain.text) && !/LUT_1D_SIZE/.test(plain.text), true, 'the default is a plain 3D cube – the file every editor reads')
	assert.equal(plain.note, '', 'every editor reads it – nothing to warn')
	assert.deepEqual(plain.sizes, ['33', '65', '17', '33s', '65s', '1d'], 'sizes, the shaper cubes, and the 1D curve where the pair is per-channel')
	assert.equal(await wire.locator('#dlsz optgroup').getAttribute('label'), 'DaVinci Resolve / OCIO only', 'the shaper option is labeled for its only readers')
	const big = await lutOf('65')
	assert.equal(big.name === 'rec709-to-rgb-65.cube' && /^LUT_3D_SIZE 65$/m.test(big.text), true, '65³ high precision')
	assert.equal(big.note, 'Not read by CapCut (desktop), LumaFusion, and VN Video Editor.', '65³ names the editors that take 33³ only (js/editors.js)')
	const shaped = await lutOf('33s')
	assert.equal(shaped.name, 'rec709-to-rgb-33-shaper.cube', 'the shaper cube says so in its name')
	assert.equal(/^LUT_1D_SIZE 1024$/m.test(shaped.text) && /^LUT_3D_SIZE 33$/m.test(shaped.text), true, 'shaper cube: 1D shaper + 3D lattice in one file')
	assert.equal(shaped.note, 'For DaVinci Resolve only.', 'the shaper cube: its one reader')
	const curve = await lutOf('1d')
	assert.equal(curve.name === 'rec709-to-rgb.cube' && /^LUT_1D_SIZE 4096$/m.test(curve.text), true, 'the 1D curve on request: 4096 points')
	assert.match(curve.note, /^No editor here reads it/, 'the 1D curve: no editor slot takes it')
	await wire.locator('#dlto').selectOption('p3')   // not per-channel: no 1D option, the pick falls back to 33³
	assert.deepEqual([await wire.locator('#dlsz option[value="1d"]').count(), await wire.locator('#dlsz').inputValue()], [0, '33'], 'a 3D-only pair offers no 1D curve')
	// the code tabs are color-space's own targets – no other library's Python; embed: the iframe for this very space
	await wire.goto(`${server.origin}/oklch?cb=${Date.now()}`, { waitUntil: 'networkidle' })
	assert.equal(await wire.locator('#cseg [data-t="py"]').count(), 0, 'no Python tab: color-space has no Python package to show')
	await wire.locator('#cseg [data-t="embed"]').click()
	assert.match(await wire.locator('#snip').innerText(), /^<iframe src="https:\/\/color-space\.io\/oklch\?embed"\s+title="OKLCH color space – color-space\.io"\s+width="\d+" height="\d+" style="[^"]+" loading="lazy"><\/iframe>$/, 'embed tab: the iframe for this space')
	// GL tab: four languages from one source, each text carrying the entry it names; naga (2 MB) loads on the first HLSL/MSL pick, not before
	await wire.locator('#cseg [data-t="gl"]').click()
	assert.equal(await wire.locator('#glseg').isVisible(), true, 'GL tab shows its language switch')
	const nagaFetched = () => wire.evaluate(() => performance.getEntriesByType('resource').some(e => /naga/.test(e.name)))
	for (const [l, entry] of [['glsl', /\bvec3 oklch_rgb\(/], ['wgsl', /\bfn oklch_rgb\(/], ['hlsl', /\bfloat3 oklch_rgb\(/], ['msl', /\bmetal::float3 oklch_rgb\(/]]) {
		if (l === 'hlsl') assert.equal(await nagaFetched(), false, 'GLSL and WGSL never fetch naga')
		await wire.locator(`#glseg [data-l="${l}"]`).click()
		await wire.waitForFunction(() => !/^\/\/ \w+: loading /.test(document.getElementById('snip').textContent), null, { timeout: 30000 })
		const sh = await wire.locator('#snip').innerText()
		assert.match(sh, new RegExp(`^// oklch → rgb · ${l.toUpperCase()} for `), `GL tab ${l}: the header names the pair and the language`)
		assert.match(sh, entry, `GL tab ${l}: the entry function is present`)
	}
	assert.equal(await nagaFetched(), true, 'HLSL/MSL loaded naga on demand')
	await wire.locator('#glseg [data-l="glsl"]').click()   // the language is page state – leave GLSL for what follows
	// a tab's bar under its word alone, the word's width – not its mark – in the dossier and in Usage alike
	const wordBar = (pg, sel) => pg.evaluate((sel) => { const w = document.querySelector(sel), a = w && getComputedStyle(w, '::after'); return !!w && a.backgroundColor !== 'rgba(0, 0, 0, 0)' && Math.abs(parseFloat(a.width) - w.getBoundingClientRect().width) < 1 }, sel)
	assert.ok(await wordBar(wire, '#cseg button.on>span:not(.fl)'), 'the code tab picked: its bar under its word')
	assert.ok(await wire.evaluate(() => document.querySelector('.dh .dkinds').getBoundingClientRect().left - document.getElementById('dtitle').getBoundingClientRect().right < 24), 'the kinds right after the name, not past the family line')
	assert.equal(await wire.locator('.props [data-k="loss"]').count(), 0, 'no loss row – a round trip\'s loss is the caveat')
	// the vision lens: one root filter, defs mounted once, cited models
	await wire.goto(`${server.origin}/?cb=${Date.now()}`, { waitUntil: 'networkidle' })
	assert.ok(await wordBar(wire, '#api-tab-core>span:not(.fl)'), 'Usage\'s tab picked: its bar under its word')
	assert.match(await wire.evaluate(() => [...document.querySelectorAll('#m-view .mseg[data-lens="v"] button')].map(o => o.title).join(' ')), /Machado et al\. 2009[\s\S]*Brettel et al\. 1997/, 'the vision options cite Machado 2009 and Brettel 1997 in their line – one text, no tooltip beside its')
	await wire.evaluate(() => document.querySelector('.fqa a[data-lens="v"][data-v="protan"]').click()); await wire.waitForTimeout(200)
	assert.equal(await wire.evaluate(() => document.querySelector('#m-view .mseg[data-lens="v"] button.on')?.dataset.v), 'protan', 'an answer\'s link sets the Vision it names')
	await lens(wire,'v','deutan')
	assert.equal(await wire.evaluate(() => document.documentElement.dataset.cvd), 'deutan', 'vision lens sets data-cvd on the root')
	assert.equal(await wire.locator('filter#cvd-deutan[color-interpolation-filters="linearRGB"]').count(), 1, 'the deutan filter is mounted, in linear light')
	assert.match(await wire.evaluate(() => getComputedStyle(document.documentElement).filter), /url\(.*#cvd-deutan/, 'the root wears the filter')
	await lens(wire,'v','tritan'); await lens(wire,'v','none')
	assert.deepEqual(await wire.evaluate(() => [document.documentElement.dataset.cvd, document.querySelectorAll('filter#cvd-tritan').length]), [undefined, 1], 'typical vision clears the lens; the defs mounted once')
	// Cite: BibTeX + APA from CITATION.cff, the version package.json's
	await wire.locator('#ftr .cite').click()
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
	assert.deepEqual(await embed.evaluate(() => ['#hero', '#strip', '#cat', '#faq', '#ftr', '#mx', '.mnavbar'].filter(q => { const el = document.querySelector(q); return el && el.getClientRects().length })), [], 'embed hides header, catalog, FAQ, footer, close, prev/next and the image seat')
	assert.equal(await embed.locator('#cat .ent').count(), 0, 'embed never builds the catalog')
	assert.match(await embed.locator('link[rel="canonical"]').getAttribute('href'), /\/oklch$/, 'embed keeps the clean canonical')
	const mb = await embed.locator('.mbox').boundingBox(), vw = await embed.evaluate(() => document.documentElement.clientWidth)
	assert.equal(Math.abs(mb.width - vw) <= 20 && mb.x <= 1, true, 'the card fills the frame')
	const embl = embed.locator('#embl'), emblHref = await embl.getAttribute('href')
	assert.equal(await embl.isVisible() && await embl.getAttribute('target') === '_blank' && /\/oklch(#|$)/.test(emblHref) && !/embed/.test(emblHref), true, 'one link out: the full page, new tab')
	await embed.keyboard.press('Escape')
	assert.equal(await embed.locator('#modal').isVisible(), true, 'Esc does not close an embedded card')
	const hist = await embed.evaluate(() => history.length)
	const famLink = embed.locator('#detail .fam a[href]').first(), famTo = await famLink.getAttribute('href')   // a space link is the space's own path (crawlable), not a #fragment
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

	// a hand turning the solid holds no color: with the orbit on (motion not reduced), the planes go on repainting under the
	// turn – they stood still for its length. (In a context of its own, after the page's own held-pointer checks: a second
	// page's orbit beside them is load on their 30 ms waits)
	{	const tc=await browser.newContext({ viewport:{ width:1440, height:900 } }), turn=await tc.newPage(); turn.on('pageerror',e=>errors.push(e.message))
		await turn.goto(`${server.origin}/oklch?sw&cb=${Date.now()}`,{waitUntil:'networkidle'})
		await turn.waitForSelector('#modal:not([hidden]) #dtitle')
		await turn.waitForFunction(()=>{ const el=document.querySelector('.vgrp[data-f="3d"] #pl3d'); return el&&!el.classList.contains('busy') },null,{timeout:60000})
		const o0=await turn.evaluate(()=>[...document.querySelectorAll('#bigch .nv')].map(e=>e.value).join(' ')), plane=()=>turn.evaluate(()=>document.querySelector('#detail .pl canvas').toDataURL())
		await turn.waitForFunction(o=>[...document.querySelectorAll('#bigch .nv')].map(e=>e.value).join(' ')!==o,o0,{timeout:15000})   // the orbit runs
		const b=await turn.locator('#pl3d').boundingBox()
		await turn.mouse.move(b.x+b.width/2,b.y+b.height/2); await turn.mouse.down(); await turn.mouse.move(b.x+b.width/2+12,b.y+b.height/2,{steps:3})
		await turn.waitForTimeout(300); const p1=await plane()
		for(let i=0;i<14;i++){ await turn.mouse.move(b.x+b.width/2+12+i*4,b.y+b.height/2+i%2); await turn.waitForTimeout(120) }
		const p2=await plane(); await turn.mouse.up()
		assert.notEqual(p2,p1,'the planes repaint while the solid is turned')
		await tc.close() }
	// the solid's figure shows its grid at once and the solid when it lands, a disc pulsing inside the grid till then. With
	// every program's link held unfinished for 900 ms – a slow driver's – no frame shows it neither waiting nor drawn (the
	// pulse ended at the first draw asked for, and through the link the frame stood empty, as if nothing were coming), and
	// through the wait the grid is in view, the last solid's canvas and its marks not
	{	const lc=await browser.newContext({ viewport:{ width:1440, height:900 }, reducedMotion:'reduce' }), slow=await lc.newPage(); slow.on('pageerror',e=>errors.push(e.message))
		await slow.addInitScript(()=>{ globalThis.__fig=[]; const born=new WeakMap(), P=WebGL2RenderingContext.prototype, link=P.linkProgram, get=P.getProgramParameter
			P.linkProgram=function(pr){ born.set(pr,performance.now()); return link.call(this,pr) }
			P.getProgramParameter=function(pr,q){ return q===0x91B1&&performance.now()-(born.get(pr)??0)<900?false:get.call(this,pr,q) }   // COMPLETION_STATUS_KHR
			const shown=e=>!!e&&getComputedStyle(e).visibility==='visible'&&getComputedStyle(e).display!=='none'
			const tick=()=>{ const el=document.querySelector('.vgrp[data-f="3d"] #pl3d'), q=c=>el.querySelector(c)
				if(el) globalThis.__fig.push({ t:performance.now(), busy:el.classList.contains('busy'), drawn:!!q('.mesh3')?._sceneKey, grid:!!q('.grid3')?._gridKey&&shown(q('.grid3')), body:shown(q('.mesh3')), disc:shown(q('.p3w')) })
				requestAnimationFrame(tick) }
			requestAnimationFrame(tick) })
		await slow.goto(`${server.origin}/cam16-ucs?sw&cb=${Date.now()}`,{waitUntil:'networkidle'})
		await slow.waitForFunction(()=>globalThis.__fig.some(f=>f.drawn&&!f.busy),null,{timeout:60000})
		const fig=await slow.evaluate(()=>globalThis.__fig), wait=fig.filter(f=>f.busy&&!f.drawn), span=a=>a.length?Math.round(a.at(-1).t-a[0].t):0
		assert.ok(span(wait)>600,`the solid's figure waits through its programs' link (${span(wait)} ms of 900)`)
		assert.ok(!fig.some(f=>!f.busy&&!f.drawn),'the solid\'s figure stood empty while its programs linked')
		assert.ok(wait.every(f=>f.disc&&!f.body),'awaited, the solid\'s place is a disc – the last solid\'s canvas unseen')
		assert.ok(span(wait.filter(f=>f.grid))>600,`the grid stands through the wait for its solid (${span(wait.filter(f=>f.grid))} ms)`)
		assert.ok(fig.at(-1).body&&!fig.at(-1).disc,'the solid landed: its canvas in view, the disc gone')
		// …and a space with no solid of its own – CMYK: its figure the chromaticity plate, laid flat – awaits none: the pulse
		// ended there too (it hung: the plate's draw returns before the solid's)
		await slow.goto(`${server.origin}/cmyk?sw&cb=${Date.now()}`,{waitUntil:'networkidle'})
		await slow.waitForFunction(()=>{ const el=document.querySelector('#pl3d'); return el&&!el.classList.contains('busy') },null,{timeout:15000}).catch(()=>assert.fail('the plate of a space with no solid waits on one forever'))
		await lc.close() }
	// Exercise the staged renderer directly, with a fresh module instance and no
	// page animation. Read pixels in the draw task (WebGL clears between frames).
	const gpu = await context.newPage()
	gpu.on('pageerror', error => errors.push(error.message))
	await gpu.goto(`${server.origin}/robots.txt?cb=${Date.now()}`)
	const rendering = await gpu.evaluate(async () => {
		const { paintBarGL, paintPlaneGL, mesh3Canvas, drawMesh3GL } = await import('/js/gl.js')
		const { quantRGB } = await import('/js/quant.js')
		const check = (ok, message) => { if (!ok) throw new Error(message) }
		const ready = async draw => { const end = performance.now() + 20000
			while (!draw()) { check(performance.now() < end, 'renderer did not become ready'); await new Promise(r => requestAnimationFrame(r)) } }
		const pixel = Object.assign(document.createElement('canvas'), { width: 1, height: 1 })
		const samples = [
			[[0,0,0], '565'], [[255,255,255], '565'], [[4.49,2.49,4.49], '565'], [[4.5,2.5,4.5], '565'],
			[[25.49,127.49,229.49], 'web'], [[25.5,127.5,229.5], 'web'],
			[[0,0,0], 'jnd'], [[127.49,127.49,127.49], 'jnd'], [[255,255,255], 'jnd'],
			[[245.49,105.49,22.49], 'pico8'], [[255,0,0], 'names'], [[255,0,0], 'pico8'], [[255,0,0], 'names'],
			// one color, three nearest entries – one per distance: a bar that drops the lens's metric lands on oklab's
			...['oklab','de2000','redmean'].flatMap(m => [[[0,51,255], 'pico8', m], [[0,51,153], 'names', m]]),
		]
		for (const [rgb, mode, metric] of samples) {
			const expected = quantRGB(rgb, mode, metric), rx = [rgb[0],rgb[0]], ry = [rgb[1],rgb[1]]
			for (const draw of [
				() => paintBarGL(pixel, 'rgb', rgb, 0, rx, 'off', mode, metric),
				() => paintPlaneGL(pixel, 'rgb', rgb, 0, 1, rx, ry, 'off', mode, false, 0, metric),
			]) {
				await ready(draw); draw()
				const got = pixel.getContext('2d').getImageData(0,0,1,1).data
				check(got[3] === 255 && expected.every((v,i) => Math.abs(v-got[i]) <= (mode === 'jnd' ? 1 : 0)), `${mode}${metric ? ' ' + metric : ''} ${rgb}: GPU ${[...got]} differs from CPU ${expected}`)
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
		// ── the solid's outline, drawn on the body per pixel (gl.js EDGE_GLSL) ──
		const INK = [.19, .18, .16], S = cv.width, sc = 1.2, lum = p => p[0] + p[1] + p[2]
		const shot = (s, map, r = rot, ...more) => { check(drawMesh3GL(cv, s, map, r, sc, ...more), `${s}: warmed renderer failed`)
			const out = new Uint8Array(S*S*4); gl.readPixels(0,0,S,S,gl.RGBA,gl.UNSIGNED_BYTE,out); return out }
		// a model point (tone, x, z: each −0.5…0.5) on the canvas, as gl.js view_ puts it; the pixel there
		const at = ([y, x, z], r = rot) => { const ca = Math.cos(r.a), sa = Math.sin(r.a), cb = Math.cos(r.b), sb = Math.sin(r.b), X1 = x*ca + z*sa, Z1 = -x*sa + z*ca
			return [Math.round((X1*sc*.5 + .5)*S), Math.round(((y*cb - Z1*sb)*sc*.5 + .5)*S)] }
		const px = (buf, [x, y]) => buf.subarray((y*S + x)*4, (y*S + x)*4 + 4)
		// darker somewhere in the 3 × 3 round a point than the same draw without its outline
		const inked = (on, off, p) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const q = [p[0]+dx, p[1]+dy]; if (lum(px(off, q)) - lum(px(on, q)) > 24) return true } return false }
		const until = async (ok, what) => { const end = performance.now() + 20000; while (!ok()) { check(performance.now() < end, what); await new Promise(r => requestAnimationFrame(r)) } }
		// a body's own edges: lines, not faces – the body's coverage kept, a silhouette's line given its outer half (INK_FS:
		// drawn on the surface alone it was half as heavy as an edge between two faces in view) within two pixels of the
		// body, and none of it left in the next plain draw
		const body = (buf, x, y) => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (buf[((y+dy)*S + x + dx)*4 + 3]) return true; return false }
		const lines = (s) => { const off = shot(s, maps[s]), on = shot(s, { ...maps[s], edge: s === 'rgb' ? 1 : 3, walls: 63, ink: INK })
			let visible = 0, drawn = 0, outer = 0
			for (let i = 0; i < off.length; i += 4) {
				if (off[i+3]) { visible++; check(on[i+3] >= off[i+3], `${s}: the outline took from the surface's coverage`); if (on[i] !== off[i] || on[i+1] !== off[i+1] || on[i+2] !== off[i+2]) drawn++ }   // a silhouette's half-covered pixels may gain: the line's outer half lies over them
				else if (on[i+3]) { outer++; check(body(off, (i/4) % S, (i/4/S) | 0), `${s}: ink away from the body`) } }
			return { visible, drawn, outer, off } }
		await until(() => lines('rgb').outer > 0, 'the outline\'s outer half did not become ready')
		for (const s of ['rgb', 'oklab']) { const { visible, drawn, outer, off } = lines(s)
			check(drawn > 100 && drawn < visible*.3 && outer > 50, `${s}: the outline missing, over whole faces, or without its outer half (${drawn} of ${visible}, ${outer} outside)`)
			check(equal(off, shot(s, maps[s])), `${s}: the outline leaked into a plain draw`) }
		// a space whose box is its body asks for its rims alone (edge 4, no bit 1): none of the volume's own edges cross it
		check(equal(shot('rgb', { ...maps.rgb, edge: 4, walls: 0, ink: INK }), shot('rgb', maps.rgb)), 'a map asking for no edge of the volume drew one')
		// an opponent channel tapers to where the volume's own gray has it, not to zero: Poirson–Wandell's white sits at O2 −5.3,
		// O3 3.7 – tapered to zero, the cube's three edges at white ran on to (L, 0, 0), a spike through the body
		{	const { space } = await import('/js/core.js'), pw = space['poirson-wandell'], W = space.rgb['poirson-wandell'](255, 255, 255)
			const m = { min: pw.range.map(r => r[0]), max: pw.range.map(r => r[1]), ti: 0, bip: [1, 2], neut: [[0, 0, 0], W] }
			const n = v => v.map((x, k) => (x - m.min[k]) / (m.max[k] - m.min[k]) - .5), a = n(W), b = n([W[0], 0, 0]), mid = at(a.map((x, k) => (x + b[k]) / 2))
			await ready(() => drawMesh3GL(cv, 'poirson-wandell', m, rot, sc))
			check(Math.hypot(a[1] - b[1], a[2] - b[2]) > .2, 'Poirson–Wandell\'s white is off its zero: the case this pins')
			check(!inked(shot('poirson-wandell', { ...m, edge: 3, walls: 63, ink: INK }), shot('poirson-wandell', m), mid), 'an edge of the volume runs from white toward the opponent zero: the taper\'s spike') }
		// a volume wider than the box, cut at all six faces (Display P3 in sRGB's coordinates): the box is closed, and its three
		// near edges run inked from corner to corner – polylines stopped a sample short of every corner and wall
		const box = { gam: 'p3', min: [0,0,0], max: [255,255,255], cmin: [0,0,0], cmax: [255,255,255], dcl: [[0,0,0],[255,255,255]], out: true, caps: 63, trim: 63, ti: 0 }
		// its three far edges, hidden behind it: faint through the near faces (pass 4) – points along each, counted where inked
		const far = (on, off) => { let n = 0; for (let k = 0; k < 3; k++) for (let j = 4; j <= 16; j++) { const q = [-.5,-.5,-.5]; q[k] = -.5 + (.03 + j*.047); if (inked(on, off, at(q))) n++ } return n }
		const lined = { ...box, edge: 1, walls: 63, ink: INK }
		await ready(() => drawMesh3GL(cv, 'rgb', box, rot, sc))   // its own programs: the P3 volume's bake, then its caps
		await until(() => px(shot('rgb', box), at([.3,.3,.3]))[3] === 255, 'the cut box\'s caps did not become ready')
		{	const off = shot('rgb', box), on = shot('rgb', lined)
			for (let y = 0; y < S; y++) { let a = -1, b = -1; for (let x = 0; x < S; x++) if (off[(y*S + x)*4 + 3]) { if (a < 0) a = x; b = x }
				for (let x = a; x >= 0 && x <= b; x++) check(off[(y*S + x)*4 + 3] > 0, `the cut box has a hole at ${x}, ${y}`) }
			const gaps = []
			for (let k = 0; k < 3; k++) for (let j = 0; j <= 20; j++) { const n = [.5,.5,.5]; n[k] = .5 - (.03 + j*.047); if (!inked(on, off, at(n))) gaps.push(`${k}:${j}`) }
			check(inked(on, off, at([.5,.5,.5])) && !gaps.length, `the cut box's near edges are not drawn whole: gaps at ${gaps}`)
			check(far(on, off) >= 30, `the cut box's far edges do not show through its near faces (${far(on, off)} of 39 points)`)
			// …and stay under a hovered plane's cut
			const cutAt = { axis: 1, val: 128, span: 255, wrap: false }
			check(inked(shot('rgb', lined, rot, null, null, cutAt), shot('rgb', box, rot, null, null, cutAt), at([.5,.5,.2])), 'the outline left under a hovered plane')
			// a face the body itself lies along takes no cap (flat): drawn under it, its outline showed through as a second rim
			check(equal(shot('rgb', { ...box, flat: 63 }), shot('rgb', { ...box, caps: 0 })), 'a cap drawn on a face the body lies along') }
		// the same box cut out of the human volumes, Light (the spectral cone) and Surface (the object-color solid): sRGB lies
		// inside both, so the box is all caps – closed, and its near edges inked by the same per-pixel rule (their outline
		// was polylines until 2026-11: stopped a sample short of each corner, broken where a wall curved). Each cap is the
		// wall where an odd number of the body's sheets lie in front of it – light's, sealed a box's breadth past the box,
		// counted however far (clipped at the frame's depth they were not, and the box's near face stood open)
		for (const gam of ['locus', 'vis']) { const hb = { ...box, gam }, hl = { ...hb, edge: 4, walls: 63, ink: INK }
			await ready(() => drawMesh3GL(cv, 'rgb', hb, rot, sc))
			await until(() => px(shot('rgb', hb), at([.3,.3,.3]))[3] === 255, `${gam}: the cut box's caps did not become ready`)
			const off = shot('rgb', hb), on = shot('rgb', hl), gaps = []
			for (let y = 0; y < S; y++) { let a = -1, b = -1; for (let x = 0; x < S; x++) if (off[(y*S + x)*4 + 3]) { if (a < 0) a = x; b = x }
				for (let x = a; x >= 0 && x <= b; x++) check(off[(y*S + x)*4 + 3] > 0, `${gam}: the cut box has a hole at ${x}, ${y}`) }
			for (let k = 0; k < 3; k++) for (let j = 0; j <= 20; j++) { const n = [.5,.5,.5]; n[k] = .5 - (.03 + j*.047); if (!inked(on, off, at(n))) gaps.push(`${k}:${j}`) }
			check(!gaps.length, `${gam}: the cut box's near edges are not drawn whole: gaps at ${gaps}`)
			// their caps carry their own outline, far edges and all (a cap that inked none left 2 of 39)
			check(far(on, off) >= 30, `${gam}: the cut box's far edges do not show through its near faces (${far(on, off)} of 39 points)`)
			check(equal(off, shot('rgb', hb)), `${gam}: the outline leaked into a plain draw`) }
		// The count is taken in front of the wall itself. The surface solid in a cylinder a tenth of OKLCh's chroma wide
		// overruns its wall all the way round: through the middle of the figure the eye's ray enters by the near wall and
		// leaves by the far, both inside the solid – counted in front of the body instead, the sheets before the one and past
		// the other cancelled, and the cylinder stood open (HSI, IHLS, HSP under Surface; a hole in each cut where only part
		// of both was, CIELCh's). (Its far side has a count of its own, for the outline it shows through: not pinned here)
		{	const cyl = { gam: 'vis', min: [0,0,0], max: [1,.1,360], cmin: [0,0,0], cmax: [1,.1,360], dcl: [[0,0,0],[1,.1,360]], out: true, caps: 8, trim: 8, ti: 0, ai: 2, mi: 1 }
			await ready(() => drawMesh3GL(cv, 'oklch', cyl, rot, sc))
			await until(() => px(shot('oklch', cyl), at([.1,0,0]))[3] === 255, 'a cylinder the solid overruns on every side has no wall where the eye looks through its axis') }
		// The gray a color past sRGB desaturates toward is the gray of its own luminance: Display P3's red, in its own cube, is
		// drawn sRGB's red – weighed by its code values (the green one under zero) it was drawn at two-thirds of that light,
		// and a deep violet black
		{	const p3 = { gam: 'p3', min: [0,0,0], max: [1,1,1], ti: 0 }
			await ready(() => drawMesh3GL(cv, 'p3', p3, rot, sc))
			const q = px(shot('p3', p3), at([.5,-.44,-.44]))
			check(q[3] === 255 && q[0] >= 235 && q[1] <= 40 && q[2] <= 40, `Display P3's red corner is not drawn red: ${[...q]}`) }
		// A cell astride a void in a channel's range is no surface: DSH's cells from the spectrum's red end to its purples ran
		// across the box, over wavelengths that name no color. Its body is in parts (each: its two ends, then the ends of the
		// next that meet them – 700 the purples' −493, by color)
		const dshParts = [[-566.4337,-493.2499,360,700],[360,700,-566.4337,-493.2499]]
		{	const dsh = { gam: 'locus', min: [-700,0,0], max: [700,1,100], ti: 2 }, mid = at([0,0,.5])
			await ready(() => drawMesh3GL(cv, 'dsh', dsh, rot, sc))
			check(px(shot('dsh', dsh), mid)[3] > 0, 'DSH: no cell astride the void without the split – the case this pins')
			const cut = shot('dsh', { ...dsh, caps: 0, split: 0, parts: dshParts })
			check(px(cut, mid)[3] === 0, 'DSH: a cell drawn astride the void in its wavelengths')
			// …and on light's lid a green of white's own luminance is drawn green: the gray it desaturates toward is held a tenth
			// under white, where a hue is left (at white itself the lid was white: 254, 255, 254)
			const lid = px(cut, at([.5, (530 + 700)/1400 - .5, .3]))
			check(lid[3] === 255 && lid[1] - lid[0] > 100 && lid[1] - lid[2] > 60, `light as bright as white lost its hue: ${[...lid]}`) }
		check(gl.getError() === gl.NO_ERROR, 'the solid\'s draws left a GL error (a mask read while it is drawn into: a feedback loop, the draw refused)')
		// Light's body is drawn as the space has it, dark lights too – a cone pinched toward black is a needle under a flat
		// skirt. A dark light inside the cone (sRGB blue's chromaticity at
		// Y 1.5: OKLab 0.268, −0.019, −0.185), seen level: its row of the figure is the body's own cross-section at that lightness
		{	const side = { a: rot.a, b: 0 }, m = { ...maps.oklab, gam: 'locus' }
			await ready(() => drawMesh3GL(cv, 'oklab', m, side, sc))
			check(px(shot('oklab', m, side), at([.268 - .5, -.019/.8, -.185/.8], side))[3] === 255, 'Light\'s body is pinched toward black: a dark light lies outside it') }
		// its black corner is a real one: each face round it filled and dark – a discard meant for a lightness axis's dark
		// ring (Nayatani's) cut a hole there, the box's far faces seen through it (CMY, NTSC RGB under Display P3)
		{	const under = { a: rot.a + Math.PI, b: -rot.b }, off = shot('rgb', box, under)
			for (const [i, j] of [[0,1],[0,2],[1,2]]) { const n = [-.5,-.5,-.5]; n[i] += .03; n[j] += .03; const q = px(off, at(n, under))
				check(q[3] === 255 && lum(q) < 300, `the cut box's black corner is open on face ${i}${j}: ${[...q]}`) } }
		// a space inside the volume draws no lattice (RYB: wire3d's hollow) – its caps are its body
		check(shot('rgb', { ...maps.rgb, hollow: true }).every((v, i) => i % 4 !== 3 || v === 0), 'a hollow map drew the lattice')
		// frames: one, or several – a hovered plane's and the solid's edges where they are lines
		{	const tri = (x, y) => new Float32Array([x,y,0, x+.08,y,0, x,y+.08,0]), f = (x, y) => ({ fr: new Float32Array(0), co: tri(x, y), tint: [0,0,0], al: [0,1,0,1] })
			const p1 = [Math.round(.06*S), Math.round(.06*S)], p2 = [Math.round(.06*S), Math.round(.94*S)]   // inside each triangle, clear of the cube
			await until(() => px(shot('rgb', maps.rgb, rot, null, f(-.9,-.9)), p1)[3] > 0, 'the frame program did not become ready')
			check(equal(shot('rgb', maps.rgb, rot, null, f(-.9,-.9)), shot('rgb', maps.rgb, rot, null, [f(-.9,-.9)])), 'a frame alone and a list of one draw differently')
			const two = shot('rgb', maps.rgb, rot, null, [f(-.9,-.9), f(-.9,.86)])
			check(px(two, p1)[3] > 0 && px(two, p2)[3] > 0, 'a list of frames did not draw each') }
		// A body in parts' lattice has a point on the void wherever a cell crossed it (seamLattice): along an edge between two
		// parts the nearer point moves onto the crossing, a point of both from then on. Three points, the channel reading
		// part 0 left of x = 0.3 and part 1 right of it: the first moves there, alone
		{	const { seamLattice } = await import('/js/gl.js'), two = [[0, 2], [10, 12]], tri = () => new Float32Array([0,0,0, 1,0,0, 1,1,0]), idx = new Uint32Array([0,1,2])
			const near = (a, b) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < 1e-6)
			const src = tri(), got = seamLattice(src, idx, (x) => [x < .3 ? 1 : 11], 0, two)
			check(near(got, [.3,0,0, 1,0,0, 1,1,0]), `a lattice's point next to the void is not brought onto it: ${[...got]}`)
			check(near(src, tri()), 'the seam was cut into the lattice given, the volume\'s own')
			// …right of x = 0.8 the other two are the nearer, each along its own edge to the first
			check(near(seamLattice(tri(), idx, (x) => [x < .8 ? 1 : 11], 0, two), [0,0,0, .8,0,0, .8,.8,0]), 'the nearer point of an edge astride the void is not the one moved')
			// a point of no part – a value in the void, a conversion that throws – is no end of a crossing: nothing moves
			check(near(seamLattice(tri(), idx, (x) => [x < .5 ? 1 : 5], 0, two), tri()), 'a point in the void moved its neighbour')
			check(near(seamLattice(tri(), idx, (x) => { if (x > .5) throw new Error('no color'); return [1] }, 0, two), tri()), 'a point the space cannot convert moved its neighbour')
			// a lattice all of one part, and none at all: as given
			check(near(seamLattice(tri(), idx, () => [1], 0, two), tri()) && seamLattice(new Float32Array(0), new Uint32Array(0), () => [1], 0, two).length === 0, 'a lattice clear of the void changed') }
		// A body in parts is as many closed solids – DSH's two, the spectrum's and the purples'. (The last of these checks, on
		// a larger canvas: a hair is a pixel wide.)
		{	const S = cv.width = cv.height = 768, P = (d, s, h) => [h/100 - .5, (d + 700)/1400 - .5, s - .5], red = { a: -1.25, b: .45 }, below = { a: 2.2, b: -.5 }
			const at = ([y, x, z], r) => { const ca = Math.cos(r.a), sa = Math.sin(r.a), cb = Math.cos(r.b), sb = Math.sin(r.b), X1 = x*ca + z*sa, Z1 = -x*sa + z*ca
				return [Math.round((X1*sc*.5 + .5)*S), Math.round(((y*cb - Z1*sb)*sc*.5 + .5)*S)] }
			const shot = (m, r) => { check(drawMesh3GL(cv, 'dsh', m, r, sc), 'dsh: warmed renderer failed'); const out = new Uint8Array(S*S*4); gl.readPixels(0,0,S,S,gl.RGBA,gl.UNSIGNED_BYTE,out); return out }
			const px = (buf, [x, y]) => buf.subarray((y*S + x)*4, (y*S + x)*4 + 4)
			const { space } = await import('/js/core.js'), want = space.dsh.rgb(700, .2, 30)
			for (const gam of ['srgb', 'vis']) { const m = { gam, min: [-700,0,0], max: [700,1,100], ti: 2, split: 0, parts: dshParts, trim: 0 }
				await ready(() => drawMesh3GL(cv, 'dsh', m, red, sc))
				// each part's end is a face of its own, in the colors that stand on it: the far red's, at a fifth of its purity
				// (a display volume's test by the pixel; under a human volume a program of its own, linked when first drawn)
				const face = () => { const q = px(shot(m, red), at(P(700, .2, 30), red)); return q[3] === 255 && want.every((v, k) => Math.abs(v - q[k]) <= 4) }
				await until(face, `DSH under ${gam}: its far-red end has no face of its own colors`)
				const front = shot(m, red), under = shot(m, below)
				// …the grays' too – every wavelength at no purity
				{	const q = px(front, at(P(600, 0, 50), red)); check(q[3] === 255 && Math.max(q[0], q[1], q[2]) - Math.min(q[0], q[1], q[2]) < 16, `DSH under ${gam}: no wall where its grays stand: ${[...q]}`) }
				// The surface meets that face where the face ends: up each column of it no pixel is unlike both its neighbours – no
				// blend of the two, a hair of the inside seen between. A cell astride the void is flat from the far red to the
				// purples, while the wavelength runs most of its way in a sliver of it: cut where the flat cell reached the end,
				// the surface stood up to a cell off the face (70 such pixels here under sRGB, 21 under Surface) – the lattice has
				// a point on the void wherever a cell crossed it (seamLattice)
				let odd = 0
				for (let s = .04; s < .6; s += .004) { const [x, y0] = at(P(700, s, 2), red), [, y1] = at(P(700, s, 100), red)
					for (let y = y0 + 1; y < y1 + 40 && y < S - 1; y++) { const c = k => [0, 1, 2].map(q => front[((y + k)*S + x)*4 + q])
						if (![-1, 0, 1].every(k => front[((y + k)*S + x)*4 + 3])) continue
						const a = c(-1), mid = c(0), z = c(1), az = z.map((v, q) => v - a[q]), L = az.reduce((t, v) => t + v*v, 0)
						const t = L ? Math.max(0, Math.min(1, mid.reduce((u, v, q) => u + (v - a[q])*az[q], 0) / L)) : 0
						if (Math.hypot(...mid.map((v, q) => v - a[q] - az[q]*t)) > 40) odd++ } }
				check(odd <= 5, `DSH under ${gam}: the surface stands off the face at its end – ${odd} pixels of the inside between them`)
				// its floor is the colors that reach black, not the box's: at black every wavelength and purity is one color, and
				// the volume's cells round its black corner join hues a box apart – a black sheet across the floor, past the
				// body's own walls (a cyan-green's floor ends at a third of its purity under sRGB: past it, seen from below, the
				// wall behind – not black)
				if (gam === 'srgb') { const q = px(under, at(P(500, .6, 0), below)), f = px(under, at(P(500, .2, 0), below))
					check(!q[3] || q[0] + q[1] + q[2] > 30, `DSH: a black sheet on the floor past the body's wall: ${[...q]}`)
					check(f[3] === 255 && f[0] + f[1] + f[2] < 30, `DSH: no floor under its body: ${[...f]}`) }
			}
			check(gl.getError() === gl.NO_ERROR, 'a body in parts left a GL error') }
		return { samples: samples.length*2, changed }
	})
	assert.equal(rendering.samples, 38, 'one-pixel bar and plane quantization agree with the CPU at byte boundaries, under each palette distance')
	assert.ok(rendering.changed > 0, 'contours preserve coverage and reset across RGB → OKLab → RGB on one canvas; the solid\'s outline rides the body, a cut box closed and its edges whole')
	await gpu.close()

	// the software path itself: on a host without a GPU (this one, without CS_GL) a dossier opens through the JS painters
	// – no kernel compiled on the CPU (lab's froze the page 18 s), its planes painted, the solid on the one shared canvas
	{	const sc = await softContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' }), sp = await sc.newPage(), serr = []
		sp.on('pageerror', (e) => serr.push(e.message))
		await sp.goto(`${server.origin}/?cb=${Date.now()}`, { waitUntil: 'networkidle' }); await sp.waitForSelector('.ent[data-s="lab"] .nm')
		const t0 = Date.now(); await sp.evaluate(() => document.querySelector('.ent[data-s="lab"] .nm').click())
		await sp.waitForFunction(() => document.getElementById('detail')?._s === 'lab' && [...document.querySelectorAll('#detail .pl canvas:not(.density)')].every((c) => c.width > 1 && (() => { try { return c.getContext('2d').getImageData(c.width >> 1, c.height >> 1, 1, 1).data[3] > 0 } catch { return false } })()), null, { timeout: 30000, polling: 250 })
		const opened = Date.now() - t0
		assert.equal(await sp.evaluate(() => document.querySelectorAll('#detail .pl.polar, #detail .pl.tric, #detail .pl.triw, #detail .pl.trid').length), 0, 'no GPU: the planes are the JS painter\'s squares')
		assert.equal(await sp.evaluate(() => document.querySelector('#pl3d .mesh3')?.isConnected && document.querySelectorAll('canvas.mesh3').length === 1), true, 'no GPU: the solid draws on the one shared canvas')
		assert.deepEqual(serr, [], 'no GPU: no page errors')
		console.log(`browser (no GPU): a dossier opens through its JS painters in ${opened} ms`)
		await sc.close() }

	// WebMCP: where the browser offers document.modelContext (stubbed here – the flag isn't Playwright's to set) the page
	// registers the MCP server's tools and its own `show`. Each library tool answers as mcp.js answers in Node, through
	// the staged bundle and the page's own copies of the library, data and GL registry (HLSL through the vendored naga)
	{	const wc = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' }), wp = await wc.newPage(), werr = []
		wp.on('pageerror', (e) => werr.push(e.message))
		await wc.addInitScript(() => { const tools = {}; document.modelContext = { tools, registerTool: async (t) => { tools[t.name] = t } } })
		await wp.goto(`${server.origin}/?cb=${Date.now()}`, { waitUntil: 'networkidle' })
		await wp.waitForFunction(() => Object.keys(document.modelContext.tools).length >= 9)
		const { TOOLS, call } = await import('../mcp.js')
		assert.deepEqual(await wp.evaluate(() => Object.keys(document.modelContext.tools).sort()), [...TOOLS.map((t) => t.name).filter((n) => n !== 'icc'), 'show'].sort(), 'WebMCP: the server\'s tools but icc, and show')
		// numbers to 12 significant digits: Chrome's V8 and this Node's may round a last bit apart (CI's Node 22 did, in lab → p3)
		const sig = (r) => JSON.parse(JSON.stringify(r, (k, v) => typeof v === 'number' ? +v.toPrecision(12) : v))
		const run = (name, a) => wp.evaluate(async ([n, a]) => { try { return await document.modelContext.tools[n].execute(a) } catch (e) { return { error: e.message } } }, [name, a])
		for (const [name, a] of [['convert', { color: '#ff8000', to: 'oklch' }], ['convert', { from: 'lab', colors: [[50, 20, -30], '#00ff80'], to: 'p3' }], ['gamut', { color: 'color(display-p3 1 0 0)' }],
			['css', { color: 'rebeccapurple' }], ['space', { name: 'slog3' }], ['spaces', { query: 'hdr' }], ['cube', { from: 'rgb', to: 'oklab', size: 3 }],
			['shader', { from: 'rgb', to: 'oklch', language: 'wgsl' }], ['shader', { from: 'rgb', to: 'oklab', language: 'hlsl' }], ['code', { color: '#ff8000', to: 'lab' }]])
			assert.deepEqual(sig(await run(name, a)), sig(await call(name, a)), `WebMCP ${name}: the page answers as the server does`)
		assert.match((await run('convert', { color: '#ff8000', to: 'okclh' })).error, /did you mean oklch/, 'WebMCP: a tool\'s error is the server\'s')
		assert.deepEqual(await run('show', { space: 'oklch', color: '#ff8000' }), { space: 'oklch', color: '#ff8000' }, 'WebMCP show: the dossier and the color, in front of the person')
		assert.equal(await wp.evaluate(() => !document.getElementById('modal').hidden && document.getElementById('detail')._s), 'oklch', '…the dossier open')
		assert.match((await run('show', { space: 'nope' })).error, /unknown space/, 'WebMCP show: an unknown space is refused')
		assert.match((await run('show', { color: 'not a color' })).error, /not a color/, '…and a color the page can\'t read')
		assert.deepEqual(werr, [], 'WebMCP: no page errors')
		await wc.close() }
	// an image over a card's planes: its samples as the dossier's planes draw them, a dot each, unflipped as the card's plane is
	{	const ic = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' }), ip = await ic.newPage()
		await ip.goto(`${server.origin}/?cb=${Date.now()}`, { waitUntil: 'networkidle' })
		const ent = ip.locator('.ent[data-s="oklch"]').first(); await ent.scrollIntoViewIfNeeded(); await ent.locator('.pvs').click({ force: true })
		await ip.locator('#cvfile').setInputFiles(resolve(SITE, 'img/wave.jpg'))
		await ip.waitForFunction(() => { const d = [...document.querySelectorAll('.ent[data-s="oklch"] .pl canvas.density')]; return d.length === 3 && d.every((c) => c.style.display !== 'none') })
		await ip.evaluate(() => document.getElementById('imgx').click())   // the image let go: its dots with it
		assert.equal(await ip.evaluate(() => [...document.querySelectorAll('.ent[data-s="oklch"] .pl canvas.density')].every((c) => c.style.display === 'none')), true, 'an image cleared leaves no dots on a card\'s planes')
		// a decoder slow to answer is waited for, never stopped: the first takes seconds here and there is no other to fall to
		// (no WebCodecs, an image element that cannot load) – the image is read all the same, the field counting the seconds.
		// A deadline of 1.5 s once failed a large image in each decoder in turn: it was never the image, yet stood among the recent
		await ip.evaluate(() => { const orig = createImageBitmap; window.__dec = { orig, url: URL.createObjectURL, ID: window.ImageDecoder }
			window.createImageBitmap = (src, ...r) => src instanceof Blob ? new Promise((ok) => setTimeout(ok, 2400)).then(() => orig(src, ...r)) : orig(src, ...r)
			window.ImageDecoder = undefined; URL.createObjectURL = () => 'blob:nothing' })
		await ip.locator('#cvfile').setInputFiles(resolve(SITE, 'img/target.jpg'))
		assert.ok(await ip.waitForFunction(() => /\d s$/.test(document.getElementById('cval').placeholder), null, { timeout: 5000 }).then(() => true, () => false), 'an image long in the reading: the field counts its seconds')
		assert.ok(await ip.waitForFunction(() => document.body.classList.contains('himg') && !document.getElementById('cval').readOnly, null, { timeout: 15000 }).then(() => true, () => false), 'a decoder seconds long is waited for: the image is read')
		await ip.evaluate(() => { const d = window.__dec; window.createImageBitmap = d.orig; URL.createObjectURL = d.url; window.ImageDecoder = d.ID; delete window.__dec })
		assert.match(await ip.evaluate(() => localStorage.csImgMru), /u:target\.jpg:/, 'an image read is kept among the recent')
		// …and one that cannot be read says so and is not kept
		await ip.locator('#cvfile').setInputFiles({ name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('not an image at all') })
		await ip.waitForFunction(() => /could not read/.test(document.getElementById('toast').textContent) && !document.getElementById('cval').readOnly, null, { timeout: 30000 })
		assert.equal(await ip.evaluate(() => /broken\.png/.test(localStorage.csImgMru)), false, 'an image that could not be read is not kept among the recent')
		await ic.close() }
	// a solid's caps are drawn where they lie: OSA-UCS's body crosses one wall of its box in one small patch – its other
	// walls are not drawn, and that one over its patch alone (each cap pixel runs the space's inverse, a bisection: three
	// whole walls of it, three passes a frame, made the solid heavy to turn). The picture is the same: the cap is there
	{	const oc = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' }), op = await oc.newPage(), oerr = []
		op.on('pageerror', (e) => oerr.push(e.message))
		await op.goto(`${server.origin}/osaucs?cb=${Date.now()}#c86432`, { waitUntil: 'networkidle' })
		await op.waitForFunction(() => { const p = document.querySelector('#pl3d'); return p && !p.classList.contains('busy') && p.querySelector('.mesh3')?.getContext('webgl2') }, null, { timeout: 60000 })
		await op.waitForTimeout(500)
		await op.evaluate(() => { const gl = document.querySelector('#pl3d .mesh3').getContext('webgl2'), de = gl.drawElements.bind(gl)
			const seen = window.__caps = { draws: [], box: [], restore: () => { gl.drawElements = de } }
			// every draw of the solid's: its index count, and – a cap's – the part of its wall it is drawn over (vsCap's uBoxLo, uBoxHi)
			gl.drawElements = (m, n, ...a) => { const pr = gl.getParameter(gl.CURRENT_PROGRAM), lo = gl.getUniformLocation(pr, 'uBoxLo'), hi = gl.getUniformLocation(pr, 'uBoxHi')
				seen.draws.push(n); if (lo && hi) seen.box.push([...gl.getUniform(pr, lo), ...gl.getUniform(pr, hi)]); return de(m, n, ...a) } })
		{ const r = await op.locator('#pl3d').boundingBox(), x = r.x + r.width / 2, y = r.y + r.height / 2
			await op.mouse.move(x, y); await op.mouse.down(); await op.evaluate(() => { window.__caps.draws.length = 0; window.__caps.box.length = 0 })
			await op.mouse.move(x + 12, y + 4); await op.waitForTimeout(100); await op.mouse.up() }
		const caps = await op.evaluate(() => { const seen = window.__caps; seen.restore(); delete window.__caps
			const body = Math.max(...seen.draws), frames = seen.draws.filter((n) => n === body).length / 3 || 1, area = seen.box.map((b) => (b[3] - b[0]) * (b[4] - b[1]) * (b[5] - b[2]))
			return { draws: seen.draws.length, capDraws: seen.draws.filter((n) => n !== body).length / frames, area: area.length ? Math.max(...area) : null } })
		assert.ok(caps.capDraws >= 1 && caps.capDraws <= 3, `OSA-UCS's one cap is drawn once a pass – its walls that hold none, not at all (${JSON.stringify(caps)})`)
		assert.ok(caps.area > 0 && caps.area < 0.1, `…and over its own patch of the wall alone (${JSON.stringify(caps)})`)
		assert.deepEqual(oerr, [], 'the solid\'s caps: no page errors')
		await oc.close() }
	// the slogan's ways in name a colormap too: pressed, the field walks to one drawn at random, shown on the page. And the
	// row's edge opened over it wears ONE ink its whole length – the swatches' rule on the colors averaged along it – the
	// value's words, the row's controls and the plugins alike (each glyph once took the ink of the color under it: a line
	// that turned from light to dark halfway across a colormap)
	{	const sc = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }), sp = await sc.newPage()
		await sp.goto(`${server.origin}/?cb=${Date.now()}`, { waitUntil: 'networkidle' })
		await sp.locator('#hsub a[data-way="colormap"]').click()
		assert.ok(await sp.waitForFunction(() => document.querySelector('#csug .fmtr.on')?.closest('.sgr')?.querySelector('.src')?.dataset.key === 'colormap', null, { timeout: 15000 }).then(() => true, () => false), 'the slogan\'s colormap walks the field to a colormap')
		await sp.keyboard.press('Enter'); await sp.waitForTimeout(400)
		assert.ok(await sp.evaluate(() => document.getElementById('cval').value.split(' – ').length >= 3), 'the colormap taken is the field\'s run of colors')
		await toCatalog(sp); await sp.mouse.move(700, 300); await sp.mouse.move(700, 1)
		await sp.waitForFunction(() => document.querySelector('.mhead').classList.contains('wide'), null, { timeout: 5000 })
		const one = await sp.evaluate(() => { const v = getComputedStyle(document.getElementById('cval'))
			return { inks: [document.querySelector('.mhead'), document.getElementById('hcolor'), document.querySelector('.hplugs')].map((e) => e.style.getPropertyValue('--eink')), fill: v.backgroundImage, text: v.color } })
		assert.ok(one.inks[0] && one.inks.every((k) => k === one.inks[0]), `the opened edge: one ink for the row, the docked color and the plugins (${JSON.stringify(one)})`)
		assert.ok(one.fill === 'none' && /^rgb\((255, 255, 255|0, 0, 0|\d+, \d+, \d+)\)$/.test(one.text), `…and the value's words in it whole, no fill of several (${JSON.stringify(one)})`)
		await sc.close() }
	// …and where the browser doesn't, the page asks for none of it
	assert.equal(await page.evaluate(() => performance.getEntriesByType('resource').some((r) => /\/(mcp|js\/webmcp)\.js/.test(r.name))), false, 'no WebMCP: neither module is fetched')

	if (errors.length) throw new Error(errors.join('\n'))
	console.log('browser: search, coverage filter, CSS parsing, tabs, persisted theme, modal lifecycle, direct route, mobile keyboard, social image, offline shell, quantization boundaries and contour reuse pass')
} finally {
	await context.close()
	await browser.close()
	await server.close()
}
