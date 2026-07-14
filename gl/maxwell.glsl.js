// GLSL chunk: human LMS cone catches <-> Maxwell trichromaticity triangle.
// Magnitude is discarded; inverse reconstructs L+M+S=100. Mirrors maxwell.js.
import lms from './lms.glsl.js'
export default {
	name: 'maxwell',
	deps: [lms],
	dim: 2,
	edges: { lms: ['lms_maxwell', 'maxwell_lms'] },
	code: /* glsl */ `
vec2 lms_maxwell(vec3 c) {
	float sum = c.x + c.y + c.z;
	if (sum == 0.0) { return vec2(0.0, 0.0); }
	float l = c.x / sum;
	float m = c.y / sum;
	float s = c.z / sum;
	return vec2((l - m) / 1.4142135623730951, s * 0.8164965809277261 - (m + l) * 0.4082482904638631);
}
vec3 maxwell_lms(vec2 c) {
	float s = (c.y + 0.4082482904638631) / 1.224744871391589;
	float rem = 1.0 - s;
	float diff = c.x * 1.4142135623730951;
	return vec3(50.0 * (rem + diff), 50.0 * (rem - diff), 100.0 * s);
}`,
}
