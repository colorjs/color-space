// GLSL chunk: CIE XYZ D65 0-100 <-> Hunter Lab. Mirrors labh.js exactly: the library's
// D65 white and Ka/Kb printed from labh.js (175·√(Xn/98.043), 70·√(Zn/118.115)).
import xyz from './xyz.glsl.js'
export default {
	name: 'labh',
	deps: [xyz],
	edges: { xyz: ['xyz_labh', 'labh_xyz'] },
	code: /* glsl */ `
vec3 xyz_labh(vec3 c) {
	float r = sqrt(c.y / 100.0);
	if (r == 0.0) { return vec3(0.0, 0.0, 0.0); }
	return vec3(100.0 * r,
		172.30415269703914 * (c.x / 95.04559270516717 - c.y / 100.0) / r,
		67.21573747607611 * (c.y / 100.0 - c.z / 108.90577507598783) / r);
}
vec3 labh_xyz(vec3 c) {
	float r = c.x / 100.0;
	return vec3((c.y * r / 172.30415269703914 + r * r) * 95.04559270516717,
		r * r * 100.0,
		(r * r - c.z * r / 67.21573747607611) * 108.90577507598783);
}`,
}
