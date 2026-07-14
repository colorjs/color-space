// GLSL chunk: linear sRGB 0-1 <-> gray (relative luminance Y, 0-1). Same sRGB/D65
// Y-row coefficients as xyz.js's lrgb_xyz, applied directly (not through xyz/100).
// Mirrors gray.js.
import lrgb from './lrgb.glsl.js'
export default {
	name: 'gray',
	deps: [lrgb],
	dim: 1,
	edges: { lrgb: ['lrgb_gray', 'gray_lrgb'] },
	code: /* glsl */ `
float lrgb_gray(vec3 c) {
	return 0.21263900587151 * c.x + 0.71516867876775 * c.y + 0.072192315360733 * c.z;
}
vec3 gray_lrgb(float c) {
	return vec3(c, c, c);
}`,
}
