// Color names found for what is typed – the color field's search. Pure: the page hands the lists in, [source, [[name,
// rgb], …]] in preference order (a name in two lists is kept once, from the first). A name ranks by how it meets the
// typed text: whole, its start, a word's start, anywhere in it – spaces, hyphens and apostrophes aside, so "dodger blue"
// is dodgerblue – then shorter first; a picked one rises (`rank`, a name's weight). With few found, a typo is forgiven:
// one edit in a word of four to six letters, two from seven (Damerau–Levenshtein, against the name and its start).

const norm = s => s.toLowerCase().replace(/[\s'’-]+/g, '')

// how a name meets k (normalized) or q (as typed, lowercased): 0 whole · 1 its start · 2 a word's start · 3 inside it
const meet = (k, q, name) => { const m = norm(name)
	if (m === k) return 0
	if (m.startsWith(k)) return 1
	const low = name.toLowerCase(); if (low.split(/[\s-]+/).some(w => w.startsWith(q))) return 2
	return m.includes(k) ? 3 : Infinity }

// optimal-string-alignment distance, given up past `max`
export function edits(a, b, max) {
	if (Math.abs(a.length - b.length) > max) return max + 1
	let p2 = null, p = Array.from({ length: b.length + 1 }, (_, j) => j)
	for (let i = 1; i <= a.length; i++) { const c = [i]; let low = i
		for (let j = 1; j <= b.length; j++) {
			let d = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
			if (p2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d = Math.min(d, p2[j - 2] + 1)
			c.push(d); if (d < low) low = d }
		if (low > max) return max + 1
		p2 = p; p = c }
	return p[b.length] }

/** The `n` names best met by `q`: [{ src, name, rgb }] */
export function findNames(q, lists, n = 8, rank = () => 0) {
	const k = norm(q), ql = q.trim().toLowerCase(); if (!k) return []
	const best = new Map()
	const put = (src, o, name, rgb, s) => { const id = norm(name), b = best.get(id)
		if (!b || s < b.s || (s === b.s && o < b.o)) best.set(id, { src, o, name, rgb, s }) }
	lists.forEach(([src, list], o) => { for (const [name, rgb] of list) { const s = meet(k, ql, name); if (s < Infinity) put(src, o, name, rgb, s) } })
	if (best.size < n && k.length >= 4) { const max = k.length >= 7 ? 2 : 1
		lists.forEach(([src, list], o) => { for (const [name, rgb] of list) { const m = norm(name)
			const e = Math.min(edits(k, m, max), edits(k, m.slice(0, k.length), max)); if (e <= max) put(src, o, name, rgb, 4 + e) } }) }
	return [...best.values()].sort((a, b) => a.s - b.s || rank(b.name) - rank(a.name) || a.name.length - b.name.length || a.o - b.o)
		.slice(0, n).map(({ src, name, rgb }) => ({ src, name, rgb })) }
