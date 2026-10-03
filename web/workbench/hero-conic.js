// Atlas hero · Conic – the "Embrace Your Inner Light" poster (four big words staggered on a grid, small meta in its
// cells, a square of fine rays) made a measurement: the square is OKLCH's hue circle at the current color's lightness
// and chroma – the current hue at twelve o'clock, the current color a diamond at the centre – so every hue sits at
// one lightness. The honest comparison is one gesture away: hover or press the square, or pick HSL, and the same
// sweep is drawn in HSL, whose yellows glow and blues sink. The sweeps are CSS conic gradients – OKLCH's from 72
// stops this file maps into sRGB (chroma reduced, lightness kept), HSL's the browser's own `in hsl` – turned by a
// custom property; the rays are a canvas of paper with the lines cut out, drawn once per size and theme.
import { FACTS, onColor, onResize, fit, all } from './hero.js'
import { classify, wheelRGB } from '../js/core.js'
import { valsOf } from '../js/variants-model.js'

const OK = classify('oklch'), N = 72   // stops round the circle, 5° apart
const RAYS = 1440, GAP = 2.6, LINE = .5   // the rays: at most this many · device pixels apart at the edge · the share of that the line takes
// a hue at (L, C) as sRGB shows it: the chroma reduced until the color fits, lightness and hue kept – CSS Color 4's
// gamut mapping (w3.org/TR/css-color-4/#gamut-mapping) without its just-noticeable clip
function fitted(L, C, h) { let rgb = wheelRGB(OK, L, C, h); if (rgb) return rgb
	let a = 0, b = C; for (let n = 0; n < 8; n++) { const m = (a + b) / 2; wheelRGB(OK, L, m, h) ? a = m : b = m }
	return wheelRGB(OK, L, a, h) || [0, 0, 0] }
const stops = (L, C) => { L = Math.min(1, Math.max(0, L)); C = Math.max(0, C)   // a typed oklch() may stray past the axis
	return Array.from({ length: N + 1 }, (_, k) => `rgb(${fitted(L, C, k % N * 360 / N).map(Math.round).join(' ')}) ${k * 360 / N}deg`).join(',') }
const SAY = { oklch: 'OKLCH keeps one lightness all the way round – hover or press the square to compare HSL.',
	hsl: 'HSL’s lightness is not the eye’s: at one L, its yellows glow and its blues sink.' }

