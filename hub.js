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
 *
 * On composed paths, trailing params bind to the source space's outgoing edge
 * when it is parametric (`ycbcr.hsl(y, cb, cr, kb, kr)`), otherwise to the target
 * space's incoming edge (`hsl.ycbcr(h, s, l, kb, kr)`). Converting between two
 * parametric spaces with different params isn't expressible positionally — call
 * the two legs explicitly. Each hub owns copies of the space objects, so hubs and
 * `register()` never mutate the `spaces/*.js` singletons or each other.
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

// monomorphic array→call adapters for composed chains: the hop's channel count is
// known at wiring, so no call ever rests or spreads (≤4 channels covers every space)
const call = (fn, n) =>
	n === 3 ? v => fn(v[0], v[1], v[2])
	: n === 1 ? v => fn(v[0])
	: n === 4 ? v => fn(v[0], v[1], v[2], v[3])
	: n === 2 ? v => fn(v[0], v[1])
	: v => fn(...v)
const callP = (fn, n) =>
	n === 3 ? (v, p0, p1) => fn(v[0], v[1], v[2], p0, p1)
	: n === 1 ? (v, p0, p1) => fn(v[0], p0, p1)
	: n === 4 ? (v, p0, p1) => fn(v[0], v[1], v[2], v[3], p0, p1)
	: n === 2 ? (v, p0, p1) => fn(v[0], v[1], p0, p1)
	: (v, p0, p1) => fn(...v, p0, p1)

// batch-aware face over a raw scalar conversion: first-arg dispatch, scalar path
// allocation-free (fixed arity — ≤4 channels + ≤2 trailing params covers every space)
const batched = (scalar, from, to) => {
	const si = from.range.length
	const fn = (a, b, c, d, e) => {
		if (typeof a === 'object' && a !== null) return batch(scalar, from, to, a, b, c)
		if ((si === 3 ? c : si === 4 ? d : si === 2 ? b : a) === undefined)
			throw Error(`color-space: ${from.name}→${to.name} expects ${si} channel values`)
		return scalar(a, b, c, d, e)
	}
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
 * (identity included) with the batch form.
 * @param {Object<string, space>} space registry, keyed by space name
 */
export function wire(space) {
	const names = Object.keys(space)
	const registered = new Set(names)

	// drop faces we wired to spaces since deleted from the registry — so
	// `delete space.foo; wire(space)` leaves no stale conversions behind
	for (const a of names) for (const k of Object.keys(space[a]))
		if (!registered.has(k) && typeof space[a][k] === 'function' && space[a][k].scalar) delete space[a][k]

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

	// one BFS per source: predecessor map over the whole graph, not a path per pair
	const tree = (from) => {
		const prev = { [from]: null }, queue = [from]
		for (let i = 0; i < queue.length; i++)
			for (const next in direct[queue[i]])
				if (!(next in prev)) { prev[next] = queue[i]; queue.push(next) }
		return prev
	}

	for (const from of names) {
		const prev = tree(from), si = space[from].range.length
		for (const to of names) {
			if (from === to) {
				const id = (...args) => args.slice(0, si)
				id.chained = true // not a source edge
				space[from][to] = batched(id, space[from], space[to])
				continue
			}
			let scalar = direct[from][to]
			if (!scalar) {
				if (!(to in prev)) continue
				const path = [to]
				for (let n = to; (n = prev[n]) !== null;) path.unshift(n)
				const steps = path.slice(1).map((n, i) => direct[path[i]][n])
				// per-hop arity is known at wiring — monomorphic callers keep every hop
				// rest/spread-free (the spread form used to cost more than the math itself);
				// hop 0 is called directly by the entry, no caller needed
				const callers = steps.map((fn, i) => i ? call(fn, space[path[i]].range.length) : null)
				const n = steps.length
				// params bind to the source's outgoing edge when parametric (declared
				// arity beyond its channels), else to the target's incoming edge
				const last = n - 1
				if (steps[0].length <= si && steps[last].length > space[path[last]].range.length) {
					const fin = callP(steps[last], space[path[last]].range.length)
					scalar = si === 3
						? (a, b, c, p0, p1) => { let v = steps[0](a, b, c); for (let i = 1; i < last; i++) v = callers[i](v); return fin(v, p0, p1) }
						: (...args) => {
							const params = args.slice(si)
							let vals = args.slice(0, si)
							for (let i = 0; i < last; i++) vals = steps[i](...vals)
							return steps[last](...vals, ...params)
						}
				} else {
					// one fixed entry serves every source arity: batched always forwards
					// (a,b,c,d,e) positionally, and a step ignores slots past its params
					scalar = (a, b, c, d, e) => { let v = steps[0](a, b, c, d, e); for (let i = 1; i < n; i++) v = callers[i](v); return v }
				}
				scalar.chained = true // rebuilt from source edges on re-wiring
			}
			space[from][to] = batched(scalar, space[from], space[to])
		}
	}
}

/**
 * Build a registry from a list of spaces and wire the graph once. Every space is
 * shallow-copied in: hubs never mutate the space singletons or each other.
 * @param {space[]} spaces
 * @returns {Object<string, space>}
 */
export function createHub(spaces) {
	const space = {}
	for (const s of spaces) space[s.name] = { ...s }
	wire(space)
	return space
}

/**
 * Validate a space object for registration: fail first, not at first conversion.
 * @param {Object<string, space>} space registry the space is joining
 * @param {space} s candidate space
 */
export function validate(space, s) {
	if (!s || typeof s.name !== 'string' || !s.name) throw Error('color-space: register expects a space with a string `name`')
	if (s.name === 'name' || s.name === 'range') throw Error(`color-space: '${s.name}' is reserved and cannot be a space name`)
	if (space[s.name]) throw Error(`color-space: '${s.name}' is already registered`)
	if (!Array.isArray(s.range) || !s.range.length || !s.range.every((r) => Array.isArray(r) && r.length === 2 && r.every(Number.isFinite)))
		throw Error(`color-space: '${s.name}' needs a \`range\` — an array of [min, max] per channel`)
	const names = Object.keys(space)
	if (names.length && !names.some((n) => typeof s[n] === 'function'))
		throw Error(`color-space: '${s.name}' needs an outgoing conversion to a registered space`)
}

/**
 * Register a new space with at least one edge in EACH direction, then wire the
 * now-strongly-connected graph. `s.rgb`, for example, converts new→rgb; the
 * matching `from.rgb` converts rgb→new. Requiring both directions keeps the
 * hub's defining promise true after extension: every registered pair converts.
 * @param {Object<string, space>} space registry being extended
 * @param {space} s new space object (copied; never mutated)
 * @param {Object<string, Function>} from existing-space name → existing→new converter
 * @returns {Object<string, space>} the same, extended registry
 */
export function registerSpace(space, s, from) {
	validate(space, s)
	if (!from || typeof from !== 'object' || Array.isArray(from))
		throw Error(`color-space: '${s.name}' needs a reverse conversion map, e.g. { rgb: rgbToNew }`)
	const incoming = Object.entries(from)
	if (!incoming.length) throw Error(`color-space: '${s.name}' needs at least one conversion from a registered space`)
	for (const [name, fn] of incoming) {
		if (!space[name]) throw Error(`color-space: reverse conversion source '${name}' is not registered`)
		if (typeof fn !== 'function') throw Error(`color-space: reverse conversion '${name}→${s.name}' must be a function`)
	}
	space[s.name] = { ...s }
	for (const [name, fn] of incoming) space[name][s.name] = fn
	wire(space)
	return space
}
