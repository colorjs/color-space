// Atlas hero · Search – the owner's pick (2026-10-04, polished 10-05): the promise, then one quiet field. Type a color or
// a space (or pick one, take one off the screen, drop an image anywhere) and the page answers by moving into the atlas:
// the color floods out from the field, becomes the current one – the masthead fills with it, every space below
// writes it – and the atlas slides up over the hero, which stays pinned beneath it; words filter the catalog, the
// masthead's search carrying them on. Behind the field, the burst – a study: the real hue × chroma slice of OKLCH at
// the current color's lightness, turned so its hue points up, the color a rhombus on it; or rays of every hue.
import { FACTS, onColor, all } from './hero.js'
import { parseColor, valsOf, finds, rgbF } from '../js/variants-model.js'
import { UI, OI } from '../js/variants-icons.js'
import { esc } from '../js/variants-catalog.js'
import { swatches } from './wb.js'
import { clear as clearImage } from './image.js'

// what the library is – read off the data and the package: the index page's trust list
const FACTROW = [[OI.chromaticity, `${FACTS.count} color spaces`, `${FACTS.from} to ${FACTS.to}`],
	[UI.shield, 'Reference-tested', 'every space test-pinned'],
	[UI.swap, 'Both ways', 'any space to any other'],
	[UI.pkg, 'Tiny', '0.4–1.5 kB a space'],
	['<span class="pdm" aria-hidden="true">©</span>', 'Public domain', 'CC0']]
const hex = c => '#' + rgbF(c.s, c.vals).map(x => Math.round(x).toString(16).padStart(2, '0')).join('')
const CMAX = .32   // the burst's rim: OKLCH chroma 0.32, past every sRGB color

// the slice: OKLab → linear sRGB (Ottosson's matrices), kept only where sRGB holds it – the shape IS the gamut at
// this lightness. Hue 0 points up; the canvas turns with the current hue (CSS, free), so it redraws only when the
// lightness moves – coarse, and softened by the stylesheet
const lin = x => x <= .0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - .055
function slice(cv, L) { const N = cv.width, c = cv.getContext('2d'), im = c.createImageData(N, N), d = im.data, h = N / 2
	for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const dx = x + .5 - h, dy = y + .5 - h, r = Math.hypot(dx, dy) / h; if (r > 1) continue
		const C = r * CMAX, t = Math.atan2(dx, -dy), a = C * Math.cos(t), b = C * Math.sin(t)
		const l = (L + .3963377774 * a + .2158037573 * b) ** 3, m = (L - .1055613458 * a - .0638541728 * b) ** 3, s = (L - .0894841775 * a - 1.291485548 * b) ** 3
		const R = 4.0767416621 * l - 3.3077115913 * m + .2309699292 * s, G = -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s, B = -.0041960863 * l - .7034186147 * m + 1.707614701 * s
		if (R < -1e-4 || G < -1e-4 || B < -1e-4 || R > 1.0001 || G > 1.0001 || B > 1.0001) continue
		const k = (y * N + x) * 4; d[k] = lin(R) * 255; d[k + 1] = lin(G) * 255; d[k + 2] = lin(B) * 255; d[k + 3] = 255 }
	c.putImageData(im, 0, 0) }

