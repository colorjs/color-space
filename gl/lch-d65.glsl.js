// GLSL chunk: Lab-D65 <-> LCh-D65 — the generic cylindrical pair from gl/util.js.
import lab_d65 from './lab-d65.glsl.js'
export default {
	name: 'lch-d65',
	deps: [lab_d65],
	edges: { 'lab-d65': ['polar_fwd', 'polar_inv'] },
	// a graph-routing node: no GLSL of its own — its edges bind to the generic
	// cartesian<->cylindrical pair (polar_fwd/polar_inv) that gl/util.js supplies and
	// the composer injects once, however many polar spaces one shader composes.
	code: '',
}
