// Atlas · Lineage – the section after the atlas: the catalog as a history, after the chart of Crayola's box growing from 8 crayons to 120:
// every space a thin band from the year it appeared to now, stacked in its family as the shelves below stack them,
// each family fanning out from its oldest member – the river widens wherever the box grew. The years run on a
// stretched scale (a handful of spaces before 1931, most of them since 1990) whose decade ticks show the stretch;
// the families' names stand in the label column level with their streams, as the catalog's ladder lists them;
// three milestones are read off the data – CIE XYZ, CIELAB, OKLab: their years from meta, their words from the lore.
// A band answers the pointer within a few pixels (the bands are 2px), its name below; a click, or Enter on a focused
// band (arrows move between them), opens its dossier. Live: one OKLCH hue per family, spread evenly and turned so
// the current color's hue leads the first – one custom property per color change; the bands are written once.
import { FACTS, FAMI, onColor, all } from './hero.js'
import { meta, disp, LORE, valsOf } from '../js/variants-model.js'
import { FAMILIES } from '../js/variants-data.js'
import { esc } from '../js/variants-catalog.js'


// the river: x in a 1000-wide viewBox stretched to the column, one unit per band in y (--hl-t px on screen). It runs
// to the end of the latest year, so this year's spaces have a length; x grows with the square of the years since
// the first, so each decade is drawn a little wider than the one before
const W = 1000, T0 = FACTS.from, T1 = FACTS.to + 1, X = y => W * ((y - T0) / (T1 - T0)) ** 2
const PAD = 3   // the gap above and below a family's stream, in bands (the stylesheet's --hl-pad on a wide page)
const MILES = ['xyz', 'lab', 'oklab']
const yearOf = s => +meta[s].year
const cap = t => t ? t[0].toUpperCase() + t.slice(1) : ''

// each family: its spaces oldest first (the shelf's order breaks a tie), fanned out from the founder – the next
// one above it, the one after below, and so on outward, so the newest run along the edges
const FAM = FAMILIES.map((f, fi) => {
	const bands = f.spaces.map((s, i) => ({ s, y: yearOf(s), i })).sort((a, b) => a.y - b.y || a.i - b.i)
	const n = bands.length, H = n, c = Math.floor(n / 2)
	bands.forEach((b, r) => Object.assign(b, { r, fi, row: c + (r % 2 ? -(r + 1) / 2 : r / 2), x: X(b.y) }))
	return { name: f.name, fi, bands, n, H, c, from: bands[0].y }
})
const BAND = new Map(FAM.flatMap(F => F.bands.map(b => [b.s, b])))
// the milestones: where each band starts, and the first clause of what the lore says it was for. A flag reads rightward
// from its leader until the stretch's last third, leftward after; its room runs to the next flag, halved where two face
const MS = MILES.filter(s => BAND.has(s)).map(s => { const b = BAND.get(s)
	return { s, b, x: b.x / W * 100, end: b.x > W * .6, words: cap((LORE[s]?.for || '').split(' – ')[0]) } })
MS.forEach((m, i) => { const a = MS[i - 1], z = MS[i + 1]
	m.w = m.end ? (!a ? m.x : a.end ? m.x - a.x : (m.x - a.x) / 2) : (!z ? 100 - m.x : z.end ? (z.x - m.x) / 2 : z.x - m.x) })
// the axis: a tick every decade (they spread out as the scale stretches), years at the ends and the half-centuries
const DEC = []; for (let d = Math.ceil(T0 / 10) * 10; d <= FACTS.to; d += 10) DEC.push(d)
const YRS = [...new Set([T0, ...DEC.filter(d => d % 50 === 0 && X(d) > 20 && X(d) < 980), FACTS.to])]
const near = y => y !== T0 && y !== FACTS.to && (X(y) < 80 || X(y) > 920)   // a half-century this close to an end gives way on a narrow axis

