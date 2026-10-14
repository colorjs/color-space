// GLSL chunk: O-Log2 0-1 <-> linear-light Rec. 2020 (BT.2020 container).
// Single base-2 log curve, no toe segment; mirrors olog2.js enc/dec exactly.
import rec2020_linear from './rec2020-linear.glsl.js'
export default {
	name: 'olog2',
	deps: [rec2020_linear],
	edges: { 'rec2020-linear': ['rec2020linear_olog2', 'olog2_rec2020linear'] },
	code: /* glsl */ `
vec3 rec2020linear_olog2(vec3 c) {
	return vec3(
		0.0855 * log2(c.x + 0.0096) + 0.693,
		0.0855 * log2(c.y + 0.0096) + 0.693,
		0.0855 * log2(c.z + 0.0096) + 0.693);
}
vec3 olog2_rec2020linear(vec3 c) {
	return vec3(
		exp2((c.x - 0.693) / 0.0855) - 0.0096,
		exp2((c.y - 0.693) / 0.0855) - 0.0096,
		exp2((c.z - 0.693) / 0.0855) - 0.0096);
}`,
}
