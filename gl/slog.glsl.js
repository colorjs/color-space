// GLSL chunk: S-Log (Sony) <-> CIE XYZ D65 0-100, via S-Gamut (same primaries as
// S-Gamut3). Mirrors slog.js raw/rawInv/enc/dec; the matrix comes from sgamut3.glsl.js
// (requires: ['sgamut3']).
import xyz from './xyz.glsl.js'
import sgamut3 from './sgamut3.glsl.js'
export default {
	name: 'slog',
	deps: [xyz, sgamut3],
	edges: { xyz: ['xyz_slog', 'slog_xyz'] },
	requires: ['sgamut3'],
	code: /* glsl */ `
float slog_log10_(float x) { return log(x) / log(10.0); }
float slog_raw_(float t) {
	if (t >= 0.0) { return 0.432699 * slog_log10_(t + 0.037584) + 0.646596; }
	return t * 5.0 + 0.030001222851889303;
}
float slog_rawinv_(float y) {
	if (y >= 0.030001222851889303) { return pow(10.0, (y - 0.646596) / 0.432699) - 0.037584; }
	return (y - 0.030001222851889303) / 5.0;
}
float slog_dec_(float cv) { return slog_rawinv_((cv * 1023.0 - 64.0) / 876.0) * 0.9; }
float slog_enc_(float x) { return (slog_raw_(x / 0.9) * 876.0 + 64.0) / 1023.0; }
vec3 slog_xyz(vec3 c) {
	return sgamut3_xyz(vec3(slog_dec_(c.x), slog_dec_(c.y), slog_dec_(c.z)));
}
vec3 xyz_slog(vec3 c) {
	vec3 l = xyz_sgamut3(c);
	return vec3(slog_enc_(l.x), slog_enc_(l.y), slog_enc_(l.z));
}`,
}
