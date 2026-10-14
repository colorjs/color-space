// GLSL chunk: FilmLight T-Log <-> CIE XYZ D65 0-100, via E-Gamut. Near-pure log with a
// linear extension below zero. Mirrors tlog.js – the derived constants (b, gs, C, a, y0,
// s, A, B, G) recomputed from the same w=128, g=16, o=0.075 spec constants, same order
// of operations as the JS source; the matrix comes from egamut.glsl.js (requires: ['egamut']).
import xyz from './xyz.glsl.js'
import egamut from './egamut.glsl.js'
export default {
	name: 'tlog',
	deps: [xyz, egamut],
	edges: { xyz: ['xyz_tlog', 'tlog_xyz'] },
	requires: ['egamut'],
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
	return egamut_xyz(vec3(tlog_dec_(c.x), tlog_dec_(c.y), tlog_dec_(c.z)));
}
vec3 xyz_tlog(vec3 c) {
	vec3 l = xyz_egamut(c);
	return vec3(tlog_enc_(l.x), tlog_enc_(l.y), tlog_enc_(l.z));
}`,
}
