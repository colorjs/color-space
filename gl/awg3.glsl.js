// GLSL chunk: ARRI Wide Gamut 3 (scene-linear) <-> CIE XYZ D65 0-100.
// Mirrors awg3.js: M printed from awg3.js, MI = inv3(M) printed from util.js inv3.
import xyz from './xyz.glsl.js'
export default {
	name: 'awg3',
	deps: [xyz],
	edges: { xyz: ['xyz_awg3', 'awg3_xyz'] },
	code: /* glsl */ `
vec3 awg3_xyz(vec3 c) {
	return vec3(
		100.0 * (0.6380076193 * c.x + 0.2147038563 * c.y + 0.0977444514 * c.z),
		100.0 * (0.291953779 * c.x + 0.8238410415 * c.y - 0.1157948205 * c.z),
		100.0 * (0.002798279 * c.x - 0.0670342357 * c.y + 1.1532937074 * c.z));
}
vec3 xyz_awg3(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	return vec3(
		1.789065550870615 * x - 0.4825338636668761 * y - 0.20007579286733604 * z,
		-0.6398486598670743 * x + 1.3963999568410177 * y + 0.19443229174628007 * z,
		-0.04153154580758554 * x + 0.08233537355363747 * y + 0.8788684803000081 * z);
}`,
}
