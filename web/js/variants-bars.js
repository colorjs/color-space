// UI-variants workshop – four ways to hold the same controls. Each variant is a different answer to
// "how does a curious person narrow 168 spaces and change how they are drawn?":
//   sentence – the state reads as one plain sentence; every value is a word you can change
//   drawer   – labeled cells; one opens a drawer of illustrated options, all visible at once
//   guide    – starts from the task; every choice stays in view, one line explains what you point at
//   studio   – the page wears your color; compact icon groups, filters in one sheet
import { FACETS, FK, QUANT, QFLAT, LIMITS, ARRANGE, VIEWS, PREVIEWS, plabel, whiteCSS } from './variants-data.js'
import { QI, LI, PI, VI, FI, OI, UI } from './variants-icons.js'
import { S, SPACES, countIf, nOn, shown } from './variants-model.js'
import { esc } from './variants-catalog.js'

const lc = l => /^[A-Z0-9]{2,}/.test(l) ? l : l.toLowerCase()
const onOf = k => [...S.F[k]]
const nameOf = (k, v) => FK[k].opts.find(o => o[0] === v)?.[1] || v
export const countText = () => { const n = shown().length; return n === SPACES.length ? `${n} spaces` : `${n} of ${SPACES.length}` }
const ARRTIP = { family: 'what each space is – its lineage', purpose: 'what each space is for', era: 'when each space was born, newest first', name: 'alphabetical – no stars, every space alike' }
const QTIP = Object.fromEntries(QFLAT.map(([v, n, t]) => [v, [n, t]])), LTIP = Object.fromEntries(LIMITS.map(([v, n, t]) => [v, [n, t]]))

// ── the pieces every variant arranges ──
const optIcon = (k, v) => k === 'white' ? `<i class="wdot" style="--w:${whiteCSS(v)}"></i>` : OI[v] || ''
// data-k: the workbench re-renders menus in place and hands focus back to the same option by it
export const opt = (k, [v, name, tip]) => { const n = countIf(k, v), on = S.F[k].has(v)
	return `<button type="button" class="opt" data-f="${k}" data-v="${v}" data-k="m-${k}-${v}" aria-pressed="${on}" data-tip="${esc(name)} – ${esc(tip)}"${n || on ? '' : ' disabled'}><span class="oi">${optIcon(k, v)}</span><span class="ot"><b>${esc(name)}</b><small>${esc(tip)}</small></span><span class="oc tnum">${n}</span></button>` }
export const chip = (k, [v, name, tip], icon = true) => { const n = countIf(k, v), on = S.F[k].has(v)
	return `<button type="button" class="chip" data-f="${k}" data-v="${v}" data-k="m-${k}-${v}" aria-pressed="${on}" data-tip="${esc(name)} – ${esc(tip)} · ${n} spaces"${n || on ? '' : ' disabled'}>${icon ? optIcon(k, v) : ''}<span>${esc(name)}</span><span class="oc tnum">${n}</span></button>` }
export const lensOpt = (key, v, [name, tip], icon) => `<button type="button" class="opt" data-set="${key}" data-v="${v}" data-k="m-${key}-${v}" aria-pressed="${S[key] === v}" data-tip="${esc(name)} – ${esc(tip)}"><span class="oi">${icon}</span><span class="ot"><b>${esc(name)}</b><small>${esc(tip)}</small></span></button>`
const seg = (key, label, items, icons, cls = '') => `<div class="seg ${cls}" role="group" aria-label="${label}">${items.map(([v, name, tip]) =>
	`<button type="button" data-set="${key}" data-v="${v}" aria-pressed="${S[key] === v}" title="${esc(name)} – ${esc(tip)}" data-tip="${esc(name)} – ${esc(tip)}">${icons[v]}<span class="sr">${esc(name)}</span></button>`).join('')}</div>`
const tabs = (key, label, items) => `<div class="tabs" role="group" aria-label="${label}">${items.map(([v, name]) =>
	`<button type="button" data-set="${key}" data-v="${v}" aria-pressed="${S[key] === v}" data-tip="${esc(name)} – ${esc(ARRTIP[v] || '')}">${esc(name)}</button>`).join('')}</div>`
const quantSegs = () => QUANT.map(([g, items]) => seg('quant', g, items, QI)).join('')
const clearBtn = () => nOn() || S.q ? `<button type="button" class="lnk" data-reset>Clear all</button>` : ''
const popHead = (q, k) => `<header class="poph"><b>${esc(q)}</b>${k && S.F[k]?.size ? `<button type="button" class="lnk" data-clear="${k}">Any</button>` : ''}</header>`
export const quantList = () => QUANT.map(([g, items]) => `<div class="optg"><span class="gl">${g}</span>${items.map(([v]) => lensOpt('quant', v, QTIP[v], QI[v])).join('')}</div>`).join('')
export const limitList = () => LIMITS.map(([v]) => lensOpt('limit', v, LTIP[v], LI[v])).join('')

