/**
 * Hub machinery shared by the catalogs (index.js — every space, lite.js — the
 * wasm-covered set): wires the conversion graph and gives every wired pair the
 * same two-form API as `color-space/wasm`:
 *
 *     space.from.to(c0, c1, c2, …params)  // scalar → [c0′, c1′, c2′]
 *     space.from.to(pixels, …params)      // batch: array-like → new Float64Array
 *
 * A batch input is channel-interleaved pixels; the stride is each space's channel
 * count (`range.length`), so rgb→cmyk maps 3n values to 4n and kelvin→rgb 1n to 3n.
 * Trailing params (e.g. ycbcr's kb, kr) reach every pixel. Output is always a new
 * Float64Array — never in place, and never the input's container (writing oklch
 * into ImageData's Uint8ClampedArray would truncate it); zero-copy stays with
 * wasm's alloc(). A batch of one is exactly the v2 calling convention:
 * `rgb.lab([255, 0, 0])`.
 */

// batch loop: src interleaved by `from`'s channels → new Float64Array by `to`'s
const batch = (scalar, from, to, src, p0, p1) => {
	const si = from.range.length, so = to.range.length
	const n = src.length / si
	if (!Number.isInteger(n)) throw Error(`color-space: ${from.name}→${to.name} batch expects ${si}·n interleaved values, got length ${src.length}`)
	const out = new Float64Array(n * so)
	for (let i = 0, k = 0, o = 0; i < n; i++, k += si, o += so) {
		const v = si === 3 ? scalar(src[k], src[k + 1], src[k + 2], p0, p1)
			: si === 1 ? scalar(src[k], p0, p1)
			: si === 4 ? scalar(src[k], src[k + 1], src[k + 2], src[k + 3], p0, p1)
			: si === 2 ? scalar(src[k], src[k + 1], p0, p1)
			: scalar(...Array.prototype.slice.call(src, k, k + si), p0, p1)
		for (let j = 0; j < so; j++) out[o + j] = v[j]
	}
	return out
}

// batch-aware face over a raw scalar conversion: first-arg dispatch, scalar path
// allocation-free (fixed arity — ≤4 channels + ≤2 trailing params covers every space)
const batched = (scalar, from, to) => {
	const fn = (a, b, c, d, e) =>
		typeof a === 'object' && a !== null
			? batch(scalar, from, to, a, b, c)
			: scalar(a, b, c, d, e)
	fn.scalar = scalar
	return fn
}

/**
 * Wire conversions between every pair of spaces in the registry.
 *
 * Each space file declares conversions only to its natural neighbours (e.g.
 * `oklab.rgb`, `din99o-lab.lab`). This builds the conversion graph from those
 * direct edges, fills every remaining pair with the shortest-path composition —
 * so any space reaches any other with the fewest hops — and faces every pair
 * with the batch form.
 * @param {Object<string, space>} space registry, keyed by space name
 */
export function wire(space) {
	const names = Object.keys(space)

	// direct adjacency: conversions defined in the source files, unwrapped to raw
	// scalars (not our batch faces, not our compositions) — so re-wiring always
	// rebuilds from source edges
	const direct = {}
	for (const a of names) {
		direct[a] = {}
		for (const b of names) {
			if (a === b || typeof space[a][b] !== 'function') continue
			const fn = space[a][b].scalar || space[a][b]
			if (!fn.chained) direct[a][b] = fn
		}
	}

	// shortest path of direct conversions from `from` to `to` (BFS)
	const path = (from, to) => {
		const queue = [[from]], seen = new Set([from])
		while (queue.length) {
			const p = queue.shift(), last = p[p.length - 1]
			for (const next in direct[last]) {
				if (next === to) return [...p, next]
				if (!seen.has(next)) { seen.add(next); queue.push([...p, next]) }
			}
		}
		return null
	}

	for (const from of names) for (const to of names) {
		if (from === to) continue
		let scalar = direct[from][to]
		if (!scalar) {
			const p = path(from, to)
			if (!p) continue
			const steps = p.slice(1).map((n, i) => direct[p[i]][n])
			scalar = (...args) => steps.reduce((vals, fn) => fn(...vals), args)
			scalar.chained = true // rebuilt from source edges on re-wiring
		}
		space[from][to] = batched(scalar, space[from], space[to])
	}
}

/**
 * Build a registry from a list of spaces and wire the graph once.
 * @param {space[]} spaces
 * @returns {Object<string, space>}
 */
export function createHub(spaces) {
	const space = {}
	for (const s of spaces) space[s.name] = s
	wire(space)
	return space
}
