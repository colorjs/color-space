// Atlas – the workbench's catalog-first direction, now a WORKSHOP for its top: the header, the hero and the
// options come in variants (atlas.html?top=<key>), the body – the catalog with its family ladder, the footer
// and the docked live dossier – is this file's and every variant shares it.
//
// ── THE TOP-VARIANT CONTRACT ──────────────────────────────────────────────────────────────────────────────
// A variant is a pair, top-<key>.css + top-<key>.js; <key> ∈ studio · editorial · search · statusbar · drawer
// (TOPS below; studio is the default). The workshop bar swaps variants in place – no reload – and writes ?top=<key>.
// All state lives in wb.js (S, W) and the URL, never in a variant: the color, the filters, the search, the lens,
// the open dossier and the scroll survive a swap.
//
// Mounts – empty when mount() runs; a variant may leave one empty or move a control to another:
//   #top   the bar(s). The shell pins it (sticky, top 0) and measures it into --top-h.
//   #hero  the definition sentence and the tour (its strip and the open stop's card).
//   #opts  the facets, the purpose tags, the count, the view and lens controls. A variant that pins it
//          (position:sticky; top:var(--top-h)) gets its height added to --stick-top – the line the catalog's
//          sticky family titles hang under (CSS cannot read a wrapped bar's height, so the shell measures).
//          A bar pinned to the bottom edge sets its own height as --stick-bot: the ladder's bottom pile, the
//          workshop bar, the toast, the footer's last line and scrolled-to focus keep clear of it.
//
// JS – `export default function mount({ top, hero, opts, wb })`, optionally returning a cleanup function:
//   write markup with HOSTS, <span data-wb="<name>"></span>; the shell fills them right after (wb.fill) and
//   wb.js re-renders each whenever its state changes (refresh) – a variant only arranges. The hosts:
//     brand    the wordmark                       chip     swatch + notation input + gamut pill
//     search   the find field                     theme    light/dark button      gh  GitHub link
//     tools    theme + gh                         lang     EN + the planned languages
//     vision   the color-vision lens              count    "166 spaces"
//     view     size + swatch + layout + preview   size     the A–A slider
//     swatch   swatch style (smooth · steps · dots – the "sliders kind")
//     layout   grid · rows · list                 preview  featured cards show sliders · planes
//     quant    the quantization select (smooth · steps · palettes – the atlas's groups and words)
//     metric   the palette distance (shown only under a palette lens)        limit  sRGB · P3 · Rec. 2020 · Surface · Light
//     cells    the 8 facets as Studio's cells (icon, label over value)       stripe the 8 facets as quiet text selects
//     tags     the 10 purposes                    orient   the definition sentence
//     stops    the tour as a numbered strip       stop     the open stop's card (empty when none)   tour  the card, always
//     try      five colors to try (variants.html Studio's swatches)
//     cell     data-m="<key>": a drawer cell's face (icon, label over value)    dclear  the drawer's Clear link
//     menu     data-m="<key>": one drawer cell's illustrated options
//   The drawer (the 8 facets, Draw · Limit · View) is written once with wb.drawerHTML() – its cells – and
//   wb.menusHTML() – their popovers: both must persist (an open menu is anchored to its cell), so they hold
//   cell and menu hosts rather than being hosts themselves.
//   Every host's render function is exported from wb.js too (brandHTML … stopsHTML) for markup a host cannot
//   express. Controls that carry ids (chip, search, theme) render once per page. Behaviour is wb.js's one
//   delegate; a variant adds listeners only for its own layout affordances (a toggle, a popover) and returns a
//   cleanup that removes them.
// CSS – scope every rule under :root[data-top="<key>"] (the shell sets it; during a swap both sheets are live
//   for a moment). Tokens only. Shared looks (.fsel, .cell/.wb-cell, .wb-stops, .seg, .tag, .find, .cur) come
//   from variants.css/wb.css – a variant arranges and spaces them. Breakpoints are container queries on the
//   page beside the dock – @container page (width < 75rem) – never the viewport: with the dossier docked a
//   1440 screen leaves the page about 48rem. The mounts live in .page, a size container, so position:fixed
//   there is relative to the page; a sheet or overlay belongs in the top layer (popover, dialog).
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
//
// The details are the atlas's own dossier, not the workbench pane: /<space>?embed (index.html's chrome-free
// card) in a same-origin iframe – docked right from 75rem (the catalog reflows), a full-screen dialog below.
// wb.js keeps S.sel, the URL (?s=), the catalog's highlight, prev/next and focus return; the dock is its
// `dock` hook. The color travels both ways through the iframe's URL fragment, the app's own channel.
import * as wb from './wb.js'
import { boot, fill, S, disp, esc, plate, loadCite, citeHTML, closePane, stopOrbit, orbiting, color, PALMODES } from './wb.js'
import { RGBX, valsOf, gamutOf, hexNow, parseColor, space } from '../js/variants-model.js'
import { CSS as CSS_FMT } from '../js/study-runtime.js'
import { OI, UI } from '../js/variants-icons.js'