// a family's color: its hue, deepest at the founder and lightening toward the newest at its edges – one gradient per
// family in a defs-only SVG, the one element the current hue is written to, so a change restyles 21 stops rather than
// 168 bands. Every other row a shade lighter, so the lines read as lines
const gradSVG = F => `<linearGradient id="hl-g${F.fi}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${F.H}" style="--fh:${+(F.fi * 360 / FAM.length).toFixed(2)}"><stop class="e" offset="0"/><stop offset="${+((F.c + .5) / F.H).toFixed(4)}"/><stop class="e" offset="1"/></linearGradient>`
// a band is a button named for its space; the one <title> (the tooltip) moves to the band picked – every element in
// the hero is restyled with each frame of the orbit, so 168 more would cost
const said = b => `${disp(b.s)} · ${b.y}`
const bandSVG = b => `<rect class="hl-b${b.row % 2 ? ' z' : ''}" x="${+b.x.toFixed(2)}" y="${b.row}" width="${+(W - b.x).toFixed(2)}" height="1" data-s="${b.s}" role="button" tabindex="-1" aria-label="${esc(said(b))}"/>`
// a milestone's leader runs behind the families above its own, through the gaps (past the viewBox – the SVG's
// overflow shows in its padding), down to the top of its band
const leadSVG = F => MS.filter(m => m.b.fi >= F.fi).map(m => `<line class="hl-ld" x1="${+m.b.x.toFixed(2)}" x2="${+m.b.x.toFixed(2)}" y1="${-PAD}" y2="${m.b.fi === F.fi ? m.b.row : F.H + PAD}"/>`).join('')
const famHTML = F => `<div class="row hl-fam">
	<p class="lab"><button type="button" class="hl-fn" data-jump="${esc(F.name)}" title="Go to ${esc(F.name)} in the catalog">${FAMI[F.name] ? `<span class="fic">${FAMI[F.name]}</span>` : ''}<span class="hl-fnm">${esc(F.name)}</span><span class="cnt tnum">${F.n}</span></button></p>
	<div class="hl-st"><svg class="hl-sv" data-f="${F.fi}" viewBox="0 0 ${W} ${F.H}" preserveAspectRatio="none" fill="url(#hl-g${F.fi})" style="--u:${F.H}" role="group" aria-label="${esc(F.name)}: ${F.n} spaces, the first in ${F.from}">${leadSVG(F)}${F.bands.map(bandSVG).join('')}</svg>${MS.filter(m => m.b.fi === F.fi).map(m => `<i class="hl-dm" style="--x:${m.x.toFixed(2)};--y:${m.b.row}"></i>`).join('')}</div>
</div>`
const SUMMARY = `${FACTS.count} color spaces as lines from the year each appeared, ${FACTS.from} to ${FACTS.to}, in ${FACTS.families} families: `
	+ FAM.map(F => `${F.name}, ${F.n} since ${F.from}`).join('; ') + '. Arrow keys move between the spaces, Enter opens one.'

