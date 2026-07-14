// GLSL chunk: sRGB 0-255 <-> YUV (Y 0-1, U ±0.436, V ±0.615), BT.601 (PAL).
// Mirrors yuv.js rgb.yuv (forward, full-precision) / yuv.rgb (exact-inverse matrix).
export default {
	name: 'yuv',
	edges: { rgb: ['rgb_yuv', 'yuv_rgb'] },
	code: /* glsl */ `
vec3 rgb_yuv(vec3 c) {
	float r = c.x / 255.0; float g = c.y / 255.0; float b = c.z / 255.0;
	float y = 0.299 * r + 0.587 * g + 0.114 * b;
	float u = -0.147137697516930 * r - 0.288862302483070 * g + 0.436 * b;
	float v = 0.615 * r - 0.514985734664764 * g - 0.100014265335235 * b;
	return vec3(y, u, v);
}
vec3 yuv_rgb(vec3 c) {
	float y = c.x; float u = c.y; float v = c.z;
	float r = y + v * 1.139837398373984;
	float g = y + u * -0.394651704358970 + v * -0.580598606667498;
	float b = y + u * 2.032110091743120;
	return vec3(r * 255.0, g * 255.0, b * 255.0);
}`,
}
