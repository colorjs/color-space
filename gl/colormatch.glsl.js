// GLSL chunk: ColorMatch RGB 0-1 <-> CIE XYZ D65 0-100. Pure gamma 1.8, sign-extended.
// Mirrors colormatch.js: M = bradford.D50_D65 x M50, MI = inv3(M);
// the digits are printed from the module.
import xyz from './xyz.glsl.js'
export default {
	name: 'colormatch',
	deps: [xyz],
	edges: { xyz: ['xyz_colormatch', 'colormatch_xyz'] },
	code: /* glsl */ `
vec3 colormatch_xyz(vec3 c) {
	float r = spow_(c.x, 1.8); float g = spow_(c.y, 1.8); float b = spow_(c.z, 1.8);
	return vec3(
		100.0 * (0.4819657429103314 * r + 0.2982722038852892 * g + 0.17021798244386563 * b),
		100.0 * (0.26375563818778364 * r + 0.6578382300849579 * g + 0.07840615909776946 * b),
		100.0 * (0.03291008538336283 * r + 0.13516323959160662 * g + 0.9209843744976082 * b));
}
vec3 xyz_colormatch(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 2.735656462820099 * x - 1.156729452051123 * y - 0.40713308574285356 * z;
	float g = -1.1045111806820875 * x + 2.0142191909929243 * y + 0.03266122124171094 * z;
	float b = 0.06434270028469131 * x - 0.2542717689401406 * y + 1.0955497357841022 * z;
	return vec3(spow_(r, 1.0 / 1.8), spow_(g, 1.0 / 1.8), spow_(b, 1.0 / 1.8));
}`,
}
