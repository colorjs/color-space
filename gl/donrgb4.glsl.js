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
		100.0 * (0.6109201873726999 * r + 0.16997861876688364 * g + 0.1695571230999025 * b),
		100.0 * (0.26293166348028346 * r + 0.6896996961306028 * g + 0.04736866775962437 * b),
		100.0 * (0.0071822906862414665 * r + 0.012199690324532204 * g + 1.069675718461804 * b));
}
vec3 xyz_donrgb4(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.8323544617285217 * x - 0.44680176976130653 * y - 0.270665531101388 * z;
	float g = -0.6982436563511455 * x + 1.6213029036865494 * y + 0.038883959216187425 * z;
	float b = -0.004339769451332516 * x - 0.01549098747563991 * y + 0.9362366640445036 * z;
	return vec3(spow_(r, 1.0 / 2.2), spow_(g, 1.0 / 2.2), spow_(b, 1.0 / 2.2));
}`,
}