export default function mount({ hero, wb }) {
	hero.innerHTML = `<div class="hs">
		<div class="hs-main">
			<h1 class="hs-h">Every color space.</h1>
			<p class="hs-sub">${FACTS.count} ways to write a color down, from ${FACTS.from} to ${FACTS.to} – converted both ways, each one tested against its source. Pick a color, and every one of them writes it.</p>
			<form class="hs-q" role="search" aria-label="A color or a space">
				<figure class="hs-burst" aria-hidden="true"><canvas width="192" height="192"></canvas><i class="hs-mk"></i></figure>
				<label class="hs-sw" title="Pick a color"><input type="color" aria-label="Pick a color"></label>
				<input class="hs-in" type="search" autocomplete="off" spellcheck="false" enterkeyhint="go" placeholder="Any color or space" aria-label="A color or a space" aria-describedby="hs-hint">
				<button class="hs-drop" type="button" title="Take a color off the screen" aria-label="Take a color off the screen" hidden>${UI.pipette}</button>
			</form>
			<p class="hs-hint" id="hs-hint" aria-live="polite"></p>
			<p class="hs-try"></p>
		</div>
		<ul class="hs-facts">${FACTROW.map(([ic, b, t]) => `<li>${ic}<span><b>${b}</b>${t}</span></li>`).join('')}</ul>
		<p class="hs-cap" aria-hidden="true"></p>
	</div>`
	const form = hero.querySelector('.hs-q'), q = form.querySelector('.hs-in'), sw = form.querySelector('.hs-sw'), pick = sw.querySelector('input'), drop = form.querySelector('.hs-drop')
	const hint = hero.querySelector('.hs-hint'), tryRow = hero.querySelector('.hs-try'), cv = form.querySelector('canvas'), cap = hero.querySelector('.hs-cap')
	const mq = () => document.getElementById('q')   // the masthead's search – looked up when used: boot() renders the masthead again after a hero mounts
	let image = null
	// what the field holds: a color, or the words of a search – and how many spaces those words find
	const read = t => { t = t.trim(); if (!t) return null; let c = null; try { c = parseColor(t) } catch {} return c ? { c } : { n: finds(t).length } }
	const say = () => { const r = read(q.value)
		hint.innerHTML = !r ? (image ? `<img src="${esc(image)}" alt=""> Every strip reads this image · <button type="button" data-hs-clear>Clear</button>` : 'or drop an image anywhere')
			: r.c ? '↵ makes it the current color' : r.n ? `↵ shows ${r.n === 1 ? 'the space' : `${r.n} spaces`} it names` : 'No color, and no space by that name'
		r?.c ? sw.style.setProperty('--sw', hex(r.c)) : sw.style.removeProperty('--sw') }   // the swatch shows a color before it is taken
	// the swatches under the field: the colors picked before this one, else five to try
	let tk = ''
	const offer = () => { const { recent, list } = swatches(), k = recent + list.map(x => x[0]).join(); if (k === tk) return; tk = k
		tryRow.innerHTML = `<span>${recent ? 'Recent' : 'Try'}</span>${list.map(([v, n, p]) => `<button type="button" data-hs="${esc(v)}"><i class="wdot" style="--w:${esc(p)}"></i>${esc(n)}</button>`).join('')}` }
	// into the atlas: the color floods out from the field, then the page moves to where the atlas starts – the cells
	// under the masthead – and the atlas slides up over the pinned hero
	const go = (flood = false) => { const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--top-h')) || 0
		const at = document.getElementById('cat').getBoundingClientRect().top + scrollY - (document.querySelector('.dcells')?.offsetHeight || 0) - top
		const calm = matchMedia('(prefers-reduced-motion: reduce)').matches
		if (flood && !calm) { hero.classList.add('hs-go'); setTimeout(() => hero.classList.remove('hs-go'), 1400) }
		setTimeout(() => scrollTo({ top: at, behavior: calm ? 'instant' : 'smooth' }), flood && !calm ? 260 : 0) }
	const take = t => { const r = read(t); if (!r) return
		if (r.c) { wb.color(r.c.s, r.c.vals); q.value = ''; say(); go(true) }
		else if (r.n && mq()) { const m = mq(); m.value = t.trim(); m.dispatchEvent(new Event('input', { bubbles: true })); go() } }   // the masthead's search takes the words: one search, two places
	form.addEventListener('submit', e => { e.preventDefault(); take(q.value) })
	q.addEventListener('input', say)
	tryRow.addEventListener('click', e => { const b = e.target.closest('[data-hs]'); if (b) take(b.dataset.hs) })
	hint.addEventListener('click', e => { if (e.target.closest('[data-hs-clear]')) clearImage() })
	pick.addEventListener('input', () => { const h = pick.value; wb.color('rgb', [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))) })   // the masthead picker's way
	pick.addEventListener('change', () => go(true))
	if ('EyeDropper' in window) { drop.hidden = false; drop.addEventListener('click', () => new window.EyeDropper().open().then(r => take(r.sRGBHex), () => {})) }
	const pic = e => { image = e.detail.src; say() }
	document.addEventListener('wb:image', pic)
	// the masthead's search, cleared or changed down in the atlas, is the field's too
	const mirror = e => { if (e.target.id === 'q' && document.activeElement !== q && !read(q.value)?.c) { q.value = e.target.value; say() } }
	document.addEventListener('input', mirror)
	if (mq()?.value) q.value = mq().value
	// '/' finds the field while the hero is the page – the masthead's search takes over once the atlas covers it
	const key = e => { if (e.key === '/' && scrollY < innerHeight * .4 && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) { e.preventDefault(); e.stopImmediatePropagation(); q.focus() } }
	document.addEventListener('keydown', key, true)
	// the burst follows the color: the hue turns it (a registered number eases the turn, unwrapped so it always goes
	// the short way round), the chroma places the rhombus, the lightness redraws the slice – at most a few times a second
	let h0 = null, L0 = null, drawT = 0
	const paint = () => { const [L, C, h] = valsOf('oklch')
		if (isFinite(h) && C > 1e-3) { h0 = h0 === null ? h : h0 + ((h - h0) % 360 + 540) % 360 - 180; hero.style.setProperty('--hs-h', h0.toFixed(2)) }
		hero.style.setProperty('--hs-r', Math.min(1, C / CMAX).toFixed(4))
		const l = Math.round(L * 50) / 50
		if (l !== L0 && !drawT) drawT = setTimeout(() => { drawT = 0; L0 = Math.round(valsOf('oklch')[0] * 50) / 50; slice(cv, L0); cap.textContent = `OKLCH at L ${L0.toFixed(2)} – hue around, chroma outward to the edge of sRGB; the rhombus is your color` }, L0 === null ? 0 : 180)
		offer() }
	paint(); say()
	return all(onColor(paint), () => { clearTimeout(drawT); document.removeEventListener('keydown', key, true); document.removeEventListener('input', mirror); document.removeEventListener('wb:image', pic) })
}
