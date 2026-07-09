/**
 * color-space/wasm — whole-buffer color conversion, compiled ahead-of-time to WASM.
 *
 * The scalar API (`color-space`) is the right tool for single colors. This is the
 * other half of the kernel: convert a whole image-sized buffer in one call, with
 * the per-pixel formulas running as a tight WASM loop (jz @ optimize:'speed' —
 * fast cbrt/pow, so even perceptual paths beat JS). Zero runtime dependency: the
 * ~30 kB module (≈23 kB wasm) is prebuilt and inlined (see scripts/build-wasm.js).
 *
 * The API is the scalar library's, batch-shaped — same `space.from.to` addressing:
 *
 *     import space, { alloc } from 'color-space/wasm'
 *     space.oklch.rgb(0.72, 0.16, 41)   // → [246, 125, 79] — scalar, same as JS
 *     const buf = alloc(nPixels)        // WASM-backed Float64Array(n*3) — write rgb here
 *     space.rgb.oklch(buf)              // whole buffer, in place, zero-copy
 *     space.rgb.oklch(pixels)           // plain array in → converted Float64Array out
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

let ex, scratch, scratchN = 0

function instance() {
	if (!ex) {
		const bytes = typeof Buffer !== 'undefined'
			? Buffer.from(b64, 'base64')
			: Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
		ex = new WebAssembly.Instance(new WebAssembly.Module(bytes), {}).exports
	}
	return ex
}

// jz returns a typed array as a NaN-boxed i64; its low 32 bits are the byte offset
// of the data in linear memory — all we need to build a zero-copy view over it.
const ptr = (box) => Number(box & 0xffffffffn)

// Primitive-edge graph (mirrors the scalar library's natural neighbours). Each edge
// maps a space->space step to a WASM export; multi-hop conversions compose by walking
// this graph (BFS) and calling each edge in turn on the buffer. polar_fwd/polar_inv
// are the one generic cartesian<->cylindrical pair shared by every LCh-family space.
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
export const spaces = Object.keys(GRAPH)

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
	const e = instance()
	if (n > scratchN || !scratch || scratch.buffer !== e.memory.buffer) {
		if (e._clear) e._clear()
		const offset = ptr(e.alloc(n)) // alloc first — it may grow (and detach) memory
		scratch = new Float64Array(e.memory.buffer, offset, n * 3)
		scratchN = n
	}
	return scratch.subarray(0, n * 3)
}

/**
 * Convert the working buffer ({@link alloc}'d) from one space to another, in place.
 * Composes the shortest edge path through the graph (each hop is a buffer pass).
 * @param {string} from source space name (e.g. 'rgb')
 * @param {string} to target space name (e.g. 'oklch')
 * @param {number} n pixel count
 */
export function convert(from, to, n) {
	const seq = edgeSeq(from, to)
	if (seq === null) throw new Error(`color-space/wasm: no batch path '${from}'→'${to}'. Spaces: ${spaces.join(', ')}`)
	const ex = instance()
	for (const fn of seq) ex[fn](n)
}

/**
 * Drop-in: convert `n` pixels from `src` into `dst` (defaults in place). Copies
 * through WASM memory — convenient, but prefer {@link alloc} + {@link convert} on a
 * hot path so the data never leaves WASM.
 * @param {string} from source space name
 * @param {string} to target space name
 * @param {Float64Array} src interleaved input (length ≥ n*3)
 * @param {Float64Array} [dst=src] output (defaults to overwriting src)
 * @param {number} [n=src.length/3] pixel count
 * @returns {Float64Array} dst
 */
export function convertBatch(from, to, src, dst = src, n = (src.length / 3) | 0) {
	const buf = alloc(n)
	buf.set(src.subarray ? src.subarray(0, n * 3) : src)
	convert(from, to, n)
	dst.set(buf)
	return dst
}

// The scalar library's shape over the batch kernel: space.from.to(…). Three scalar
// args → a plain [c0,c1,c2] (bit-identical to the loop math JS runs per pixel); an
// alloc()'d buffer → converted in place, zero-copy; any other array-like → a new
// converted Float64Array, input untouched.
const api = {}
for (const from of spaces) {
	const o = api[from] = { name: from }
	for (const to of spaces) {
		if (to === from) continue
		o[to] = (a, b, c) => {
			if (typeof a === 'number') {
				const buf = alloc(1)   // may alias a live working buffer — restore its head
				const s0 = buf[0], s1 = buf[1], s2 = buf[2]
				buf[0] = a; buf[1] = b; buf[2] = c
				convert(from, to, 1)
				const out = [buf[0], buf[1], buf[2]]
				buf[0] = s0; buf[1] = s1; buf[2] = s2
				return out
			}
			const n = (a.length / 3) | 0
			if (a.buffer === instance().memory.buffer) { convert(from, to, n); return a }
			return convertBatch(from, to, a, new Float64Array(n * 3), n)
		}
	}
}
export default api
