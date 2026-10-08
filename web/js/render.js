// Catalog markup — one template shared by the page (hydration) and
// scripts/generate-landing.js (static prerender, so crawlers see the full catalog).
// Each family: its three featured spaces as lead cards (name, by-line, story, numbers, strips), then the
// rest as tiles (name, year, thin strips, numbers) – every space shows its channels as editable numbers.
// The prerender passes the DEFAULT color state, so values, slider gradients and tick
// markers are baked into the static HTML — the catalog is complete at first paint,
// before any script runs; the page's stamp-skip repaints only what actually changes.
import { space, meta, classify, ramp, hex, toSpace, clamp } from './core.js'
import CATS from './categories.js'
import PURPOSE, { USE } from './purpose.js'
import LORE from './lore.js'
import { OI, PI } from './icons.js'
import REACH from './reach.js'
import { t, slug, LANG } from './i18n.js'

export const SPACES = Object.keys(space).filter(k => space[k] && space[k].name && meta[k] && meta[k].channels)
// a channel's display name – English from the registry, translated as vocabulary (channel.<slug>)
export const chEn = c => c.name.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/(\s*\b(percentage|percent|angle in degrees|in degrees|axis|component|coordinate)\b\s*)+$/i, '').trim()
// (a bare symbol – X, U, Z′ – is notation, not a word: it stays as it is)
export const chKey = c => { const en = chEn(c); return /\p{L}{2}/u.test(en) ? 'channel.' + slug(en) : null }
export const cname = c => { const k = chKey(c), en = chEn(c); return k ? t(k, en) : en }
// display name — data.json's spaces[id].title, the one source this page, the prerender and the MCP
// server share (scripts/generate-data.js: each description's own "Name — …", pinned where it opens
// otherwise or an ascii id must not be blindly uppercased); an unknown id reads as itself, uppercased
export const disp = s => meta[s]?.title || s.toUpperCase()
// set a display name for wrapping: word-internal hyphens turn non-breaking (U+2011, one code
// unit for one, so match offsets from disp() still land) – a wrapped name breaks at spaces,
// never as "Linear- / light sRGB"
export const nbh = t => t.replace(/(\w)-(?=\w)/g, '$1\u2011')
export const unit = c => c.max === 360 ? '°' : (c.min === 0 && c.max === 100 ? '%' : '')
const mapped = new Set(CATS.flatMap(c => c.spaces))
export const sections = [...CATS.map(c => ({ key: 'cat.' + c.id, name: c.name, tip: c.tip, spaces: c.spaces.filter(s => SPACES.includes(s)) })),
	{ name: 'more', spaces: SPACES.filter(s => !mapped.has(s)) }].filter(c => c.spaces.length)
// a shelf's name and tip, as the page shows them: keyed shelves (families, purposes) translate,
// the rest (era spans, 'more') read as they are. The English stays on the section – it is the data
export const secName = c => c.key ? t(c.key + '.name', c.name) : c.name
export const secTip = c => c.tip && (c.key ? t(c.key + '.tip', c.tip) : c.tip)
// sentence-case in the page's language (Turkish i → İ)
export const cap = s => s && s[0].toLocaleUpperCase(LANG) + s.slice(1)
// the tag vocabulary – catalog tips, dossier pills and filter chips speak it. The value stays the
// id (filters, URLs); the label translates. Acronyms, illuminants and file formats read as they are
export const tagL = v => ({
	transfer: t('tag.transfer', 'transfer'), matrix: t('tag.matrix', 'matrix'), cylindrical: t('tag.cylindrical', 'cylindrical'),
	chromaticity: t('tag.chromaticity', 'chromaticity'), 'luma-chroma': t('tag.luma-chroma', 'luma-chroma'), opponent: t('tag.opponent', 'opponent'),
	system: t('tag.system', 'system'), appearance: t('tag.appearance', 'appearance'), spectral: t('tag.spectral', 'spectral'),
	gamma: t('tag.gamma', 'gamma'), linear: t('tag.linear', 'linear'), perceptual: t('tag.perceptual', 'perceptual'), log: t('tag.log', 'log'),
	display: t('tag.display', 'display'), scene: t('tag.scene', 'scene'), 'display-referred': t('tag.display-referred', 'display-referred'),
	'scene-referred': t('tag.scene-referred', 'scene-referred'), polar: t('tag.polar', 'polar'), component: t('tag.component', 'component'),
	'luma / chroma': t('tag.luma-chroma-pair', 'luma / chroma'), historical: t('tag.historical', 'historical'), current: t('tag.current', 'in use'),
	projective: t('tag.projective', 'projective'), lookup: t('tag.lookup', 'lookup'), quantized: t('tag.quantized', 'quantized'),
})[v] ?? v

