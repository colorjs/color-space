// Atlas – the workbench's catalog-first direction, now a WORKSHOP for its hero. The header is decided – the Drawer
// (top-drawer.js: Studio's masthead over the Drawer's cells) – and the hero comes in variants (atlas.html?hero=<key>);
// the body – the catalog with its family ladder, the footer and the docked live dossier – is this file's.
//
// ── THE HERO-VARIANT CONTRACT ─────────────────────────────────────────────────────────────────────────────
// A variant is a pair, hero-<key>.css + hero-<key>.js; <key> ∈ HEROS below (the first is the default). The study
// bar swaps variants in place – no reload – and writes ?hero=<key>. All state lives in wb.js (S, W) and the URL,
// never in a variant: the color, the filters, the search, the lens, the open dossier and the scroll survive a swap.
//
// JS – `export default function mount({ hero, wb })`, optionally returning a cleanup function. `hero` is #hero,
//   empty: write markup – wb hosts (<span data-wb="<name>"></span>, filled right after: chip, search, count, try …)
//   and the variant's own drawing. wb.js's exports are the data and the verbs: S, W, color(s, vals), openPane(s),
//   set(key, v), disp; the model (variants-model.js: SPACES, meta, valsOf, RGB, hexNow, shelves, famOf) and the
//   color science (core.js: locus, data – gamuts, CMFs). The current color changes with a 'wb:color' event on
//   document – repaint on it (a frame, not a reflow: the catalog is repainting too). A variant listens only for
//   its own affordances and returns a cleanup that removes them. A button with data-open-s="<space>" opens its
//   dossier where the reader is (#hero is a [data-wstay] region); data-jump="<family>" scrolls to that shelf.
// CSS – scope every rule under :root[data-hero="<key>"] (the shell sets it; during a swap both sheets are live for
//   a moment). Tokens only. Breakpoints are container queries – @container work (…) on #hero itself, whose width
//   is the catalog's – never the viewport. On a wide page (work ≥ 56rem) a hero hangs on the catalog's grid: a
//   label column (--lad) and, after --lgap, the content column where the spaces start (.row in atlas.css). A mark
//   of the current color takes the swatch study's shape (atlas.css): rotate:var(--mk-turn,45deg);
//   border-radius:var(--mk-r,0); scale:var(--mk-x,1) var(--mk-y,1) – a rhombus where the study is off.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
//
// The details are the atlas's own dossier, not the workbench pane: index.html?s=<space>&embed (its chrome-free
// card) in a same-origin iframe – docked right from 75rem (the catalog reflows), a full-screen dialog below.
// wb.js keeps S.sel, the URL (?s=), the catalog's highlight, prev/next and focus return; the dock is its
// `dock` hook. The color travels both ways through the iframe's URL fragment, the app's own channel.
import * as wb from './wb.js'
import { boot, fill, S, disp, esc, plate, loadCite, citeHTML, closePane, stopOrbit, orbiting, color, PALMODES } from './wb.js'
import { RGBX, valsOf, gamutOf, hexNow, parseColor, space, SPACES } from '../js/variants-model.js'
import { CSS as CSS_FMT } from '../js/study-runtime.js'
import { UI } from '../js/variants-icons.js'

const $ = id => document.getElementById(id), root = document.documentElement
const WIDE = matchMedia('(width >= 75rem)')   // wb.js's breakpoint: the dossier docks from here up
const top = $('top'), hero = $('hero'), cells = $('cells'), cat = $('cat')

// ── the header, once; the workshop: the hero's variants, swapped in place ──
import mountTop from './top-drawer.js'
import { FAMI } from './hero.js'
const HEROS = [['search', 'Search'], ['promise', 'Promise'], ['spectrum', 'Spectrum'], ['steps', 'Steps'], ['rings', 'Rings'], ['lineage', 'Lineage'],
	['locus', 'Locus'], ['conic', 'Conic'], ['specimen', 'Specimen'], ['table', 'Table']]
