// GLSL chunk: DaVinci Wide Gamut (scene-linear) <-> CIE XYZ D65 0-100.
// Mirrors dwg.js: M and MI as printed in dwg.js (both from the whitepaper, not inv3).
import xyz from './xyz.glsl.js'
export default {
	name: 'dwg',
	deps: [xyz],
	edges: { xyz: ['xyz_dwg', 'dwg_xyz'] },
	code: /* glsl */ `
vec3 dwg_xyz(vec3 c) {
	return vec3(
		100.0 * (0.70062239 * c.x + 0.14877482 * c.y + 0.10105872 * c.z),
		100.0 * (0.27411851 * c.x + 0.8736319 * c.y - 0.14775041 * c.z),
		100.0 * (-0.09896291 * c.x - 0.13789533 * c.y + 1.32591599 * c.z));
}
vec3 xyz_dwg(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	return vec3(
		1.51667204 * x - 0.28147805 * y - 0.14696363 * z,
		-0.4649171 * x + 1.25142378 * y + 0.17488461 * z,
		0.06484905 * x + 0.10913934 * y + 0.76141462 * z);
}`,
}
