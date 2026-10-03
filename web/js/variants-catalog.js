// UI-variants workshop – the catalog every variant shares (grid · list · table), its painters,
// and the detail pane. Layout decisions live here, not in the variants: 1–3 starred spaces open
// each shelf with the full reading, the rest follow as tiles with sliders only.
import { ramp, plane, lensFor, clamp } from './core.js'
import { cname, unit, fmtc, ink, HISTORICAL } from './render.js'
import { paintPlaneGL, paintBarGL, hasPlaneGL, planeGLStatus, warmGL } from './gl.js'
import { quantRGB } from './study-render.js'
import { drawSolid } from './study-solid.js'
import { FK, PICKS, PURPOSE, qArg, plabel, CAP } from './variants-data.js'
import { UI } from './variants-icons.js'
import { S, LORE, SPACES, RGB, hexNow, valsOf, shelves, pairsOf, famOf, sent, classify, meta, rgbF, disp } from './variants-model.js'

export const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const byline = s => { const m = meta[s]; return [m.year, m.by].filter(Boolean).join(' · ') }
const lede = s => sent(LORE[s]?.for)
const geoWord = s => ({ polar: 'Polar', opponent: 'Opponent' })[classify(s).archetype] || 'Component'
const runs = s => ['css', 'glsl', 'wasm', 'lut'].filter(k => CAP[k].has(s)).map(k => k.toUpperCase()).join(' · ')

// ── markup ──
const nameBtn = (s, cls = 'nm') => `<button class="${cls}" type="button" data-open-s="${s}" title="${esc(lede(s))}" aria-label="Open ${esc(disp(s))} details">${esc(disp(s))}</button>`
const readings = (s, edit) => `<span class="rd">${classify(s).ch.map((c, i) => edit
	? `<label class="cvp" title="${esc(cname(c))}"><i class="cl">${esc(c.sym.slice(0, 2))}</i><input class="cv tnum" data-i="${i}" inputmode="decimal" spellcheck="false" autocomplete="off" aria-label="${esc(disp(s))} ${esc(cname(c))}"></label>`
	: `<span class="cvp" title="${esc(cname(c))}"><i class="cl">${esc(c.sym.slice(0, 2))}</i><b class="cv tnum" data-i="${i}"></b></span>`).join('')}</span>`
const strips = (s, cls = 'chs') => `<div class="${cls}">${classify(s).ch.map((c, i) => `<div class="ch" data-i="${i}" title="${esc(cname(c))}"><input type="range" class="nrg" data-i="${i}" min="${c.min}" max="${c.max}" step="any" aria-label="${esc(disp(s))} ${esc(cname(c))}"></div>`).join('')}</div>`
const planes = (s, cls = 'pls') => { const c = classify(s)
	return `<div class="${cls}">${pairsOf(c).map(([a, b]) => `<div class="pl" data-a="${a}" data-b="${b}" title="${esc(cname(c.ch[a]))} across, ${esc(cname(c.ch[b]))} up – drag to pick"><canvas></canvas><i class="cx"></i><span class="lx">${esc(c.ch[a].sym)}</span><span class="ly">${esc(c.ch[b].sym)}</span></div>`).join('')}</div>` }
const star = s => PICKS.has(s) ? `<span class="pick" title="One of our starred spaces">${UI.star}</span>` : ''

const leadHTML = s => `<article class="sp lc${S.sel === s ? ' on' : ''}" data-s="${s}">
	<header class="lh">${nameBtn(s)}<span class="by">${esc(byline(s))}</span></header>
	<p class="for">${esc(lede(s))}</p>
	${readings(s, true)}
	${S.preview === 'planes' && pairsOf(classify(s)).length ? planes(s) : strips(s)}
</article>`
const tileHTML = s => `<article class="sp tc${S.sel === s ? ' on' : ''}" data-s="${s}">
	<header class="th">${nameBtn(s)}${star(s)}<span class="yr tnum">${meta[s].year || ''}</span></header>
	${strips(s, 'chs thin')}
	${readings(s, false)}
</article>`
const rowHTML = s => `<article class="sp lr${S.sel === s ? ' on' : ''}" data-s="${s}">
	<div class="li"><header class="th">${nameBtn(s)}${star(s)}</header><span class="by">${esc(byline(s))}</span><p class="for">${esc(lede(s))}</p></div>
	<div class="lv">${classify(s).ch.map((c, i) => `<div class="lch"><i class="cl" title="${esc(cname(c))}">${esc(c.sym.slice(0, 2))}</i><div class="ch" data-i="${i}"><input type="range" class="nrg" data-i="${i}" min="${c.min}" max="${c.max}" step="any" aria-label="${esc(disp(s))} ${esc(cname(c))}"></div><b class="cv tnum" data-i="${i}"></b></div>`).join('')}</div>
</article>`