export default function mount({ hero, wb }) {
	hero.innerHTML = `<div class="row hl-head">
		<span class="lab" aria-hidden="true"></span>
		<div class="hl-body">
			<h2 class="hl-h">${FACTS.to - FACTS.from} years of writing color down.</h2>
			<p class="hl-dek">Each line is one of the ${FACTS.count} spaces below, from the year it appeared to now.</p>
		</div>
	</div>
	<figure class="hl-fig" aria-label="${esc(SUMMARY)}">
		<div class="row hl-ann"><span class="lab" aria-hidden="true"></span><div class="hl-anns">${MS.map(m => `<button type="button" class="hl-ms${m.end ? ' end' : ''}" data-open-s="${m.s}" style="--x:${m.x.toFixed(2)};--w:${m.w.toFixed(2)}"><b><span class="tnum">${m.b.y}</span> ${esc(disp(m.s))}</b><span class="hl-mw">${esc(m.words)}</span></button>`).join('')}</div></div>
		<svg class="hl-defs" aria-hidden="true" focusable="false"><defs>${FAM.map(gradSVG).join('')}</defs></svg>
		<div class="hl-river">${FAM.map(famHTML).join('')}</div>
		<div class="row hl-axis">
			<p class="lab hl-read" aria-hidden="true"><span class="hl-rd">Year</span></p>
			<div class="hl-ax" aria-hidden="true"><svg viewBox="0 0 ${W} 1" preserveAspectRatio="none"><path d="${DEC.map(d => `M${+X(d).toFixed(2)} 0V1`).join('')}"/></svg>${YRS.map((y, i) => `<span class="tnum${i ? i === YRS.length - 1 ? ' end' : near(y) ? ' near' : '' : ' start'}" style="--x:${(X(y) / W * 100).toFixed(2)}">${y}</span>`).join('')}</div>
		</div>
		<figcaption class="row hl-cap"><span class="lab" aria-hidden="true"></span><span>Each family fans out from its oldest member. The years stretch toward the present: each decade is drawn a little wider than the one before.</span></figcaption>
	</figure>`

	const fig = hero.querySelector('.hl-fig'), defs = hero.querySelector('.hl-defs'), read = hero.querySelector('.hl-rd'), els = new Map([...fig.querySelectorAll('.hl-b')].map(el => [el.dataset.s, el]))
	const labs = [...fig.querySelectorAll('.hl-fam')]
	// the keyboard's two orders: down the river (family by family, top row to bottom) and through time (within a family)
	const DOWN = FAM.flatMap(F => [...F.bands].sort((a, b) => a.row - b.row))
	let cur = null, tab = els.get(FAM[0].bands[0].s)   // the band picked (pointer or focus) · the one Tab lands on
	tab.tabIndex = 0
	const tip = document.createElementNS('http://www.w3.org/2000/svg', 'title')
	const pick = b => { const el = b && els.get(b.s); if (el === cur) return
		cur?.classList.remove('on'); labs.forEach(l => l.classList.remove('act')); cur = el
		if (!el) { read.textContent = 'Year'; read.parentNode.classList.remove('on'); tip.remove(); return }
		el.classList.add('on'); labs[b.fi].classList.add('act')
		read.textContent = tip.textContent = said(b); el.append(tip); read.parentNode.classList.add('on') }
	// the band nearest the pointer's row among those already running at its year – a 2px band is hard to hit
	const hit = e => { const sv = e.target.closest?.('.hl-st')?.querySelector('.hl-sv'); if (!sv) return null
		const F = FAM[+sv.dataset.f], r = sv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, u = (e.clientY - r.top) / r.height * F.H
		let best = null, d = 3   // within three bands (6px)
		for (const b of F.bands) if (b.x <= x) { const dd = Math.abs(b.row + .5 - u); if (dd < d) { d = dd; best = b } }
		return best }
	const open = b => wb.openPane(b.s, { from: els.get(b.s), scroll: false })   // as the delegate opens a hero's data-open-s button: the page stays
	const move = b => { if (!b) return; tab.tabIndex = -1; tab = els.get(b.s); tab.tabIndex = 0; tab.focus(); pick(b) }

	// the pointer's band, else the focused one
	const held = () => { const a = document.activeElement; return a?.classList?.contains('hl-b') && fig.contains(a) ? BAND.get(a.dataset.s) : null }
	const over = e => { if (e.pointerType !== 'touch') pick(hit(e) || held()) }
	const leave = () => pick(held())
	const click = e => { if (e.target.closest('[data-jump]')) return   // a family name: the shell jumps to its shelf
		const b = hit(e) || BAND.get(e.target.closest?.('.hl-b')?.dataset.s); if (b) open(b) }
	const key = e => { const el = e.target.closest?.('.hl-b'); if (!el) return; const b = BAND.get(el.dataset.s), F = FAM[b.fi], k = DOWN.indexOf(b)
		const to = { ArrowDown: DOWN[k + 1], ArrowUp: DOWN[k - 1], ArrowRight: F.bands[b.r + 1], ArrowLeft: F.bands[b.r - 1], Home: DOWN[0], End: DOWN.at(-1) }
		if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(b) }
		else if (e.key in to) { e.preventDefault(); move(to[e.key]) } }
	const focus = e => { const el = e.target.closest?.('.hl-b'); if (!el) return
		if (el !== tab) { tab.tabIndex = -1; tab = el; tab.tabIndex = 0 } pick(BAND.get(el.dataset.s)) }
	const blur = e => { if (!fig.contains(e.relatedTarget)) pick(null) }
	fig.addEventListener('pointermove', over); fig.addEventListener('pointerleave', leave); hero.addEventListener('click', click)
	fig.addEventListener('keydown', key); fig.addEventListener('focusin', focus); fig.addEventListener('focusout', blur)

	// the current color's OKLCH hue leads the first family; a gray keeps the last hue it had
	let h0 = null
	const paint = () => { const [, c, h] = valsOf('oklch'); if ((c < .01 && h0 !== null) || !isFinite(h) || h === h0) return
		h0 = h; defs.style.setProperty('--hl-h', h.toFixed(1)) }
	paint()
	return all(onColor(paint), () => { fig.removeEventListener('pointermove', over); fig.removeEventListener('pointerleave', leave); hero.removeEventListener('click', click)
		fig.removeEventListener('keydown', key); fig.removeEventListener('focusin', focus); fig.removeEventListener('focusout', blur) })
}
