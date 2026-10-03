// Atlas hero · Locus – the CIE 1931 chromaticity diagram as the promise: every color the eye can see, and the
// catalog's count as the ways to name a point in it. The horseshoe is filled with its own chromaticities (each
// point at its brightest – the max channel at 1, then sRGB's curve; what sRGB can't show clips to its edge),
// drawn once per size into a canvas. Over it, in hairlines: the sRGB, Display P3 and Rec. 2020 triangles
// (data.gamuts), the wavelengths along the curve, light axes, the D65 white. The current color rides it as the
// catalog's diamond – one positioned element, moved on every change; nothing else repaints. Each triangle's
// share of the diagram is its area over the locus's, both by the shoelace formula, in the xy plane – that is the
// diagram's area, not a share of all colors.
import { FACTS, onColor, onResize, all } from './hero.js'
import { locus, data, space } from '../js/core.js'
import { valsOf } from '../js/variants-model.js'

// the plot: x 0–0.8, y 0–0.9, with a margin below and left of the axes' zero for the labels that hang outside the
// curve (the 460–510 nm side runs within a hair of x = 0) – the axes are offset from the data, Tufte's range frame
const X0 = -.1, X1 = .8, Y0 = -.075, Y1 = .9, W = X1 - X0, H = Y1 - Y0
const px = x => +((x - X0) / W * 100).toFixed(3), py = y => +((Y1 - y) / H * 100).toFixed(3)   // % of the plot box
const vx = x => +((x - X0) * 1000).toFixed(1), vy = y => +((Y1 - y) * 1000).toFixed(1)           // the SVG's units

const LOC = locus(), xyOf = nm => { const [X, Y, Z] = space.wavelength.xyz(nm), s = X + Y + Z; return [X / s, Y / s] }
// the curve's range as core.js samples it (380–700 nm), said only if its ends are those wavelengths' chromaticities
const near = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-9
const RANGE = near(xyOf(380), LOC[0]) && near(xyOf(700), LOC.at(-1)) ? [380, 700] : null
// the white the three gamuts share (data.gamuts[…].white), as the 2° observer's chromaticity (data.whitepoints)
const WP = data.gamuts.srgb.white, WHITE = (([X, Y, Z]) => [X / (X + Y + Z), Y / (X + Y + Z)])(data.whitepoints[2][WP])
const shoelace = P => Math.abs(P.reduce((a, p, i) => { const q = P[(i + 1) % P.length]; return a + p[0] * q[1] - q[0] * p[1] }, 0)) / 2
const AREA = shoelace(LOC)
const GAMUTS = [['srgb', 'sRGB'], ['display-p3', 'Display P3'], ['rec2020', 'Rec. 2020']].map(([k, name], i) => {
	const { r, g, b } = data.gamuts[k].primaries; return { k, name, tri: [r, g, b], share: shoelace([r, g, b]) / AREA, i } })
const pct = v => `${(v * 100).toFixed(1)} %`

// along the curve: a tick every 10 nm, a number where there's room; each points away from the white
const TICKS = [], LABELS = new Set([460, 470, 480, 490, 500, 510, 520, 540, 560, 580, 600, 620])
for (let nm = 460; nm <= 620; nm += 10) { const [x, y] = xyOf(nm), a = xyOf(nm - 5), b = xyOf(nm + 5)
	let nx = b[1] - a[1], ny = a[0] - b[0]; const l = Math.hypot(nx, ny); nx /= l; ny /= l
	if (nx * (x - WHITE[0]) + ny * (y - WHITE[1]) < 0) { nx = -nx; ny = -ny }
	TICKS.push({ nm, x, y, nx, ny }) }
const T = .014   // a tick's length, in xy
const APEX = TICKS.reduce((a, t) => t.y > a.y ? t : a).nm   // the curve's top carries the unit

