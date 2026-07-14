/**
 * Shared GLSL helpers — auto-included by the composer when a chunk references
 * them by name. Ordered: a later helper may call an earlier one. Every helper
 * has identical semantics in GLSL, WGSL (see ./wgsl.js) and the JS evaluator
 * (test/gl.js), so chunks never call the builtins whose semantics diverge
 * across languages (two-arg atan, mod, negative-base pow).
 */
export default [
	// one Newton polish after pow: GPU pow (exp2·log2) is loose (~many ulp), and a
	// cube root shared by a forward/inverse pair must agree with itself to f32 ulp —
	// a self-consistently wrong root defeats round-trip guards (OSA-UCS cap folds)
	{ name: 'cbrt_', code: /* glsl */ `float cbrt_(float x) {
	float a = abs(x);
	float y = pow(a, 1.0 / 3.0);
	y = y - (y * y * y - a) / (3.0 * y * y + 1e-30);
	return sign(x) * y;
}` },
	{ name: 'spow_', code: /* glsl */ `float spow_(float x, float p) { return sign(x) * pow(abs(x), p); }` },
	{ name: 'atan2_', code: /* glsl */ `float atan2_(float y, float x) { return atan(y, x); }` },
	{ name: 'mod_', code: /* glsl */ `float mod_(float x, float y) { return x - y * floor(x / y); }` },
	// cartesian opponent pair -> cylindrical [L, C, h°]; mirrors util.js cartToPolar
	{ name: 'polar_fwd', code: /* glsl */ `vec3 polar_fwd(vec3 c) {
	float C = sqrt(c.y * c.y + c.z * c.z);
	if (C < 1e-8) { return vec3(c.x, C, 0.0); }
	float h = atan2_(c.z, c.y) * 57.29577951308232;
	if (h < 0.0) { h = h + 360.0; }
	return vec3(c.x, C, h);
}` },
	{ name: 'polar_inv', code: /* glsl */ `vec3 polar_inv(vec3 c) {
	float h = c.z * 0.017453292519943295;
	return vec3(c.x, c.y * cos(h), c.y * sin(h));
}` },
]
