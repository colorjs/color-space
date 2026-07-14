// GLSL chunk: CCT + Duv <-> CIE XYZ D65 0-100. CCT is the nearest point on
// Krystek's CIE 1960 uv Planckian locus; Duv is signed distance along its oriented
// normal (positive above/green). The coordinate is chromaticity-only; inverse Y=100.
import xyz from './xyz.glsl.js'
import kelvin from './kelvin.glsl.js'
export default {
	name: 'cct-duv',
	deps: [xyz, kelvin],
	requires: ['kelvin'],
	dim: 2,
	edges: { xyz: ['xyz_cctduv', 'cctduv_xyz'] },
	code: /* glsl */ `
vec2 cctduv_normal_(float t) {
	float tc = clamp(t, 1000.0, 25000.0);
	float dt = max(0.01, tc * 1e-5);
	float lo = max(1000.0, tc - dt);
	float hi = min(25000.0, tc + dt);
	float du = kelvin_u(hi) - kelvin_u(lo);
	float dv = kelvin_v(hi) - kelvin_v(lo);
	float n = sqrt(du * du + dv * dv);
	return vec2(dv / n, -du / n);
}
vec3 cctduv_xyz(vec2 c) {
	float t = clamp(c.x, 1000.0, 25000.0);
	vec2 normal = cctduv_normal_(t);
	float u = kelvin_u(t) + c.y * normal.x;
	float v = kelvin_v(t) + c.y * normal.y;
	if (v == 0.0) { return vec3(0.0, 0.0, 0.0); }
	float d = 2.0 * u - 8.0 * v + 4.0;
	float x = 3.0 * u / d;
	float y = 2.0 * v / d;
	return vec3(x * 100.0 / y, 100.0, (1.0 - x - y) * 100.0 / y);
}
vec2 xyz_cctduv(vec3 c) {
	float d = c.x + 15.0 * c.y + 3.0 * c.z;
	if (d == 0.0) { return vec2(6504.0, 0.0); }
	float u = 4.0 * c.x / d;
	float v = 6.0 * c.y / d;
	float t = xyz_kelvin(c);
	vec2 normal = cctduv_normal_(t);
	float du = u - kelvin_u(t);
	float dv = v - kelvin_v(t);
	return vec2(t, du * normal.x + dv * normal.y);
}`,
}
