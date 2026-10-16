/**
 * ⌥'s measurement drawn over a field – a plane – as Figma draws its own (its ⌥ redlines, Dev Mode's measurements): from
 * the color in hand's mark to the color weighed, the two channels' ways at right angles – across, then up; on a wheel,
 * around at the mark's radius, then out – each with its step in a pill (empty: not drawn) beside its line, on the side
 * away from the other, as Figma sets them; a knob at the color weighed, in that color; and the readout's pills in a top
 * corner of the field, the one away from the color weighed. The Figma and VS Code panel and the site draw it alike;
 * each page styles .ruler (its red, its pills, its knob).
 *
 * host: the field's box (positioned); places are % of it, y down. o: { from, to: [x, y] (from may be null: no mark in
 * sight, only the knob and the readout; to null: the readout alone), polar, steps: [across, up], knob: a CSS color,
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
		svg.append(document.createElementNS(NS, 'path'))
		for (const c of ['rk', 'rl', 'rl', 'ro']) r.append(Object.assign(document.createElement(c === 'rk' ? 'i' : 'span'), { className: c }))
		r.prepend(svg)
		host.append(r)
	}
	const [svg, knob, la, lb, ro] = r.children, { from, to, polar, steps = [], readout = [] } = o
	const at = (e, x, y) => { e.style.left = `${x}%`; e.style.top = `${y}%` }
	let d = '', pa = null, pb = null, sa = '', sb = ''   // each step's place, and its side of its line (away from the other)
	if (from && to) {
		const [x0, y0] = from, [x1, y1] = to
		if (polar) {
			const r0 = Math.hypot(x0 - 50, y0 - 50), a0 = Math.atan2(y0 - 50, x0 - 50)
			let da = Math.atan2(y1 - 50, x1 - 50) - a0
			da -= 2 * Math.PI * Math.round(da / (2 * Math.PI))   // the shorter way round
			const cx = 50 + r0 * Math.cos(a0 + da), cy = 50 + r0 * Math.sin(a0 + da), am = a0 + da / 2
			d = `M${x0} ${y0}A${r0} ${r0} 0 0 ${da > 0 ? 1 : 0} ${cx} ${cy}L${x1} ${y1}`
			pa = [50 + r0 * Math.cos(am), 50 + r0 * Math.sin(am)]
			pb = [(cx + x1) / 2, (cy + y1) / 2]
		} else {
			d = `M${x0} ${y0}H${x1}V${y1}`
			pa = [(x0 + x1) / 2, y0]
			pb = [x1, (y0 + y1) / 2]
			sa = y1 < y0 ? 'below' : 'above'
			sb = x1 < x0 ? 'left' : 'right'
		}
	}
	svg.firstChild.setAttribute('d', d)
	for (const [e, p, text, side] of [[la, pa, steps[0], sa], [lb, pb, steps[1], sb]]) { e.textContent = p && text ? text : ''; e.dataset.at = side; if (p) at(e, ...p) }
	knob.hidden = !to || !o.knob
	if (!knob.hidden) { at(knob, ...to); knob.style.background = o.knob }
	ro.replaceChildren(...readout.map(t => Object.assign(document.createElement('b'), { textContent: t })))
	ro.className = `ro ${to && to[0] > 50 && to[1] < 30 ? 'tl' : 'tr'}`   // away from the color weighed
}
/** the measurement taken off its host */
export const unruler = (host) => host.querySelector(':scope > .ruler')?.remove()
