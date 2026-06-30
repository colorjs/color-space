/**
 * color-space/wasm — whole-buffer color conversion, compiled ahead-of-time to WASM.
 *
 * The scalar API (`color-space`) is the right tool for single colors. This is the
 * other half of the kernel: convert a whole image-sized buffer in one call, with
 * the per-pixel formulas running as a tight WASM loop (jz @ optimize:'speed' —
 * fast cbrt/pow, so even perceptual paths beat JS). Zero runtime dependency: the
 * ~4.6 kB module is prebuilt and inlined (see scripts/build-wasm.js).
 *
 * Layout: interleaved 3-channel `Float64Array`, n pixels = 3n values
 * [c0,c1,c2, c0,c1,c2, …]. Ranges match the scalar API (rgb 0-255, oklab native,
 * xyz 0-100). Formulas mirror the scalar library and are pinned by test/wasm-batch.js.
 *
 * THE WIN IS ZERO-COPY. Keep the data in WASM memory:
 *
 *     import { alloc, convert } from 'color-space/wasm'
 *     const buf = alloc(nPixels)      // WASM-backed Float64Array(n*3) — write rgb here
 *     // … fill buf …
 *     convert('rgb', 'oklab', nPixels)  // in place, no copy
 *     // … read buf (now oklab) …
 *
 * `convertBatch(from,to,src,dst,n)` is the drop-in convenience for existing JS
 * buffers, but it copies in and out — fine for a chain of conversions, but a single
 * convert + two copies may not beat JS. Prefer alloc()+convert() on the hot path.
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

/** Space pairs the kernel converts (each direction is a dedicated WASM export). */
export const paths = [['rgb', 'oklab'], ['oklab', 'rgb'], ['rgb', 'xyz'], ['xyz', 'rgb']]

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
 * @param {string} from source space name (e.g. 'rgb')
 * @param {string} to target space name (e.g. 'oklab')
 * @param {number} n pixel count
 */
export function convert(from, to, n) {
	const fn = instance()[from + '_' + to]
	if (!fn) throw new Error(`color-space/wasm: no batch path '${from}'→'${to}'. Available: ${paths.map((p) => p.join('→')).join(', ')}`)
	fn(n)
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