export const LEADS = 3   // lead cards per family on a wide catalog (its featured spaces – the first three); the rest are tiles

// the color every visitor arrives at — one source for the page's boot state AND the prerender
export const DEFAULT = { s: 'rgb', vals: [128, 128, 128] }

// ── shared value/color formatting (page + prerender must agree byte-for-byte) ──
// decimals from the range span — enough that every channel walks ≥100 steps: the step is
// the largest power of ten with span/step ≥ 100 (0..255 → 1, 0..0.85 → 0.001, xyb's
// 0.0435 → 0.0001, scrgb's 0–8 → 0.01; kelvin's 24000 stays 1 — decimals clamp to
// 0..6). The printed precision IS the step.
export const decOf = c => { const d = -Math.floor(Math.log10((c.max - c.min) / 100)); return d > 0 ? Math.min(d, 6) : 0 }
// fixed decimals, never shed — 0.111 → 0.110 → 0.109 keeps its width, and the trailing
// zeros tell the user what one spinner click moves
export const fmtc = (v, c) => { if (!isFinite(v)) return ''
	const s = v.toFixed(decOf(c)); return /^-0(\.0+)?$/.test(s) ? s.slice(1) : s }
export const rgbF = (s, v) => (s === 'rgb' ? v : space[s].rgb(...v)).map(x => isFinite(x) ? clamp(x, 0, 255) : 0)
export const lum = c => 0.2126 * c[0] / 255 + 0.7152 * c[1] / 255 + 0.0722 * c[2] / 255
export const ink = c => lum(c) < 0.6 ? '#fff' : 'var(--dark)'

// fingerprint of the base template string — the prerender stamps it on #cat, the page
// compares before hydrating; a mismatch (template/data drift, raw web/ source) rebuilds
export const fpOf = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0; return h.toString(36) }

// shipped as working history — tagged "historical" in the modal, listed in "Skipped"
export const HISTORICAL = new Set(['cie-rgb', 'ntsc', 'slog', 'redlog', 'panalog', 'viperlog', 'ryb', 'anlab'])
// the card's quick dossier — slug + birth line (data-tip), then the tag row
// (data-tip-tags, rendered by tip.js as chips — the same vocabulary the filter speaks)
const entTip = s => { const m = meta[s], p = PURPOSE[s]?.[0], use = p && t(`purpose.${p}.use`, USE[p])
	return `${s} – ${[m.year, m.by].filter(Boolean).join(', ')}${use ? `\n${cap(use)}` : ''}` }   // the purpose takes its own line, sentence-cased — the tip renders pre-line
const entTags = s => { const m = meta[s]
	return [m.method, m.encoding, m.referred && m.referred + '-referred', m.dynamic && m.dynamic.toUpperCase(), m.illuminant].filter(Boolean).map(tagL).join(' · ') }
