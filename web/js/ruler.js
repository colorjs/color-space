/**
 * ⌥'s measurement drawn over a field – a plane – as Figma draws its own (its ⌥ redlines between two points): from the
 * color in hand's mark, a solid line along each of the plane's two channels to the weighed color's place on it, and from
 * there a dashed one back to each line's end – a box with two sides drawn – each solid line with its step in a pill
 * (empty: not drawn) beside it, as Figma sets them: the across one outside the box, the up one inside it; on a wheel,
 * around at the mark's radius and out along its angle, the dashed ones closing at the color weighed. The readout's
 * pills sit in a top corner of the field, the one away from the color weighed. Nothing overlaps or leaves the field: a
 * pill that would turns to its line's other side, or steps off it (settle). The Figma and VS Code panel and the site
 * draw it alike; each page styles .ruler (its red, its dash, its pills and their gap off their lines).
 *
 * host: the field's box (positioned); places are % of it, y down. o: { from, to: [x, y] (from may be null: no mark in
 * sight, only the readout; to null: the readout alone), polar, steps: [across, up] (on a wheel: [around, out]),
 * readout: [text, …] }. One overlay per host, rewritten in place
 */
const NS = 'http://www.w3.org/2000/svg'
export function ruler(host, o) {
	let r = host.querySelector(':scope > .ruler')
	if (!r) {
		r = document.createElement('div')
		r.className = 'ruler'
		r.setAttribute('aria-hidden', 'true')
		const svg = document.createElementNS(NS, 'svg')
		svg.setAttribute('viewBox', '0 0 100 100')
		svg.setAttribute('preserveAspectRatio', 'none')
		for (const c of ['rs', 'rd']) { const p = document.createElementNS(NS, 'path'); p.setAttribute('class', c); svg.append(p) }
		r.append(svg, ...['rl', 'rl', 'ro'].map(c => Object.assign(document.createElement('span'), { className: c })))
		host.append(r)
	}
	const [svg, la, lb, ro] = r.children, { from, to, polar, steps = [], readout = [] } = o
	let solid = '', dash = '', pa = null, pb = null, sa = '', sb = ''   // each step's place, and its side of its line
	if (from && to) {
		const [x0, y0] = from, [x1, y1] = to
		if (polar) {
			const P = (rr, a) => [50 + rr * Math.cos(a), 50 + rr * Math.sin(a)]
			const r0 = Math.hypot(x0 - 50, y0 - 50), a0 = Math.atan2(y0 - 50, x0 - 50), r1 = Math.hypot(x1 - 50, y1 - 50)
			let da = Math.atan2(y1 - 50, x1 - 50) - a0
			da -= 2 * Math.PI * Math.round(da / (2 * Math.PI))   // the shorter way round
			const [cx, cy] = P(r0, a0 + da), [ex, ey] = P(r1, a0), sw = da > 0 ? 1 : 0
			solid = `M${x0} ${y0}A${r0} ${r0} 0 0 ${sw} ${cx} ${cy}M${x0} ${y0}L${ex} ${ey}`
			dash = `M${ex} ${ey}A${r1} ${r1} 0 0 ${sw} ${x1} ${y1}M${cx} ${cy}L${x1} ${y1}`
			pa = P(r0, a0 + da / 2)
			pb = [(x0 + ex) / 2, (y0 + ey) / 2]
			sa = pa[1] > 50 ? 'below' : 'above'   // off the arc, outward
			sb = Math.abs(Math.cos(a0)) > Math.abs(Math.sin(a0)) ? (pb[1] > 50 ? 'below' : 'above') : pb[0] > 50 ? 'right' : 'left'   // off the ray, across it
		} else {
			solid = `M${x0} ${y0}H${x1}M${x0} ${y0}V${y1}`
			dash = `M${x0} ${y1}H${x1}M${x1} ${y0}V${y1}`
			pa = [(x0 + x1) / 2, y0]
			pb = [x0, (y0 + y1) / 2]
			sa = y1 < y0 ? 'below' : 'above'   // outside the box
			sb = x1 < x0 ? 'left' : 'right'   // inside it
		}
	}
	svg.children[0].setAttribute('d', solid)
	svg.children[1].setAttribute('d', dash)
	for (const [e, p, text, side] of [[la, pa, steps[0], sa], [lb, pb, steps[1], sb]]) {
		e.textContent = p && text ? text : ''
		e.dataset.at = side
		e.style.margin = ''
		if (p) { e.style.left = `${p[0]}%`; e.style.top = `${p[1]}%` }
	}
	ro.replaceChildren(...readout.map(t => Object.assign(document.createElement('b'), { textContent: t })))
	ro.className = `ro ${to && to[0] > 50 && to[1] < 30 ? 'tl' : 'tr'}`   // away from the color weighed
	settle(host, la, lb, ro)
}
// The pills as laid out (read: each page's CSS sets them and their gap), apart and inside the field: a step leaving the
// field turns to its line's other side; two that meet, the up one turns, and if that can't part them, the across one
// steps off its line by what they overlap; the readout takes the other top corner where a step stands in its own
const FLIP = { below: 'above', above: 'below', right: 'left', left: 'right' }
function settle(host, la, lb, ro) {
	const box = host.getBoundingClientRect(), R = e => e.textContent ? e.getBoundingClientRect() : null
	const out = r => !!r && (r.left < box.left || r.right > box.right || r.top < box.top || r.bottom > box.bottom)
	const hit = (a, b) => !!a && !!b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
	const turn = e => { e.dataset.at = FLIP[e.dataset.at] }
	for (const e of [la, lb]) if (out(R(e))) { turn(e); if (out(R(e))) turn(e) }   // neither side inside: as it was
	if (hit(R(la), R(lb))) {
		turn(lb)
		if (out(R(lb)) || hit(R(la), R(lb))) {
			turn(lb)
			const a = R(la), b = R(lb), at = la.dataset.at
			const d = { below: b.bottom - a.top, above: a.bottom - b.top, right: b.right - a.left, left: a.right - b.left }[at]
			la.style[at === 'below' || at === 'above' ? 'marginTop' : 'marginLeft'] = `${at === 'below' || at === 'right' ? d : -d}px`
		}
	}
	if (!ro.children.length) return
	const meets = () => [la, lb].some(e => hit(R(e), ro.getBoundingClientRect()))
	if (meets()) { ro.classList.toggle('tl'); ro.classList.toggle('tr'); if (meets()) { ro.classList.toggle('tl'); ro.classList.toggle('tr') } }
}
/** the measurement taken off its host */
export const unruler = (host) => host.querySelector(':scope > .ruler')?.remove()