const heroOf = k => HEROS.some(h => h[0] === k) ? k : HEROS[0][0]
$('heros').innerHTML = HEROS.map(([k, n]) => `<button type="button" data-hero="${k}" aria-pressed="false">${n}</button>`).join('')
let heroKey = null, cleanup = null, seq = 0
// the variant's sheet: a new <link> loads beside the old one (inert until data-hero names it); the old one
// leaves with the old markup – resolves to a function that retires it
function sheet(k) { const old = $('herocss'), href = `./hero-${k}.css`
	if (old.getAttribute('href') === href) return Promise.resolve(() => {})
	return new Promise(ok => { const l = Object.assign(document.createElement('link'), { rel: 'stylesheet', href })
		l.onload = l.onerror = () => ok(() => { old.remove(); l.id = 'herocss' }); old.after(l) }) }
// what the reader is looking at: `el` while it is on screen, else the first catalog entry below the pinned bars
function anchor(el) { const lim = parseFloat(getComputedStyle(root).getPropertyValue('--stick-top')) || 0
	const r = el?.getBoundingClientRect(); if (r && r.bottom > lim && r.top < innerHeight) return { el, y: r.top }
	if (cat.getBoundingClientRect().top > lim) return null   // still above the catalog – the page stays at its top
	for (const el of cat.querySelectorAll('.sp')) { const r = el.getBoundingClientRect(); if (r.bottom > lim) return { el, y: r.top } } return null }   // entries only – a stuck family title sits still
// a change that reflows the catalog – another top, the dock taking or giving back its width – leaves what the
// reader was looking at where it was. The browser's own scroll anchoring can't: a margin changing on an
// ancestor (the dock's) suppresses it, and where it does run it would correct the same shift twice
function steady(change, el) { const at = anchor(el)
	root.style.overflowAnchor = 'none'; change()
	if (at?.el.isConnected) scrollBy({ top: at.el.getBoundingClientRect().top - at.y, behavior: 'instant' })
	requestAnimationFrame(() => root.style.removeProperty('overflow-anchor')) }
async function useHero(k) { k = heroOf(k); if (k === heroKey) return
	const my = ++seq, mod = await import(`./hero-${k}.js`).catch(() => null); if (my !== seq) return
	if (!mod) { const b = $('heros').querySelector(`[data-hero="${k}"]`); if (b) { b.disabled = true; b.title = 'This variant did not load' }   // a variant that can't load leaves the bar, never the page
		return !heroKey && k !== HEROS[0][0] ? useHero(HEROS[0][0]) : undefined }   // a first visit falls back to the default
	const retire = await sheet(k); if (my !== seq) return
	const swap = () => { try { cleanup?.() } catch {} cleanup = null
		hero.replaceChildren(); hero.removeAttribute('class'); hero.removeAttribute('style')
		root.dataset.hero = heroKey = k; retire()
		cleanup = mod.default({ hero, wb }) || null
		fill(hero) }
	heroKey ? steady(swap) : swap()   // the first hero mounts on an unscrolled page
	for (const b of $('heros').children) b.setAttribute('aria-pressed', b.dataset.hero === k)
	try { const u = new URL(location.href); u.searchParams.set('hero', k); history.replaceState(null, '', u) } catch {} }
$('heros').addEventListener('click', e => { const b = e.target.closest('[data-hero]'); if (b) useHero(b.dataset.hero) })
// the other studies – where the shelves' cut sits (?cut=), the swatch's shape (?sw=), how the dossier opens
// (?dossier=): an attribute each on <html>, the CSS answers (atlas.css, top-drawer.css); the cut also re-seats the
// ladder's tabs (decorate), the dossier reopens an open dock the new way
const STUDY = { cut: [['foot', 'Ladder foot'], ['head', 'Ladder head'], ['count', 'By the count']], sw: [['rhombus', 'Rhombus'], ['circle', 'Circle'], ['square', 'Square'], ['chip', 'Chip']],
	dossier: [['modal', 'Modal'], ['side', 'Side']] }
for (const [k, opts] of Object.entries(STUDY)) { const host = $(k + 's')
	const use = v => { root.dataset[k] = v; for (const b of host.children) b.setAttribute('aria-pressed', b.dataset.sv === v)
		try { const u = new URL(location.href); u.searchParams.set(k, v); history.replaceState(null, '', u) } catch {} }
	host.innerHTML = opts.map(([v, n]) => `<button type="button" data-sv="${v}" aria-pressed="false">${n}</button>`).join('')
	host.addEventListener('click', e => { const b = e.target.closest('[data-sv]'); if (b) steady(() => { use(b.dataset.sv); decorate(); if (k === 'dossier' && dock.open) present() }) })
	const v0 = new URLSearchParams(location.search).get(k); use(opts.some(o => o[0] === v0) ? v0 : opts[0][0]) }

