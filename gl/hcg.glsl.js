// GLSL chunk: sRGB 0-255 <-> HCG (H 0-360, C/G 0-100). Mirrors hcg.js.
export default {
	name: 'hcg',
	edges: { rgb: ['rgb_hcg', 'hcg_rgb'] },
	code: /* glsl */ `
vec3 rgb_hcg(vec3 c) {
	float r = c.x / 255.0; float g = c.y / 255.0; float b = c.z / 255.0;
	float mx = max(max(r, g), b); float mn = min(min(r, g), b);
	float chroma = mx - mn;
	float grayscale = 0.0;
	if (chroma < 1.0) { grayscale = mn / (1.0 - chroma); }
	float hue = 0.0;
	if (chroma > 0.0) {
		if (mx == r) { hue = mod_((g - b) / chroma, 6.0); }
		else if (mx == g) { hue = 2.0 + (b - r) / chroma; }
		else { hue = 4.0 + (r - g) / chroma; }
		hue = mod_(hue / 6.0, 1.0);
	}
	return vec3(hue * 360.0, chroma * 100.0, grayscale * 100.0);
}
vec3 hcg_rgb(vec3 c) {
	float h = c.x / 360.0; float ch = c.y / 100.0; float gy = c.z / 100.0;
	if (ch == 0.0) { return vec3(gy * 255.0, gy * 255.0, gy * 255.0); }
	float hi = mod_(h, 1.0) * 6.0;
	float v = fract(hi);
	float w = 1.0 - v;
	float fh = floor(hi);
	float p0 = 0.0; float p1 = 0.0; float p2 = 0.0;
	if (fh < 0.5) { p0 = 1.0; p1 = v; p2 = 0.0; }
	else if (fh < 1.5) { p0 = w; p1 = 1.0; p2 = 0.0; }
	else if (fh < 2.5) { p0 = 0.0; p1 = 1.0; p2 = v; }
	else if (fh < 3.5) { p0 = 0.0; p1 = w; p2 = 1.0; }
	else if (fh < 4.5) { p0 = v; p1 = 0.0; p2 = 1.0; }
	else { p0 = 1.0; p1 = 0.0; p2 = w; }
	float mg = (1.0 - ch) * gy;
	return vec3((ch * p0 + mg) * 255.0, (ch * p1 + mg) * 255.0, (ch * p2 + mg) * 255.0);
}`,
}
