// The site's tests – the atlas (web/) and its build (_site): the page's integrity, its modules, the staged
// build. Run by CI (npm run test:site), never by a publish: the package ships the library, not the site
import { existsSync, readFileSync, statSync } from 'node:fs'
import space from '../index.js'
import test, { is } from 'tst'
import './stops.js' // the field's gradients and lists: CSS's syntax and interpolation
import './sweep.js' // the catalog's strips: one sweepCSS, and the pool that runs it off the main thread
import './namesearch.js' // the color field's name search
import './nearest.js' // the large palettes' nearest-site search
import './lex.js' // the code plates' lexer

// the site stages into _site (npm run landing / pages.yml — docs/ stays source-only);
// build it here and pin completeness: every space gets its reference page + sitemap
// entry, and no import escapes the site root
test('integrity — _site: builds complete (a page + sitemap entry per space)', { timeout: 600000 }, async () => {
	const { buildSite, site } = await import('../scripts/build-site.js')
	process.env.CS_NO_DOSSIERS = '1'   // the dossier bake is a ~60s headless pass — this test pins build completeness, not the enhancement layer (pages.yml bakes in `npm run landing`, after the gate)
	try { await buildSite() } finally { delete process.env.CS_NO_DOSSIERS }
	const missing = Object.keys(space).filter(n => !existsSync(`${site}/${n}.html`))
	is(missing, [], 'every space has <name>.html')
	const map = readFileSync(`${site}/sitemap.xml`, 'utf8')
	const unmapped = Object.keys(space).filter(n => !map.includes(`/${n}</loc>`))
	is(unmapped, [], 'every space is in the sitemap')
	is(existsSync(`${site}/llms.txt`) && existsSync(`${site}/robots.txt`), true, 'llms + robots staged')
	// the cited rows ship beside the page for other libraries' tests, and llms.txt points agents at them and the errata
	const conf = JSON.parse(readFileSync(`${site}/conformance.json`, 'utf8')), llmsTxt = readFileSync(`${site}/llms.txt`, 'utf8')
	is(conf.rows.length > 200 && conf.rows.every(r => r.src && r.url && r.kind), true, 'conformance.json staged: every row with its source, link and kind')
	is(['conformance.json', 'docs/errata.md'].every(f => llmsTxt.includes(f)), true, 'llms.txt names conformance.json and the errata')
	is(['target.jpg','colormaps.png','glow.png','wave.jpg'].filter(n=>!existsSync(`${site}/img/${n}`)), [], 'the four raster histogram specimens ship with the site')
	// per-space pages are atlas copies with their own head — pin the stamp, not the body
	// (the dossier's Wikipedia link is JS-rendered; one-article-per-space is pinned below)
	const lmsPage = readFileSync(`${site}/lms.html`, 'utf8')
	is(lmsPage.split('<title>LMS color space').length - 1, 1, 'LMS page titles its display name, not the slug')
	const slogPage = readFileSync(`${site}/slog3.html`, 'utf8')
	is(slogPage.includes('<title>S-Log3 color space – channels, ranges, conversion LUT | color-space</title>'), true, 'LUT-capable camera log titles the display name and the LUT')
	const proPage = readFileSync(`${site}/prophoto.html`, 'utf8')
	is(proPage.includes('<title>ProPhoto RGB (ROMM RGB) color space – primaries, XYZ matrix, conversion | color-space</title>'), true, 'an RGB space titles its other name, primaries and matrix')
	is(/<meta name="description" content="[^"]*RGB → XYZ matrix and a converter to \d+ other spaces\.">/.test(proPage), true, 'its snippet closes on what the page holds')
	is(readFileSync(`${site}/xyy.html`, 'utf8').includes('<title>CIE xyY color space –'), true, 'an alias that spells the name out stands alone')
	is(readFileSync(`${site}/gray.html`, 'utf8').includes('<title>Gray color space – channels, ranges, conversion | color-space</title>'), true, 'a lowercase alias (grey) stays out of the title')
	is(/<meta name="description" content="[^"]*\.cube LUTs to Rec\. 709, P3 and other spaces\.">/.test(slogPage), true, 'a camera log’s snippet closes on its LUTs')
	is(/<meta name="description" content="[^"]*。チャンネル、範囲、[^" ]*">/.test(readFileSync(`${site}/ja/xyb.html`, 'utf8')), true, 'a Japanese snippet joins its offer with no space')
	// social cards + structured data: every space page carries its own card, the
	// sitemap carries images + per-space git lastmod, and the Dataset JSON-LD
	// stays on the index alone (a copy on every space page would read as spam)
	is(slogPage.includes('<meta property="og:image" content="https://color-space.io/img/og/slog3.jpg">'), true, 'space page carries its own social card')
	is(existsSync(`${site}/img/og/slog3.jpg`), true, 'the card image ships with the site')
	const card = readFileSync(`${site}/img/og.png`), head = readFileSync(`${site}/index.html`, 'utf8')   // PNG's IHDR: width, height at bytes 16, 20
	is([card.readUInt32BE(16), card.readUInt32BE(20)], ['width', 'height'].map(d => +head.match(new RegExp(`og:image:${d}" content="(\\d+)"`))[1]), 'the site card is the size its meta declares')
	is(head.match(/<span data-fact="ver">([^<]*)/)?.[1], JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version, 'the footer carries the package\'s version')
	is(statSync(new URL('../web/img/og.png', import.meta.url)).mtimeMs >= statSync(new URL('../web/index.html', import.meta.url)).mtimeMs, true, 'the build re-renders the site card once the page it shows is newer')
	is(map.includes('<image:loc>https://color-space.io/img/og/slog3.jpg</image:loc>'), true, 'sitemap lists the card image')
	is(map.includes('<lastmod>'), true, 'sitemap carries lastmod dates')
	is(readFileSync(`${site}/index.html`, 'utf8').includes('"@type":"Dataset"'), true, 'index carries the Dataset JSON-LD')
	is(slogPage.includes('ld-dataset'), false, 'space pages do not repeat the Dataset JSON-LD')
	is(lmsPage.match(/<link rel="canonical"/g)?.length, 1, 'LMS page carries exactly one canonical')
	is(lmsPage.includes('<link rel="canonical" href="https://color-space.io/lms">'), true, 'LMS canonical points at its dossier URL')
	is(lmsPage.includes('<meta property="og:url" content="https://color-space.io/lms">'), true, 'LMS social URL points at its dossier URL')
	// Execute the staged dependency graph: source-relative imports can resolve in
	// the repo while escaping _site and breaking the page's download controls.
	const runtime = Object.assign({}, ...await Promise.all(['icc', 'lut', 'wasm'].map((f) => import(`${site}/${f}.js`))))
	is(runtime.kind(space.rgb, { xyz: space.xyz }), 'mntr', 'staged ICC runtime classifies RGB')
	const profile = runtime.profile(space.rgb, { xyz: space.xyz })
	is(new TextDecoder().decode(profile.slice(36, 40)), 'acsp', 'staged runtime produces an ICC profile')
	is(runtime.channelwise(space.rgb, space.rgb), true, 'staged LUT runtime recognizes an identity transform')
	const cube = runtime.cube(space.rgb, space.rgb, { size: 2 })
	is(cube.includes('LUT_1D_SIZE 2'), true, 'staged runtime generates a minimal identity LUT')
	is(cube.trim().split('\n').filter(line => /^\d/.test(line)).map(line => line.split(' ').map(Number)), [[0,0,0],[1,1,1]], 'identity LUT retains black and white endpoints')
	is(runtime.spaces.includes('oklch'), true, 'staged WASM registry includes OKLCH')
})

