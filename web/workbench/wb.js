// color-space.io workbench – the shared controller the three landing directions (Atlas, Guide,
// Studio) are built on. It adds no model of its own: the state, the catalog, its painters and the
// detail pane are the variants workshop's (variants-model · variants-catalog · variants-data). What
// it adds is what every direction must carry – the ambient orbit, the current-color chip, the
// filter stripe and its 'For' tags, the view controls, the vision lens, the language affordance,
// the pane's tabs (Space · LUT · Code · Share), the start-here tour and the agents block.
//
// Layout belongs to the directions. A page places hosts – [data-wb="chip"], "search", "tools",
// "brand", "orient", "stripe", "tags", "count", "view", "vision", "lang", "tour", "agents" – plus a
// #cat for the catalog and an #pane for the details (variants-catalog reads both ids), then calls
// boot(). Every host is filled from an exported render function, so a direction can also call
// them itself. Breakpoint: the pane is a side panel at ≥ 75rem and a modal dialog below.
import { S, setColor, RGB, hexNow, valsOf, gamutOf, GAMLABEL, GAMTIP, parseColor, clearAll, toggle, SPACES, classify, meta, countIf, nOn, disp } from '../js/variants-model.js'
import { catalogHTML, paintEntry, paneHTML, paintPane, paintSolid, PANE, esc } from '../js/variants-catalog.js'
import { countText, opt, chip, lensOpt, quantList, limitList, cellWords, TRY } from '../js/variants-bars.js'
import { FK, FACETS, QUANT, QFLAT, LIMITS, VIEWS, PREVIEWS, CAP, FAMILIES, PURPOSE, ARRANGE } from '../js/variants-data.js'
import { UI, QI, VI, PI, FI, LI, OI } from '../js/variants-icons.js'
import { setGLReady, hasPlaneGL, METRICS } from '../js/gl.js'
import { DEFAULT, rgbF, decOf, unit } from '../js/render.js'
import { clamp, hex, space, LUTOK, LUTTGT, pathToRgb } from '../js/core.js'
import { cube, CSS as CSS_FMT } from '../js/study-runtime.js'
import TOUR from '../js/tour.js'
import EDITORS, { cubeOpts, ffmpeg, SIZE_LABEL } from '../js/editors.js'
import { LENSES, defs as cvdDefs } from '../js/cvd.js'
import { track, view as trackView, load as trackLoad, EVENT } from '../js/track.js'

export { S, SPACES, meta, disp, esc, TOUR, EDITORS, FAMILIES }
const $ = id => document.getElementById(id), root = document.documentElement
const WIDE = matchMedia('(width >= 75rem)'), CALM = matchMedia('(prefers-reduced-motion: reduce)')
const store = { get: k => { try { return localStorage.getItem('wb.' + k) } catch { return null } }, set: (k, v) => { try { localStorage.setItem('wb.' + k, v) } catch {} } }
const pick = (v, list, d) => list.includes(v) ? v : d
const SITE = 'https://color-space.io'

// the workbench's own dials, beside the shared S
export const W = { z: clamp(+(store.get('z') ?? .35) || 0, 0, 1), cvd: 'none', tab: 'space', code: 'js', lutTo: null, lutEd: EDITORS[0].id, lutHi: false, tour: 0, tourOpen: false, persistent: false, follow: true, dock: null }

// ── the vocabulary the controls speak ──
// the filter stripe: alt.html's eight facets, its labels and option words, over the model's tests.
// ICC is not offered under Availability: every space exports a profile (icc kind() is non-null for
// all 162 – checked 2026-10-02), so it would narrow nothing
const STRIPE = [['runs', 'Availability', { glsl: 'GL' }], ['chn', 'Channels'], ['light', 'Range'], ['shape', 'Geometry'],
	['signal', 'Signal', { display: 'Display', scene: 'Scene' }], ['curve', 'Encoding'], ['white', 'White point'], ['age', 'Status', { current: 'Current' }]]
const QTIP = Object.fromEntries(QFLAT.map(([v, , t]) => [v, t]))
// alt's three swatch styles, as the shared painters' modes: smooth · steps · dots (the web-safe lattice)
const SWATCH = [['smooth', 'Smooth'], ['10', 'Steps'], ['web', 'Dots']].map(([v, n]) => [v, n, QTIP[v]])
// alt's three layouts, as the shared catalog's views: grid · rows · list (the spec sheet)
const LAYOUT = [['grid', 'Grid'], ['list', 'Rows'], ['table', 'List']].map(([v, n]) => [v, n, VIEWS.find(x => x[0] === v)[2]])
// the language affordance: English today, the rest listed and not yet selectable
// the quantization lens, as the atlas's own select speaks it (index.html QGROUPS · QTIP): its three groups
// and labels over variants-data's QUANT keys – one state, S.quant; the palette distance metric (gl.js
// METRICS, index.html MLABEL · MTIP) matters only for the nearest-entry palettes (index.html PALMODES)
const QSITE = { smooth: ['smooth', 'continuous, unquantized'], 10: ['10-step', '10 native-channel cell centers'], 20: ['20-step', '20 native-channel cell centers'],
	565: ['16-bit', '16-bit RGB565 depth'], jnd: ['JND', 'just-noticeable OKLab steps'], web: ['safe', '216 web-safe colors'], names: ['names', 'CSS named colors'],
	xkcd: ['xkcd', 'xkcd survey names'], tailwind: ['tailwind', 'Tailwind tokens'], pico8: ['pico-8', 'PICO-8 palette'], ansi: ['ANSI', 'terminal 256 palette'] }
const QGROUP = ['', 'steps', 'Palettes']   // QUANT's three groups, titled as the atlas titles them – the first unlabeled
const MSITE = { oklab: ['OKLab', 'modern perceptual distance'], de2000: ['ΔE2000', 'CIE industry standard'], de76: ['ΔE76', 'plain CIELAB distance'], redmean: ['Redmean', 'classic RGB heuristic'] }
export const PALMODES = new Set(['names', 'xkcd', 'tailwind', 'pico8', 'ansi'])
// the tour's stops, one word each for a strip (the full title is the button's tooltip and the card's heading)
const STOPW = ['Light', 'Measuring', 'The horseshoe', 'Screens', 'Controls', 'Perception', 'Modern', 'Video', 'Cameras', 'HDR', 'Paper']
const PLANNED = [['pt-BR', 'Português (Brasil)'], ['es', 'Español'], ['tr', 'Türkçe'], ['ja', '日本語'], ['zh-Hans', '简体中文'], ['th', 'ไทย'], ['ko', '한국어'], ['ru', 'Русский']]

// CSS Color 4 notation is the library's css.js table (CSS_FMT, via study-runtime) – one serializer for
// the atlas, the workbench and the MCP css tool; rec2020 is absent there on purpose (CSS's rec2020 is a
// pure 2.4 gamma, the library's carries the BT.2020 OETF – the same numbers would name a different color)

// the citation is the atlas's own: build-site bakes CITATION.cff into index.html's Cite plates
// (#citebib, #citeapa – GitHub's "Cite this repository" format); the Share tab reads them from there,
// once, when it first opens – one formatter, one source
let CITE = null
export const loadCite = () => CITE ??= fetch('../').then(r => r.ok ? r.text() : '').then(t => { const d = new DOMParser().parseFromString(t, 'text/html')
	return { bibtex: d.getElementById('citebib')?.textContent.trim() || '', apa: d.getElementById('citeapa')?.textContent.trim() || '' } }).catch(() => ({ bibtex: '', apa: '' }))
export const MCP = { npx: 'npx -y color-space mcp', claude: 'claude mcp add color-space -- npx -y color-space mcp',
	vscode: `code --add-mcp '{"name":"color-space","command":"npx","args":["-y","color-space","mcp"]}'`,
	json: '{\n  "mcpServers": {\n    "color-space": {\n      "command": "npx",\n      "args": ["-y", "color-space", "mcp"]\n    }\n  }\n}' }

// ── small renderers every direction composes ──
const seg = (key, label, items, icons) => `<div class="seg" role="group" aria-label="${label}">${items.map(([v, name, tip]) =>
	`<button type="button" data-set="${key}" data-v="${v}" data-k="${key}-${v}" aria-pressed="${S[key] === v}" title="${esc(name)} – ${esc(tip)}">${icons[v]}<span class="sr">${esc(name)}</span></button>`).join('')}</div>`
