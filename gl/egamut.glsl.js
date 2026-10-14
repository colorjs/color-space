// GLSL chunk: FilmLight E-Gamut (scene-linear) <-> CIE XYZ D65 0-100.
// Mirrors egamut.js: M printed from egamut.js, MI = inv3(M) printed from util.js inv3.
import xyz from './xyz.glsl.js'
export default {
	name: 'egamut',
	deps: [xyz],
	edges: { xyz: ['xyz_egamut', 'egamut_xyz'] },
	code: /* glsl */ `
vec3 egamut_xyz(vec3 c) {
	return vec3(
		100.0 * (0.7053968500877708 * c.x + 0.164041328309919 * c.y + 0.081017748653982 * c.z),
		100.0 * (0.2801307240911059 * c.x + 0.8202066415495949 * c.y - 0.1003373656407007 * c.z),
		100.0 * (-0.1037815115691633 * c.x - 0.0729072570266306 * c.y + 1.265746519355672 * c.z));
}
vec3 xyz_egamut(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	return vec3(
		1.525052770404748 * x - 0.31591351093474296 * y - 0.12265826460517526 * z,
		-0.5091525599713284 * x + 1.3333274087321485 * y + 0.13828436514138284 * z,
		0.09571534531370499 * x + 0.05089744385151596 * y + 0.7879557702853914 * z);
}`,
}