// a lead card's story – the lore's "made for" line in the page's language, as a sentence
const lede = s => { const f = LORE[s]?.for; if (!f) return ''; const x = cap(t(`lore.${s}.for`, f)); return /[.!?…]$/.test(x) ? x : x + '.' }
const byline = s => { const m = meta[s]; return [m.year, m.by].filter(Boolean).join(' · ') }
// an entry: the featured (lead) card reads in full – name and by-line, its story, the strips, the numbers; a tile
// keeps the name and year over thin strips and the numbers. Both paint; the prerender bakes a tile's strips coarse
// (12 guides – the page repaints what scrolls into view at full). Every view's entry is an .ent[data-s] with its
// channels' .ch strips and .cv numbers in channel order – the painters and the wiring read nothing else
// the Limit every slider and plane is cut by – Surface by default: the widest reflective view that still reads as a
// compact body. A 1-channel sweep under Surface or Light is all in by definition (a display limit still cuts it)
export const LIMIT = 'vis'
export const limitFor = (cls, gm = LIMIT) => cls.ch.length > 1 ? gm : gm === 'vis' || gm === 'locus' ? 'off' : gm
const valsAt = (s, st) => { if (!st) return null; try { return s === DEFAULT.s ? DEFAULT.vals : toSpace(s, st.rgb) } catch { return null } }
const entAttrs = (s, cls, vals, st, n) => `data-s="${s}"${vals ? ` data-v="${st.hx}" data-g="${st.hx}:0:${n}:${limitFor(cls)}"` : ''} style="--nch:${cls.ch.length}"`
const nameBtn = s => `<button class="nm" type="button" data-tip="${entTip(s)}" data-tip-tags="${entTags(s)}" aria-label="${t('ui.card.open', 'Open {s} color-space dossier', { s })}">${nbh(disp(s))}</button>`
const field = (s, c2, i, vals) => `<span class="cvp"><i class="cl" aria-hidden="true" title="${cname(c2)}">${c2.sym.slice(0, 2)}</i><input class="cv tnum" data-i="${i}" inputmode="decimal" spellcheck="false" autocomplete="off" title="${cname(c2)}" aria-label="${s} ${cname(c2)}"${vals ? ` value="${fmtc(vals[i], c2)}"` : ''}></span>`
const strip = (s, c2, i, vals, st, n) => `<div class="ch" data-i="${i}" title="${cname(c2)}"${vals ? ` style="background:linear-gradient(90deg, ${ramp(s, vals, i, c2.min, c2.max, n, limitFor(classify(s))).join(',')}), var(--checker)"` : ''}><input type="range" class="nrg" data-i="${i}" min="${c2.min}" max="${c2.max}" step="any"${vals ? ` value="${vals[i]}" style="--tkc:${st.hx};--tki:${st.ink}"` : ''} tabindex="-1" aria-label="${t('ui.card.slider', '{name} slider', { name: cname(c2) })}"></div>`
// a space's channel pairs as planes – three of them (two for two channels), the angle across and the tone up where
// the space has them
export const pairsOf = cls => { const n = cls.ch.length; if (n < 2) return []
	const ps = n > 3 ? [[0, 1], [1, 2], [2, 0]] : n === 2 ? [[0, 1]] : [[0, 1], [0, 2], [1, 2]]
	const ai = cls.angle ? cls.angle.i : -1, ti = cls.tone ? cls.tone.i : (ai < 0 && n === 3 ? 0 : undefined)
	return ps.map(([a, b]) => (ai === b || ti === a) ? [b, a] : [a, b]) }
const ent = (s, lead, st) => { const cls = classify(s), vals = valsAt(s, st), n = lead ? 48 : 12
	const head = lead ? `<span class="by">${byline(s)}</span>` : `<span class="yr tnum">${meta[s].year || ''}</span>`
	const nums = `<span class="cvs">${cls.ch.map((c2, i) => field(s, c2, i, vals)).join('')}</span>`
	const strips = `<div class="chs">${cls.ch.map((c2, i) => strip(s, c2, i, vals, st, n)).join('')}</div>`
	return `<article class="ent ${lead ? 'lc' : 'tc'}" ${entAttrs(s, cls, vals, st, n)}>
	 <header class="eh">${nameBtn(s)}${head}</header>
	 ${lead ? `<div class="pv">${strips}${pairsOf(cls).length ? `<button type="button" class="pvs" aria-pressed="false" title="${t('ui.card.planes', 'Planes')}" aria-label="${t('ui.card.planes-label', 'Show {name} as planes', { name: disp(s) })}">${PI.planes}</button>` : ''}</div>${nums}` : strips + nums}
	</article>` }
