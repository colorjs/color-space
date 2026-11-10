// GLSL chunk: Best RGB 0-1 <-> CIE XYZ D65 0-100. Pure gamma 2.2, sign-extended.
// Mirrors bestrgb.js: M = bradford.D50_D65 x M50, MI = inv3(M);
// the digits are printed from the module.
import xyz from './xyz.glsl.js'
export default {
	name: 'bestrgb',
	deps: [xyz],
	edges: { xyz: ['xyz_bestrgb', 'bestrgb_xyz'] },
	code: /* glsl */ `
vec3 bestrgb_xyz(vec3 c) {
	float r = spow_(c.x, 2.2); float g = spow_(c.y, 2.2); float b = spow_(c.z, 2.2);
	return vec3(
		100.0 * (0.5993176089085 * r + 0.17901001364815142 * g + 0.17212830449502028 * b),
		100.0 * (0.21282566717140824 * r + 0.7390873144627212 * g + 0.04808701836587086 * b),
		100.0 * (0.0031060855564515938 * r + 0.000054936782533605844 * g + 1.0858967284208936 * b));
}
vec3 xyz_bestrgb(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.82710591261982 * x - 0.4425125607456909 * y - 0.27002340605884817 * z;
	float g = -0.5257903802445822 * x + 1.4803673997190192 * y + 0.0177889405384411 * z;
	float b = -0.005199630780478307 * x + 0.001190863935517051 * y + 0.9216693561548155 * z;
	return vec3(spow_(r, 1.0 / 2.2), spow_(g, 1.0 / 2.2), spow_(b, 1.0 / 2.2));
}`,
}