const $ = id => document.getElementById(id), root = document.documentElement
const WIDE = matchMedia('(width >= 75rem)')   // wb.js's breakpoint: the dossier docks from here up
const top = $('top'), hero = $('hero'), opts = $('opts'), cat = $('cat')

// ── the workshop: four top variants, swapped in place ──
const TOPS = [['studio', 'Studio'], ['editorial', 'Editorial'], ['search', 'Search'], ['statusbar', 'Status bar'], ['drawer', 'Drawer']]
const topOf = k => TOPS.some(t => t[0] === k) ? k : 'studio'
$('tops').innerHTML = TOPS.map(([k, n]) => `<button type="button" data-top="${k}" aria-pressed="false">${n}</button>`).join('')
let topKey = null, cleanup = null, seq = 0
// the variant's sheet: a new <link> loads beside the old one (inert until data-top names it); the old one
// leaves with the old markup – resolves to a function that retires it
function sheet(k) { const old = $('topcss'), href = `./top-${k}.css`
	if (old.getAttribute('href') === href) return Promise.resolve(() => {})
	return new Promise(ok => { const l = Object.assign(document.createElement('link'), { rel: 'stylesheet', href })
		l.onload = l.onerror = () => ok(() => { old.remove(); l.id = 'topcss' }); old.after(l) }) }
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
async function useTop(k) { k = topOf(k); if (k === topKey) return
	const my = ++seq, [mod, retire] = await Promise.all([import(`./top-${k}.js`), sheet(k)]); if (my !== seq) return
	const swap = () => { try { cleanup?.() } catch {} cleanup = null
		for (const m of [top, hero, opts]) { m.replaceChildren(); m.removeAttribute('class'); m.removeAttribute('style') }
		root.dataset.top = topKey = k; retire()
		cleanup = mod.default({ top, hero, opts, wb }) || null
		fill(top); fill(hero); fill(opts); pin() }
	topKey ? steady(swap) : swap()   // the first top mounts on an unscrolled page
	for (const b of $('tops').children) b.setAttribute('aria-pressed', b.dataset.top === k)
	try { const u = new URL(location.href); u.searchParams.set('top', k); history.replaceState(null, '', u) } catch {} }
$('tops').addEventListener('click', e => { const b = e.target.closest('[data-top]'); if (b) useTop(b.dataset.top) })

// the pinned stack: #top always, #opts when the variant makes it sticky
function pin() { const th = top.offsetHeight, os = getComputedStyle(opts).position === 'sticky' ? opts.offsetHeight : 0
	root.style.setProperty('--top-h', th + 'px'); root.style.setProperty('--stick-top', th + os + 'px') }
const RO = new ResizeObserver(pin); RO.observe(top); RO.observe(opts)
addEventListener('resize', pin, { passive: true })

// the footer's two commands, as the site's code plates
$('f-npm-p').innerHTML = plate('npm install color-space', 'npm install command', { wrap: true })
$('f-mcp-p').innerHTML = plate('npx -y color-space mcp', 'MCP server command', { wrap: true })

