// Atlas hero · Rings – the CHROMA poster (Collège Ahuntsic's graduating show), made a measurement. Off-white paper
// under a hairline grid – the catalog's own columns – with small blocks in its cells: the facts, the promise, a
// legend; the name, huge, at the foot of the label column; at the right, three partial rings that walk the hue
// circle in 24 steps each, open toward the words. Outside, HSL at full saturation and 50 % lightness; inside it,
// CIELAB LCh and OKLCH at the current color's lightness and chroma. One "lightness", three readings: HSL's swings
// from dark blue to bright yellow, the perceptual rings hold theirs all the way round. A diamond – the catalog's
// marker – sits at the current color's hue on each ring: the same color, three hue angles.
import { FACTS, onColor, all } from './hero.js'
import { space } from '../js/core.js'
import { valsOf } from '../js/variants-model.js'

// the rings in their own units: a 200-wide box around the center; hue 0 at the gap's lower lip, counter-clockwise
// (CIELAB's sense), SWEEP of the circle drawn – the rest is the opening toward the text
const N = 24, SWEEP = 300, A0 = 180 + (360 - SWEEP) / 2, BAND = 15, CUT = .8, LIP = 4   // LIP: a label's distance from its ring's end
const RINGS = [{ name: 'HSL', r: 84.5 }, { name: 'CIELAB LCh', r: 66 }, { name: 'OKLCH', r: 47.5 }]   // outside in, centerline radii
const D = Math.PI / 180, ang = h => A0 + h * SWEEP / 360
const at = (r, a) => [r * Math.cos(a * D), -r * Math.sin(a * D)]
const n2 = v => +v.toFixed(2), pc = u => n2((u + 100) / 2) + '%'   // a viewBox coordinate as a share of the box

// one segment: an annular sector between hues i and i+1, its cuts parallel-sided (CUT wide at every radius)
function sector(r, i) { const ro = r + BAND / 2, ri = r - BAND / 2, b0 = ang(i * 360 / N), b1 = ang((i + 1) * 360 / N)
	const off = q => Math.asin(CUT / 2 / q) / D
	const [x0, y0] = at(ro, b0 + off(ro)), [x1, y1] = at(ro, b1 - off(ro)), [x2, y2] = at(ri, b1 - off(ri)), [x3, y3] = at(ri, b0 + off(ri))
	return `M${n2(x0)} ${n2(y0)}A${ro} ${ro} 0 0 0 ${n2(x1)} ${n2(y1)}L${n2(x2)} ${n2(y2)}A${ri} ${ri} 0 0 1 ${n2(x3)} ${n2(y3)}Z` }
// its gradient runs along the chord of the centerline, from hue i to hue i+1
const chord = (r, i) => [...at(r, ang(i * 360 / N)), ...at(r, ang((i + 1) * 360 / N))].map(n2)

// ── color: a hue step as sRGB shows it ──
const enc = u => u <= .0031308 ? 12.92 * u : 1.055 * u ** (1 / 2.4) - .055
const rgbCss = lin => `rgb(${lin.map(u => Math.round(255 * Math.min(1, Math.max(0, enc(u))))).join(' ')})`
const inG = v => v.every(u => u >= -1e-4 && u <= 1 + 1e-4)
// (L, C, h) where sRGB can show it; where it can't, chroma eases off – lightness and hue kept – until it can
// (CSS Color 4's gamut mapping, without its ΔE polish)
function shown(lrgb, L, C, h) { let v = lrgb(L, C, h); if (inG(v)) return v
	let lo = 0, hi = C; v = lrgb(L, 0, h)
	for (let k = 0; k < 14; k++) { const m = (lo + hi) / 2, w = lrgb(L, m, h); if (inG(w)) { lo = m; v = w } else hi = m }
	return v }
const HS = 100, HL = 50   // the outer ring: HSL at full saturation and half lightness – its own idea of one lightness
const HSL = Array.from({ length: N + 1 }, (_, i) => `rgb(${space.hsl.rgb(i * 360 / N, HS, HL).map(Math.round).join(' ')})`)

// what the outer ring proves, read off the data: HSL's one "lightness" as CIELAB measures it, darkest and lightest
const NAMES = { 0: 'red', 60: 'yellow', 120: 'green', 180: 'cyan', 240: 'blue', 300: 'magenta' }
let dark = { L: Infinity }, light = { L: -Infinity }
for (let h = 0; h < 360; h++) { const L = space.rgb.lab(...space.hsl.rgb(h, HS, HL))[0]; if (L < dark.L) dark = { L, h }; if (L > light.L) light = { L, h } }
const hueName = h => NAMES[h] ?? `${h}°`

