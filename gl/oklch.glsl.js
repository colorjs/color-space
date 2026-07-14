// GLSL chunk: Oklab <-> OKLCh — the generic cylindrical pair from gl/util.js.
import oklab from './oklab.glsl.js'
export default {
	name: 'oklch',
	deps: [oklab],
	edges: { oklab: ['polar_fwd', 'polar_inv'] },
	// a graph-routing node: no GLSL of its own — its edges bind to the generic
	// cartesian<->cylindrical pair (polar_fwd/polar_inv) that gl/util.js supplies and
	// the composer injects once, however many polar spaces one shader composes.
	code: '',
}
