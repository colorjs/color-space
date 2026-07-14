// GLSL chunk: Rec. 2100 Linear <-> Rec. 2020 Linear — same primaries/white/matrix,
// identity at the value level (BT.2100 is scene-linear Rec.2020, semantics only differ).
// Mirrors rec2100-linear.js.
import rec2020_linear from './rec2020-linear.glsl.js'
export default {
	name: 'rec2100-linear',
	deps: [rec2020_linear],
	edges: { 'rec2020-linear': ['rec2020linear_rec2100linear', 'rec2100linear_rec2020linear'] },
	code: /* glsl */ `
vec3 rec2020linear_rec2100linear(vec3 c) {
	return c;
}
vec3 rec2100linear_rec2020linear(vec3 c) {
	return c;
}`,
}
