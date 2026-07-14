// GLSL chunk: sRGB 0-255 <-> HSL (H 0-360, S/L 0-100). Mirrors hsl.js.
export default {
	name: 'hsl',
	edges: { rgb: ['rgb_hsl', 'hsl_rgb'] },
	code: /* glsl */ `
float hsl_hue_(float t1, float t2, float h) {
	float t = h;
	if (t < 0.0) { t = t + 1.0; }
	if (t > 1.0) { t = t - 1.0; }
	if (6.0 * t < 1.0) { return t1 + (t2 - t1) * 6.0 * t; }
	if (2.0 * t < 1.0) { return t2; }
	if (3.0 * t < 2.0) { return t1 + (t2 - t1) * (2.0 / 3.0 - t) * 6.0; }
	return t1;
}
vec3 rgb_hsl(vec3 c) {
	float r = c.x / 255.0; float g = c.y / 255.0; float b = c.z / 255.0;
	float mn = min(r, min(g, b));
	float mx = max(r, max(g, b));
	float d = mx - mn;
	float h = 0.0;
	if (d > 0.0) {
		if (r == mx) { h = (g - b) / d; }
		else if (g == mx) { h = 2.0 + (b - r) / d; }
		else { h = 4.0 + (r - g) / d; }
	}
	h = min(h / 6.0, 1.0);
	if (h < 0.0) { h = h + 1.0; }
	float l = (mn + mx) / 2.0;
	float s = 0.0;
	if (d > 0.0) {
		if (l <= 0.5) { s = d / (mx + mn); }
		else { s = d / (2.0 - mx - mn); }
	}
	return vec3(h * 360.0, s * 100.0, l * 100.0);
}
vec3 hsl_rgb(vec3 c) {
	float h = c.x / 360.0; float s = c.y / 100.0; float l = c.z / 100.0;
	if (s == 0.0) { float v = l * 255.0; return vec3(v, v, v); }
	float t2 = l + s - l * s;
	if (l < 0.5) { t2 = l * (1.0 + s); }
	float t1 = 2.0 * l - t2;
	return vec3(
		255.0 * hsl_hue_(t1, t2, h + 1.0 / 3.0),
		255.0 * hsl_hue_(t1, t2, h),
		255.0 * hsl_hue_(t1, t2, h - 1.0 / 3.0));
}`,
}
