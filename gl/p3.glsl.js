// GLSL chunk: Display P3 0-1 <-> linear-light Display P3 (p3-linear), sRGB transfer curve.
// Same sRGB OETF/EOTF as lrgb.js (IEC 61966-2-1); P3 differs only in primaries (p3-linear).
// Mirrors p3.js's composed-in-source display route (p3.rgb / rgb.p3): the linear P3 ⇄
// linear sRGB matrix pre-multiplies at module scope there; the constants here are that product.
import p3_linear from './p3-linear.glsl.js'
export default {
	name: 'p3',
	deps: [p3_linear],
	edges: { 'p3-linear': ['p3linear_p3', 'p3_p3linear'], rgb: ['rgb_p3', 'p3_rgb'] },
	code: /* glsl */ `
float p3_dec_(float u) {
	float a = abs(u);
	if (a > 0.04045) { return sign(u) * pow((a + 0.055) / 1.055, 2.4); }
	return u / 12.92;
}
float p3_enc_(float u) {
	float a = abs(u);
	if (a > 0.0031308) { return sign(u) * (1.055 * pow(a, 1.0 / 2.4) - 0.055); }
	return 12.92 * u;
}
vec3 p3linear_p3(vec3 c) {
	return vec3(p3_enc_(c.x), p3_enc_(c.y), p3_enc_(c.z));
}
vec3 p3_p3linear(vec3 c) {
	return vec3(p3_dec_(c.x), p3_dec_(c.y), p3_dec_(c.z));
}
vec3 p3_rgb(vec3 c) {
	float r = p3_dec_(c.x); float g = p3_dec_(c.y); float b = p3_dec_(c.z);
	return vec3(
		255.0 * p3_enc_(1.2249401762805956 * r - 0.22494017628055346 * g + 1.3877787807814457e-14 * b),
		255.0 * p3_enc_(-0.04205695470969867 * r + 1.0420569547096945 * g - 3.1086244689504383e-15 * b),
		255.0 * p3_enc_(-0.019637554590333024 * r - 0.07863604555062642 * g + 1.0982736001409672 * b));
}
vec3 rgb_p3(vec3 c) {
	float r = p3_dec_(c.x / 255.0); float g = p3_dec_(c.y / 255.0); float b = p3_dec_(c.z / 255.0);
	return vec3(
		p3_enc_(0.8224619687143393 * r + 0.17753803128562587 * g - 9.8901162808584e-15 * b),
		p3_enc_(0.03319419885096884 * r + 0.966805801149034 * g + 2.317067551969149e-15 * b),
		p3_enc_(0.017082630721118906 * r + 0.07239744066395784 * g + 0.9105199286149158 * b));
}`,
}
