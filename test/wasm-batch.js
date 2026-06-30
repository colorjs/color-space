// Pin the WASM batch kernel to the scalar library.
//
// The kernel is a graph of primitive edges (wasm/batch.js) composed by a BFS in
// wasm.js; this asserts every reachable space, converted rgb→X through the graph,
// reproduces the scalar API to within last-bit cbrt/pow (+ gamut-bound) divergence —
// so the two backends can never silently drift.
import test, { is } from 'tst'
import { convertBatch, spaces } from '../wasm.js'
import space from '../index.js'

const rnd = (s) => () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296 }

for (const to of spaces) {
	if (to === 'rgb') continue
	test(`wasm: rgb→${to} batch matches scalar`, () => {
		const r = rnd(0x51a7ed), n = 4000, src = new Float64Array(n * 3), exp = []
		for (let i = 0; i < n; i++) {
			const R = r() * 255, G = r() * 255, B = r() * 255
			src[3 * i] = R; src[3 * i + 1] = G; src[3 * i + 2] = B
			exp.push(space.rgb[to](R, G, B))
		}
		const dst = new Float64Array(n * 3)
		convertBatch('rgb', to, src, dst, n)
		let maxAbs = 0
		for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) maxAbs = Math.max(maxAbs, Math.abs(exp[i][k] - dst[3 * i + k]))
		is(maxAbs < 1e-3, true, `max |wasm-scalar| = ${maxAbs.toExponential(2)} (< 1e-3)`)
	})
}
