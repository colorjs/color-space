// GLSL chunk: ARRI Wide Gamut 4 (scene-linear) <-> CIE XYZ D65 0-100.
// Mirrors awg4.js: M printed from awg4.js, MI = inv3(M) printed from util.js inv3.
import xyz from './xyz.glsl.js'
export default {
	name: 'awg4',
	deps: [xyz],
	edges: { xyz: ['xyz_awg4', 'awg4_xyz'] },
	code: /* glsl */ `
vec3 awg4_xyz(vec3 c) {
	return vec3(
		100.0 * (0.7048583204072321 * c.x + 0.129760295170463 * c.y + 0.11583731147397654 * c.z),
		100.0 * (0.254524176404027 * c.x + 0.781477732712002 * c.y - 0.03600190911602904 * c.z),
		100.0 * (1.0890577507598784 * c.z));
}
vec3 xyz_awg4(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	return vec3(
		1.509215472242109 * x - 0.25059734520438 * y - 0.1688114752940731 * z,
		-0.4915454516606189 * x + 1.3612455459293507 * y + 0.09728294201372903 * z,
		0.9182249511582473 * z);
}`,
}
