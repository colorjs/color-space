// Atlas hero · Spectrum – the "Palette Perfect" cover (Promopress) made a measurement: two soft fields with a paper
// band between them. Above, OKLCH's hue × lightness plane at the current color's chroma; below, HSL's at its
// saturation – the band sits between two color spaces' pictures of the same hues, and HSL's uneven brightness shows
// (each OKLCH row is one lightness; an HSL row's yellows glow while its blues sink). Hue runs left to right from the
// current color's own, which stands where the spaces start – a diamond in each field, under the masthead's. The band
// is the message: the brand in the label column; the promise, the scope and the proof in the content column.
// Each field is a tiny canvas the browser stretches (the upscale is the soft focus), holding three hue periods: a
// hue change only slides it (a custom property), a chroma or saturation change repaints its few samples.
import { FACTS, onColor, all } from './hero.js'
import { space, classify, wheelRGB } from '../js/core.js'
import { valsOf } from '../js/variants-model.js'

const P = 48, R = 16            // samples: one hue period (7.5° apart) × the lightness rows
const HI = .9, LO = .4          // the lightness window, top to bottom – each space's own lightness, 0–1
const OK = classify('oklch')
const hue = i => (i + .5) / P * 360, lit = j => HI - (HI - LO) * j / (R - 1)
// where a lightness sits in a field: its row's centre, stretched (0 top – 1 bottom), held inside the field
const yOf = L => Math.min(1, Math.max(0, ((HI - L) / (HI - LO) * (R - 1) + .5) / R))

// the most chroma sRGB holds at each sample's hue and lightness (CSS Color 4 gamut mapping: OKLCH chroma reduced,
// lightness and hue kept) – the same for every color, so once a page
let CM = null
const cmax = () => CM ||= (() => { const t = new Float32Array(P * R)
	for (let j = 0; j < R; j++) for (let i = 0; i < P; i++) { let a = 0, b = .33   // sRGB's chroma peaks near 0.32 (magenta)
		for (let n = 0; n < 8; n++) { const m = (a + b) / 2; wheelRGB(OK, lit(j), m, hue(i)) ? a = m : b = m }
		t[j * P + i] = a }
	return t })()

const field = (k, label) => `<figure class="sp-f sp-${k}"><canvas width="${3 * P}" height="${R}" role="img" aria-label="${label}"></canvas><i class="sp-dm" aria-hidden="true"></i><figcaption class="tag sp-cap tnum"></figcaption></figure>`

export default function mount({ hero }) {
	hero.innerHTML = `<div class="sp">
		${field('ok', 'OKLCH: every hue, from light to dark, at the current color’s chroma – each row one lightness')}
		<div class="row sp-band">
			<p class="lab sp-brand">color-space</p>
			<div class="sp-cols">
				<h1 class="sp-h">Every color space, one tiny API.</h1>
				<p class="tnum">${FACTS.count} spaces from ${FACTS.from} to ${FACTS.to} – for screens, film, print and science.</p>
				<p>Each converts both ways, and each is tested against a reference.</p>
			</div>
		</div>
		${field('hs', 'HSL: the same hues, from light to dark, at the current color’s saturation – its rows are not one lightness')}
	</div>`
	const fig = k => { const el = hero.querySelector('.sp-' + k), cv = el.querySelector('canvas'), x = cv.getContext('2d'), img = x.createImageData(P, R)
		img.data.fill(255); return { el, x, img, cap: el.querySelector('.sp-cap'), at: -1, t: '' } }
	const ok = fig('ok'), hs = fig('hs')
	// one period of samples, laid three times across the canvas – the slide never runs off it
	const put = f => { for (let n = 0; n < 3; n++) f.x.putImageData(f.img, n * P, 0) }
	const paint = (f, rgb) => { const d = f.img.data
		for (let j = 0; j < R; j++) for (let i = 0; i < P; i++) { const c = rgb(i, j), o = 4 * (j * P + i); d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2] }   // the array clamps and rounds
		put(f) }
	const say = (f, t) => { if (t !== f.t) f.cap.textContent = f.t = t }
	function draw() { const [L, C, H] = valsOf('oklch'), [h, s, l] = valsOf('hsl')
		if (Math.abs(C - ok.at) > .003) { const cm = cmax(); ok.at = C; paint(ok, (i, j) => space.oklch.rgb(lit(j), Math.min(C, cm[j * P + i]), hue(i))) }
		if (Math.abs(s - hs.at) > .8) { hs.at = s; paint(hs, (i, j) => space.hsl.rgb(hue(i), s, lit(j) * 100)) }
		ok.el.style.setProperty('--hf', H / 360); ok.el.style.setProperty('--y', yOf(L))
		hs.el.style.setProperty('--hf', h / 360); hs.el.style.setProperty('--y', yOf(l / 100))
		say(ok, `OKLCH · hue × lightness · C up to ${Math.max(0, C).toFixed(2)}`)
		say(hs, `HSL · hue × lightness · S ${Math.round(s)}%`) }
	// the first frame draws the color the workbench arrives at (boot() sets it after the hero mounts, without a
	// 'wb:color' – the orbit's first step, a hash color, reduced motion's still frame)
	draw(); const raf = requestAnimationFrame(draw)
	return all(onColor(draw), () => cancelAnimationFrame(raf))
}
