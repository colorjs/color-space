// GLSL chunk: linear-light Display P3 0-1 <-> CIE XYZ D65 0-100.
// Matrix mirrors p3-linear.js M (DCI-P3 primaries, D65 white); inverse derived via inv3.
import xyz from './xyz.glsl.js'
export default {
	name: 'p3-linear',
	deps: [xyz],
	edges: { xyz: ['xyz_p3linear', 'p3linear_xyz'] },
	code: /* glsl */ `
vec3 p3linear_xyz(vec3 c) {
	return vec3(
		100.0 * (0.4865709486482162 * c.x + 0.26566769316909306 * c.y + 0.1982172852343625 * c.z),
		100.0 * (0.2289745640697488 * c.x + 0.6917385218365064 * c.y + 0.079286914093745 * c.z),
		100.0 * (0.0 * c.x + 0.04511338185890264 * c.y + 1.043944368900976 * c.z));
}
vec3 xyz_p3linear(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	return vec3(
		2.493496911941425 * x - 0.9313836179191237 * y - 0.4027107844507168 * z,
		-0.8294889695615747 * x + 1.7626640603183459 * y + 0.023624685841943584 * z,
		0.03584583024378436 * x - 0.07617238926804176 * y + 0.9568845240076871 * z);
}`,
}