// Rows: one line per space – who and why on the left, a strip per channel at full width with its number
const row = (s, st) => { const cls = classify(s), vals = valsAt(s, st), story = lede(s)
	return `<article class="ent lr" ${entAttrs(s, cls, vals, st, 48)}>
	 <div class="li"><header class="eh">${nameBtn(s)}</header><span class="by">${byline(s)}</span>${story ? `<p class="for">${story}</p>` : ''}</div>
	 <div class="chs">${cls.ch.map((c2, i) => `<div class="lch"><i class="cl" aria-hidden="true" title="${cname(c2)}">${c2.sym}</i>${strip(s, c2, i, vals, st, 48)}${field(s, c2, i, vals).replace(/<i class="cl"[^>]*>[^<]*<\/i>/, '')}</div>`).join('')}</div>
	</article>` }
// List: the spec sheet – a mini sweep of every channel, then the facts; each column sorts the whole catalog. The kinds
// (shape, curve, signal, range) are the filters' own icons, named in their tooltips; where the sheet is narrow they
// share one cell (.c-kind)
const geoOf = s => ({ polar: 'polar', opponent: 'opponent' })[classify(s).archetype] || 'component'
const KIND = { geo: geoOf, curve: s => meta[s].encoding || '', sig: s => meta[s].referred || '', range: s => (meta[s].dynamic || 'sdr').toUpperCase() }
const kindIcon = (k, s) => { const v = KIND[k](s), ic = OI[v === 'luma / chroma' ? 'opponent' : v.toLowerCase()]
	return v && ic ? `<span class="ki" role="img" aria-label="${tagL(v)}" title="${tagL(v)}">${ic}</span>` : '' }
export const COLS = [['name', s => disp(s)], ['year', s => meta[s].year || 0], ['by', s => meta[s].by || ''], ['ch', s => classify(s).ch.map(c => c.sym).join(' ')],
	['cov', s => REACH[s]?.[0] ?? -1], ['geo', s => tagL(geoOf(s))], ['curve', s => KIND.curve(s) && tagL(KIND.curve(s))], ['sig', s => KIND.sig(s) && tagL(KIND.sig(s))],
	['range', KIND.range], ['white', s => meta[s].illuminant || '']]
// what a cell shows, where it isn't its sort value
const CELL = { cov: s => REACH[s] ? `${Math.round(REACH[s][0] * 100)}%` : '', geo: s => kindIcon('geo', s), curve: s => kindIcon('curve', s), sig: s => kindIcon('sig', s), range: s => kindIcon('range', s) }
// a column's heading, in the page's language at render time
const colName = k => ({ name: t('ui.col.name', 'Name'), year: t('ui.col.year', 'Year'), by: t('ui.col.by', 'Made by'), ch: t('ui.col.channels', 'Channels'),
	cov: t('ui.cell.coverage', 'Coverage'), geo: t('ui.col.shape', 'Shape'), curve: t('ui.col.curve', 'Curve'), sig: t('ui.cell.signal', 'Signal'), range: t('ui.col.range', 'Range'), white: t('ui.col.white', 'White') })[k]
const trow = (s, st) => { const cls = classify(s), vals = valsAt(s, st)
	return `<tr class="ent tr" ${entAttrs(s, cls, vals, st, 12)}><td class="tsw"><div class="chs mini">${cls.ch.map((c2, i) => strip(s, c2, i, vals, st, 12)).join('')}</div></td>${COLS.map(([k, f], i) => i ? `<td class="c-${k}">${(CELL[k] || f)(s)}</td>` : `<th scope="row" class="c-name">${nameBtn(s)}</th>`).join('')}<td class="c-kind">${['geo', 'curve', 'sig', 'range'].map(k => kindIcon(k, s)).join('')}</td></tr>` }
