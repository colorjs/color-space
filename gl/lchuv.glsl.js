// GLSL chunk: CIELUV <-> LCh(uv) — the generic cylindrical pair from gl/util.js.
export default {
	name: 'lchuv',
	edges: { luv: ['polar_fwd', 'polar_inv'] },
	// a graph-routing node: no GLSL of its own — its edges bind to the generic
	// cartesian<->cylindrical pair (polar_fwd/polar_inv) that gl/util.js supplies and
	// the composer injects once, however many polar spaces one shader composes.
	code: '',
}
