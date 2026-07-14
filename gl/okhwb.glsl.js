// GLSL chunk: OkHSV <-> OkHWB (W = (1-S)*V, B = 1-V; achromatic when W+B >= 1).
// Mirrors okhwb.js exactly.
import okhsv from './okhsv.glsl.js'
export default {
	name: 'okhwb',
	deps: [okhsv],
	edges: { okhsv: ['okhsv_okhwb', 'okhwb_okhsv'] },
	code: /* glsl */ `
vec3 okhsv_okhwb(vec3 c) {
	float h = c.x;
	float s = c.y / 100.0;
	float v = c.z / 100.0;
	return vec3(h, (1.0 - s) * v * 100.0, (1.0 - v) * 100.0);
}
vec3 okhwb_okhsv(vec3 c) {
	float h = c.x;
	float w = c.y / 100.0;
	float bl = c.z / 100.0;
	if (w + bl >= 1.0) {
		float g = w / (w + bl);
		return vec3(h, 0.0, g * 100.0);
	}
	float v = 1.0 - bl;
	float s = 1.0 - w / v;
	return vec3(h, s * 100.0, v * 100.0);
}`,
}
