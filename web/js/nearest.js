// The nearest of many colors, fast – for the large palettes (meodai's color-name-list, ~32,000 names), where a scan per
// pixel or per lattice cell is too slow. The sites binned on a grid in OKLab; a query searches the bins round its own,
// shell by shell, until no unsearched bin can hold a nearer site: exact under OKLab's distance. Another metric takes the
// k nearest in OKLab as its shortlist and decides among them (the lattice's contract: the fast propose, the exact decide).

/** sites: [{ ok: [L, a, b] }, …] → the grid over them, `n` bins a unit of OKLab */
export function okGrid(sites, n = 24) {
	const at = (o) => [Math.floor(o[0] * n), Math.floor((o[1] + 0.5) * n), Math.floor((o[2] + 0.5) * n)], bins = new Map()
	sites.forEach((s, i) => { const k = at(s.ok).join(); let b = bins.get(k); if (!b) bins.set(k, b = []); b.push(i) })
	return { sites, n, at, bins }
}

/** The indices of the `k` sites nearest `ok` (OKLab), nearest first */
export function nearestK(g, ok, k = 1) {
	if (!g.sites.length) return []
	const [cx, cy, cz] = g.at(ok), best = []   // [d², i], kept sorted, at most k
	const take = (i) => { const s = g.sites[i].ok, d = (s[0] - ok[0]) ** 2 + (s[1] - ok[1]) ** 2 + (s[2] - ok[2]) ** 2
		if (best.length === k && d >= best[k - 1][0]) return
		let j = best.length < k ? best.length : k - 1; best[j] = [d, i]
		while (j > 0 && best[j - 1][0] > d) { [best[j - 1], best[j]] = [best[j], best[j - 1]]; j-- } }
	for (let r = 0; r <= 2 * g.n; r++) {
		// a site in shell r is at least r − 1 bins away: once that is past the k-th found, none can be nearer
		if (best.length === k && ((r - 1) / g.n) ** 2 > best[k - 1][0]) break
		for (let x = -r; x <= r; x++) for (let y = -r; y <= r; y++) for (let z = -r; z <= r; z++) {
			if (Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) !== r) continue
			const b = g.bins.get(`${cx + x},${cy + y},${cz + z}`); if (b) for (const i of b) take(i) }
	}
	return best.map((x) => x[1])
}