const COPYI = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="1.5"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>'
// a code plate – the site's terminal-black snip with its copy glyph; `hl` is pre-escaped highlighted markup
export const plate = (text, label, { hl, trk, wrap } = {}) => `<div class="snipwrap"><button class="cpyi" type="button" data-copy${trk ? ` data-trk="${trk}"` : ''} aria-label="Copy ${esc(label)}" title="Copy">${COPYI}</button><pre class="snip${wrap ? ' wrap' : ''}" tabindex="0" aria-label="${esc(label)}">${hl ?? esc(text)}</pre></div>`
// the site's snippet highlighter (index.html hilite): keywords, strings, numbers, a trailing comment
export const hilite = (code, cm = '//', q = "'") => code.split('\n').map(line => {
	const ci = cm ? line.indexOf(cm) : -1, com = ci < 0 ? '' : line.slice(ci)
	const src = esc(ci < 0 ? line : line.slice(0, ci)).replace(q === '"' ? /"[^"]*"/g : /'[^']*'/g, m => `\x01${m}\x02`)
		.replace(/\b(import|from)\b/g, '<span class="tok-k">$1</span>')
		.replace(/(?<![\w."'#-])-?\d+\.?\d*(?![\w])/g, '<span class="tok-n">$&</span>')
		.replace(/\x01([^\x02]*)\x02/g, '<span class="tok-s">$1</span>')
	return src + (com ? `<span class="tok-c">${esc(com)}</span>` : '') }).join('\n')

export const brandHTML = (sub = '') => `<a class="brand" href="../" title="The atlas – color-space.io"><b>color-space</b>${sub ? `<span class="n">${esc(sub)}</span>` : ''}</a>`
export const chipHTML = () => `<div class="cur" title="The current color – every space draws it"><span class="cdw"><input type="color" id="cpick" aria-label="Pick the current color"></span><input id="cval" spellcheck="false" autocomplete="off" enterkeyhint="done" aria-label="Current color – any CSS color, or a space's own numbers like cam16(60 40 50)"><span class="gam" id="gam"></span></div>`
export const searchHTML = (ph = 'Find a space') => `<label class="find${S.q ? ' has' : ''}" id="findw">${UI.search}<input id="q" type="search" autocomplete="off" spellcheck="false" placeholder="${esc(ph)}" aria-label="Search the spaces" value="${esc(S.q)}"><button class="qx" type="button" id="qx" aria-label="Clear the search">${UI.x}</button><kbd>/</kbd></label>`
const dark = () => root.dataset.theme === 'dark'
export const themeHTML = () => `<button class="ib" type="button" id="thm" aria-label="Switch light and dark" aria-pressed="${dark()}" title="${dark() ? 'Light' : 'Dark'}">${dark() ? UI.sun : UI.moon}</button>`
export const ghHTML = () => `<a class="ib" href="https://github.com/colorjs/color-space" target="_blank" rel="noopener" aria-label="GitHub repository" title="GitHub">${UI.gh}</a>`
export const toolsHTML = () => `<span class="tools1">${themeHTML()}${ghHTML()}</span>`
// the one orienting sentence – what a color space is, in the site's own FAQ words; no numbers
export const ORIENT = ['A color space is a coordinate system for color – axes, ranges and a rule tying the numbers to measurable light.', 'Each one here writes the current color its own way.']
export const orientHTML = () => `<p class="wb-orient">${ORIENT.join(' ')}</p>`
export const countHTML = () => `<span class="cnt2 tnum" aria-live="polite">${countText()}</span>`
// alt's filter stripe: one quiet text-select per facet, "Any" at rest; an option that would empty the catalog is disabled
const fopts = (k, on, words) => `<option value="">Any</option>${FK[k].opts.map(([v, name, tip]) => { const n = countIf(k, v)
	return `<option value="${v}" title="${esc(tip)}"${on === v ? ' selected' : ''}${n || on === v ? '' : ' disabled'}>${esc(words[v] || name)}</option>` }).join('')}`
const clearHTML = () => nOn() - S.F.for.size || S.q ? `<button type="button" class="lnk" data-wb-reset data-k="reset">Clear</button>` : ''
export const stripeHTML = () => STRIPE.map(([k, label, words = {}]) => { const on = [...S.F[k]][0] || ''
	return `<label class="fsel"><span>${label}</span><select data-wf="${k}" data-k="f-${k}"${on ? ' class="on"' : ''}>${fopts(k, on, words)}</select></label>` }).join('') + clearHTML()
// the same eight facets as Studio's cells: the facet's icon, then its label over the value (variants.css .cell)
export const cellsHTML = () => STRIPE.map(([k, label, words = {}]) => { const on = [...S.F[k]][0] || ''
	return `<label class="cell wb-cell${on ? ' on' : ''}"><span class="ci">${FI[FK[k].icon] || ''}</span><span class="cw"><small>${label}</small><select data-wf="${k}" data-k="c-${k}">${fopts(k, on, words)}</select></span></label>` }).join('') + clearHTML()
// the ten task tags – pills, any number on (a space matching one of them stays)
export const tagsHTML = () => `<span class="fsel-l" id="wb-for">For</span><span class="wb-tagrow" role="group" aria-labelledby="wb-for">${FK.for.opts.map(([v, name, tip]) => { const on = S.F.for.has(v), n = countIf('for', v)
	return `<button type="button" class="tag" data-wf="for" data-v="${v}" data-k="t-${v}" aria-pressed="${on}" title="${esc(tip)} – ${n} spaces"${n || on ? '' : ' disabled'}>${esc(name)}</button>` }).join('')}</span>`
// alt's view controls: size A–A, swatch style, layout – and what the featured spaces preview
export const sizeHTML = () => `<label class="wb-size" title="Size"><span class="a0" aria-hidden="true">A</span><input type="range" min="0" max="1" step=".05" value="${W.z}" data-wv="z" data-k="v-z" aria-label="Size of the catalog"><span class="a1" aria-hidden="true">A</span></label>`
export const swatchHTML = () => seg('quant', 'Swatch style', SWATCH, QI)
export const layoutHTML = () => seg('view', 'Layout', LAYOUT, VI)
export const previewHTML = () => seg('preview', 'Featured spaces show', PREVIEWS, PI)
export const viewHTML = () => sizeHTML() + swatchHTML() + layoutHTML() + previewHTML()
// how the shelves are cut – the ladder's foot (index.html's .gtabs) and the View menu's first group; A–Z stays the sheet's
const CUTS = ARRANGE.filter(([v]) => v !== 'name'), CUTI = { family: OI.compositing, purpose: FI.task, era: FI.age },
	CUTTIP = { family: 'what each space is – its lineage', purpose: 'what each space is for', era: 'when each space was born, newest first' }
export const arrangeHTML = () => CUTS.map(([v, n]) => `<button type="button" class="gtag${S.arrange === v ? ' on' : ''}" data-set="arrange" data-v="${v}" data-k="g-${v}" aria-pressed="${S.arrange === v}" title="${esc(CUTTIP[v])}">${esc(n)}</button>`).join('')
// the quantization lens – ONE select, the atlas's groups and words (QSITE); a palette adds its distance metric
export const quantHTML = () => `<label class="fsel wb-quant"><span>Quantize</span><select data-wset="quant" data-k="quant"${S.quant !== 'smooth' ? ' class="on"' : ''} aria-label="Quantize – how strips and planes are drawn" title="${esc(QFLAT.map(([v]) => `${QSITE[v][0]} – ${QSITE[v][1]}`).join('\n'))}">${QUANT.map(([, o], g) => {
	const opts = o.map(([v]) => `<option value="${v}" title="${esc(QSITE[v][1])}"${S.quant === v ? ' selected' : ''}>${esc(QSITE[v][0])}</option>`).join('')
	return QGROUP[g] ? `<optgroup label="${QGROUP[g]}">${opts}</optgroup>` : opts }).join('')}</select></label>`
export const metricHTML = () => `<label class="fsel wb-metric"${PALMODES.has(S.quant) ? '' : ' hidden'}><span>Distance</span><select data-wset="metric" data-k="metric" aria-label="Palette distance metric" title="${esc(METRICS.map(m => `${MSITE[m][0]} – ${MSITE[m][1]}`).join('\n'))}">${METRICS.map(m => `<option value="${m}" title="${esc(MSITE[m][1])}"${S.metric === m ? ' selected' : ''}>${esc(MSITE[m][0])}</option>`).join('')}</select></label>`
// how far a color may reach before strips and planes dim it (variants-data LIMITS)
export const limitHTML = () => `<label class="fsel wb-limit"><span>Limit</span><select data-wset="limit" data-k="limit" aria-label="Gamut limit" title="${esc(LIMITS.map(([, n, t]) => `${n} – ${t}`).join('\n'))}">${LIMITS.map(([v, n, t]) => `<option value="${v}" title="${esc(t)}"${S.limit === v ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select></label>`
// the vision lens – a color-vision-deficiency simulation over the whole page (cvd.js filters)
export const visionHTML = () => `<label class="fsel"><span>Vision</span><select data-wb-cvd data-k="cvd">${LENSES.map(l => `<option value="${l.id}"${l.cite ? ` title="${esc(l.cite)}"` : ''}${W.cvd === l.id ? ' selected' : ''}>${esc(l.label)}</option>`).join('')}</select></label>`
export const langHTML = () => `<label class="fsel wb-lang"><span class="sr">Language</span><select data-wb-lang data-k="lang" title="Language – more are planned"><option value="en" lang="en" selected>EN</option>${PLANNED.map(([c, n]) => `<option value="${c}" lang="${c}" disabled>${esc(n)} – planned</option>`).join('')}</select></label>`
// the tour as a numbered strip – a stop's number opens its card ([data-wb="stop"]), again folds it
export const stopsHTML = () => `<ol class="wb-stops" aria-label="Start here – a tour in ${TOUR.length} stops">${TOUR.map((st, i) => { const on = W.tourOpen && W.tour === i
	return `<li><button type="button" data-stop="${i}" data-k="stop-${i}" aria-expanded="${on}"${on ? ' aria-current="step"' : ''} title="${esc(st.t)}"><span class="tnum">${i + 1}</span>${esc(STOPW[i] || disp(st.s))}</button></li>` }).join('')}</ol>`

// five colors to try – variants.html Studio's swatches; a click makes one the current color
export const tryHTML = () => `<span class="try" role="group" aria-label="Try a color"><span>Try</span>${TRY.map(([c, n]) => `<button type="button" data-wtry="${esc(c)}" title="${esc(n)}" style="--sw:${esc(c)}"><span class="sr">${esc(n)}</span></button>`).join('')}</span>`

// ── the drawer: variants.html's labeled cells – each facet and lens its icon, its label over the value – whose
// illustrated options open in a menu under the cell (a popover; the cell is its anchor), not across the page.
// drawerHTML() and menusHTML() are written once: the cells and the popovers must persist – a cell is its open
// menu's anchor – so what changes re-renders inside them, in hosts: [data-wb="cell"][data-m=<key>] a cell's
// face, [data-wb="menu"][data-m=<key>] a menu's header and options, [data-wb="dclear"] the Clear link.
// A menu re-renders in place: it stays open while you pick. 'More' holds every facet as a section – a page
// shows only the sections of the facet cells its row has no room for (CSS: the cells' data-k, the sections' data-m)
const VISW = { none: 'Typical', protan: 'Protan', deutan: 'Deutan', tritan: 'Tritan' }   // the field's short names – the menu says them whole
const LENSES_D = { quant: ['Draw', () => QI[S.quant], () => QFLAT.find(q => q[0] === S.quant)[1], () => S.quant !== 'smooth'],
	limit: ['Limit', () => LI[S.limit], () => LIMITS.find(l => l[0] === S.limit)[1], () => S.limit !== 'locus'],
	vision: ['Vision', () => UI.eye, () => VISW[W.cvd], () => W.cvd !== 'none'],
	view: ['View', () => VI[S.view], () => LAYOUT.find(l => l[0] === S.view)[1], () => false] }
const DRAWS = [...FACETS.map(f => f.k), 'more', ...Object.keys(LENSES_D)]
export const drawerHTML = () => DRAWS.map(k => `${k === 'quant' ? '<span class="fill"></span>' : ''}<button type="button" class="cell wb-dcell" popovertarget="wd-${k}" data-k="d-${k}" aria-expanded="false"><span data-wb="cell" data-m="${k}"></span></button>`).join('')
const face = (icon, label, words, on) => `<span class="ci">${icon}</span><span class="cw"><small>${esc(label)}</small><b${on ? ' class="on"' : ''}>${esc(words)}</b></span>${UI.chev}`
export const cellHTML = k => FK[k] ? face(FI[FK[k].icon], FK[k].label, cellWords(FK[k]), S.F[k].size) : k === 'more' ? face(UI.filter, 'More', 'Filters')
	: (([label, icon, words, on]) => face(icon(), label, words(), on()))(LENSES_D[k])
export const dclearHTML = () => nOn() || S.q ? `<button type="button" class="lnk" data-wb-reset data-k="reset">Clear</button>` : ''
const mhead = (k, q, hint, any) => `<header class="dh2"><div><b id="wd-${k}-t">${esc(q)}</b><small>${esc(hint)}</small></div>${any ? `<button type="button" class="lnk" data-wclear="${k}" data-k="m-${k}-any">Any</button>` : ''}<button type="button" class="ib" popovertarget="wd-${k}" popovertargetaction="hide" data-k="m-${k}-x" aria-label="Close">${UI.x}</button></header>`
const mgroup = (label, items) => `<div class="optg"><span class="gl">${esc(label)}</span>${items}</div>`
const PICKANY = 'Pick any – a space that matches one of them stays.'
// a vision option's icon is a hue wheel seen through that lens's own filter – what it does to color, at a glance
const VISTIP = { none: 'no simulation – the page as your eyes see it', protan: 'no long-wavelength cones – reds darken and merge with greens',
	deutan: 'no medium-wavelength cones – reds and greens merge', tritan: 'no short-wavelength cones – blue merges with green, yellow with pink' }
const visOpt = l => `<button type="button" class="opt" data-wcvd="${l.id}" data-k="m-vision-${l.id}" aria-pressed="${W.cvd === l.id}" data-tip="${esc(l.label)} – ${esc(VISTIP[l.id])}"><span class="oi"><i class="wdot wb-hues"${l.id === 'none' ? '' : ` style="filter:url(#cvd-${l.id})"`}></i></span><span class="ot"><b>${esc(l.label)}</b><small>${esc(VISTIP[l.id])}${l.cite ? ` · ${esc(l.cite.replace(/, (severity|doi).*$/, ''))}` : ''}</small></span></button>`
export const menuHTML = k => FK[k] ? mhead(k, FK[k].q, PICKANY, S.F[k].size) + `<div class="cards${FK[k].opts.length > 3 ? ' c2' : ''}">${FK[k].opts.map(o => opt(k, o)).join('')}</div>`
	: k === 'more' ? mhead(k, 'More filters', PICKANY) + FACETS.map(f => `<section class="sg wb-msec" data-m="${f.k}" aria-label="${esc(f.label)}"><header><b>${esc(f.label)}</b> <small>${esc(f.q)}</small>${S.F[f.k].size ? ` <button type="button" class="lnk" data-wclear="${f.k}" data-k="m-more-${f.k}-any">Any</button>` : ''}</header><div class="chips">${f.opts.map(o => chip(f.k, o)).join('')}</div></section>`).join('')
	: k === 'quant' ? mhead(k, 'Draw every strip and plane…', 'Smooth shows every value; steps and palettes show what survives quantizing.') + `<div class="cards wb-mcols">${quantList()}${PALMODES.has(S.quant) ? mgroup('Distance', METRICS.map(m => lensOpt('metric', m, MSITE[m], '')).join('')) : ''}</div>`
	: k === 'limit' ? mhead(k, 'Show colors as far as…', 'Past the limit a color dims, and what no light can be is cut.') + `<div class="cards">${limitList()}</div>`
	: k === 'vision' ? mhead(k, 'See the page as…', 'A color-vision deficiency, simulated over the whole page in linear light – readouts keep the true color.') + `<div class="cards c2">${LENSES.map(visOpt).join('')}</div>`
	: k === 'view' ? mhead(k, 'View the catalog as…', 'How the shelves are cut, the layout, and what the featured spaces show.') + `<div class="cards wb-mcols">${mgroup('Shelves by', CUTS.map(([v, n]) => lensOpt('arrange', v, [n, CUTTIP[v]], CUTI[v])).join(''))}${mgroup('Layout', LAYOUT.map(([v, n, t]) => lensOpt('view', v, [n, t], VI[v])).join(''))}${mgroup('Featured spaces show', PREVIEWS.map(([v, n, t]) => lensOpt('preview', v, [n, t], PI[v])).join(''))}</div>`
		+ `<section class="sg wb-msec" data-m="vision" aria-label="Vision"><header><b>Vision</b> <small>See the page as…</small></header><div class="cards c2">${LENSES.map(visOpt).join('')}</div></section>`   // where the row has no room for Vision's cell (CSS), View holds it
	: ''
export const menusHTML = (keys = DRAWS) => keys.map(k => `<div class="wb-dpop" id="wd-${k}" popover role="dialog" aria-labelledby="wd-${k}-t"><div data-wb="menu" data-m="${k}"></div></div>`).join('')

// the start-here tour: eleven stops from light to ink, each one a space already in the catalog
export const tourHTML = (i = W.tour) => { const st = TOUR[i], n = TOUR.length
	return `<section class="wb-tour" aria-labelledby="wb-tour-t">
	<p class="wb-eyebrow">Start here <span class="tnum">· stop ${i + 1} of ${n}</span></p>
	<h2 class="wb-tour-t" id="wb-tour-t">${esc(st.t)}</h2>
	<p class="wb-tour-d">${esc(st.d)}</p>
	<div class="wb-tour-nav"><button type="button" class="ib" data-wt="-1" data-k="wt-prev" aria-label="Previous stop"${i ? '' : ' disabled'}>${UI.prev}</button><button type="button" class="nm" data-wt="open" data-k="wt-open">${esc(disp(st.s))}</button><span class="fill"></span><button type="button" class="ib" data-wt="1" data-k="wt-next" aria-label="Next stop"${i < n - 1 ? '' : ' disabled'}>${UI.next}</button></div>
</section>` }

// agents: the MCP server, installed the ways the README documents
export const agentsHTML = ({ title = true } = {}) => `<section class="wb-agents"${title ? ' aria-labelledby="wb-ag-t"' : ''}>${title ? `
	<h2 id="wb-ag-t">Agents</h2>` : ''}
	<p class="wb-note">An MCP server – convert · gamut · css · space · spaces · cube – so an agent calls verified conversions instead of guessing them.</p>
	<dl class="wb-cmds">
		<div><dt>Claude Code</dt><dd>${plate(MCP.claude, 'Claude Code command', { wrap: true })}</dd></div>
		<div><dt>VS Code</dt><dd>${plate(MCP.vscode, 'VS Code command', { wrap: true })}</dd></div>
		<div><dt>Claude Desktop · Cursor · <code>.mcp.json</code></dt><dd>${plate(MCP.json, 'MCP config', { hl: hilite(MCP.json, '', '"') })}<p class="wb-note">In <code>claude_desktop_config.json</code>, <code>.cursor/mcp.json</code> or a project's <code>.mcp.json</code>.</p></dd></div>
		<div><dt>Any MCP client</dt><dd>${plate(MCP.npx, 'MCP server command', { wrap: true })}</dd></div>
	</dl>
</section>`

const R = { brand: () => brandHTML(), chip: chipHTML, search: () => searchHTML(), tools: toolsHTML, theme: themeHTML, gh: ghHTML, orient: orientHTML, count: countHTML,
	stripe: stripeHTML, cells: cellsHTML, tags: tagsHTML, view: viewHTML, size: sizeHTML, swatch: swatchHTML, layout: layoutHTML, preview: previewHTML,
	quant: quantHTML, metric: metricHTML, limit: limitHTML, vision: visionHTML, lang: langHTML, stops: stopsHTML, stop: () => W.tourOpen ? tourHTML() : '', tour: () => tourHTML(), agents: () => agentsHTML(),
	try: tryHTML, cell: el => cellHTML(el.dataset.m), menu: el => menuHTML(el.dataset.m), dclear: dclearHTML, arrange: arrangeHTML }   // a renderer gets its host – a cell or a menu reads which one it is
const VIEWK = ['view', 'size', 'swatch', 'layout', 'preview', 'quant', 'metric', 'limit', 'cell', 'menu', 'arrange']   // the hosts a view/lens change re-renders
/** Fill every host under `el` (a page that mounts controls after boot – Atlas's top variants). */
export function fill(el = document) { for (const h of el.querySelectorAll('[data-wb]')) if (R[h.dataset.wb]) h.innerHTML = R[h.dataset.wb](h); paintCur() }
// re-render hosts in place; a control that had focus gets it back (by its data-k, in the same host first – a
// page may show a control twice) – or, gone, the first control of its host
export function refresh(...names) { const a = document.activeElement, h = a?.closest?.('[data-wb]'), k = h && a.dataset.k
	for (const name of names) for (const el of document.querySelectorAll(`[data-wb="${name}"]`)) el.innerHTML = R[name](el)
	if (!k) return; const sel = `[data-k="${CSS.escape(k)}"]`, el = (h.isConnected && h.querySelector(sel)) || document.querySelector(`[data-wb] ${sel}`)
	;(el && !el.disabled ? el : (el?.closest('[data-wb]') || h).querySelector('button:not(:disabled),select,input'))?.focus({ preventScroll: true }) }

// ── the current color: authored, or the ambient orbit until something is ──
// text ON the current color takes whichever ink contrasts more (WCAG 2.x relative luminance) – variants.js's rule
const wlum = c => c.map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0)
const textInk = c => { const L = wlum(c); return 1.05 / (L + 0.05) >= (L + 0.05) / 0.06 ? '#fff' : 'var(--dark)' }
function paintCur() { const h = hexNow(), g = gamutOf()
	root.style.setProperty('--cur', h); root.style.setProperty('--cur-ink', textInk(RGB))
	const cp = $('cpick'), cv = $('cval'), gm = $('gam')
	if (cp) cp.value = h.toLowerCase()
	if (cv && document.activeElement !== cv) { cv.value = g === 'srgb' ? h : `${S.space}(${S.vals.map(v => +(+v).toFixed(4)).join(' ')})`; cv.removeAttribute('aria-invalid') }
	if (gm) { gm.textContent = GAMLABEL[g]; gm.title = GAMTIP[g]; gm.dataset.g = g } }
let hashT = 0
/** Set the current color. `authored` (any person's input) stops the orbit and writes the URL hash. */
let authoredC = false   // has a person chosen the color? only then does the URL carry it
export function color(s, vals, { from, authored = true } = {}) {
	if (authored) { stopOrbit(); authoredC = true }
	setColor(s, vals); paintCur(); dirty(); if (from) paintEntry(from, 24)
	if (authored) { paintPane(true); refreshCode(); clearTimeout(hashT); hashT = setTimeout(writeURL, 250) }
	else if (S.sel && performance.now() - paneT > 180) { paneT = performance.now(); paintPane(true) }
	document.dispatchEvent(new CustomEvent('wb:color', { detail: { authored } })) }   // a direction's own live readouts listen
let paneT = 0

// the ambient orbit – index.html's, constant for constant: L holds near the boot gray's OKLab L with
// a small 2-cycle wobble, chroma fades in from 0 over AUTO_FADE and breathes on a 3-cycle, the hue
// walks the wheel once per AUTO_PERIOD. Any authored input stops it; a device that cannot hold the
// cadence parks it once colored; reduced motion never starts it and shows the brand accent instead
const AUTO_FRAME = 50, AUTO_PERIOD = 45000, AUTO_FADE = 2200
const AUTO_L = space.rgb.oklab(...rgbF(DEFAULT.s, DEFAULT.vals))[0]
const REST = [0.69, 0.16, 42]   // tokens.css --color-accent, oklch(0.69 0.16 42) – the still frame under reduced motion
let orbit = false, oStart = 0, oLast = 0, oSlow = 0, pdown = false
function orbitStep(t) { if (!orbit) return
	if (!pdown && t - oLast >= AUTO_FRAME) { oSlow = t - oLast > AUTO_FRAME * 5 ? oSlow + 1 : 0; oLast = t
		const el = t - oStart, w = clamp(el / AUTO_FADE, 0, 1), h = el / AUTO_PERIOD * 360 % 360, r = h * Math.PI / 180
		color('oklch', [AUTO_L + 0.08 * Math.sin(2 * r) * w, (0.16 + 0.05 * Math.sin(3 * r)) * w, h], { authored: false })
		if (oSlow >= 4 && w === 1) return }
	requestAnimationFrame(orbitStep) }
function startOrbit() { if (CALM.matches) { setColor('oklch', REST); return } orbit = true; oStart = oLast = performance.now(); requestAnimationFrame(orbitStep) }
export function stopOrbit() { orbit = false }
export const orbiting = () => orbit

// ── painting only what is on screen; a color change dirties everything, visible first ──
const vis = new Set(), todo = new Set(); let raf = 0, drag = null
const IO = new IntersectionObserver(es => { for (const e of es) { if (e.isIntersecting) { vis.add(e.target); if (!e.target._clean) queue(e.target) } else vis.delete(e.target) } }, { rootMargin: '400px 0px' })
const queue = el => { todo.add(el); raf ||= requestAnimationFrame(flush) }
function flush() { raf = 0; const t0 = performance.now(), n = drag || orbit ? 12 : 24
	for (const el of todo) { todo.delete(el); if (el.isConnected && !el._clean) paintEntry(el, n); if (performance.now() - t0 > 14) { raf = requestAnimationFrame(flush); return } } }
// entries outside the catalog – a direction's specimens, a tour's strips – live in [data-wb-live] hosts and repaint with it
const LIVE = '#cat .sp,[data-wb-live] .sp'
function dirty() { for (const el of document.querySelectorAll(LIVE)) el._clean = false; for (const el of vis) queue(el) }
/** Paint a host's entries (.sp[data-s]) the way the catalog's are: while on screen, again on every color change. */
export function live(host) { host.setAttribute('data-wb-live', ''); for (const el of host.querySelectorAll('.sp')) { el._clean = false; IO.observe(el) } }
const slug = t => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
/** Re-render the catalog into #cat (shelves get ids `shelf-<name>` – the anchors a title ladder needs). */
export function renderCat() { const cat = $('cat'); if (!cat) return
	IO.disconnect(); vis.clear(); todo.clear(); cat.innerHTML = catalogHTML()
	for (const sh of cat.querySelectorAll('.shelf')) sh.id = 'shelf-' + slug(sh.getAttribute('aria-label'))
	for (const el of document.querySelectorAll(LIVE)) IO.observe(el) }
const filtered = () => { renderCat(); refresh('stripe', 'cells', 'tags', 'count', 'cell', 'menu', 'dclear') }
// the vision lens: one filter over the whole page (cvd.js, :root[data-cvd]); the cell, its menu and any select follow
function vision(id) { W.cvd = id; id === 'none' ? delete root.dataset.cvd : root.dataset.cvd = id; refresh('vision', 'cell', 'menu') }
/** Set a shared view/model key (arrange · view · preview · quant · metric · limit) and repaint what it touches.
 *  The quantization lens and its metric are session-only and ride the URL (?q= · ?m=, the atlas's grammar) –
 *  a stored lens reads as broken sliders a week later (index.html's reason); view and preview are stored. */
export function set(key, v) { S[key] = v; if (['view', 'preview'].includes(key)) store.set(key, v)
	if (['arrange', 'view', 'preview'].includes(key)) renderCat(); else { dirty(); paintPane(true) }
	if (key === 'quant' || key === 'metric') writeURL()
	refresh(...VIEWK); document.dispatchEvent(new CustomEvent('wb:set', { detail: { key, v } })) }

// ── the pane: a side panel at ≥ 75rem, a modal dialog below; Esc closes, focus returns ──
let back = null, scrim = null, inerted = []
const TABS = [['space', 'Space'], ['lut', 'LUT'], ['code', 'Code'], ['share', 'Share']]
/** Open a space's details. `focus`: move focus into the pane (always when it is a dialog). */
// W.dock (boot's `dock` option) replaces the pane with a page's own details host – { open(s, { focus }), close() } –
// while S.sel, the URL, the catalog's highlight, prev/next and focus return stay this code's (Atlas docks the live dossier)
export function openPane(s, { from, focus = true, url = true, scroll = true } = {}) { if (!SPACES.includes(s)) return
	if (!S.sel) back = from || document.activeElement
	S.sel = s
	if (W.dock) W.dock.open(s, { focus })
	else { const pane = $('pane'); paneFill(s); pane.hidden = false; pane.scrollTop = 0; document.body.classList.add('paneon'); modalize() }
	document.querySelectorAll('#cat .sp').forEach(el => el.classList.toggle('on', el.dataset.s === s))
	if (!W.dock) { paintPane(true); if (focus || !WIDE.matches) $('ptitle')?.focus({ preventScroll: true }) }
	if (scroll) document.querySelector(`#cat .sp[data-s="${CSS.escape(s)}"]`)?.scrollIntoView({ block: 'nearest', behavior: CALM.matches ? 'auto' : 'smooth' })   // the catalog follows the pane
	if (url) { writeURL(); trackView(s, disp(s)) } }
export function closePane() { if (!S.sel || W.persistent && WIDE.matches) return
	S.sel = null
	if (W.dock) W.dock.close(); else { const pane = $('pane'); pane.hidden = true; pane.innerHTML = ''; document.body.classList.remove('paneon'); modalize() }
	document.querySelectorAll('#cat .sp.on').forEach(el => el.classList.remove('on')); writeURL()
	if (back?.isConnected) back.focus({ preventScroll: true }); back = null }
const go = d => { const list = [...document.querySelectorAll('#cat .sp')].map(e => e.dataset.s), k = list.indexOf(S.sel); if (k < 0 || !list[k + d]) return
	openPane(list[k + d], { focus: false, scroll: W.follow }); const b = $('pane')?.querySelector(`[data-go="${d}"]`); (b && !b.disabled ? b : $('ptitle'))?.focus({ preventScroll: true }) }
function modalize() { const pane = $('pane'); if (!pane || W.dock) return; const m = !WIDE.matches && !!S.sel
	pane.setAttribute('role', m ? 'dialog' : 'complementary'); pane.setAttribute('aria-labelledby', 'ptitle')
	m ? pane.setAttribute('aria-modal', 'true') : pane.removeAttribute('aria-modal'); if (scrim) scrim.hidden = !m
	for (const el of inerted) el.inert = false; inerted = []
	if (m) for (let n = pane; n.parentElement && n !== document.body; n = n.parentElement)
		for (const sib of n.parentElement.children) if (sib !== n && sib !== scrim && sib.id !== 'toast' && !sib.inert) { sib.inert = true; inerted.push(sib) } }

const sizeOf = (ed) => ed.sizes.includes(65) && W.lutHi ? 65 : ed.sizes[0]
function paneFill(s) {
	const pane = $('pane'); pane.innerHTML = paneHTML(s)
	const ph = pane.querySelector('.ph'), rest = [...pane.childNodes].filter(n => n !== ph)
	if (W.persistent && WIDE.matches) ph.querySelector('[data-close]')?.remove()
	pane.querySelector('#ptitle').tabIndex = -1
	const tabs = TABS.filter(([k]) => k !== 'lut' || LUTOK.has(s)); if (!tabs.some(([k]) => k === W.tab)) W.tab = 'space'
	ph.insertAdjacentHTML('afterend', `<div class="tabs wb-ptabs" role="tablist" aria-label="${esc(disp(s))} details">${tabs.map(([k, l]) =>
		`<button type="button" role="tab" id="wbt-${k}" aria-controls="wbp-${k}" aria-selected="${W.tab === k}" tabindex="${W.tab === k ? 0 : -1}" data-wtab="${k}">${l}</button>`).join('')}</div>`
		+ tabs.map(([k]) => `<section class="wb-panel" role="tabpanel" id="wbp-${k}" aria-labelledby="wbt-${k}" tabindex="-1"${W.tab === k ? '' : ' hidden'}></section>`).join(''))
	const sp = pane.querySelector('#wbp-space'); sp.append(...rest)
	// the dossier's "origin · reference" column takes the space's cited references
	const refs = meta[s].refs || []
	if (refs.length) sp.querySelector('.props > div:last-child')?.insertAdjacentHTML('beforeend', `<i>Reference</i><p class="wb-refs">${refs.map(u => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(host(u))}</a>`).join(', ')}</p>`)
	fillTab(W.tab) }
const host = u => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return u } }
function selectTab(k, focus) { W.tab = k; const pane = $('pane')
	for (const b of pane.querySelectorAll('[role="tab"]')) { const on = b.dataset.wtab === k; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus() }
	for (const p of pane.querySelectorAll('[role="tabpanel"]')) p.hidden = p.id !== 'wbp-' + k
	fillTab(k); if (k === 'space') paintPane(true) }
function fillTab(k) { const p = $('wbp-' + k), s = S.sel; if (!p || !s) return
	if (k === 'lut') p.innerHTML = lutHTML(s)
	if (k === 'code') { p.innerHTML = codeHTML(s); paintCode() }
	if (k === 'share') { p.innerHTML = shareHTML(s); paintCite() } }

// ── LUT: the creator flow – camera log (this space) → target → editor → a plain 3D .cube + that editor's steps ──
const targetDefault = s => meta[s]?.referred === 'scene' && s !== 'rec709' ? 'rec709' : s === 'rgb' ? 'p3' : 'rgb'   // the dossier's own default
const targets = s => FAMILIES.map(f => [f.name, f.spaces.filter(t => t !== s && LUTTGT.has(t) && SPACES.includes(t))]).filter(([, l]) => l.length)
const lutState = s => { const all = targets(s).flatMap(([, l]) => l), to = all.includes(W.lutTo) ? W.lutTo : all.includes(targetDefault(s)) ? targetDefault(s) : all[0]
	const ed = EDITORS.find(e => e.id === W.lutEd) || EDITORS[0], size = sizeOf(ed); return { to, ed, size, file: `${s}-to-${to}-${size}.cube` } }
// the flow also runs inline: a host [data-wl-from="<space>"] holds it outside the pane, for that source; with
// data-wl-pick it opens on a camera-log select – the log encodings a .cube can carry, shelved for grading
const lutHost = t => t.closest('[data-wl-from]')
const cams = () => FAMILIES.map(f => [f.name, f.spaces.filter(t => LUTOK.has(t) && meta[t]?.encoding === 'log' && PURPOSE[t]?.includes('grading') && SPACES.includes(t))]).filter(([, l]) => l.length)
function relut(t, k) { const h = lutHost(t); if (h) h.innerHTML = lutHTML(h.dataset.wlFrom, h.hasAttribute('data-wl-pick')); else fillTab('lut')
	;(h || $('wbp-lut'))?.querySelector(`[data-wl="${k}"]`)?.focus() }
/** The LUT flow for a source space: what to make (target · editor · size · download), then how (that editor's steps). */
export function lutHTML(s, pick = false) { const { to, ed, size, file } = lutState(s), ok = !!cubeOpts(ed, size)
	const steps = ed.steps.map((t, i) => ed.id === 'ffmpeg' && !i ? `<li>${plate(ffmpeg(file), 'ffmpeg command', { wrap: true })}</li>` : `<li>${esc(t)}</li>`).join('')
	return `<div class="wb-lut-do"><p class="wb-note">A conversion LUT turns footage recorded in ${esc(disp(s))} into the target, inside an editor's LUT slot – one plain 3D .cube.</p>
	<div class="wb-form">
		${pick ? `<label class="wb-field"><span>Camera log</span><select data-wl="from">${cams().map(([g, l]) => `<optgroup label="${esc(g)}">${l.map(t => `<option value="${t}"${t === s ? ' selected' : ''}>${esc(disp(t))}</option>`).join('')}</optgroup>`).join('')}</select></label>` : ''}
		<label class="wb-field"><span>Target</span><select data-wl="to">${targets(s).map(([g, l]) => `<optgroup label="${esc(g)}">${l.map(t => `<option value="${t}"${t === to ? ' selected' : ''}>${esc(disp(t))}</option>`).join('')}</optgroup>`).join('')}</select></label>
		<label class="wb-field"><span>Editor</span><select data-wl="ed">${EDITORS.map(e => `<option value="${e.id}"${e === ed ? ' selected' : ''}>${esc(e.name)}</option>`).join('')}</select></label>
		${ed.sizes.includes(65) ? `<label class="wb-check"><input type="checkbox" data-wl="hi"${W.lutHi ? ' checked' : ''}> 65³ – ${SIZE_LABEL[65]}</label>` : ''}
	</div>
	<div class="wb-dlrow"><button type="button" class="wb-btn" data-wl="dl"${ok ? '' : ' disabled'}>Download .cube</button><span class="wb-file tnum">${ok ? `${esc(file)} · ${size}³ ${SIZE_LABEL[size] || ''}` : `${esc(ed.name)} takes no .cube file`}</span></div></div>
	<div class="wb-lut-how"><h3 class="wb-h">In ${esc(ed.name)}</h3>
	<ol class="wb-steps">${steps}</ol>
	${ed.notes?.length ? `<ul class="wb-notes">${ed.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
	<p class="wb-src">Source: <a href="${esc(ed.source)}" target="_blank" rel="noopener">${esc(host(ed.source))}</a> · ${esc(ed.platforms.join(', '))}</p></div>` }
function downloadLUT(btn) { const s = lutHost(btn)?.dataset.wlFrom || S.sel, { to, ed, size, file } = lutState(s), opts = cubeOpts(ed, size); if (!opts) return
	btn.disabled = true; btn.setAttribute('aria-busy', 'true'); btn.textContent = 'Preparing…'
	setTimeout(() => { try { save(cube(space[s], space[to], opts), file, 'text/plain'); toast('LUT saved'); track(EVENT.lut(s, to)) }
		catch { toast('No LUT for this pair') }
		btn.disabled = false; btn.removeAttribute('aria-busy'); btn.textContent = 'Download .cube' }, 30) }
const save = (body, name, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type })); a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000) }

