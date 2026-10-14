// GLSL chunk: Rec. 2020 Linear 0-1 <-> Rec. 2100 HLG signal 0-1 — Hybrid Log-Gamma
// (BBC/NHK), scaled so signal 0.75 (diffuse white) maps to scene-linear 1.0.
// Mirrors transfers.js hlgEncode/hlgDecode (sign-extended); scale = 12/(exp((0.75-c)/a)+b).
import rec2020_linear from './rec2020-linear.glsl.js'
export default {
	name: 'rec2100-hlg',
	deps: [rec2020_linear],
	edges: { 'rec2020-linear': ['rec2020linear_rec2100hlg', 'rec2100hlg_rec2020linear'] },
	code: /* glsl */ `
float rec2100hlg_to_linear_(float val) {
	float p = abs(val);
	if (p <= 0.5) { return sign(val) * 3.774118127505075 * (p * p / 3.0); }
	return sign(val) * 3.774118127505075 * ((exp((p - 0.55991073) / 0.17883277) + 0.28466892) / 12.0);
}
float rec2100hlg_from_linear_(float val) {
	float e = abs(val) / 3.774118127505075;
	if (e <= 1.0 / 12.0) { return sign(val) * sqrt(3.0 * e); }
	return sign(val) * (0.17883277 * log(12.0 * e - 0.28466892) + 0.55991073);
}
vec3 rec2020linear_rec2100hlg(vec3 c) {
	return vec3(rec2100hlg_from_linear_(c.x), rec2100hlg_from_linear_(c.y), rec2100hlg_from_linear_(c.z));
}
vec3 rec2100hlg_rec2020linear(vec3 c) {
	return vec3(rec2100hlg_to_linear_(c.x), rec2100hlg_to_linear_(c.y), rec2100hlg_to_linear_(c.z));
}`,
}