// ── the ladder: every render of the catalog gets its titles' icons, jump buttons and stack positions ──
// the families' icons – glyphs the shared line family already draws, one per family
const FAMI = { 'Display & web': OI.display, 'RGB remixes': OI.polar, 'Perceptual': OI.opponent, 'Colorimetry & research': OI.chromaticity,
	'Video & broadcast': OI.delivery, 'Film & camera': OI.scene, 'Color order & surface': OI.palettes }
let act = -1
function decorate() { const shs = [...cat.querySelectorAll('.shelf')], n = shs.length
	shs.forEach((sh, i) => { const hd = sh.querySelector(':scope>.sh'), h2 = hd?.querySelector('h2'); if (!h2 || h2.querySelector('.tn')) return
		const name = h2.textContent
		hd.style.setProperty('--i', i); hd.style.setProperty('--j', n - 1 - i)   // its rung in the top pile, and in the bottom one
		h2.innerHTML = `<button type="button" class="tn" data-jump>${FAMI[name] ? `<span class="fic">${FAMI[name]}</span>` : ''}<span>${esc(name)}</span></button>` })
	act = -1; mark(); if (S.sel) navState(S.sel) }
// the family on screen: the last one whose content has crossed a third of the way down (index.html's rule)
function mark() { const shs = [...cat.querySelectorAll('.shelf')], lim = innerHeight * .35; let k = 0
	shs.forEach((sh, i) => { const f = sh.querySelector(':scope>.sh+*'); if (f && f.getBoundingClientRect().top <= lim) k = i })
	if (k === act) return; act = k
	shs.forEach((sh, i) => { const hd = sh.querySelector(':scope>.sh'), b = hd?.querySelector('.tn'); if (!b) return
		hd.classList.toggle('act', i === k); i === k ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current') }) }
let mraf = 0
addEventListener('scroll', () => { mraf ||= requestAnimationFrame(() => { mraf = 0; mark() }) }, { passive: true })
addEventListener('resize', () => { act = -1; mark() }, { passive: true })
new MutationObserver(decorate).observe(cat, { childList: true })   // wb.js re-renders the catalog on every filter and view change
document.addEventListener('click', e => { const j = e.target.closest('[data-jump]'); if (j) j.closest('.shelf')?.querySelector(':scope>.sh+*')?.scrollIntoView({ block: 'start' }) })

// ── the dock: the live dossier in an iframe ──
const dock = $('dock'), dfr = dock.querySelector('.dfr'), dload = $('dock-load')
$('dock-prev').innerHTML = UI.prev; $('dock-next').innerHTML = UI.next; $('dock-x').innerHTML = UI.x
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
	return `../${encodeURIComponent(s)}?embed${q.size ? '&' + q : ''}#${token()}` }
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
	$('dock-prev').disabled = k <= 0; $('dock-next').disabled = k < 0 || k >= list.length - 1 }
const entry = s => s && cat.querySelector(`.sp[data-s="${CSS.escape(s)}"]`)
function show(focus, s) { const a = document.activeElement
	if (!dock.open) { steady(() => { WIDE.matches ? dock.show() : dock.showModal(); document.body.classList.add('dockon') }, entry(s)); tickT = setInterval(tick, 150) }   // docked, the page gives up its width – the entry opened stays under the pointer
	if (focus || !WIDE.matches) { $('dock-x').focus({ preventScroll: true }); return }   // then the dossier's own title takes it, as the app does on every open
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
// crossing 75rem: the same dock, docked or full-screen – the iframe stays loaded
WIDE.addEventListener('change', () => { if (!dock.open) return; dock.close(); WIDE.matches ? dock.show() : dock.showModal() })

// ── boot: the top variant first, then the workbench wires the page ──
await useTop(new URLSearchParams(location.search).get('top'))
boot({ arrange: 'family', view: 'grid', preview: 'sliders', quant: 'smooth', dock: DOCK })

// Cite: the atlas's own BibTeX and APA (CITATION.cff, baked by build-site), read once on first open
$('a-cite').addEventListener('toggle', e => { if (e.newState === 'open') loadCite().then(c => { $('a-cite-b').innerHTML = citeHTML(c) }) })
