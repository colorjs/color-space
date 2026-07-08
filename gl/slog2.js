// GLSL chunk: S-Log2 (Sony) <-> CIE XYZ D65 0-100. S-Gamut primaries (same as S-Gamut3).
// Mirrors slog2.js raw/rawInv/enc/dec (155/219 scaling over base S-Log) + M/MI exactly.
export default {
	name: 'slog2',
	edges: { xyz: ['xyz_slog2', 'slog2_xyz'] },
	code: `
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
	float r = slog2_dec_(c.x); float g = slog2_dec_(c.y); float b = slog2_dec_(c.z);
	return vec3(
		100.0 * (0.7064827132 * r + 0.1288010498 * g + 0.1151721641 * b),
		100.0 * (0.2709796708 * r + 0.7866064112 * g - 0.0575860820 * b),
		100.0 * (-0.0096778454 * r + 0.0046000375 * g + 1.0941355587 * b));
}
vec3 xyz_slog2(vec3 c) {
	float x = c.x / 100.0; float y = c.y / 100.0; float z = c.z / 100.0;
	float r = 1.5073998990431192 * x - 0.24582213740524175 * y - 0.17161168084331915 * z;
	float g = -0.5181517270645519 * x + 1.3553912409400366 * y + 0.12587866812835696 * z;
	float b = 0.01551169817958099 * x - 0.007872771439249991 * y + 0.9119163655330013 * z;
	return vec3(slog2_enc_(r), slog2_enc_(g), slog2_enc_(b));
}`,
}
