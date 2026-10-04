// Atlas hero · Search – the owner's reference (2026-10-04): a landing around one field. Type a color or a space and
// the page answers by moving into the atlas: a color becomes the current one – the masthead fills with it, every
// space below writes it – and words filter the catalog, the masthead's search carrying them on. Behind the field, a
// burst of every hue at the current color's lightness and chroma, turned so the current hue points up; it turns as
// the color changes (hero-search.css). While the field is on screen it is the page's one search: the masthead's
// search and swatches step aside until the field has gone under the masthead.
import { FACTS, onColor, all } from './hero.js'
import { parseColor, valsOf, finds, rgbF } from '../js/variants-model.js'
import { TRY } from '../js/variants-bars.js'
import { UI, OI } from '../js/variants-icons.js'
import { esc } from '../js/variants-catalog.js'

// what the library is – read off the data and the package, the index page's trust list in the reference's row
const FACTROW = [[OI.chromaticity, `${FACTS.count} color spaces`, `${FACTS.from} to ${FACTS.to}`],
	[UI.shield, 'Reference-tested', 'every space test-pinned'],
	[UI.swap, 'Both ways', 'any space to any other'],
	[UI.pkg, 'Tiny', '0.4–1.5 kB a space, no dependencies'],
	['<span class="pdm" aria-hidden="true">©</span>', 'Public domain', 'CC0 – use it anywhere']]
const hex = c => '#' + rgbF(c.s, c.vals).map(x => Math.round(x).toString(16).padStart(2, '0')).join('')

export default function mount({ hero, wb }) {
	hero.innerHTML = `<div class="hs">
		<div class="hs-main">
			<p class="hs-eye">${FACTS.count} color spaces · ${FACTS.from}–${FACTS.to}</p>
			<h1 class="hs-h">Explore every<br>color space.</h1>
			<p class="hs-sub">Type a color to see it written in every space below, or a space's name to find it.</p>
			<form class="hs-q" role="search" aria-label="A color or a space">
				<label class="cdw hs-sw" title="Pick a color"><input type="color" aria-label="Pick a color"></label>
				<span class="hs-ic" aria-hidden="true">${UI.search}</span>
				<input class="hs-in" type="search" autocomplete="off" spellcheck="false" enterkeyhint="go" placeholder="A color or a space – #ff8000, oklch(0.7 0.15 30), Display P3" aria-label="A color or a space" aria-describedby="hs-hint">
				<button class="hs-drop" type="button" title="Take a color from the screen" aria-label="Take a color from the screen" hidden>${UI.pipette}</button>
			</form>
			<p class="hs-hint" id="hs-hint" aria-live="polite"></p>
			<p class="hs-try"><span>Try</span>${TRY.map(([c, n]) => `<button type="button" class="chip" data-hs="${esc(c)}"><i class="wdot" style="--w:${esc(c)}"></i>${esc(n)}</button>`).join('')}</p>
		</div>
		<ul class="hs-facts">${FACTROW.map(([ic, b, t]) => `<li>${ic}<span><b>${b}</b>${t}</span></li>`).join('')}</ul>
	</div>`
	const form = hero.querySelector('.hs-q'), q = form.querySelector('.hs-in'), sw = form.querySelector('.hs-sw'), pick = sw.querySelector('input'), hint = hero.querySelector('.hs-hint'), drop = form.querySelector('.hs-drop')
	const mq = () => document.getElementById('q')   // the masthead's search – looked up when used: boot() renders the masthead again after a hero mounts
	// what the field holds: a color, or the words of a search – and how many spaces those words find
	const read = t => { t = t.trim(); if (!t) return null; let c = null; try { c = parseColor(t) } catch {} return c ? { c } : { n: finds(t).length } }
	const say = () => { const r = read(q.value)
		hint.textContent = !r ? '' : r.c ? '↵ makes it the current color' : r.n ? `↵ shows ${r.n === 1 ? 'the space' : `${r.n} spaces`} it names` : 'No color, and no space by that name'
		r?.c ? sw.style.setProperty('--sw', hex(r.c)) : sw.style.removeProperty('--sw') }   // the swatch shows a color before it is taken
	// into the atlas: the page moves to where the hero ends – the cells under the masthead, the catalog under them
	const go = () => { const at = hero.getBoundingClientRect().bottom + scrollY - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--top-h')) || 0)
		scrollTo({ top: at, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }) }
	const take = t => { const r = read(t); if (!r) return
		if (r.c) { wb.color(r.c.s, r.c.vals); q.value = ''; say(); go() }
		else if (r.n && mq()) { const m = mq(); m.value = t.trim(); m.dispatchEvent(new Event('input', { bubbles: true })); go() } }   // the masthead's search takes the words: one search, two places
	form.addEventListener('submit', e => { e.preventDefault(); take(q.value) })
	q.addEventListener('input', say)
	hero.querySelector('.hs-try').addEventListener('click', e => { const b = e.target.closest('[data-hs]'); if (b) take(b.dataset.hs) })
	pick.addEventListener('input', () => { const h = pick.value; wb.color('rgb', [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))) })   // the masthead picker's way
	pick.addEventListener('change', go)
	if ('EyeDropper' in window) { drop.hidden = false; drop.addEventListener('click', () => new window.EyeDropper().open().then(r => take(r.sRGBHex), () => {})) }
	// the masthead's search, cleared or changed down in the atlas, is the field's too
	const mirror = e => { if (e.target.id === 'q' && document.activeElement !== q && !read(q.value)?.c) { q.value = e.target.value; say() } }
	document.addEventListener('input', mirror)
	if (mq()?.value) { q.value = mq().value; say() }
	// '/' finds the field while it is on screen – the masthead's search waits under the masthead
	let seen = true
	const io = new IntersectionObserver(es => { seen = es.at(-1).isIntersecting }); io.observe(q)
	const key = e => { if (e.key === '/' && seen && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) { e.preventDefault(); e.stopImmediatePropagation(); q.focus() } }
	document.addEventListener('keydown', key, true)
	// the burst turns with the hue: a registered number (hero-search.css) eases to the new angle, unwrapped so it
	// always turns the short way round
	let h0 = null
	const turn = () => { const h = valsOf('oklch')[2]; if (!isFinite(h)) return
		h0 = h0 === null ? h : h0 + ((h - h0) % 360 + 540) % 360 - 180; hero.style.setProperty('--hs-h', h0.toFixed(2)) }
	turn()
	return all(onColor(turn), () => { io.disconnect(); document.removeEventListener('keydown', key, true); document.removeEventListener('input', mirror) })
}