// the spec sheet: sortable, grouped by the arrangement until a column takes the order
const COLS = [['name', 'Name', s => disp(s)], ['fam', 'Family', s => famOf[s]], ['year', 'Year', s => meta[s].year || 0],
	['by', 'Made by', s => meta[s].by || ''], ['ch', 'Channels', s => meta[s].channels.map(c => c.symbol).join(' ')],
	['geo', 'Shape', geoWord], ['curve', 'Curve', s => plabel(meta[s].encoding || '')], ['range', 'Range', s => (meta[s].dynamic || 'sdr').toUpperCase()],
	['white', 'White', s => meta[s].illuminant || ''], ['runs', 'Runs in', runs]]
const trHTML = s => `<tr class="sp tr${S.sel === s ? ' on' : ''}" data-s="${s}"><td class="tsw">${strips(s, 'chs mini')}</td>${COLS.map(([k, , f], i) => i ? `<td class="c-${k}">${esc(f(s))}</td>` : `<th scope="row">${nameBtn(s)}${star(s)}</th>`).join('')}</tr>`
function tableHTML(sh) {
	const head = `<thead><tr><th class="tsw"><span class="sr">Preview</span></th>${COLS.map(([k, l]) => `<th scope="col" aria-sort="${S.tsort === k ? (S.tdir > 0 ? 'ascending' : 'descending') : 'none'}"><button type="button" data-sort="${k}">${l}${S.tsort === k ? `<span aria-hidden="true">${S.tdir > 0 ? ' ↑' : ' ↓'}</span>` : ''}</button></th>`).join('')}</tr></thead>`
	if (S.tsort) { const f = COLS.find(c => c[0] === S.tsort)[2], all = sh.flatMap(c => c.spaces)
		all.sort((a, b) => { const x = f(a), y = f(b); return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y))) * S.tdir })
		return `<div class="tblw"><table class="tbl">${head}<tbody>${all.map(trHTML).join('')}</tbody></table></div>` }
	return `<div class="tblw"><table class="tbl">${head}${sh.map(c => `<tbody><tr class="tg"><th colspan="${COLS.length + 1}" scope="rowgroup">${esc(c.name)} <span class="cnt tnum">${c.spaces.length}</span></th></tr>${[...c.lead, ...c.rest].map(trHTML).join('')}</tbody>`).join('')}</table></div>` }

export function catalogHTML() {
	const sh = shelves()
	if (!sh.length) return `<div class="none"><p>No space matches all of that.</p><button type="button" class="lnk" data-reset>Clear the search and filters</button></div>`
	if (S.view === 'table') return tableHTML(sh)
	return sh.map(c => `<section class="shelf${S.shut.has(c.name) ? ' shut' : ''}" aria-label="${esc(c.name)}">
	<header class="sh"><button class="fold" type="button" data-shut="${esc(c.name)}" aria-expanded="${!S.shut.has(c.name)}" aria-label="Fold ${esc(c.name)}">${UI.chev}</button><h2>${esc(c.name)}</h2><span class="cnt tnum">${c.spaces.length < c.total ? `${c.spaces.length} of ${c.total}` : c.total}</span></header>${c.tip ? `<p class="tip">${esc(c.tip)}</p>` : ''}
	${S.view === 'grid'
		? `${c.lead.length ? `<div class="lead n${c.lead.length}">${c.lead.map(leadHTML).join('')}</div>` : ''}${c.rest.length ? `<div class="tiles">${c.rest.map(tileHTML).join('')}</div>` : ''}`
		: `<div class="rows">${[...c.lead, ...c.rest].map(rowHTML).join('')}</div>`}
</section>`).join('') }

// ── painting: a strip is the color swept along one channel; quantized modes paint flat cells ──
export function strip(s, vals, i, n, gm) {
	const c = meta[s].channels[i], q = qArg(S.quant)
	if (!q) return `linear-gradient(90deg, ${ramp(s, vals, i, c.min, c.max, n, gm).join(',')})`
	const N = typeof q === 'number' ? q : 64, alpha = lensFor(s, gm), out = []
	for (let k = 0; k < N; k++) { const v = vals.slice(); v[i] = c.min + (c.max - c.min) * (k + .5) / N
		let rgb; try { rgb = rgbF(s, v) } catch { rgb = [0, 0, 0] }
		if (typeof q !== 'number') rgb = quantRGB(rgb, q, S.metric)
		const col = `rgb(${rgb.map(x => Math.round(x)).join(' ')} / ${alpha ? alpha(v) : 1})`, lo = (k / N * 100).toFixed(2), hi = ((k + 1) / N * 100).toFixed(2)
		if (out.length && out.at(-1).col === col) out.at(-1).hi = hi; else out.push({ col, lo, hi }) }
	return `linear-gradient(90deg, ${out.map(r => `${r.col} ${r.lo}% ${r.hi}%`).join(',')})` }
