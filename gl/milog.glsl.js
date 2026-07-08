// GLSL chunk: Mi-Log 0-1 <-> linear-light Rec. 2020 (BT.2020 container).
// Same quadratic-toe + log2-highlight shape as Apple Log with Xiaomi's constants;
// mirrors milog.js enc/dec exactly. Pt = c*(Rt-R0)^2 pre-evaluated (float64).
export default {
	name: 'milog',
	edges: { 'rec2020-linear': ['rec2020linear_milog', 'milog_rec2020linear'] },
	code: /* glsl */ `
float milog_enc_(float r) {
	if (r < -0.09023729) { return 0.0; }
	if (r < 0.01974185) {
		float d = r - -0.09023729;
		return 18.10531998 * d * d;
	}
	return 0.09271529 * log2(r + 0.01384578) + 0.67291850;
}
float milog_dec_(float p) {
	if (p < 0.0) { return -0.09023729; }
	if (p < 0.2189912907018895) { return sqrt(p / 18.10531998) + -0.09023729; }
	return pow(2.0, (p - 0.67291850) / 0.09271529) - 0.01384578;
}
vec3 rec2020linear_milog(vec3 c) {
	return vec3(milog_enc_(c.x), milog_enc_(c.y), milog_enc_(c.z));
}
vec3 milog_rec2020linear(vec3 c) {
	return vec3(milog_dec_(c.x), milog_dec_(c.y), milog_dec_(c.z));
}`,
}
