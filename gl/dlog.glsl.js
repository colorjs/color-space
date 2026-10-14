// GLSL chunk: D-Log 0-1 <-> CIE XYZ D65 0-100, via D-Gamut linear RGB.
// Linear toe + log10 highlight. Mirrors dlog.js enc/dec; the D-Gamut matrix comes from
// dgamut.glsl.js (requires: ['dgamut']).
import xyz from './xyz.glsl.js'
import dgamut from './dgamut.glsl.js'
export default {
	name: 'dlog',
	deps: [xyz, dgamut],
	edges: { xyz: ['xyz_dlog', 'dlog_xyz'] },
	requires: ['dgamut'],
	code: /* glsl */ `
float dlog_enc_(float x) {
	if (x <= 0.0078) { return 6.025 * x + 0.0929; }
	return (log(x * 0.9892 + 0.0108) / 2.302585092994046) * 0.256663 + 0.584555;
}
float dlog_dec_(float y) {
	if (y <= 0.14) { return (y - 0.0929) / 6.025; }
	return (pow(10.0, (y - 0.584555) / 0.256663) - 0.0108) / 0.9892;
}
vec3 dlog_xyz(vec3 c) {
	return dgamut_xyz(vec3(dlog_dec_(c.x), dlog_dec_(c.y), dlog_dec_(c.z)));
}
vec3 xyz_dlog(vec3 c) {
	vec3 l = xyz_dgamut(c);
	return vec3(dlog_enc_(l.x), dlog_enc_(l.y), dlog_enc_(l.z));
}`,
}
