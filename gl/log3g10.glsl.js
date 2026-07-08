// GLSL chunk: Log3G10 (RED whitepaper 915-0187 Rev-C) <-> CIE XYZ D65 0-100.
// Matrix is REDWideGamutRGB linear -> XYZ; mirrors log3g10.js decode/encode and M/inv3(M)
// (same literals as wasm/batch.js log3g10_xyz / xyz_log3g10).
export default {
	name: 'log3g10',
	edges: { xyz: ['xyz_log3g10', 'log3g10_xyz'] },
	code: /* glsl */ `
float log3g10_dec_(float v) {
	if (v >= 0.0) { return (pow(10.0, v / 0.224282) - 1.0) / 155.975327 - 0.01; }
	return v / 15.1927 - 0.01;
}
float log3g10_enc_(float l) {
	float x = l + 0.01;
	if (x < 0.0) { return x * 15.1927; }
	return 0.224282 * (log(x * 155.975327 + 1.0) / log(10.0));
}
vec3 log3g10_xyz(vec3 c) {
	float r = log3g10_dec_(c.x); float g = log3g10_dec_(c.y); float b = log3g10_dec_(c.z);
	return vec3(
		100.0 * (0.7352752459058587 * r + 0.068609410613961 * g + 0.146571270531852 * b),
		100.0 * (0.2866940994999349 * r + 0.8429791340169754 * g - 0.1296732335169103 * b),
		100.0 * (-0.0796808568783677 * r - 0.3473432169944297 * g + 1.5160818246326759 * b));
}
vec3 xyz_log3g10(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.4128064803693583 * x - 0.17752320098966512 * y - 0.15177073202874272 * z;
	float g = -0.48620327686049064 * x + 1.2906964267981604 * y + 0.15740061472978117 * z;
	float b = -0.037139010852832395 * x + 0.28637599977945394 * y + 0.6876797788619603 * z;
	return vec3(log3g10_enc_(r), log3g10_enc_(g), log3g10_enc_(b));
}`,
}
