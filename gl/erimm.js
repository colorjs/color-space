// GLSL chunk: ERIMM RGB 0-1 <-> ProPhoto (ROMM) linear-light 0-1 (its native
// decode target per erimm.js, not XYZ). Log-encoded scene exposure with a
// linear toe below e·Emin (Emin = 0.001, Eclip = 316.2).
// Mirrors erimm.js enc/dec exactly (constants pre-evaluated from the same
// Math.log/Math.E terms).
export default {
	name: 'erimm',
	edges: { 'prophoto-linear': ['prophotolinear_erimm', 'erimm_prophotolinear'] },
	code: `
float erimm_enc_(float x) {
	if (x < 0.002718281828459045) { return 0.0789631805667392 * x / 0.002718281828459045; }
	return (log(x) + 6.907755278982137) / 12.664130203757509;
}
float erimm_dec_(float y) {
	if (y < 0.0789631805667392) { return y / 0.0789631805667392 * 0.002718281828459045; }
	return exp(y * 12.664130203757509 - 6.907755278982137);
}
vec3 erimm_prophotolinear(vec3 c) {
	return vec3(erimm_dec_(c.x), erimm_dec_(c.y), erimm_dec_(c.z));
}
vec3 prophotolinear_erimm(vec3 c) {
	return vec3(erimm_enc_(c.x), erimm_enc_(c.y), erimm_enc_(c.z));
}`,
}
