// GLSL chunk: CIE Lab D50 <-> RAL Design H,L,C (the published cylindrical
// definition). Mirrors ral-design.js's own H/L/C <-> a/b conversion directly
// (not the generic polar_fwd/polar_inv helper: RAL Design orders its channels
// H,L,C rather than L,C,h).
import lab from './lab.glsl.js'
export default {
	name: 'ral-design',
	deps: [lab],
	edges: { lab: ['lab_raldesign', 'raldesign_lab'] },
	code: /* glsl */ `
vec3 lab_raldesign(vec3 c) {
	float l = c.x; float a = c.y; float b = c.z;
	float h = mod_(atan2_(b, a) * 57.29577951308232 + 360.0, 360.0);
	return vec3(h, l, sqrt(a * a + b * b));
}
vec3 raldesign_lab(vec3 c) {
	float h = c.x * 0.017453292519943295; float l = c.y; float chroma = c.z;
	return vec3(l, chroma * cos(h), chroma * sin(h));
}`,
}
