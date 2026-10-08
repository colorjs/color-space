// The history – the section after the catalog, after the chart of Crayola's box growing from 8 crayons to 120: every
// space a thin band from the year it appeared to now, all in one stack – no families: those are the catalog's own
// sorting, not history's – the oldest at the bottom, each newer one laid on top, so the rising edge is the field
// growing: the count of spaces at every year. The years run on
// a stretched scale (a handful of spaces before 1931, most of them since 1990) whose decade ticks show the stretch;
// milestones are read off the data – CIE XYZ, CIELAB, sRGB, OKLab: their years from meta, their words from the lore.
// A band answers the pointer within a few pixels (the bands are 2px), its name below; a click, or Enter on a focused
// band (arrows move between them), opens its dossier. Live: the stream wears the current color's OKLCH hue – one
// custom property per color change; the bands are written once.
import { meta } from './core.js'
import { SPACES, disp, cap } from './render.js'
import LORE from './lore.js'
import { t } from './i18n.js'

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const yearOf = s => +meta[s].year
const YEARS = SPACES.map(yearOf).filter(Boolean), Y0 = Math.min(...YEARS), Y1 = Math.max(...YEARS)
// the river: x in a 1000-wide viewBox stretched to the column, one unit per band in y (--hl-t px on screen). It runs to
// the end of the latest year, so this year's spaces have a length; x grows with the square of the years since the
// first, so each decade is drawn a little wider than the one before
const W = 1000, X = y => W * ((y - Y0) / (Y1 + 1 - Y0)) ** 2
const MILES = ['xyz', 'lab', 'rgb', 'oklab']   // sRGB is the library's rgb
// the stack: every space oldest first (the catalog's order breaks a tie), the oldest on the bottom row
const BANDS = SPACES.map((s, i) => ({ s, y: yearOf(s), i })).sort((a, b) => a.y - b.y || a.i - b.i)
const N = BANDS.length
BANDS.forEach((b, r) => Object.assign(b, { r, row: N - 1 - r, x: X(b.y) }))
const BAND = new Map(BANDS.map(b => [b.s, b])), DOWN = [...BANDS].sort((a, b) => a.row - b.row)   // the keyboard's two orders: down the stream, through time
// the axis: a tick every decade (they spread out as the scale stretches), years at the ends and the half-centuries
const DEC = []; for (let d = Math.ceil(Y0 / 10) * 10; d <= Y1; d += 10) DEC.push(d)
const YRS = [...new Set([Y0, ...DEC.filter(d => d % 50 === 0 && X(d) > 20 && X(d) < 980), Y1])]
const near = y => y !== Y0 && y !== Y1 && (X(y) < 80 || X(y) > 920)   // a half-century this close to an end gives way on a narrow axis
const said = b => `${disp(b.s)} · ${b.y}`

/** The section's markup, in the page's language. */
export function lineageHTML() {
	// the milestones: where each band starts, and the first clause of what the lore says it was for. A flag reads
	// rightward from its leader until the stretch's last third, leftward after; its room runs to the next flag, halved
	// where two face
	const MS = MILES.filter(s => BAND.has(s)).map(s => { const b = BAND.get(s), f = LORE[s]?.for
		return { s, b, x: b.x / W * 100, end: b.x > W * .6, words: cap((f ? t(`lore.${s}.for`, f) : '').split(' – ')[0]) } })
	MS.forEach((m, i) => { const a = MS[i - 1], z = MS[i + 1]
		m.w = m.end ? (!a ? m.x : a.end ? m.x - a.x : (m.x - a.x) / 2) : (!z ? 100 - m.x : z.end ? (z.x - m.x) / 2 : z.x - m.x) })
	// a band is a button named for its space; the one <title> (the tooltip) moves to the band picked. The stack's colour
	// is one gradient – the current hue, deepest at the oldest and lightening toward the newest on top – written
	// to the defs alone; every other row a shade lighter, so the lines read as lines
	return `<figure class="hl-fig" aria-label="${esc(t('ui.lineage.summary', '{n} color spaces as lines from the year each appeared, {from} to {to}. Arrow keys move between the spaces, Enter opens one.', { n: N, from: Y0, to: Y1 }))}">
		<div class="hl-anns">${MS.map(m => `<button type="button" class="hl-ms${m.end ? ' end' : ''}" data-s="${m.s}" style="--x:${m.x.toFixed(2)};--w:${m.w.toFixed(2)}"><b><span class="tnum">${m.b.y}</span> ${esc(disp(m.s))}</b><span class="hl-mw">${esc(m.words)}</span></button>`).join('')}</div>
		<svg class="hl-defs" aria-hidden="true" focusable="false"><defs><linearGradient id="hl-g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${N}"><stop class="e" offset="0"/><stop offset="1"/></linearGradient></defs></svg>
		<div class="hl-st"><svg class="hl-sv" viewBox="0 0 ${W} ${N}" preserveAspectRatio="none" fill="url(#hl-g)" style="--u:${N}" role="group">${MS.map(m => `<line class="hl-ld" x1="${+m.b.x.toFixed(2)}" x2="${+m.b.x.toFixed(2)}" y1="-3" y2="${m.b.row}"/>`).join('')}${BANDS.map(b => `<rect class="hl-b${b.row % 2 ? ' z' : ''}" x="${+b.x.toFixed(2)}" y="${b.row}" width="${+(W - b.x).toFixed(2)}" height="1" data-s="${b.s}" role="button" tabindex="-1" aria-label="${esc(said(b))}"/>`).join('')}</svg>${MS.map(m => `<i class="hl-dm" style="--x:${m.x.toFixed(2)};--y:${m.b.row}"></i>`).join('')}</div>
		<div class="hl-axis"><p class="hl-read" aria-hidden="true"><span class="hl-rd">${t('ui.lineage.year', 'Year')}</span></p><div class="hl-ax" aria-hidden="true"><svg viewBox="0 0 ${W} 1" preserveAspectRatio="none"><path d="${DEC.map(d => `M${+X(d).toFixed(2)} 0V1`).join('')}"/></svg>${YRS.map((y, i) => `<span class="tnum${i ? i === YRS.length - 1 ? ' end' : near(y) ? ' near' : '' : ' start'}" style="--x:${(X(y) / W * 100).toFixed(2)}">${y}</span>`).join('')}</div></div>
		<figcaption class="hl-cap">${t('ui.lineage.cap', 'The years stretch toward the present: each decade is drawn a little wider than the one before.')}</figcaption>
	</figure>` }

