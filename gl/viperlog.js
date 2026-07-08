// GLSL chunk: ViperLog <-> linear-light RGB 0-1. No native gamut of its own — edges
// to lrgb. Mirrors viperlog.js decode/encode (pure log10, no black offset; linear
// input floors at 10^(-1023/500), the value that encodes to code 0).
export default {
	name: 'viperlog',
	edges: { lrgb: ['lrgb_viperlog', 'viperlog_lrgb'] },
	code: `
float viperlog_dec_(float y) {
	return pow(10.0, (1023.0 * y - 1023.0) / 500.0);
}
float viperlog_enc_(float x) {
	float fl = pow(10.0, -1023.0 / 500.0);
	return (1023.0 + 500.0 * (log(max(x, fl)) / log(10.0))) / 1023.0;
}
vec3 lrgb_viperlog(vec3 c) {
	return vec3(viperlog_enc_(c.x), viperlog_enc_(c.y), viperlog_enc_(c.z));
}
vec3 viperlog_lrgb(vec3 c) {
	return vec3(viperlog_dec_(c.x), viperlog_dec_(c.y), viperlog_dec_(c.z));
}`,
}
