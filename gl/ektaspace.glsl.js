// GLSL chunk: Ekta Space PS 5 0-1 <-> CIE XYZ D65 0-100. Pure gamma 2.2, sign-extended.
// Mirrors ektaspace.js: M = bradford.D50_D65 x M50, MI = inv3(M);
// the digits are printed from the module.
import xyz from './xyz.glsl.js'
export default {
	name: 'ektaspace',
	deps: [xyz],
	edges: { xyz: ['xyz_ektaspace', 'ektaspace_xyz'] },
	code: /* glsl */ `
vec3 ektaspace_xyz(vec3 c) {
	float r = spow_(c.x, 2.2); float g = spow_(c.y, 2.2); float b = spow_(c.z, 2.2);
	return vec3(
		100.0 * (0.5615269511329072 * r + 0.2464904960913119 * g + 0.14243847982745236 * b),
		100.0 * (0.24642887945235195 * r + 0.7353861635113005 * g + 0.0181849570363475 * b),
		100.0 * (0.001968656863158679 * r + 0.04415801218476324 * g + 1.0429310817119566 * b));
}
vec3 xyz_ektaspace(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 2.080704152405182 * x - 0.6810703345397342 * y - 0.2722970929208143 * z;
	float g = -0.69788028772439 * x + 1.5896899763410879 * y + 0.06759465184258688 * z;
	float b = 0.02562088157842859 * x - 0.06602234487426814 * y + 0.9564881434386254 * z;
	return vec3(spow_(r, 1.0 / 2.2), spow_(g, 1.0 / 2.2), spow_(b, 1.0 / 2.2));
}`,
}
