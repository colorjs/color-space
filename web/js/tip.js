// Themed tooltips — upgrades the native `title` into a positioned bubble, but
// ONLY on elements the app marks as explainers (cursor:help — the `.term` "?"
// affordance, plot captions, export status…). Everything else keeps its plain
// native title. The popovers' paper through --ink/--paper (light on the light theme, dark on
// the dark one). Event-delegated on the document, so it also covers the dossier and catalog
// built at runtime.
import { OI } from './icons.js'
/** the icons a tip draws – a tag's, a row's: the app's own set, which a page may add to (the Figma panel: its layers') */
export const tipIcons = { ...OI }
const tip = document.createElement('div')
tip.id = 'tip'
tip.setAttribute('role', 'tooltip')
tip.setAttribute('aria-hidden', 'true')
tip.inert = true   // hidden, nothing in it takes focus (a live tip's rows are buttons)
document.body.appendChild(tip)

let target = null, timer = 0, grace = 0, point = null   // point: the place a tip stands at in place of an element (tipAt)

// above its element (its box, r), or under it where a page's CSS asks (#tip{--tip-side:bottom}); flipped when it would
// clip. The side it took and its element's middle along it (data-side, --tip-ax) are there for a page that draws the
// bubble a tip
const place = (r) => {
	const t = tip.getBoundingClientRect(), below = getComputedStyle(tip).getPropertyValue('--tip-side').trim() === 'bottom'
	let x = r.left + r.width / 2 - t.width / 2
	x = Math.round(Math.max(6, Math.min(x, innerWidth - t.width - 6)))   // on whole pixels: a page-drawn tip meets its bubble without a seam
	const up = r.top - t.height - 8, down = r.bottom + 8
	let y = below ? (down + t.height > innerHeight - 6 && up >= 6 ? up : down) : (up < 6 ? down : up)   // flip when it clips
	y = Math.round(Math.max(6, Math.min(y, innerHeight - t.height - 6)))     // …and keep it inside
	tip.style.left = x + 'px'
	tip.style.top = y + 'px'
	tip.dataset.side = y >= r.bottom ? 'bottom' : 'top'
	tip.style.setProperty('--tip-ax', `${r.left + r.width / 2 - x}px`)
}
const span = (className, textContent) => Object.assign(document.createElement('span'), { className, textContent })
// a row's icon: a name in the app's set, or a shape of its own – { d, w, h }, a path in a w × h box (a vector layer's
// outline), set as an attribute, never as markup
const SVG = 'http://www.w3.org/2000/svg'
const icon = (i, k) => {
	if (k && typeof k === 'object') { const svg = document.createElementNS(SVG, 'svg'), p = document.createElementNS(SVG, 'path'); svg.setAttribute('viewBox', `0 0 ${+k.w} ${+k.h}`); p.setAttribute('d', String(k.d)); svg.append(p); i.append(svg) }
	else if (tipIcons[k]) i.innerHTML = tipIcons[k]
}
// a tip's content – an element's data-tip-* attributes, or the same handed to tipAt – written in; false when there's none
const fill = ({ head, rows, text, tags, live }) => {
	if (!text && !tags && !head && !rows?.length) return false
	tip.textContent = ''
	tip.classList.toggle('live', !!live)
	if (head) tip.append(Object.assign(document.createElement('b'), { className: 'th', textContent: head }))   // an optional heading line, set apart
	// optional rows – data-tip-rows, JSON [[icon, label, aside], …] – a list as a menu sets one: an icon, a label on one
	// line, a quiet aside at its right (the layers a color is used on). Text throughout, so a name can't inject markup.
	// Live (data-tip-live), the rows are buttons: the pointer may cross into the tip, and a row pressed tells the element
	// (a 'tiprow' event, its index in detail.i), then the tip goes
	if (rows?.length) {
		const box = span('rows', '')
		rows.forEach(([k, label, aside], n) => {
			const row = live ? Object.assign(document.createElement('button'), { type: 'button', className: 'row' }) : span('row', ''), i = document.createElement('i')
			row.dataset.i = n
			icon(i, k)
			row.append(i, span('nm', label), ...(aside ? [span('as', aside)] : []))
			box.append(row)
		})
		tip.append(box)
	}
	if (text) tip.append(span('', text))   // an element, so a lone chip row knows it is first
	// optional chip row — ` · `-separated `icon|label` tags rendered as the catalog's .tag chips, the icon
	// looked up in the app's own set (the label via textContent, so attribute text can't inject markup)
	if (tags) {
		const row = document.createElement('span')
		row.className = 'tags'
		for (const t of tags.split(' · ')) { const [k, label] = t.includes('|') ? t.split('|') : ['', t], c = document.createElement('i')
			if (tipIcons[k]) c.innerHTML = tipIcons[k]
			c.append(label); row.append(c) }
		tip.append(row)
	}
	tip.setAttribute('aria-hidden', 'false')
	tip.inert = false
	if (top() && !tip.matches(':popover-open')) tip.showPopover()   // laid out before it is placed
	tip.classList.add('on')
	return true
}
const show = () => {
	const at = k => target && target.getAttribute(k), rows = at('data-tip-rows')
	if (fill({ head: at('data-tip-head'), rows: rows && JSON.parse(rows), text: at('data-tip'), tags: at('data-tip-tags'), live: target.hasAttribute('data-tip-live') })) place(target.getBoundingClientRect())
}
// a page may lift the bubble into the top layer (#tip{--tip-layer:top}) – over its open popover menus, which a fixed
// element never rises above
const top = () => { if (top.v == null) { top.v = getComputedStyle(tip).getPropertyValue('--tip-layer').trim() === 'top' && 'showPopover' in tip; if (top.v) tip.popover = 'manual' } return top.v }
const hide = () => { if (top.v && tip.matches(':popover-open')) tip.hidePopover(); tip.classList.remove('on', 'live'); tip.setAttribute('aria-hidden', 'true'); tip.inert = true; target = point = null; clearTimeout(timer); clearTimeout(grace); grace = 0 }
// a live tip's row pressed: its element told, the tip gone. The press keeps the focus where it was (a focus moving would end
// the tip before the click)
tip.addEventListener('pointerdown', (e) => e.preventDefault())
tip.addEventListener('click', (e) => {
	const row = e.target.closest('.row'), el = target
	if (!row || !el) return
	hide()
	el.dispatchEvent(new CustomEvent('tiprow', { bubbles: true, detail: { i: +row.dataset.i } }))
})
/** Show an element's tip now (a click on a quiet explainer, say), or hide whatever shows */
export const showTip = (el) => { arm(el); target = el; clearTimeout(timer); show() }
export { hide as hideTip }
/**
 * A tip at a place of the page, not an element's: r a box in the viewport ({ left, top, right, bottom }; a point is a
 * box of no size), c its content – { head, rows: [[icon, label, aside], …], text }. It stays, moved by the next call,
 * until tipAt(null) or a hide (a scroll, Escape, the pointer gone); meanwhile the elements' own tips wait – the ⌥
 * readout over a dot is the dot's tip while it lasts
 */
