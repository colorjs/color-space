// GLSL chunk: Adobe Wide Gamut RGB 0-1 <-> CIE XYZ D65 0-100. Pure gamma 563/256, sign-extended.
// Mirrors widegamut.js: M = bradford.D50_D65 x M50, MI = inv3(M);
// the digits are printed from the module.
import xyz from './xyz.glsl.js'
export default {
	name: 'widegamut',
	deps: [xyz],
	edges: { xyz: ['xyz_widegamut', 'widegamut_xyz'] },
	code: /* glsl */ `
vec3 widegamut_xyz(vec3 c) {
	float r = spow_(c.x, 563.0 / 256.0); float g = spow_(c.y, 563.0 / 256.0); float b = spow_(c.z, 563.0 / 256.0);
	return vec3(
		100.0 * (0.678621168694023 * r + 0.08302305296691684 * g + 0.18881170539073147 * b),
		100.0 * (0.2409874177516392 * r + 0.7301374493136529 * g + 0.028875132934707986 * b),
		100.0 * (0.003517092404846423 * r + 0.05451289705910135 * g + 1.0310277612959307 * b));
}
vec3 xyz_widegamut(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.5294518998253077 * x - 0.1533210452729603 * y - 0.2757939859909839 * z;
	float g = -0.5056582151724404 * x + 1.4231650267996252 * y + 0.05274359494095818 * z;
	float b = 0.021518014745252625 * x - 0.07472311339451479 * y + 0.968058110789715 * z;
	return vec3(spow_(r, 256.0 / 563.0), spow_(g, 256.0 / 563.0), spow_(b, 256.0 / 563.0));
}`,
}
