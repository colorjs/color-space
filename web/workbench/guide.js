// Guide – the workbench's learning-first direction: what a color space is, shown on the color in
// hand; the start-here tour as a numbered track; the ten purposes as ways in; the camera-log LUT;
// the code; then the atlas shelved by purpose. Everything shared comes from wb.js (orbit, chip,
// stripe, view controls, pane and its tabs, LUT flow, plates, agents block); this file adds what the
// layout needs: the hero readouts, the track, the task tiles, the build tabs, and the shelf-title row
// (the shelves' headings, gathered into one sticky line – the current one ink).
import { boot, W, S, SPACES, FAMILIES, meta, disp, esc, TOUR, openPane, renderCat, refresh, live, plate, hilite, snippet, loadPY, agentsHTML, embedSnippet, lutHTML, loadCite, citeHTML } from './wb.js'
import { PURPOSE, PICKS, ORDER, TIPS, plabel } from '../js/variants-data.js'
import { classify, hexNow } from '../js/variants-model.js'
import { cname } from '../js/render.js'
import { OI, UI } from '../js/variants-icons.js'
import { track, EVENT } from '../js/track.js'

const $ = id => document.getElementById(id)
const WIDE = matchMedia('(width >= 75rem)'), CALM = matchMedia('(prefers-reduced-motion: reduce)')
const glide = () => CALM.matches ? 'auto' : 'smooth'
const cap = t => t[0].toUpperCase() + t.slice(1)

// a space's strips and readings – the catalog's own markup, so wb.js's painters keep them live
const strips = s => `<div class="chs thin">${classify(s).ch.map((c, i) => `<div class="ch" data-i="${i}" title="${esc(cname(c))}"><input type="range" class="nrg" data-i="${i}" min="${c.min}" max="${c.max}" step="any" aria-label="${esc(disp(s))} ${esc(cname(c))}"></div>`).join('')}</div>`
const reads = s => `<span class="rd">${classify(s).ch.map((c, i) => `<span class="cvp" title="${esc(cname(c))}"><i class="cl">${esc(c.sym.slice(0, 2))}</i><b class="cv tnum" data-i="${i}"></b></span>`).join('')}</span>`
const nm = s => `<button class="nm" type="button" data-open-s="${s}" aria-label="Open ${esc(disp(s))} details">${esc(disp(s))}</button>`

// ── 1 · the same color, three ways: what a screen is sent, how it looks, the light measured ──
const WAYS = [['rgb', 'what a screen is sent'], ['oklch', 'lightness, chroma and hue as seen'], ['xyz', 'the light itself, measured']]
$('gd-three').innerHTML = WAYS.map(([s, w]) => `<article class="sp gd-way" data-s="${s}"><header class="th">${nm(s)}<span class="wy">${esc(w)}</span></header>${reads(s)}${strips(s)}</article>`).join('')
live($('gd-three'))
const paintHex = () => { $('gd-hex').textContent = hexNow() }

// ── 2 · the tour as a track: eleven stops, each with its space's strips at the current color ──
const SHORT = ['Light', 'Measuring', 'The horseshoe', 'Screens', 'Controls', 'Perception', 'Modern', 'Video', 'Cameras', 'HDR', 'Paper']   // atlas.js's words
$('gd-stops').innerHTML = TOUR.map((st, i) => `<li class="gd-stop sp" data-s="${st.s}"><button type="button" data-gd-stop="${i}" title="${esc(st.t)}"><span class="n tnum">${String(i + 1).padStart(2, '0')}</span><span class="t nm">${esc(SHORT[i])}</span><span class="s">${esc(disp(st.s))}</span></button>${strips(st.s)}</li>`).join('')
live($('gd-stops'))
let touring = false
const tourCard = i => { const st = TOUR[i], n = TOUR.length
	return `<section class="wb-tour gd-ptour" aria-label="Start here – stop ${i + 1} of ${n}"><p class="wb-eyebrow">Start here <span class="tnum">· stop ${i + 1} of ${n}</span></p>
	<h2 class="wb-tour-t">${esc(st.t)}</h2><p class="wb-tour-d">${esc(st.d)}</p>
	<div class="wb-tour-nav"><button type="button" class="ib" data-gd-tour="-1" aria-label="Previous stop"${i ? '' : ' disabled'}>${UI.prev}</button><span class="tnum gd-pn">${i + 1} / ${n}</span><button type="button" class="ib" data-gd-tour="1" aria-label="Next stop"${i < n - 1 ? '' : ' disabled'}>${UI.next}</button></div></section>` }
