// GLSL chunk: Log3G12 <-> CIE XYZ D65 0-100. Same REDWideGamutRGB matrix as
// log3g10.js; sign-symmetric log curve. Mirrors log3g12.js enc/dec and M/inv3(M).
import xyz from './xyz.glsl.js'
export default {
	name: 'log3g12',
	deps: [xyz],
	edges: { xyz: ['xyz_log3g12', 'log3g12_xyz'] },
	code: /* glsl */ `
float log3g12_dec_(float y) {
	return sign(y) * (pow(10.0, abs(y) / 0.184904) - 1.0) / 347.189667;
}
float log3g12_enc_(float x) {
	return sign(x) * 0.184904 * (log(abs(x) * 347.189667 + 1.0) / log(10.0));
}
vec3 log3g12_xyz(vec3 c) {
	float r = log3g12_dec_(c.x); float g = log3g12_dec_(c.y); float b = log3g12_dec_(c.z);
	return vec3(
		100.0 * (0.7352752459058587 * r + 0.068609410613961 * g + 0.146571270531852 * b),
		100.0 * (0.2866940994999349 * r + 0.8429791340169754 * g - 0.1296732335169103 * b),
		100.0 * (-0.0796808568783677 * r - 0.3473432169944297 * g + 1.5160818246326759 * b));
}
vec3 xyz_log3g12(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.4128064803693583 * x - 0.17752320098966512 * y - 0.15177073202874272 * z;
	float g = -0.48620327686049064 * x + 1.2906964267981604 * y + 0.15740061472978117 * z;
	float b = -0.037139010852832395 * x + 0.28637599977945394 * y + 0.6876797788619603 * z;
	return vec3(log3g12_enc_(r), log3g12_enc_(g), log3g12_enc_(b));
}`,
}
