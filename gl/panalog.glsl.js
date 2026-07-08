// GLSL chunk: Panalog <-> linear-light RGB 0-1. No native gamut of its own — edges
// to lrgb. Mirrors panalog.js decode/encode (Cineon-style curve, black 64/white 681
// over 10 bits, gain 444).
export default {
	name: 'panalog',
	edges: { lrgb: ['lrgb_panalog', 'panalog_lrgb'] },
	code: /* glsl */ `
float panalog_dec_(float y) {
	float bo = pow(10.0, (64.0 - 681.0) / 444.0);
	return (pow(10.0, (1023.0 * y - 681.0) / 444.0) - bo) / (1.0 - bo);
}
float panalog_enc_(float x) {
	float bo = pow(10.0, (64.0 - 681.0) / 444.0);
	return (681.0 + 444.0 * (log(x * (1.0 - bo) + bo) / log(10.0))) / 1023.0;
}
vec3 lrgb_panalog(vec3 c) {
	return vec3(panalog_enc_(c.x), panalog_enc_(c.y), panalog_enc_(c.z));
}
vec3 panalog_lrgb(vec3 c) {
	return vec3(panalog_dec_(c.x), panalog_dec_(c.y), panalog_dec_(c.z));
}`,
}
