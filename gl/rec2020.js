// GLSL chunk: Rec. 2020 0-1 <-> linear-light Rec. 2020 (rec2020-linear), BT.2020 OETF/EOTF.
// Same piecewise curve shape as Rec. 709 but with BT.2020's full-precision constants
// (Table 4); mirrors transfers.js bt2020Encode/bt2020Decode used by rec2020.js.
export default {
	name: 'rec2020',
	edges: { 'rec2020-linear': ['rec2020linear_rec2020', 'rec2020_rec2020linear'] },
	code: `
float rec2020_enc_(float u) {
	float a = abs(u);
	float A = 1.09929682680944;
	if (a < 0.018053968510807) { return sign(u) * (4.5 * a); }
	return sign(u) * (A * pow(a, 0.45) - (A - 1.0));
}
float rec2020_dec_(float u) {
	float a = abs(u);
	float A = 1.09929682680944;
	if (a < 0.018053968510807 * 4.5) { return sign(u) * (a / 4.5); }
	return sign(u) * pow((a + (A - 1.0)) / A, 1.0 / 0.45);
}
vec3 rec2020linear_rec2020(vec3 c) {
	return vec3(rec2020_enc_(c.x), rec2020_enc_(c.y), rec2020_enc_(c.z));
}
vec3 rec2020_rec2020linear(vec3 c) {
	return vec3(rec2020_dec_(c.x), rec2020_dec_(c.y), rec2020_dec_(c.z));
}`,
}
