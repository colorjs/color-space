// Catalog regroupings — alternative shelf cuts over the same entries, in catHTML's
// section shape [{name, tip?, spaces}]. family is the canonical README cut; purpose
// re-shelves by each space's primary task tag; era by birth year; bookmarks are the visitor's own. Derivation is NOT
// here on purpose: the conversion graph is a tree with two giant hubs (xyz, rgb) —
// flat buckets would misfile it; it wants its own lineage view.
import { sections } from './render.js'
import { meta } from './core.js'
import PURPOSE, { ORDER, TIPS } from './purpose.js'
import ERAS from './eras.js'
import { t } from './i18n.js'

const all = () => sections.flatMap(c => c.spaces)
// the spaces a visitor bookmarked, in the order bookmarked – the page keeps it (index.html, csBookmarks); the bookmarks cut
// shelves them
export const BOOKMARKS = new Set()

// author: who made a space, from its @by – the standards bodies, the people with several spaces to their name, the
// makers of cameras, displays and software, and the researchers with one or two. A space by a body and a person
// ("David MacAdam / CIE") shelves with the body
const BY = [
	['cie', /\bCIE\b/, 'CIE', () => t('ui.author.cie', 'Commission Internationale de l’Éclairage, since 1913 – the measure of color itself: the 1931 observer, XYZ, Lab, Luv')],
	['itu', /ITU|CCIR/, 'ITU', () => t('ui.author.itu', 'International Telecommunication Union, radio sector (once CCIR) – the color of every television: Rec. 601, 709, 2020, 2100')],
	['smpte', /SMPTE/, 'SMPTE', () => t('ui.author.smpte', 'Society of Motion Picture and Television Engineers, since 1916 – the studio’s and the cinema’s standards')],
	['ampas', /Academy|AMPAS/, 'Academy (ACES)', () => t('ui.author.ampas', 'Academy of Motion Picture Arts and Sciences – ACES, one open color pipeline from camera to archive')],
	['ottosson', /Ottosson/, 'Björn Ottosson', () => t('ui.author.ottosson', 'Graphics programmer; OKLab, from his 2020 blog post, became CSS’s oklab() and oklch() – Okhsl and Okhsv followed in 2021')],
	['fairchild', /Fairchild/, 'Mark Fairchild', () => t('ui.author.fairchild', 'Color scientist at RIT’s Munsell Color Science Laboratory, author of Color Appearance Models – RLAB, IPT, the HDR spaces')],
	['luo', /\bLuo\b/, 'M. Ronnier Luo', () => t('ui.author.luo', 'Color scientist at Leeds and Zhejiang; co-author of CIEDE2000, CIECAM02 and CAM16 – their uniform spaces here')],
	['bodies', ['ANSI', 'DCI', 'DIN', 'ECI', 'FCC', 'ICC', 'IEC', 'NTSC', 'OSA', 'RAL'], () => t('ui.author.bodies', 'National and industry standards'), list => t('ui.author.bodies-tip', 'One market’s color fixed by its own body: {list}', { list })],
	['cameras', ['ARRI', 'Blackmagic', 'Canon', 'DJI', 'FiLMiC', 'FilmLight', 'Fujifilm', 'GoPro', 'Insta360', 'Leica', 'Nikon', 'OPPO', 'Panasonic', 'Panavision', 'RED', 'Sony', 'Xiaomi'], () => t('ui.author.cameras', 'Camera makers'), list => t('ui.author.cameras-tip', 'A sensor’s whole light kept for the grade, in each maker’s log curve and gamut: {list}', { list })],
	['industry', ['Adobe', 'Apple', 'C-Cube', 'Chilliant', 'Dolby', 'Eagle', 'Google', 'HP', 'HutchColor', 'Kodak', 'Microsoft', 'Radius', 'Telefunken', 'Thomson', 'Xerox'], () => t('ui.author.industry', 'Industry'), list => t('ui.author.industry-tip', 'The screens, files and inks every color passes through: {list}', { list })],
]
// a pooled shelf lists its makers by name – the names it is pooled by, each as a whole word of an @by
const word = n => new RegExp(`(^|[^\\p{L}])${n}([^\\p{L}]|$)`, 'u'), has = (n, s) => word(n).test(meta[s].by || '')
const makers = (names, ss) => { if (!Array.isArray(names)) return ''
	const n = names.map(m => [m, ss.filter(s => has(m, s)).length]).filter(([, k]) => k), lead0 = n.filter(([, k]) => k > 1).sort((a, b) => b[1] - a[1]).map(([m]) => m), lead = lead0.length ? lead0 : n.map(([m]) => m)   // none of two or more: every name
	return lead.join(', ') + (n.length > lead.length ? t('ui.author.more', ' and {n} more', { n: n.length - lead.length }) : '') }   // the makers of two or more by name, most first; the rest counted
const byOf = s => { const b = meta[s].by || ''; return (BY.find(([, m]) => Array.isArray(m) ? m.some(n => has(n, s)) : m.test(b)) || ['people'])[0] }

export default {
	family: () => sections,
	purpose: () => ORDER.map(p => ({ key: 'purpose.' + p, name: p[0].toUpperCase() + p.slice(1), tip: TIPS[p],
		spaces: all().filter(s => PURPOSE[s][0] === p) })).filter(c => c.spaces.length),
	era: () => ERAS.map((e, i) => ({ key: 'era.' + e.from, name: e.name || t('ui.group.decade', '{d}s', { d: e.from }), tip: e.tip,
		spaces: all().filter(s => (!i || meta[s].year >= e.from) && meta[s].year < (ERAS[i + 1]?.from ?? Infinity))
			.sort((a, b) => meta[b].year - meta[a].year || a.localeCompare(b)) })).filter(c => c.spaces.length)
		.reverse(),   // the present leads — 2020s first, the pioneers close the list
	author: () => [...BY, ['people', null, () => t('ui.author.people', 'Researchers'), () => t('ui.author.people-tip', 'A space or two to each name, from Maxwell and Helmholtz to today’s color scientists')]]
		.map(([k, m, name, tip]) => { const spaces = all().filter(s => byOf(s) === k).sort((a, b) => (meta[a].by || '').localeCompare(meta[b].by || '') || meta[a].year - meta[b].year)
			return { key: 'author.' + k, name: typeof name === 'function' ? name() : name, tip: tip(makers(m, spaces)), spaces } })
		.filter(c => c.spaces.length),   // a maker's spaces together, then by year
	bookmarks: () => [{ key: 'bookmarks', name: t('ui.group.bookmarks', 'Bookmarks'), tip: t('ui.group.bookmarks-tip', 'The spaces you bookmarked, side by side – kept in this browser'), spaces: [...BOOKMARKS] }],
}
