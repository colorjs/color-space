// The history – the section after the catalog, after the chart of Crayola's box growing from 8 crayons to 120: every
// space a thin band from the year it appeared until now, or until the year its successor appeared (@successor), all in
// one stack, the oldest at the bottom, each newer one laid on top, so the rising edge is the field growing: the count of
// spaces at every year, and the gaps on the right are the ones superseded. A band's shade is the light its values
// describe, darkest to lightest: reflected (print and paint), an SDR display, an HDR display, the scene itself – the
// key under the axis names them, and a click on one keeps only its bands. The years run on
// a stretched scale (a handful of spaces before 1931, most of them since 1990) whose decade ticks show the stretch;
// milestones are read off the data – CIE XYZ, CIELAB, sRGB, OKLab: their years from meta, their words from the lore.
// A band answers the pointer within a few pixels (the bands are 3px) and draws its own milestone, the others' words
// stepping back for it; a click, or Enter on a focused band (arrows move between them), opens its dossier. Live: the
// bands wear the current color's OKLCH hue and, up to a cap, its chroma, the light a step of lightness – two custom
// properties per color change; the bands are written once. A superseded band's flag says why it ended, in the words of its @successor (a retired one, of its @retired).
import { meta } from './core.js'
import { SPACES, sections, secName, disp, cap, ending, tagL } from './render.js'
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
const WIDE = new Set(['rgb'])   // sRGB's flag faces CIELAB's across the middle: a narrow stack keeps CIELAB, the line OKLab answers
// the stack: every space oldest first (the catalog's order breaks a tie), the oldest on the bottom row. A superseded
// band ends where its successor begins – at least its own year long, as CIE RGB, which XYZ replaced in 1931
// the light: the print-and-paint family reflects it; the rest read @referred and @dynamic – scene-referred is the scene's
// light, whatever its range; display-referred is an SDR or an HDR display's
const PRINT = sections.find(c => c.key === 'cat.surface')
const LIGHT = [() => secName(PRINT), () => 'SDR', () => 'HDR', () => tagL('scene-referred')]
const light = s => PRINT.spaces.includes(s) ? 0 : meta[s].referred === 'scene' ? 3 : meta[s].dynamic === 'hdr' ? 2 : 1
const BANDS = SPACES.map((s, i) => ({ s, y: yearOf(s), i, z: meta[s].successor ? yearOf(meta[s].successor) : 0, k: light(s) }))
	.sort((a, b) => a.y - b.y || a.i - b.i)
const N = BANDS.length
BANDS.forEach((b, r) => Object.assign(b, { r, row: N - 1 - r, x: X(b.y), e: b.z ? X(Math.max(b.z, b.y + 1)) : W }))
const BAND = new Map(BANDS.map(b => [b.s, b])), DOWN = [...BANDS].sort((a, b) => a.row - b.row)   // the keyboard's two orders: down the stream, through time
// the axis: a tick every decade (they spread out as the scale stretches), years at the ends and the half-centuries
const DEC = []; for (let d = Math.ceil(Y0 / 10) * 10; d <= Y1; d += 10) DEC.push(d)
const YRS = [...new Set([Y0, ...DEC.filter(d => d % 50 === 0 && X(d) > 20 && X(d) < 980), Y1])]
const near = y => y !== Y0 && y !== Y1 && (X(y) < 80 || X(y) > 920)   // a half-century this close to an end gives way on a narrow axis
const span = b => b.z > b.y ? `${b.y}–${b.z}` : `${b.y}`   // a space replaced the year it appeared (CIE RGB) reads its year alone
const said = b => `${disp(b.s)} · ${span(b)} · ${LIGHT[b.k]()}`
// a milestone's flag: its years and name, and the first clause of what the lore says it was for – or, superseded, why
const flag = b => { const e = ending(b.s), f = LORE[b.s]?.for
	const w = e?.why || (f ? cap(t(`lore.${b.s}.for`, f).split(' – ')[0]) : '')   // a note is written as it reads – sRGB stays sRGB
	return `<b><span class="tnum">${span(b)}</span> ${esc(disp(b.s))}</b><span class="hl-mw">${esc(w)}</span>` }

