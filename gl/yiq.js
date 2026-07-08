// GLSL chunk: sRGB 0-255 <-> YIQ (Y 0-1, I ±0.5957, Q ±0.5226), FCC 1953 NTSC.
// Mirrors yiq.js rgb.yiq (forward) / yiq.rgb (exact-inverse matrix).
export default {
	name: 'yiq',
	edges: { rgb: ['rgb_yiq', 'yiq_rgb'] },
	code: `
vec3 rgb_yiq(vec3 c) {
	float r = c.x / 255.0; float g = c.y / 255.0; float b = c.z / 255.0;
	float y = 0.299 * r + 0.587 * g + 0.114 * b;
	float i = 0.595716 * r - 0.274453 * g - 0.321263 * b;
	float q = 0.211456 * r - 0.522591 * g + 0.311135 * b;
	return vec3(y, i, q);
}
vec3 yiq_rgb(vec3 c) {
	float y = c.x; float i = c.y; float q = c.z;
	float r = y + i * 0.9562957197589483 + q * 0.6210244164652611;
	float g = y + i * -0.27212209931851045 + q * -0.647380596825695;
	float b = y + i * -1.1069890167364902 + q * 1.7046149983646481;
	r = clamp(r, 0.0, 1.0);
	g = clamp(g, 0.0, 1.0);
	b = clamp(b, 0.0, 1.0);
	return vec3(r * 255.0, g * 255.0, b * 255.0);
}`,
}
