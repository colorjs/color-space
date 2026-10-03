// Studio – the workbench's tool-first direction. Everything shared comes from wb.js (the orbit, the
// chip, the stripe, the view controls, the pane and its tabs, the LUT flow, the tour card, the plates,
// the agents block); this file adds what the layout needs: icons in the filter cells, the family
// headings as the family switcher, the inspector's rest state (the current color's passport, its
// own LUT · Code · Share · Agents tabs) and an Agents tab in the pane. Layout is CSS (studio.css).
import { boot, W, S, TOUR, FAMILIES, meta, disp, esc, live, plate, hilite, snippet, loadPY, agentsHTML, lutHTML, loadCite, citeHTML, tourHTML } from './wb.js'
import { PICKS, FK } from '../js/variants-data.js'
import { classify, hexNow, RGBX, gamutOf, GAMTIP, space } from '../js/variants-model.js'
import { cname } from '../js/render.js'
import { OI, FI, UI } from '../js/variants-icons.js'
import { track, EVENT } from '../js/track.js'

const $ = id => document.getElementById(id)
const WIDE = matchMedia('(width >= 75rem)'), CALM = matchMedia('(prefers-reduced-motion: reduce)')
const rest = $('rest'), cat = $('cat')
// the families' icons – atlas.js's mapping, glyph for glyph
const FAMI = { 'Display & web': OI.display, 'RGB remixes': OI.polar, 'Perceptual': OI.opponent, 'Colorimetry & research': OI.chromaticity,
	'Video & broadcast': OI.delivery, 'Film & camera': OI.scene, 'Color order & surface': OI.palettes }

// ── the filter cells: each facet becomes the variants studio bar's .cell – its facet icon (variants-data's
// own pick), then the label over the value – re-dressed after every render of the stripe ──
const cells = document.querySelector('.cellrow')
new MutationObserver(() => { for (const sel of cells.querySelectorAll('.fsel:not(.cell) select[data-wf]')) { const f = sel.parentElement, lab = sel.previousElementSibling
	f.classList.add('cell'); f.insertAdjacentHTML('afterbegin', `<span class="ci">${FI[FK[sel.dataset.wf]?.icon] || ''}</span><span class="cw"></span>`); f.querySelector('.cw').append(lab, sel) } }).observe(cells, { childList: true })

// ── the family headings: icon · name · chevron – the heading itself opens the switcher ──
function decorate() { for (const sh of cat.querySelectorAll('.shelf')) { const h2 = sh.querySelector(':scope>.sh h2'); if (!h2 || h2.querySelector('.tn')) continue
	const name = h2.textContent
	h2.innerHTML = `<button type="button" class="tn" popovertarget="famsw" aria-haspopup="dialog" title="Switch family">${FAMI[name] ? `<span class="fic">${FAMI[name]}</span>` : ''}<span>${esc(name)}</span><span class="chev">${UI.chev}</span></button>` } }
new MutationObserver(decorate).observe(cat, { childList: true })   // wb.js re-renders the catalog on every filter and view change
// the switcher lists all seven, the one you came from current, an emptied family disabled
function famList(cur) { const on = new Map([...cat.querySelectorAll('.shelf')].map(sh => [sh.getAttribute('aria-label'), sh]))
	$('famlist').innerHTML = FAMILIES.map(f => { const sh = on.get(f.name), n = sh ? sh.querySelectorAll('.sp').length : 0
		return `<li><button type="button" data-fam="${sh?.id || ''}"${sh ? '' : ' disabled'}${f.name === cur ? ' aria-current="true"' : ''}><span class="fic">${FAMI[f.name] || ''}</span><span>${esc(f.name)}</span><span class="cnt tnum">${n}</span></button></li>` }).join('') }

// ── the inspector at rest: the current color's passport – its reading in the featured spaces ──
const FEAT = FAMILIES.map(f => [f.name, f.spaces.filter(s => PICKS.has(s))]).filter(([, l]) => l.length)
const GAMUTS = ['rgb', 'p3', 'rec2020']   // the display gamuts – the only rows where "outside" means a screen clips it
const reads = s => `<span class="rd">${classify(s).ch.map((c, i) => `<span class="cvp" title="${esc(cname(c))}"><i class="cl">${esc(c.sym.slice(0, 2))}</i><b class="cv tnum" data-i="${i}"></b></span>`).join('')}</span>`
const mini = s => `<div class="chs mini" aria-hidden="true">${classify(s).ch.map((c, i) => `<div class="ch" data-i="${i}"></div>`).join('')}</div>`
$('pass').innerHTML = FEAT.map(([fam, l]) => `<div class="pgrp"><p class="pfam"><span class="fic">${FAMI[fam] || ''}</span>${esc(fam)}</p>${l.map(s =>
	`<div class="sp prow" data-s="${s}">${mini(s)}<button class="nm" type="button" data-open-s="${s}" aria-label="Open ${esc(disp(s))} details">${esc(disp(s))}</button>${GAMUTS.includes(s) ? `<span class="tag gflag" data-gs="${s}"></span>` : ''}${reads(s)}</div>`).join('')}</div>`).join('')
// inside a display gamut: the unclamped reading sits in the space's own channel box
const inside = s => { const ch = meta[s].channels; let v; try { v = s === 'rgb' ? RGBX : space.rgb[s](...RGBX) } catch { return true }
	return v.every((x, i) => { const e = (ch[i].max - ch[i].min) * 1e-4; return x >= ch[i].min - e && x <= ch[i].max + e }) }
