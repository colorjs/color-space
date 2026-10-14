// GLSL chunk: V-Log (Panasonic) <-> CIE XYZ D65 0-100, via V-Gamut.
// Mirrors vlog.js decode/encode (same constants as wasm/batch.js xyz_vlog); the matrix
// comes from vgamut.glsl.js (requires: ['vgamut']).
import xyz from './xyz.glsl.js'
import vgamut from './vgamut.glsl.js'
export default {
	name: 'vlog',
	deps: [xyz, vgamut],
	edges: { xyz: ['xyz_vlog', 'vlog_xyz'] },
	requires: ['vgamut'],
	code: /* glsl */ `
float vlog_log10_(float x) { return log(x) / log(10.0); }
float vlog_dec_(float v) {
	if (v < 0.181) { return (v - 0.125) / 5.6; }
	return pow(10.0, (v - 0.598206) / 0.241514) - 0.00873;
}
float vlog_enc_(float l) {
	if (l < 0.01) { return 5.6 * l + 0.125; }
	return 0.241514 * vlog_log10_(l + 0.00873) + 0.598206;
}
vec3 vlog_xyz(vec3 c) {
	return vgamut_xyz(vec3(vlog_dec_(c.x), vlog_dec_(c.y), vlog_dec_(c.z)));
}
vec3 xyz_vlog(vec3 c) {
	vec3 l = xyz_vgamut(c);
	return vec3(vlog_enc_(l.x), vlog_enc_(l.y), vlog_enc_(l.z));
}`,
}
