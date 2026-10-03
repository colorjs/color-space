// Atlas top · Editorial – two tiers. A minimal identity bar (wordmark · color · search · language · theme ·
// GitHub) whose search lands on the hero's content column; a generous hero (the definition as the lede, the
// tour as a numbered strip, the open stop's two sentences beneath); then ONE sticky options bar: the count,
// 'Filter' (a panel – the 10 purposes and the 8 facets; whatever is on rides the bar as removable chips), the
// view and the lens. Where the page is too narrow for them, the view and the lens fold behind 'View' – the
// same element, a popover only while folded (CSS decides; there is no second copy). Contract: atlas.js.
import { UI } from '../js/variants-icons.js'

export default function mount({ top, hero, opts, wb }) {
	const { ORIENT, esc } = wb
	top.innerHTML = `<header class="top emast"><div class="emi">
		<span class="eid"><span data-wb="brand"></span><span data-wb="chip"></span></span>
		<span data-wb="search"></span>
		<span class="eend"><span data-wb="lang"></span><span data-wb="tools"></span></span>
	</div></header>`
	// the lede is orient's sentence pair, set as a lede: the definition in ink, its consequence quieter
	hero.innerHTML = `<div class="row"><span class="lab" aria-hidden="true"></span><p class="wb-orient elede">${esc(ORIENT[0])} <span class="e2">${esc(ORIENT[1])}</span></p></div>
	<div class="row"><h2 class="lab">Start here</h2><div class="etour"><div data-wb="stops"></div><div class="estop" data-wb="stop"></div></div></div>`
	opts.innerHTML = `<div class="ebar">
		<span class="ecnt" data-wb="count"></span>
		<button type="button" class="ebtn efb" popovertarget="ed-fp" aria-haspopup="dialog">Filter<span class="efn tnum"></span>${UI.chev}</button>
		<div class="echips" role="group" aria-label="Active filters"></div>
		<button type="button" class="ebtn evb" popovertarget="ed-vp" aria-haspopup="dialog">View${UI.chev}</button>
		<div class="evp" id="ed-vp" popover role="group" aria-label="View and lens">
			<div class="evg" data-wb="view"></div>
			<div class="elens"><span data-wb="quant"></span><span data-wb="metric"></span><span data-wb="limit"></span><span data-wb="vision"></span></div>
		</div>
	</div>
	<div class="efp" id="ed-fp" popover role="dialog" aria-label="Filter the spaces">
		<div class="etags" data-wb="tags"></div>
		<div class="ecells" data-wb="cells"></div>
	</div>`

	// the chips: what the panel has on, read off its own render (the cells' labels and words, the pressed
	// purposes) whenever wb.js re-renders it; each chip is the delegate's own toggle (data-f · data-wf="for")
	const fp = opts.querySelector('#ed-fp'), chips = opts.querySelector('.echips'), fb = opts.querySelector('.efb'), fn = fb.querySelector('.efn')
	let raf = 0, refocus = false
	function sync() { raf = 0
		const on = [...fp.querySelectorAll('.wb-cell.on')].map(c => { const s = c.querySelector('select'), l = c.querySelector('small')?.textContent || '', v = s.selectedOptions[0]?.text || s.value
			return [`data-f="${esc(s.dataset.wf)}" data-v="${esc(s.value)}"`, `<span class="o">${esc(l)}</span> ${esc(v)}`, `${l} ${v}`] })
			.concat([...fp.querySelectorAll('.tag[aria-pressed="true"]')].map(b => [`data-wf="for" data-v="${esc(b.dataset.v)}"`, esc(b.textContent), `for ${b.textContent}`]))
		chips.innerHTML = on.map(([a, h, t]) => `<button type="button" class="fchip" ${a} aria-label="Remove the filter ${esc(t)}" title="Remove ‘${esc(t)}’">${h}${UI.x}</button>`).join('')
		fn.textContent = on.length || ''; fb.classList.toggle('on', on.length > 0)
		if (refocus) { refocus = false; (chips.querySelector('.fchip') || fb).focus({ preventScroll: true }) } }   // a removed chip hands focus on
	const MO = new MutationObserver(() => { raf ||= requestAnimationFrame(sync) })
	MO.observe(fp, { childList: true, subtree: true })
	const onChip = e => { if (e.target.closest('.fchip')) refocus = true }
	chips.addEventListener('click', onChip)
	return () => { MO.disconnect(); cancelAnimationFrame(raf); chips.removeEventListener('click', onChip) }
}
