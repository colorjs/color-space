// GLSL chunk: sRGB 0-255 <-> YDbDr (Y 0-1, Db/Dr ±1.333), SECAM.
// Mirrors ydbdr.js rgb.ydbdr / ydbdr.rgb — its own native BT.601-derived matrix
// (the simpler yuv.ydbdr rescaling is a secondary link, not the primitive one).
export default {
	name: 'ydbdr',
	edges: { rgb: ['rgb_ydbdr', 'ydbdr_rgb'] },
	code: /* glsl */ `
vec3 rgb_ydbdr(vec3 c) {
	float r = c.x / 255.0; float g = c.y / 255.0; float b = c.z / 255.0;
	float y = 0.299 * r + 0.587 * g + 0.114 * b;
	float db = -0.450 * r - 0.883 * g + 1.333 * b;
	float dr = -1.333 * r + 1.116 * g + 0.217 * b;
	return vec3(y, db, dr);
}
vec3 ydbdr_rgb(vec3 c) {
	float y = c.x; float db = c.y; float dr = c.z;
	float r = y + 0.000092303716148 * db - 0.525912630661865 * dr;
	float g = y - 0.129132898890509 * db + 0.267899328207599 * dr;
	float b = y + 0.664679059978955 * db - 0.000079202543533 * dr;
	return vec3(r * 255.0, g * 255.0, b * 255.0);
}`,
}