// a CSS comment left open swallows every rule up to the next comment's close – silently: the locus's labels once fell
// back to 16px unfilled glyphs and its Limit to 0.35 opacity that way. Every comment closes before the next one opens
test('integrity — no CSS comment or stray brace in the page swallows rules', () => {
	const page = readFileSync(new URL('../web/index.html', import.meta.url), 'utf8')
	const css = [...page.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n'), open = []
	for (let i = 0; (i = css.indexOf('/*', i)) >= 0;) { const e = css.indexOf('*/', i + 2); if (e < 0 || css.slice(i + 2, e).includes('/*')) open.push(css.slice(i, i + 60)); i = e < 0 ? css.length : e + 2 }
	is(open, [], 'every CSS comment closes before the next opens')
	// …and a block cut short leaves a stray brace that ends the rule set early, as silently
	let depth = 0, lowest = 0; for (const c of css.replace(/\/\*[\s\S]*?\*\//g, '')) { if (c === '{') depth++; else if (c === '}') lowest = Math.min(lowest, --depth) }
	is([depth, lowest], [0, 0], 'every CSS brace pairs – none closes a block that never opened')
})

// the layout switch shows its mark at first paint from the page as it stands – web/ served unbuilt, no script yet: both
// marks in the markup, CSS picking one by the head's data-view. They must be render.js's own, never a copy that drifts
test('integrity — the layout switch carries render.js\'s marks in the page itself', async () => {
	const page = readFileSync(new URL('../web/index.html', import.meta.url), 'utf8'), { nextView } = await import('../web/js/render.js')
	is(page.includes(`data-view="${nextView('grid').v}"`) && page.includes(`<i data-from="grid">${nextView('grid').ic}</i><i data-from="list">${nextView('list').ic}</i>`), true, 'both marks, as render.js draws them, and the view a first visit turns to')
})

// a family folds past two rows of tiles at most (render.js folds): at k columns, k leads and rows of k + 1 tiles; two rows
// where five or more stay behind them, one where fewer would; the fold's line names exactly the held-back ones, once
test('catalog — a family folds past two rows at most, its line naming what it holds back', async () => {
	const { catHTML, sections } = await import('../web/js/render.js')
	const html = catHTML(null, sections), sec = k => html.match(new RegExp(`<section class="([^"]*)" data-sec data-k="${k}">([\\s\\S]*?)</section>`))
	for (const c of sections) { const [, cls, body] = sec(c.key), n = c.spaces.length, names = [...body.matchAll(/<li class="fn([^"]*)"><a class="nm" href="([^"]+)"/g)]
		for (const k of [1, 2, 3]) { const two = n - 3 * k - 2, held = names.filter(m => m[1].split(' ').includes(`h${k}`)).map(m => m[2])
			const r = two <= 0 ? 0 : two >= 5 ? 2 : 1, at = k + r * (k + 1)
			is([cls.includes(` f${k}`), cls.includes(` g${k}`)], [r === 2, r === 1], `${c.key} at ${k} columns: ${r || 'no'} fold row(s)`)
			is(held.slice().sort(), r ? c.spaces.slice(at).sort() : [], `${c.key} at ${k} columns: the line names the ${r ? n - at : 0} held back, each once`)
			if (r) is(body.includes(`<i class="n${k}">${n - at}</i>`), true, `${c.key} at ${k} columns: its count`) } }
	is(sec('cat.remixes')[1], 'sec f1 g2', 'Cylindrical (11): two rows on a phone (6 behind), one at two columns, where two would leave fewer than five')
	is(sec('cat.surface')[1].includes(' f3') || sec('cat.surface')[1].includes(' g3'), false, 'a family that fits two rows carries no fold')
	const wide = [...sec('cat.display')[2].matchAll(/<li class="fn[^"]*\bh3\b[^"]*"><a class="nm" href="([^"]+)"/g)].map(m => m[1])   // the desktop's line
	is([wide[0], wide.at(-1)], ['cie-rgb', 'rec709-display'], 'the line leads with a maker not yet met, a variant (a name another space\'s and a word) last')
})

// the list: the name, then its numbers, then the facts – the coverage last before the kinds' one cell; a retired space's
// year its archive box beside it (no status column of its own); the kinds four marks, never the status's
test('catalog — the list reads name, channels, facts; a retired year wears its box', async () => {
	const { catHTML, sections, HISTORICAL } = await import('../web/js/render.js')
	const html = catHTML(null, sections, { view: 'list' }), head = html.match(/<thead><tr>([\s\S]*?)<\/tr><\/thead>/)[1]
	is([...head.matchAll(/<th[^>]*class="([^"]+)"/g)].map(m => m[1]), ['tsw', 'c-name', 'c-ch', 'c-year', 'c-by', 'c-white', 'c-cov', 'c-geo', 'c-curve', 'c-sig', 'c-range', 'c-kind'], 'the columns in order')
	const row = s => html.match(new RegExp(`<tr class="ent tr" data-s="${s}"[\\s\\S]*?</tr>`))[0], year = s => row(s).match(/<td class="c-year">([\s\S]*?)<\/td>/)[1]
	const old = [...HISTORICAL][0]
	is([/class="ki"/.test(year(old)), /class="ki"/.test(year('oklch'))], [true, false], `${old}'s year wears the archive box, OKLCH's none`)
	is([...row('oklch').match(/<td class="c-kind">([\s\S]*?)<\/td>/)[1].matchAll(/class="ki"/g)].length, 4, 'the kinds cell: shape, curve, signal, range')
	is(/<td class="c-ch"><span class="cvs">(?:<span class="cvp"[\s\S]*?<\/span>){3}<\/span><\/td>/.test(row('oklch')), true, 'OKLCH\'s channels: three fields')
})

// the first paint is the source's own – the locus, the field's hint and swatch, the view mark – current with locus.js
test('integrity — the page carries its first paint, current', async () => {
	const { firstPaint, SRC } = await import('../scripts/first-paint.js'), page = readFileSync(SRC, 'utf8')
	is(firstPaint(page) === page, true, 'node scripts/first-paint.js leaves web/index.html as it is')
	is([/<a class="hlocus"[^>]*style="--tkc:#808080"/.test(page), /<i class="cx" aria-hidden="true" style="left:41\.63%;top:60\.52%">/.test(page), page.includes('<textarea id="cval" placeholder="#808080"'), page.includes('<i class="mtop" id="mtop" style="--cur:#808080"')], [true, true, true, true], 'the boot gray: its mark at D65 (0.3127, 0.3290 – IEC 61966-2-1), the field\'s hint, the top line')
})

test('integrity — one type scale: no step redefined past tokens.css, so a phone keeps its order (a 13px t3 once set the slogan and the section titles under the 14px descriptions)', () => {
	const page = readFileSync(new URL('../web/index.html', import.meta.url), 'utf8'), tokens = readFileSync(new URL('../web/tokens.css', import.meta.url), 'utf8')
	is([...page.matchAll(/--t[0-6]\s*:/g)].length, 0, 'the page sets no --t step')
	const steps = [...tokens.matchAll(/--t([0-6]):\s*([\d.]+)rem/g)]
	is(steps.map((m) => +m[1]), [0, 1, 2, 3, 4, 5, 6], 'tokens.css sets each step once')
	is(steps.every((m, k) => !k || +m[2] > +steps[k - 1][2]), true, 'each step larger than the one before')
})

test('integrity — every Usage tab opens with its title; the plates are plain text, painted by lighthigh', () => {
	const page = readFileSync(new URL('../web/index.html', import.meta.url), 'utf8')
	const panels = [...page.matchAll(/<div (?:class="export" )?id="api-panel-(\w+)" role="tabpanel"[^>]*>\s*(<\w+[^>]*>)/g)]
	is(panels.length, 8, 'the eight tabs')
	for (const [, p, first] of panels) is(/^<h3 data-i18n="ui\.api\.[\w-]+-title">$/.test(first), true, `${p}: its title first`)
	is(/<pre[^>]*>(?:(?!<\/pre>)[\s\S])*<(?:b|i)>/.test(page), false, 'no tag colors a plate: lighthigh paints its text in place')
})

test('integrity — tiered site rendering keeps animation off the expensive paths', () => {
	const page = readFileSync(new URL('../web/index.html', import.meta.url), 'utf8')
	const render = readFileSync(new URL('../web/js/render.js', import.meta.url), 'utf8')
	const gl = readFileSync(new URL('../web/js/gl.js', import.meta.url), 'utf8')
	const tokens = readFileSync(new URL('../web/tokens.css', import.meta.url), 'utf8')
	is(render.includes("DEFAULT = { s: 'rgb', vals: [128, 128, 128] }"), true, 'undefined color starts neutral gray')
	is(page.includes('scheduleFast(true)'), true, 'undefined color enters the ambient tier')
	is(page.includes('CATALOG_VALUE_THROTTLE=100'), true, 'inactive catalog numbers use the 100ms tier')
	const sweep = readFileSync(new URL('../web/js/sweep.js', import.meta.url), 'utf8'), worker = readFileSync(new URL('../web/js/sweep-worker.js', import.meta.url), 'utf8')
	is(sweep.includes("new Worker(new URL('./sweep-worker.js', import.meta.url), { type: 'module' })") && worker.includes("import { sweepCSS } from './sweep.js'"), true, 'catalog strips are computed off the main thread, by the page\'s own sweepCSS')
	is(worker.includes("postMessage('ready')") && sweep.includes("if (data !== 'ready')"), true, 'a worker is sent nothing before it says it is ready – a module awaiting its data drops early messages')
	is(page.includes('paintCatalogGrad(screenEnts())') && page.includes('paintCatalogGrad([active],true)'), true, 'every strip on screen is asked for on every change; the row in hand paints in its own frame')
	is(page.includes('lens=gmFor(cls)'), true, 'main sliders render under the one Limit the dossier shares')
	is(render.includes("export const LIMIT = 'srgb'") && render.includes('limitFor(cls)'), true, 'prerendered main sliders ship under the default Limit')
	is(page.includes('document.documentElement.style.setProperty(\'--cur\''), false, 'live color does not invalidate the whole document through an inherited custom property')
	is(page.includes('paintCatalogPickers(screenEnts(),frgb,fx)'), true, 'every visible picker position and color follows a held gesture')
	is(/LIVE_RAMP_GUIDES|SECONDARY_RAMP_GUIDES|throttleCatalogSecondary|CATALOG_FRAME_BUDGET/.test(page), false, 'strips keep one quality and no throttle: moving or at rest, a strip is the same 48 guides')
	is(page.includes('morph=!(PDOWN||autoColor)'), true, 'strips are set without a cross-fade while a color moves')
	is(page.includes("@property --cur{ syntax:'*'; inherits:false }"), true, 'the current color restyles its readers, never their subtrees')
	is(page.includes('t-scrollAt<SCROLL_QUIET'), true, 'the orbit holds while the page scrolls')
	is(page.includes('autoGap/=2') && page.includes('autoFt=0; autoFtAt=t }'), true, 'the orbit\'s pace comes back after a slow spell, and a scroll\'s frames never count against it')
	is(page.includes("cat.addEventListener('pointercancel'"), true, 'cancelled native catalog drags use the release path')
	is(page.includes("detail.addEventListener('pointercancel'"), true, 'cancelled native dossier drags use the release path')
	is(page.includes('el.onpointermove=move; el.onpointerup=up; el.onpointercancel=up'), true, 'cancelled custom dossier drags use the release path')
	is(page.includes("const SPIN3=matchMedia('(prefers-reduced-motion: reduce)').matches?0:0.0015"), true, '3D solid keeps its subtle ambient turn and respects reduced motion')
	is(page.includes('paintStripsGL'), false, 'catalog does not import the WebGL strip atlas')
	is(gl.includes('export function paintStripsGL'), false, 'dead atlas renderer is removed')
	is(page.includes('HCLOUD=8192'), true, 'image clouds have a bounded display sample budget')
	is(page.includes("cv.className='density'"), true, 'plane histograms live on a static overlay, separate from field repaints')
	is(page.includes('paintPlanes(true,true)'), true, 'plane and image picks repaint the dependent plane fields while held')
	is(tokens.includes('--picker-size:.75rem')&&tokens.includes('--picker-ring:.15625rem')&&tokens.includes('--picker-shadow-on:')&&!tokens.includes('active-size'), true, 'slider and plane pickers share one geometry token set – the white ring\'s, one size: engaging deepens its shadow, never grows it')
	is(page.includes('.pl.live .cx{ box-shadow:var(--picker-shadow-on) }')&&page.includes('.ch.live .nrg,.bar2.live .nrg{ --tks:var(--picker-shadow-on) }')&&page.includes(':is(.pl,.hlocus,.gam2d) .cx{'), true, 'plane, locus and xy plate engage as the slider thumb does: the same deeper shadow, the size kept')
	is(['hasPlaneGL', 'has3dGL', 'hasGamutGL'].every(f => new RegExp(`export const ${f} = [^\\n]*softGL\\(\\)`).test(gl)), true, 'a software rasterizer compiles no space kernels: planes, bars, the xy plate and the solid paint by their JS paths – lab\'s CPU-compiled kernel froze the page 18 s')
	is(gl.includes('st.prime ||= prime && !softRaster()'), true, 'a warmed program is primed on a GPU only – kernels kept on SwiftShader (CS_GL: the checks, the bake) or not')
	is(/drop-shadow|shadowBlur|text-shadow/.test(page + tokens), false, 'the marks are flat: no filter or canvas shadow to blur on every frame of a drag or the orbit')
	is(/setTk\(cat\b|setCur\(cat\b/.test(page), false, 'no tint on the catalog itself: an inherited var there restyles every card – inside its size container, as layout')
	is(page.includes('rows.forEach(ent=>tintRow(ent,hx,ink0))') && page.includes("tkReaders=ent=>ent._tkr??=[...ent.querySelectorAll('.nrg,.rh,.rng')]"), true, 'each row on screen tints its readers alone – pickers, range handles')
	is(page.includes('paintCatalogPickers(entered)'), true, 'picker positions refresh whenever an offscreen row enters the viewport')
	is(page.includes('function snapshot3dMask('), true, '3D sheet scenes retain the body mask that keeps their grid visible')
	is(page.includes('class="marker3"'), true, 'the live 3D picker has an overlay independent of its static scene')
	is(page.includes('if(heldColor) paint3dMarker()'), true, 'held colors move only the 3D marker rather than repainting the cloud and grid')
	is(gl.includes('function cellFor(') && (gl.match(/cellFor\(cv2d\.width/g) || []).length === 2, true, 'a task\'s planes and bars draw into cells of one kernel canvas and copy out of it together')
	is(gl.includes('0.24 * (1.0 - r * r)'), true, '3D cloud points accumulate translucently instead of painting opaque white')
	is(page.includes('if(drewGL) bodyM=snapshot3dMask(meshCv,sceneKey)') && !/drawImage\(meshCv/.test(page), true, 'the solid\'s cover is read off its GL canvas once a scene, never per mask – a GPU copy each in Safari')
	is(page.includes('const cw=(widthOf(el)||352)*1.36') && !page.includes('el.clientWidth||352') && !page.includes('cv.clientWidth||320'), true, 'the solid and the plates take their width from a ResizeObserver, not a layout read per draw')
	is(page.includes('if(modal._st){ modal._st=0; modal.scrollTop=0 }') && !/\$\{MNAV\('mfoot',1\)\}`\s*modal\.scrollTop=0/.test(page), true, 'a card\'s scroll resets before its new markup, never after it (a forced layout of the new card)')
	is(/\.mbox\{[^}]*transition/.test(page) || page.includes('@starting-style{ .modal'), false, 'the card shows and goes at once: no fade')
	const calc = readFileSync(new URL('../web/js/calc.js', import.meta.url), 'utf8'), cw = readFileSync(new URL('../web/js/calc-worker.js', import.meta.url), 'utf8')
	is(calc.includes("new Worker(new URL('./calc-worker.js', import.meta.url), { type: 'module' })") && cw.includes("import { JOBS } from './calc.js'") && cw.includes("postMessage('ready')"), true, 'the exports\' sums – a LUT\'s check, an ICC profile\'s size – run in a worker, the page\'s own JOBS')
	is(/lutTable\(|lutVerify\(/.test(page) || /setTimeout\(\(\)=>\{ try\{ const b=iccProfile/.test(page), false, 'no LUT check or ICC bake on the page\'s thread but a download')
	is(gl.includes('const SHEET = [1536, 512]') && gl.includes('Math.max(SHEET[0], Math.ceil(420 * d))'), true, 'the kernel canvas is warmed to a batch\'s sheet: no growth inside a first card\'s click')
})

// the catalog's display voice: names render display-final through disp() — uppercased
// ids, Greek verbatim (CSS text-transform would corrupt lαβ into LΑΒ) — and the
// filtered-to-nothing state has its line in the template rather than a silent void
test('integrity — _site: display names stamp display-final; empty-filter line present', async () => {
	const { site } = await import('../scripts/build-site.js')
	const index = readFileSync(`${site}/index.html`, 'utf8')
	is(index.split('>lαβ<').length - 1 >= 1, true, 'lαβ card shows the Greek name, not LALPHABETA')
	// the catalog stays on the index — name views ship #cat empty and carry the name in their own head
	is(readFileSync(`${site}/lalphabeta.html`, 'utf8').includes('<title>lαβ color space'), true, 'the stamped name view titles the Greek name')
	is(index.includes('id="nores"'), true, 'no-match line is part of the stamped catalog')
})

// display names are NAMES: one derived from a description's opening clause must not leak
// the sentence ("Lab-D65 is CIELAB" once shipped) – and nbh, which sets them for wrapping,
// swaps word-internal hyphens one code unit for one (search marks keep their offsets)
test('integrity — display names read as names; nbh keeps them whole', async () => {
	const { SPACES, disp, nbh } = await import('../web/js/render.js')
	is(SPACES.filter(s => / (is|are|was|the|of|for) /i.test(` ${disp(s)} `)).join(', '), '', 'no display name reads as a sentence')
	is(disp('lab-d65'), 'CIELAB D65', 'lab-d65 carries the README name')
	is(nbh('Linear-light sRGB'), 'Linear\u2011light sRGB', 'a word-internal hyphen turns non-breaking')
	is(nbh('BT.601 525-line Y′CbCr'), 'BT.601 525\u2011line Y′CbCr', 'between digit and letter too')
	is(nbh(''), '', 'empty stays empty')
	is(nbh('-a a- a--b'), '-a a- a--b', 'edge and doubled hyphens stay breakable')
	is(nbh('Adams–Nickerson Lab'), 'Adams–Nickerson\u00a0Lab', 'an en dash is not a hyphen')
	is([nbh('ARRI Wide Gamut 3'), nbh('Display P3'), nbh('Rec. 709')], ['ARRI Wide Gamut\u00a03', 'Display\u00a0P3', 'Rec.\u00a0709'], 'a short last word holds to the one before it')
	is([nbh('CIE 1931 sRGB'), nbh('HSL'), nbh('ARRI Wide Gamut <mark>3</mark>')], ['CIE 1931 sRGB', 'HSL', 'ARRI Wide Gamut <mark>3</mark>'], 'a longer last word, a single word and a marked one stay as they are')
	is(SPACES.every(s => { const d = disp(s), n = nbh(d); return n.length === d.length && n.replace(/\u2011/g, '-').replace(/\u00a0/g, ' ') === d }), true, 'every name: hyphens and a short last word\'s space swap 1:1, nothing else changes')
})

// a space's social card: its ranges set apart by space, not dots; the site's mark at the link; no retired rhombus
test('integrity — space cards: ranges without dots, the mark before the link', async () => {
	const { cardHTML } = await import('../scripts/generate-og.js')
	const html = cardHTML('oklch')
	is(html.includes(' · '), false, 'no middle dot between the channel ranges')
	is(/<span class="url"><img src="data:image\/png;base64,/.test(html), true, 'the site mark leads the link')
	is(html.includes('class="dia"'), false, 'no rhombus before the description')
})