// ── Code: the space in each runtime it ships in – JS always, WASM / GL / CSS where they exist, Python lazily ──
const LANGS = [['js', 'JS'], ['wasm', 'WASM'], ['gl', 'GL'], ['css', 'CSS'], ['py', 'Python']]
const hasLang = (s, k) => k === 'js' || k === 'py' || (k === 'wasm' && CAP.wasm.has(s)) || (k === 'gl' && CAP.glsl.has(s)) || (k === 'css' && s in CSS_FMT)
const prop = s => /^[a-z_$][\w$]*$/i.test(s) ? `.${s}` : `['${s}']`, camel = s => s.replace(/-(\w)/g, (_, c) => c.toUpperCase())
const num = (v, c) => unit(c) === '%' ? (+v).toFixed(1) : (+(+v).toFixed(decOf(c))).toString()
const tup = s => valsOf(s).map((x, i) => num(x, meta[s].channels[i])).join(', ')
let PY = null
/** The Python equivalents (python.js), loaded once, on first need. */
export const loadPY = () => PY ? Promise.resolve(PY) : import('../js/python.js').then(m => (PY = m))
function codeHTML(s) { if (!hasLang(s, W.code)) W.code = 'js'
	return `<div class="tabs wb-langs" role="group" aria-label="Language">${LANGS.filter(([k]) => hasLang(s, k)).map(([k, l]) => `<button type="button" data-wcode="${k}" aria-pressed="${W.code === k}">${l}</button>`).join('')}</div><div class="wb-codeout"></div>` }
