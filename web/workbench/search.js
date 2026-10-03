// Search – the workbench's search-first direction (the owner's "Google-like / NPM-like" note): the first
// screen is the wordmark, one sentence and one input. A color typed there returns its passport – the
// color read in the featured spaces, each flagged where it falls outside the space's channel ranges,
// then every space by family; a space's name or a task word returns the spaces that match, the best one
// opened up. With nothing typed, the drifting color drives the passport. Everything shared comes from
// wb.js (orbit, pane and its tabs, LUT flow, plates, tour, agents); this file adds the query, the rows
// and the footer's build tabs. #cat holds the results, so the pane's prev/next walks them.
import { boot, S, SPACES, FAMILIES, meta, disp, esc, live, plate, hilite, snippet, loadPY, embedSnippet, lutHTML, loadCite, citeHTML, color, stopOrbit, orbiting, openPane, MCP } from './wb.js'
import { parseColor, passes, famOf, LORE, classify, sent, RGBX, hexNow, gamutOf, GAMTIP } from '../js/variants-model.js'
import { PICKS, PURPOSE, ORDER, TIPS, plabel } from '../js/variants-data.js'
import { cname } from '../js/render.js'
import { toSpace, LUTOK } from '../js/core.js'
import { track, EVENT } from '../js/track.js'

const $ = id => document.getElementById(id), cat = $('cat'), sq = $('sq')
const ALL = [...new Set(FAMILIES.flatMap(f => f.spaces))].filter(s => SPACES.includes(s))   // family order – the order every list here keeps
const AT = Object.fromEntries(ALL.map((s, i) => [s, i]))
const FEATURED = ALL.filter(s => PICKS.has(s))

// ── markup: the catalog's own pieces (.sp · .nm · .chs · .rd), so wb.js paints them at the current color ──
const nm = s => `<button class="nm" type="button" data-open-s="${s}" aria-label="Open ${esc(disp(s))} details">${esc(disp(s))}</button>`
const strips = (s, cls = 'chs thin') => `<div class="${cls}">${classify(s).ch.map((c, i) => `<div class="ch" data-i="${i}" title="${esc(cname(c))}"><input type="range" class="nrg" data-i="${i}" min="${c.min}" max="${c.max}" step="any" aria-label="${esc(disp(s))} ${esc(cname(c))}"></div>`).join('')}</div>`
const reads = s => `<span class="rd">${classify(s).ch.map((c, i) => `<span class="cvp" title="${esc(cname(c))}"><i class="cl">${esc(c.sym.slice(0, 2))}</i><b class="cv tnum" data-i="${i}"></b></span>`).join('')}</span>`
const byline = s => [meta[s].year, meta[s].by].filter(Boolean).join(' · ')
const descOf = s => { const d = meta[s].description || '', k = d.indexOf(' — '); return sent(k > 0 && k < 60 ? d.slice(k + 3) : d) }   // variants-catalog's rule
const passRow = (s, fam = true) => `<article class="sp sr-row" data-s="${s}"><div class="sr-id">${nm(s)}<span class="sr-meta">${esc(fam ? famOf[s] : byline(s))}</span></div>${reads(s)}${strips(s)}<span class="sr-flag" data-flag="${s}"></span></article>`
const spaceRow = s => `<article class="sp sr-row sr-srow" data-s="${s}"><div class="sr-id">${nm(s)}<span class="sr-meta">${esc([famOf[s], byline(s)].filter(Boolean).join(' · '))}</span></div><p class="sr-use">${esc(sent(LORE[s]?.for))}</p>${strips(s)}</article>`
// the best match, opened up: the story, the numbers, the strips – and for a camera log, the LUT it makes
const bestHTML = s => `<article class="sp sr-best" data-s="${s}">
	<p class="wb-eyebrow">Best match · ${esc(famOf[s])}</p>
	<header class="lh">${nm(s)}<span class="by">${esc(byline(s))}</span></header>
	${LORE[s]?.for ? `<p class="for">${esc(sent(LORE[s].for))}</p>` : ''}<p class="desc">${esc(descOf(s)).replace(/`([^`]+)`/g, '<code>$1</code>')}</p>
	${reads(s)}${strips(s, 'chs')}
	${LUTOK.has(s) && meta[s].encoding === 'log' ? `<div class="sr-lut"><h3 class="wb-h">Make a LUT from ${esc(disp(s))}</h3><div data-wl-from="${s}">${lutHTML(s)}</div></div>` : ''}