const frac = (v, c) => clamp((v - c.min) / (c.max - c.min), 0, 1)
const glOk = s => hasPlaneGL(s) && planeGLStatus(s) === 'ready'
export function paintPlanes(host, s, vals, res) {
	const c = classify(s), q = qArg(S.quant), gl = glOk(s); if (!gl && hasPlaneGL(s)) warmGL(s)
	host.querySelectorAll('.pl').forEach(pl => { const a = +pl.dataset.a, b = +pl.dataset.b, ca = c.ch[a], cb = c.ch[b], cv = pl.querySelector('canvas')
		const px = gl ? Math.min(res * 2, Math.round((pl.clientWidth || res) * (devicePixelRatio || 1))) : res
		if (cv.width !== px) cv.width = cv.height = px
		if (!(gl && paintPlaneGL(cv, s, vals, a, b, [ca.min, ca.max], [cb.min, cb.max], S.limit, q, false, 0, S.metric || 'oklab')))
			try { plane(cv.getContext('2d'), px, s, vals, a, b, [ca.min, ca.max], [cb.min, cb.max], true, S.limit, typeof q === 'string' && q !== 'web' ? rgb => quantRGB(rgb, q, S.metric) : q || null) } catch {}
		const x = pl.querySelector('.cx'); x.style.left = frac(vals[a], ca) * 100 + '%'; x.style.top = (1 - frac(vals[b], cb)) * 100 + '%' }) }
// one entry: its strips, thumbs, readings and planes – n guides for the sweep (fewer while dragging)
export function paintEntry(el, n = 24) {
	const s = el.dataset.s, vals = valsOf(s), m = meta[s], gm = S.limit
	el.style.setProperty('--tkc', hexNow()); el.style.setProperty('--tki', ink(RGB))
	el.querySelectorAll('.ch').forEach(ch => { const i = +ch.dataset.i
		ch.style.background = strip(s, vals, i, n, gm) + ', var(--checker)'
		const r = ch.querySelector('.nrg'); if (r && document.activeElement !== r) r.value = vals[i] })
	el.querySelectorAll('.cv').forEach(v => { const i = +v.dataset.i, t = fmtc(vals[i], m.channels[i]) + (v.tagName === 'B' ? unit(m.channels[i]) : '')
		if (v.tagName === 'INPUT') { if (document.activeElement !== v) v.value = t } else v.textContent = t })
	if (el.querySelector('.pls')) paintPlanes(el, s, vals, 160)
	el._clean = true }

// ── the detail pane – the dossier's order: header → tags → rule → instrument → record → story ──
const tagsOf = s => { const m = meta[s]
	return [m.method, m.encoding, m.referred && m.referred + '-referred', m.dynamic && m.dynamic.toUpperCase(), m.illuminant, HISTORICAL.has(s) && 'historical'].filter(Boolean) }