/** A space's code in one runtime (js · wasm · gl · css · py) at the current color – [code, comment marker]. */
export function snippet(s, k) { const c = meta[s].channels, rgb = RGB.map(Math.round)
	if (k === 'js') { if (s === 'rgb') { const ok = valsOf('oklch').map((x, i) => num(x, meta.oklch.channels[i])).join(', ')
			return [`import space from 'color-space'\n\nspace.rgb.oklch(${rgb.join(', ')})  // → [${ok}]\nspace.oklch.rgb(${ok})  // → [${rgb.join(', ')}]\n\n// one space, tree-shaken:\nimport rgb from 'color-space/rgb.js'`] }
		const path = pathToRgb(s), nb = path?.[1]; let one = ''
		if (nb) try { one = `// one space, tree-shaken – its own edge:\nimport ${camel(s)} from 'color-space/${s}.js'\n\n${camel(s)}${prop(nb)}(${tup(s)})  // → [${space[s][nb](...valsOf(s)).map(x => +x.toFixed(4)).join(', ')}]\n\n` } catch {}
		return [one + `// any-to-any, both ways – the wired hub:\nimport space from 'color-space'\n\nspace${prop(s)}.rgb(${tup(s)})  // → [${rgb.join(', ')}]\nspace.rgb${prop(s)}(${rgb.join(', ')})  // → [${tup(s)}]` + (path?.length > 2 ? `\n// route: ${path.join(' → ')}` : '')] }
	if (k === 'wasm') { const cp = s === 'rgb' ? '.oklch' : '.rgb', bk = s === 'rgb' ? '.rgb.oklch' : `.rgb${prop(s)}`
		return [`import space, { alloc } from 'color-space/wasm'\n\nspace${prop(s)}${cp}(${tup(s)})  // scalar – the JS API's shape\n\nconst buf = alloc(n)  // Float64Array(n·3) in WASM memory\n// … write rgb 0–255 pixels into buf …\nspace${bk}(buf)  // the whole buffer, in place`] }
	if (k === 'gl') { const gd = { 1: 'float', 2: 'vec2', 3: 'vec3', 4: 'vec4' }[c.length] || 'vec3', sn = s.replace(/-/g, ''), cp = s === 'rgb' ? 'oklch' : 'rgb'
		return [`import { glsl, wgsl } from 'color-space/gl'\nimport ${camel(s)} from 'color-space/gl/${s}'\n\nglsl(${camel(s)}, '${cp}')  // GLSL: vec3 ${sn}_${cp}(${gd} c) { … }\nwgsl(${camel(s)}, '${cp}')  // WGSL: fn ${sn}_${cp}(c: ${gd}f) -> vec3f { … }`] }
	if (k === 'css') { const g = gamutOf()
		return [`/* ${s} is a native CSS notation */\ncolor: ${CSS_FMT[s](valsOf(s))};\ncolor: ${hexNow()};  /* ${g === 'srgb' ? 'sRGB hex' : 'nearest sRGB fallback'} */`, '/*'] }
	if (k === 'py') { if (!PY) return ['# loading the Python equivalents…', '#']
		const e = PY.default[s]; if (!e) return [`# no verified colour-science or OpenCV equivalent of ${s} yet\n# (checked: ${PY.VERIFIED})`, '#']
		const pre = PY.PREAMBLE.replace('[200, 100, 50]', `[${rgb.join(', ')}]`), out = []
		if (e.colour) out.push(`# ${PY.pip(e)}\n${pre}\n\n${camel(s).replace(/\W/g, '_')} = ${e.colour}  # rgb → ${s}` + (e.caveat ? `\n# ${e.caveat}` : '')
			+ (e.inverse ? `\n\nv = [${tup(s)}]  # ${s}, color-space's conventions\nback = ${e.inverse}  # ${s} → sRGB 0–255` + (e.inverseCaveat ? `\n# ${e.inverseCaveat}` : '') : ''))
		if (e.opencv) out.push(`# ${PY.PIP_CV}\n${PY.PREAMBLE_CV}\n\n${camel(s).replace(/\W/g, '_')} = ${e.opencv}  # per pixel`)
		return [out.join('\n\n') + `\n\n# verified against color-space: ${PY.VERIFIED}`, '#'] } }
