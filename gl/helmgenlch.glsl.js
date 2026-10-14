// GLSL chunk: HelmGen Lab <-> HelmGen LCh: the generic cylindrical pair from gl/util.js.
// Native ranges (L 0-1, a/b ±0.6) need no rescaling; mirrors helmgenlch.js exactly.
import helmgen from './helmgen.glsl.js'
export default {
	name: 'helmgenlch',
	deps: [helmgen],
	edges: { helmgen: ['polar_fwd', 'polar_inv'] },
	// a graph-routing node: no GLSL of its own; its edges bind to the generic
	// cartesian<->cylindrical pair (polar_fwd/polar_inv) that gl/util.js supplies.
	code: '',
}
