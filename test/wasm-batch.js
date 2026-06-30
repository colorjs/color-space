// Pin the WASM batch kernel to the scalar library.
//
// wasm/batch.js mirrors the scalar conversion formulas and is compiled to WASM by
// jz; this asserts every convertBatch path reproduces the scalar API to within
// last-bit cbrt/pow divergence — so the two backends can never silently drift.
import test, { is } from 'tst'
import { convertBatch, paths } from '../wasm.js'
import space from '../index.js'

const rnd = (s) => () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296 }
// in-gamut inputs in each source space (drive everything from random sRGB)
const gen = {
	rgb: (r) => [r() * 255, r() * 255, r() * 255],
	oklab: (r) => space.rgb.oklab(r() * 255, r() * 255, r() * 255),
	xyz: (r) => space.rgb.xyz(r() * 255, r() * 255, r() * 255),
}

for (const [from, to] of paths) {
	test(`wasm: ${from}→${to} batch matches scalar`, () => {
		const r = rnd(0x51a7ed), n = 5000, src = new Float64Array(n * 3), exp = []
		for (let i = 0; i < n; i++) {
			const p = gen[from](r)
			src[3 * i] = p[0]; src[3 * i + 1] = p[1]; src[3 * i + 2] = p[2]
			exp.push(space[from][to](...p))
		}
		const dst = new Float64Array(n * 3)
		convertBatch(from, to, src, dst, n)
		let maxAbs = 0
		for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) maxAbs = Math.max(maxAbs, Math.abs(exp[i][k] - dst[3 * i + k]))
		is(maxAbs < 1e-5, true, `max |wasm-scalar| = ${maxAbs.toExponential(2)} (< 1e-5, last-bit only)`)
	})
}
