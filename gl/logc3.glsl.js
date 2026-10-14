// GLSL chunk: LogC3 (ARRI, EI 800) <-> CIE XYZ D65 0-100, via ARRI Wide Gamut 3.
// Mirrors logc3.js: enc/dec here, the AWG3 matrix from awg3.glsl.js (requires: ['awg3']).
import xyz from './xyz.glsl.js'
import awg3 from './awg3.glsl.js'
export default {
	name: 'logc3',
	deps: [xyz, awg3],
	edges: { xyz: ['xyz_logc3', 'logc3_xyz'] },
	requires: ['awg3'],
	code: /* glsl */ `
float logc3_log10_(float x) { return log(x) / log(10.0); }
float logc3_dec_(float v) {
	if (v > 5.367655 * 0.010591 + 0.092809) { return (pow(10.0, (v - 0.385537) / 0.247190) - 0.052272) / 5.555556; }
	return (v - 0.092809) / 5.367655;
}
float logc3_enc_(float x) {
	if (x > 0.010591) { return 0.247190 * logc3_log10_(5.555556 * x + 0.052272) + 0.385537; }
	return 5.367655 * x + 0.092809;
}
vec3 logc3_xyz(vec3 c) {
	return awg3_xyz(vec3(logc3_dec_(c.x), logc3_dec_(c.y), logc3_dec_(c.z)));
}
vec3 xyz_logc3(vec3 c) {
	vec3 l = xyz_awg3(c);
	return vec3(logc3_enc_(l.x), logc3_enc_(l.y), logc3_enc_(l.z));
}`,
}
