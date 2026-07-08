// GLSL chunk: sRGB 0-255 <-> JPEG full-range YCbCr 0-255 (ITU-T T.871). Mirrors jpeg.js.
export default {
	name: 'jpeg',
	edges: { rgb: ['rgb_jpeg', 'jpeg_rgb'] },
	code: /* glsl */ `
vec3 rgb_jpeg(vec3 c) {
	float r = c.x / 255.0; float g = c.y / 255.0; float b = c.z / 255.0;
	float center = 128.0 / 255.0;
	return vec3(
		(0.299 * r + 0.587 * g + 0.114 * b) * 255.0,
		(center - 0.168736 * r - 0.331264 * g + 0.5 * b) * 255.0,
		(center + 0.5 * r - 0.418688 * g - 0.081312 * b) * 255.0);
}
vec3 jpeg_rgb(vec3 c) {
	float y = c.x / 255.0; float cb = c.y / 255.0; float cr = c.z / 255.0;
	float center = 128.0 / 255.0;
	return vec3(
		(y + 1.402 * (cr - center)) * 255.0,
		(y - 0.34414 * (cb - center) - 0.71414 * (cr - center)) * 255.0,
		(y + 1.772 * (cb - center)) * 255.0);
}`,
}