/** The section's markup, in the page's language. */
export function lineageHTML() {
	// the milestones: where each band starts, flagged. A flag reads rightward from its leader until the stretch's last
	// third, leftward after; its room runs to the next flag, halved where two face. One more, the band picked, is drawn
	// the same way and filled in by wireLineage
	const MS = MILES.filter(s => BAND.has(s)).map(s => { const b = BAND.get(s)
		return { s, b, x: b.x / W * 100, end: b.x > W * .6 } })
	MS.forEach((m, i) => { const a = MS[i - 1], z = MS[i + 1]
		m.w = m.end ? (!a ? m.x : a.end ? m.x - a.x : (m.x - a.x) / 2) : (!z ? 100 - m.x : z.end ? (z.x - m.x) / 2 : z.x - m.x) })
	// a band is a button named for its space; the one <title> (the tooltip) moves to the band picked. A band's shade is
	// its light's, the same at every age – x already tells the age. The key: a swatch and a name per light, a toggle
	return `<figure class="hl-fig" style="--hl-n:${LIGHT.length}" aria-label="${esc(t('ui.lineage.summary', '{n} color spaces as lines from the year each appeared, {from} to {to}. Arrow keys move between the spaces, Enter opens one.', { n: N, from: Y0, to: Y1 }))}">
		<div class="hl-lead"><h2>${esc(t('ui.lineage.title', 'History'))}</h2></div>
		<div class="hl-anns">${MS.map(m => `<button type="button" class="hl-ms${m.end ? ' end' : ''}${WIDE.has(m.s) ? ' wide' : ''}" data-s="${m.s}" style="--x:${m.x.toFixed(2)};--w:${m.w.toFixed(2)}">${flag(m.b)}</button>`).join('')}<span class="hl-ms hl-now" aria-hidden="true"></span></div>
		<div class="hl-st"><svg class="hl-sv" viewBox="0 0 ${W} ${N}" preserveAspectRatio="none" style="--u:${N}" role="group">${BANDS.map(b => `<rect class="hl-b" x="${+b.x.toFixed(2)}" y="${b.row}" width="${+(b.e - b.x).toFixed(2)}" height="1" style="--k:${b.k}" data-s="${b.s}" role="button" tabindex="-1" aria-label="${esc(said(b))}"/>`).join('')}</svg>${MS.map(m => `<i class="hl-ld${WIDE.has(m.s) ? ' wide' : ''}" data-s="${m.s}" style="--x:${m.x.toFixed(2)};--y:${m.b.row}"></i><i class="hl-dm${WIDE.has(m.s) ? ' wide' : ''}" data-s="${m.s}" style="--x:${m.x.toFixed(2)};--y:${m.b.row}"></i>`).join('')}<i class="hl-ld hl-now"></i><i class="hl-dm hl-now"></i></div>
		<div class="hl-ax" aria-hidden="true"><svg viewBox="0 0 ${W} 1" preserveAspectRatio="none"><path d="${DEC.map(d => `M${+X(d).toFixed(2)} 0V1`).join('')}"/></svg>${YRS.map((y, i) => `<span class="tnum${i ? i === YRS.length - 1 ? ' end' : near(y) ? ' near' : '' : ' start'}" style="--x:${(X(y) / W * 100).toFixed(2)}">${y}</span>`).join('')}</div>
		<div class="hl-key">${LIGHT.map((l, k) => `<button type="button" class="hl-kd" data-k="${k}" aria-pressed="false" style="--k:${k}"><i></i>${esc(l())}</button>`).join('')}</div>
	</figure>` }

/** Wire the rendered section: the pointer's band, the keyboard, a pick opening its dossier (open). Returns paint(c, h) –
 *  the current OKLCH chroma and hue: the bands are never more saturated than the color; a gray keeps the hue it had. */
