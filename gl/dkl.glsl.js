// GLSL chunk: CIE XYZ D65 0-100 <-> calibrated Cartesian DKL. Mirrors dkl.js:
// 50%-linear D65 (47.5228, 50, 54.4529) is the adapting origin; columns of A are
// the luminance, scaled Smith-Pokorny L−M and scaled S cardinal vectors for an
// sRGB display (A's Y·S and Z·(L−M) entries are exact zeros). AI is inv3(A).
// Scalar style, like every other chunk: the dialect has no vec3 arithmetic.
import xyz from './xyz.glsl.js'
export default {
	name: 'dkl',
	deps: [xyz],
	edges: { xyz: ['xyz_dkl', 'dkl_xyz'] },
	code: /* glsl */ `
vec3 xyz_dkl(vec3 c) {
	float x = c.x - 47.5228; float y = c.y - 50.0; float z = c.z - 54.4529;
	return vec3(
		-0.0021252426598850956 * x + 0.021529715775033466 * y + 0.000450144861440146 * z,
		0.06650984937107116 * x - 0.04787272893511746 * y - 0.014087363995961057 * z,
		0.0024736455525685174 * x - 0.025059202264392337 * y + 0.020851149348409613 * z);
}
vec3 dkl_xyz(vec3 c) {
	return vec3(
		47.5228 * c.x + 16.18535899466188 * c.y + 9.909137184210701 * c.z + 47.5228,
		50.0 * c.x + 1.5976901767044762 * c.y + 50.0,
		54.4529 * c.x + 46.78343100299599 * c.z + 54.4529);
}`,
}