const table = (spaces, st, sort) => `<div class="tblw"><table class="tbl"><thead><tr><th class="tsw"><span class="sr">${t('ui.col.preview', 'Preview')}</span></th>${COLS.map(([k]) => `<th scope="col" class="c-${k}" aria-sort="${sort?.k === k ? (sort.d > 0 ? 'ascending' : 'descending') : 'none'}"><button type="button" data-sort="${k}">${colName(k)}${sort?.k === k ? `<span aria-hidden="true">${sort.d > 0 ? ' ↑' : ' ↓'}</span>` : ''}</button></th>`).join('')}<th scope="col" class="c-kind"><span class="sr">${['geo', 'curve', 'sig', 'range'].map(colName).join(' · ')}</span></th></tr></thead><tbody>${spaces.map(s => trow(s, st)).join('')}</tbody></table></div>`
// a list sorted by a column: every space in one shelf, in that order
export const sorted = ({ k, d }) => { const f = COLS.find(c => c[0] === k)[1]
	return [{ name: t('ui.view.all', 'All spaces'), spaces: SPACES.slice().sort((a, b) => { const x = f(a), y = f(b); return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y))) * d }) }] }

// a shelf's icon on the rail: the families' glyphs, a purpose's own (the line family the menus draw); era shelves go bare
const SHELFI = { 'cat.display': OI.display, 'cat.remixes': OI.polar, 'cat.perceptual': OI.opponent, 'cat.colorimetry': OI.chromaticity,
	'cat.video': OI.delivery, 'cat.camera': OI.scene, 'cat.surface': OI.palettes, ...Object.fromEntries(Object.keys(OI).map(k => ['purpose.' + k, OI[k]])) }

// m: optional color state to bake in ({ s, vals } — the prerender passes DEFAULT);
// omitted (the page's fingerprint check) → the bare template, byte-stable across colors.
// secs: the section cut to render — defaults to the family catalog; groups.js passes others.
// o: how – view 'grid' (lead cards, tiles), 'rows' or 'list' (the spec sheet), the cut its tabs mark, a list's sort,
// and how many lead each family in the grid – one row of them: as many as the grid's columns (the prerender: three)
export const catHTML = (m, secs = sections, { view = 'grid', cut = 'family', sort = null, leads = LEADS } = {}) => { let st = null
	if (m) { const rgb = rgbF(m.s, m.vals); st = { rgb, hx: hex(rgb), ink: ink(rgb) } }
	const by = t('ui.group.by', 'group the catalog by'), G = { family: t('ui.group.family', 'Family'), purpose: t('ui.group.purpose', 'Purpose'), era: t('ui.group.era', 'Era') }
	const body = c => view === 'rows' ? `<div class="rows">${c.spaces.map(s => row(s, st)).join('')}</div>`
		: view === 'list' ? table(c.spaces, st, sort)
		: `<div class="lead">
	${c.spaces.slice(0, leads).map(s => ent(s, true, st)).join('')}
</div>${c.spaces.length > leads ? `<div class="tiles">
	${c.spaces.slice(leads).map(s => ent(s, false, st)).join('')}
</div>` : ''}`
	const ti = (c, i) => `<div class="trg"><i class="tsp"></i><div class="ti" data-i="${i}"><button class="tn"${c.tip ? ` data-tip="${secTip(c)}"` : ''}>${SHELFI[c.key] ? `<span class="fic">${SHELFI[c.key]}</span>` : ''}<span class="tt">${secName(c)}</span><span class="tc tnum">${c.spaces.length}</span></button>${c.tip ? `<p class="tip">${secTip(c)}</p>` : ''}</div></div>`
	return `<nav class="toc" id="toc">${secs.map(ti).join('')}<div class="trg"><div class="gtabs" aria-label="${by}">${['family', 'purpose', 'era'].map(g => `<button class="gtag${g === cut ? ' on' : ''}" data-g="${g}" aria-pressed="${g === cut}">${G[g]}</button>`).join('')}</div></div></nav><div class="secs" id="secs">` + secs.map((c, si) => `<section class="sec" data-sec><h2 class="shw"${c.tip ? ` data-tip="${secTip(c)}" tabindex="0"` : ''}>${secName(c)}<span class="c tnum">${c.spaces.length}</span>${si === 0 ? `<select class="gsel" aria-label="${by}">${['family', 'purpose', 'era'].map(g => `<option value="${g}"${g === cut ? ' selected' : ''}>${G[g]}</option>`).join('')}</select>` : ''}</h2>${c.tip ? `<p class="stip">${secTip(c)}</p>` : ''}${body(c)}</section>`).join('') + `</div><p class="nores" id="nores" hidden></p>` }
