// Atlas hero · Steps – a spectrum print study made into the argument for the catalog: the same two colors – the
// current one and its opposite hue at the same OKLCH lightness – joined four times, by a straight line or by a
// turn of the hue, in a device space and in a perceptual one. Each path is 21 even steps drawn as the print's
// bars on paper, each bar as tall as it is light (OKLab L); over them, the print's soft top row – the hue turn,
// unbroken. On a wide page it is a chart on the catalog's grid: the space names in the label column, beside the
// family ladder below; the bars where the spaces start – and beside each name, what its bars show, measured.
// Every frame reuses the same nodes: colors, heights and words only.
import { onColor, all } from './hero.js'
import { RGB, disp, LORE, sent } from '../js/variants-model.js'
import { space, hex } from '../js/core.js'

const N = 21, SWEEP = 24   // steps per path; the sweep's guide stops
// sRGB and CIELAB go straight through the middle; HSL and OKLCH turn the hue – a device space and a perceptual one each way
const PATHS = [['rgb', false], ['hsl', true], ['lab', false], ['oklch', true]]
const lerp = (a, b, t) => a + (b - a) * t
const inside = c => c.every(v => v > -.5 && v < 255.5)
const byte = v => v < 0 ? 0 : v > 255 ? 255 : v
const css = c => `rgb(${byte(c[0]).toFixed(1)} ${byte(c[1]).toFixed(1)} ${byte(c[2]).toFixed(1)})`
// the most chroma sRGB holds at this OKLCH lightness and hue, up to C – CSS Color 4's gamut mapping by chroma
// reduction (its bisection, without the ΔE refinement): lightness and hue stay, so the bars' heights stay honest
function shown(L, C, h) { const c = space.oklch.rgb(L, C, h); if (inside(c)) return c
	let lo = 0, hi = C; for (let i = 0; i < 16; i++) { const m = (lo + hi) / 2; inside(space.oklch.rgb(L, m, h)) ? lo = m : hi = m }
	return space.oklch.rgb(L, lo, h) }
const viaOk = c => { if (inside(c)) return c; const o = space.rgb.oklch(...c); return shown(o[0], o[1], o[2]) }

// what a path's bars show, measured on them against the straight line between their ends: lightness (OKLab L) that
// leaves it by LIT – about a pixel of a bar's height – and chroma (OKLab C) that sinks below GRAY on the way (a near
// neutral) or by LIT. A reading flips only past its edge by EDGE, so the live color never makes a note flicker.
// (Across the wheel the sRGB middle loses most of its chroma, HSL moves lightness by up to ~0.28, CIELAB and OKLCH
// by ≤ ~0.01 – so the notes mostly hold; at the sRGB corners, where the opposite hue can't keep the chroma, they change.)
const LIT = .02, GRAY = .04, EDGE = .005
const past = (v, edge, on) => on ? v > edge - EDGE : v > edge + EDGE
function read(Ls, Cs, turns, was) { let up = 0, down = 0, dull = 0, low = Infinity, high = 0
	for (let i = 1; i < N - 1; i++) { const t = i / (N - 1), l = Ls[i] - lerp(Ls[0], Ls[N - 1], t)
		up = Math.max(up, l); down = Math.max(down, -l); dull = Math.max(dull, lerp(Cs[0], Cs[N - 1], t) - Cs[i]); low = Math.min(low, Cs[i]); high = Math.max(high, Cs[i]) }
	const f = { up: past(up, LIT, was.up), down: past(down, LIT, was.down), dull: past(dull, LIT, was.dull), hues: turns && past(high, GRAY, was.hues) }
	f.gray = f.dull && !past(low, GRAY, !was.gray)
	const light = f.up && f.down ? 'swings in lightness' : f.up ? 'lighter midway' : f.down ? 'darker midway' : 'level'
	f.text = f.gray ? `${light}, through gray` : f.hues ? `${light}, through the hues`
		: f.dull ? (light === 'level' ? 'level, duller midway' : `${light.replace(' midway', '')} and duller midway`) : light
	return f }