export default function mount({ hero }) {
	const defs = [], segs = []
	RINGS.forEach((g, j) => { for (let i = 0; i < N; i++) { const [x1, y1, x2, y2] = chord(g.r, i)
		defs.push(`<linearGradient id="hr-${j}-${i}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0"${j ? '' : ` stop-color="${HSL[i]}"`}/><stop offset="1"${j ? '' : ` stop-color="${HSL[i + 1]}"`}/></linearGradient>`)
		segs.push(`<path d="${sector(g.r, i)}" fill="url(#hr-${j}-${i})"/>`) } })
	// each ring's name at its open end, hue 0: right-aligned to the lip, inside the opening
	const labs = RINGS.map(g => { const [x, y] = at(g.r, A0)
		return `<span class="hr-rl" style="right:${n2(100 - (x - LIP + 100) / 2)}%;top:${pc(y)}">${g.name} <b class="hr-h tnum"></b></span>` }).join('')
	hero.innerHTML = `<div class="row hr">
		<div class="hr-grid" aria-hidden="true"><i></i><i class="hr-cols"><i></i><i></i><i></i></i></div><i class="hr-row" aria-hidden="true"></i>
		<div class="hr-side">
			<p class="lab hr-facts"><span class="tnum">${FACTS.count} spaces</span><span class="tnum">${FACTS.families} families</span><span class="tnum">${FACTS.from}–${FACTS.to}</span><span>CC0</span></p>
			<h1 class="hr-type">color-space</h1>
		</div>
		<div class="hr-main">
			<p class="hr-promise">Every color space, one tiny API.</p>
			<figure class="hr-fig" role="img">
				<svg viewBox="-100 -100 200 200" aria-hidden="true"><defs>${defs.join('')}</defs>${segs.join('')}</svg>
				${labs}${'<i class="hr-dm"></i>'.repeat(RINGS.length)}
			</figure>
			<p class="hr-note"><b>One lightness, three readings.</b> HSL's ${HL} % runs from L* ${Math.round(dark.L)} at its ${hueName(dark.h)} to L* ${Math.round(light.L)} at its ${hueName(light.h)}; CIELAB and OKLCH hold the current color's lightness all the way round – chroma eases off only where sRGB ends.</p>
		</div>
	</div>`

	const fig = hero.querySelector('.hr-fig'), stops = [1, 2].map(j => Array.from({ length: N }, (_, i) => hero.querySelector(`#hr-${j}-${i}`).children))
	const dms = [...fig.querySelectorAll('.hr-dm')], hs = [...fig.querySelectorAll('.hr-h')], keys = ['', '']
	// a perceptual ring at (L, C): its 24 hue steps, each mapped into sRGB – only when L or C has moved enough to show
	function ring(j, lrgb, L, C, key) { if (keys[j - 1] === key) return; keys[j - 1] = key
		const col = Array.from({ length: N }, (_, i) => rgbCss(shown(lrgb, L, C, i * 360 / N)))
		stops[j - 1].forEach((st, i) => { st[0].setAttribute('stop-color', col[i]); st[1].setAttribute('stop-color', col[(i + 1) % N]) }) }
	const place = (j, h, on) => { const el = dms[j]; el.hidden = !on; hs[j].textContent = on ? `${Math.round(h) % 360}°` : '–'
		if (!on) return; const [x, y] = at(RINGS[j].r, ang(((h % 360) + 360) % 360)); el.style.left = pc(x); el.style.top = pc(y) }
	let said = ''
	function paint() {
		const [hh, hsat] = valsOf('hsl'), [lL, lC, lH] = valsOf('lchab'), [oL, oC, oH] = valsOf('oklch')
		ring(1, space.lchab.lrgb, lL, lC, `${lL.toFixed(1)} ${lC.toFixed(1)}`)
		ring(2, space.oklch.lrgb, oL, oC, `${oL.toFixed(3)} ${oC.toFixed(3)}`)
		place(0, hh, hsat > .5); place(1, lH, lC > .5); place(2, oH, oC > .002)
		const say = `Three partial hue rings, ${N} steps each. Outside, HSL at saturation ${HS} % and lightness ${HL} %: its steps run from L* ${Math.round(dark.L)} at ${hueName(dark.h)} to L* ${Math.round(light.L)} at ${hueName(light.h)}. Inside, CIELAB LCh at L* ${Math.round(lL)} and C* ${Math.round(lC)}, then OKLCH at L ${oL.toFixed(2)} and C ${oC.toFixed(2)} – the current color's – each at one lightness. ${dms.every(d => d.hidden) ? 'The current color is gray: it has no hue to mark.' : `Diamonds mark the current color's hue: ${RINGS.map((g, j) => `${g.name} ${dms[j].hidden ? 'none' : hs[j].textContent}`).join(', ')}.`}`
		if (say !== said) fig.setAttribute('aria-label', said = say) }
	paint()
	const raf = requestAnimationFrame(paint)   // the first hero mounts before boot() settles the color (a fragment, the still frame) – read it again then
	return all(onColor(paint), () => cancelAnimationFrame(raf))
}
