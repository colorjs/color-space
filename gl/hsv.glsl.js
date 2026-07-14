// GLSL chunk: sRGB 0-255 <-> HSV (H 0-360, S/V 0-100). Mirrors hsv.js.
export default {
	name: 'hsv',
	edges: { rgb: ['rgb_hsv', 'hsv_rgb'] },
	code: /* glsl */ `
vec3 rgb_hsv(vec3 c) {
	float r = c.x / 255.0; float g = c.y / 255.0; float b = c.z / 255.0;
	float mn = min(r, min(g, b));
	float mx = max(r, max(g, b));
	float d = mx - mn;
	float s = 0.0;
	if (mx != 0.0) { s = d / mx; }
	float h = 0.0;
	if (mx == mn) { h = 0.0; }
	else if (r == mx) { h = (g - b) / d; }
	else if (g == mx) { h = 2.0 + (b - r) / d; }
	else { h = 4.0 + (r - g) / d; }
	h = min(h / 6.0, 1.0);
	if (h < 0.0) { h = h + 1.0; }
	return vec3(h * 360.0, s * 100.0, mx * 100.0);
}
vec3 hsv_rgb(vec3 c) {
	float h = (c.x / 360.0) * 6.0; float s = c.y / 100.0; float v = c.z / 100.0;
	float hi = mod_(floor(h), 6.0);
	float f = h - floor(h);
	float p = v * (1.0 - s);
	float q = v * (1.0 - s * f);
	float t = v * (1.0 - s * (1.0 - f));
	float r = v; float g = t; float b = p;
	if (hi < 0.5) { r = v; g = t; b = p; }
	else if (hi < 1.5) { r = q; g = v; b = p; }
	else if (hi < 2.5) { r = p; g = v; b = t; }
	else if (hi < 3.5) { r = p; g = q; b = v; }
	else if (hi < 4.5) { r = t; g = p; b = v; }
	else { r = v; g = p; b = q; }
	return vec3(r * 255.0, g * 255.0, b * 255.0);
}`,
}