function paintCode() { const out = document.querySelector('#wbp-code .wb-codeout'); if (!out || !S.sel) return
	const s = S.sel, k = W.code, [code, cm = '//'] = snippet(s, k)
	out.innerHTML = plate(code, `${LANGS.find(l => l[0] === k)[1]} code`, { hl: hilite(code, cm) })
	if (k === 'py' && !PY) loadPY().then(paintCode).catch(() => { out.querySelector('pre').textContent = '# the Python equivalents did not load' }) }
let codeT = 0
const refreshCode = () => { if (W.tab !== 'code' || !S.sel) return; clearTimeout(codeT); codeT = setTimeout(paintCode, 120) }

// ── Share: the link, the embed, the citation ──
export const embedSnippet = s => `<iframe src="${SITE}/${s}?embed" title="${disp(s)} – color-space" width="100%" height="560" loading="lazy" style="border:0"></iframe>`
function shareHTML(s) { const link = `${SITE}/${s}`
	return `<h3 class="wb-h">Link</h3>${plate(link, `${disp(s)} link`, { wrap: true })}
	<h3 class="wb-h">Embed</h3><p class="wb-note">The ${esc(disp(s))} card alone, in an iframe on your page.</p>${plate(embedSnippet(s), 'Embed snippet', { trk: 'embed', wrap: true })}
	<h3 class="wb-h">Cite</h3><div class="wb-cite" aria-live="polite"><p class="wb-note">…</p></div>` }