</article>`
// every space, by family – each title is a text-select onto the others: the section titles are the navigation
const famsHTML = row => FAMILIES.map((f, i) => { const l = f.spaces.filter(s => SPACES.includes(s))
	return `<section class="sr-fam" id="fam-${i}" aria-label="${esc(f.name)}"><h3 class="sr-fh"><label class="fsel"><span class="sr">Family – choose one to jump to it</span><select data-sr-jump>${FAMILIES.map((g, j) => `<option value="${j}"${i === j ? ' selected' : ''}>${esc(g.name)}</option>`).join('')}</select></label><span class="cnt tnum">${l.length}</span></h3><div class="sr-rows">${l.map(row).join('')}</div></section>` }).join('')

// ── the query: a color, a task word, or the spaces a word finds ──
const norm = t => String(t).toLowerCase().replace(/[^a-z0-9]/g, '')
const purposeOf = q => { const l = q.toLowerCase(); return ORDER.find(t => t === l || plabel(t).toLowerCase() === l) || (l.length >= 4 ? ORDER.find(t => plabel(t).toLowerCase().startsWith(l)) : null) }
const forList = t => ALL.filter(s => PURPOSE[s]?.includes(t)).sort((a, b) => (PICKS.has(b) - PICKS.has(a)) || ((PURPOSE[a][0] !== t) - (PURPOSE[b][0] !== t)) || AT[a] - AT[b])
function findSpaces(q) { S.q = q; const hits = ALL.filter(s => passes(s)); S.q = ''   // the model's search: name, id, maker, year, family, tasks, channels, story
	const n = norm(q), score = s => { const a = norm(disp(s)), b = norm(s); return (a === n || b === n ? 100 : a.startsWith(n) || b.startsWith(n) ? 50 : a.includes(n) ? 25 : 0) + (PICKS.has(s) ? 10 : 0) }
	return hits.map(s => [s, score(s)]).sort((x, y) => y[1] - x[1] || AT[x[0]] - AT[y[0]]).map(x => x[0]) }

let full = false, kind = '', best = null, held = '', own = false
function render() { const q = sq.value.trim(), c = q ? parseColor(q) : null
	document.body.classList.toggle('q', !!q)
	if (c && q !== held) { held = q; own = true; color(c.s, c.vals); own = false }   // a typed color is authored: it stops the orbit and goes in the URL
	if (!q || c) { kind = 'color'; best = null; cat.innerHTML = passportHTML(q) }
	else { const t = purposeOf(q), list = t ? forList(t) : findSpaces(q); kind = t ? 'for' : 'space'; best = list[0] || null
		cat.innerHTML = list.length ? listHTML(q, t, list) : `<div class="sr-none"><p>Nothing reads “${esc(q)}” as a color, and no space answers to it.</p><p class="wb-note">Try a hex like #ff8000, a CSS color like oklch(0.7 0.15 30), a name like OKLCH or S-Log3, or a task like palettes.</p></div>` }
	live(cat); paintFlags(); paintCover() }
function passportHTML(q) {
	return `<header class="sr-rh sr-pass"><div class="sr-sw" aria-hidden="true"></div><div class="sr-who">
		<p class="wb-eyebrow">${q ? 'Your color' : orbiting() ? 'The drifting color – type one to hold it' : 'The current color'}</p>
		<h2 class="sr-hex tnum" id="sr-hex"></h2><p class="sr-tip" id="sr-tip"></p></div></header>
	${full ? `<p class="sr-sub">All ${SPACES.length} spaces, by family <button type="button" class="lnk" data-sr-full="0">Featured only</button></p>${famsHTML(s => passRow(s, false))}`
		: `<h3 class="sr-sub">In the featured spaces</h3><div class="sr-rows">${FEATURED.map(s => passRow(s)).join('')}</div><button type="button" class="sr-more" data-sr-full="1">All ${SPACES.length} →</button>`}` }
