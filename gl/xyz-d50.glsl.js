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
		0.9554734527042182 * c.x - 0.023098536874261423 * c.y + 0.0632593086610217 * c.z,
		-0.028369706963208136 * c.x + 1.0099954580058226 * c.y + 0.021041398966943008 * c.z,
		0.012314001688319899 * c.x - 0.020507696433477912 * c.y + 1.3303659366080753 * c.z);
}
vec3 xyz_xyzd50(vec3 c) {
	return vec3(
		1.0479298208405488 * c.x + 0.022946793341019088 * c.y - 0.05019222954313557 * c.z,
		0.029627815688159344 * c.x + 0.990434484573249 * c.y - 0.01707382502938514 * c.z,
		-0.009243058152591178 * c.x + 0.015055144896577895 * c.y + 0.7518742899580008 * c.z);
}`,
}