// the pinned masthead's height: the line the catalog's sticky family titles hang under and the header's cells
// come down to (a wrapped masthead's height is not CSS's to read, so the shell measures)
function pin() { const th = top.querySelector('.top')?.offsetHeight || 0; root.style.setProperty('--top-h', th + 'px'); root.style.setProperty('--stick-top', th + 'px') }
addEventListener('resize', pin, { passive: true })

// the footer's two commands, as the site's code plates
$('f-npm-p').innerHTML = plate('npm install color-space', 'npm install command', { wrap: true })
$('f-mcp-p').innerHTML = plate('npx -y color-space mcp', 'MCP server command', { wrap: true })

// ── the ladder: every render of the catalog gets its titles' icons, jump buttons and stack positions ──
let act = -1
// the ladder's foot: how the shelves are cut – family, purpose, era – index.html's tabs under its rail; one node,
// seated again after every render (wb.js rewrites the catalog), its buttons a wb host that re-renders on a change
const gtabs = Object.assign(document.createElement('nav'), { className: 'gtabs', innerHTML: '<span data-wb="arrange"></span>' })
gtabs.setAttribute('aria-label', 'Arrange the catalog by'); fill(gtabs)
function decorate() { const head = root.dataset.cut === 'head'   // the cut study: the ladder's head or its foot (the first float or the last)
	if (head ? cat.firstChild !== gtabs : cat.lastChild !== gtabs) { head ? cat.prepend(gtabs) : cat.append(gtabs); fill(gtabs) }   // a render detached it before wb.js's refresh could reach it
	const shs = [...cat.querySelectorAll('.shelf')], n = shs.length
	shs.forEach((sh, i) => { const hd = sh.querySelector(':scope>.sh'), h2 = hd?.querySelector('h2'); if (!h2 || h2.querySelector('.tn')) return
		const name = h2.textContent
		hd.style.setProperty('--i', i); hd.style.setProperty('--j', n - 1 - i)   // its rung in the top pile, and in the bottom one
		h2.innerHTML = `<button type="button" class="tn" data-jump>${FAMI[name] ? `<span class="fic">${FAMI[name]}</span>` : ''}<span>${esc(name)}</span></button>` })
	const t0 = cat.querySelector('.shelf:first-of-type>.tip'), f0 = t0 && getComputedStyle(t0)   // the first title's description, in the ladder's fit (atlas.css) – a float's height is not CSS's to read
	cat.style.setProperty('--tip0', (f0 && f0.float !== 'none' ? t0.offsetHeight + parseFloat(f0.marginTop) : 0) + 'px')
	act = -1; mark(); if (S.sel) navState(S.sel) }
