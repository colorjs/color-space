// GLSL chunk: DJI D-Gamut (scene-linear) <-> CIE XYZ D65 0-100.
// Mirrors dgamut.js: M printed from dgamut.js, MI = inv3(M) printed from util.js inv3.
import xyz from './xyz.glsl.js'
export default {
	name: 'dgamut',
	deps: [xyz],
	edges: { xyz: ['xyz_dgamut', 'dgamut_xyz'] },
	code: /* glsl */ `
vec3 dgamut_xyz(vec3 c) {
	return vec3(
		100.0 * (0.6482 * c.x + 0.194 * c.y + 0.1082 * c.z),
		100.0 * (0.283 * c.x + 0.8132 * c.y - 0.0962 * c.z),
		100.0 * (-0.0183 * c.x - 0.0832 * c.y + 1.1903 * c.z));
}
vec3 xyz_dgamut(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	return vec3(
		1.7256172712954423 * x - 0.43128461463188433 * y - 0.19171752388620864 * z,
		-0.6023708376855555 * x + 1.390513766953038 * y + 0.167137653548231 * z,
		-0.015574609452013466 * x + 0.09056392250922396 * y + 0.8488594657549318 * z);
}`,
}
