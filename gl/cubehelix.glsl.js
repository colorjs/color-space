// GLSL chunk: cubehelix (fraction 0-1) <-> sRGB 0-255. Dave Green's spiral colormap.
// Mirrors cubehelix.js with its default params (start=0, rotation=0.5, hue=1, gamma=1)
// baked in as consts. The inverse is the nearest point on the helix — a coarse scan
// then golden-section refine, matching cubehelix.js (colours on the helix recover their
// fraction exactly; off-helix colours project onto it). A per-pixel search is heavy,
// so this edge exists for parity/round-trips, not real-time use.
export default {
	name: 'cubehelix',
	dim: 1,
	edges: { rgb: ['rgb_cubehelix', 'cubehelix_rgb'] },
	code: /* glsl */ `
vec3 cubehelix_rgb(float fraction) {
	// defaults baked in: start=0.0, rotation=0.5, hue=1.0, gamma=1.0
	float angle = 6.283185307179586 * (1.0 + 0.5 * fraction);
	float f = fraction;
	float amp = f * (1.0 - f) / 2.0;
	float r = f + amp * (-0.14861 * cos(angle) + 1.78277 * sin(angle));
	float g = f + amp * (-0.29227 * cos(angle) - 0.90649 * sin(angle));
	float b = f + amp * (1.97294 * cos(angle));
	r = min(max(r, 0.0), 1.0);
	g = min(max(g, 0.0), 1.0);
	b = min(max(b, 0.0), 1.0);
	return vec3(r * 255.0, g * 255.0, b * 255.0);
}
float cubehelix_d2_(float f, float tr, float tg, float tb) {
	vec3 c = cubehelix_rgb(f);
	float dr = c.x / 255.0 - tr;
	float dg = c.y / 255.0 - tg;
	float db = c.z / 255.0 - tb;
	return dr * dr + dg * dg + db * db;
}
float rgb_cubehelix(vec3 cin) {
	float tr = cin.x / 255.0; float tg = cin.y / 255.0; float tb = cin.z / 255.0;
	float best = 0.0; float bd = 1.0e20;
	for (int i = 0; i <= 256; i++) {
		float f = float(i) / 256.0;
		float d = cubehelix_d2_(f, tr, tg, tb);
		if (d < bd) { bd = d; best = f; }
	}
	float a = max(0.0, best - 0.00390625); float c = min(1.0, best + 0.00390625);
	float gr = 0.6180339887498949;
	float x1 = c - gr * (c - a); float x2 = a + gr * (c - a);
	float f1 = cubehelix_d2_(x1, tr, tg, tb); float f2 = cubehelix_d2_(x2, tr, tg, tb);
	for (int k = 0; k < 60; k++) {
		if (f1 < f2) { c = x2; x2 = x1; f2 = f1; x1 = c - gr * (c - a); f1 = cubehelix_d2_(x1, tr, tg, tb); }
		else { a = x1; x1 = x2; f1 = f2; x2 = a + gr * (c - a); f2 = cubehelix_d2_(x2, tr, tg, tb); }
	}
	return (a + c) / 2.0;
}`,
}