/** Wire the rendered section: the pointer's band, the keyboard, a pick opening its dossier (open). Returns paint(h) –
 *  the current OKLCH hue; a gray keeps the hue it had. */
export function wireLineage(el, open) {
	const fig = el.querySelector('.hl-fig'), defs = el.querySelector('.hl-defs'), read = el.querySelector('.hl-rd'), sv = el.querySelector('.hl-sv')
	const els = new Map([...fig.querySelectorAll('.hl-b')].map(b => [b.dataset.s, b])), YEAR = read.textContent
	let cur = null, tab = els.get(BANDS[0].s)   // the band picked (pointer or focus) · the one Tab lands on
	tab.tabIndex = 0
	const tip = document.createElementNS('http://www.w3.org/2000/svg', 'title')
	const pick = b => { const e = b && els.get(b.s); if (e === cur) return
		cur?.classList.remove('on'); cur = e
		if (!e) { read.textContent = YEAR; read.parentNode.classList.remove('on'); tip.remove(); return }
		e.classList.add('on'); read.textContent = tip.textContent = said(b); e.append(tip); read.parentNode.classList.add('on') }
	// the band nearest the pointer's row among those already running at its year – a 2px band is hard to hit
	const hit = e => { if (!e.target.closest?.('.hl-st')) return null
		const r = sv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, u = (e.clientY - r.top) / r.height * N
		let best = null, d = 3   // within three bands
		for (const b of BANDS) if (b.x <= x) { const dd = Math.abs(b.row + .5 - u); if (dd < d) { d = dd; best = b } }
		return best }
	const move = b => { if (!b) return; tab.tabIndex = -1; tab = els.get(b.s); tab.tabIndex = 0; tab.focus(); pick(b) }
	const held = () => { const a = document.activeElement; return a?.classList?.contains('hl-b') && fig.contains(a) ? BAND.get(a.dataset.s) : null }
	fig.addEventListener('pointermove', e => { if (e.pointerType !== 'touch') pick(hit(e) || held()) })
	fig.addEventListener('pointerleave', () => pick(held()))
	el.addEventListener('click', e => { const s = e.target.closest?.('.hl-ms')?.dataset.s || (hit(e) || BAND.get(e.target.closest?.('.hl-b')?.dataset.s))?.s; if (s) open(s) })
	fig.addEventListener('keydown', e => { const t2 = e.target.closest?.('.hl-b'); if (!t2) return; const b = BAND.get(t2.dataset.s), k = DOWN.indexOf(b)
		const to = { ArrowDown: DOWN[k + 1], ArrowUp: DOWN[k - 1], ArrowRight: BANDS[b.r + 1], ArrowLeft: BANDS[b.r - 1], Home: DOWN[0], End: DOWN.at(-1) }
		if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(b.s) }
		else if (e.key in to) { e.preventDefault(); move(to[e.key]) } })
	fig.addEventListener('focusin', e => { const b = e.target.closest?.('.hl-b'); if (!b) return
		if (b !== tab) { tab.tabIndex = -1; tab = b; tab.tabIndex = 0 } pick(BAND.get(b.dataset.s)) })
	fig.addEventListener('focusout', e => { if (!fig.contains(e.relatedTarget)) pick(null) })
	let h0 = null
	return (c, h) => { if ((c < .01 && h0 !== null) || !isFinite(h) || h === h0) return; h0 = h; defs.style.setProperty('--hl-h', h.toFixed(1)) } }
