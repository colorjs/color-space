// GLSL chunk: Blackmagic Wide Gamut (Gen 5) (scene-linear) <-> CIE XYZ D65 0-100.
// Mirrors bmdwg.js: M printed from bmdwg.js, MI = inv3(M) printed from util.js inv3.
import xyz from './xyz.glsl.js'
export default {
	name: 'bmdwg',
	deps: [xyz],
	edges: { xyz: ['xyz_bmdwg', 'bmdwg_xyz'] },
	code: /* glsl */ `
vec3 bmdwg_xyz(vec3 c) {
	return vec3(
		100.0 * (0.6065383683 * c.x + 0.2204127353 * c.y + 0.1235048234 * c.z),
		100.0 * (0.2679929401 * c.x + 0.8327484091 * c.y - 0.1007413492 * c.z),
		100.0 * (-0.0294425542 * c.x - 0.0866124303 * c.y + 1.2051127352 * c.z));
}
vec3 xyz_bmdwg(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	return vec3(
		1.8663577355474374 * x - 0.5183905087079547 * y - 0.2346067164768635 * z,
		-0.6003298545521913 * x + 1.3781199506116673 * y + 0.17672810985349613 * z,
		0.0024514811060755946 * x + 0.08638160935268568 * y + 0.8367677153157205 * z);
}`,
}