// the fill: sRGB's matrix read off the library (XYZ → linear sRGB is linear, so three probes give it) and its
// transfer curve as a table – a few hundred thousand points per size, no conversion calls inside the loop
const M = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map(e => space.xyz.lrgb(...e))   // columns
const ENC = new Uint8ClampedArray(4096).map((_, i) => { const u = i / 4095; return Math.round(255 * (u <= .0031308 ? 12.92 * u : 1.055 * u ** (1 / 2.4) - .055)) })
function fill(cv) { const r = cv.getBoundingClientRect(); if (!r.width) return
	const k = Math.min(devicePixelRatio || 1, 2), s = Math.min(k, Math.sqrt(1.2e6 / (r.width * r.height)))   // 2× at most, ~1.2 MP at most
	const w = Math.max(1, Math.round(r.width * s)), h = Math.max(1, Math.round(r.height * s))
	if (cv.width === w && cv.height === h) return
	cv.width = w; cv.height = h
	const x = cv.getContext('2d'), img = x.createImageData(w, h), d = img.data
	for (let j = 0; j < h; j++) { const yy = Y1 - (j + .5) / h * H; if (yy <= 0) continue
		for (let i = 0; i < w; i++) { const xx = X0 + (i + .5) / w * W; if (xx <= 0 || xx + yy >= 1) continue
			const X = xx / yy, Z = (1 - xx - yy) / yy   // Y = 1
			let R = M[0][0] * X + M[1][0] + M[2][0] * Z, G = M[0][1] * X + M[1][1] + M[2][1] * Z, B = M[0][2] * X + M[1][2] + M[2][2] * Z
			const m = Math.max(R, G, B); if (!(m > 0)) continue
			R = R > 0 ? R / m : 0; G = G > 0 ? G / m : 0; B = B > 0 ? B / m : 0
			const o = (j * w + i) * 4; d[o] = ENC[R * 4095 | 0]; d[o + 1] = ENC[G * 4095 | 0]; d[o + 2] = ENC[B * 4095 | 0]; d[o + 3] = 255 } }
	x.putImageData(img, 0, 0)
	// keep only the inside of the curve, closed by the line of purples – the path's own antialiased edge
	x.globalCompositeOperation = 'destination-in'; x.beginPath()
	LOC.forEach(([lx, ly], i) => x[i ? 'lineTo' : 'moveTo']((lx - X0) / W * w, (Y1 - ly) / H * h)); x.closePath(); x.fill()
	x.globalCompositeOperation = 'source-over' }

