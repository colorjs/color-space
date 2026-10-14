// GLSL chunk: Panasonic V-Gamut (scene-linear) <-> CIE XYZ D65 0-100.
// Mirrors vgamut.js: M printed from vgamut.js, MI = inv3(M) printed from util.js inv3.
import xyz from './xyz.glsl.js'
export default {
	name: 'vgamut',
	deps: [xyz],
	edges: { xyz: ['xyz_vgamut', 'vgamut_xyz'] },
	code: /* glsl */ `
vec3 vgamut_xyz(vec3 c) {
	return vec3(
		100.0 * (0.6796444698784739 * c.x + 0.1522114124397545 * c.y + 0.118600044733443 * c.z),
		100.0 * (0.2606855500903736 * c.x + 0.7748944633296593 * c.y - 0.0355800134200329 * c.z),
		100.0 * (-0.0093101982175133 * c.x - 0.0046124670436289 * c.y + 1.1029804160210204 * c.z));
}
vec3 xyz_vgamut(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	return vec3(
		1.5890117738723923 * x - 0.31320448446022 * y - 0.18096485152800618 * z,
		-0.5340529104491584 * x + 1.3960114333501836 * y + 0.10245767101658204 * z,
		0.011179448842977967 * x + 0.003194128240850844 * y + 0.9055353562812193 * z);
}`,
}
