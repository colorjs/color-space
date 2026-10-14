// GLSL chunk: Log3G12 <-> CIE XYZ D65 0-100, via REDWideGamutRGB; sign-symmetric log
// curve. Mirrors log3g12.js enc/dec; the RWG matrix comes from rwg.glsl.js (requires: ['rwg']).
import xyz from './xyz.glsl.js'
import rwg from './rwg.glsl.js'
export default {
	name: 'log3g12',
	deps: [xyz, rwg],
	edges: { xyz: ['xyz_log3g12', 'log3g12_xyz'] },
	requires: ['rwg'],
	code: /* glsl */ `
float log3g12_dec_(float y) {
	return sign(y) * (pow(10.0, abs(y) / 0.184904) - 1.0) / 347.189667;
}
float log3g12_enc_(float x) {
	return sign(x) * 0.184904 * (log(abs(x) * 347.189667 + 1.0) / log(10.0));
}
vec3 log3g12_xyz(vec3 c) {
	return rwg_xyz(vec3(log3g12_dec_(c.x), log3g12_dec_(c.y), log3g12_dec_(c.z)));
}
vec3 xyz_log3g12(vec3 c) {
	vec3 l = xyz_rwg(c);
	return vec3(log3g12_enc_(l.x), log3g12_enc_(l.y), log3g12_enc_(l.z));
}`,
}
