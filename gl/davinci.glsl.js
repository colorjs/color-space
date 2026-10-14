// GLSL chunk: DaVinci Intermediate <-> CIE XYZ D65 0-100, via DaVinci Wide Gamut.
// Linear segment below LIN_CUT, log2 segment above. Mirrors davinci.js enc/dec
// (whitepaper constants A, B, C, M, LIN_CUT, LOG_CUT); the whitepaper matrices come
// from dwg.glsl.js (requires: ['dwg']).
import xyz from './xyz.glsl.js'
import dwg from './dwg.glsl.js'
export default {
	name: 'davinci',
	deps: [xyz, dwg],
	edges: { xyz: ['xyz_davinci', 'davinci_xyz'] },
	requires: ['dwg'],
	code: /* glsl */ `
float davinci_enc_(float x) {
	if (x <= 0.00262409) { return x * 10.44426855; }
	return 0.07329248 * (log2(x + 0.0075) + 7.0);
}
float davinci_dec_(float v) {
	if (v <= 0.02740668) { return v / 10.44426855; }
	return pow(2.0, v / 0.07329248 - 7.0) - 0.0075;
}
vec3 davinci_xyz(vec3 c) {
	return dwg_xyz(vec3(davinci_dec_(c.x), davinci_dec_(c.y), davinci_dec_(c.z)));
}
vec3 xyz_davinci(vec3 c) {
	vec3 l = xyz_dwg(c);
	return vec3(davinci_enc_(l.x), davinci_enc_(l.y), davinci_enc_(l.z));
}`,
}