export default function mount({ hero }) {
	const curve = LOC.map(([x, y]) => `${vx(x)},${vy(y)}`).join(' ')
	const tri = g => g.tri.map(([x, y]) => `${vx(x)},${vy(y)}`).join(' ')
	const ticks = TICKS.map(t => `M${vx(t.x)} ${vy(t.y)}L${vx(t.x + t.nx * T)} ${vy(t.y + t.ny * T)}`).join('')
	const AX = [0, .2, .4, .6, .8]   // a few ticks, both axes
	const axes = `M${vx(0)} ${vy(Y0)}H${vx(X1)}M${vx(X0)} ${vy(0)}V${vy(Y1)}` + AX.map(v => `M${vx(v)} ${vy(Y0)}v-12M${vx(X0)} ${vy(v)}h12`).join('')
	hero.innerHTML = `<div class="row hl">
		<p class="lab hl-facts"><span class="tnum">${FACTS.count} spaces</span><span class="tnum">${FACTS.families} families</span><span class="tnum">${FACTS.from}–${FACTS.to}</span><span>CC0</span></p>
		<h1 class="hl-h">Every color the eye can see.</h1>
		<p class="hl-sub"><span class="tnum">${FACTS.count}</span> ways to name a point in it.</p>
		<figure class="hl-fig" role="img" aria-label="The CIE 1931 xy chromaticity diagram: the spectral locus${RANGE ? ` from ${RANGE[0]} to ${RANGE[1]} nm` : ''}, closed by the line of purples and filled with its chromaticities; the sRGB, Display P3 and Rec. 2020 gamut triangles inside it, covering ${GAMUTS.map(g => `${pct(g.share)} (${g.name})`).join(', ')} of its area; wavelengths marked from ${TICKS[0].nm} to ${TICKS.at(-1).nm} nm; the ${WP} white point; and a diamond at the current color's chromaticity.">
			<div class="hl-plot" style="aspect-ratio:${+(W * 1000).toFixed(1)} / ${+(H * 1000).toFixed(1)}">
				<canvas aria-hidden="true"></canvas>
				<svg viewBox="0 0 ${+(W * 1000).toFixed(1)} ${+(H * 1000).toFixed(1)}" preserveAspectRatio="none" aria-hidden="true">
					<path class="hl-ax" d="${axes}"/>
					<polygon class="hl-loc" points="${curve}"/>
					<path class="hl-tk" d="${ticks}"/>
					${GAMUTS.map(g => `<polygon class="hl-g${g.i}" points="${tri(g)}"/>`).join('')}
					<path class="hl-wp" d="M${vx(WHITE[0]) - 10} ${vy(WHITE[1])}h20M${vx(WHITE[0])} ${vy(WHITE[1]) - 10}v20"/>
				</svg>
				${TICKS.filter(t => LABELS.has(t.nm)).map(t => `<span class="hl-nm tnum" style="left:${px(t.x + t.nx * T)}%;top:${py(t.y + t.ny * T)}%;--nx:${t.nx.toFixed(3)};--ny:${(-t.ny).toFixed(3)}">${t.nm}${t.nm === APEX ? ' nm' : ''}</span>`).join('')}
				${AX.map(v => `<span class="hl-ti hl-tx tnum" style="left:${px(v)}%">${v || 0}</span><span class="hl-ti hl-ty tnum" style="top:${py(v)}%">${v || 0}</span>`).join('')}
				<span class="hl-an hl-ax-x" style="left:${px(X1)}%">x</span><span class="hl-an hl-ax-y" style="top:${py(Y1)}%">y</span>
				<span class="hl-wl" style="left:${px(WHITE[0])}%;top:${py(WHITE[1])}%">${WP}</span>
				<i class="hl-dm" hidden></i>
			</div>
		</figure>
		<div class="hl-key">
			<p class="hl-kt">Share of the xy diagram</p>
			<ul>${GAMUTS.map(g => `<li><svg class="hl-sw" viewBox="0 0 24 8" aria-hidden="true"><line class="hl-g${g.i}" x1="0" y1="4" x2="24" y2="4"/></svg><span>${g.name}</span><b class="tnum">${pct(g.share)}</b></li>`).join('')}</ul>
			<p class="hl-now"><i class="hl-dk" aria-hidden="true"></i><span>The current color, at <span class="tnum" data-xy></span></span></p>
		</div>
	</div>`
	const cv = hero.querySelector('canvas'), dm = hero.querySelector('.hl-dm'), xy = hero.querySelector('[data-xy]')
	let rt = 0
	const stopSize = onResize(cv, () => { clearTimeout(rt); rt = setTimeout(() => fill(cv), 90) })   // the fill follows the box once it settles
	fill(cv)
	let at = ''
	function paint() { const [X, Y, Z] = valsOf('xyz'), s = X + Y + Z
		if (!(s > 1e-6)) { at = ''; dm.hidden = true; xy.textContent = 'black – no chromaticity'; return }
		const x = X / s, y = Y / s, key = `${x.toFixed(4)} ${y.toFixed(4)}`; if (key === at) return; at = key
		dm.hidden = false; dm.style.left = px(Math.min(X1, Math.max(X0, x))) + '%'; dm.style.top = py(Math.min(Y1, Math.max(Y0, y))) + '%'   // an imaginary color keeps to the plot's edge; its numbers say where it is
		xy.textContent = `x ${x.toFixed(3)}, y ${y.toFixed(3)}` }
	paint()
	const raf = requestAnimationFrame(paint)   // the first hero mounts before boot() settles the color (a fragment, the still frame) – read it again then
	return all(stopSize, onColor(paint), () => { cancelAnimationFrame(raf); clearTimeout(rt) })
}
