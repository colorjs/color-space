// GLSL chunk: Filmic Pro 6 Log 0-1 <-> linear-light sRGB (lrgb), no published native
// gamut. Mixed sqrt+ln law on encode; decode has no closed-form inverse, so it runs
// the same fixed-iteration Newton solve as filmicpro.js (40 steps from t=0.18,
// floored at t0/2 to keep sqrt/log finite). t0 (curve(t0)=0) is filmicpro.js's own
// bisection result, pre-evaluated to float64 — GLSL can't do a one-time module-load
// bisection, only per-call iteration. Running the full 40 steps unconditionally
// (vs. JS's early exit at |curve(t)-y| < 1e-12) still lands at 1e-13, well under
// the default tolerance, so no tol override is declared.
import lrgb from './lrgb.glsl.js'
export default {
	name: 'filmicpro',
	deps: [lrgb],
	edges: { lrgb: ['lrgb_filmicpro', 'filmicpro_lrgb'] },
	code: /* glsl */ `
float filmicpro_curve_(float t) {
	return 0.371 * (sqrt(t) + 0.28257 * log(t) + 1.69542);
}
float filmicpro_slope_(float t) {
	return 0.371 * (0.5 / sqrt(t) + 0.28257 / t);
}
float filmicpro_enc_(float x) {
	float t = x;
	if (t < 0.002107088071515992) { t = 0.002107088071515992; }
	return filmicpro_curve_(t);
}
float filmicpro_dec_(float y) {
	float t = 0.18;
	for (int i = 0; i < 40; i++) {
		float e = filmicpro_curve_(t) - y;
		t = max(0.001053544035757996, t - e / filmicpro_slope_(t));
	}
	return t;
}
vec3 lrgb_filmicpro(vec3 c) {
	return vec3(filmicpro_enc_(c.x), filmicpro_enc_(c.y), filmicpro_enc_(c.z));
}
vec3 filmicpro_lrgb(vec3 c) {
	return vec3(filmicpro_dec_(c.x), filmicpro_dec_(c.y), filmicpro_dec_(c.z));
}`,
}
