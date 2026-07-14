// GLSL chunk: ACESproxy — quantized 10-bit log CV transport <-> ACEScg (linear AP1).
// Mirrors acesproxy.js exactly (ACES spec S-2013-001): CV = round((log2(lin)+2.5)*50+425)
// clamped to [64, 940], carried here as CV/1023 floats. round() = floor(x + 0.5), matching
// JS Math.round (ties toward +Infinity); values are always positive so this is exact.
import acescg from './acescg.glsl.js'
export default {
	name: 'acesproxy',
	deps: [acescg],
	edges: { acescg: ['acescg_acesproxy', 'acesproxy_acescg'] },
	code: /* glsl */ `
float acesproxy_enc_(float lin_) {
	if (lin_ <= pow(2.0, -9.72)) { return 64.0 / 1023.0; }
	float cv = floor((log2(lin_) + 2.5) * 50.0 + 425.0 + 0.5);
	cv = max(64.0, min(940.0, cv));
	return cv / 1023.0;
}
float acesproxy_dec_(float v) {
	return pow(2.0, (v * 1023.0 - 425.0) / 50.0 - 2.5);
}
vec3 acescg_acesproxy(vec3 c) {
	return vec3(acesproxy_enc_(c.x), acesproxy_enc_(c.y), acesproxy_enc_(c.z));
}
vec3 acesproxy_acescg(vec3 c) {
	return vec3(acesproxy_dec_(c.x), acesproxy_dec_(c.y), acesproxy_dec_(c.z));
}`,
}
