// GLSL chunk: Display P3 0-1 <-> linear-light Display P3 (p3-linear), sRGB transfer curve.
// Same sRGB OETF/EOTF as lrgb.js (IEC 61966-2-1); P3 differs only in primaries (p3-linear).
export default {
	name: 'p3',
	edges: { 'p3-linear': ['p3linear_p3', 'p3_p3linear'] },
	code: `
float p3_dec_(float u) {
	float a = abs(u);
	if (a > 0.04045) { return sign(u) * pow((a + 0.055) / 1.055, 2.4); }
	return u / 12.92;
}
float p3_enc_(float u) {
	float a = abs(u);
	if (a > 0.0031308) { return sign(u) * (1.055 * pow(a, 1.0 / 2.4) - 0.055); }
	return 12.92 * u;
}
vec3 p3linear_p3(vec3 c) {
	return vec3(p3_enc_(c.x), p3_enc_(c.y), p3_enc_(c.z));
}
vec3 p3_p3linear(vec3 c) {
	return vec3(p3_dec_(c.x), p3_dec_(c.y), p3_dec_(c.z));
}`,
}