function listHTML(q, t, list) { const [top, ...rest] = list, shown = full ? rest : rest.slice(0, 12)
	return `<header class="sr-rh">${t ? `<p class="wb-eyebrow tnum">Task · ${list.length} spaces</p><h2 class="sr-q">${esc(plabel(t))}</h2><p class="sr-tip">${esc(sent(TIPS[t]))}</p>`
		: `<p class="sr-tip tnum">${list.length === 1 ? 'One space answers' : `${list.length} spaces answer`} to “${esc(q)}”.</p>`}</header>
	${bestHTML(top)}${shown.length ? `<div class="sr-rows">${shown.map(spaceRow).join('')}</div>` : ''}${rest.length > shown.length ? `<button type="button" class="sr-more" data-sr-full="1">All ${list.length} →</button>` : ''}` }

// the passport's flags: a space whose channel ranges cannot hold the color's numbers clips it there
function outside(s) { let v; try { v = toSpace(s, RGBX) } catch { return null }
	if (!v?.every(isFinite)) return null
	return meta[s].channels.some((c, i) => c.max !== 360 && (v[i] < c.min - (c.max - c.min) * 1e-4 || v[i] > c.max + (c.max - c.min) * 1e-4)) }
function paintFlags() { for (const el of cat.querySelectorAll('[data-flag]')) { const o = outside(el.dataset.flag)
	el.textContent = o == null ? '' : o ? 'outside' : 'fits'; el.classList.toggle('out', !!o)
	el.title = o ? `Its numbers fall outside ${disp(el.dataset.flag)}’s channel ranges – this space clips it` : o === false ? `${disp(el.dataset.flag)} holds it as it is` : '' } }
function paintCover() { const h = $('sr-hex'), t = $('sr-tip'); if (!h) return
	h.textContent = hexNow(); const q = sq.value.trim()
	t.textContent = (q && norm(q) !== norm(hexNow()) ? q + ' – ' : '') + sent(GAMTIP[gamutOf()]) }
let cT = 0
document.addEventListener('wb:color', e => { if (!own && e.detail.authored && kind === 'color' && sq.value.trim() && document.activeElement !== sq) sq.value = held = hexNow()
	if (cT) return; cT = setTimeout(() => { cT = 0; paintFlags(); paintCover() }, 200) })

// ── the URL keeps the query: ?q=… (and ?for=<task> arrives as one) ──
const P = new URLSearchParams(location.search)
sq.value = P.get('q') || (ORDER.includes(P.get('for')) ? P.get('for') : '')
const writeQ = () => { try { const u = new URL(location.href), q = sq.value.trim(); q ? u.searchParams.set('q', q) : u.searchParams.delete('q'); u.searchParams.delete('for'); history.replaceState(null, '', u) } catch {} }
let qT = 0
sq.addEventListener('input', () => { stopOrbit(); full = false; clearTimeout(qT); qT = setTimeout(() => { render(); writeQ() }, 140) })
$('sform').addEventListener('submit', e => { e.preventDefault(); clearTimeout(qT); render(); writeQ(); if (best) openPane(best, { from: sq }) })   // Enter opens the best match

// the quiet examples under the input
const TRY = ['oklch(0.7 0.15 30)', '#ff8000', 'S-Log3', 'palettes', 'print']
$('try').insertAdjacentHTML('beforeend', TRY.map(t => `<button type="button" class="sr-ex" data-sr-try="${esc(t)}">${esc(t)}</button>`).join(''))

