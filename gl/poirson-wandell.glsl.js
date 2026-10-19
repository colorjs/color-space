// GLSL chunk: CIE XYZ (2°, hub scale 0-100) <-> Poirson–Wandell opponent O1 O2 O3, Zhang's
// S-CIELAB 'xyz2opp' matrix (cmatrix.m) and its inverse. Mirrors poirson-wandell.js M / inv3(M).
import xyz from './xyz.glsl.js'
export default {
	name: 'poirson-wandell',
	deps: [xyz],
	edges: { xyz: ['xyz_poirsonwandell', 'poirsonwandell_xyz'] },
	code: /* glsl */ `
vec3 xyz_poirsonwandell(vec3 c) {
	return vec3(
		0.2787336 * c.x + 0.7218031 * c.y - 0.1065520 * c.z,
		-0.4487736 * c.x + 0.2898056 * c.y + 0.0771569 * c.z,
		0.0859513 * c.x - 0.5899859 * c.y + 0.5011089 * c.z);
}
vec3 poirsonwandell_xyz(vec3 c) {
	return vec3(
		0.979596160445628 * c.x - 1.5347157012664405 * c.y + 0.44459764330437396 * c.z,
		1.1889779067423236 * c.x + 0.7643549575179938 * c.y + 0.13512574791125836 * c.z,
		1.2318333139247288 * c.x + 1.163159259763651 * c.y + 2.078407588800857 * c.z);
}`,
}
