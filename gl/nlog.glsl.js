// GLSL chunk: N-Log 0-1 <-> linear-light Rec. 2020 (N-Gamut primaries match BT.2020).
// Cube-root toe + natural-log highlight; mirrors nlog.js enc/dec exactly
// (a/c/d/c2 are 650/1023, 150/1023, 619/1023, 452/1023 as float64).
export default {
	name: 'nlog',
	edges: { 'rec2020-linear': ['rec2020linear_nlog', 'nlog_rec2020linear'] },
	code: /* glsl */ `
float nlog_enc_(float x) {
	if (x < 0.328) { return 0.635386119257087 * cbrt_(x + 0.0075); }
	return 0.1466275659824047 * log(x) + 0.6050830889540567;
}
float nlog_dec_(float y) {
	if (y < 0.4418377321603128) {
		float t = y / 0.635386119257087;
		return t * t * t - 0.0075;
	}
	return exp((y - 0.6050830889540567) / 0.1466275659824047);
}
vec3 rec2020linear_nlog(vec3 c) {
	return vec3(nlog_enc_(c.x), nlog_enc_(c.y), nlog_enc_(c.z));
}
vec3 nlog_rec2020linear(vec3 c) {
	return vec3(nlog_dec_(c.x), nlog_dec_(c.y), nlog_dec_(c.z));
}`,
}