export const tipAt = (r, c) => {
	if (!r || !c) { if (point) hide(); return }
	target = null; clearTimeout(timer)
	const { left, top, right, bottom } = r   // a DOMRect's sides are its prototype's getters: never spread one
	point = { left, top, right, bottom, width: right - left, height: bottom - top }
	if (fill(c)) place(point); else hide()
}
// only steal the title where the app already promises an explainer (question-mark cursor) – or everywhere, on a page
// that hands every title to the bubble (#tip{--tip-all:1}): one look for every tip, its pointer at its element
const every = () => (every.v ??= getComputedStyle(tip).getPropertyValue('--tip-all').trim() === '1')
const helpful = (el) => el.hasAttribute('data-tip') || el.hasAttribute('data-tip-rows') || every() || getComputedStyle(el).cursor === 'help'
// lazily move the native title onto data-tip so the OS tooltip never fires
const arm = (el) => {
	const t = el.getAttribute('title')
	if (t != null) { el.setAttribute('data-tip', t); el.removeAttribute('title') }
}
// a select whose list is open (:open, where supported) is being operated: no tip over its list
const isOpen = (sel) => { try { return sel.matches(':open') } catch { return false } }
// tags alone don't arm the bubble — only elements that also carry (or arm into) data-tip
const find = (e) => {
	if (!e.target.closest) return null
	const el = e.target.closest('[title],[data-tip],[data-tip-rows]')
	// a native select is being operated, not consulted — never bubble an ANCESTOR's explainer
	// over it (the section heading's tip rode the grouping select); its own title still may
	const sel = e.target.closest('select')
	return sel && (el !== sel || isOpen(sel)) ? null : el
}

addEventListener('pointerover', (e) => {
	const el = find(e)
	if (point || !el || (el === target && tip.classList.contains('on')) || !helpful(el)) return
	if (target && el !== target) hide()   // another element: the last one's tip goes now (a live one's breath too)
	arm(el)
	target = el
	clearTimeout(timer)
	timer = setTimeout(show, parseFloat(getComputedStyle(tip).getPropertyValue('--tip-delay')) || 300)   // the page's wait (#tip{--tip-delay}), else 300 ms
}, { passive: true })
addEventListener('pointerout', (e) => {
	// only dismiss when the pointer actually leaves the target (not onto its own children) – or, for a live tip, leaves
	// both it and its element; the gap between the two is crossed within a breath
	if (!target) return
	const to = e.relatedTarget, live = tip.classList.contains('live')
	if (target.contains(to) || (live && tip.contains(to))) { clearTimeout(grace); grace = 0; return }
	if (live) { grace ||= setTimeout(hide, 150); return }   // one breath from the first step out, however many elements it crosses
	hide()
}, { passive: true })
addEventListener('focusin', (e) => { const el = find(e); if (!point && el && helpful(el)) { arm(el); target = el; show() } })
addEventListener('focusout', (e) => { if (!tip.contains(e.relatedTarget)) hide() })
addEventListener('scroll', hide, true)
// the pointer leaving the page (an embedding frame may never report a pointerout for it) or the window losing focus
document.documentElement.addEventListener('pointerleave', hide)
addEventListener('blur', hide)
addEventListener('keydown', (e) => { if (e.key === 'Escape') hide() })
