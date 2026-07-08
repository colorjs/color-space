// GLSL chunk: O-Log 0-1 <-> linear-light Rec. 2020 (BT.2020 container).
// Single natural-log curve, no toe segment; mirrors olog.js enc/dec exactly.
export default {
	name: 'olog',
	edges: { 'rec2020-linear': ['rec2020linear_olog', 'olog_rec2020linear'] },
	code: `
vec3 rec2020linear_olog(vec3 c) {
	return vec3(
		0.139 * log(c.x + 0.019) + 0.614,
		0.139 * log(c.y + 0.019) + 0.614,
		0.139 * log(c.z + 0.019) + 0.614);
}
vec3 olog_rec2020linear(vec3 c) {
	return vec3(
		exp((c.x - 0.614) / 0.139) - 0.019,
		exp((c.y - 0.614) / 0.139) - 0.019,
		exp((c.z - 0.614) / 0.139) - 0.019);
}`,
}
