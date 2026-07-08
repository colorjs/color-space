// GLSL chunk: sRGB 0-255 <-> linear-light sRGB 0-1 (IEC 61966-2-1, sign-extended).
// Mirrors transfers.js srgbToLinear/linearToSrgb and lrgb.js scaling.
export default {
	name: 'lrgb',
	edges: { rgb: ['rgb_lrgb', 'lrgb_rgb'] },
	code: `
float lrgb_dec_(float u) {
	float a = abs(u);
	if (a > 0.04045) { return sign(u) * pow((a + 0.055) / 1.055, 2.4); }
	return u / 12.92;
}
float lrgb_enc_(float u) {
	float a = abs(u);
	if (a > 0.0031308) { return sign(u) * (1.055 * pow(a, 1.0 / 2.4) - 0.055); }
	return 12.92 * u;
}
vec3 rgb_lrgb(vec3 c) {
	return vec3(lrgb_dec_(c.x / 255.0), lrgb_dec_(c.y / 255.0), lrgb_dec_(c.z / 255.0));
}
vec3 lrgb_rgb(vec3 c) {
	return vec3(255.0 * lrgb_enc_(c.x), 255.0 * lrgb_enc_(c.y), 255.0 * lrgb_enc_(c.z));
}`,
}
