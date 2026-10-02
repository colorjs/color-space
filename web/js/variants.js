// UI-variants workshop – wiring. One state, four control variants, three looks; the catalog and
// the pane never change between them, so a comparison is about the controls and the feel alone.
import { S, BARS, STYLES, store, setColor, RGB, hexNow, valsOf, gamutOf, GAMLABEL, GAMTIP, parseColor, clearAll, toggle, SPACES, classify, meta } from './variants-model.js'
import { catalogHTML, paintEntry, paneHTML, paintPane, paintSolid, PANE } from './variants-catalog.js'
import { topHTML, ctlHTML, sbarHTML, placePops, explain0 } from './variants-bars.js'
import { CAP } from './variants-data.js'
import { UI } from './variants-icons.js'
import { setGLReady, hasPlaneGL } from './gl.js'
import { ink } from './render.js'
import { clamp, hex } from './core.js'

const $ = id => document.getElementById(id), root = document.documentElement, NARROW = matchMedia('(max-width:56rem)')
const NOTE = { sentence: 'Reads as one sentence – every value is a word you can change.', drawer: 'Labeled cells – each opens a drawer of illustrated options.',
	guide: 'Starts from the task – every choice in view, one line explains what you point at.', studio: 'Wears your color – icon groups, filters in one sheet.',
	bench: 'An editor’s light theme – near-white panels, hairlines, raised controls, fields in shallow wells.', paper: 'Warm paper, serif prose, hairline rules.', soft: 'Rounded cards and pills, soft depth.', tinted: 'The page takes on the current color.' }

// ── rooms: the variant, the look, the theme ──
function room() { root.dataset.bar = S.bar; root.dataset.style = S.style
	document.querySelectorAll('[data-ws-bar]').forEach(b => b.setAttribute('aria-pressed', b.dataset.wsBar === S.bar))
	document.querySelectorAll('[data-ws-style]').forEach(b => b.setAttribute('aria-pressed', b.dataset.wsStyle === S.style))
	try { const u = new URL(location.href); u.searchParams.set('bar', S.bar); u.searchParams.set('style', S.style); history.replaceState(null, '', u) } catch {} }
document.querySelectorAll('[data-ws-bar],[data-ws-style]').forEach(b => b.title = NOTE[b.dataset.wsBar || b.dataset.wsStyle])
const theme = t => { root.dataset.theme = t; store.set('theme', t); const b = $('thm'); if (b) { b.innerHTML = t === 'dark' ? UI.sun : UI.moon; b.title = t === 'dark' ? 'Light' : 'Dark' } }

// ── painting only what is on screen; a color change dirties everything, visible first ──
const vis = new Set(), todo = new Set(); let raf = 0, drag = null
const IO = new IntersectionObserver(es => { for (const e of es) { if (e.isIntersecting) { vis.add(e.target); if (!e.target._clean) queue(e.target) } else vis.delete(e.target) } }, { rootMargin: '400px 0px' })
const queue = el => { todo.add(el); raf ||= requestAnimationFrame(flush) }
function flush() { raf = 0; const t0 = performance.now()
	for (const el of todo) { todo.delete(el); if (el.isConnected && !el._clean) paintEntry(el, drag ? 12 : 24); if (performance.now() - t0 > 14) { raf = requestAnimationFrame(flush); return } } }
function dirty() { for (const el of document.querySelectorAll('#cat .sp')) el._clean = false; for (const el of vis) queue(el) }

