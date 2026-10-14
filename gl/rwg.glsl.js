// GLSL chunk: REDWideGamutRGB (scene-linear) <-> CIE XYZ D65 0-100.
// Mirrors rwg.js: M printed from rwg.js, MI = inv3(M) printed from util.js inv3.
import xyz from './xyz.glsl.js'
export default {
	name: 'rwg',
	deps: [xyz],
	edges: { xyz: ['xyz_rwg', 'rwg_xyz'] },
	code: /* glsl */ `
vec3 rwg_xyz(vec3 c) {
	return vec3(
		100.0 * (0.7352752459058587 * c.x + 0.068609410613961 * c.y + 0.146571270531852 * c.z),
		100.0 * (0.2866940994999349 * c.x + 0.8429791340169754 * c.y - 0.1296732335169103 * c.z),
		100.0 * (-0.0796808568783677 * c.x - 0.3473432169944297 * c.y + 1.516081824632676 * c.z));
}
vec3 xyz_rwg(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	return vec3(
		1.4128064803693583 * x - 0.17752320098966512 * y - 0.15177073202874272 * z,
		-0.48620327686049064 * x + 1.2906964267981604 * y + 0.15740061472978117 * z,
		-0.037139010852832395 * x + 0.28637599977945394 * y + 0.6876797788619603 * z);
}`,
}
