// GLSL chunk: Russell RGB 0-1 <-> CIE XYZ D65 0-100. Pure gamma 2.2, sign-extended.
// Mirrors russellrgb.js: M = bradfordAdaptation(5500 K -> D65) x M55, MI = inv3(M);
// the digits are printed from the module.
import xyz from './xyz.glsl.js'
export default {
	name: 'russellrgb',
	deps: [xyz],
	edges: { xyz: ['xyz_russellrgb', 'russellrgb_xyz'] },
	code: /* glsl */ `
vec3 russellrgb_xyz(vec3 c) {
	float r = spow_(c.x, 2.2); float g = spow_(c.y, 2.2); float b = spow_(c.z, 2.2);
	return vec3(
		100.0 * (0.6781268115679949 * r + 0.14371751469287233 * g + 0.12861160079080458 * b),
		100.0 * (0.30499290477065283 * r + 0.6660202999731388 * g + 0.02898679525620878 * b),
		100.0 * (0.0012447543399143 * r + 0.044593956636206945 * g + 1.0432190397837577 * b));
}
vec3 xyz_russellrgb(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.627161611583785 * x - 0.3383157932876223 * y - 0.19120161861742063 * z;
	float g = -0.7464357541741518 * x + 1.6594515437639834 * y + 0.045913766206827925 * z;
	float b = 0.02996600520450202 * x - 0.07053206213126004 * y + 0.9568369484056282 * z;
	return vec3(spow_(r, 1.0 / 2.2), spow_(g, 1.0 / 2.2), spow_(b, 1.0 / 2.2));
}`,
}
