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
		100.0 * (0.5615269483192795 * r + 0.24649044715402346 * g + 0.14243853376618307 * b),
		100.0 * (0.24642889648132832 * r + 0.7353862064237691 * g + 0.018184924465413088 * b),
		100.0 * (0.0019686367497616635 * r + 0.044157974384227805 * g + 1.042931088338588 * b));
}
vec3 xyz_ektaspace(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 2.0807040896507134 * x - 0.6810701419737876 * y - 0.27229721485827474 * z;
	float g = -0.6978802733691617 * x + 1.589689830640869 * y + 0.06759473773258556 * z;
	float b = 0.025620895759272476 * x - 0.06602229416647476 * y + 0.9564881311533673 * z;
	return vec3(spow_(r, 1.0 / 2.2), spow_(g, 1.0 / 2.2), spow_(b, 1.0 / 2.2));
}`,
}
