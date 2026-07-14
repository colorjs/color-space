// GLSL chunk: sRGB 0-255 <-> YCgCo (Y 0-1, Cg/Co ±0.5), Malvar & Sullivan 2003.
// Mirrors ycgco.js rgb.ycgco / ycgco.rgb (exact lifting-style inverse).
export default {
	name: 'ycgco',
	edges: { rgb: ['rgb_ycgco', 'ycgco_rgb'] },
	code: /* glsl */ `
vec3 rgb_ycgco(vec3 c) {
	float r = c.x / 255.0; float g = c.y / 255.0; float b = c.z / 255.0;
	return vec3(
		0.25 * r + 0.5 * g + 0.25 * b,
		-0.25 * r + 0.5 * g - 0.25 * b,
		0.5 * r - 0.5 * b);
}
vec3 ycgco_rgb(vec3 c) {
	float y = c.x; float cg = c.y; float co = c.z;
	float tmp = y - cg;
	return vec3((tmp + co) * 255.0, (y + cg) * 255.0, (tmp - co) * 255.0);
}`,
}
