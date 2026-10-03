// GLSL chunk: Apple Log 2 0-1 <-> CIE XYZ D65 0-100, via Apple Wide Gamut linear RGB.
// The Apple Log curve unchanged (reuses applelog's helpers — requires: ['applelog']),
// then the Apple Wide Gamut -> XYZ matrix; mirrors applelog2.js M; MI is M's exact
// inverse (inv3).
import xyz from './xyz.glsl.js'
import applelog from './applelog.glsl.js'
export default {
	name: 'applelog2',
	deps: [xyz, applelog],
	edges: { xyz: ['xyz_applelog2', 'applelog2_xyz'] },
	requires: ['applelog'],
	code: /* glsl */ `
vec3 applelog2_xyz(vec3 c) {
	float r = applelog_dec_(c.x); float g = applelog_dec_(c.y); float b = applelog_dec_(c.z);
	return vec3(
		100.0 * (0.6514914801673072 * r + 0.2215531132940402 * g + 0.07741133359032426 * b),
		100.0 * (0.2704812903867027 * r + 0.81603725892013 * g + -0.08651854930683298 * b),
		100.0 * (-0.023363832392206848 * r + -0.03508759712801534 * g + 1.1475091802801007 * b));
}
vec3 xyz_applelog2(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.72684354824218 * x - 0.47538597594629634 * y - 0.15233600739324082 * z;
	float g = -0.5704962288539986 * x + 1.3864728409031426 * y + 0.14302150741141936 * z;
	float b = 0.017715188459451685 * x + 0.03271534803561731 * y + 0.8727242843008967 * z;
	return vec3(applelog_enc_(r), applelog_enc_(g), applelog_enc_(b));
}`,
}
