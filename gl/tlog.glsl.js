// GLSL chunk: FilmLight T-Log <-> CIE XYZ D65 0-100. Near-pure log with a linear
// extension below zero; matrix is E-Gamut linear -> XYZ. Mirrors tlog.js — the
// derived constants (b, gs, C, a, y0, s, A, B, G) recomputed from the same
// w=128, g=16, o=0.075 spec constants, same order of operations as the JS source.
import xyz from './xyz.glsl.js'
export default {
	name: 'tlog',
	deps: [xyz],
	edges: { xyz: ['xyz_tlog', 'tlog_xyz'] },
	code: /* glsl */ `
float tlog_dec_(float t) {
	float b = 1.0 / (0.7107 + 1.2359 * log(128.0 * 16.0));
	float gs = 16.0 / (1.0 - 0.075);
	float C = b / gs;
	float a = 1.0 - b * log(128.0 + C);
	float y0 = a + b * log(C);
	float s = (1.0 - 0.075) / (1.0 - y0);
	float A = 1.0 + (a - 1.0) * s;
	float B = b * s;
	float G = gs * s;
	if (t < 0.075) { return (t - 0.075) / G; }
	return exp((t - A) / B) - C;
}
float tlog_enc_(float x) {
	float b = 1.0 / (0.7107 + 1.2359 * log(128.0 * 16.0));
	float gs = 16.0 / (1.0 - 0.075);
	float C = b / gs;
	float a = 1.0 - b * log(128.0 + C);
	float y0 = a + b * log(C);
	float s = (1.0 - 0.075) / (1.0 - y0);
	float A = 1.0 + (a - 1.0) * s;
	float B = b * s;
	float G = gs * s;
	if (x < 0.0) { return G * x + 0.075; }
	return log(x + C) * B + A;
}
vec3 tlog_xyz(vec3 c) {
	float r = tlog_dec_(c.x); float g = tlog_dec_(c.y); float b = tlog_dec_(c.z);
	return vec3(
		100.0 * (0.7053968500877708 * r + 0.1640413283099190 * g + 0.0810177486539820 * b),
		100.0 * (0.2801307240911059 * r + 0.8202066415495949 * g - 0.1003373656407007 * b),
		100.0 * (-0.1037815115691633 * r - 0.0729072570266306 * g + 1.2657465193556721 * b));
}
vec3 xyz_tlog(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.525052770404748 * x - 0.31591351093474296 * y - 0.12265826460517526 * z;
	float g = -0.5091525599713284 * x + 1.3333274087321485 * y + 0.13828436514138284 * z;
	float b = 0.09571534531370499 * x + 0.05089744385151596 * y + 0.7879557702853914 * z;
	return vec3(tlog_enc_(r), tlog_enc_(g), tlog_enc_(b));
}`,
}
