// Atlas top · Status bar – an editor's frame around the catalog. The masthead keeps identity, color and find
// (wordmark · chip | search | EN · theme · GitHub); the definition and the tour are a compact hero under it;
// the facets – 'For' and the eight cells – are one quiet row right above the catalog; and every RENDERING
// option lives in a status bar along the bottom, read left to right like an editor's: the color (hex, gamut)
// and the count, then view · quantize ▾ · limit ▾ · vision ▾. Where the bar runs short (phones, a docked
// dossier) the options fold into one 'View ▾' menu whose button names what is set.
// The bar sits in the top layer (a manual popover): .page is a size container, so a plain position:fixed in a
// mount would pin to the page, not the screen. Contract: atlas.js.
import { S } from './wb.js'
import { hexNow, gamutOf, GAMLABEL, GAMTIP } from '../js/variants-model.js'
import { FK } from '../js/variants-data.js'
import { FI, UI } from '../js/variants-icons.js'

export default function mount({ top, hero, opts }) {
	top.innerHTML = `<header class="top sbtop">
		<span class="sbid"><span data-wb="brand"></span><span data-wb="chip"></span></span>
		<span data-wb="search"></span>
		<span class="sbend"><span data-wb="lang"></span><span data-wb="tools"></span></span>
	</header>`
	hero.innerHTML = `<div data-wb="orient"></div>
	<div class="sbtour"><span class="lab" aria-hidden="true">Start here</span><div data-wb="stops"></div></div>
	<div class="sbstop" data-wb="stop"></div>`
	opts.innerHTML = `<div class="cells sbcells" role="group" aria-label="Filters">
		<button type="button" class="cell wb-cell sbfor" popovertarget="sb-for"><span class="ci">${FI[FK.for.icon]}</span><span class="cw"><small>${FK.for.label}</small><span class="sbv"><b id="sb-forv">Any</b>${UI.chev}</span></span></button>
		<div class="sbrow" data-wb="cells"></div>
	</div>
	<div class="sbpop" id="sb-for" popover role="dialog" aria-labelledby="sb-for-t"><p class="sbpop-t" id="sb-for-t">${FK.for.q}</p><div data-wb="tags"></div></div>
	<div class="sbar" id="sb-bar" popover="manual" role="region" aria-label="Status – view and lens"><div class="sbin">
		<p class="sbst"><button type="button" class="sbcol" title="Edit the current color"><span class="cdw" aria-hidden="true"></span><span class="sbhex tnum" id="sb-hex"></span></button><span class="gam" id="sb-gam"></span><span data-wb="count"></span></p>
		<button type="button" class="sbmore" popovertarget="sb-menu" aria-haspopup="dialog"><span>View</span><b id="sb-sum"></b>${UI.chev}</button>
		<div class="sbopts" id="sb-menu" popover role="group" aria-label="View and lens">
			<span class="sbview" data-wb="view"></span>
			<span class="sblens"><span data-wb="quant"></span><span data-wb="metric"></span><span data-wb="limit"></span><span data-wb="vision"></span></span>
		</div>
	</div></div>`

	const $ = s => opts.querySelector(s), bar = $('#sb-bar'), menu = $('#sb-menu'), more = $('.sbmore')
	bar.showPopover()
	// the readout: the current color's hex and gamut – the chip above is where it is edited (a click goes there)
	const hex = $('#sb-hex'), gam = $('#sb-gam')
	const paint = () => { const g = gamutOf(); hex.textContent = hexNow(); gam.textContent = GAMLABEL[g]; gam.title = GAMTIP[g]; gam.dataset.g = g }
	const edit = () => { const v = document.getElementById('cval'); v?.focus(); v?.select() }
	$('.sbcol').addEventListener('click', edit); document.addEventListener('wb:color', paint); paint()
	// the folded menu's button names what is set: layout · quantize · limit (· vision, when one is on)
	const sum = () => { const q = s => menu.querySelector(s), txt = s => q(s)?.selectedOptions[0]?.text, cv = q('[data-wb-cvd]')
		$('#sb-sum').textContent = [q('[data-set="view"][aria-pressed="true"] .sr')?.textContent, txt('[data-wset="quant"]'), txt('[data-wset="limit"]'), cv && cv.value !== 'none' ? txt('[data-wb-cvd]') : '']
			.filter(Boolean).join(' · ') }
	const MO = new MutationObserver(sum); MO.observe(menu, { childList: true, subtree: true }); menu.addEventListener('change', sum)
	// the bar widened past the fold while the menu was open: the options are inline again
	const RO = new ResizeObserver(() => { if (!more.offsetWidth && menu.matches(':popover-open')) menu.hidePopover() }); RO.observe(bar)
	// the 'For' cell's value: the purposes that are on – re-read whenever wb.js re-renders the pills
	const val = $('#sb-forv'), cell = $('.sbfor'), names = Object.fromEntries(FK.for.opts.map(([v, n]) => [v, n]))
	const forv = () => { const on = [...S.F.for]; val.textContent = on.length ? names[on[0]] + (on.length > 1 ? ` +${on.length - 1}` : '') : 'Any'; cell.classList.toggle('on', on.length > 0) }
	const MF = new MutationObserver(forv); MF.observe($('#sb-for [data-wb="tags"]'), { childList: true })
	return () => { MO.disconnect(); MF.disconnect(); RO.disconnect(); document.removeEventListener('wb:color', paint) }
}
