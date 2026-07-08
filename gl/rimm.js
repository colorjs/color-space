// GLSL chunk: RIMM RGB 0-1 <-> CIE XYZ D65 0-100. ProPhoto (ROMM) primaries,
// Bradford-adapted D50->D65; camera-style OETF clipped one stop above diffuse
// white (E_clip = 2.0). Not sign-extended — clamps like rimm.js, no odd symmetry.
// Mirrors rimm.js M / inv3(M) and its enc/dec.
export default {
	name: 'rimm',
	edges: { xyz: ['xyz_rimm', 'rimm_xyz'] },
	code: `
float rimm_dec_(float ep) {
	float v = ep * 1.4022782421730806;
	if (v < 0.081) { return v / 4.5; }
	return pow((v + 0.099) / 1.099, 1.0 / 0.45);
}
float rimm_enc_(float e) {
	if (e <= 0.0) { return 0.0; }
	if (e >= 2.0) { return 1.0; }
	if (e < 0.018) { return 4.5 * e / 1.4022782421730806; }
	return (1.099 * pow(e, 0.45) - 0.099) / 1.4022782421730806;
}
vec3 rimm_xyz(vec3 c) {
	float r = rimm_dec_(c.x); float g = rimm_dec_(c.y); float b = rimm_dec_(c.z);
	return vec3(
		100.0 * (0.75556080 * r + 0.11276679 * g + 0.08212834 * b),
		100.0 * (0.26831908 * r + 0.71513042 * g + 0.01655051 * b),
		100.0 * (0.00391375 * r - 0.01293165 * g + 1.09807565 * b));
}
vec3 xyz_rimm(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.4032807955331243 * x - 0.22311626961373113 * y - 0.10159266735366562 * z;
	float g = -0.5262559819267498 * x + 1.4816380002362672 * y + 0.017028576921292827 * z;
	float b = -0.011199090319688649 * x + 0.018243957368470985 * y + 0.9112467031744123 * z;
	return vec3(rimm_enc_(r), rimm_enc_(g), rimm_enc_(b));
}`,
}
