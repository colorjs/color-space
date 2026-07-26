// Catalog regroupings — alternative shelf cuts over the same entries, in catHTML's
// section shape [{name, tip?, spaces}]. family is the canonical README cut; purpose
// re-shelves by each space's primary task tag; era by birth year. Derivation is NOT
// here on purpose: the conversion graph is a tree with two giant hubs (xyz, rgb) —
// flat buckets would misfile it; it wants its own lineage view.
import { sections } from './render.js'
import { meta } from './core.js'
import PURPOSE, { ORDER, TIPS } from './purpose.js'

const all = () => sections.flatMap(c => c.spaces)
// era shelves: CIE 1931 opens measurement, 1976 opens uniform spaces, then by decade
const ERAS = [[1931, '1860–1930'], [1960, '1931–1959'], [1976, '1960–1975'], [1990, '1976–1989'], [2000, '1990s'], [2010, '2000s'], [2020, '2010s'], [Infinity, '2020s']]

export default {
	family: () => sections,
	purpose: () => ORDER.map(t => ({ name: t[0].toUpperCase() + t.slice(1), tip: TIPS[t],
		spaces: all().filter(s => PURPOSE[s][0] === t) })).filter(c => c.spaces.length),
	era: () => ERAS.map(([until, name], i) => ({ name,
		spaces: all().filter(s => meta[s].year < until && (!i || meta[s].year >= ERAS[i - 1][0]))
			.sort((a, b) => meta[a].year - meta[b].year || a.localeCompare(b)) })).filter(c => c.spaces.length),
}