// ── row one: identity, the color, search, the room's switches ──
const PH = { sentence: 'Search by name, maker, year or use', drawer: 'Find a space', guide: 'Search – try “HDR”, “Apple”, “1976” or “hue”', studio: 'Search 168 spaces' }
export const TRY = [['tomato', 'Tomato'], ['gold', 'Gold'], ['teal', 'Teal'], ['rebeccapurple', 'Rebecca purple'], ['color(display-p3 0 1 0)', 'The greenest P3 green']]
export const topHTML = () => `<a class="brand" href="./" title="The atlas"><b>color-space</b><span class="n tnum" id="count"></span></a>
	<div class="cur" title="The current color – every space below draws it"><span class="cdw"><input type="color" id="cpick" aria-label="Pick the current color"></span><input id="cval" spellcheck="false" autocomplete="off" enterkeyhint="done" aria-label="Current color – any CSS color, or a space's own numbers like cam16(60 40 50)"><span class="gam" id="gam"></span></div>
	${S.bar === 'studio' ? `<div class="try" role="group" aria-label="Try a color"><span>Try</span>${TRY.map(([c, n]) => `<button type="button" data-try="${c}" title="${n}" style="--sw:${c}"><span class="sr">${n}</span></button>`).join('')}</div>` : ''}
	<label class="find" id="findw">${UI.search}<input id="q" type="search" autocomplete="off" spellcheck="false" placeholder="${innerWidth <= 896 ? 'Search spaces' : PH[S.bar]}" aria-label="Search the spaces"><button class="qx" type="button" id="qx" aria-label="Clear the search">${UI.x}</button><kbd>/</kbd></label>
	<span class="tools1"><button class="ib" type="button" id="dice" title="Try a random color" aria-label="Try a random color">${UI.dice}</button><button class="ib" type="button" id="thm" aria-label="Switch light and dark"></button><a class="ib" href="https://github.com/colorjs/color-space" target="_blank" rel="noopener" aria-label="GitHub repository" title="GitHub">${UI.gh}</a></span>`

// ── sentence: "168 spaces for any task, running anywhere, in SDR and HDR – arranged by family." ──
const SAY = {
	for: ['for', v => v.length ? v.map(x => plabel(x).toLowerCase()).join(' or ') : 'any task'],
	runs: ['running', v => v.length ? 'in ' + v.map(x => x.toUpperCase()).join(' or ') : 'anywhere'],
	light: ['in', v => v.length === 1 ? v[0].toUpperCase() + ' only' : 'SDR and HDR'],
	shape: ['with', v => (v.length ? v.join(' or ') : 'any') + ' axes'],
	signal: ['encoding', v => v.length === 1 ? (v[0] === 'display' ? 'what screens show' : 'what cameras saw') : 'screen or scene light'],
	curve: ['on', v => v.length ? `a ${v.map(x => lc(nameOf('curve', x))).join(' or ')} curve` : 'any tone curve'],
	white: ['with', v => v.length ? `a ${v.join(' or ')} white` : 'any white'],
	age: ['', v => v.length === 1 ? (v[0] === 'current' ? 'in use today' : 'historical') : 'old or new'],
}
const tok = (key, words, pop, on) => `<span class="tok${on ? ' on' : ''}"><button type="button" class="t" data-open="${key}" aria-expanded="${S.open === key}">${esc(words)}</button>${S.open === key ? `<div class="pop" role="dialog" aria-label="${esc(key)}">${pop()}</div>` : ''}</span>`
const ftok = k => { const v = onOf(k), [pre, fn] = SAY[k]
	return `${pre ? `<span class="w">${pre}</span> ` : ''}${tok(k, fn(v), () => popHead(FK[k].q, k) + FK[k].opts.map(o => opt(k, o)).join(''), v.length)}` }
