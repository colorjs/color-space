// GLSL chunk: Bruce RGB 0-1 <-> CIE XYZ D65 0-100. Pure gamma 2.2, sign-extended.
// Mirrors brucergb.js: M (native D65) and MI = inv3(M);
// the digits are printed from the module.
import xyz from './xyz.glsl.js'
export default {
	name: 'brucergb',
	deps: [xyz],
	edges: { xyz: ['xyz_brucergb', 'brucergb_xyz'] },
	code: /* glsl */ `
vec3 brucergb_xyz(vec3 c) {
	float r = spow_(c.x, 2.2); float g = spow_(c.y, 2.2); float b = spow_(c.z, 2.2);
	return vec3(
		100.0 * (0.46735179379173347 * r + 0.29445803317138564 * g + 0.18864610008855276 * b),
		100.0 * (0.24097826867386257 * r + 0.6835632912907166 * g + 0.0754584400354211 * b),
		100.0 * (0.021907115333987485 * r + 0.07361450829284635 * g + 0.9935361271330445 * b));
}
vec3 xyz_brucergb(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 2.745845009258804 * x - 1.1359700440817397 * y - 0.4350867705619192 * z;
	float g = -0.9692436362808793 * x + 1.8759675015077197 * y + 0.041555057407175584 * z;
	float b = 0.011269696277688979 * x - 0.11394915125218838 * y + 1.0130204765167086 * z;
	return vec3(spow_(r, 1.0 / 2.2), spow_(g, 1.0 / 2.2), spow_(b, 1.0 / 2.2));
}`,
}
