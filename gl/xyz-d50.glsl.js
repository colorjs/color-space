// GLSL chunk: CIE XYZ D50 0-100 <-> CIE XYZ D65 0-100 (Bradford chromatic
// adaptation, full-precision CSS Color 4 matrices). Mirrors xyz.js `bradford`.
import xyz from './xyz.glsl.js'
export default {
	name: 'xyz-d50',
	deps: [xyz],
	edges: { xyz: ['xyz_xyzd50', 'xyzd50_xyz'] },
	code: /* glsl */ `
vec3 xyzd50_xyz(vec3 c) {
	return vec3(
		0.955473421488075 * c.x - 0.02309845494876471 * c.y + 0.06325924320057072 * c.z,
		-0.0283697093338637 * c.x + 1.0099953980813041 * c.y + 0.021041441191917323 * c.z,
		0.012314014864481998 * c.x - 0.020507649298898964 * c.y + 1.330365926242124 * c.z);
}
vec3 xyz_xyzd50(vec3 c) {
	return vec3(
		1.0479297925449969 * c.x + 0.022946870601609652 * c.y - 0.05019226628920524 * c.z,
		0.02962780877005599 * c.x + 0.9904344267538799 * c.y - 0.017073799063418826 * c.z,
		-0.009243040646204504 * c.x + 0.015055191490298152 * c.y + 0.7518742814281371 * c.z);
}`,
}
