// GLSL chunk: Log3G10 (RED whitepaper 915-0187 Rev-C) <-> CIE XYZ D65 0-100, via
// REDWideGamutRGB. Mirrors log3g10.js decode/encode; the RWG matrix comes from
// rwg.glsl.js (requires: ['rwg']), same literals as wasm/batch.js log3g10_xyz / xyz_log3g10.
import xyz from './xyz.glsl.js'
import rwg from './rwg.glsl.js'
export default {
	name: 'log3g10',
	deps: [xyz, rwg],
	edges: { xyz: ['xyz_log3g10', 'log3g10_xyz'] },
	requires: ['rwg'],
	code: /* glsl */ `
float log3g10_dec_(float v) {
	if (v >= 0.0) { return (pow(10.0, v / 0.224282) - 1.0) / 155.975327 - 0.01; }
	return v / 15.1927 - 0.01;
}
float log3g10_enc_(float l) {
	float x = l + 0.01;
	if (x < 0.0) { return x * 15.1927; }
	return 0.224282 * (log(x * 155.975327 + 1.0) / log(10.0));
}
vec3 log3g10_xyz(vec3 c) {
	return rwg_xyz(vec3(log3g10_dec_(c.x), log3g10_dec_(c.y), log3g10_dec_(c.z)));
}
vec3 xyz_log3g10(vec3 c) {
	vec3 l = xyz_rwg(c);
	return vec3(log3g10_enc_(l.x), log3g10_enc_(l.y), log3g10_enc_(l.z));
}`,
}