export default function mount({ hero }) {
	hero.innerHTML = `<div class="row cn" data-sw="oklch">
		<h1 class="cn-h"><span>Every</span> <span>hue,</span> <span>equally</span> <span>light.</span></h1>
		<figure class="cn-fig">
			<div class="cn-sq" role="img" aria-label="A square of fine rays: the hue circle at the current color’s lightness and chroma, the current hue at the top, the color itself at the centre">
				<i class="cn-sw cn-ok"></i><i class="cn-sw cn-hs"></i><canvas class="cn-rays"></canvas><i class="cn-dm"></i>
			</div>
			<figcaption class="cn-cap">
				<span class="wb-tagrow" role="group" aria-label="Draw the circle in"><button type="button" class="tag" data-cn="oklch" aria-pressed="true">OKLCH</button><button type="button" class="tag" data-cn="hsl" aria-pressed="false">HSL</button></span>
				<span class="cn-say" aria-live="polite">${SAY.oklch}</span>
			</figcaption>
		</figure>
		<p class="lab cn-meta tnum"></p>
		<p class="cn-facts tnum">${FACTS.count} spaces · ${FACTS.from}–${FACTS.to}</p>
	</div>`
	const cn = hero.querySelector('.cn'), sq = cn.querySelector('.cn-sq'), ok = cn.querySelector('.cn-ok'), hs = cn.querySelector('.cn-hs'),
		cv = cn.querySelector('.cn-rays'), meta = cn.querySelector('.cn-meta'), say = cn.querySelector('.cn-say'), tags = [...cn.querySelectorAll('[data-cn]')]
	let pin = 'oklch', peek = false, at = [-1, -1], last = ''
	const shown = () => peek || pin === 'hsl' ? 'hsl' : 'oklch'
	function draw() { const [L, C, H] = valsOf('oklch'), [h, s, l] = valsOf('hsl')
		if (Math.abs(L - at[0]) > .004 || Math.abs(C - at[1]) > .003) { at = [L, C]; ok.style.backgroundImage = `conic-gradient(from calc(var(--a) * -1deg), ${stops(L, C)})` }
		ok.style.setProperty('--a', H)
		hs.style.setProperty('--a', h); hs.style.setProperty('--s', s); hs.style.setProperty('--l', l)
		const t = shown() === 'hsl' ? `HSL · S ${Math.round(s)}% · L ${Math.round(l)}%` : `OKLCH · L ${L.toFixed(2)} · C up to ${Math.max(0, C).toFixed(2)}`
		if (t !== last) meta.textContent = last = t }
	const show = () => { const k = shown(); if (cn.dataset.sw === k) return
		cn.dataset.sw = k; say.textContent = SAY[k]; last = ''; draw() }
	const choose = e => { const b = e.target.closest('[data-cn]'); if (!b) return
		pin = b.dataset.cn; for (const t of tags) t.setAttribute('aria-pressed', t === b); show() }
	// a look, not a choice: the pointer over the square, or a finger on it, shows HSL while it stays
	const on = e => { if (e.type === 'pointerdown' || e.pointerType === 'mouse') { peek = true; show() } }
	const off = e => { if (e.type !== 'pointerup' || e.pointerType !== 'mouse') { peek = false; show() } }
	// the rays: paper over the sweep with the lines cut out – they merge into the sweep itself at the centre. Drawn
	// when the square's size or the paper changes; while a resize runs, the last drawing stretches until it settles
	let key = '', tm = 0
	function rays() { const paper = getComputedStyle(cv).color, b = cv.getBoundingClientRect(), k = `${b.width}×${b.height}@${devicePixelRatio}:${paper}`
		if (k === key || !b.width) return; key = k
		const { x, w, h } = fit(cv), d = devicePixelRatio || 1, cx = w / 2, cy = h / 2, r = Math.hypot(cx, cy), m = Math.min(cx, cy)
		const n = Math.round(Math.min(RAYS, Math.max(RAYS / 8, 2 * Math.PI * m * d / GAP)))   // as many as stay GAP device pixels apart at the edge – no moiré
		x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, w, h); x.fillStyle = paper; x.fillRect(0, 0, w, h)
		x.globalCompositeOperation = 'destination-out'; x.lineWidth = LINE * 2 * Math.PI * m / n
		let q = 7; const jit = () => (q = q * 16807 % 2147483647) / 2147483647 - .5   // a fixed scatter: drawn lines, not a grating
		x.beginPath(); for (let i = 0; i < n; i++) { const a = (i + .6 * jit()) / n * 2 * Math.PI; x.moveTo(cx, cy); x.lineTo(cx + r * Math.sin(a), cy - r * Math.cos(a)) }
		x.stroke(); x.globalCompositeOperation = 'source-over' }
	cn.addEventListener('click', choose)
	for (const [k, f] of [['pointerenter', on], ['pointerdown', on], ['pointerleave', off], ['pointerup', off], ['pointercancel', off]]) sq.addEventListener(k, f)
	const settle = () => { clearTimeout(tm); tm = setTimeout(rays, key ? 150 : 0) }
	document.addEventListener('wb:theme', rays)
	draw(); rays(); const raf = requestAnimationFrame(draw)   // the color the workbench arrives at – boot() sets it after the hero mounts, without a 'wb:color'
	return all(onColor(draw), onResize(sq, settle), () => { cancelAnimationFrame(raf); clearTimeout(tm); document.removeEventListener('wb:theme', rays) })
}
