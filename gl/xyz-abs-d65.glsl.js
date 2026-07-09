// GLSL chunk: Absolute XYZ D65 (cd/m², 0-203 at Y) <-> relative CIE XYZ D65
// 0-100. Straight scale by the HDR reference white (BT.2100, 203 nits at
// relative Y=100). Mirrors xyz-abs-d65.js Yw.
import xyz from './xyz.glsl.js'
export default {
	name: 'xyz-abs-d65',
	deps: [xyz],
	edges: { xyz: ['xyz_xyzabsd65', 'xyzabsd65_xyz'] },
	code: /* glsl */ `
vec3 xyzabsd65_xyz(vec3 c) {
	return vec3(c.x / 203.0 * 100.0, c.y / 203.0 * 100.0, c.z / 203.0 * 100.0);
}
vec3 xyz_xyzabsd65(vec3 c) {
	return vec3(c.x / 100.0 * 203.0, c.y / 100.0 * 203.0, c.z / 100.0 * 203.0);
}`,
}