/** The citation block – BibTeX and APA plates from loadCite(), or a pointer to the repository. */
export const citeHTML = ({ bibtex, apa }) => bibtex || apa ? `<p class="wb-note">From the repository's CITATION.cff.</p>${bibtex ? `<span class="plab">BibTeX</span>${plate(bibtex, 'BibTeX')}` : ''}${apa ? `<span class="plab">APA</span>${plate(apa, 'APA citation', { wrap: true })}` : ''}`
	: `<p class="wb-note">The citation is built from CITATION.cff with the site – <a href="https://github.com/colorjs/color-space" target="_blank" rel="noopener">cite it from the repository</a>.</p>`
function paintCite() { loadCite().then(c => { const el = document.querySelector('#wbp-share .wb-cite'); if (el) el.innerHTML = citeHTML(c) }) }

// ── copy + the one toast ──
let toastT = 0
export function toast(t = 'Copied') { let el = $('toast'); if (!el) { el = Object.assign(document.createElement('div'), { id: 'toast' }); el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); document.body.append(el) }
	el.textContent = t; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 1100) }
const copy = t => { try { navigator.clipboard?.writeText(t)?.catch?.(() => {}) } catch {} toast() }

// ── the URL: ?s=<space> is the open pane, the fragment is an authored color (the site's grammar) ──
function writeURL() { try { const u = new URL(location.href); S.sel ? u.searchParams.set('s', S.sel) : u.searchParams.delete('s')
	S.quant !== 'smooth' ? u.searchParams.set('q', S.quant) : u.searchParams.delete('q')
	PALMODES.has(S.quant) && S.metric !== 'oklab' ? u.searchParams.set('m', S.metric) : u.searchParams.delete('m')
	if (authoredC) u.hash = hex(RGB).slice(1).toLowerCase()
	history.replaceState(null, '', u) } catch {} }

