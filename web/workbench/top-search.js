// Atlas top · Search – search-first, and no longer collapsed. The first screen is the definition and ONE wide
// box: the color's diamond and notation inside it, 'Type a color or a color space' – a color paints the
// catalog, a word finds spaces (the Search prototype's double duty). Quiet examples and the tour as one line
// sit under it. Scroll, and the box docks into the bar's middle (sticky – no script places it) while the
// options fade in as one slim bar under it: count · Filter ▾ | view | quantize ▾ · limit ▾ · vision ▾ (a
// scroll-driven fade; at once when the box has focus). The facets and the purposes open in a sheet from the
// side. The catalog keeps the page's full width. Contract: atlas.js.
import { S, color, renderCat, refresh, searchHTML, esc } from './wb.js'
import { parseColor } from '../js/variants-model.js'
import { FK } from '../js/variants-data.js'
import { UI } from '../js/variants-icons.js'

const TRY = ['#ff8000', 'oklch(0.7 0.15 30)', 'S-Log3', 'palettes', 'print']
// a hex, a CSS function or a CSS color name – also while it is still being typed ('#ff', 'oklch(0.7')
const colorish = v => /^#|\(/.test(v) || !!parseColor(v)

export default function mount({ top, hero, opts }) {
	top.innerHTML = `<header class="top qbar"><span data-wb="brand"></span><span class="fill"></span>
		<label class="ib qfind" for="q" title="Search">${UI.search}</label><span data-wb="lang"></span><span data-wb="tools"></span></header>
	<section class="qsheet" id="q-sheet" popover role="dialog" aria-labelledby="q-sheet-t">
		<div class="qhd"><h2 id="q-sheet-t">Filter</h2><button type="button" class="ib" popovertarget="q-sheet" popovertargetaction="hide" aria-label="Close">${UI.x}</button></div>
		<div class="qtags" data-wb="tags"></div>
		<div class="qcells" data-wb="cells"></div>
	</section>`
	hero.innerHTML = `<div class="qintro" data-wb="orient"></div>
	<div class="qbox" role="search"><span data-wb="chip"></span>${searchHTML('Type a color or a color space')}</div>
	<p class="qtry"><span class="fsel-l">Try</span>${TRY.map(t => `<button type="button" data-try="${esc(t)}">${esc(t)}</button>`).join('')}</p>
	<div class="qtour"><span class="fsel-l">Start here</span><div data-wb="stops"></div></div>
	<div class="qstop" data-wb="stop"></div>`
	opts.innerHTML = `<div class="qopts">
		<span class="qgrp"><span data-wb="count"></span><button type="button" class="qfil" popovertarget="q-sheet" aria-haspopup="dialog"><span>Filter</span><b id="q-filv">Any</b></button></span>
		<span class="qgrp qview" data-wb="view"></span>
		<span class="qgrp qlens"><span data-wb="quant"></span><span data-wb="metric"></span><span data-wb="limit"></span><span data-wb="vision"></span></span>
	</div>`

	// the box's double duty: a color paints and filters nothing – wb.js's search never sees it; a word goes on to wb.js
	const q = hero.querySelector('#q')
	let fixT = 0
	const unfilter = () => { if (!S.q || !colorish(q.value.trim())) return; S.q = ''; renderCat(); refresh('stripe', 'cells', 'tags', 'count') }
	const onType = e => { if (e.target !== q) return; const v = q.value.trim(); if (!colorish(v)) return
		e.stopPropagation(); q.closest('.find')?.classList.add('has')
		const c = parseColor(v); if (c) color(c.s, c.vals)
		unfilter(); clearTimeout(fixT); fixT = setTimeout(unfilter, 200) }   // after wb.js's own search pause – a word typed just before may still be due
	const onTry = e => { const b = e.target.closest('[data-try]'); if (!b) return
		q.focus(); q.value = b.dataset.try; q.dispatchEvent(new Event('input', { bubbles: true })) }
	// a color set anywhere else (a slider, the diamond) leaves the box's typed color behind – the box empties
	const onColor = e => { if (e.detail?.authored && document.activeElement !== q && colorish(q.value.trim())) { q.value = ''; q.closest('.find')?.classList.remove('has') } }
	hero.addEventListener('input', onType); hero.addEventListener('click', onTry); document.addEventListener('wb:color', onColor)

	// the Filter button's value: the facets and purposes that are on – re-read whenever wb.js re-renders the sheet
	const val = opts.querySelector('#q-filv'), fil = opts.querySelector('.qfil')
	const name = (k, v) => FK[k]?.opts.find(o => o[0] === v)?.[1] || v
	const sum = () => { const on = Object.entries(S.F).flatMap(([k, set]) => [...set].map(v => name(k, v)))
		val.textContent = on.length ? on[0] + (on.length > 1 ? ` +${on.length - 1}` : '') : 'Any'; fil.classList.toggle('on', on.length > 0) }
	const MO = new MutationObserver(sum); for (const h of top.querySelectorAll('.qsheet [data-wb]')) MO.observe(h, { childList: true })

	return () => { clearTimeout(fixT); MO.disconnect(); hero.removeEventListener('input', onType); hero.removeEventListener('click', onTry); document.removeEventListener('wb:color', onColor) }
}