// text ON the current color takes whichever ink contrasts more (WCAG 2.x relative luminance) –
// the thumb rule ink() answers a different question: which ring reads around a marker
const wlum = c => c.map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0)
const textInk = c => { const L = wlum(c); return 1.05 / (L + 0.05) >= (L + 0.05) / 0.06 ? '#fff' : 'var(--dark)' }
function paintCur() { const h = hexNow(), g = gamutOf()
	root.style.setProperty('--cur', h); root.style.setProperty('--cur-ink', textInk(RGB))
	const cp = $('cpick'), cv = $('cval'), gm = $('gam'); if (!cv) return
	cp.value = h.toLowerCase()
	if (document.activeElement !== cv) { cv.value = g === 'srgb' ? h : `${S.space}(${S.vals.map(v => +(+v).toFixed(4)).join(' ')})`; cv.removeAttribute('aria-invalid') }
	gm.textContent = GAMLABEL[g]; gm.title = GAMTIP[g]; gm.dataset.g = g; paintSb() }
function color(s, vals, from) { setColor(s, vals); paintCur(); dirty(); if (from) paintEntry(from, 24); paintPane(true) }

function renderTop() { $('top').innerHTML = topHTML(); $('count').textContent = `${SPACES.length} spaces`; theme(root.dataset.theme || 'light'); paintCur(); $('q').value = S.q; $('findw').classList.toggle('has', !!S.q) }
function renderCtl() { $('ctl').innerHTML = ctlHTML(); $('sbar').innerHTML = sbarHTML(); paintSb(); placePops() }
const paintSb = () => { const h = $('sbhex'); if (!h) return; h.textContent = hexNow(); const g = gamutOf(); $('sbgam').textContent = GAMLABEL[g]; $('sbgam').title = GAMTIP[g] }
function renderCat() { IO.disconnect(); vis.clear(); todo.clear()
	$('cat').innerHTML = catalogHTML(); for (const el of document.querySelectorAll('#cat .sp')) IO.observe(el) }
const renderAll = () => { renderCtl(); renderCat() }

