// GLSL chunk: CIE XYZ D65 0-100 <-> DCDM 0-1 — SMPTE ST 428-1's 2.6 power-law gamma,
// scaled so relative Y=100 lands at the DCI reference projector's 48 cd/m² white.
// Mirrors dcdm.js (k = 48/52.37/100; negative XYZ clamps to 0).
export default {
	name: 'dcdm',
	edges: { xyz: ['xyz_dcdm', 'dcdm_xyz'] },
	code: `
float dcdm_enc_(float v) {
	float x = v * (48.0 / 52.37 / 100.0);
	if (x < 0.0) { x = 0.0; }
	return pow(x, 1.0 / 2.6);
}
float dcdm_dec_(float v) {
	float x = v;
	if (x < 0.0) { x = 0.0; }
	return pow(x, 2.6) / (48.0 / 52.37 / 100.0);
}
vec3 xyz_dcdm(vec3 c) {
	return vec3(dcdm_enc_(c.x), dcdm_enc_(c.y), dcdm_enc_(c.z));
}
vec3 dcdm_xyz(vec3 c) {
	return vec3(dcdm_dec_(c.x), dcdm_dec_(c.y), dcdm_dec_(c.z));
}`,
}
