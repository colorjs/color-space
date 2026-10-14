// GLSL chunk: CIE XYZ D65 0-100 <-> Hunter Rd,a,b. Mirrors hunter-rdab.js exactly;
// Ka/Kb literals are printed from its 175·√(Xn/98.043), 70·√(Zn/118.115) on the D65 white.
import xyz from './xyz.glsl.js'
export default {
	name: 'hunter-rdab',
	deps: [xyz],
	edges: { xyz: ['xyz_hunterrdab', 'hunterrdab_xyz'] },
	code: /* glsl */ `
float hunterrdab_f_(float Y) { return 0.51 * (21.0 + 0.2 * Y) / (1.0 + 0.2 * Y); }
vec3 xyz_hunterrdab(vec3 c) {
	float f = hunterrdab_f_(c.y);
	return vec3(c.y,
		172.30415269703914 * f * (c.x / 95.04559270516716 - c.y / 100.0),
		67.21573747607611 * f * (c.y / 100.0 - c.z / 108.90577507598784));
}
vec3 hunterrdab_xyz(vec3 c) {
	float f = hunterrdab_f_(c.x);
	return vec3(
		(c.y / (172.30415269703914 * f) + c.x / 100.0) * 95.04559270516716,
		c.x,
		(c.x / 100.0 - c.z / (67.21573747607611 * f)) * 108.90577507598784);
}`,
}