const descOf = s => { const d = meta[s].description || ''; const k = d.indexOf(' — '); return sent(k > 0 && k < 60 ? d.slice(k + 3) : d) }
export function paneHTML(s) {
	const m = meta[s], c = classify(s), L = LORE[s] || {}, list = [...document.querySelectorAll('#cat .sp')].map(e => e.dataset.s), k = list.indexOf(s)
	return `<header class="ph">
		<div class="pt"><span class="eyebrow">${esc(famOf[s] || '')}</span><h1 id="ptitle">${esc(disp(s))}</h1><span class="by">${esc(byline(s))}</span></div>
		<div class="pact"><button class="ib" type="button" data-go="-1" aria-label="Previous space"${k > 0 ? '' : ' disabled'}>${UI.prev}</button><button class="ib" type="button" data-go="1" aria-label="Next space"${k >= 0 && k < list.length - 1 ? '' : ' disabled'}>${UI.next}</button><button class="ib" type="button" data-close aria-label="Close details">${UI.x}</button></div>
	</header>
	${L.for ? `<p class="lede">${esc(sent(L.for))}</p>` : ''}
	<div class="dpills">${tagsOf(s).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
	<hr class="dhr">
	<div class="big">${c.ch.map((ch, i) => `<label class="bch" title="${esc(cname(ch))}"><i class="bl">${esc(ch.sym)}</i><input class="cv tnum" data-i="${i}" inputmode="decimal" spellcheck="false" autocomplete="off" aria-label="${esc(cname(ch))}"><i class="u">${unit(ch)}</i></label>`).join('')}</div>
	<div class="bars">${c.ch.map((ch, i) => `<div class="bar" data-i="${i}"><canvas class="bgc"></canvas><div class="ch" data-i="${i}"><input type="range" class="nrg" data-i="${i}" min="${ch.min}" max="${ch.max}" step="any" aria-label="${esc(cname(ch))}"></div><span class="bn">${esc(cname(ch))}</span></div>`).join('')}</div>
	${pairsOf(c).length ? planes(s) : ''}
	<figure class="shape"><div class="solid-wrap" tabindex="0" role="group" aria-label="The space's solid – drag or use arrow keys to turn"><canvas class="solid-hud"></canvas></div><figcaption id="solidcap">The shape of the space · drag to turn</figcaption></figure>
	<div class="props">
		<div><i>Channels</i><p>${c.ch.map(ch => `<b>${esc(ch.sym)}</b> ${esc(cname(ch))} <span class="rng tnum">${ch.min}–${ch.max}${unit(ch)}</span>`).join('<br>')}</p></div>
		<div><i>Origin</i><p>${esc(byline(s))}</p>${m.illuminant ? `<i>White</i><p>${esc(m.illuminant)}${m.observer ? `, ${esc(m.observer)}° observer` : ''}</p>` : ''}${runs(s) ? `<i>Runs in</i><p>${esc(runs(s))} · JS</p>` : ''}</div>
	</div>
	<p class="desc">${esc(descOf(s)).replace(/`([^`]+)`/g, '<code>$1</code>')}</p>
	${L.sin || L.nm ? `<div class="story">${L.sin ? `<div><i>Watch out</i><p>${esc(sent(L.sin))}</p></div>` : ''}${L.nm ? `<div><i>The name</i><p>${esc(sent(L.nm))}</p></div>` : ''}</div>` : ''}
	<div class="used"><i>Used for</i><div class="chipsx">${(PURPOSE[s] || []).map(t => `<button class="tag" type="button" data-f="for" data-v="${t}">${esc(plabel(t))}</button>`).join('')}</div></div>
	${m.wiki ? `<p class="links"><a href="${esc(m.wiki)}" target="_blank" rel="noopener">Read more on Wikipedia ↗</a></p>` : ''}` }
export const PANE = { rot: [-.6, .35] }
export function paintPane(full = true) {
	const pane = document.getElementById('pane'), s = S.sel; if (!s || !pane.querySelector('.big')) return
	const vals = valsOf(s), m = meta[s], c = classify(s), gl = glOk(s); if (!gl && hasPlaneGL(s)) warmGL(s)
	pane.style.setProperty('--tkc', hexNow()); pane.style.setProperty('--tki', ink(RGB))
	pane.querySelectorAll('.big .cv').forEach(v => { const i = +v.dataset.i; if (document.activeElement !== v) v.value = fmtc(vals[i], m.channels[i]) })
	pane.querySelectorAll('.bar').forEach(bar => { const i = +bar.dataset.i, ch = m.channels[i], cv = bar.querySelector('.bgc'), st = bar.querySelector('.ch')
		if (full) { if (cv.width !== 512) { cv.width = 512; cv.height = 1 }
			const ok = gl && paintBarGL(cv, s, vals, i, [ch.min, ch.max], c.ch.length > 1 ? S.limit : 'locus', qArg(S.quant), S.metric || 'oklab')
			cv.hidden = !ok; st.style.background = ok ? 'transparent' : strip(s, vals, i, 40, S.limit) + ', var(--checker)' }
		const r = st.querySelector('.nrg'); if (document.activeElement !== r) r.value = vals[i] })
	if (pane.querySelector('.pls')) paintPlanes(pane, s, vals, 216)
	paintSolid() }
// the solid alone – a turn redraws only this
export function paintSolid() { const pane = document.getElementById('pane'), host = pane.querySelector('.solid-wrap'); if (!S.sel || !host) return
	const ok = drawSolid(host, S.sel, valsOf(S.sel), S.limit, qArg(S.quant), PANE.rot, hexNow())
	document.getElementById('solidcap').textContent = ok ? 'The shape of the space · drag to turn' : host.dataset.render === 'unavailable' ? 'No 3D shape for this space' : 'Preparing the 3D shape…'
	pane.querySelector('.shape').hidden = host.dataset.render === 'unavailable' }
export { SPACES }