function sentence() {
	const more = S.more || ['shape', 'signal', 'curve', 'white', 'age'].some(k => S.F[k].size)
	return `<div class="say">
	<div class="line"><span class="tok count"><b class="t tnum">${countText()}</b></span> ${ftok('for')}, ${ftok('runs')}, ${ftok('light')}${more ? `, ${ftok('shape')}, ${ftok('signal')}, ${ftok('curve')}, ${ftok('white')}, ${ftok('age')}` : ''}
		<span class="w">– arranged by</span> ${tok('arrange', ARRANGE.find(a => a[0] === S.arrange)[1].toLowerCase(), () => popHead('Arrange the shelves by…') + ARRANGE.map(([v, n]) => lensOpt('arrange', v, [n, ARRTIP[v]], '')).join(''))}.
		${more ? '' : `<button type="button" class="lnk" data-more>Ask more</button>`} ${clearBtn()}</div>
	<div class="line lens"><span class="words"><span class="w">Drawn</span> ${tok('quant', lc(QTIP[S.quant][0]), () => popHead('Draw every strip and plane…') + quantList(), S.quant !== 'smooth')}
		<span class="w">within</span> ${tok('limit', S.limit === 'locus' ? 'all light' : S.limit === 'vis' ? 'surface colors' : LTIP[S.limit][0], () => popHead('Show colors as far as…') + limitList(), S.limit !== 'locus')}
		<span class="w">as</span> ${tok('preview', S.preview, () => popHead('Starred spaces show…') + PREVIEWS.map(([v, n, t]) => lensOpt('preview', v, [n, t], PI[v])).join(''), false)}
		</span><span class="fill"></span>${seg('view', 'View', VIEWS, VI)}</div>
</div>` }

// ── drawer: labeled cells; the open one pours its options into a drawer below ──
export const cellWords = f => { const v = onOf(f.k); return v.length ? v.map(x => nameOf(f.k, x)).join(', ') : f.any[0].toUpperCase() + f.any.slice(1) }
const cell = (key, icon, label, words, on) => `<button type="button" class="cell${on ? ' on' : ''}" data-open="${key}" aria-expanded="${S.open === key}"><span class="ci">${icon}</span><span class="cw"><small>${esc(label)}</small><b>${esc(words)}</b></span>${UI.chev}</button>`
function drawerBody() { const k = S.open
	if (FK[k]) return `<header class="dh2"><div><b>${esc(FK[k].q)}</b><small>Pick any – a space that matches one of them stays.</small></div>${S.F[k].size ? `<button type="button" class="lnk" data-clear="${k}">Any</button>` : ''}<button type="button" class="ib" data-open="${k}" aria-label="Close">${UI.x}</button></header><div class="cards">${FK[k].opts.map(o => opt(k, o)).join('')}</div>`
	if (k === 'quant') return `<header class="dh2"><div><b>Draw every strip and plane…</b><small>Smooth shows every value; steps and palettes show what survives quantizing.</small></div><button type="button" class="ib" data-open="quant" aria-label="Close">${UI.x}</button></header><div class="cards lens3">${quantList()}</div>`
	if (k === 'limit') return `<header class="dh2"><div><b>Show colors as far as…</b><small>Past the limit a color dims, and what no light can be is cut.</small></div><button type="button" class="ib" data-open="limit" aria-label="Close">${UI.x}</button></header><div class="cards">${limitList()}</div>`
	return '' }
const drawer = () => `<div class="cells">${FACETS.map(f => cell(f.k, FI[f.icon], f.label, cellWords(f), S.F[f.k].size)).join('')}
	<span class="fill"></span>${cell('quant', QI[S.quant], 'Draw', QTIP[S.quant][0], S.quant !== 'smooth')}${cell('limit', LI[S.limit], 'Limit', LTIP[S.limit][0], S.limit !== 'locus')}</div>
	${S.open && (FK[S.open] || S.open === 'quant' || S.open === 'limit') ? `<div class="drawer" role="region" aria-label="Options">${drawerBody()}</div>` : ''}
	<div class="sub"><b class="cnt2 tnum">${countText()}</b>${clearBtn()}<span class="fill"></span><span class="gl">Arrange</span>${tabs('arrange', 'Arrange by', ARRANGE)}<span class="gl">Starred show</span>${seg('preview', 'Starred spaces show', PREVIEWS, PI)}${seg('view', 'View', VIEWS, VI)}</div>`

// ── guide: the task first, everything else in view, one line that explains what you point at ──
const EXPLAIN0 = 'Pick a task, or point at anything here to see what it means.'
const group = k => `<span class="grp"><span class="gl">${esc(FK[k].label)}</span>${FK[k].opts.map(o => chip(k, o, k !== 'runs')).join('')}</span>`
const guide = () => { const more = S.more || ['signal', 'curve', 'white'].some(k => S.F[k].size)
	return `<div class="ask"><h2>What are you working on?</h2><div class="chips">${FK.for.opts.map(o => chip('for', o)).join('')}</div></div>
	<p class="explain" id="explain" aria-live="polite">${EXPLAIN0}</p>
	<div class="refine"><span class="rl">Narrow down</span>${['runs', 'light', 'shape', 'age'].map(group).join('')}${more ? ['signal', 'curve', 'white'].map(group).join('') : `<button type="button" class="lnk" data-more>Signal, curve, white…</button>`}</div>
	<div class="tools"><b class="cnt2 tnum">${countText()}</b>${clearBtn()}<span class="fill"></span>${tabs('arrange', 'Arrange by', ARRANGE)}${seg('preview', 'Starred spaces show', PREVIEWS, PI)}<span class="qg"><span class="gl">Draw</span>${quantSegs()}</span><span class="qg"><span class="gl">Limit</span>${seg('limit', 'Limit', LIMITS, LI)}</span>${seg('view', 'View', VIEWS, VI)}</div>` }