const cap = t => t[0].toUpperCase() + t.slice(1)
function paintRest() { $('rest-t').textContent = hexNow(); $('rest-g').textContent = cap(GAMTIP[gamutOf()] || '')
	for (const f of rest.querySelectorAll('[data-gs]')) { const ok = inside(f.dataset.gs); f.textContent = ok ? 'inside' : 'outside'; f.dataset.in = ok
		f.title = `${ok ? 'Inside' : 'Outside'} ${disp(f.dataset.gs)}${ok ? '' : ' – a screen of that gamut clips it'}` } }

// the rest tabs: Color (the passport and the tour) · LUT (from a camera log) · Code · Share · Agents
let rc = 'js', pyOK = false, citeOK = false
function paintCode() { const [code, cm = '//'] = snippet('oklch', rc)
	$('rcode').innerHTML = (rc === 'js' ? plate('npm install color-space', 'npm install command', { wrap: true }) : '') + plate(code, rc === 'js' ? 'JS code' : 'Python code', { hl: hilite(code, cm) })
	if (rc === 'py' && !pyOK) loadPY().then(() => { pyOK = true; if (rc === 'py') paintCode() }).catch(() => {}) }
function paintShare() { $('rlink').innerHTML = plate(`https://color-space.io/#${hexNow().slice(1).toLowerCase()}`, 'Link to this color', { wrap: true })
	if (!citeOK) { citeOK = true; loadCite().then(c => { $('rcite').innerHTML = citeHTML(c) }) } }
let rt = 'color'
function rtab(k, focus) { rt = k
	for (const b of rest.querySelectorAll('[data-rtab]')) { const on = b.dataset.rtab === k; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus() }
	for (const p of rest.querySelectorAll(':scope>[role="tabpanel"]')) p.hidden = p.id !== 'rp-' + k
	if (k === 'code') paintCode(); if (k === 'share') paintShare() }
rest.querySelector('[role="tablist"]').addEventListener('keydown', e => { if (!/^(ArrowLeft|ArrowRight|Home|End)$/.test(e.key)) return
	const all = [...rest.querySelectorAll('[data-rtab]')], k = all.indexOf(document.activeElement)
	const n = e.key === 'Home' ? 0 : e.key === 'End' ? all.length - 1 : (k + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length; e.preventDefault(); rtab(all[n].dataset.rtab, true) })

// ── the pane: wb.js fills it on every open; Studio adds the Agents tab, and the tour card while touring ──
let touring = false, tourK = null
function headPane() { const p = $('pane'), tl = p.querySelector('.wb-ptabs')
	if (!tl) { if (S.sel) return; touring = false   // closed: when the opener is gone (the tour card re-renders), focus lands back in the passport
		if (WIDE.matches && document.activeElement === document.body) rest.querySelector('[data-k="wt-next"]:not(:disabled),[data-rtab="color"]')?.focus({ preventScroll: true }); return }
	if (!tl.querySelector('[data-wtab="agents"]')) { tl.insertAdjacentHTML('beforeend', '<button type="button" role="tab" id="wbt-agents" aria-controls="wbp-agents" aria-selected="false" tabindex="-1" data-wtab="agents">Agents</button>')
		p.insertAdjacentHTML('beforeend', `<section class="wb-panel" role="tabpanel" id="wbp-agents" aria-labelledby="wbt-agents" tabindex="-1" hidden>${agentsHTML({ title: false })}</section>`) }
	if (touring && WIDE.matches && S.sel === TOUR[W.tour].s && !p.querySelector('.ptour')) p.querySelector('.ph')?.insertAdjacentHTML('beforebegin', `<div class="ptour" data-wb="tour">${tourHTML()}</div>`)
	if (tourK) { p.querySelector(`[data-k="${tourK}"]:not(:disabled)`)?.focus({ preventScroll: true }); tourK = null } }
new MutationObserver(headPane).observe($('pane'), { childList: true })

// before wb.js's delegate (capture): the tour's state, and the phone inspector steps aside for the dialog
document.addEventListener('click', e => { const t = e.target.closest('button'); if (!t) return
	if (t.dataset.wt) { touring = true; tourK = t.dataset.k } else if (t.matches('[data-open-s],[data-go]')) touring = false
	if ((t.dataset.openS || t.dataset.wt === 'open') && rest.matches(':popover-open')) rest.hidePopover()
	if (t.classList.contains('tn')) famList(t.closest('.shelf')?.getAttribute('aria-label')) }, true)

let raf = 0, cT = 0
document.addEventListener('wb:color', () => { raf ||= requestAnimationFrame(() => { raf = 0; paintRest() })
	if (rt === 'code' || rt === 'share') cT ||= setTimeout(() => { cT = 0; rt === 'code' ? paintCode() : paintShare() }, 400) })
WIDE.addEventListener('change', () => { if (WIDE.matches && rest.matches(':popover-open')) rest.hidePopover() })

boot({ arrange: 'family', view: 'grid', preview: 'planes', quant: 'smooth' })
rest.querySelector('.passhd .ib').innerHTML = UI.x
$('rlut').innerHTML = lutHTML('slog3', true)
$('rp-agents').innerHTML = agentsHTML({ title: false })
live($('pass')); paintRest()

// after wb.js's delegate: the rest tabs, the code language, a family from the switcher
document.addEventListener('click', e => { const t = e.target.closest('button'); if (!t) return; const d = t.dataset
	if (d.rtab) return rtab(d.rtab)
	if (d.rcode) { rc = d.rcode; for (const b of rest.querySelectorAll('[data-rcode]')) b.setAttribute('aria-pressed', b.dataset.rcode === rc); paintCode(); track(EVENT.lang(rc)); return }
	if (d.fam) { $('famsw').hidePopover(); const sh = $(d.fam); if (!sh) return
		sh.scrollIntoView({ block: 'start', behavior: CALM.matches ? 'auto' : 'smooth' }); sh.querySelector('.tn')?.focus({ preventScroll: true }) } })