/** The pair and its four paths, as sRGB triples: A the color on screen, B its opposite OKLCH hue at A's lightness. */
function paths() {
	const A = RGB.slice(), [L, C, h] = space.rgb.oklch(...A), B = shown(L, C, (h + 180) % 360).map(byte)
	const hA = space.rgb.hsl(...A), hB = space.rgb.hsl(...B), oB = space.rgb.oklch(...B), lA = space.rgb.lab(...A), lB = space.rgb.lab(...B)
	const dh = ((hB[0] - hA[0] + 540) % 360) - 180, turn = dh < 0 ? -180 : 180   // HSL its own shorter way; OKLCH turns the same way round
	const ok = t => shown(lerp(L, oB[0], t), lerp(C, oB[1], t), (h + turn * t + 360) % 360)
	const at = {
		rgb: t => A.map((a, k) => lerp(a, B[k], t)),
		hsl: t => space.hsl.rgb((hA[0] + dh * t + 360) % 360, lerp(hA[1], hB[1], t), lerp(hA[2], hB[2], t)),
		lab: t => viaOk(space.lab.rgb(...lA.map((a, k) => lerp(a, lB[k], t)))),
		oklch: ok }
	return { A, B, at, ok } }

export default function mount({ hero, wb }) {
	const bars = Array.from({ length: N }, () => '<i></i>').join('')
	hero.innerHTML = `<div class="row hst">
		<span class="lab" aria-hidden="true"></span>
		<h1 class="hst-h"><span>Same two colors.</span> <span>Four paths between them.</span></h1>
	</div>
	<figure class="hst-fig">
		<div class="row hst-row hst-top">
			<p class="lab hst-key"><i class="hst-sw"></i><code></code><span aria-hidden="true">→</span><i class="hst-sw"></i><code></code></p>
			<div class="hst-sweep" role="img" aria-label="The hue turning from the current color to its opposite in OKLCH, unbroken"></div>
		</div>
		${PATHS.map(([s, turns]) => `<div class="row hst-row" data-s="${s}">
			<p class="lab hst-n"><button type="button" class="nm" data-open-s="${s}" title="${wb.esc(sent(LORE[s]?.for))}" aria-label="Open ${wb.esc(disp(s))} details">${wb.esc(disp(s))}</button><span></span></p>
			<div class="hst-bars" role="img" aria-label="${wb.esc(disp(s))}: ${N} steps ${turns ? 'turning the hue' : 'straight across'} from the current color to its opposite">${bars}</div>
		</div>`).join('')}
		<figcaption class="row"><span class="lab" aria-hidden="true"></span><p class="hst-cap">${N} even steps a row, to the opposite hue at the same OKLCH lightness (h + 180°). Bars stand as tall as they are light; white would touch the hairline.</p></figcaption>
	</figure>`
	const rows = [...hero.querySelectorAll('.hst-row[data-s]')].map((r, k) => ({ s: r.dataset.s, turns: PATHS[k][1], els: [...r.querySelectorAll('.hst-bars i')], note: r.querySelector('.hst-n>span'), was: {} }))
	const Ls = new Array(N), Cs = new Array(N)
	const sweep = hero.querySelector('.hst-sweep'), sw = [...hero.querySelectorAll('.hst-sw')], code = [...hero.querySelectorAll('.hst-key code')]
	// one frame: 84 bars, four readings and a gradient – colors, heights and words set on the same nodes
	function paint() { const { A, B, at, ok } = paths()
		for (const r of rows) { const f = at[r.s]
			for (let i = 0; i < N; i++) { const c = f(i / (N - 1)), st = r.els[i].style, o = space.rgb.oklab(...c.map(byte))
				Ls[i] = Math.max(0, o[0]); Cs[i] = Math.hypot(o[1], o[2])
				st.background = css(c); st.transform = `scaleY(${Ls[i].toFixed(4)})` }
			r.was = read(Ls, Cs, r.turns, r.was); if (r.note.textContent !== r.was.text) r.note.textContent = r.was.text }
		const stops = []; for (let i = 0; i <= SWEEP; i++) stops.push(`${css(ok(i / SWEEP))} ${(i / SWEEP * 100).toFixed(2)}%`)
		sweep.style.background = `linear-gradient(90deg, ${stops.join(',')})`
		sw[0].style.background = css(A); sw[1].style.background = css(B)
		code[0].textContent = hex(A); code[1].textContent = hex(B) }
	paint()
	const raf = requestAnimationFrame(paint)   // the first hero mounts before boot() settles the color (a fragment, the still frame) – read it again then
	return all(onColor(paint), () => cancelAnimationFrame(raf))
}
