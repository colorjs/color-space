// GLSL chunk: sRGB 0-255 <-> CMYK 0-100 (K = min undercolor, guarded against the
// 0/0 that JS's `|| 0` catches at full black). Mirrors cmyk.js.
export default {
	name: 'cmyk',
	dim: 4,
	edges: { rgb: ['rgb_cmyk', 'cmyk_rgb'] },
	code: /* glsl */ `
vec4 rgb_cmyk(vec3 c) {
	float r = c.x / 255.0; float g = c.y / 255.0; float b = c.z / 255.0;
	float k = min(1.0 - r, min(1.0 - g, 1.0 - b));
	float cc = 0.0; float m = 0.0; float y = 0.0;
	if (k < 1.0) {
		cc = (1.0 - r - k) / (1.0 - k);
		m = (1.0 - g - k) / (1.0 - k);
		y = (1.0 - b - k) / (1.0 - k);
	}
	return vec4(cc * 100.0, m * 100.0, y * 100.0, k * 100.0);
}
vec3 cmyk_rgb(vec4 c) {
	float cc = c.x / 100.0; float m = c.y / 100.0; float y = c.z / 100.0; float k = c.w / 100.0;
	return vec3(
		(1.0 - min(1.0, cc * (1.0 - k) + k)) * 255.0,
		(1.0 - min(1.0, m * (1.0 - k) + k)) * 255.0,
		(1.0 - min(1.0, y * (1.0 - k) + k)) * 255.0);
}`,
}
