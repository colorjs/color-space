// Atlas hero · Palette – the Search variant's simplicity, made the way in: one promise, one box. The box (and the
// masthead's search, and ⌘K / Ctrl+K anywhere) opens a command palette – the page dims, one focused field takes a
// color, a space or a task, and answers in one list: use this color · open a space · show only a facet · filter the
// catalog by the words. Every answer is a button the workbench's own delegate already understands (data-wtry,
// data-open-s, data-f · data-v), so the palette only finds; the page does.
import { FACTS } from './hero.js'
import { SPACES, meta, disp, parseColor, LORE, sent, famOf } from '../js/variants-model.js'
import { FACETS } from '../js/variants-data.js'
import { UI } from '../js/variants-icons.js'

const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const TRY = [['#ff8000', 'a hex color'], ['oklch(0.7 0.15 30)', 'a CSS color'], ['S-Log3', 'a space'], ['HDR', 'a facet'], ['print', 'a task']]
const MAC = /Mac|iPhone|iPad/.test(navigator.platform)

// what a query finds: a color if it parses, the spaces whose name, maker, year or family match (the name first),
// the facets whose option names it, and the plain words as a catalog filter
function find(q) { q = q.trim(); const lq = q.toLowerCase(), out = []
	if (!q) return out
	let c = null; try { c = parseColor(q) } catch {}
	if (c) out.push(`<button type="button" class="hp-it" data-wtry="${esc(q)}" role="option"><i class="hp-sw" style="--sw:${esc(q)}"></i><span class="hp-t"><b>Use ${esc(q)}</b><small>as the current color – every space below writes it</small></span><kbd>↵</kbd></button>`)
	const rank = s => { const n = disp(s).toLowerCase(), m = meta[s]
		return n === lq || s === lq ? 0 : n.startsWith(lq) || s.startsWith(lq) ? 1 : n.includes(lq) || s.includes(lq) ? 2
			: String(m.by || '').toLowerCase().includes(lq) || String(m.year) === q || (famOf[s] || '').toLowerCase().includes(lq) ? 3 : 9 }
	const hits = SPACES.map(s => [s, rank(s)]).filter(([, r]) => r < 9).sort((a, b) => a[1] - b[1] || disp(a[0]).localeCompare(disp(b[0]))).slice(0, 6)
	for (const [s] of hits) out.push(`<button type="button" class="hp-it" data-open-s="${s}" role="option"><i class="hp-dm" aria-hidden="true"></i><span class="hp-t"><b>${esc(disp(s))}</b><small>${esc([famOf[s], meta[s].year, meta[s].by].filter(Boolean).join(' · '))} – ${esc(sent(LORE[s]?.for))}</small></span><kbd>↵</kbd></button>`)
	for (const f of FACETS) for (const [v, name, tip] of f.opts) if (name.toLowerCase() === lq || v.toLowerCase() === lq || (lq.length > 2 && name.toLowerCase().startsWith(lq)))
		out.push(`<button type="button" class="hp-it" data-f="${f.k}" data-v="${v}" role="option"><i class="hp-ic" aria-hidden="true">${UI.filter}</i><span class="hp-t"><b>Show only ${esc(name)}</b><small>${esc(f.label)} – ${esc(tip)}</small></span><kbd>↵</kbd></button>`)
	out.push(`<button type="button" class="hp-it" data-hpq="${esc(q)}" role="option"><i class="hp-ic" aria-hidden="true">${UI.search}</i><span class="hp-t"><b>Filter the catalog by “${esc(q)}”</b><small>names, makers, years and stories – the masthead's search</small></span><kbd>↵</kbd></button>`)
	return out }

export default function mount({ hero }) {
	hero.innerHTML = `<div class="row hp">
		<p class="lab hp-meta"><span class="tnum">${FACTS.count} spaces</span><span class="tnum">${FACTS.from}–${FACTS.to}</span><span>CC0</span></p>
		<div class="hp-body">
			<h1 class="hp-h">Every color space,<br>one tiny API.</h1>
			<button type="button" class="hp-q" aria-haspopup="dialog">${UI.search}<span>Type a color, a space or a task</span><kbd>${MAC ? '⌘' : 'Ctrl '}K</kbd></button>
			<p class="hp-try"><span>Try</span>${TRY.map(([q, t]) => `<button type="button" data-hpo="${esc(q)}" title="${esc(t)}">${esc(q)}</button>`).join('')}</p>
		</div>
	</div>
	<dialog class="hp-pal" aria-label="Find a color, a space or a facet">
		<label class="hp-in">${UI.search}<input type="search" autocomplete="off" spellcheck="false" placeholder="A color, a space, a maker, a year, a task" aria-label="Find a color, a space or a facet" aria-controls="hp-res"><kbd>esc</kbd></label>
		<div class="hp-res" id="hp-res" role="listbox" aria-label="Answers"></div>
		<p class="hp-foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> take</span><span><kbd>esc</kbd> close</span></p>
	</dialog>`
	const dlg = hero.querySelector('.hp-pal'), inp = dlg.querySelector('input'), res = dlg.querySelector('.hp-res')
	let at = 0
	const items = () => [...res.querySelectorAll('.hp-it')]
	const mark = () => items().forEach((b, i) => { b.classList.toggle('on', i === at); b.setAttribute('aria-selected', i === at); if (i === at) b.scrollIntoView({ block: 'nearest' }) })
	const draw = () => { const out = find(inp.value); at = 0
		res.innerHTML = out.length ? out.join('') : `<p class="hp-none">${SPACES.length} spaces, the current color, every facet – start typing.</p>`; mark() }
	const open = (q = '') => { if (!dlg.open) dlg.showModal(); inp.value = q; draw(); inp.focus(); inp.select() }
	// the answers are the workbench's own buttons: its delegate acts, the palette closes behind it
	const take = b => { if (!b) return
		if (b.dataset.hpq !== undefined) { const m = document.getElementById('q'); if (m) { m.value = b.dataset.hpq; m.dispatchEvent(new Event('input', { bubbles: true })) } }
		dlg.close() }
	hero.querySelector('.hp-q').addEventListener('click', () => open())
	hero.querySelector('.hp-try').addEventListener('click', e => { const b = e.target.closest('[data-hpo]'); if (b) open(b.dataset.hpo) })
	inp.addEventListener('input', draw)
	inp.addEventListener('keydown', e => { const n = items().length
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (n) { at = (at + (e.key === 'ArrowDown' ? 1 : n - 1)) % n; mark() } }
		else if (e.key === 'Enter') { e.preventDefault(); items()[at]?.click() } })   // the click reaches the delegate, then take() below
	res.addEventListener('click', e => { const b = e.target.closest('.hp-it'); if (b) take(b) })   // the delegate (document) has already acted
	res.addEventListener('pointermove', e => { const i = items().indexOf(e.target.closest('.hp-it')); if (i >= 0 && i !== at) { at = i; mark() } })
	dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close() })   // a click on the dimmed page closes
	// ⌘K / Ctrl+K anywhere, and the masthead's search: the palette is this hero's way in
	const key = e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); dlg.open ? dlg.close() : open(document.getElementById('q')?.value || '') } }
	const mast = e => { if (e.target.id === 'q') { e.target.blur(); open(e.target.value) } }
	document.addEventListener('keydown', key); document.addEventListener('focusin', mast)
	return () => { document.removeEventListener('keydown', key); document.removeEventListener('focusin', mast); if (dlg.open) dlg.close() }
}
