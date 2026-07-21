// Themed tooltips — upgrades the native `title` into a positioned bubble, but
// ONLY on elements the app marks as explainers (cursor:help — the `.term` "?"
// affordance, plot captions, export status…). Everything else keeps its plain
// native title. No dependency: colors invert with the theme through --ink/--paper
// (dark bubble on the light theme, light bubble on the dark one). Event-delegated
// on the document, so it also covers the dossier and catalog built at runtime.
const tip = document.createElement('div')
tip.id = 'tip'
tip.setAttribute('role', 'tooltip')
tip.setAttribute('aria-hidden', 'true')
document.body.appendChild(tip)

let target = null, timer = 0

const place = (el) => {
	const r = el.getBoundingClientRect(), t = tip.getBoundingClientRect()
	let x = r.left + r.width / 2 - t.width / 2
	x = Math.max(6, Math.min(x, innerWidth - t.width - 6))
	let y = r.top - t.height - 8
	if (y < 6) y = r.bottom + 8                                  // flip below when it clips the top
	y = Math.max(6, Math.min(y, innerHeight - t.height - 6))     // …and keep it inside the bottom
	tip.style.left = x + 'px'
	tip.style.top = y + 'px'
}
const show = () => {
	const text = target && target.getAttribute('data-tip')
	if (!text) return
	tip.textContent = text
	tip.setAttribute('aria-hidden', 'false')
	tip.classList.add('on')
	place(target)
}
const hide = () => { tip.classList.remove('on'); tip.setAttribute('aria-hidden', 'true'); target = null; clearTimeout(timer) }
// only steal the title where the app already promises an explainer (question-mark cursor)
const helpful = (el) => el.hasAttribute('data-tip') || getComputedStyle(el).cursor === 'help'
// lazily move the native title onto data-tip so the OS tooltip never fires
const arm = (el) => {
	const t = el.getAttribute('title')
	if (t != null) { el.setAttribute('data-tip', t); el.removeAttribute('title') }
}
const find = (e) => (e.target.closest ? e.target.closest('[title],[data-tip]') : null)

addEventListener('pointerover', (e) => {
	const el = find(e)
	if (!el || el === target || !helpful(el)) return
	arm(el)
	target = el
	clearTimeout(timer)
	timer = setTimeout(show, 300)
}, { passive: true })
addEventListener('pointerout', (e) => {
	// only dismiss when the pointer actually leaves the target (not onto its own children)
	if (target && !target.contains(e.relatedTarget)) hide()
}, { passive: true })
addEventListener('focusin', (e) => { const el = find(e); if (el && helpful(el)) { arm(el); target = el; show() } })
addEventListener('focusout', hide)
addEventListener('scroll', hide, true)
addEventListener('keydown', (e) => { if (e.key === 'Escape') hide() })
