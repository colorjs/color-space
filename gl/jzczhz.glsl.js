// GLSL chunk: JzAzBz <-> JzCzHz — the generic cylindrical pair from gl/util.js.
// jzazbz's native ranges (Jz 0-1, az/bz ±0.5) need no rescaling; a pure polar
// transform, exactly mirroring jzczhz.js's cartToPolar/polarToCart calls.
export default {
	name: 'jzczhz',
	edges: { jzazbz: ['polar_fwd', 'polar_inv'] },
	// a graph-routing node: no GLSL of its own — its edges bind to the generic
	// cartesian<->cylindrical pair (polar_fwd/polar_inv) that gl/util.js supplies and
	// the composer injects once, however many polar spaces one shader composes.
	code: '',
}
