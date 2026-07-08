// GLSL chunk: CIE XYZ D65 0-100 <-> sUCS Iab (Li & Luo 2024). XYZ -> LMS (Hunt-
// Pointer-Estevez-like matrix) -> signed power 0.43 -> fixed opponent matrix -> Iab.
// Matrices mirror sucs.js M_XYZ_LMS / M_LMSP_IAB and their derived inverses.
export default {
	name: 'sucs',
	edges: { xyz: ['xyz_sucs', 'sucs_xyz'] },
	code: /* glsl */ `
vec3 xyz_sucs(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float l = spow_(0.4002 * x + 0.7075 * y - 0.0807 * z, 0.43);
	float m = spow_(-0.228 * x + 1.15 * y + 0.0612 * z, 0.43);
	float s = spow_(0.9184 * z, 0.43);
	return vec3(
		200.0 / 3.05 * l + 100.0 / 3.05 * m + 5.0 / 3.05 * s,
		430.0 * l - 470.0 * m + 40.0 * s,
		49.0 * l + 49.0 * m - 98.0 * s);
}
vec3 sucs_xyz(vec3 c) {
	float i = c.x; float a = c.y; float b = c.z;
	float lp = 0.009999999999999998 * i + 0.0007468123861566485 * a + 0.00047210140886955876 * b;
	float mp = 0.009999999999999998 * i - 0.0014754098360655736 * a - 0.00043492806958849117 * b;
	float sp = 0.009999999999999998 * i - 0.00036429872495446266 * a - 0.010185494963012525 * b;
	float lc = spow_(lp, 1.0 / 0.43); float mc = spow_(mp, 1.0 / 0.43); float sc = spow_(sp, 1.0 / 0.43);
	float x = 1.8502429449432056 * lc - 1.138301637867233 * mc + 0.23843495850870133 * sc;
	float y = 0.3668307751713486 * lc + 0.6438845448402355 * mc - 0.010673443584379992 * sc;
	float z = 1.088850174216028 * sc;
	return vec3(x * 100.0, y * 100.0, z * 100.0);
}`,
}
