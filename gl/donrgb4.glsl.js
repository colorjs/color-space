// GLSL chunk: Don RGB 4 0-1 <-> CIE XYZ D65 0-100. Pure gamma 2.2, sign-extended.
// Mirrors donrgb4.js: M = bradford.D50_D65 x M50, MI = inv3(M);
// the digits are printed from the module.
import xyz from './xyz.glsl.js'
export default {
	name: 'donrgb4',
	deps: [xyz],
	edges: { xyz: ['xyz_donrgb4', 'donrgb4_xyz'] },
	code: /* glsl */ `
vec3 donrgb4_xyz(vec3 c) {
	float r = spow_(c.x, 2.2); float g = spow_(c.y, 2.2); float b = spow_(c.z, 2.2);
	return vec3(
		100.0 * (0.6109201897755863 * r + 0.16997866791326088 * g + 0.1695570693628244 * b),
		100.0 * (0.262931645423238 * r + 0.6896996552078022 * g + 0.04736869936895974 * b),
		100.0 * (0.007182312279901116 * r + 0.012199725110871217 * g + 1.0696757133691064 * b));
}
vec3 xyz_donrgb4(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.8323545181763559 * x - 0.44680192890681814 * y - 0.2706654290354541 * z;
	float g = -0.698243670130883 * x + 1.6213030526180612 * y + 0.03888387200274899 * z;
	float b = -0.004339783976590931 * x - 0.015491031885256922 * y + 0.9362366730106878 * z;
	return vec3(spow_(r, 1.0 / 2.2), spow_(g, 1.0 / 2.2), spow_(b, 1.0 / 2.2));
}`,
}
