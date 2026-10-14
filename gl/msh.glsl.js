// GLSL chunk: Lab-D65 <-> Msh (Moreland 2009). Mirrors msh.js exactly: s = atan2(C, L),
// h in [0, 2π) radians, achromatic hue -> 0 below chroma 1e-8.
import lab_d65 from './lab-d65.glsl.js'
export default {
	name: 'msh',
	deps: [lab_d65],
	edges: { 'lab-d65': ['labd65_msh', 'msh_labd65'] },
	code: /* glsl */ `
vec3 labd65_msh(vec3 c) {
	float C = sqrt(c.y * c.y + c.z * c.z);
	float M = sqrt(c.x * c.x + C * C);
	if (M == 0.0) { return vec3(0.0, 0.0, 0.0); }
	float h = 0.0;
	if (C >= 1e-8) { h = atan2_(c.z, c.y); }
	if (h < 0.0) { h = h + 6.283185307179586; }
	return vec3(M, atan2_(C, c.x), h);
}
vec3 msh_labd65(vec3 c) {
	float C = c.x * sin(c.y);
	return vec3(c.x * cos(c.y), C * cos(c.z), C * sin(c.z));
}`,
}
