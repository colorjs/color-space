// GLSL chunk: S-Log2 (Sony) <-> CIE XYZ D65 0-100, via S-Gamut (same primaries as
// S-Gamut3). Mirrors slog2.js raw/rawInv/enc/dec (155/219 scaling over base S-Log); the
// matrix comes from sgamut3.glsl.js (requires: ['sgamut3']).
import xyz from './xyz.glsl.js'
import sgamut3 from './sgamut3.glsl.js'
export default {
	name: 'slog2',
	deps: [xyz, sgamut3],
	edges: { xyz: ['xyz_slog2', 'slog2_xyz'] },
	requires: ['sgamut3'],
	code: /* glsl */ `
float slog2_log10_(float x) { return log(x) / log(10.0); }
float slog2_raw_(float t) {
	if (t >= 0.0) { return 0.432699 * slog2_log10_(t + 0.037584) + 0.646596; }
	return t * 5.0 + 0.030001222851889303;
}
float slog2_rawinv_(float y) {
	if (y >= 0.030001222851889303) { return pow(10.0, (y - 0.646596) / 0.432699) - 0.037584; }
	return (y - 0.030001222851889303) / 5.0;
}
float slog2_dec_(float cv) { return slog2_rawinv_((cv * 1023.0 - 64.0) / 876.0) * 0.9 * 219.0 / 155.0; }
float slog2_enc_(float x) { return (slog2_raw_((x / 0.9) * 155.0 / 219.0) * 876.0 + 64.0) / 1023.0; }
vec3 slog2_xyz(vec3 c) {
	return sgamut3_xyz(vec3(slog2_dec_(c.x), slog2_dec_(c.y), slog2_dec_(c.z)));
}
vec3 xyz_slog2(vec3 c) {
	vec3 l = xyz_sgamut3(c);
	return vec3(slog2_enc_(l.x), slog2_enc_(l.y), slog2_enc_(l.z));
}`,
}
