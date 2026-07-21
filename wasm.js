/**
 * color-space/wasm — whole-buffer color conversion, compiled ahead-of-time to WASM.
 *
 * The scalar API (`color-space`) is the right tool for single colors. This is the
 * other half of the kernel: convert a whole image-sized buffer in one call, with
 * the per-pixel formulas running as a tight WASM loop (jz @ optimize:'speed' —
 * fast cbrt/pow, so even perceptual paths beat JS). Zero runtime dependency: the
 * ~45 kB module (≈33 kB wasm) is prebuilt and inlined (see scripts/build-wasm.js).
 *
 * The API is the scalar library's, batch-shaped — same `space.from.to` addressing:
 *
 *     import space, { alloc } from 'color-space/wasm'
 *     space.oklch.rgb(0.72, 0.16, 41)   // → [246, 125, 79] — scalar, same as JS
 *     const buf = alloc(nPixels)        // WASM-backed Float64Array(n*3) — write rgb here
 *     space.rgb.oklch(buf)              // whole buffer, in place, zero-copy
 *     space.rgb.oklch(pixels)           // plain array in → converted Float64Array out
 *
 * Every edge ships in two forms: a scalar kernel — a true WASM multi-value
 * function, `rgb_lrgb(r, g, b) → (r′, g′, b′)`, the same signature as the scalar
 * library — and an `_n`-suffixed batch loop over the working buffer that reuses
 * that kernel per pixel. Scalar calls thread the edge path through multi-value
 * returns; they never touch the working buffer.
 *
 * HUB-ONLY, and that is the honest shape. The scalar and GL tiers offer per-space
 * imports (`color-space/oklch`, `color-space/gl/oklch`) because their payload is
 * source — a bundler tree-shakes it. A WASM binary is atomic: one module holds
 * every covered space, so there is nothing to shake and no `color-space/wasm/oklch`.
 * You still address per-space — `space.oklch.rgb` — just through the hub. (True
 * per-space compilation was measured and declined: each module re-embeds ~7-9 kB of
 * shared transcendentals, a net loss for 27 spaces.)
 *
 * Layout: interleaved 3-channel `Float64Array`, n pixels = 3n values
 * [c0,c1,c2, c0,c1,c2, …]. Ranges match the scalar API (rgb 0-255, oklab native,
 * xyz 0-100). Formulas mirror the scalar library and are pinned by test/wasm-batch.js.
 *
 * THE WIN IS ZERO-COPY: an alloc()'d buffer converts in place — nothing crosses the
 * JS/WASM boundary. Any other array-like is copied through (returned as a new
 * Float64Array, input untouched) — fine for a chain, but prefer alloc() on a hot path.
 */
import b64 from './wasm/binary.js'
import { spaces as WASM_SPACES } from './wasm/spaces.js'

let ex, i64p, scratch, scratchN = 0, scratchActive = 0

function instance() {
	if (!ex) {
		const bytes = typeof Buffer !== 'undefined'
			? Buffer.from(b64, 'base64')
			: Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
		const mod = new WebAssembly.Module(bytes)
		ex = new WebAssembly.Instance(mod, {}).exports
		// jz:i64exp custom section (JSON) names which param positions of each export
		// ride the i64 carrier (f64 bits in a BigInt) instead of plain f64
		i64p = new Map()
		const sec = WebAssembly.Module.customSections(mod, 'jz:i64exp')
		if (sec.length) for (const e of JSON.parse(new TextDecoder().decode(new Uint8Array(sec[0])))) i64p.set(e.name, new Set(e.p || []))
	}
	return ex
}

// jz returns a typed array as a NaN-boxed i64; its low 32 bits are the byte offset
// of the data in linear memory — all we need to build a zero-copy view over it.
const ptr = (box) => Number(box & 0xffffffffn)

// jz multi-value lanes (and i64exp-marked params) ride i64 carrying raw f64 bits —
// reinterpret across the boundary in both directions
const dv = new DataView(new ArrayBuffer(8))
const f64 = (v) => typeof v === 'bigint' ? (dv.setBigUint64(0, v), dv.getFloat64(0)) : v
const bits = (x) => (dv.setFloat64(0, x), dv.getBigUint64(0))

// call one scalar edge kernel: box the i64-carrier params, unbox the result lanes
const edge = (name, a, b, c) => {
	const p = i64p.get(name)
	const v = ex[name](p && p.has(0) ? bits(a) : a, p && p.has(1) ? bits(b) : b, p && p.has(2) ? bits(c) : c)
	return [f64(v[0]), f64(v[1]), f64(v[2])]
}

