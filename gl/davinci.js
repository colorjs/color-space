// GLSL chunk: DaVinci Wide Gamut / DaVinci Intermediate <-> CIE XYZ D65 0-100.
// Linear segment below LIN_CUT, log2 segment above. Mirrors davinci.js enc/dec
// (whitepaper constants A, B, C, M, LIN_CUT, LOG_CUT) and its exact MX/MXI matrices.
export default {
	name: 'davinci',
	edges: { xyz: ['xyz_davinci', 'davinci_xyz'] },
	code: `
float davinci_enc_(float x) {
	if (x <= 0.00262409) { return x * 10.44426855; }
	return 0.07329248 * (log2(x + 0.0075) + 7.0);
}
float davinci_dec_(float v) {
	if (v <= 0.02740668) { return v / 10.44426855; }
	return pow(2.0, v / 0.07329248 - 7.0) - 0.0075;
}
vec3 davinci_xyz(vec3 c) {
	float r = davinci_dec_(c.x); float g = davinci_dec_(c.y); float b = davinci_dec_(c.z);
	return vec3(
		100.0 * (0.70062239 * r + 0.14877482 * g + 0.10105872 * b),
		100.0 * (0.27411851 * r + 0.87363190 * g - 0.14775041 * b),
		100.0 * (-0.09896291 * r - 0.13789533 * g + 1.32591599 * b));
}
vec3 xyz_davinci(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.51667204 * x - 0.28147805 * y - 0.14696363 * z;
	float g = -0.46491710 * x + 1.25142378 * y + 0.17488461 * z;
	float b = 0.06484905 * x + 0.10913934 * y + 0.76141462 * z;
	return vec3(davinci_enc_(r), davinci_enc_(g), davinci_enc_(b));
}`,
}
