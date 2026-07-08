// GLSL chunk: ACEScc (log2 grading curve, no toe) <-> ACEScg (linear AP1). Mirrors acescc.js
// toLinear/fromLinear exactly (S-2014-003 bounds: eps = 2^-16, low = (9.72-15)/17.52).
export default {
	name: 'acescc',
	edges: { acescg: ['acescg_acescc', 'acescc_acescg'] },
	code: /* glsl */ `
float acescc_log_(float lin_) {
	if (lin_ <= 0.0) { return (log2(pow(2.0, -16.0)) + 9.72) / 17.52; }
	if (lin_ < pow(2.0, -16.0)) { return (log2(pow(2.0, -16.0) + lin_ * 0.5) + 9.72) / 17.52; }
	return (log2(lin_) + 9.72) / 17.52;
}
float acescc_lin_(float val) {
	if (val <= (9.72 - 15.0) / 17.52) { return (pow(2.0, val * 17.52 - 9.72) - pow(2.0, -16.0)) * 2.0; }
	if (val < 1.468) { return pow(2.0, val * 17.52 - 9.72); }
	return 65504.0;
}
vec3 acescg_acescc(vec3 c) {
	return vec3(acescc_log_(c.x), acescc_log_(c.y), acescc_log_(c.z));
}
vec3 acescc_acescg(vec3 c) {
	return vec3(acescc_lin_(c.x), acescc_lin_(c.y), acescc_lin_(c.z));
}`,
}
