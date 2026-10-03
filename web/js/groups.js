// Catalog regroupings — alternative shelf cuts over the same entries, in catHTML's
// section shape [{name, tip?, spaces}]. family is the canonical README cut; purpose
// re-shelves by each space's primary task tag; era by birth year. Derivation is NOT
// here on purpose: the conversion graph is a tree with two giant hubs (xyz, rgb) —
// flat buckets would misfile it; it wants its own lineage view.
import { sections } from './render.js'
import { meta } from './core.js'
import PURPOSE, { ORDER, TIPS } from './purpose.js'
import { t } from './i18n.js'

const all = () => sections.flatMap(c => c.spaces)
// era shelves: CIE 1931 opens measurement, 1976 opens uniform spaces, then by decade
// (a decade's label is a phrase – '1990s', 'anos 1990' – so it reads through t() at call time)
const ERAS = [[1931, '1860–1930'], [1960, '1931–1959'], [1976, '1960–1975'], [1990, '1976–1989'], [2000, 1990], [2010, 2000], [2020, 2010], [Infinity, 2020]]

export default {
	family: () => sections,
	purpose: () => ORDER.map(p => ({ key: 'purpose.' + p, name: p[0].toUpperCase() + p.slice(1), tip: TIPS[p],
		spaces: all().filter(s => PURPOSE[s][0] === p) })).filter(c => c.spaces.length),
	era: () => ERAS.map(([until, name], i) => ({ name: typeof name === 'number' ? t('ui.group.decade', '{d}s', { d: name }) : name,
		spaces: all().filter(s => meta[s].year < until && (!i || meta[s].year >= ERAS[i - 1][0]))
			.sort((a, b) => meta[b].year - meta[a].year || a.localeCompare(b)) })).filter(c => c.spaces.length)
		.reverse(),   // the present leads — 2020s first, the pioneers close the list
}