export const explain0 = () => EXPLAIN0

// ── studio: one toolbar of icon groups; filters gather in a sheet, active ones ride as chips ──
const studio = () => { const act = FACETS.flatMap(f => onOf(f.k).map(v => [f.k, v]))
	return `<div class="tb">${tabs('arrange', 'Arrange by', ARRANGE)}${seg('preview', 'Starred spaces show', PREVIEWS, PI)}<span class="qg"><span class="gl">Draw</span>${quantSegs()}</span><span class="qg"><span class="gl">Limit</span>${seg('limit', 'Limit', LIMITS, LI)}</span>
	<span class="fill"></span>${seg('view', 'View', VIEWS, VI)}
	<span class="tok"><button type="button" class="fbtn" data-open="filters" aria-expanded="${S.open === 'filters'}">${UI.filter}<span>Filters</span>${nOn() ? `<b class="badge tnum">${nOn()}</b>` : ''}</button>${S.open === 'filters' ? `<div class="pop sheet" role="dialog" aria-label="Filters">${FACETS.map(f => `<section class="sg"><header><b>${esc(f.label)}</b><small>${esc(f.q)}</small></header><div class="chips">${f.opts.map(o => chip(f.k, o, f.k !== 'runs')).join('')}</div></section>`).join('')}<p class="explain" id="explain">${EXPLAIN0}</p></div>` : ''}</span></div>
	${act.length || S.q ? `<div class="actv"><b class="cnt2 tnum">${countText()}</b>${act.map(([k, v]) => `<button type="button" class="achip" data-f="${k}" data-v="${v}" aria-label="Remove ${esc(nameOf(k, v))}">${esc(FK[k].label)}: ${esc(nameOf(k, v))}${UI.x}</button>`).join('')}${clearBtn()}</div>` : ''}` }

export const ctlHTML = () => ({ sentence, drawer, guide, studio })[S.bar]()
// the status bar – the workbench's read-outs; the right-hand items open upward, like an editor's
const sbItem = (key, icon, words, pop) => `<span class="tok sbi"><button type="button" class="t" data-open="${key}" aria-expanded="${S.open === key}">${icon}<span>${esc(words)}</span></button>${S.open === key ? `<div class="pop up" role="dialog" aria-label="${esc(words)}">${pop()}</div>` : ''}</span>`
export const sbarHTML = () => `<span class="sbi sw"><i class="dot"></i><b class="tnum" id="sbhex"></b><span id="sbgam"></span></span><span class="sbi tnum">${countText()}</span>${nOn() ? `<button type="button" class="sbi lnk2" data-reset>${nOn()} filter${nOn() > 1 ? 's' : ''} ×</button>` : ''}
	<span class="fill"></span>
	${sbItem('sb-quant', QI[S.quant], QTIP[S.quant][0], () => popHead('Draw every strip and plane…') + quantList())}
	${sbItem('sb-limit', LI[S.limit], LTIP[S.limit][0], () => popHead('Show colors as far as…') + limitList())}
	${sbItem('sb-prev', PI[S.preview], PREVIEWS.find(p => p[0] === S.preview)[1], () => popHead('Starred spaces show…') + PREVIEWS.map(([v, n, t]) => lensOpt('preview', v, [n, t], PI[v])).join(''))}
	${sbItem('sb-view', VI[S.view], VIEWS.find(v => v[0] === S.view)[1], () => popHead('View the catalog as…') + VIEWS.map(([v, n, t]) => lensOpt('view', v, [n, t], VI[v])).join(''))}`
// a popover must stay on screen – CSS anchors it under its word, this nudges it back from the right edge
export function placePops() { for (const p of document.querySelectorAll('.pop')) { p.style.translate = ''; if (innerWidth <= 896) continue   // phones: a fixed sheet, nothing to nudge
	const r = p.getBoundingClientRect(), over = r.right - (innerWidth - 12); if (over > 0) p.style.translate = `${-Math.min(over, r.left - 12)}px 0` } }
