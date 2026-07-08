// GLSL chunk: sRGB 0-255 <-> HWB (H 0-360, W/B 0-100). Mirrors hwb.js (Alvy Ray Smith).
export default {
	name: 'hwb',
	edges: { rgb: ['rgb_hwb', 'hwb_rgb'] },
	code: /* glsl */ `
vec3 rgb_hwb(vec3 c) {
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
	return vec3(h * 360.0, mn * 100.0, (1.0 - mx) * 100.0);
}
vec3 hwb_rgb(vec3 c) {
	float h = c.x / 360.0; float wh = c.y / 100.0; float bl = c.z / 100.0;
	float ratio = wh + bl;
	if (ratio > 1.0) {
		wh = wh / ratio;
		bl = bl / ratio;
	}
	float i = floor(6.0 * h);
	float v = 1.0 - bl;
	float f = 6.0 * h - i;
	if (mod_(i, 2.0) > 0.5) { f = 1.0 - f; }
	float n = wh + f * (v - wh);
	float r = 0.0; float g = 0.0; float b = 0.0;
	if (i > 0.5 && i < 1.5) { r = n; g = v; b = wh; }
	else if (i > 1.5 && i < 2.5) { r = wh; g = v; b = n; }
	else if (i > 2.5 && i < 3.5) { r = wh; g = n; b = v; }
	else if (i > 3.5 && i < 4.5) { r = n; g = wh; b = v; }
	else if (i > 4.5 && i < 5.5) { r = v; g = wh; b = n; }
	else { r = v; g = n; b = wh; }
	return vec3(r * 255.0, g * 255.0, b * 255.0);
}`,
}