// ── the footer: build with it – npm · Python · MCP · Embed, for the open space (or the best match, or OKLCH) ──
const BUILD = [['npm', 'npm'], ['py', 'Python'], ['mcp', 'MCP'], ['embed', 'Embed']]
let bt = 'npm', pyOK = false
$('btabs').innerHTML = BUILD.map(([k, l]) => `<button type="button" role="tab" id="bt-${k}" aria-controls="bpanel" aria-selected="${k === bt}" tabindex="${k === bt ? 0 : -1}" data-sr-bt="${k}">${l}</button>`).join('')
function paintBuild() { const p = $('bpanel'), s = S.sel || best || 'oklch'; p.setAttribute('aria-labelledby', 'bt-' + bt)
	if (bt === 'npm') { const [code] = snippet(s, 'js'); p.innerHTML = plate('npm install color-space', 'npm install command', { wrap: true }) + plate(code, 'JavaScript code', { hl: hilite(code) }) }
	if (bt === 'py') { const [code, cm] = snippet(s, 'py'); p.innerHTML = plate(code, 'Python code', { hl: hilite(code, cm) })
		if (!pyOK) loadPY().then(() => { pyOK = true; if (bt === 'py') paintBuild() }).catch(() => {}) }   // python.js loads on first ask
	if (bt === 'mcp') p.innerHTML = `<p class="wb-note">An MCP server, so an agent calls verified conversions instead of guessing them.</p>${plate(MCP.claude, 'Claude Code command', { wrap: true })}<p class="wb-note"><button type="button" class="lnk" popovertarget="s-agents">Claude Desktop, Cursor, VS Code</button></p>`
	if (bt === 'embed') p.innerHTML = `<p class="wb-note">The ${esc(disp(s))} card alone, in an iframe on your page.</p>${plate(embedSnippet(s), 'Embed snippet', { trk: 'embed:' + s, wrap: true })}` }
function selectBuild(k, focus) { bt = k; for (const b of $('btabs').children) { const on = b.dataset.srBt === k; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus() }
	paintBuild(); if (k === 'npm' || k === 'py') track(EVENT.lang(k === 'npm' ? 'js' : k)) }
$('btabs').addEventListener('keydown', e => { if (!/^(ArrowLeft|ArrowRight)$/.test(e.key)) return; const all = [...$('btabs').children], k = all.indexOf(document.activeElement)
	e.preventDefault(); selectBuild(all[(k + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length].dataset.srBt, true) })

boot({ arrange: 'family', view: 'grid', preview: 'sliders', quant: 'smooth', follow: false })
render(); paintBuild()

// after wb.js's delegate: the examples, the scope, the family jumps, the build tabs; a pane's 'Used for' tag searches that task
document.addEventListener('click', e => { const t = e.target.closest('button'); if (!t) return; const d = t.dataset
	if (d.f === 'for' && d.v) { e.stopPropagation(); sq.value = d.v; full = false; render(); writeQ(); scrollTo({ top: 0 }); return }
	if (d.srTry) { sq.value = d.srTry; stopOrbit(); full = false; render(); writeQ(); sq.focus(); return }
	if (d.srFull) { full = d.srFull === '1'; render(); if (!full) cat.scrollIntoView({ block: 'start' }); return }
	if (d.srBt) return selectBuild(d.srBt) }, true)
document.addEventListener('change', e => { if (e.target.dataset.srJump !== undefined) { const i = e.target.value; e.target.value = e.target.closest('.sr-fam').id.slice(4); $('fam-' + i)?.scrollIntoView({ block: 'start' }); $('fam-' + i)?.querySelector('select')?.focus({ preventScroll: true }) } })
document.addEventListener('keydown', e => { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) { e.preventDefault(); sq.focus() } })
let bT = 0
document.addEventListener('wb:color', () => { if (bt === 'npm' || bt === 'py') { clearTimeout(bT); bT = setTimeout(paintBuild, 500) } })
$('s-cite').addEventListener('toggle', e => { if (e.newState === 'open') loadCite().then(c => { $('s-cite-b').innerHTML = citeHTML(c) }) })
