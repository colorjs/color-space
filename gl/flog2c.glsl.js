// GLSL chunk: F-Log2 C 0-1 <-> CIE XYZ D65 0-100, via F-Gamut C linear RGB.
// The F-Log2 curve unchanged (reuses flog2's helpers — requires: ['flog2']), then the
// F-Gamut C -> XYZ matrix; mirrors flog2c.js M; MI is M's exact inverse (inv3).
import xyz from './xyz.glsl.js'
import flog2 from './flog2.glsl.js'
export default {
	name: 'flog2c',
	deps: [xyz, flog2],
	edges: { xyz: ['xyz_flog2c', 'flog2c_xyz'] },
	requires: ['flog2'],
	code: /* glsl */ `
vec3 flog2c_xyz(vec3 c) {
	float r = flog2_dec_(c.x); float g = flog2_dec_(c.y); float b = flog2_dec_(c.z);
	return vec3(
		100.0 * (0.7892749677891812 * r + 0.020040229879954023 * g + 0.14114072938253647 * b),
		100.0 * (0.2850070082407373 * r + 0.7419456971144955 * g + -0.026952705355232878 * b),
		100.0 * (1.0890577507598784 * b));
}
vec3 xyz_flog2c(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.2794647583433671 * x - 0.034558820113413324 * y - 0.16667255963342995 * z;
	float g = -0.4914866739480908 * x + 1.3610827717665377 * y + 0.09738110810041047 * z;
	float b = 0.9182249511582471 * z;
	return vec3(flog2_enc_(r), flog2_enc_(g), flog2_enc_(b));
}`,
}