// Primitive-edge graph (mirrors the scalar library's natural neighbours). Each edge
// maps a space->space step to a WASM export pair: the scalar kernel (this name) and
// its `_n` batch loop; multi-hop conversions compose by walking this graph (BFS) and
// calling each edge in turn. polar_fwd/polar_inv are the one generic
// cartesian<->cylindrical pair shared by every LCh-family space.
const GRAPH = {
	rgb: { lrgb: 'rgb_lrgb' },
	lrgb: { rgb: 'lrgb_rgb', xyz: 'lrgb_xyz', oklab: 'lrgb_oklab' },
	xyz: {
		lrgb: 'xyz_lrgb', lab: 'xyz_lab', 'lab-d65': 'xyz_labd65', luv: 'xyz_luv',
		jzazbz: 'xyz_jzazbz', ictcp: 'xyz_ictcp', ipt: 'xyz_ipt', din99d: 'xyz_din99d',
		logc4: 'xyz_logc4', slog3: 'xyz_slog3', vlog: 'xyz_vlog', log3g10: 'xyz_log3g10', clog2: 'xyz_clog2',
	},
	oklab: { lrgb: 'oklab_lrgb', oklrab: 'oklab_oklrab', oklch: 'polar_fwd' },
	oklrab: { oklab: 'oklrab_oklab', oklrch: 'polar_fwd' },
	oklch: { oklab: 'polar_inv' },
	oklrch: { oklrab: 'polar_inv' },
	lab: { xyz: 'lab_xyz', lchab: 'polar_fwd' },
	lchab: { lab: 'polar_inv' },
	'lab-d65': { xyz: 'labd65_xyz', 'lch-d65': 'polar_fwd', 'din99o-lab': 'labd65_din99olab' },
	'lch-d65': { 'lab-d65': 'polar_inv' },
	'din99o-lab': { 'lab-d65': 'din99olab_labd65', 'din99o-lch': 'polar_fwd' },
	'din99o-lch': { 'din99o-lab': 'polar_inv' },
	luv: { xyz: 'luv_xyz', lchuv: 'polar_fwd' },
	lchuv: { luv: 'polar_inv', hsluv: 'lchuv_hsluv', hpluv: 'lchuv_hpluv' },
	hsluv: { lchuv: 'hsluv_lchuv' },
	hpluv: { lchuv: 'hpluv_lchuv' },
	jzazbz: { xyz: 'jzazbz_xyz', jzczhz: 'polar_fwd' },
	jzczhz: { jzazbz: 'polar_inv' },
	ictcp: { xyz: 'ictcp_xyz' },
	ipt: { xyz: 'ipt_xyz' },
	din99d: { xyz: 'din99d_xyz' },
	logc4: { xyz: 'logc4_xyz' },
	slog3: { xyz: 'slog3_xyz' },
	vlog: { xyz: 'vlog_xyz' },
	log3g10: { xyz: 'log3g10_xyz' },
	clog2: { xyz: 'clog2_xyz' },
}

/** Spaces the WASM kernel can convert between (any pair, composed via the graph). */
export const spaces = WASM_SPACES
if (spaces.length !== Object.keys(GRAPH).length || spaces.some((s) => !GRAPH[s]))
	throw new Error('color-space/wasm: wasm/spaces.js is out of sync with the kernel graph')

// BFS shortest path from->to, returned as the sequence of edge-function names.
const edgeSeq = (from, to) => {
	if (from === to) return []
	const queue = [[from, []]], seen = new Set([from])
	while (queue.length) {
		const [node, fns] = queue.shift()
		const nbrs = GRAPH[node]
		if (!nbrs) continue
		for (const next in nbrs) {
			if (seen.has(next)) continue
			const seq = [...fns, nbrs[next]]
			if (next === to) return seq
			seen.add(next)
			queue.push([next, seq])
		}
	}
	return null
}

/**
 * Allocate (or grow + reuse) the WASM-backed working buffer: a zero-copy
 * `Float64Array` of `n` pixels × 3 interleaved channels. Write your input into it,
 * {@link convert} it in place, then read it back — no copies cross the boundary.
 * Valid until the next `alloc`/`convertBatch` (the kernel keeps one working buffer).
 * @param {number} n pixel count
 * @returns {Float64Array} view over WASM memory, length `n*3`
 */
export function alloc(n) {
	if (!Number.isSafeInteger(n) || n < 0) throw new RangeError(`color-space/wasm: alloc(n) expects a non-negative integer pixel count, got ${n}`)
	const e = instance()
	if (n > scratchN || !scratch || scratch.buffer !== e.memory.buffer) {
		if (e._clear) e._clear()
		const offset = ptr(e.alloc(n)) // alloc first — it may grow (and detach) memory
		scratch = new Float64Array(e.memory.buffer, offset, n * 3)
		scratchN = n
	}
	scratchActive = n
	return scratch.subarray(0, n * 3)
}

