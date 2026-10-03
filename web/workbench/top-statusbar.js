// Atlas top · Status bar – an editor's frame around the catalog. The masthead keeps identity, color and find
// (wordmark · chip | search | EN · theme · GitHub); the definition and the tour are a compact hero under it;
// the facets – 'For' and the eight – are ONE quiet row of text selects right above the catalog; and every
// RENDERING option lives in a status bar along the bottom edge, read left to right like an editor's: what is
// shown (the color, the count, the filters on – a click clears them), then how it is drawn (size · swatch ·
// layout · preview | quantize · distance · limit · vision). Where the bar runs short (phones, a docked
// dossier) the drawing options fold into one 'View ▾' menu whose button names what is set.
// The bar sits in the top layer (a manual popover): .page is a size container, so a plain position:fixed in a
// mount would pin to the page, not the screen. Its height is the shell's --stick-bot. Contract: atlas.js.
import { S } from './wb.js'
import { hexNow, gamutOf, nOn, GAMLABEL, GAMTIP } from '../js/variants-model.js'
import { FK } from '../js/variants-data.js'
import { UI } from '../js/variants-icons.js'

export default function mount({ top, hero, opts }) {
	top.innerHTML = `<header class="top sbtop">
		<span class="sbid"><span data-wb="brand"></span><span data-wb="chip"></span></span>
		<span data-wb="search"></span>
		<span class="sbend"><span data-wb="lang"></span><span data-wb="tools"></span></span>
	</header>`
	hero.innerHTML = `<div data-wb="orient"></div>
	<div class="sbtour"><span class="lab" aria-hidden="true">Start here</span><div data-wb="stops"></div></div>
	<div class="sbstop" data-wb="stop"></div>`
	opts.innerHTML = `<div class="sbf" role="group" aria-label="Filters">
		<button type="button" class="fsel sbfor" popovertarget="sb-for" aria-haspopup="dialog"><span>${FK.for.label}</span><b id="sb-forv">Any</b>${UI.chev}</button>
		<span data-wb="stripe"></span>
	</div>
	<div class="sbpop" id="sb-for" popover role="dialog" aria-labelledby="sb-for-t"><p class="sbpop-t" id="sb-for-t">${FK.for.q}</p><div data-wb="tags"></div></div>
	<div class="sbb" id="sb-bar" popover="manual" role="region" aria-label="Status – what is shown, how it is drawn"><div class="sbin">
		<p class="sbst"><button type="button" class="sbcol" title="Edit the current color"><span class="cdw" aria-hidden="true"></span><span class="sbhex tnum" id="sb-hex"></span></button><span class="gam" id="sb-gam"></span><span data-wb="count"></span><button type="button" class="lnk sbclr" data-wb-reset hidden></button></p>
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
	$('.sbcol').addEventListener('click', edit); document.addEventListener('wb:color', paint)
	const raf = requestAnimationFrame(paint)   // on first load boot() sets the color after this mount, without an event
	// the folded menu's button names what is set: layout · quantize · limit (· vision, when one is on)
	const sum = () => { const q = s => menu.querySelector(s), txt = s => q(s)?.selectedOptions[0]?.text, cv = q('[data-wb-cvd]')
		$('#sb-sum').textContent = [q('[data-set="view"][aria-pressed="true"] .sr')?.textContent, txt('[data-wset="quant"]'), txt('[data-wset="limit"]'), cv && cv.value !== 'none' ? txt('[data-wb-cvd]') : '']
			.filter(Boolean).join(' · ') }
	const MO = new MutationObserver(sum); MO.observe(menu, { childList: true, subtree: true }); menu.addEventListener('change', sum); sum()
	// the bar widened past the fold while the menu was open: the options are inline again
	const RO = new ResizeObserver(() => { if (!more.offsetWidth && menu.matches(':popover-open')) menu.hidePopover() }); RO.observe(bar)
	// what the filters hold, re-read whenever wb.js re-renders them: 'For' names the purposes on, and the
	// status bar says how many filters narrow the catalog – the bench's "n filters ×", one click to clear
	const val = $('#sb-forv'), fb = $('.sbfor'), clr = $('.sbclr'), names = Object.fromEntries(FK.for.opts.map(([v, n]) => [v, n]))
	const forv = () => { const on = [...S.F.for], n = nOn()
		val.textContent = on.length ? names[on[0]] + (on.length > 1 ? ` +${on.length - 1}` : '') : 'Any'; fb.classList.toggle('on', on.length > 0)
		clr.hidden = !n; clr.textContent = `${n} filter${n > 1 ? 's' : ''} ×`; clr.setAttribute('aria-label', `Clear ${n} filter${n > 1 ? 's' : ''}`) }
	const MF = new MutationObserver(forv); for (const h of opts.querySelectorAll('[data-wb="tags"],[data-wb="stripe"]')) MF.observe(h, { childList: true })
	forv()
	return () => { cancelAnimationFrame(raf); MO.disconnect(); MF.disconnect(); RO.disconnect(); document.removeEventListener('wb:color', paint) }
}
