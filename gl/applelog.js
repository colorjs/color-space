// GLSL chunk: Apple Log 0-1 <-> linear-light Rec. 2020 (BT.2020 container).
// Quadratic toe (the sqrt segment on decode) + log2 highlight; mirrors applelog.js
// enc/dec exactly. Pt = c*(Rt-R0)^2 pre-evaluated (float64).
export default {
	name: 'applelog',
	edges: { 'rec2020-linear': ['rec2020linear_applelog', 'applelog_rec2020linear'] },
	code: `
float applelog_enc_(float r) {
	if (r < -0.05641088) { return 0.0; }
	if (r < 0.01) {
		float d = r - -0.05641088;
		return 47.28711236 * d * d;
	}
	return 0.08550479 * log2(r + 0.00964052) + 0.69336945;
}
float applelog_dec_(float p) {
	if (p < 0.0) { return -0.05641088; }
	if (p < 0.20855531595464202) { return sqrt(p / 47.28711236) + -0.05641088; }
	return pow(2.0, (p - 0.69336945) / 0.08550479) - 0.00964052;
}
vec3 rec2020linear_applelog(vec3 c) {
	return vec3(applelog_enc_(c.x), applelog_enc_(c.y), applelog_enc_(c.z));
}
vec3 applelog_rec2020linear(vec3 c) {
	return vec3(applelog_dec_(c.x), applelog_dec_(c.y), applelog_dec_(c.z));
}`,
}
