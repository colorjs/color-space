// GLSL chunk: sRGB 0-255 <-> CMY 0-100 (simple subtractive complement). Mirrors cmy.js.
export default {
	name: 'cmy',
	edges: { rgb: ['rgb_cmy', 'cmy_rgb'] },
	code: `
vec3 rgb_cmy(vec3 c) {
	return vec3(
		(1.0 - c.x / 255.0) * 100.0,
		(1.0 - c.y / 255.0) * 100.0,
		(1.0 - c.z / 255.0) * 100.0);
}
vec3 cmy_rgb(vec3 c) {
	return vec3(
		(100.0 - c.x) / 100.0 * 255.0,
		(100.0 - c.y) / 100.0 * 255.0,
		(100.0 - c.z) / 100.0 * 255.0);
}`,
}