// ── the theme: the site's own key, so the workbench and the atlas agree ──
function theme(t) { root.dataset.theme = t; try { localStorage.csTheme = t } catch {}
	const b = $('thm'); if (b) { b.innerHTML = t === 'dark' ? UI.sun : UI.moon; b.title = t === 'dark' ? 'Light' : 'Dark'; b.setAttribute('aria-pressed', t === 'dark') }
	document.dispatchEvent(new CustomEvent('wb:theme', { detail: t })) }

// ── one delegate for every control, wherever a direction drew it ──
function onClick(e) { const t = e.target.closest('button,a[data-wt]'); if (!t) return; const d = t.dataset
	if (t.classList.contains('wb-scrim')) return closePane()
	if (d.openS) return openPane(d.openS, { from: t, scroll: W.follow || !!t.closest('#cat') })
	if (d.close !== undefined) return closePane()
	if (d.go) return go(+d.go)
	if (d.wtab) return selectTab(d.wtab)
	if (d.wcode) { W.code = d.wcode; fillTab('code'); track(EVENT.lang(d.wcode)); document.querySelector(`#wbp-code [data-wcode="${d.wcode}"]`)?.focus(); return }
	if (d.wl === 'dl') return downloadLUT(t)
	if (d.copy !== undefined) { copy(t.closest('.snipwrap').querySelector('pre').textContent); if (d.trk?.startsWith('embed')) track(EVENT.embed(d.trk.split(':')[1] || S.sel)); return }
	if (d.wt) { const n = TOUR.length
		if (d.wt === 'open') return openPane(TOUR[W.tour].s, { from: t })
		W.tour = clamp(W.tour + +d.wt, 0, n - 1); refresh('tour', 'stop', 'stops'); const st = TOUR[W.tour]; track(EVENT.tour(W.tour + 1, st.s))
		if (WIDE.matches) openPane(st.s, { from: t, focus: false })
		return }
	if (d.stop) { const i = +d.stop; W.tourOpen = !(W.tourOpen && W.tour === i); W.tour = i   // the open stop's number folds its card again
		refresh('stops', 'stop', 'tour'); if (!W.tourOpen) return; track(EVENT.tour(i + 1, TOUR[i].s))
		if (WIDE.matches) openPane(TOUR[i].s, { from: t, focus: false })   // beside the catalog the stop's space opens with it, as the card's arrows do
		return }
	if (d.shut) { const sh = t.closest('.shelf'), on = !S.shut.has(d.shut); on ? S.shut.add(d.shut) : S.shut.delete(d.shut); sh.classList.toggle('shut', on); t.setAttribute('aria-expanded', !on); return }
	if ((d.f || d.wf === 'for') && d.v) { toggle(d.f || 'for', d.v); filtered(); return }
	if (d.wclear) { S.F[d.wclear].clear(); filtered(); return }
	if (d.wtry) { const c = parseColor(d.wtry); if (c) color(c.s, c.vals); return }
	if (d.wbReset !== undefined || d.reset !== undefined) { clearAll(); const q = $('q'); if (q) { q.value = ''; $('findw')?.classList.remove('has') } filtered(); return }
	if (d.sort) { S.tdir = S.tsort === d.sort ? (S.tdir > 0 ? -1 : (S.tsort = null, 1)) : (S.tsort = d.sort, 1); renderCat(); return }
	if (d.set) return set(d.set, d.v)
	if (d.wcvd) return vision(d.wcvd)
	if (t.id === 'thm') return theme(root.dataset.theme === 'dark' ? 'light' : 'dark')
	if (t.id === 'qx') { S.q = ''; $('q').value = ''; $('findw').classList.remove('has'); filtered(); $('q').focus() } }
let qT = 0
function onInput(e) { const t = e.target
	if (t.id === 'q') { $('findw')?.classList.toggle('has', !!t.value); clearTimeout(qT); qT = setTimeout(() => { S.q = t.value.trim(); filtered() }, 120); return }
	if (t.id === 'cpick') { const h = t.value; return color('rgb', [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))) }
	if (t.dataset.wv === 'z') { W.z = +t.value; root.style.setProperty('--wb-z', W.z); store.set('z', W.z); return }
	if (t.classList.contains('nrg')) { const el = t.closest('.sp,#pane'), s = el.id === 'pane' ? S.sel : el.dataset.s, v = valsOf(s).slice()
		v[+t.dataset.i] = +t.value; t.closest('.ch')?.classList.add('live'); drag = el; color(s, v, { from: el.id === 'pane' ? null : el }) } }
