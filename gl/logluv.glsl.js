// GLSL chunk: CIE XYZ D65 0-100 <-> LogLuv (Larson 1998, LibTIFF 32-bit SGILOG), unrounded:
// Le = 256·(log2(Y/100) + 64), ue = 410·u′, ve = 410·v′. Black and degenerate chromaticities
// take LibTIFF's neutral (4/19, 9/19); Le <= 0 decodes to black. Mirrors logluv.js.
import xyz from './xyz.glsl.js'
export default {
	name: 'logluv',
	deps: [xyz],
	edges: { xyz: ['xyz_logluv', 'logluv_xyz'] },
	code: /* glsl */ `
vec3 xyz_logluv(vec3 c) {
	float le = 0.0;
	if (c.y > 0.0) { le = max(0.0, 256.0 * (log2(c.y / 100.0) + 64.0)); }
	float s = c.x + 15.0 * c.y + 3.0 * c.z;
	if (le == 0.0 || s <= 0.0) { return vec3(le, 410.0 * (4.0 / 19.0), 410.0 * (9.0 / 19.0)); }
	return vec3(le, 410.0 * 4.0 * c.x / s, 410.0 * 9.0 * c.y / s);
}
vec3 logluv_xyz(vec3 c) {
	if (c.x <= 0.0 || c.z <= 0.0) { return vec3(0.0, 0.0, 0.0); }
	float y = 100.0 * exp2(c.x / 256.0 - 64.0);
	float u = c.y / 410.0; float v = c.z / 410.0;
	return vec3(y * 9.0 * u / (4.0 * v), y, y * (12.0 - 3.0 * u - 20.0 * v) / (4.0 * v));
}`,
}