// ── the pane: beside the catalog on desktop, a dialog on phones ──
let back = null
function open(s, from) { if (!SPACES.includes(s)) return; back = from || document.activeElement
	S.sel = s; const pane = $('pane'); pane.innerHTML = paneHTML(s); pane.hidden = false; pane.scrollTop = 0
	document.body.classList.add('paneon'); modal()
	document.querySelectorAll('#cat .sp').forEach(el => el.classList.toggle('on', el.dataset.s === s))
	paintPane(true); if (NARROW.matches) $('ptitle').closest('.ph').querySelector('[data-close]').focus({ preventScroll: true })
	document.querySelector(`#cat .sp[data-s="${CSS.escape(s)}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }
function close() { S.sel = null; const pane = $('pane'); pane.hidden = true; pane.innerHTML = ''; document.body.classList.remove('paneon'); modal()
	document.querySelectorAll('#cat .sp.on').forEach(el => el.classList.remove('on')); back?.isConnected && back.focus({ preventScroll: true }) }
function modal() { const m = NARROW.matches && !!S.sel, pane = $('pane')
	pane.setAttribute('role', m ? 'dialog' : 'complementary'); m ? pane.setAttribute('aria-modal', 'true') : pane.removeAttribute('aria-modal')
	pane.setAttribute('aria-labelledby', 'ptitle'); for (const id of ['top', 'ctl', 'cat', 'ws']) $(id).inert = m }
NARROW.addEventListener('change', modal)
const go = d => { const list = [...document.querySelectorAll('#cat .sp')].map(e => e.dataset.s), k = list.indexOf(S.sel); if (k >= 0 && list[k + d]) open(list[k + d]) }

// ── one delegate for every control, whichever variant drew it ──
document.addEventListener('click', e => { const t = e.target.closest('button,[data-ws-bar],[data-ws-style]')
	if (!e.target.closest('.pop,.drawer,[data-open]') && S.open) { S.open = null; renderCtl() }
	if (S.open?.startsWith('sb-') && t?.dataset.set) { S.open = null }   // a status-bar pick closes its menu
	if (!t) return
	const d = t.dataset
	if (d.wsBar || d.wsStyle) { if (d.wsBar) S.bar = d.wsBar; if (d.wsStyle) S.style = d.wsStyle; store.set('bar', S.bar); store.set('style', S.style); S.open = null; S.more = false; room(); if (d.wsBar) { renderTop(); renderCtl() } return }
	if (d.openS) return open(d.openS, t)
	if (d.close !== undefined) return close()
	if (d.shut) { const sh = t.closest('.shelf'), on = !S.shut.has(d.shut); on ? S.shut.add(d.shut) : S.shut.delete(d.shut); sh.classList.toggle('shut', on); t.setAttribute('aria-expanded', !on); return }
	if (d.go) return go(+d.go)
	if (d.open) { S.open = S.open === d.open ? null : d.open; renderCtl(); return }
	if (d.f && d.v) { toggle(d.f, d.v); if (t.closest('#pane')) { S.open = null } renderAll(); return }
	if (d.clear) { S.F[d.clear].clear(); renderAll(); return }
	if (d.reset !== undefined) { clearAll(); $('q').value = ''; $('findw').classList.remove('has'); renderAll(); return }
	if (d.more !== undefined) { S.more = true; renderCtl(); return }
	if (d.sort) { S.tdir = S.tsort === d.sort ? (S.tdir > 0 ? -1 : (S.tsort = null, 1)) : (S.tsort = d.sort, 1); renderCat(); return }
	if (d.set) { S[d.set] = d.v; if (d.set !== 'quant' && d.set !== 'limit') S.open = null
		renderCtl(); if (['arrange', 'view', 'preview'].includes(d.set)) renderCat(); else { dirty(); paintPane(true) } return }
	if (d.try) { const c = parseColor(d.try); if (c) color(c.s, c.vals); return }
	if (t.id === 'dice') return color('oklch', [.55 + Math.random() * .3, .08 + Math.random() * .14, Math.random() * 360])
	if (t.id === 'thm') return theme(root.dataset.theme === 'dark' ? 'light' : 'dark')
	if (t.id === 'qx') { S.q = ''; $('q').value = ''; $('findw').classList.remove('has'); renderAll(); $('q').focus() } })
// the guide's (and the filter sheet's) one explaining line follows the pointer and the focus
const explain = e => { const x = $('explain'); if (!x) return; const t = e.target.closest?.('[data-tip]'); x.textContent = t ? t.dataset.tip : explain0() }
document.addEventListener('pointerover', explain); document.addEventListener('focusin', explain)

// ── typing: the search, the color, any reading ──
let qT = 0
document.addEventListener('input', e => { const t = e.target
	if (t.id === 'q') { $('findw').classList.toggle('has', !!t.value); clearTimeout(qT); qT = setTimeout(() => { S.q = t.value.trim(); renderAll() }, 120); return }
	if (t.id === 'cpick') { const h = t.value; return color('rgb', [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))) }
	if (t.classList.contains('nrg')) { const el = t.closest('.sp,#pane'), s = el.id === 'pane' ? S.sel : el.dataset.s, v = valsOf(s).slice()
		v[+t.dataset.i] = +t.value; t.closest('.ch')?.classList.add('live'); drag = el; color(s, v, el.id === 'pane' ? null : el) } })
document.addEventListener('change', e => { const t = e.target
	if (t.classList.contains('nrg')) { drag = null; t.closest('.ch')?.classList.remove('live'); dirty(); paintPane(true); return }
	if (t.id === 'cval') { const c = parseColor(t.value); if (c) { color(c.s, c.vals); t.blur() } else t.setAttribute('aria-invalid', 'true'); return }
	if (t.classList.contains('cv') && t.tagName === 'INPUT') { const el = t.closest('.sp,#pane'), s = el.id === 'pane' ? S.sel : el.dataset.s, i = +t.dataset.i, c = meta[s].channels[i], x = parseFloat(t.value)
		if (!isFinite(x)) { t.setAttribute('aria-invalid', 'true'); return } t.removeAttribute('aria-invalid')
		const v = valsOf(s).slice(); v[i] = c.max === 360 ? ((x % 360) + 360) % 360 : clamp(x, c.min, c.max); color(s, v) } })
document.addEventListener('keydown', e => {
	if (e.key === 'Enter' && e.target.id === 'cval') { e.target.dispatchEvent(new Event('change', { bubbles: true })); return }
	if (e.key === 'Escape') { if (S.open) { S.open = null; renderCtl(); return } if (S.sel) { close(); return } }
	if (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName)) { e.preventDefault(); $('q').focus(); return }
	if (e.key === 'Tab' && NARROW.matches && S.sel) { const all = [...$('pane').querySelectorAll('button:not(:disabled),a[href],input,[tabindex="0"]')].filter(el => el.getClientRects().length)
		if (e.shiftKey && document.activeElement === all[0]) { e.preventDefault(); all.at(-1).focus() } else if (!e.shiftKey && document.activeElement === all.at(-1)) { e.preventDefault(); all[0].focus() } }
	const w = e.target.closest?.('.solid-wrap'); if (w && e.key.startsWith('Arrow')) { e.preventDefault()
		if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') PANE.rot[0] += e.key === 'ArrowLeft' ? -.15 : .15
		else PANE.rot[1] = clamp(PANE.rot[1] + (e.key === 'ArrowUp' ? .15 : -.15), -Math.PI / 2, Math.PI / 2); paintSolid() } })

// ── dragging on planes picks two channels at once; dragging the solid turns it ──
document.addEventListener('pointerdown', e => {
	const pl = e.target.closest('.pl'), w = e.target.closest('.solid-wrap')
	if (pl) { const el = pl.closest('.sp,#pane'), s = el.id === 'pane' ? S.sel : el.dataset.s, c = classify(s), a = +pl.dataset.a, b = +pl.dataset.b
		const at = ev => { const r = pl.getBoundingClientRect(), fx = clamp((ev.clientX - r.left) / r.width, 0, 1), fy = clamp((ev.clientY - r.top) / r.height, 0, 1), v = valsOf(s).slice()
			v[a] = c.ch[a].min + fx * (c.ch[a].max - c.ch[a].min); v[b] = c.ch[b].min + (1 - fy) * (c.ch[b].max - c.ch[b].min); color(s, v, el.id === 'pane' ? null : el) }
		pl.setPointerCapture(e.pointerId); drag = el; at(e); pl.onpointermove = at
		pl.onpointerup = pl.onpointercancel = () => { pl.onpointermove = null; drag = null; dirty(); paintPane(true) }; e.preventDefault(); return }
	if (w) { let x = e.clientX, y = e.clientY; w.setPointerCapture(e.pointerId)
		w.onpointermove = ev => { PANE.rot[0] += (ev.clientX - x) * .011; PANE.rot[1] = clamp(PANE.rot[1] - (ev.clientY - y) * .011, -Math.PI / 2, Math.PI / 2); x = ev.clientX; y = ev.clientY; paintSolid() }
		w.onpointerup = w.onpointercancel = () => { w.onpointermove = null } } })
addEventListener('resize', placePops)

// the sticky band's height, for the shelf headings that pin under it – a measured value CSS cannot know
const ctlh = () => { const c = $('ctl'); root.style.setProperty('--ctlh', getComputedStyle(c).position === 'sticky' ? c.offsetHeight + 'px' : '0px') }
new ResizeObserver(ctlh).observe($('ctl')); NARROW.addEventListener('change', ctlh)

// ── boot ──
theme(store.get('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
{ const h = location.hash.slice(1), c = /^[0-9a-f]{6}$/i.test(h) ? parseColor('#' + h) : null; if (c) setColor(c.s, c.vals) }
room(); renderTop(); renderAll()
setGLReady(() => { dirty(); paintPane(true) })
CAP.glsl = new Set(SPACES.filter(s => { try { return hasPlaneGL(s) } catch { return false } })); renderCtl()
addEventListener('pagehide', () => { try { history.replaceState(null, '', location.pathname + location.search + '#' + hex(RGB).slice(1).toLowerCase()) } catch {} })
