// GLSL chunk: ACEScct (log2 grading curve with a linear toe near black) <-> ACEScg (linear AP1).
// Mirrors acescct.js encode/decode exactly (ACES spec S-2016-001).
export default {
	name: 'acescct',
	edges: { acescg: ['acescg_acescct', 'acescct_acescg'] },
	code: `
float acescct_encode_(float lin_) {
	if (lin_ <= 0.0078125) { return 10.5402377416545 * lin_ + 0.0729055341958355; }
	return (log2(lin_) + 9.72) / 17.52;
}
float acescct_decode_(float cct) {
	if (cct <= 0.155251141552511) { return (cct - 0.0729055341958355) / 10.5402377416545; }
	return pow(2.0, cct * 17.52 - 9.72);
}
vec3 acescg_acescct(vec3 c) {
	return vec3(acescct_encode_(c.x), acescct_encode_(c.y), acescct_encode_(c.z));
}
vec3 acescct_acescg(vec3 c) {
	return vec3(acescct_decode_(c.x), acescct_decode_(c.y), acescct_decode_(c.z));
}`,
}
