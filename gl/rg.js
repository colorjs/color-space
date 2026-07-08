// GLSL chunk: sRGB 0-255 <-> rg chromaticity (r+g+b normalized to 1, blue implicit).
// Mirrors rg.js.
export default {
	name: 'rg',
	dim: 2,
	edges: { rgb: ['rgb_rg', 'rg_rgb'] },
	code: `
vec2 rgb_rg(vec3 c) {
	float r = c.x / 255.0; float g = c.y / 255.0; float b = c.z / 255.0;
	float sum = r + g + b;
	if (sum == 0.0) { return vec2(1.0 / 3.0, 1.0 / 3.0); }   // achromatic: the neutral point, not the blue corner
	return vec2(r / sum, g / sum);
}
vec3 rg_rgb(vec2 c) {
	float r = c.x; float g = c.y; float b = 1.0 - r - g;
	float mx = max(r, max(g, b));
	if (mx == 0.0) { return vec3(0.0, 0.0, 0.0); }
	return vec3(r / mx * 255.0, g / mx * 255.0, b / mx * 255.0);
}`,
}
