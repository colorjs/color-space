// GLSL chunk: correlated color temperature (CCT, 1000-25000 K) <-> CIE XYZ D65 0-100.
// Forward: Krystek (1985) rational approximation of the Planckian locus (CCT -> uv ->
// xy). Inverse: nearest point on that locus in CIE 1960 uv (the CCT definition) —
// geometric scan + fixed-count golden-section; exact on the locus, lossy off it.
// Mirrors kelvin.js kelvin.xyz / xyz.kelvin.
import xyz from './xyz.glsl.js'
export default {
	name: 'kelvin',
	deps: [xyz],
	dim: 1,
	edges: { xyz: ['xyz_kelvin', 'kelvin_xyz'] },
	code: /* glsl */ `
float kelvin_u(float t) {
	return (0.860117757 + 1.54118254e-4 * t + 1.28641212e-7 * t * t) / (1.0 + 8.42420235e-4 * t + 7.08145163e-7 * t * t);
}
float kelvin_v(float t) {
	return (0.317398726 + 4.22806245e-5 * t + 4.20481691e-8 * t * t) / (1.0 - 2.89741816e-5 * t + 1.61456053e-7 * t * t);
}
float kelvin_dist(float t, float u0, float v0) {
	float du = kelvin_u(t) - u0;
	float dv = kelvin_v(t) - v0;
	return du * du + dv * dv;
}
vec3 kelvin_xyz(float c) {
	float t = c;
	if (t < 1000.0) { t = 1000.0; }
	if (t > 25000.0) { t = 25000.0; }
	float u = kelvin_u(t);
	float v = kelvin_v(t);
	float d = 2.0 * u - 8.0 * v + 4.0;
	float x = 3.0 * u / d;
	float y = 2.0 * v / d;
	return vec3(x * 100.0 / y, 100.0, (1.0 - x - y) * 100.0 / y);
}
float xyz_kelvin(vec3 c) {
	float s = c.x + c.y + c.z;
	if (s == 0.0) { return 6504.0; }
	float x = c.x / s;
	float y = c.y / s;
	float d = -2.0 * x + 12.0 * y + 3.0;
	float u0 = 4.0 * x / d;
	float v0 = 6.0 * y / d;
	float r = pow(25.0, 1.0 / 32.0);
	float T = 1000.0;
	float bT = 1000.0;
	float bf = 1e30;
	for (int i = 0; i <= 32; i++) {
		float fi = kelvin_dist(T, u0, v0);
		if (fi < bf) { bf = fi; bT = T; }
		T = T * r;
	}
	float lo = bT / r;
	float hi = bT * r;
	if (lo < 1000.0) { lo = 1000.0; }
	if (hi > 25000.0) { hi = 25000.0; }
	float gr = 0.6180339887498949;
	float a = hi - gr * (hi - lo);
	float b = lo + gr * (hi - lo);
	float fa = kelvin_dist(a, u0, v0);
	float fb = kelvin_dist(b, u0, v0);
	for (int i = 0; i < 40; i++) {
		if (fa < fb) { hi = b; b = a; fb = fa; a = hi - gr * (hi - lo); fa = kelvin_dist(a, u0, v0); }
		else { lo = a; a = b; fa = fb; b = lo + gr * (hi - lo); fb = kelvin_dist(b, u0, v0); }
	}
	return 0.5 * (lo + hi);
}`,
}
