// GLSL chunk: Sony S-Gamut3 (scene-linear) <-> CIE XYZ D65 0-100.
// Mirrors sgamut3.js: M printed from sgamut3.js, MI = inv3(M) printed from util.js inv3.
import xyz from './xyz.glsl.js'
export default {
	name: 'sgamut3',
	deps: [xyz],
	edges: { xyz: ['xyz_sgamut3', 'sgamut3_xyz'] },
	code: /* glsl */ `
vec3 sgamut3_xyz(vec3 c) {
	return vec3(
		100.0 * (0.7064827132 * c.x + 0.1288010498 * c.y + 0.1151721641 * c.z),
		100.0 * (0.2709796708 * c.x + 0.7866064112 * c.y - 0.057586082 * c.z),
		100.0 * (-0.0096778454 * c.x + 0.0046000375 * c.y + 1.0941355587 * c.z));
}
vec3 xyz_sgamut3(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	return vec3(
		1.5073998990431192 * x - 0.24582213740524175 * y - 0.17161168084331915 * z,
		-0.5181517270645519 * x + 1.3553912409400366 * y + 0.12587866812835696 * z,
		0.01551169817958099 * x - 0.007872771439249991 * y + 0.9119163655330013 * z);
}`,
}
