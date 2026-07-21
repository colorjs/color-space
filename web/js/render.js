// Catalog markup — one template shared by the page (hydration) and
// scripts/generate-landing.js (static prerender, so crawlers see the full catalog).
// Each category: three lead cards with sliders, then the rest as compact sheet rows —
// every space shows its channel values as editable numbers beside the title.
// The prerender passes the DEFAULT color state, so values, slider gradients and tick
// markers are baked into the static HTML — the catalog is complete at first paint,
// before any script runs; the page's stamp-skip repaints only what actually changes.
import { space, meta, classify, ramp, hex, toSpace, clamp } from './core.js'
import CATS from './categories.js'

export const SPACES = Object.keys(space).filter(k => space[k] && space[k].name && meta[k] && meta[k].channels)
export const cname = c => c.name.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/(\s*\b(percentage|percent|angle in degrees|in degrees|axis|component|coordinate)\b\s*)+$/i, '').trim()
// display name — the uppercased id, except names the ascii id can only transliterate
// (uppercasing the Greek would corrupt it, so values here are display-final)
const DISP = { lalphabeta: 'lαβ' }
export const disp = s => DISP[s] || s.toUpperCase()
export const unit = c => c.max === 360 ? '°' : (c.min === 0 && c.max === 100 ? '%' : '')
const mapped = new Set(CATS.flatMap(c => c.spaces))
export const sections = [...CATS.map(c => ({ name: c.name, spaces: c.spaces.filter(s => SPACES.includes(s)) })),
	{ name: 'more', spaces: SPACES.filter(s => !mapped.has(s)) }].filter(c => c.spaces.length)

export const LEADS = 3   // slider cards per category (the row's featured spaces); the rest are sheet rows

// the color every visitor arrives at — one source for the page's boot state AND the prerender
export const DEFAULT = { s: 'oklch', vals: [0.72, 0.16, 41] }

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
const ent = (s, lite, st) => { const cls = classify(s)
	let vals = null; if (st) { try { vals = s === DEFAULT.s ? DEFAULT.vals : toSpace(s, st.rgb) } catch { vals = null } }
	const full = vals && !lite   // lead cards bake sliders + ticks; sheet rows bake values only
	const tk = i => { const c = cls.ch[i], f = clamp((vals[i] - c.min) / (c.max - c.min), 0, 1)
		return ` style="left:${+(f * 100).toFixed(3)}%;background:${st.hx};border-color:${st.ink}"` }
	return `<article class="ent${lite ? ' lite' : ''}" data-s="${s}"${vals ? ` data-v="${st.hx}${full ? '' : ':l'}"${full ? ` data-g="${st.hx}:0"` : ''}` : ''} style="--nch:${cls.ch.length}">
	 <div class="eh"><button class="nm" type="button" title="${s}" aria-label="Open ${s} color-space dossier">${disp(s)}</button><span class="cvs">${cls.ch.map((c2, i) => `<span class="cvp"><i class="cl" aria-hidden="true">${c2.sym.slice(0, 2)}</i><input class="cv tnum" data-i="${i}" spellcheck="false" autocomplete="off" title="${cname(c2)}" aria-label="${s} ${cname(c2)}"${vals ? ` value="${fmtc(vals[i], c2)}"` : ''}><span class="stk" aria-hidden="true"><button class="up" tabindex="-1">⌃</button><button class="dn" tabindex="-1">⌃</button></span></span>`).join('')}</span></div>
	 <div class="chs">${cls.ch.map((c2, i) => `<div class="ch" data-i="${i}" title="${cname(c2)}"${full ? ` style="background:linear-gradient(90deg, ${ramp(s, vals, i, c2.min, c2.max, 8).join(',')})"` : ''}><div class="tk"${full ? tk(i) : ''}></div></div>`).join('')}</div>
	</article>` }

// m: optional color state to bake in ({ s, vals } — the prerender passes DEFAULT);
// omitted (the page's fingerprint check) → the bare template, byte-stable across colors
export const catHTML = m => { let st = null
	if (m) { const rgb = rgbF(m.s, m.vals); st = { rgb, hx: hex(rgb), ink: ink(rgb) } }
	return `<nav class="toc" id="toc">${sections.map((c, i) => `<i class="tsp"></i><div class="ti" data-i="${i}"><button class="tn">${c.name}<span class="tc tnum">${c.spaces.length}</span></button></div>`).join('')}</nav><div class="secs" id="secs">` + sections.map(c => `<section class="sec" data-sec><h2 class="shw">${c.name}<span class="c tnum">${c.spaces.length}</span></h2><div class="grid">
	${c.spaces.slice(0, LEADS).map(s => ent(s, false, st)).join('')}
</div>${c.spaces.length > LEADS ? `<div class="sheet">
	${c.spaces.slice(LEADS).map(s => ent(s, true, st)).join('')}
</div>` : ''}</section>`).join('') + `</div><p class="nores" id="nores" hidden></p>` }
