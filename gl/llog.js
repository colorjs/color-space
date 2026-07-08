// GLSL chunk: L-Log 0-1 <-> linear-light Rec. 2020 (BT.2020 container, like N-Log).
// Linear toe + log10 highlight; mirrors llog.js enc/dec exactly.
export default {
	name: 'llog',
	edges: { 'rec2020-linear': ['rec2020linear_llog', 'llog_rec2020linear'] },
	code: `
float llog_enc_(float x) {
	if (x <= 0.006) { return 8.0 * x + 0.09; }
	return 0.27 * (log(1.3 * x + 0.0115) / 2.302585092994046) + 0.6;
}
float llog_dec_(float y) {
	if (y <= 0.1380) { return (y - 0.09) / 8.0; }
	return (pow(10.0, (y - 0.6) / 0.27) - 0.0115) / 1.3;
}
vec3 rec2020linear_llog(vec3 c) {
	return vec3(llog_enc_(c.x), llog_enc_(c.y), llog_enc_(c.z));
}
vec3 llog_rec2020linear(vec3 c) {
	return vec3(llog_dec_(c.x), llog_dec_(c.y), llog_dec_(c.z));
}`,
}