function onChange(e) { const t = e.target
	if (t.classList.contains('nrg')) { drag = null; t.closest('.ch')?.classList.remove('live'); dirty(); paintPane(true); return }
	if (t.id === 'cval') { const c = parseColor(t.value); if (c) { color(c.s, c.vals); t.blur() } else t.setAttribute('aria-invalid', 'true'); return }
	if (t.dataset.wf) { S.F[t.dataset.wf].clear(); if (t.value) S.F[t.dataset.wf].add(t.value); filtered(); return }
	if (t.dataset.wset) return set(t.dataset.wset, t.value)
	if (t.dataset.wbCvd !== undefined) return vision(t.value)
	if (t.dataset.wl === 'from') { lutHost(t).dataset.wlFrom = t.value; relut(t, 'from'); return }
	if (t.dataset.wl === 'to') { W.lutTo = t.value; relut(t, 'to'); return }
	if (t.dataset.wl === 'ed') { W.lutEd = t.value; relut(t, 'ed'); return }
	if (t.dataset.wl === 'hi') { W.lutHi = t.checked; relut(t, 'hi'); return }
	if (t.classList.contains('cv') && t.tagName === 'INPUT') { const el = t.closest('.sp,#pane'), s = el.id === 'pane' ? S.sel : el.dataset.s, i = +t.dataset.i, c = meta[s].channels[i], x = parseFloat(t.value)
		if (!isFinite(x)) { t.setAttribute('aria-invalid', 'true'); return } t.removeAttribute('aria-invalid')
		const v = valsOf(s).slice(); v[i] = c.max === 360 ? ((x % 360) + 360) % 360 : clamp(x, c.min, c.max); color(s, v) } }
function onKey(e) {
	if (e.key === 'Enter' && e.target.id === 'cval') { e.target.dispatchEvent(new Event('change', { bubbles: true })); return }
	if (e.key === 'Escape' && S.sel && !e.target.closest?.('select') && !document.querySelector(':is([popover=""],[popover="auto"]):popover-open')) { closePane(); return }   // an open menu takes its Esc alone – the browser closes it after this listener
	if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) && $('q')) { e.preventDefault(); $('q').focus(); return }
	const tab = e.target.closest?.('[role="tab"][data-wtab]')
	if (tab && /^(ArrowLeft|ArrowRight|Home|End)$/.test(e.key)) { const all = [...tab.parentElement.querySelectorAll('[role="tab"]')], k = all.indexOf(tab)
		const n = e.key === 'Home' ? 0 : e.key === 'End' ? all.length - 1 : (k + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length
		e.preventDefault(); selectTab(all[n].dataset.wtab, true); return }
	if (e.key === 'Tab' && S.sel && !WIDE.matches) { const all = [...$('pane').querySelectorAll('button:not(:disabled),a[href],input,select,[tabindex="0"]')].filter(el => el.getClientRects().length)
		if (e.shiftKey && document.activeElement === all[0]) { e.preventDefault(); all.at(-1).focus() } else if (!e.shiftKey && document.activeElement === all.at(-1)) { e.preventDefault(); all[0].focus() } }
	const w = e.target.closest?.('.solid-wrap'); if (w && e.key.startsWith('Arrow')) { e.preventDefault()
		if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') PANE.rot[0] += e.key === 'ArrowLeft' ? -.15 : .15
		else PANE.rot[1] = clamp(PANE.rot[1] + (e.key === 'ArrowUp' ? .15 : -.15), -Math.PI / 2, Math.PI / 2); paintSolid() } }
// dragging on planes picks two channels at once; dragging the solid turns it
function onDown(e) { pdown = true
	const pl = e.target.closest('.pl'), w = e.target.closest('.solid-wrap')
	if (e.target.closest('.ch,.cv,.cdw')) stopOrbit()
	if (pl) { stopOrbit(); const el = pl.closest('.sp,#pane'), s = el.id === 'pane' ? S.sel : el.dataset.s, c = classify(s), a = +pl.dataset.a, b = +pl.dataset.b
		const at = ev => { const r = pl.getBoundingClientRect(), fx = clamp((ev.clientX - r.left) / r.width, 0, 1), fy = clamp((ev.clientY - r.top) / r.height, 0, 1), v = valsOf(s).slice()
			v[a] = c.ch[a].min + fx * (c.ch[a].max - c.ch[a].min); v[b] = c.ch[b].min + (1 - fy) * (c.ch[b].max - c.ch[b].min); color(s, v, { from: el.id === 'pane' ? null : el }) }
		pl.setPointerCapture(e.pointerId); drag = el; at(e); pl.onpointermove = at
		pl.onpointerup = pl.onpointercancel = () => { pl.onpointermove = null; drag = null; dirty(); paintPane(true) }; e.preventDefault(); return }
	if (w) { let x = e.clientX, y = e.clientY; w.setPointerCapture(e.pointerId)
		w.onpointermove = ev => { PANE.rot[0] += (ev.clientX - x) * .011; PANE.rot[1] = clamp(PANE.rot[1] - (ev.clientY - y) * .011, -Math.PI / 2, Math.PI / 2); x = ev.clientX; y = ev.clientY; paintSolid() }
		w.onpointerup = w.onpointercancel = () => { w.onpointermove = null } } }

/**
 * Wire a direction's page. Options: arrange ('family' | 'purpose' | 'era' | 'name'), view, preview, quant –
 * the catalog's starting state (a stored preference wins for view/preview/quant); persistent – on wide
 * screens the pane never closes and opens on `space` (default 'oklch') when the URL names none; follow: false –
 * the page stays where it is when the pane opens from anywhere but the catalog (prev/next and arrival included).
 */
export function boot(o = {}) {
	// the inline SVG the painters reference: the smooth-swatch gradient, and the vision lens's filters
	document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><linearGradient id="vq-smooth" x1="0" x2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".15"/><stop offset="1" stop-color="currentColor"/></linearGradient></defs></svg>${cvdDefs()}`)
	const pane = $('pane'); if (pane) { pane.classList.add('pane'); pane.hidden = true; scrim = Object.assign(document.createElement('button'), { type: 'button', className: 'wb-scrim', hidden: true, tabIndex: -1 }); scrim.setAttribute('aria-label', 'Close details'); pane.before(scrim) }
	S.arrange = pick(o.arrange, ['family', 'purpose', 'era', 'name'], 'family')
	S.view = pick(store.get('view') || o.view, ['grid', 'list', 'table'], 'grid')
	S.preview = pick(store.get('preview') || o.preview, ['sliders', 'planes'], 'sliders')
	const P0 = new URLSearchParams(location.search)   // the lens arrives in the URL (?q= · ?m=), never from storage
	S.quant = pick(P0.get('q') || o.quant, QFLAT.map(x => x[0]), 'smooth'); S.metric = pick(P0.get('m'), METRICS, 'oklab')
	W.persistent = !!o.persistent; W.follow = o.follow !== false; W.dock = o.dock || null
	CAP.css = new Set(Object.keys(CSS_FMT))   // the Availability filter and the Code tab agree on what CSS can write
	CAP.glsl = new Set(SPACES.filter(s => { try { return hasPlaneGL(s) } catch { return false } }))
	root.style.setProperty('--wb-z', W.z)
	for (const el of document.querySelectorAll('[data-wb]')) if (R[el.dataset.wb]) el.innerHTML = R[el.dataset.wb](el)
	theme(root.dataset.theme === 'dark' ? 'dark' : 'light')
	// arrival: an authored color in the fragment, an open space in ?s=; otherwise the orbit
	const P = new URLSearchParams(location.search), h = location.hash.slice(1), c = /^[0-9a-f]{6}$/i.test(h) ? parseColor('#' + h) : null
	if (c) { setColor(c.s, c.vals); authoredC = true } else startOrbit()
	paintCur(); renderCat()
	const s0 = P.get('s'); if (SPACES.includes(s0)) openPane(s0, { focus: false, url: false, scroll: W.follow }); else if (W.persistent && WIDE.matches) openPane(o.space || 'oklch', { focus: false, url: false })
	document.addEventListener('click', onClick); document.addEventListener('input', onInput); document.addEventListener('change', onChange)
	document.addEventListener('keydown', onKey); document.addEventListener('pointerdown', onDown)
	// a popover's invoker says whether it is open – the drawer's cells and any top's menu buttons style by it (toggle doesn't bubble)
	document.addEventListener('toggle', e => { if (e.target.matches?.('[popover]')) for (const b of document.querySelectorAll(`[popovertarget="${CSS.escape(e.target.id)}"]:not([popovertargetaction="hide"])`)) b.setAttribute('aria-expanded', e.newState === 'open') }, true)
	addEventListener('pointerup', () => { pdown = false }); addEventListener('pointercancel', () => { pdown = false })
	WIDE.addEventListener('change', () => { if (W.persistent && WIDE.matches && !S.sel) openPane(o.space || 'oklch', { focus: false, url: false }); else if (S.sel && !W.dock) paneFill(S.sel), paintPane(true); modalize() })
	setGLReady(() => { CAP.glsl = new Set(SPACES.filter(s => { try { return hasPlaneGL(s) } catch { return false } })); dirty(); paintPane(true); refresh('stripe') })
	;(window.requestIdleCallback || setTimeout)(() => trackLoad())
	return { S, W, color, openPane, closePane, renderCat, refresh, set, stopOrbit } }