function markStops() { for (const b of $('gd-stops').querySelectorAll('[data-gd-stop]')) { const on = touring && S.sel === TOUR[+b.dataset.gdStop].s && +b.dataset.gdStop === W.tour
	on ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current') } }
// the pane refills on every open; while touring, the stop's card heads it (above the dossier, whose order stays its own)
function headPane() { const p = $('pane'); markStops()
	if (touring && S.sel === TOUR[W.tour].s && !p.querySelector('.gd-ptour')) p.querySelector('.ph')?.insertAdjacentHTML('beforebegin', tourCard(W.tour)) }
new MutationObserver(headPane).observe($('pane'), { childList: true })
function openStop(i, from) { W.tour = i; touring = true; openPane(TOUR[i].s, { from, focus: false, scroll: false }); headPane(); track(EVENT.tour(i + 1, TOUR[i].s)) }

// ── 3 · what are you working on: the ten purposes, each naming where to start and how many suit it ──
const forTask = t => SPACES.filter(s => PURPOSE[s]?.includes(t))
const recOf = t => { const all = forTask(t), pk = [...PICKS].filter(s => all.includes(s))
	return [...new Set([...pk.filter(s => PURPOSE[s][0] === t), ...pk, ...all.filter(s => PURPOSE[s][0] === t)])].slice(0, 2) }
$('gd-tasks').innerHTML = ORDER.map(t => { const n = forTask(t).length
	return `<li class="gd-task"><div class="gd-th"><span class="gd-tic">${OI[t]}</span><h3><button type="button" data-gd-for="${t}" aria-pressed="false">${esc(plabel(t))}</button></h3><span class="cnt tnum" title="${n} spaces">${n}</span></div>
	<p class="gd-use">${esc(cap(TIPS[t].split(' – ')[0]))}</p><p class="gd-rec"><span class="sr">Start with </span>${recOf(t).map(nm).join('<span aria-hidden="true">·</span>')}</p></li>` }).join('')
function setFor(t) { S.F.for.clear(); if (t) S.F.for.add(t); renderCat(); refresh('stripe', 'count') }
function paintOn() { const t = [...S.F.for][0]
	$('gd-on').innerHTML = t ? `<span class="fsel-l">For</span><button type="button" class="tag" data-gd-unfor aria-label="Show every task – now ${esc(plabel(t))}">${esc(plabel(t))}${UI.x}</button>` : ''
	for (const b of $('gd-tasks').querySelectorAll('[data-gd-for]')) b.setAttribute('aria-pressed', b.dataset.gdFor === t) }

// ── 4 · shooting log: wb.js's LUT flow, inline, opening on a camera-log select ──
$('gd-lut').innerHTML = lutHTML($('gd-lut').dataset.wlFrom, true)

// ── 5 · build with it: the library, Python, agents, an embed, the Figma plugin ──
const BUILD = [['js', 'JavaScript'], ['py', 'Python'], ['agents', 'Agents'], ['embed', 'Embed'], ['figma', 'Figma']]
let bt = 'js', bs = 'oklch', py = false
$('gd-btabs').innerHTML = BUILD.map(([k, l]) => `<button type="button" role="tab" id="gdt-${k}" aria-controls="gd-bpanel" aria-selected="${k === bt}" tabindex="${k === bt ? 0 : -1}" data-gd-bt="${k}">${l}${k === 'figma' ? ' <span class="tag">coming</span>' : ''}</button>`).join('')
document.querySelector('[data-gd-bs]').innerHTML = FAMILIES.map(f => `<optgroup label="${esc(f.name)}">${f.spaces.filter(s => SPACES.includes(s)).map(s => `<option value="${s}"${s === bs ? ' selected' : ''}>${esc(disp(s))}</option>`).join('')}</optgroup>`).join('')
function paintBuild() { const p = $('gd-bpanel'), s = bs; p.setAttribute('aria-labelledby', 'gdt-' + bt); $('gd-bsp').hidden = !['js', 'py', 'embed'].includes(bt)
	if (bt === 'js') { const [code] = snippet(s, 'js'); p.innerHTML = `<p class="wb-note">One import converts any space to any other, both ways – or take one space alone, tree-shaken.</p>${plate('npm install color-space', 'npm install command', { wrap: true })}${plate(code, 'JavaScript code', { hl: hilite(code) })}` }
	if (bt === 'py') { const [code, cm] = snippet(s, 'py'); p.innerHTML = `<p class="wb-note">The colour-science or OpenCV equivalent, where one is verified against this library.</p>${plate(code, 'Python code', { hl: hilite(code, cm) })}`
		if (!py) loadPY().then(() => { py = true; if (bt === 'py') paintBuild() }).catch(() => {}) }
	if (bt === 'agents') p.innerHTML = agentsHTML({ title: false })
	if (bt === 'embed') p.innerHTML = `<p class="wb-note">The ${esc(disp(s))} card alone, in an iframe on your page.</p>${plate(embedSnippet(s), 'Embed snippet', { trk: 'embed:' + s, wrap: true })}`
	if (bt === 'figma') p.innerHTML = `<p class="wb-note">A Figma plugin that shows the selection’s solid fills and strokes in any of the spaces, writes edited values back and copies the color as CSS – coming once it is published.</p>` }
function selectBuild(k, focus) { bt = k; for (const b of $('gd-btabs').children) { const on = b.dataset.gdBt === k; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus() }
	paintBuild(); if (k === 'js' || k === 'py') track(EVENT.lang(k)) }
paintBuild()

// ── 6 · the atlas: the shelf titles, gathered into one sticky row – clicking one scrolls to its shelf ──
const cat = $('cat'), row = $('gd-row')
let act = -1
function gather() { const shs = [...cat.querySelectorAll('.shelf')]
	row.innerHTML = shs.map(sh => `<button type="button" data-gd-jump="${sh.id}">${esc(plabel(sh.id.slice(6)))}<span class="n tnum">${sh.querySelectorAll('.sp').length}</span></button>`).join('')
	act = -1; mark(); paintOn() }
function mark() { const shs = [...cat.querySelectorAll('.shelf')], lim = row.getBoundingClientRect().bottom + innerHeight * .25; let k = 0
	shs.forEach((sh, i) => { if (sh.getBoundingClientRect().top <= lim) k = i })
	if (k === act) return; act = k; const btns = [...row.children]
	btns.forEach((b, i) => i === k ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current'))
	const b = btns[k]; if (b && row.scrollWidth > row.clientWidth) row.scrollTo({ left: b.offsetLeft - (row.clientWidth - b.offsetWidth) / 2, behavior: glide() }) }
let mraf = 0
addEventListener('scroll', () => { mraf ||= requestAnimationFrame(() => { mraf = 0; mark() }) }, { passive: true })
addEventListener('resize', () => { act = -1; mark() }, { passive: true })
new MutationObserver(gather).observe(cat, { childList: true })   // wb.js re-renders the catalog on every filter and view change

// opening a space from anywhere but the tour leaves the tour (capture: before wb.js opens it)
document.addEventListener('click', e => { if (e.target.closest('[data-open-s],[data-go]')) touring = false }, true)

let cT = 0
document.addEventListener('wb:color', () => { paintHex(); if (bt === 'js' || bt === 'py') { if (!cT) cT = setTimeout(() => { cT = 0; paintBuild() }, 400) } })

boot({ arrange: 'purpose', view: 'grid', preview: 'sliders', quant: 'smooth', follow: false })
paintHex()

// after wb.js's delegate (registered in boot): the tour, the tasks, the build tabs, the row
document.addEventListener('click', e => {
	const t = e.target.closest('button'); if (!t) return; const d = t.dataset
	if (d.gdStart !== undefined) { openStop(0, t); $('tour').scrollIntoView({ block: 'start', behavior: glide() }); return }
	if (d.gdStop) return openStop(+d.gdStop, t)
	if (d.gdTour) { const i = Math.max(0, Math.min(TOUR.length - 1, W.tour + +d.gdTour)); openStop(i, t)
		const b = $('pane').querySelector(`[data-gd-tour="${d.gdTour}"]`); (b && !b.disabled ? b : $('pane').querySelector('[data-gd-tour]:not(:disabled)'))?.focus({ preventScroll: true }); return }
	if (d.gdFor) { const on = S.F.for.has(d.gdFor) && S.F.for.size === 1; setFor(on ? null : d.gdFor); if (!on) $('atlas').scrollIntoView({ block: 'start', behavior: glide() }); return }
	if (d.gdUnfor !== undefined) { setFor(null); return }
	if (d.gdBt) return selectBuild(d.gdBt)
	if (d.gdJump) { $(d.gdJump)?.scrollIntoView({ block: 'start', behavior: glide() }); return }
})
document.addEventListener('change', e => { if (e.target.dataset.gdBs !== undefined) { bs = e.target.value; paintBuild() } })
$('gd-btabs').addEventListener('keydown', e => { if (!/^(ArrowLeft|ArrowRight|Home|End)$/.test(e.key)) return; const all = [...$('gd-btabs').children], k = all.indexOf(document.activeElement)
	const n = e.key === 'Home' ? 0 : e.key === 'End' ? all.length - 1 : (k + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length; e.preventDefault(); selectBuild(all[n].dataset.gdBt, true) })

// Cite: the atlas's own BibTeX and APA (CITATION.cff, baked by build-site), read once on first open
$('gd-cite').addEventListener('toggle', e => { if (e.newState === 'open') loadCite().then(c => { $('gd-cite-b').innerHTML = citeHTML(c) }) })
