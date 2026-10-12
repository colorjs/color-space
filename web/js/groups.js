// Catalog regroupings — alternative shelf cuts over the same entries, in catHTML's
// section shape [{name, tip?, spaces}]. family is the canonical README cut; purpose
// re-shelves by each space's primary task tag; era by birth year. Derivation is NOT
// here on purpose: the conversion graph is a tree with two giant hubs (xyz, rgb) —
// flat buckets would misfile it; it wants its own lineage view.
import { sections } from './render.js'
import { meta } from './core.js'
import PURPOSE, { ORDER, TIPS } from './purpose.js'
import ERAS from './eras.js'
import { t } from './i18n.js'

const all = () => sections.flatMap(c => c.spaces)

export default {
	family: () => sections,
	purpose: () => ORDER.map(p => ({ key: 'purpose.' + p, name: p[0].toUpperCase() + p.slice(1), tip: TIPS[p],
		spaces: all().filter(s => PURPOSE[s][0] === p) })).filter(c => c.spaces.length),
	era: () => ERAS.map((e, i) => ({ key: 'era.' + e.from, name: e.name || t('ui.group.decade', '{d}s', { d: e.from }), tip: e.tip,
		spaces: all().filter(s => (!i || meta[s].year >= e.from) && meta[s].year < (ERAS[i + 1]?.from ?? Infinity))
			.sort((a, b) => meta[b].year - meta[a].year || a.localeCompare(b)) })).filter(c => c.spaces.length)
		.reverse(),   // the present leads — 2020s first, the pioneers close the list
}
