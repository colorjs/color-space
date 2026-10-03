// Catalog markup — one template shared by the page (hydration) and
// scripts/generate-landing.js (static prerender, so crawlers see the full catalog).
// Each category: three lead cards with sliders, then the rest as compact sheet rows —
// every space shows its channel values as editable numbers beside the title.
// The prerender passes the DEFAULT color state, so values, slider gradients and tick
// markers are baked into the static HTML — the catalog is complete at first paint,
// before any script runs; the page's stamp-skip repaints only what actually changes.
import { space, meta, classify, ramp, hex, toSpace, clamp } from './core.js'
import CATS from './categories.js'
import PURPOSE, { USE } from './purpose.js'
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
	'luma / chroma': t('tag.luma-chroma-pair', 'luma / chroma'), historical: t('tag.historical', 'historical'),
	projective: t('tag.projective', 'projective'), lookup: t('tag.lookup', 'lookup'), quantized: t('tag.quantized', 'quantized'),
})[v] ?? v

export const LEADS = 3   // slider cards per category (the row's featured spaces); the rest are sheet rows

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
const ent = (s, lite, st) => { const cls = classify(s)
	let vals = null; if (st) { try { vals = s === DEFAULT.s ? DEFAULT.vals : toSpace(s, st.rgb) } catch { vals = null } }
	const full = vals && !lite, lens='off'   // lead cards bake Light (full real reach) sliders + thumb positions; sheet rows bake values only
	return `<article class="ent${lite ? ' lite' : ''}" data-s="${s}"${vals ? ` data-v="${st.hx}${full ? '' : ':l'}"${full ? ` data-g="${st.hx}:0:48:${lens}"` : ''}` : ''} style="--nch:${cls.ch.length}">
	 <div class="eh"><button class="nm" type="button" data-tip="${entTip(s)}" data-tip-tags="${entTags(s)}" aria-label="${t('ui.card.open', 'Open {s} color-space dossier', { s })}">${nbh(disp(s))}</button><span class="cvs">${cls.ch.map((c2, i) => `<span class="cvp"><i class="cl" aria-hidden="true" title="${cname(c2)}">${c2.sym.slice(0, 2)}</i><input class="cv tnum" data-i="${i}" inputmode="decimal" spellcheck="false" autocomplete="off" title="${cname(c2)}" aria-label="${s} ${cname(c2)}"${vals ? ` value="${fmtc(vals[i], c2)}"` : ''}><span class="stk" aria-hidden="true"><button class="up" tabindex="-1">⌃</button><button class="dn" tabindex="-1">⌃</button></span></span>`).join('')}</span></div>
	 <div class="chs">${cls.ch.map((c2, i) => `<div class="ch" data-i="${i}" title="${cname(c2)}"${full ? ` style="background:linear-gradient(90deg, ${ramp(s, vals, i, c2.min, c2.max, 48, lens).join(',')}), var(--checker)"` : ''}><input type="range" class="nrg" data-i="${i}" min="${c2.min}" max="${c2.max}" step="any"${full ? ` value="${vals[i]}" style="--tkc:${st.hx};--tki:${st.ink}"` : ''} tabindex="-1" aria-label="${t('ui.card.slider', '{name} slider', { name: cname(c2) })}"></div>`).join('')}</div>
	</article>` }

// m: optional color state to bake in ({ s, vals } — the prerender passes DEFAULT);
// omitted (the page's fingerprint check) → the bare template, byte-stable across colors.
// secs: the section cut to render — defaults to the family catalog; groups.js passes others
export const catHTML = (m, secs = sections) => { let st = null
	if (m) { const rgb = rgbF(m.s, m.vals); st = { rgb, hx: hex(rgb), ink: ink(rgb) } }
	const by = t('ui.group.by', 'group the catalog by'), G = { family: t('ui.group.family', 'Family'), purpose: t('ui.group.purpose', 'Purpose'), era: t('ui.group.era', 'Era') }
	return `<nav class="toc" id="toc">${secs.map((c, i) => `<i class="tsp"></i><div class="ti" data-i="${i}"><button class="tn"${c.tip ? ` data-tip="${secTip(c)}"` : ''}>${secName(c)}<span class="tc tnum">${c.spaces.length}</span></button></div>`).join('')}<div class="gtabs" aria-label="${by}">${['family', 'purpose', 'era'].map(g => `<button class="gtag${g === 'family' ? ' on' : ''}" data-g="${g}" aria-pressed="${g === 'family'}">${G[g]}</button>`).join('')}</div></nav><div class="secs" id="secs">` + secs.map((c, si) => `<section class="sec" data-sec><h2 class="shw"${c.tip ? ` data-tip="${secTip(c)}" tabindex="0"` : ''}>${secName(c)}<span class="c tnum">${c.spaces.length}</span>${si === 0 ? `<select class="gsel" aria-label="${by}">${['family', 'purpose', 'era'].map(g => `<option value="${g}"${g === 'family' ? ' selected' : ''}>${G[g]}</option>`).join('')}</select>` : ''}</h2><div class="grid">
	${c.spaces.slice(0, LEADS).map(s => ent(s, false, st)).join('')}
</div>${c.spaces.length > LEADS ? `<div class="sheet">
	${c.spaces.slice(LEADS).map(s => ent(s, true, st)).join('')}
</div>` : ''}</section>`).join('') + `</div><p class="nores" id="nores" hidden></p>` }
