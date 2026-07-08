// GLSL chunk: CIE XYZ D65 0-100 <-> CIE 1960 UCS (U,V,W 0-100). Mirrors ucs.js —
// a fixed invertible 3x3 (no zero-denominator branch needed).
export default {
	name: 'ucs',
	edges: { xyz: ['xyz_ucs', 'ucs_xyz'] },
	code: /* glsl */ `
vec3 xyz_ucs(vec3 c) {
	return vec3(c.x * 2.0 / 3.0, c.y, 0.5 * (-c.x + 3.0 * c.y + c.z));
}
vec3 ucs_xyz(vec3 c) {
	return vec3(1.5 * c.x, c.y, 1.5 * c.x - 3.0 * c.y + 2.0 * c.z);
}`,
}