export function wireLineage(el, open) {
	const fig = el.querySelector('.hl-fig'), sv = el.querySelector('.hl-sv')
	const [fl, ld, dm] = fig.querySelectorAll('.hl-now')   // the picked band's flag, leader and rhombus (in that document order)
	const els = new Map([...fig.querySelectorAll('.hl-b')].map(b => [b.dataset.s, b]))
	let cur = null, tab = els.get(BANDS[0].s), only = null   // the band picked (pointer or focus) · the one Tab lands on · the light kept
	const vis = b => only === null || b.k === only
	const next = (list, i, d) => { for (let j = i + d; j >= 0 && j < list.length; j += d) if (vis(list[j])) return list[j] }   // the next band shown, skipping the hidden
	tab.tabIndex = 0
	const tip = document.createElementNS('http://www.w3.org/2000/svg', 'title')
	const pick = b => { const e = b && els.get(b.s); if (e === cur) return
		cur?.classList.remove('on'); cur = e
		fig.classList.toggle('now', !!e)
		if (!e) { tip.remove(); return }
		e.classList.add('on'); tip.textContent = said(b); e.append(tip)
		const x = b.x / W * 100, end = b.x > W * .6
		fl.innerHTML = flag(b); fl.classList.toggle('end', end); fl.style.cssText = `--x:${x.toFixed(2)};--w:${(end ? x : 100 - x).toFixed(2)}`
		ld.style.cssText = dm.style.cssText = `--x:${x.toFixed(2)};--y:${b.row}` }
	// the band nearest the pointer's row among those running at its year – a 3px band is hard to hit
	const hit = e => { if (!e.target.closest?.('.hl-st')) return null
		const r = sv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, u = (e.clientY - r.top) / r.height * N
		let best = null, d = 3   // within three bands
		for (const b of BANDS) if (b.x <= x && x < b.e && vis(b)) { const dd = Math.abs(b.row + .5 - u); if (dd < d) { d = dd; best = b } }
		return best }
	const move = b => { if (!b) return; tab.tabIndex = -1; tab = els.get(b.s); tab.tabIndex = 0; tab.focus(); pick(b) }
	const held = () => { const a = document.activeElement; return a?.classList?.contains('hl-b') && fig.contains(a) ? BAND.get(a.dataset.s) : null }
	fig.addEventListener('pointermove', e => { if (e.pointerType !== 'touch') pick(hit(e) || held()) })
	fig.addEventListener('pointerleave', () => pick(held()))
	fig.addEventListener('mousedown', e => { if (e.target.closest?.('.hl-b')) e.preventDefault() })   // a click picks without focusing: closing the dossier hands focus back to nothing here, and the four return
	// the key: a light picked keeps only its bands, picked again brings the rest back
	const keys = [...fig.querySelectorAll('.hl-kd')]
	const keep = k => { only = only === k ? null : k
		keys.forEach((kd, i) => kd.setAttribute('aria-pressed', i === only))
		for (const b of BANDS) els.get(b.s).classList.toggle('out', !vis(b))
		for (const m of fig.querySelectorAll(':is(.hl-ms,.hl-ld,.hl-dm)[data-s]')) m.classList.toggle('out', !vis(BAND.get(m.dataset.s)))   // a milestone leaves with its band
		if (cur && !vis(BAND.get(cur.dataset.s))) pick(null)
		if (!vis(BAND.get(tab.dataset.s))) { tab.tabIndex = -1; tab = els.get(next(DOWN, -1, 1).s); tab.tabIndex = 0 } }
	keys.forEach((kd, k) => kd.addEventListener('click', () => keep(k)))
	el.addEventListener('click', e => { if (e.target.closest?.('.hl-key')) return; const s = e.target.closest?.('.hl-ms')?.dataset.s || (hit(e) || BAND.get(e.target.closest?.('.hl-b')?.dataset.s))?.s; if (s) open(s) })
	fig.addEventListener('keydown', e => { const t2 = e.target.closest?.('.hl-b'); if (!t2) return; const b = BAND.get(t2.dataset.s), k = DOWN.indexOf(b)
		const to = { ArrowDown: next(DOWN, k, 1), ArrowUp: next(DOWN, k, -1), ArrowRight: next(BANDS, b.r, 1), ArrowLeft: next(BANDS, b.r, -1), Home: next(DOWN, -1, 1), End: next(DOWN, DOWN.length, -1) }
		if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(b.s) }
		else if (e.key in to) { e.preventDefault(); move(to[e.key]) } })
	fig.addEventListener('focusin', e => { const b = e.target.closest?.('.hl-b'); if (!b) return
		if (b !== tab) { tab.tabIndex = -1; tab = b; tab.tabIndex = 0 } pick(BAND.get(b.dataset.s)) })
	fig.addEventListener('focusout', e => { if (!fig.contains(e.relatedTarget)) pick(null) })
	let h0 = null, c0 = null
	return (c, h) => { const cs = isFinite(c) ? c.toFixed(3) : '0'
		if (cs !== c0) { c0 = cs; el.style.setProperty('--hl-cc', cs) }
		if ((c < .01 && h0 !== null) || !isFinite(h) || h === h0) return; h0 = h; el.style.setProperty('--hl-h', h.toFixed(1)) } }
