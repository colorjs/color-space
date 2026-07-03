// Catalog markup — one template shared by the page (hydration) and
// scripts/generate-landing.js (static prerender, so crawlers see the full catalog).
import { space, meta, classify } from './core.js'
import CATS from './categories.js'

export const SPACES = Object.keys(space).filter(k => space[k] && space[k].name && meta[k] && meta[k].channels)
export const cname = c => c.name.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s*\b(percentage|percent|angle in degrees|in degrees)\b\s*$/i, '').trim()
export const unit = c => c.max === 360 ? '°' : (c.min === 0 && c.max === 100 ? '%' : '')
const mapped = new Set(CATS.flatMap(c => c.spaces))
export const sections = [...CATS.map(c => ({ name: c.name, spaces: c.spaces.filter(s => SPACES.includes(s)) })),
	{ name: 'more', spaces: SPACES.filter(s => !mapped.has(s)) }].filter(c => c.spaces.length)

export const catHTML = () =>
	`<nav class="toc" id="toc">${sections.map((c, i) => `<i class="tsp"></i><button class="ti" data-i="${i}">${c.name}<span class="c tnum">${c.spaces.length}</span></button>`).join('')}</nav><div class="secs" id="secs">` + sections.map(c => `<section class="sec" data-sec><h2 class="shw"><button class="sh" aria-expanded="false">${c.name}<span class="c tnum">${c.spaces.length}</span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button></h2><button class="mo" aria-expanded="false" title="all ${c.name} spaces" aria-label="show all ${c.name} spaces"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button><div class="grid">
	${c.spaces.map(s => { const cls = classify(s)
		return `<article class="ent" data-s="${s}">
		 <div class="eh"><span class="nm">${s}</span><input class="hx tnum" spellcheck="false" autocomplete="off" aria-label="${s} value"></div>
		 <div class="chs">${cls.ch.map((c2, i) => `<div class="ch" data-i="${i}" title="${cname(c2)}"><div class="tk"></div><span class="sy">${c2.sym}</span><span class="nvw"><b class="nv tnum"></b><i class="u">${unit(c2)}</i></span></div>`).join('')}</div>
		</article>` }).join('')}
</div></section>`).join('') + `</div>`
