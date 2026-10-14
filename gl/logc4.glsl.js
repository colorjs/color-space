// GLSL chunk: LogC4 (ARRI, ALEXA 35) <-> CIE XYZ D65 0-100, via ARRI Wide Gamut 4.
// Mirrors logc4.js: decode/encode here (same constants as wasm/batch.js xyz_logc4), the
// AWG4 matrix from awg4.glsl.js (requires: ['awg4']).
import xyz from './xyz.glsl.js'
import awg4 from './awg4.glsl.js'
export default {
	name: 'logc4',
	deps: [xyz, awg4],
	edges: { xyz: ['xyz_logc4', 'logc4_xyz'] },
	requires: ['awg4'],
	code: /* glsl */ `
float logc4_dec_(float v) {
	if (v >= 0.0) { return (pow(2.0, 14.0 * (v - 0.09286412512218964) / 0.9071358748778103 + 6.0) - 64.0) / 2231.8263090676883; }
	return v * 0.1135972086105891 - 0.01805699611991131;
}
float logc4_enc_(float v) {
	if (v >= -0.01805699611991131) { return (log2(2231.8263090676883 * v + 64.0) - 6.0) / 14.0 * 0.9071358748778103 + 0.09286412512218964; }
	return (v + 0.01805699611991131) / 0.1135972086105891;
}
vec3 logc4_xyz(vec3 c) {
	return awg4_xyz(vec3(logc4_dec_(c.x), logc4_dec_(c.y), logc4_dec_(c.z)));
}
vec3 xyz_logc4(vec3 c) {
	vec3 l = xyz_awg4(c);
	return vec3(logc4_enc_(l.x), logc4_enc_(l.y), logc4_enc_(l.z));
}`,
}
