// GLSL chunk: CIE XYZ 0-100 <-> LLAB (Luo, Lo & Kuo 1996; L -10..100, A/B ~±100).
// Baked to llab.js's reference conditions (D65 white [95.05,100,108.88], L=318.31,
// Yb=20, average <4° surround) where the BFD adaptation is identity; constants
// z = 1+√0.2 and S_C(318.31) precomputed. Analytic both ways, as llab.js.
import xyz from './xyz.glsl.js'
export default {
	name: 'llab',
	deps: [xyz],
	edges: { xyz: ['xyz_llab', 'llab_xyz'] },
	code: /* glsl */ `
float llab_f_(float x) {
	if (x > 0.008856) { return cbrt_(x); }
	return 7.7870370302851395 * x + 0.13793103448275862;
}
float llab_finv_(float v) {
	if (v > 0.2068930344229638) { return v * v * v; }
	return (v - 0.13793103448275862) / 7.7870370302851395;
}
float llab_sm_(float L) { return 0.7 + 0.02 * L - 0.0002 * L * L; }
vec3 xyz_llab(vec3 c) {
	float fy = llab_f_(c.y / 100.0);
	float L = 116.0 * pow(fy, 1.4472135954999579) - 16.0;
	float a = 500.0 * (llab_f_(c.x / 95.05) - fy);
	float b = 200.0 * (fy - llab_f_(c.z / 108.88));
	float ch = 25.0 * log(1.0 + 0.05 * sqrt(a * a + b * b));
	float cl = ch * llab_sm_(L) * 1.8192768392055672;
	float h = atan2_(b, a);
	return vec3(L, cl * cos(h), cl * sin(h));
}
vec3 llab_xyz(vec3 c) {
	float cl = sqrt(c.y * c.y + c.z * c.z);
	float h = atan2_(c.z, c.y);
	float ch = cl / (llab_sm_(c.x) * 1.8192768392055672);
	float cc = (exp(ch / 25.0) - 1.0) / 0.05;
	float a = cc * cos(h);
	float b = cc * sin(h);
	float fv = pow((c.x + 16.0) / 116.0, 1.0 / 1.4472135954999579);
	return vec3(
		95.05 * llab_finv_(fv + a / 500.0),
		100.0 * llab_finv_(fv),
		108.88 * llab_finv_(fv - b / 200.0));
}`,
}
