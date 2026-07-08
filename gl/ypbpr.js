// GLSL chunk: sRGB 0-255 <-> YPbPr (Y 0-1, Pb/Pr ±0.5), ITU-R BT.709 weights.
// Mirrors ypbpr.js rgb.ypbpr / ypbpr.rgb with their default kb/kr (0.0722/0.2126,
// BT.709) — chunk edges take no extra params, so the default coefficients are baked in.
export default {
	name: 'ypbpr',
	edges: { rgb: ['rgb_ypbpr', 'ypbpr_rgb'] },
	code: `
vec3 rgb_ypbpr(vec3 c) {
	float r = c.x / 255.0; float g = c.y / 255.0; float b = c.z / 255.0;
	float kb = 0.0722; float kr = 0.2126;
	float y = kr * r + (1.0 - kr - kb) * g + kb * b;
	float pb = 0.5 * (b - y) / (1.0 - kb);
	float pr = 0.5 * (r - y) / (1.0 - kr);
	return vec3(y, pb, pr);
}
vec3 ypbpr_rgb(vec3 c) {
	float y = c.x; float pb = c.y; float pr = c.z;
	float kb = 0.0722; float kr = 0.2126;
	float r = y + 2.0 * pr * (1.0 - kr);
	float b = y + 2.0 * pb * (1.0 - kb);
	float g = (y - kr * r - kb * b) / (1.0 - kr - kb);
	return vec3(r * 255.0, g * 255.0, b * 255.0);
}`,
}
