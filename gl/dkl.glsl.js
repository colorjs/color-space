// GLSL chunk: CIE XYZ D65 0-100 <-> calibrated Cartesian DKL. Mirrors dkl.js:
// 50%-linear D65 is the adapting origin; columns of A are the luminance, scaled
// Smith-Pokorny L−M and scaled S cardinal vectors for an sRGB display. AI is inv3(A).
import xyz from './xyz.glsl.js'
export default {
	name: 'dkl',
	deps: [xyz],
	edges: { xyz: ['xyz_dkl', 'dkl_xyz'] },
	code: /* glsl */ `
vec3 xyz_dkl(vec3 c) {
	vec3 d = c - vec3(47.5228, 50.0, 54.4529);
	return vec3(
		-0.002125242659885096 * d.x + 0.021529715775033466 * d.y + 0.000450144861440146 * d.z,
		 0.06650984937107116 * d.x - 0.04787272893511746 * d.y - 0.014087363995961057 * d.z,
		 0.002473645552568517 * d.x - 0.025059202264392337 * d.y + 0.020851149348409613 * d.z);
}
vec3 dkl_xyz(vec3 c) {
	return vec3(47.5228, 50.0, 54.4529) + vec3(
		47.5228 * c.x + 16.18535899466188 * c.y + 9.909137184210701 * c.z,
		50.0 * c.x + 1.5976901767044762 * c.y,
		54.4529 * c.x + 46.78343100299599 * c.z);
}`,
}
