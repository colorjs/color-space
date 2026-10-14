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
		100.0 * (0.6786211698639721 * r + 0.08302300010277967 * g + 0.18881175927273405 * b),
		100.0 * (0.24098743495438102 * r + 0.7301374908169587 * g + 0.028875101599170918 * b),
		100.0 * (0.0035170707690700418 * r + 0.054512862101301324 * g + 1.0310277666022059 * b));
}
vec3 xyz_widegamut(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.52945185092447 * x - 0.15332092767807037 * y - 0.2757940634994696 * z;
	float g = -0.5056582059752436 * x + 1.4231649054607218 * y + 0.05274366606298061 * z;
	float b = 0.021518029265348678 * x - 0.07472306195948748 * y + 0.9680580983123963 * z;
	return vec3(spow_(r, 256.0 / 563.0), spow_(g, 256.0 / 563.0), spow_(b, 256.0 / 563.0));
}`,
}
