// GLSL chunk: CIE XYZ D65 0-100 <-> CIE 1964 U*V*W*. Mirrors uvw.js baked to its
// defaults (illuminant D65, 2° observer): un,vn are the D65 2° CIE 1960 uv
// chromaticity (from xyz.js whitepoint[2].D65), precomputed since GL edges carry
// no illuminant param. d===0 / w===0 branches guard the achromatic axis exactly
// as the JS does (U*=V*=0 there); y=((w+17)/25)^3 is cubed by multiplication
// (never pow) so it stays defined for the whole W* range including negative w.
import xyz from './xyz.glsl.js'
export default {
	name: 'uvw',
	deps: [xyz],
	edges: { xyz: ['xyz_uvw', 'uvw_xyz'] },
	code: /* glsl */ `
vec3 xyz_uvw(vec3 c) {
	float x = c.x; float y = c.y; float z = c.z;
	float un = 0.1978300066428368; float vn = 0.312213329959194;
	float d = x + 15.0 * y + 3.0 * z;
	float u = un; float v = vn;
	if (d != 0.0) { u = 4.0 * x / d; v = 6.0 * y / d; }
	float w = 25.0 * cbrt_(y) - 17.0;
	return vec3(13.0 * w * (u - un), 13.0 * w * (v - vn), w);
}
vec3 uvw_xyz(vec3 c) {
	float U = c.x; float V = c.y; float w = c.z;
	float un = 0.1978300066428368; float vn = 0.312213329959194;
	float t = (w + 17.0) / 25.0;
	float y = t * t * t;
	float u = un; float v = vn;
	if (w != 0.0) { u = U / (13.0 * w) + un; v = V / (13.0 * w) + vn; }
	float x = 1.5 * y * u / v;
	float z = y * (2.0 / v - 0.5 * u / v - 5.0);
	return vec3(x, y, z);
}`,
}
