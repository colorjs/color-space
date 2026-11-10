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
		100.0 * (0.481965747944094 * r + 0.2982722406614766 * g + 0.170217938446101 * b),
		100.0 * (0.2637556215281384 * r + 0.6578381944823614 * g + 0.07840618398950062 * b),
		100.0 * (0.032910104804366964 * r + 0.13516327371012266 * g + 0.9209843722453891 * b));
}
vec3 xyz_colormatch(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 2.7356565448647263 * x - 1.1567297182866196 * y - 0.40713291728412454 * z;
	float g = -1.1045112045975767 * x + 2.014219395581429 * y + 0.03266110112021122 * z;
	float b = 0.06434268425010797 * x - 0.25427184029967065 * y + 1.0955497574479003 * z;
	return vec3(spow_(r, 1.0 / 1.8), spow_(g, 1.0 / 1.8), spow_(b, 1.0 / 1.8));
}`,
}