// where a shelf begins for the reader: beside the ladder, its first block of spaces (the title and its description
// float in the label column); narrower, the block under the inline title – its description first
const start = sh => sh.querySelector(getComputedStyle(sh.querySelector(':scope>.sh') || sh).float === 'left' ? ':scope>:is(.sh,.tip)+:not(.tip)' : ':scope>.sh+*')
// the family on screen: the last one whose content has crossed a third of the way down (index.html's rule)
function mark() { const shs = [...cat.querySelectorAll('.shelf')], lim = innerHeight * .35; let k = 0
	shs.forEach((sh, i) => { const f = start(sh); if (f && f.getBoundingClientRect().top <= lim) k = i })
	if (k === act) return; act = k
	shs.forEach((sh, i) => { const hd = sh.querySelector(':scope>.sh'), b = hd?.querySelector('.tn'); if (!b) return
		hd.classList.toggle('act', i === k); i === k ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current') }) }
let mraf = 0
addEventListener('scroll', () => { mraf ||= requestAnimationFrame(() => { mraf = 0; mark() }) }, { passive: true })
addEventListener('resize', () => { act = -1; mark() }, { passive: true })
new MutationObserver(decorate).observe(cat, { childList: true })   // wb.js re-renders the catalog on every filter and view change
// a jump: a ladder title to its own shelf; anywhere else (a hero), data-jump names the family
document.addEventListener('click', e => { const j = e.target.closest('[data-jump]'); if (!j) return
	const sh = j.dataset.jump ? cat.querySelector(`.shelf[aria-label="${CSS.escape(j.dataset.jump)}"]`) : j.closest('.shelf')
	if (sh) start(sh)?.scrollIntoView({ block: 'start' }) })

// ── the dock: the live dossier in an iframe ──
const dock = $('dock'), dfr = dock.querySelector('.dfr'), dload = $('dock-load')
$('dock-prev').innerHTML = `${UI.prev}<span></span>`; $('dock-next').innerHTML = `<span></span>${UI.next}`; $('dock-x').innerHTML = UI.x
let frame = null, ready = false, want = null, seen = '', dirty = false, pulling = false, tickT = 0, limitSet = false, hold = null
const cwin = () => { try { return ready ? frame.contentWindow : null } catch { return null } }
const spaceOf = p => decodeURIComponent((p.match(/([^/]+?)(?:\.html)?\/?$/) || [])[1] || '')
// a fragment-only navigation inside the frame, without a history entry: absolute, because Location.replace
// resolves against the CALLER's document – a bare '#x' from here would load this page into the frame
const hashTo = (cw, h) => { const u = new URL(cw.location.href); u.hash = h; cw.location.replace(u.href) }
// the color as the dossier's fragment speaks it: its own notation when that holds the color (read off its
// current fragment – a CSS function the app writes), else hex inside sRGB, else oklch(); the app's
// parseColor reads all of them. Spaces and %-signs pre-encoded, as the app writes its own
const FNKEY = { rgb: 'rgb', hsl: 'hsl', oklch: 'oklch', oklab: 'oklab', lab: 'lab', lch: 'lchab' }, WIDEFN = new Set(['oklch', 'oklab', 'lab', 'lchab'])
const enc = t => t.replace(/%/g, '%25').replace(/ /g, '%20')
const dec = t => { try { return decodeURIComponent(t) } catch { return t } }
function token(h = '') { const g = gamutOf(), k = FNKEY[(dec(h).match(/^([a-z][a-z0-9-]*)\(/) || [])[1]]
	if (k && (g === 'srgb' || WIDEFN.has(k)) && CSS_FMT[k]) return enc(CSS_FMT[k](valsOf(k)))
	return g === 'srgb' ? hexNow().slice(1).toLowerCase() : enc(CSS_FMT.oklch(valsOf('oklch'))) }
const read = h => { h = dec(h); if (!h) return null; try { return /^[0-9a-f]{6}$/i.test(h) ? parseColor('#' + h) : parseColor(h) } catch { return null } }
// the same color, to well under a code value – the two sides round differently, never by more
const same = c => { let v; try { v = c.s === 'rgb' ? c.vals : space[c.s].rgb(...c.vals) } catch { return false } return v.every((x, i) => Math.abs(x - RGBX[i]) < .75) }
const src = s => { const q = new URLSearchParams(); if (S.quant !== 'smooth') q.set('q', S.quant); if (PALMODES.has(S.quant) && S.metric !== 'oklab') q.set('m', S.metric)
	return `../index.html?s=${encodeURIComponent(s)}&embed${q.size ? '&' + q : ''}#${token()}` }   // ?s=, not /<space>: the stamped name views exist only in a build, index.html everywhere
// one reconcile step, ~7 times a second while the dock is open. The app writes its color with
// history.replaceState (no hashchange, no popstate), so its fragment is read here; a space switch is a bare
// #<space> fragment its route() opens in place, and it must reach route() alone – color waits for it
function tick() { if (hold && document.activeElement === frame) { if (performance.now() < hold.t && hold.el.isConnected) hold.el.focus({ preventScroll: true }); hold = null }   // see DOCK.open
	const cw = cwin(); if (!cw) return; const loc = cw.location
	if (want) { if (spaceOf(loc.pathname) !== want) { if (loc.hash !== '#' + want) hashTo(cw, want); return } want = null }
	const h = loc.hash.slice(1)
	if (h !== seen) { seen = h; const c = read(h)
		if (c && !same(c)) { pulling = true; color(c.s, c.vals); pulling = false; dirty = false; return } }   // the dossier spoke: the catalog follows
	if (dirty) { dirty = false; const c = read(h); if (!c || !same(c)) { seen = token(h); hashTo(cw, seen) } } }   // the catalog spoke: the dossier follows, without a history entry
document.addEventListener('wb:color', () => { if (!pulling && dock.open) dirty = true })
document.addEventListener('keydown', e => { if (e.key === 'Tab') hold = null })   // tabbing into the frame is a person's move too
// the lens and the theme follow into the dossier through its own controls (hidden in embed, still wired)
function lens(key) { const cw = cwin(); if (!cw) return; const d = cw.document
	const put = (id, v) => { const el = d.getElementById(id); if (el && el.value !== v) { el.value = v; el.dispatchEvent(new cw.Event('change')) } }
	if (key === 'quant' || key === 'metric') { put('qseg', S.quant); if (PALMODES.has(S.quant)) put('mseg', S.metric) }
	if (key === 'limit' && limitSet) put('gseg', S.limit) }
document.addEventListener('wb:set', ({ detail: { key } }) => { if (key === 'limit') limitSet = true; lens(key) })
function themeIn() { const cw = cwin(); if (!cw) return; const d = cw.document.documentElement, t = root.dataset.theme
	if (d.dataset.theme !== t) { const b = cw.document.getElementById('thm'); b ? b.click() : d.dataset.theme = t } }
document.addEventListener('wb:theme', themeIn)
function loaded() { ready = true; dload.hidden = true; const cw = cwin(); if (!cw) return
	seen = cw.location.hash.slice(1); themeIn(); lens('limit')
	cw.addEventListener('hashchange', tick)   // a fragment link inside the dossier – read at once
	cw.addEventListener('keydown', e => { if (e.key === 'Escape' && !e.target.closest?.('select')) { e.preventDefault(); closePane() } })   // Esc inside the frame never reaches this document
	cw.addEventListener('pointerdown', () => { hold = null }, true)   // a person reaching into the dossier keeps the focus they give it
	tick() }
function navState(s) { const list = [...cat.querySelectorAll('.sp')].map(e => e.dataset.s), k = list.indexOf(s)
	for (const [b, t, w] of [[$('dock-prev'), list[k - 1], 'Previous'], [$('dock-next'), list[k + 1], 'Next']]) {   // the neighbours by name, as the site's card does
		b.disabled = k < 0 || !t; b.querySelector('span').textContent = t ? disp(t) : ''; b.setAttribute('aria-label', t ? `${w} space – ${disp(t)}` : `${w} space`) } }
const entry = s => s && cat.querySelector(`.sp[data-s="${CSS.escape(s)}"]`)
// as a modal (index.html's card over the lit page, the header live above it) or beside the page from 75rem, a
// full-screen dialog below it
const modal = () => root.dataset.dossier === 'modal'
function present() { if (dock.open) dock.close(); modal() || WIDE.matches ? dock.show() : dock.showModal() }
function show(focus, s) { const a = document.activeElement
	if (!dock.open) { steady(() => { present(); document.body.classList.add('dockon') }, entry(s)); tickT = setInterval(tick, 150) }   // docked, the page gives up its width – the entry opened stays under the pointer
	if (focus || modal() || !WIDE.matches) { $('dock-x').focus({ preventScroll: true }); return }   // then the dossier's own title takes it, as the app does on every open
	// a quiet open (a tour stop, prev/next) keeps focus where it was: show() moves it, and so does the app –
	// it focuses its card on every open, which pulls focus into the frame; tick() hands it back for a moment after
	if (a && a !== document.body && a.isConnected) { a.focus({ preventScroll: true }); hold = { el: a, t: performance.now() + 8000 } } }
const DOCK = {
	open(s, { focus } = {}) { if (orbiting()) stopOrbit()   // the catalog holds still while the dossier reads it
		$('dock-t').textContent = disp(s); frame && (frame.title = `${disp(s)} – the dossier`); navState(s)
		if (!frame) { frame = Object.assign(document.createElement('iframe'), { title: `${disp(s)} – the dossier`, src: src(s) }); frame.addEventListener('load', loaded); dfr.append(frame) }
		else if (ready) { want = s; tick() }   // in place: the app opens the dossier for a #<space> fragment – no reload
		else frame.src = src(s)
		show(focus, s) },
	close() { if (!dock.open) return; clearInterval(tickT); steady(() => { dock.close(); document.body.classList.remove('dockon') }, cat.querySelector('.sp.on')) },
}
// Esc on a full-screen dock is a close request: it goes through wb.js, which keeps S.sel, the URL and focus
dock.addEventListener('cancel', e => { e.preventDefault(); closePane() })
dock.addEventListener('click', e => { if (e.target === dock && modal()) closePane() })   // beside the card: the page, as on the site
// crossing 75rem: the same dock, docked or full-screen – the iframe stays loaded
WIDE.addEventListener('change', () => { if (dock.open && !modal()) present() })

// ── the featured row is the layout's: as many featured spaces per shelf as the grid has columns (--cols, atlas.css –
// 3 · 2 · 1 by the catalog's width), the starred ones first; crossing a breakpoint re-renders the shelves ──
const colsNow = () => { const sh = cat.querySelector('.shelf') || cat.appendChild(Object.assign(document.createElement('div'), { className: 'shelf' }))
	const n = +getComputedStyle(sh).getPropertyValue('--cols') || 3; if (!sh.isConnected || !sh.childElementCount) sh.remove(); return n }
S.leadN = colsNow()
new ResizeObserver(() => { const n = colsNow(); if (n !== S.leadN) { S.leadN = n; wb.renderCat() } }).observe(cat)

// ── the closing: index.html's API and its questions, borrowed – index.html is the one source of their words. They
// load as the reader nears the footer, take the hanging grid (atlas.css) and work as they do there: the tabs swap
// their panels, the LUT and ICC panels make real files, and the links speak index.html's fragments – #<space>
// opens that dossier, #<color> makes it the current color ──
const foot = document.querySelector('.foot')
async function borrow() { const html = await fetch('../index.html').then(r => r.ok ? r.text() : '', () => '')
	const d = new DOMParser().parseFromString(html, 'text/html'), intro = d.querySelector('.introcopy'), fqs = d.querySelector('.faq .fqs')
	if (!intro || !fqs) return
	const sec = (attrs, body) => { const el = Object.assign(document.createElement('section'), { className: 'work clo' })
		for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
		el.innerHTML = '<div class="row"><span class="lab" aria-hidden="true"></span><div class="clo-c"></div></div>'; el.querySelector('.clo-c').append(body); return el }
	const api = Object.assign(document.createElement('div'), { className: 'clo-api' }); api.append(...intro.children)
	foot.before(sec({ id: 'api', 'aria-labelledby': 'introcopy-title' }, api), sec({ id: 'faq', 'aria-label': 'Questions' }, fqs))
	for (const a of document.querySelectorAll('.clo a[href^="#"]')) a.addEventListener('click', e => { const h = dec(a.hash.slice(1)), c = !SPACES.includes(h) && read(h)
		if (SPACES.includes(h)) { e.preventDefault(); wb.openPane(h, { from: a, scroll: false }) } else if (c) { e.preventDefault(); color(c.s, c.vals) } })
	wireApi($('apitabs')) }
// index.html's API panel: the tabs, then the two exporters – any pair to a .cube, any space to an .icc
async function wireApi(tabs) { if (!tabs) return
	const panes = [...tabs.querySelectorAll(':scope>[data-p]')], btns = [...tabs.querySelectorAll('.tabrow button')]
	const act = (p, focus) => { for (const b of btns) { const on = b.dataset.p === p; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus() }
		for (const x of panes) x.hidden = x.dataset.p !== p }
	btns.forEach((b, i) => { b.onclick = () => act(b.dataset.p)
		b.onkeydown = e => { const n = btns.length, k = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: n - 1 }[e.key]; if (k === undefined) return; e.preventDefault(); act(btns[(k + n) % n].dataset.p, true) } })
	const [{ sections, secName }, { LUTOK, LUTTGT }, X] = await Promise.all([import('../js/render.js'), import('../js/core.js'), import('../js/study-runtime.js')])
	const groups = ok => sections.map(c => { const o = c.spaces.filter(ok); return o.length ? `<optgroup label="${esc(secName(c))}">${o.map(v => `<option value="${v}">${esc(disp(v))}</option>`).join('')}</optgroup>` : '' }).join('')
	const save = (data, name, type) => { const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([data], { type })), download: name }); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000) }
	const sci = x => x === 0 ? '0' : x.toExponential(1)
	const lf = $('lutfrom'), lt = $('lutto'), lseg = $('lutszL'), l1d = $('lut1dL'), ldl = $('lutdlL'), lst = $('lutstatL')
	if (lf) { let n = 33
		lf.innerHTML = groups(s => LUTOK.has(s)); lt.innerHTML = groups(s => LUTTGT.has(s)); lf.value = 'slog3'; lt.value = 'rec709'
		const one = () => X.channelwise(space[lf.value], space[lt.value])
		const measure = () => { try { if (lf.value === lt.value) throw new Error('pick two different spaces')
				const o = one(), tab = X.table(space[lf.value], space[lt.value], o ? {} : { size: n }), v = X.verify(tab, 400), e = v.in.share > 0 && v.in.share < .999 ? v.in : v
				const bytes = (tab.dims === 3 ? tab.size ** 3 : tab.size) * 21 + 430; ldl.disabled = false; lseg.style.display = o ? 'none' : ''; l1d.style.display = o ? '' : 'none'
				lst.textContent = `${o ? tab.size + '-pt 1D' : tab.size + '³'} · median ${sci(e.median)}, max ${sci(e.max)} · ≈${bytes > 1e6 ? (bytes / 1e6).toFixed(1) + ' MB' : Math.round(bytes / 1e3) + ' kB'}` }
			catch (err) { ldl.disabled = true; lst.textContent = err?.message || 'no finite LUT for this pair' } }
		lf.onchange = lt.onchange = measure
		lseg.onclick = e => { const b = e.target.closest('[data-z]'); if (!b) return; n = +b.dataset.z; for (const x of lseg.children) x.classList.toggle('on', x === b); measure() }
		ldl.onclick = () => { try { const o = one(); save(X.cube(space[lf.value], space[lt.value], o ? {} : { size: n }), `${lf.value}-to-${lt.value}${o ? '' : '-' + n}.cube`, 'text/plain'); wb.toast('LUT saved') } catch { wb.toast('No LUT for this pair') } }
		once($('api-panel-lut'), measure) }
	const ic = $('iccsp'), idl = $('iccdlL'), ist = $('iccstatL')
	if (ic) { const KIND = { mntr: 'v2 matrix+TRC display', spac: 'v2 CLUT, device↔Lab both ways', scnr: 'v2 CLUT, device→Lab (one-way)' }
		const kind = s => { try { return X.kind(space[s], { xyz: space.xyz }) } catch { return null } }
		const show = () => { try { const b = X.profile(space[ic.value], { xyz: space.xyz }); idl.disabled = false; ist.textContent = `${(b.length / 1024).toFixed(1)} kB · D50 PCS · ${KIND[kind(ic.value)] || ''}` }
			catch (err) { idl.disabled = true; ist.textContent = err?.message || 'no profile for this space' } }
		ic.onchange = show
		idl.onclick = () => { try { save(X.profile(space[ic.value], { xyz: space.xyz }), `${ic.value}.icc`, 'application/vnd.iccprofile'); wb.toast('ICC saved') } catch { wb.toast('No profile for this space') } }
		once($('api-panel-icc'), () => { const ok = new Set(SPACES.filter(kind)); ic.innerHTML = groups(s => ok.has(s)); ic.value = ok.has('p3') ? 'p3' : ic.options[0]?.value; show() }) } }
// once, when an element first comes into view – a hidden panel never does, so its work waits for its tab, by click or by key
function once(el, f, margin = '0px') { if (el) new IntersectionObserver((es, o) => { if (es.some(e => e.isIntersecting)) { o.disconnect(); f() } }, { rootMargin: margin }).observe(el) }
once(foot, borrow, '0px 0px 150% 0px')

// ── boot: the header and the hero first, then the workbench wires the page ──
mountTop({ top, cells, wb }); fill(top); fill(cells); pin(); new ResizeObserver(pin).observe(top.querySelector('.top'))
await useHero(new URLSearchParams(location.search).get('hero'))
boot({ arrange: 'family', view: 'grid', preview: 'sliders', quant: 'smooth', dock: DOCK })

// Cite: the atlas's own BibTeX and APA (CITATION.cff, baked by build-site), read once on first open
$('a-cite').addEventListener('toggle', e => { if (e.newState === 'open') loadCite().then(c => { $('a-cite-b').innerHTML = citeHTML(c) }) })
