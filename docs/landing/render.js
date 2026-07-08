// Catalog markup — one template shared by the page (hydration) and
// scripts/generate-landing.js (static prerender, so crawlers see the full catalog).
// Each category: three lead cards with sliders, then the rest as compact sheet rows —
// every space shows its channel values as editable numbers beside the title.
import { space, meta, classify } from './core.js'
import CATS from './categories.js'

export const SPACES = Object.keys(space).filter(k => space[k] && space[k].name && meta[k] && meta[k].channels)
export const cname = c => c.name.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s*\b(percentage|percent|angle in degrees|in degrees)\b\s*$/i, '').trim()
export const unit = c => c.max === 360 ? '°' : (c.min === 0 && c.max === 100 ? '%' : '')
const mapped = new Set(CATS.flatMap(c => c.spaces))
export const sections = [...CATS.map(c => ({ name: c.name, spaces: c.spaces.filter(s => SPACES.includes(s)) })),
	{ name: 'more', spaces: SPACES.filter(s => !mapped.has(s)) }].filter(c => c.spaces.length)

export const LEADS = 4   // slider cards per category (fills the wide grid's top row); the rest are sheet rows

// shipped as working history — flagged 🕰 in the catalog, listed in the "Skipped" dossier
const HISTORICAL = new Set(['cie-rgb', 'ntsc', 'slog', 'redlog', 'panalog', 'viperlog', 'ryb', 'anlab'])
const ent = (s, lite) => { const cls = classify(s)
	const histo = HISTORICAL.has(s) ? `<i class="histo" title="historical — shipped as working history">🕰</i>` : ''
	return `<article class="ent${lite ? ' lite' : ''}" data-s="${s}">
	 <div class="eh"><span class="nm">${s}${histo}</span><span class="cvs">${cls.ch.map((c2, i) => `<input class="cv tnum" data-i="${i}" spellcheck="false" autocomplete="off" title="${cname(c2)}" aria-label="${s} ${cname(c2)}">`).join('')}</span></div>
	 <div class="chs">${cls.ch.map((c2, i) => `<div class="ch" data-i="${i}" title="${cname(c2)}"><div class="tk"></div><span class="sy">${c2.sym}</span></div>`).join('')}</div>
	</article>` }

export const catHTML = () =>
	`<nav class="toc" id="toc">${sections.map((c, i) => `<i class="tsp"></i><div class="ti" data-i="${i}"><button class="tn">${c.name}</button></div>`).join('')}</nav><div class="secs" id="secs">` + sections.map(c => `<section class="sec" data-sec><h2 class="shw">${c.name}<span class="c tnum">(${c.spaces.length})</span></h2><div class="grid">
	${c.spaces.slice(0, LEADS).map(s => ent(s, false)).join('')}
</div>${c.spaces.length > LEADS ? `<div class="sheet">
	${c.spaces.slice(LEADS).map(s => ent(s, true)).join('')}
</div>` : ''}</section>`).join('') + `</div>`
