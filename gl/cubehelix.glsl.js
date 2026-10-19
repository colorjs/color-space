// GLSL chunk: sRGB 0-255 <-> Cubehelix (H 0-360, S 0-4.6144, L 0-1). Mirrors cubehelix.js:
// Green 2011 eq. 2 forward, d3-color's cubehelixConvert inverse; E·D, E·B and B·C − D·A
// printed from cubehelix.js. Grays (and l = 0 or 1 off the gray axis) return H = S = 0.
export default {
	name: 'cubehelix',
	edges: { rgb: ['rgb_cubehelix', 'cubehelix_rgb'] },
	code: /* glsl */ `
vec3 rgb_cubehelix(vec3 c) {
	float r = c.x / 255.0; float g = c.y / 255.0; float b = c.z / 255.0;
	if (r == g && g == b) { return vec3(0.0, 0.0, r); }
	float l = (-0.6557636667999999 * b + -1.7884503806 * r - 3.5172982438 * g) / -5.9615122912;
	float x = b - l;
	float y = (1.97294 * (g - l) + 0.29227 * x) / -0.90649;
	float k = 1.97294 * l * (1.0 - l);
	if (k == 0.0) { return vec3(0.0, 0.0, l); }
	float s = sqrt(x * x + y * y) / k;
	if (s == 0.0) { return vec3(0.0, 0.0, l); }
	float h = atan2_(y, x) * 57.29577951308232 - 120.0;
	if (h < 0.0) { h = h + 360.0; }
	return vec3(h, s, l);
}
vec3 cubehelix_rgb(vec3 c) {
	float t = (c.x + 120.0) * 0.017453292519943295;
	float l = c.z;
	float a = c.y * l * (1.0 - l);
	float co = cos(t); float si = sin(t);
	return vec3(
		255.0 * (l + a * (-0.14861 * co + 1.78277 * si)),
		255.0 * (l + a * (-0.29227 * co - 0.90649 * si)),
		255.0 * (l + a * (1.97294 * co)));
}`,
}
