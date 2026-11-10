// GLSL chunk: Beta RGB 0-1 <-> CIE XYZ D65 0-100. Pure gamma 2.2, sign-extended.
// Mirrors betargb.js: M = bradford.D50_D65 x M50, MI = inv3(M);
// the digits are printed from the module.
import xyz from './xyz.glsl.js'
export default {
	name: 'betargb',
	deps: [xyz],
	edges: { xyz: ['xyz_betargb', 'betargb_xyz'] },
	code: /* glsl */ `
vec3 betargb_xyz(vec3 c) {
	float r = spow_(c.x, 2.2); float g = spow_(c.y, 2.2); float b = spow_(c.z, 2.2);
	return vec3(
		100.0 * (0.6344565270680302 * r + 0.1540423534066137 * g + 0.16195704657702753 * b),
		100.0 * (0.28730437275035403 * r + 0.6662824065166004 * g + 0.04641322073304563 * b),
		100.0 * (0.0020467319579810204 * r + 0.04268161079421823 * g + 1.0443294080076795 * b));
}
vec3 xyz_betargb(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.7531305734081353 * x - 0.3890092408553925 * y - 0.25459081792715477 * z;
	float g = -0.7578771759873971 * x + 1.673318673677061 * y + 0.0431659204340101 * z;
	float b = 0.027538466372476037 * x - 0.06762592164679689 * y + 0.9562870493640043 * z;
	return vec3(spow_(r, 1.0 / 2.2), spow_(g, 1.0 / 2.2), spow_(b, 1.0 / 2.2));
}`,
}
