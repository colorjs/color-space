// Atlas top · Studio – the top the owner liked in the Studio prototype, refined. ONE toolbar in the order a
// reader works – identity (wordmark) → color (chip) → find (search) → view (size · layout · preview) → how it
// is drawn (swatch kind + quantize ▾ · distance ▾ · limit ▾) → vision ▾ · EN ▾ · theme · GitHub – then ONE
// row of facet cells, the count at its left and the purposes as the first cell ('For', its pills in a
// popover). Both stay pinned; the hero under them – the definition and the tour strip – scrolls away.
// Below 75rem the view and lens leave the toolbar for #opts, a quiet row under the hero. Contract: atlas.js.
import { S } from './wb.js'
import { FK } from '../js/variants-data.js'
import { FI } from '../js/variants-icons.js'

const LENS = `<span class="stgrp"><span data-wb="swatch"></span><span data-wb="quant"></span><span data-wb="metric"></span></span><span class="stpair"><span data-wb="limit"></span><span data-wb="vision"></span></span>`
const VIEW = `<span class="stgrp"><span data-wb="size"></span><span data-wb="layout"></span><span data-wb="preview"></span></span>`

export default function mount({ top, hero, opts }) {
	top.innerHTML = `<header class="top stbar">
		<span data-wb="brand"></span><span data-wb="chip"></span><span data-wb="search"></span>
		<span class="stset wide">${VIEW}${LENS}</span>
		<span class="stend"><span data-wb="lang"></span><span data-wb="tools"></span></span>
	</header>
	<div class="cells scells" role="group" aria-label="Filters">
		<span class="stot" data-wb="count"></span>
		<button type="button" class="cell wb-cell stfor" popovertarget="st-for"><span class="ci">${FI[FK.for.icon]}</span><span class="cw"><small>${FK.for.label}</small><span class="stv"><b id="st-forv">Any</b></span></span></button>
		<div class="srow" data-wb="cells"></div>
	</div>
	<div class="stpop" id="st-for" popover role="dialog" aria-labelledby="st-for-t"><p class="stpop-t" id="st-for-t">${FK.for.q}</p><div data-wb="tags"></div></div>`
	hero.innerHTML = `<div data-wb="orient"></div>
	<div class="sttour"><span class="lab" aria-hidden="true">Start here</span><div data-wb="stops"></div></div>
	<div class="ststop" data-wb="stop"></div>`
	opts.innerHTML = `<div class="stset narrow">${VIEW}${LENS}</div>`

	// the 'For' cell's value: the purposes that are on – re-read whenever wb.js re-renders the pills
	const tags = top.querySelector('[data-wb="tags"]'), cell = top.querySelector('.stfor'), val = top.querySelector('#st-forv')
	const names = Object.fromEntries(FK.for.opts.map(([v, n]) => [v, n]))
	const sum = () => { const on = [...S.F.for]; val.textContent = on.length ? names[on[0]] + (on.length > 1 ? ` +${on.length - 1}` : '') : 'Any'; cell.classList.toggle('on', on.length > 0) }
	const MO = new MutationObserver(sum); MO.observe(tags, { childList: true })
	// below 75rem the view and lens live in #opts, and the toolbar's copies are hidden: wb.js hands focus back
	// to the first copy of a control after re-rendering it, so a control used in #opts is re-focused there
	let k = null
	const seen = e => { k = e.target.dataset?.k || null }, back = () => { if (k && (!document.activeElement || document.activeElement === document.body)) opts.querySelector(`[data-k="${CSS.escape(k)}"]`)?.focus({ preventScroll: true }) }
	opts.addEventListener('focusin', seen); document.addEventListener('wb:set', back)
	return () => { MO.disconnect(); document.removeEventListener('wb:set', back) }
}