// edge path or throw — shared by the buffer and scalar forms
const seqOrThrow = (from, to) => {
	if (!GRAPH[from] || !GRAPH[to]) throw new Error(`color-space/wasm: unknown space in '${from}'→'${to}'. Spaces: ${spaces.join(', ')}`)
	const seq = edgeSeq(from, to)
	if (seq === null) throw new Error(`color-space/wasm: no path '${from}'→'${to}'. Spaces: ${spaces.join(', ')}`)
	return seq
}
const countOrThrow = (n, label = 'n') => {
	if (!Number.isSafeInteger(n) || n < 0) throw new RangeError(`color-space/wasm: ${label} expects a non-negative integer pixel count, got ${n}`)
	return n
}
const batchCount = (src, n, label) => {
	if (src == null || typeof src.length !== 'number' || !Number.isSafeInteger(src.length) || src.length < 0)
		throw new TypeError(`color-space/wasm: ${label} expects an array-like of interleaved channel values`)
	if (n === undefined) {
		if (src.length % 3) throw new RangeError(`color-space/wasm: ${label} expects 3·n interleaved values, got length ${src.length}`)
		n = src.length / 3
	} else countOrThrow(n)
	if (src.length < n * 3) throw new RangeError(`color-space/wasm: ${label} needs at least ${n * 3} values for ${n} pixels, got ${src.length}`)
	return n
}

/**
 * Convert the working buffer ({@link alloc}'d) from one space to another, in place.
 * Composes the shortest edge path through the graph (each hop is a buffer pass).
 * @param {string} from source space name (e.g. 'rgb')
 * @param {string} to target space name (e.g. 'oklch')
 * @param {number} n pixel count
 */
export function convert(from, to, n) {
	const seq = seqOrThrow(from, to)
	countOrThrow(n)
	if (!scratch || n > scratchActive) throw new RangeError(`color-space/wasm: convert(${n}) exceeds the active alloc() buffer (${scratchActive} pixels)`)
	const ex = instance()
	for (const fn of seq) ex[fn + '_n'](n)
}

/**
 * Drop-in: convert `n` pixels from `src` into `dst`. Copies through WASM memory —
 * convenient, but prefer {@link alloc} + {@link convert} on a hot path. With no
 * `dst`, a Float64Array is overwritten in place; other array-likes produce a new
 * Float64Array. Lengths and pixel counts are validated before the kernel runs.
 * @param {string} from source space name
 * @param {string} to target space name
 * @param {ArrayLike<number>} src interleaved input (length ≥ n*3)
 * @param {Float64Array} [dst] output
 * @param {number} [n=src.length/3] pixel count
 * @returns {Float64Array} dst
 */
export function convertBatch(from, to, src, dst, n) {
	seqOrThrow(from, to) // validate names before touching caller buffers
	n = batchCount(src, n, `${from}→${to} batch`)
	if (dst === undefined) dst = src instanceof Float64Array ? src : new Float64Array(n * 3)
	if (!(dst instanceof Float64Array))
		throw new TypeError('color-space/wasm: dst must be a Float64Array')
	if (dst.length < n * 3) throw new RangeError(`color-space/wasm: dst needs at least ${n * 3} values, got ${dst.length}`)
	const buf = alloc(n), len = n * 3
	if (typeof src.subarray === 'function') buf.set(src.subarray(0, len))
	else for (let i = 0; i < len; i++) buf[i] = src[i]
	convert(from, to, n)
	dst.set(buf, 0)
	return dst
}

// The scalar library's shape over the kernel: space.from.to(…). Three scalar args →
// a plain [c0,c1,c2], threaded through the edge kernels' multi-value returns (the
// working buffer is never touched); an alloc()'d buffer → converted in place,
// zero-copy; any other array-like → a new converted Float64Array, input untouched.
const api = {}
for (const from of spaces) {
	const o = api[from] = { name: from }
	for (const to of spaces) {
		// to === from included: identity, like the JS hubs (edgeSeq is [] — a no-op)
		o[to] = (a, b, c) => {
			if (typeof a !== 'object' || a === null) {
				if (a === undefined || b === undefined || c === undefined)
					throw new TypeError(`color-space/wasm: ${from}→${to} expects 3 channel values`)
				instance()
				for (const fn of seqOrThrow(from, to)) [a, b, c] = edge(fn, a, b, c)
				return [a, b, c]
			}
			const n = batchCount(a, undefined, `${from}→${to} batch`)
			const e = instance()
			if (scratch && a.buffer === e.memory.buffer && a.byteOffset === scratch.byteOffset && a.length === n * 3) {
				if (n > scratchActive) throw new RangeError(`color-space/wasm: buffer exceeds the active alloc() view (${scratchActive} pixels)`)
				convert(from, to, n); return a
			}
			return convertBatch(from, to, a, new Float64Array(n * 3), n)
		}
	}
}
export default api
