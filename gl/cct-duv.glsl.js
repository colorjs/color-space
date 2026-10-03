// GLSL chunk: CCT + Duv <-> CIE XYZ D65 0-100. CCT is the nearest point on
// Krystek's CIE 1960 uv Planckian locus; Duv is signed distance along its oriented
// normal (positive above/green). The coordinate is chromaticity-only; inverse Y=100.
// GPU float32: the normal is kelvin.js's planckianNormal secant over [T-dt, T+dt], but
// written cancellation-free. For u = N/D with quadratic N, D, the difference
// N(hi)D(lo) - N(lo)D(hi) = (hi - lo)·(P + Q(hi + lo) + R·hi·lo) exactly, with P = a1 - a0 b1,
// Q = a2 - a0 b2, R = a2 b1 - a1 b2 from Krystek's coefficients (computed once in float64,
// pasted below); the common (hi - lo) cancels in the normalization. Subtracting two u(T)
// or v(T) 10-250 mK apart leaves float32 only ~2-110 ulps of signal (2 at 25000 K), so the
// normal tilted (lavapipe: Duv at #0000ff -0.0090 vs -0.0283); the closed form agrees with
// the float64 secant to ~2e-8 and holds in float32.
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
	float s = hi + lo;
	float p = hi * lo;
	float du = (-5.7046234897961288e-4 - 4.8044701722995936e-7 * s - 7.6813605638058946e-13 * p)
		/ ((1.0 + 8.42420235e-4 * hi + 7.08145163e-7 * hi * hi) * (1.0 + 8.42420235e-4 * lo + 7.08145163e-7 * lo * lo));
	float dv = (5.1476992826732644e-5 - 9.1977764271884827e-9 * s - 8.0447740375960068e-12 * p)
		/ ((1.0 - 2.89741816e-5 * hi + 1.61456053e-7 * hi * hi) * (1.0 - 2.89741816e-5 * lo + 1.61456053e-7 * lo * lo));
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
